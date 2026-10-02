import mongoose from 'mongoose';

const AuthLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  action: {
    type: String,
    enum: ['login', 'logout', 'failed_login', 'password_change', 'force_logout', 'heartbeat'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  isLive: {
    type: Boolean,
    default: false,
    index: true,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  browser: {
    type: String,
    default: 'Unknown Browser',
  },
  os: {
    type: String,
    default: 'Unknown OS',
  },
  device: {
    type: String,
    default: 'Desktop',
  },
  loginAt: {
    type: Date,
    default: Date.now,
  },
  logoutAt: {
    type: Date,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  sessionDurationMinutes: {
    type: Number,
    default: 0,
  },
  failureReason: {
    type: String,
    default: '',
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

AuthLogSchema.index({ createdAt: -1 });
AuthLogSchema.index({ isLive: 1, lastActiveAt: -1 });

export default mongoose.model('AuthLog', AuthLogSchema);
