import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

const getKey = () => {
  const secret = process.env.JWT_SECRET || 'job-dashboard-dev-secret';
  return crypto.createHash('sha256').update(secret).digest();
};

const getCandidateKeys = () => {
  const keys = [];
  const primary = process.env.JWT_SECRET || 'job-dashboard-dev-secret';
  keys.push(crypto.createHash('sha256').update(primary).digest());

  const fallbacks = [
    'job_dashboard_jwt_secret_key_secure_2026_super_dev',
    'job-dashboard-dev-secret'
  ];
  for (const fb of fallbacks) {
    if (fb !== primary) {
      keys.push(crypto.createHash('sha256').update(fb).digest());
    }
  }
  return keys;
};

export const encryptSecret = (plaintext) => {
  if (!plaintext) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

export const decryptSecret = (payload) => {
  if (!payload) return '';
  try {
    const [ivB64, tagB64, dataB64] = String(payload).split(':');
    if (!ivB64 || !tagB64 || !dataB64) return '';
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');

    const candidateKeys = getCandidateKeys();
    for (const key of candidateKeys) {
      try {
        const decipher = crypto.createDecipheriv(ALGO, key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
        return decrypted.toString('utf8');
      } catch (err) {
        // Try next fallback candidate key
      }
    }
    return '';
  } catch (err) {
    return '';
  }
};