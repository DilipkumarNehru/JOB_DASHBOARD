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

UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, name: this.name, role: this.role || 'user' },
    process.env.JWT_SECRET || 'job_dashboard_jwt_secret_key_secure_2026_super_dev',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

export default mongoose.model('User', UserSchema);
