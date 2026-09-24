import mongoose from 'mongoose';

export const EMAIL_CATEGORIES = [
  'JOB_APPLICATION',
  'INTERVIEW',
  'SHORTLIST',
  'REJECTION',
  'ASSESSMENT',
  'RECRUITER_CONTACT',
  'JOB_OPENING',
  'FOLLOW_UP',
  'OFFER',
  'ONBOARDING',
  'COURSE',
  'CERTIFICATION',
  'PROMOTION',
  'SOCIAL',
  'NEWSLETTER',
  'OTHER'
];

const EmailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  gmailMessageId: { type: String, required: true, index: true },
  googleAccountId: { type: String, default: '', index: true },
  threadId: { type: String, index: true },
  historyId: { type: String, default: '' },
  sender: { type: String, required: true },
  senderEmail: { type: String, index: true },
  recipient: { type: String, default: '' },
  recipients: [{ type: String }],
  cc: [{ type: String }],
  bcc: [{ type: String }],
  subject: { type: String, required: true },
  bodySnippet: { type: String, default: '' },
  bodyFull: { type: String, default: '' },
  bodyHtml: { type: String, default: '' },
  receivedAt: { type: Date, required: true, index: true },
  internalDate: { type: Number },
  labels: [{ type: String }],
  isRead: { type: Boolean, default: true, index: true },
  readStatusChangedAt: { type: Date },
  hasAttachments: { type: Boolean, default: false },
  attachments: [{
    attachmentId: { type: String, default: '' },
    filename: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  }],
  webViewLink: { type: String, default: '' },
  category: {
    type: String,
    enum: EMAIL_CATEGORIES,
    default: 'OTHER',
    index: true
  },
  aiConfidence: { type: Number, default: 0 },
  companyName: { type: String, default: '', index: true },
  jobRole: { type: String, default: '' },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    index: true,
  },
  status: {
    type: String,
    enum: ['linked', 'needs_review', 'unlinked', 'ignored'],
    default: 'unlinked',
    index: true
  },
  classificationReason: { type: String, default: '' }
}, { timestamps: true });

EmailSchema.index({ userId: 1, gmailMessageId: 1 }, { unique: true });

export default mongoose.model('Email', EmailSchema);
