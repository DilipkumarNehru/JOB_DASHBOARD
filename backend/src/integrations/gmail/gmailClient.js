import { google } from 'googleapis';
import { logger } from '../../utils/logger.js';

// ---------------------------------------------------------------------------
// OAuth 2.0 client factory
// ---------------------------------------------------------------------------

export const createOAuth2Client = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const err = new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env');
    err.code = 'GOOGLE_NOT_CONFIGURED';
    throw err;
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/gmail/callback'
  );
};

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export const getGmailAuthUrl = (state) => {
  const oAuth2Client = createOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    state: state || undefined,
    include_granted_scopes: false
  });
};

export const getTokensFromCode = async (code) => {
  const oAuth2Client = createOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  if (!tokens || !tokens.access_token) {
    const err = new Error('Google did not return an access token');
    err.code = 'GOOGLE_TOKEN_EXCHANGE_FAILED';
    throw err;
  }
  return tokens;
};

export const getUserEmail = async (client) => {
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();
  return data && data.email ? String(data.email).toLowerCase() : '';
};

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

export const refreshAccessToken = async (client) => {
  const { credentials } = await client.refreshAccessToken();
  logger.info('Gmail access token refreshed');
  return credentials;
};

// ---------------------------------------------------------------------------
// Gmail API: message listing + detail retrieval
// ---------------------------------------------------------------------------

/**
 * List inbox messages with Gmail-style pagination.
 * Returns { messages, nextPageToken, resultSizeEstimate }.
 */
export const listInboxMessages = async (client, { query = '', maxResults = 50, pageToken = '', labelIds = ['INBOX'] } = {}) => {
  const gmail = google.gmail({ version: 'v1', auth: client });
  const params = { userId: 'me', maxResults, labelIds, q: query };
  if (pageToken) params.pageToken = pageToken;
  const { data } = await gmail.users.messages.list(params);
  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken || '',
    resultSizeEstimate: data.resultSizeEstimate || 0,
  };
};

export const getMessageDetail = async (client, messageId) => {
  const gmail = google.gmail({ version: 'v1', auth: client });
  const { data } = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
  return data;
};

// ---------------------------------------------------------------------------
// Header / MIME helpers
// ---------------------------------------------------------------------------

const charsetFromEncoding = (enc) => {
  const encStr = String(enc || '').toLowerCase();
  const aliases = {
    'iso-8859-1': 'latin1',
    'iso-8859-15': 'latin1',
    'cp1252': 'latin1',
    'windows-1252': 'latin1',
    'utf8': 'utf8',
    'utf-8': 'utf8',
    'us-ascii': 'latin1',
    'ascii': 'latin1',
  };
  return aliases[encStr] || encStr || 'utf8';
};

/** Decode RFC 2047 encoded words (=?charset?B|Q?..?=) inside a header value. */
export const decodeHeader = (value) => {
  if (!value) return '';
  const out = [];
  let rest = String(value);
  const pattern = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(rest)) !== null) {
    const [full, charset, encoding, text] = match;
    if (match.index > lastIndex) out.push(rest.slice(lastIndex, match.index));
    const charsetName = charsetFromEncoding(charset);
    try {
      if (encoding.toLowerCase() === 'b') {
        out.push(Buffer.from(text, 'base64').toString(charsetName));
      } else {
        const q = text.replace(/_/g, ' ').replace(/(=[0-9A-Fa-f]{2})+/g, (hex) => {
          try { return Buffer.from(hex.replace(/=/g, ''), 'hex').toString(charsetName); } catch { return hex; }
        });
        out.push(q);
      }
    } catch {
      out.push(full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < rest.length) out.push(rest.slice(lastIndex));
  return out.join('').replace(/\s+/g, ' ').trim();
};

const findHeader = (headers, name) => {
  const lower = name.toLowerCase();
  const header = (headers || []).find((h) => String(h.name || '').toLowerCase() === lower);
  return header ? header.value || '' : '';
};

const parseAddressList = (value) => {
  if (!value) return [];
  const list = [];
  const re = /"?([^"<,;]*)"?\s*(?:<([^>]+)>)?/g;
  let m;
  while ((m = re.exec(value)) !== null) {
    const name = (m[1] || '').trim();
    const email = (m[2] || '').trim().toLowerCase();
    if (name || email) list.push(email || name);
  }
  return list.filter(Boolean);
};

