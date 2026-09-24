import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job_dashboard',
  jwtSecret: process.env.JWT_SECRET || 'job_dashboard_jwt_secret_key_secure_2026_super_dev',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/gmail/callback',
  n8nBaseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || 'job_dashboard_n8n_secret_token_2026',
};
