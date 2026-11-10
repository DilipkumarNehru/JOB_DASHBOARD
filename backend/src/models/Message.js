import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    callInvite: {
      roomId: { type: String },
      callType: { type: String, enum: ['video', 'audio'], default: 'video' },
      status: { type: String, enum: ['pending', 'accepted', 'declined', 'ended'], default: 'pending' },
    },
  },
  { timestamps: true }
);

// Compound index for conversation queries
MessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });
MessageSchema.index({ recipient: 1, read: 1 });

export default mongoose.model('Message', MessageSchema);