const extractSender = (fromValue) => {
  const match = fromValue.match(/^\s*(?:"?([^"<>]*?)"?\s*)?<([^>]+)>\s*$/);
  if (match) return { sender: (match[1] || match[2])?.trim() || match[2], senderEmail: match[2].trim().toLowerCase() };
  const bare = fromValue.trim();
  if (/^[^@\s]+@[^@\s]+$/.test(bare)) return { sender: bare, senderEmail: bare.toLowerCase() };
  return { sender: bare || 'Unknown Sender', senderEmail: (bare.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/) || [bare])[0].toLowerCase() };
};

const base64UrlDecode = (data) => {
  const normalized = String(data || '').replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
};

const textFromBody = (body) => {
  if (!body || !body.data) return '';
  const buf = base64UrlDecode(body.data);
  // Gmail returns base64url; assume UTF-8 for text payloads.
  return buf.toString('utf8');
};

const walkParts = (part, acc) => {
  if (!part) return acc;
  if (part.parts && part.parts.length) {
    for (const sub of part.parts) walkParts(sub, acc);
    return acc;
  }
  const mimeType = part.mimeType || 'text/plain';
  const body = part.body || {};
  const hasPayload = !!body.data;
  const isAttachment = !!body.attachmentId || !!part.filename;
  if (isAttachment) {
    acc.attachments.push({
      attachmentId: body.attachmentId || '',
      filename: decodeHeader(part.filename) || 'attachment',
      mimeType,
      size: typeof body.size === 'number' ? body.size : 0,
    });
    return acc;
  }
  if (!hasPayload) return acc;
  const text = textFromBody(body);
  if (mimeType === 'text/html') {
    if (!acc.html) acc.html = text;
  } else if (mimeType === 'text/plain') {
    if (!acc.text) acc.text = text;
  } else if (/^text\//.test(mimeType) && !acc.text) {
    acc.text = text;
  } else if (!acc.text && !acc.html) {
    acc.text = text;
  }
  return acc;
};

// ---------------------------------------------------------------------------
// Message → normalized email record
// ---------------------------------------------------------------------------

export const parseGmailMessage = (message, googleAccountId = '') => {
  const headers = message.payload?.headers || [];
  const subject = decodeHeader(findHeader(headers, 'Subject')) || 'No Subject';
  const { sender, senderEmail } = extractSender(decodeHeader(findHeader(headers, 'From')));
  const toRow = decodeHeader(findHeader(headers, 'To'));
  const ccRow = decodeHeader(findHeader(headers, 'Cc'));
  const bccRow = decodeHeader(findHeader(headers, 'Bcc'));
  const recipients = parseAddressList(toRow);
  const cc = parseAddressList(ccRow);
  const bcc = parseAddressList(bccRow);

  const acc = { text: '', html: '', attachments: [] };
  walkParts(message.payload, acc);

  const labels = message.labelIds || [];
  const isRead = !labels.includes('UNREAD');
  const internalDate = Number(message.internalDate);
  const receivedAt = internalDate && !Number.isNaN(internalDate) && internalDate > 0
    ? new Date(internalDate)
    : new Date(findHeader(headers, 'Date') || Date.now());

  // Prefer the first From address as display recipient fallback not needed; keep snippet.
  return {
    gmailMessageId: message.id,
    threadId: message.threadId || '',
    historyId: message.historyId ? String(message.historyId) : '',
    googleAccountId,
    sender,
    senderEmail,
    recipient: recipients[0] || toRow || '',
    recipients,
    cc,
    bcc,
    subject,
    bodySnippet: message.snippet || '',
    bodyFull: (acc.text || '').trim(),
    bodyHtml: (acc.html || '').trim(),
    receivedAt,
    internalDate,
    labels,
    isRead,
    hasAttachments: acc.attachments.length > 0,
    attachments: acc.attachments,
    webViewLink: `https://mail.google.com/mail/u/0/#inbox/${message.id}`,
  };
};