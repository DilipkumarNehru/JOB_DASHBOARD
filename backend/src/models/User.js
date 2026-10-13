import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptSecret, decryptSecret } from '../utils/encryptionUtil.js';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  encryptedPassword: {
    type: String,
    default: '',
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true,
  },
  lastLoginAt: { type: Date },
  lastActiveAt: { type: Date },
  lastLoginIp: { type: String, default: '' },
  phone: { type: String, default: '' },
  title: { type: String, default: 'Backend Engineer' },
  location: { type: String, default: 'Bengaluru, India' },
  preferredRoles: [{ type: String }],
  preferredLocations: [{ type: String }],
  experienceYears: { type: Number, default: 0 },
  gmailConnected: { type: Boolean, default: false },
  gmailEmail: { type: String, default: '' },
  gmailTokens: {
    access_token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    expiry_date: Number,
  },
  gmailTokensEncrypted: { type: String, default: '', select: false },
  gmailOAuthState: { type: String, default: '' },
  lastGmailSync: { type: Date },
  gmailSyncNextPageToken: { type: String, default: '' },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  settings: {
    minMatchScore: { type: Number, default: 70 },
    autoSyncGmail: { type: Boolean, default: false },
    syncFrequencyHours: { type: Number, default: 6 },
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      inAppAlerts: { type: Boolean, default: true },
      highMatchThreshold: { type: Number, default: 85 },
    }
  },
  apiKeys: {
    openaiApiKeyEncrypted: { type: String, default: '', select: false },
    openaiModel: { type: String, default: 'gpt-4o-mini' },
    googleClientId: { type: String, default: '' },
    googleClientSecretEncrypted: { type: String, default: '', select: false },
    googleRedirectUri: { type: String, default: '' },
    n8nBaseUrl: { type: String, default: '' },
    n8nWebhookSecretEncrypted: { type: String, default: '', select: false },
  }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    // If the password is being set to a new plain string (not already a bcrypt hash),
    // encrypt it reversibly with AES-256 so the admin dashboard can decrypt and view it
    if (typeof this.password === 'string' && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.encryptedPassword = encryptSecret(this.password);
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getDecryptedPassword = function () {
  if (!this.encryptedPassword) return null;
  return decryptSecret(this.encryptedPassword) || null;
};

UserSchema.methods.setApiKeys = function (payload = {}) {
  if (!this.apiKeys) {
    this.apiKeys = {};
  }
  if (payload.openaiApiKey !== undefined) {
    const val = String(payload.openaiApiKey || '').trim();
    this.apiKeys.openaiApiKeyEncrypted = val ? encryptSecret(val) : '';
  }
  if (payload.openaiModel !== undefined) {
    this.apiKeys.openaiModel = String(payload.openaiModel || 'gpt-4o-mini').trim();
  }
  if (payload.googleClientId !== undefined) {
    this.apiKeys.googleClientId = String(payload.googleClientId || '').trim();
  }
  if (payload.googleClientSecret !== undefined) {
    const val = String(payload.googleClientSecret || '').trim();
    this.apiKeys.googleClientSecretEncrypted = val ? encryptSecret(val) : '';
  }
  if (payload.googleRedirectUri !== undefined) {
    this.apiKeys.googleRedirectUri = String(payload.googleRedirectUri || '').trim();
  }
  if (payload.n8nBaseUrl !== undefined) {
    this.apiKeys.n8nBaseUrl = String(payload.n8nBaseUrl || '').trim();
  }
  if (payload.n8nWebhookSecret !== undefined) {
    const val = String(payload.n8nWebhookSecret || '').trim();
    this.apiKeys.n8nWebhookSecretEncrypted = val ? encryptSecret(val) : '';
  }
};

const resolveRedirectUri = (storedUri) => {
  const envUri = process.env.GOOGLE_REDIRECT_URI;
  if (envUri && (!storedUri || storedUri === 'http://localhost:5000/api/gmail/callback')) {
    return envUri;
  }
  return storedUri || envUri || 'http://localhost:5000/api/gmail/callback';
};

UserSchema.methods.getDecryptedApiKeys = function () {
  const encOpenAi = this.apiKeys?.openaiApiKeyEncrypted ? decryptSecret(this.apiKeys.openaiApiKeyEncrypted) : '';
  const encGoogleSecret = this.apiKeys?.googleClientSecretEncrypted ? decryptSecret(this.apiKeys.googleClientSecretEncrypted) : '';
  const encN8nSecret = this.apiKeys?.n8nWebhookSecretEncrypted ? decryptSecret(this.apiKeys.n8nWebhookSecretEncrypted) : '';

  return {
    openaiApiKey: encOpenAi || process.env.OPENAI_API_KEY || '',
    openaiModel: this.apiKeys?.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    googleClientId: this.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: encGoogleSecret || process.env.GOOGLE_CLIENT_SECRET || '',
    googleRedirectUri: resolveRedirectUri(this.apiKeys?.googleRedirectUri),
    n8nBaseUrl: this.apiKeys?.n8nBaseUrl || process.env.N8N_BASE_URL || 'http://localhost:5678',
    n8nWebhookSecret: encN8nSecret || process.env.N8N_WEBHOOK_SECRET || 'job_dashboard_n8n_secret_token_2026',
    hasCustomOpenAI: Boolean(encOpenAi),
    hasCustomGoogle: Boolean(this.apiKeys?.googleClientId && encGoogleSecret),
    hasCustomN8n: Boolean(this.apiKeys?.n8nBaseUrl || encN8nSecret),
    source: encOpenAi || this.apiKeys?.googleClientId ? 'database' : 'env_fallback',
  };
};

UserSchema.methods.getMaskedApiKeys = function () {
  const encOpenAi = this.apiKeys?.openaiApiKeyEncrypted ? decryptSecret(this.apiKeys.openaiApiKeyEncrypted) : '';
  const encGoogleSecret = this.apiKeys?.googleClientSecretEncrypted ? decryptSecret(this.apiKeys.googleClientSecretEncrypted) : '';
  const encN8nSecret = this.apiKeys?.n8nWebhookSecretEncrypted ? decryptSecret(this.apiKeys.n8nWebhookSecretEncrypted) : '';

  const mask = (str) => {
    if (!str) return '';
    if (str.length <= 8) return '••••••••';
    return `${str.substring(0, 4)}••••••••${str.substring(str.length - 4)}`;
  };

  return {
    openaiApiKey: encOpenAi || process.env.OPENAI_API_KEY || '',
    openaiApiKeyMasked: mask(encOpenAi || process.env.OPENAI_API_KEY || ''),
    hasOpenaiApiKey: Boolean(encOpenAi || process.env.OPENAI_API_KEY),
    openaiModel: this.apiKeys?.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini',

    googleClientId: this.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: encGoogleSecret || process.env.GOOGLE_CLIENT_SECRET || '',
    googleClientSecretMasked: mask(encGoogleSecret || process.env.GOOGLE_CLIENT_SECRET || ''),
    hasGoogleClientSecret: Boolean(encGoogleSecret || process.env.GOOGLE_CLIENT_SECRET),
    googleRedirectUri: resolveRedirectUri(this.apiKeys?.googleRedirectUri),

    n8nBaseUrl: this.apiKeys?.n8nBaseUrl || process.env.N8N_BASE_URL || 'http://localhost:5678',
    n8nWebhookSecret: encN8nSecret || process.env.N8N_WEBHOOK_SECRET || 'job_dashboard_n8n_secret_token_2026',
    n8nWebhookSecretMasked: mask(encN8nSecret || process.env.N8N_WEBHOOK_SECRET || ''),
    hasN8nWebhookSecret: Boolean(encN8nSecret || process.env.N8N_WEBHOOK_SECRET),

    isConfiguredInDb: Boolean(this.apiKeys?.openaiApiKeyEncrypted || this.apiKeys?.googleClientId),
  };
};

UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, name: this.name, role: this.role || 'user' },
    process.env.JWT_SECRET || 'job_dashboard_jwt_secret_key_secure_2026_super_dev',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

export const getUserApiKeys = async (userOrId) => {
  if (!userOrId) {
    return {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      googleRedirectUri: resolveRedirectUri(''),
      n8nBaseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
      n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || 'job_dashboard_n8n_secret_token_2026',
      source: 'env_fallback'
    };
  }

  const User = mongoose.model('User');
  let user = userOrId;
  const isDoc = typeof user === 'object' && user !== null && user._id;
  const needsSelect = !isDoc || !user.apiKeys || user.apiKeys.openaiApiKeyEncrypted === undefined;

  if (needsSelect) {
    const id = isDoc ? user._id : user;
    const found = await User.findById(id).select('+apiKeys.openaiApiKeyEncrypted +apiKeys.googleClientSecretEncrypted +apiKeys.n8nWebhookSecretEncrypted');
    if (found) user = found;
  }

  if (user && typeof user.getDecryptedApiKeys === 'function') {
    return user.getDecryptedApiKeys();
  }

  return {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleRedirectUri: resolveRedirectUri(''),
    n8nBaseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || 'job_dashboard_n8n_secret_token_2026',
    source: 'env_fallback'
  };
};

export default mongoose.model('User', UserSchema);
