import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, name: this.name },
    process.env.JWT_SECRET || 'job_dashboard_jwt_secret_key_secure_2026_super_dev',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

export default mongoose.model('User', UserSchema);
