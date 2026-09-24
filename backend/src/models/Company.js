import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true, index: true },
  website: { type: String, default: '' },
  careerPageUrl: { type: String, default: '' },
  industry: { type: String, default: '' },
  tags: [{ type: String }],
  preferredRoles: [{ type: String }],
  location: { type: String, default: 'Bengaluru / Remote' },
  activeJobsCount: { type: Number, default: 0 },
  lastCheckedAt: { type: Date },
  lastScanned: { type: Date },
  checkFrequencyHours: { type: Number, default: 24 },
  status: {
    type: String,
    enum: ['active', 'paused', 'error'],
    default: 'active'
  },
  notes: { type: String, default: '' },
  careerPortalUsername: { type: String, default: '' },
  careerPortalPasswordEncrypted: { type: String, default: '' },
  portalType: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Company', CompanySchema);
