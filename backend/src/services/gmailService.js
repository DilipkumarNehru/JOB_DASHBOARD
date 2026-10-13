import Email from '../models/Email.js';
import { logger } from '../utils/logger.js';
import { encryptSecret, decryptSecret } from '../utils/encryptionUtil.js';
import {
  createOAuth2Client, getMessageDetail, listInboxMessages,
  parseGmailMessage, refreshAccessToken
} from '../integrations/gmail/gmailClient.js';
import { classifyEmail, algorithmicClassify } from './emailClassifierService.js';
import { matchEmailToApplication } from './emailMatcherService.js';

// ---------------------------------------------------------------------------
// Token helpers (encrypted at rest)
// ---------------------------------------------------------------------------

export const readUserTokens = (user) => {
  if (!user) return null;
  if (user.gmailTokensEncrypted) {
    const decrypted = decryptSecret(user.gmailTokensEncrypted);
    if (decrypted) {
      try {
        const tokens = JSON.parse(decrypted);
        if (tokens && tokens.access_token) return tokens;
      } catch (err) {
        logger.warn('Could not decrypt Gmail tokens (will fall back to legacy format): ' + err.message);
      }
    }
  }
  // Legacy plaintext tokens stored on user.gmailTokens
  if (user.gmailTokens && user.gmailTokens.access_token) {
    return {
      access_token: user.gmailTokens.access_token,
      refresh_token: user.gmailTokens.refresh_token,
      scope: user.gmailTokens.scope,
      token_type: user.gmailTokens.token_type,
      expiry_date: user.gmailTokens.expiry_date,
    };
  }
  return null;
};

export const saveUserTokens = async (user, tokens) => {
  user.gmailTokensEncrypted = encryptSecret(JSON.stringify(tokens));
  user.gmailTokens = {}; // never store plaintext going forward
  await user.save();
};

export const isGmailConnected = (user) => Boolean(user && user.gmailConnected && readUserTokens(user));

// ---------------------------------------------------------------------------
// Authenticated Gmail client (with automatic token refresh)
// ---------------------------------------------------------------------------

export const buildAuthedClient = async (user) => {
  if (!user || !user.gmailConnected) {
    const err = new Error('Gmail account is not connected. Please connect your Google account.');
    err.status = 403;
    throw err;
  }
  const tokens = readUserTokens(user);
  if (!tokens || !tokens.access_token) {
    const err = new Error('Gmail account is not connected. Please connect your Google account.');
    err.status = 403;
    throw err;
  }
  const client = createOAuth2Client(user);
  client.setCredentials(tokens);

  const now = Date.now();
  const expiresAt = tokens.expiry_date ? Number(tokens.expiry_date) : 0;
  if (!expiresAt || (expiresAt - now) < 5 * 60 * 1000) {
    if (!tokens.refresh_token) {
      const err = new Error('Gmail connection expired. Please reconnect your Google account.');
      err.status = 401;
      err.code = 'GOOGLE_TOKEN_REVOKED';
      throw err;
    }
    try {
      const freshTokens = await refreshAccessToken(client);
      const merged = { ...tokens, ...freshTokens };
      await saveUserTokens(user, merged);
      logger.info(`Refreshed Gmail tokens for user ${user.email}`);
    } catch (err) {
      logger.error('Gmail token refresh failed for user ' + user.email + ': ' + err.message);
      const wrapped = new Error('Gmail authorization has been revoked. Please reconnect your Google account.');
      wrapped.status = 401;
      wrapped.code = 'GOOGLE_TOKEN_REVOKED';
      throw wrapped;
    }
  }
  return client;
};

// ---------------------------------------------------------------------------
// Sync pipeline — parallel batch fetching for speed
// ---------------------------------------------------------------------------

const SYNC_MANAGED_FIELDS = [
  'googleAccountId', 'threadId', 'historyId', 'sender', 'senderEmail',
  'recipient', 'recipients', 'cc', 'bcc', 'subject', 'bodySnippet',
  'bodyFull', 'bodyHtml', 'receivedAt', 'internalDate', 'labels',
  'isRead', 'hasAttachments', 'attachments', 'webViewLink'
];

// Concurrently fetch message details in batches to stay within Gmail API rate limits
const CONCURRENCY = 8;

const processMessageBatch = async (client, metaBatch, user, gmailEmail) => {
  const results = await Promise.allSettled(
    metaBatch.map(meta => getMessageDetail(client, meta.id))
  );
  return results
    .map((r, i) => {
      if (r.status === 'rejected') {
        logger.warn(`Could not fetch Gmail message ${metaBatch[i].id}: ${r.reason?.message}`);
        return null;
      }
      try {
        return parseGmailMessage(r.value, gmailEmail || '');
      } catch (err) {
        logger.warn(`Could not parse Gmail message ${metaBatch[i].id}: ${err.message}`);
        return null;
      }
    })
    .filter(Boolean);
};

