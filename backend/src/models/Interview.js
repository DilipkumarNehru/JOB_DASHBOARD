import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema({
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
  round: { type: String, default: 'Round 1 - Technical' },
  type: {
    type: String,
    enum: ['Screening', 'Technical Interview', 'Coding Challenge', 'System Design', 'HR Interview', 'Managerial', 'Final Round'],
    default: 'Technical Interview'
  },
  scheduledDate: { type: Date, required: true, index: true },
  durationMinutes: { type: Number, default: 60 },
  interviewerName: { type: String, default: '' },
  interviewerEmail: { type: String, default: '' },
  meetingLink: { type: String, default: '' },
  preparationNotes: { type: String, default: '' },
  feedback: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'],
    default: 'Scheduled'
  }
}, { timestamps: true });

export default mongoose.model('Interview', InterviewSchema);
