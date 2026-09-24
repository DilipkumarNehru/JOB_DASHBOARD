import mongoose from 'mongoose';

const FollowUpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true
  },
  company: { type: String, required: true },
  role: { type: String, required: true },
  dueDate: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  recruiterName: { type: String, default: '' },
  recruiterEmail: { type: String, default: '' },
  notes: { type: String, default: '' },
  lastCommunication: { type: String, default: '' },
  nextAction: {
    type: String,
    default: 'Send polite status check email regarding submitted application'
  },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('FollowUp', FollowUpSchema);
