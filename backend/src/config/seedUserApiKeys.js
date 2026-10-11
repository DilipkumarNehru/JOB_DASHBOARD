import User from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Ensures all existing users in the database have their integration API keys
 * and secrets initialized from the environment template into their DB record.
 */
export const syncUserApiKeysFromEnv = async () => {
  try {
    const users = await User.find({}).select(
      '+apiKeys.openaiApiKeyEncrypted +apiKeys.googleClientSecretEncrypted +apiKeys.n8nWebhookSecretEncrypted'
    );
    let count = 0;

    for (const user of users) {
      let changed = false;
      if (!user.apiKeys) user.apiKeys = {};

      const hasOpenAI = Boolean(user.apiKeys.openaiApiKeyEncrypted);
      const hasGoogle = Boolean(user.apiKeys.googleClientId && user.apiKeys.googleClientSecretEncrypted);
      const hasN8n = Boolean(user.apiKeys.n8nWebhookSecretEncrypted);

      const updates = {};

      if (!hasOpenAI && process.env.OPENAI_API_KEY) {
        updates.openaiApiKey = process.env.OPENAI_API_KEY;
        updates.openaiModel = user.apiKeys.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
        changed = true;
      }

      if (!hasGoogle && process.env.GOOGLE_CLIENT_ID) {
        updates.googleClientId = process.env.GOOGLE_CLIENT_ID;
        updates.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
        updates.googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/gmail/callback';
        changed = true;
      }

      if (!hasN8n && (process.env.N8N_BASE_URL || process.env.N8N_WEBHOOK_SECRET)) {
        updates.n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
        updates.n8nWebhookSecret = process.env.N8N_WEBHOOK_SECRET || 'job_dashboard_n8n_secret_token_2026';
        changed = true;
      }

      if (changed) {
        user.setApiKeys(updates);
        await user.save({ validateBeforeSave: false });
        count++;
      }
    }

    if (count > 0) {
      logger.info(`[API Keys] Successfully stored .env API keys & secrets into DB for ${count} users.`);
    }
    return count;
  } catch (err) {
    logger.warn('[API Keys] Migration sync warning: ' + err.message);
    return 0;
  }
};
