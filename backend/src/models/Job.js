import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true, index: true },
  companyWebsite: { type: String, default: '' },
  careerPageUrl: { type: String, default: '' },
  jobReqId: { type: String, default: '', index: true },
  jobTitle: { type: String, required: true, trim: true, index: true },
  jobDescription: { type: String, required: true },
  jobUrl: { type: String, required: true },
  location: { type: String, default: 'Remote', index: true },
  remote: { type: Boolean, default: false },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Other'],
    default: 'Full-time'
  },
  experienceRequired: { type: String, default: '2+ years' },
  minExperienceYears: { type: Number, default: 2 },
  maxExperienceYears: { type: Number, default: 5 },
  salary: {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    period: { type: String, default: 'yearly' }
  },
  skills: [{ type: String, index: true }],
  requiredSkills: [{ type: String }],
  preferredSkills: [{ type: String }],
  source: {
    type: String,
    enum: ['Company Career Page', 'Arbeitnow API', 'RemoteOK API', 'Adzuna API', 'LinkedIn Feed', 'Greenhouse', 'Lever', 'Manual Entry'],
    default: 'Manual Entry',
    index: true
  },
  postedDate: { type: Date, default: Date.now },
  applicationDeadline: { type: Date },
  uniqueHash: { type: String, unique: true, index: true },
  status: {
    type: String,
    enum: ['new', 'saved', 'applied', 'rejected', 'archived'],
    default: 'new',
    index: true
  },
  // Default match data for active user session
  matchScore: { type: Number, default: 0, index: true },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  matchBreakdown: {
    skills: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    location: { type: Number, default: 0 },
    role: { type: Number, default: 0 },
    education: { type: Number, default: 0 }
  },
  matchReason: { type: String, default: '' }
}, { timestamps: true });

JobSchema.index({ companyName: 'text', jobTitle: 'text', jobDescription: 'text' });

export default mongoose.model('Job', JobSchema);
