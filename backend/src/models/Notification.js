import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'HIGH_MATCH_JOB',
      'INTERVIEW_UPCOMING',
      'FOLLOW_UP_DUE',
      'RECRUITER_EMAIL',
      'APPLICATION_SHORTLIST',
      'APPLICATION_REJECTED',
      'COMPANY_NEW_JOB',
      'RESUME_CUSTOMIZED',
      'GMAIL_SYNC_COMPLETE'
    ],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
