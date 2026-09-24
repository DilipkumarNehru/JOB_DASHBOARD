import mongoose from 'mongoose';

const JobSourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['api', 'career', 'feed', 'manual'], default: 'api' },
  baseUrl: { type: String, default: '' },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  enabled: { type: Boolean, default: true },
  lastRunAt: { type: Date },
  jobsFound: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'error', 'paused'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('JobSource', JobSourceSchema);