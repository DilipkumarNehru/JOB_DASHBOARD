import mongoose from 'mongoose';

export const APPLICATION_STATUSES = [
  'Saved',
  'Applied',
  'Application Viewed',
  'Recruiter Contacted',
  'Shortlisted',
  'Assessment',
  'Interview Scheduled',
  'Technical Interview',
  'HR Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'No Response'
];

const ApplicationSchema = new mongoose.Schema({
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
  company: { type: String, required: true, index: true },
  role: { type: String, required: true, index: true },
  applicationDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: APPLICATION_STATUSES,
    default: 'Applied',
    index: true
  },
  applicationUrl: { type: String, default: '' },
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
  },
  notes: { type: String, default: '' },
  nextFollowUpDate: { type: Date, index: true },
  interviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  emails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email'
  }],
  timeline: [{
    status: { type: String, required: true },
    date: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

export default mongoose.model('Application', ApplicationSchema);
