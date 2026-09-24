import Email from '../models/Email.js';
import { logger } from '../utils/logger.js';
import { encryptSecret, decryptSecret } from '../utils/encryptionUtil.js';
import {
  createOAuth2Client, getMessageDetail, listInboxMessages,
  parseGmailMessage, refreshAccessToken
} from '../integrations/gmail/gmailClient.js';
import { classifyEmail } from './emailClassifierService.js';
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
  const client = createOAuth2Client();
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
// Sync pipeline (upsert, duplicate-aware)
// ---------------------------------------------------------------------------

const SYNC_MANAGED_FIELDS = [
  'googleAccountId', 'threadId', 'historyId', 'sender', 'senderEmail',
  'recipient', 'recipients', 'cc', 'bcc', 'subject', 'bodySnippet',
  'bodyFull', 'bodyHtml', 'receivedAt', 'internalDate', 'labels',
  'isRead', 'hasAttachments', 'attachments', 'webViewLink'
];

export const syncEmailsForUser = async (user, { maxResults = 50, maxPages = 2, query = '' } = {}) => {
  const client = await buildAuthedClient(user);

  let totalFetched = 0;
  let newEmails = 0;
  let updatedEmails = 0;
  let linked = 0;
  let pageToken = '';
  let totalInGmail = 0;

  for (let page = 0; page < maxPages; page++) {
    const { messages, nextPageToken, resultSizeEstimate } = await listInboxMessages(client, {
      query: query || '',
      maxResults,
      pageToken,
    });
    if (page === 0) totalInGmail = resultSizeEstimate;

    for (const meta of messages) {
      try {
        const raw = await getMessageDetail(client, meta.id);
        const parsed = parseGmailMessage(raw, user.gmailEmail || '');
        totalFetched++;

        const existing = await Email.findOne({ userId: user._id, gmailMessageId: parsed.gmailMessageId });

        if (existing) {
          let changed = false;
          for (const field of SYNC_MANAGED_FIELDS) {
            const current = field === 'attachments' ? JSON.stringify(existing[field]) : existing[field];
            const incoming = field === 'attachments' ? JSON.stringify(parsed[field]) : parsed[field];
            if (JSON.stringify(current) !== JSON.stringify(incoming)) {
              existing[field] = parsed[field];
              changed = true;
            }
          }
          if (changed) {
            await existing.save();
            updatedEmails++;
          }
          continue;
        }

        const classification = await classifyEmail({
          subject: parsed.subject,
          bodySnippet: parsed.bodySnippet,
          sender: parsed.sender,
        });

        const email = await Email.create({
          userId: user._id,
          ...parsed,
          category: classification.category || 'OTHER',
          aiConfidence: classification.confidence || 0,
          companyName: classification.companyName || '',
          jobRole: classification.jobRole || '',
          classificationReason: classification.classificationReason || '',
          status: classification.confidence >= 0.7 ? 'unlinked' : 'needs_review',
        });
        newEmails++;

        const match = await matchEmailToApplication(email);
        if (match.linked) linked++;
      } catch (err) {
        logger.warn(`Could not process Gmail message ${meta.id}: ${err.message}`);
      }
    }

    pageToken = nextPageToken;
    if (!pageToken) break;
  }

  return { totalFetched, newEmails, updatedEmails, linked, totalInGmail, nextPageToken: pageToken };
};