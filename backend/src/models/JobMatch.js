import mongoose from 'mongoose';

/**
 * JobMatch stores the ATS match result for a specific (userId, jobId, resumeId) triple.
 * This allows tracking which resumes match which jobs independently.
 */
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
    required: true,
    index: true,
  },
  resumeName: { type: String, default: '' },    // cached for display
  // Overall ATS score (0-100)
  overallMatch: { type: Number, required: true, default: 0, index: true },
  // Score breakdown components (each 0-100 scale before weighting)
  skillsMatch: { type: Number, default: 0 },
  experienceMatch: { type: Number, default: 0 },
  locationMatch: { type: Number, default: 0 },
  roleMatch: { type: Number, default: 0 },
  educationMatch: { type: Number, default: 0 },
  responsibilitiesMatch: { type: Number, default: 0 },
  keywordsMatch: { type: Number, default: 0 },
  toolsMatch: { type: Number, default: 0 },
  // Matched and missing skills
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  // Human-readable explanation
  whyItMatches: { type: String, default: '' },
  isRecommended: { type: Boolean, default: false, index: true },
  // Cache invalidation: re-calculate if resume or job changed after this
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Unique index: one record per (userId, jobId, resumeId)
JobMatchSchema.index({ userId: 1, jobId: 1, resumeId: 1 }, { unique: true });
// For quick primary-resume job lookup
JobMatchSchema.index({ userId: 1, resumeId: 1, overallMatch: -1 });

export default mongoose.model('JobMatch', JobMatchSchema);
