import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';
import { getUserApiKeys } from '../../models/User.js';

// Cache OpenAI instances by API key to avoid re-instantiating on every request
const clientCache = new Map();

export const getOpenAIClient = (apiKey) => {
  if (!apiKey) return null;
  if (!clientCache.has(apiKey)) {
    clientCache.set(apiKey, new OpenAI({ apiKey }));
  }
  return clientCache.get(apiKey);
};

export const generateCompletion = async ({
  user = null,
  apiKey = '',
  model = '',
  systemPrompt,
  userPrompt,
  temperature = 0.3,
  responseFormat = 'json_object'
}) => {
  let effectiveApiKey = apiKey;
  let effectiveModel = model;

  // 1. Try to load API key & model from database for the specified user
  if (user) {
    try {
      const keys = await getUserApiKeys(user);
      if (keys) {
        if (!effectiveApiKey && keys.openaiApiKey) {
          effectiveApiKey = keys.openaiApiKey;
        }
        if (!effectiveModel && keys.openaiModel) {
          effectiveModel = keys.openaiModel;
        }
      }
    } catch (err) {
      logger.warn('[OpenAI] Failed to fetch user API keys from database: ' + err.message);
    }
  }

  // 2. Fall back to process.env if still not provided
  effectiveApiKey = effectiveApiKey || process.env.OPENAI_API_KEY;
  effectiveModel = effectiveModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!effectiveApiKey) {
    logger.info('[OpenAI] No OpenAI API key configured in DB or .env - using algorithmic fallback');
    return null;
  }

  const client = getOpenAIClient(effectiveApiKey);
  if (!client) {
    return null;
  }

  try {
    const params = {
      model: effectiveModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature
    };

    if (responseFormat === 'json_object') {
      params.response_format = { type: 'json_object' };
    }

    const response = await client.chat.completions.create(params, { timeout: 8000, maxRetries: 1 });
    const content = response.choices[0]?.message?.content;

    if (responseFormat === 'json_object') {
      return JSON.parse(content);
    }
    return content;
  } catch (error) {
    logger.error(`[OpenAI] API request failed (model: ${effectiveModel}): ${error.message}`);
    return null;
  }
};
