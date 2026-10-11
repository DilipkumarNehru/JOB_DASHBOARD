import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { syncUserApiKeysFromEnv } from '../config/seedUserApiKeys.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://job_dashboard_app:lKcFNoHQBTwnK0wtkOCEM3Vd0e7aGK03@127.0.0.1:27018/job_dashboard?authSource=job_dashboard';
    console.log('[Seed Script] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Seed Script] Connected. Syncing user API keys from .env to database documents...');
    const count = await syncUserApiKeysFromEnv();
    console.log(`[Seed Script] Done! Successfully updated ${count} user(s) with API keys in database.`);
    
    // Verify by inspecting one user
    const sample = await User.findOne({}).select('+apiKeys.openaiApiKeyEncrypted +apiKeys.googleClientSecretEncrypted +apiKeys.n8nWebhookSecretEncrypted');
    if (sample) {
      console.log('\n[Sample User Verification]');
      console.log('User:', sample.name, `<${sample.email}>`);
      console.log('Decrypted API Keys from DB:', sample.getDecryptedApiKeys());
      console.log('Masked API Keys for UI:', sample.getMaskedApiKeys());
    }

    process.exit(0);
  } catch (err) {
    console.error('[Seed Script Error]:', err);
    process.exit(1);
  }
};

run();
