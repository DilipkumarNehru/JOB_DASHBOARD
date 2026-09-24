import mongoose from 'mongoose';

const JobMatchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
  },
  overallMatch: { type: Number, required: true, default: 0 },
  skillsMatch: { type: Number, default: 0 },
  experienceMatch: { type: Number, default: 0 },
  locationMatch: { type: Number, default: 0 },
  roleMatch: { type: Number, default: 0 },
  educationMatch: { type: Number, default: 0 },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  whyItMatches: { type: String, default: '' },
  isRecommended: { type: Boolean, default: false }
}, { timestamps: true });

JobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export default mongoose.model('JobMatch', JobMatchSchema);