export const syncEmailsForUser = async (user, {
  maxResults = 50,
  maxPages = 2,
  query = '',
  folder = 'ALL',
  fetchOlder = false,
  syncAll = false
} = {}) => {
  const client = await buildAuthedClient(user);

  let labelIds = null;
  let includeSpamTrash = true;
  const upperFolder = String(folder || 'ALL').toUpperCase();

  if (upperFolder === 'PRIMARY') {
    labelIds = ['CATEGORY_PERSONAL'];
    includeSpamTrash = false;
  } else if (upperFolder === 'PROMOTIONS') {
    labelIds = ['CATEGORY_PROMOTIONS'];
    includeSpamTrash = false;
  } else if (upperFolder === 'SOCIAL') {
    labelIds = ['CATEGORY_SOCIAL'];
    includeSpamTrash = false;
  } else if (upperFolder === 'UPDATES') {
    labelIds = ['CATEGORY_UPDATES'];
    includeSpamTrash = false;
  } else if (upperFolder === 'SPAM') {
    labelIds = ['SPAM'];
    includeSpamTrash = true;
  } else if (upperFolder === 'INBOX') {
    labelIds = ['INBOX'];
    includeSpamTrash = false;
  } else {
    // 'ALL' - Fetch across all folders including Spam and archived emails
    labelIds = null;
    includeSpamTrash = true;
  }

  // If syncAll is requested, use max batch size (100 is max allowed by Gmail API)
  const effectiveMaxResults = syncAll ? 100 : Math.min(parseInt(maxResults) || 50, 100);
  const effectiveMaxPages = syncAll ? Math.min(parseInt(maxPages) || 30, 60) : Math.min(parseInt(maxPages) || 2, 10);

  let totalFetched = 0;
  let newEmails = 0;
  let updatedEmails = 0;
  let linked = 0;
  let pageToken = fetchOlder ? (user.gmailSyncNextPageToken || '') : '';
  let totalInGmail = 0;

  for (let page = 0; page < effectiveMaxPages; page++) {
    const { messages, nextPageToken, resultSizeEstimate } = await listInboxMessages(client, {
      query: query || '',
      maxResults: effectiveMaxResults,
      pageToken,
      labelIds,
      includeSpamTrash,
    });
    if (page === 0) totalInGmail = resultSizeEstimate;

    if (!messages || messages.length === 0) break;

    // ------------------------------------------------------------------
    // Step 1: Fetch all message details in parallel (CONCURRENCY at a time)
    // ------------------------------------------------------------------
    const allParsed = [];
    for (let i = 0; i < messages.length; i += CONCURRENCY) {
      const batch = messages.slice(i, i + CONCURRENCY);
      const parsed = await processMessageBatch(client, batch, user, user.gmailEmail);
      allParsed.push(...parsed);
    }
    totalFetched += allParsed.length;

    // ------------------------------------------------------------------
    // Step 2: Bulk-check which message IDs already exist in the DB
    // ------------------------------------------------------------------
    const incomingIds = allParsed.map(p => p.gmailMessageId);
    const existingEmails = await Email.find({
      userId: user._id,
      gmailMessageId: { $in: incomingIds }
    }).lean();
    const existingMap = new Map(existingEmails.map(e => [e.gmailMessageId, e]));

    // ------------------------------------------------------------------
    // Step 3: Process each parsed message
    // ------------------------------------------------------------------
    const toInsert = [];
    for (const parsed of allParsed) {
      try {
        const existing = existingMap.get(parsed.gmailMessageId);
        if (existing) {
          let changed = false;
          const updates = {};
          for (const field of SYNC_MANAGED_FIELDS) {
            const currentVal = JSON.stringify(existing[field]);
            const incomingVal = JSON.stringify(parsed[field]);
            if (currentVal !== incomingVal) {
              updates[field] = parsed[field];
              changed = true;
            }
          }
          if (changed) {
            await Email.updateOne({ _id: existing._id }, { $set: updates });
            updatedEmails++;
          }
        } else {
          toInsert.push(parsed);
        }
      } catch (err) {
        logger.warn(`Could not process existing message ${parsed.gmailMessageId}: ${err.message}`);
      }
    }

    // Process new emails fast using algorithmic classification (<1ms, no OpenAI rate limit)
    const CLASSIFY_CONCURRENCY = 15;
    for (let c = 0; c < toInsert.length; c += CLASSIFY_CONCURRENCY) {
      const chunk = toInsert.slice(c, c + CLASSIFY_CONCURRENCY);
      await Promise.allSettled(chunk.map(async (parsed) => {
        try {
          const classification = algorithmicClassify({
            subject: parsed.subject,
            bodySnippet: parsed.bodySnippet,
            sender: parsed.sender,
          });

          const email = await Email.create({
            userId: user._id,
            ...parsed,
            category: classification.category || 'OTHER',
            aiConfidence: classification.confidence || 0.8,
            companyName: classification.companyName || '',
            jobRole: classification.jobRole || '',
            classificationReason: classification.classificationReason || 'Pattern match',
            status: (classification.confidence || 0) >= 0.7 ? 'unlinked' : 'needs_review',
          });
          newEmails++;

          // Link to job application if possible (asynchronous background)
          matchEmailToApplication(email).then(match => {
            if (match && match.linked) linked++;
          }).catch(() => {});
        } catch (err) {
          logger.warn(`Could not save Gmail message ${parsed.gmailMessageId}: ${err.message}`);
        }
      }));
    }

    pageToken = nextPageToken;
    if (!pageToken) break;
  }

  // Save the latest nextPageToken for fetching older emails subsequently
  if (user && pageToken !== undefined) {
    user.gmailSyncNextPageToken = pageToken || '';
    user.lastGmailSync = new Date();
    await user.save().catch((err) => logger.warn('Could not save user sync page token: ' + err.message));
  }

  return {
    totalFetched,
    newEmails,
    updatedEmails,
    linked,
    totalInGmail,
    nextPageToken: pageToken || '',
    hasMoreOlder: Boolean(pageToken),
  };
};