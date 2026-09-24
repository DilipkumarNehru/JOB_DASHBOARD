import mongoose from 'mongoose';

const AiAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['job_match', 'email_classification', 'resume_insight', 'career_insight', 'skills_gap'],
    required: true,
    index: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  result: { type: mongoose.Schema.Types.Mixed, default: {} },
  confidence: { type: Number, default: 0 },
  model: { type: String, default: '' },
  inputSummary: { type: String, default: '' }
}, { timestamps: true });

AiAnalysisSchema.index({ userId: 1, type: 1, entityId: 1 }, { unique: true, sparse: true });
export default mongoose.model('AiAnalysis', AiAnalysisSchema);