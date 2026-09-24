import mongoose from 'mongoose';

const ResumeVersionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  originalResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    index: true,
  },
  targetCompany: { type: String, required: true },
  targetRole: { type: String, required: true },
  versionName: { type: String, required: true },
  tailoredContent: {
    summary: { type: String, required: true },
    reorderedSkills: [{ type: String }],
    tailoredHighlights: [{
      company: String,
      role: String,
      bullets: [String],
    }],
    tailoredProjects: [{
      title: String,
      highlights: [String],
      technologies: [String],
    }],
  },
  changesMade: [{ type: String }],
  pdfPath: { type: String, default: '' },
  docxPath: { type: String, default: '' },
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('ResumeVersion', ResumeVersionSchema);
