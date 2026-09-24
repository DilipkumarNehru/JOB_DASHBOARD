import mongoose from 'mongoose';

const CareerPageSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  url: { type: String, required: true },
  lastCheckedAt: { type: Date },
  status: { type: String, enum: ['success', 'pending', 'error'], default: 'pending' },
  discoveredJobsCount: { type: Number, default: 0 },
  errorLogs: [String]
}, { timestamps: true });

export default mongoose.model('CareerPage', CareerPageSchema);
