import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const generateCompletion = async ({ systemPrompt, userPrompt, temperature = 0.3, responseFormat = 'json_object' }) => {
  if (!openai) {
    logger.info('OpenAI API key not configured - using intelligent algorithmic fallback');
    return null;
  }

  try {
    const params = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature
    };

    if (responseFormat === 'json_object') {
      params.response_format = { type: 'json_object' };
    }

    const response = await openai.chat.completions.create(params);
    const content = response.choices[0]?.message?.content;
    
    if (responseFormat === 'json_object') {
      return JSON.parse(content);
    }
    return content;
  } catch (error) {
    logger.error('OpenAI API request failed: ' + error.message);
    return null;
  }
};
