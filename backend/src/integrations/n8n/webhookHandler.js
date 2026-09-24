import axios from 'axios';
import { logger } from '../../utils/logger.js';

export const triggerN8nWorkflow = async (workflowName, payload) => {
  const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
  const webhookUrl = `${baseUrl}/webhook/${workflowName}`;

  try {
    logger.info(`Triggering n8n webhook: ${workflowName}`);
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Job-Dashboard-Secret': process.env.N8N_WEBHOOK_SECRET || 'job_dashboard_n8n_secret_token_2026'
      },
      timeout: 5000
    });
    return { success: true, data: response.data };
  } catch (error) {
    // n8n is optional / asynchronous, do not crash backend if n8n service isn't currently booted
    logger.warn(`n8n webhook ${workflowName} not reached (is n8n running on ${baseUrl}?): ${error.message}`);
    return { success: false, error: error.message };
  }
};
