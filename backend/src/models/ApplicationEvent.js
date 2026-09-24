import mongoose from 'mongoose';

const ApplicationEventSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['STATUS_CHANGE', 'NOTE_ADDED', 'EMAIL_LINKED', 'INTERVIEW_SCHEDULED', 'FOLLOWUP_SCHEDULED', 'RESUME_UPDATED'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  eventDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('ApplicationEvent', ApplicationEventSchema);
