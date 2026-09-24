import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, index: true },
  category: { type: String, default: 'other' },
  aliases: [{ type: String }],
  jobCount: { type: Number, default: 0 },
  avgMatch: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Skill', SkillSchema);