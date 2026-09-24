import mongoose from 'mongoose';

const n8nWorkflowSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  description: { type: String, default: '' },
  n8nWorkflowId: { type: String, default: '' },
  webhookUrl: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  lastRunAt: { type: Date },
  lastRunStatus: { type: String, enum: ['success', 'error', 'pending', 'never'], default: 'never' },
  config: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('n8nWorkflow', n8nWorkflowSchema);