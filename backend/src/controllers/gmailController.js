import crypto from 'crypto';
import User from '../models/User.js';
import { getGmailAuthUrl, getTokensFromCode, getUserEmail } from '../integrations/gmail/gmailClient.js';
import { syncEmailsForUser, saveUserTokens, readUserTokens } from '../services/gmailService.js';
import { logger } from '../utils/logger.js';

export const getAuthUrl = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      '+apiKeys.openaiApiKeyEncrypted +apiKeys.googleClientSecretEncrypted +apiKeys.n8nWebhookSecretEncrypted'
    );
    const keys = user ? user.getDecryptedApiKeys() : null;
    if (!keys?.googleClientId || !keys?.googleClientSecret) {
      return res.status(503).json({
        success: false,
        message: 'Gmail integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Settings or .env'
      });
    }

    const state = crypto.randomBytes(24).toString('hex');
    user.gmailOAuthState = state;
    await user.save();

    const authUrl = getGmailAuthUrl(state, user);
    res.json({ success: true, authUrl });
  } catch (err) { next(err); }
};

export const handleCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (error) {
      return res.redirect(`${frontendUrl}/integrations?gmail=error&reason=${encodeURIComponent(error)}`);
    }
    if (!code || !state) {
      return res.redirect(`${frontendUrl}/integrations?gmail=error&reason=missing_params`);
    }

    const user = await User.findOne({ gmailOAuthState: state }).select(
      '+gmailTokensEncrypted +apiKeys.openaiApiKeyEncrypted +apiKeys.googleClientSecretEncrypted +apiKeys.n8nWebhookSecretEncrypted'
    );
    if (!user) {
      return res.redirect(`${frontendUrl}/integrations?gmail=error&reason=invalid_state`);
    }

    const tokens = await getTokensFromCode(code, user);

    const client = (await import('../integrations/gmail/gmailClient.js')).createOAuth2Client(user);
    client.setCredentials(tokens);
    let gmailEmail = '';
    try {
      gmailEmail = await getUserEmail(client);
    } catch (err) {
      logger.warn('Could not resolve Google account email: ' + err.message);
    }

    user.gmailOAuthState = '';
    user.gmailConnected = true;
    user.gmailEmail = gmailEmail || user.gmailEmail;
    user.lastGmailSync = null;
    await saveUserTokens(user, tokens);

    logger.info(`Gmail connected for user ${user.email}${gmailEmail ? ` (${gmailEmail})` : ''}`);
    res.redirect(`${frontendUrl}/gmail?gmail=connected`);
  } catch (err) {
    logger.error('Gmail OAuth callback failed: ' + err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/gmail?gmail=error&reason=auth_failed`);
  }
};

export const getGmailStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      '+gmailTokensEncrypted +apiKeys.openaiApiKeyEncrypted +apiKeys.googleClientSecretEncrypted +apiKeys.n8nWebhookSecretEncrypted'
    );
    const connected = Boolean(user.gmailConnected && readUserTokens(user));
    res.json({
      success: true,
      connected,
      gmailEmail: connected ? user.gmailEmail : '',
      lastGmailSync: user.lastGmailSync || null,
    });
  } catch (err) { next(err); }
};

export const syncGmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      '+gmailTokensEncrypted +apiKeys.openaiApiKeyEncrypted +apiKeys.googleClientSecretEncrypted +apiKeys.n8nWebhookSecretEncrypted'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.gmailConnected) {
      return res.status(400).json({
        success: false,
        message: 'Gmail is not connected. Please connect your Gmail account in the Gmail Inbox page first.'
      });
    }

    const { maxResults, maxPages, query } = req.body || {};
    const stats = await syncEmailsForUser(user, {
      maxResults: Math.min(parseInt(maxResults) || 25, 100),
      maxPages: Math.min(parseInt(maxPages) || 1, 5),
      query: String(query || '').trim(),
    });

    user.lastGmailSync = new Date();
    await user.save();

    const parts = [`Synced ${stats.totalFetched} emails`];
    if (stats.newEmails > 0) parts.push(`${stats.newEmails} new`);
    if (stats.updatedEmails > 0) parts.push(`${stats.updatedEmails} updated`);
    if (stats.linked > 0) parts.push(`${stats.linked} auto-linked`);
    if (stats.totalFetched === 0 || (stats.newEmails === 0 && stats.updatedEmails === 0)) parts.push('no changes');

    res.json({
      success: true,
      message: parts.join(', '),
      totalFetched: stats.totalFetched,
      newEmails: stats.newEmails,
      updatedEmails: stats.updatedEmails,
      linked: stats.linked,
      totalInGmail: stats.totalInGmail,
      nextPageToken: stats.nextPageToken,
    });
  } catch (err) {
    if (err && err.code === 'GOOGLE_NOT_CONFIGURED') {
      return res.status(503).json({ success: false, message: 'Google OAuth is not configured. Please set your Google credentials in Settings → API Keys.' });
    }
    if (err && (err.status === 403 || err.status === 401 || err.code === 'GOOGLE_TOKEN_REVOKED')) {
      return res.status(err.status || 401).json({ success: false, message: err.message || 'Gmail connection expired. Please reconnect your Google account.' });
    }
    logger.error('Gmail sync failed: ' + err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to sync Gmail. Check the backend logs for details and verify your connection.',
    });
  }
};


export const disconnectGmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+gmailTokensEncrypted');
    user.gmailConnected = false;
    user.gmailEmail = '';
    user.gmailTokensEncrypted = '';
    user.gmailTokens = {};
    user.gmailOAuthState = '';
    user.lastGmailSync = null;
    await user.save();
    res.json({ success: true, message: 'Gmail disconnected successfully' });
  } catch (err) { next(err); }
};