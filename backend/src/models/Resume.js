import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String, enum: ['pdf', 'docx', 'doc'], default: 'pdf' },
  rawText: { type: String, default: '' },
  parsedProfile: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    companies: [{
      name: String,
      role: String,
      location: String,
      startDate: String,
      endDate: String,
      highlights: [String],
    }],
    jobTitles: [{ type: String }],
    education: [{
      degree: String,
      institution: String,
      year: String,
    }],
    certifications: [{ type: String }],
    projects: [{
      title: String,
      description: String,
      technologies: [String],
      highlights: [String],
    }],
    location: { type: String, default: '' },
    preferredRoles: [{ type: String }],
    preferredLocations: [{ type: String }],
  },
  isPrimary: { type: Boolean, default: true },
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Resume', ResumeSchema);
