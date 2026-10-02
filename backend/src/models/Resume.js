import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // User-friendly name for this resume (e.g. "Developer Resume", "Accounts Resume")
  resumeName: { type: String, default: '' },
  // File storage metadata (supports both legacy disk storage and GridFS)
  originalFileName: { type: String, default: '' },
  originalName: { type: String, default: '' },
  fileName: { type: String, default: '' },
  filePath: { type: String, default: '' },
  fileType: { type: String, default: '' },
  mimeType: { type: String, default: 'application/pdf' },
  fileSize: { type: Number, default: 0 },
  fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  rawText: { type: String, default: '' },
  parsedProfile: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: [{ type: String }],
    // Categorized skills
    technicalSkills: [{ type: String }],
    softSkills: [{ type: String }],
    tools: [{ type: String }],
    technologies: [{ type: String }],
    // Domain/profile detected (e.g. "Software Development", "Accounting/Finance", "Sales")
    profile: { type: String, default: '' },
    keywords: [{ type: String }],
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
    seniorityLevel: { type: String, default: '' },   // Junior / Mid / Senior / Lead
    industry: { type: String, default: '' },
  },

  // Versioning / hierarchy
  parentResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
  rootResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
  sourceJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  generationType: { type: String, enum: ['original','edited','job-customized'], default: 'original' },
  versionNumber: { type: Number, default: 1 },
  isPrimary: { type: Boolean, default: false, index: true },
  atsScore: { type: Number, default: null },  // resume quality score (0-100)
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

ResumeSchema.pre('validate', function(next) {
  if (!this.originalFileName && this.originalName) {
    this.originalFileName = this.originalName;
  }
  if (!this.originalName && this.originalFileName) {
    this.originalName = this.originalFileName;
  }
  if (!this.resumeName) {
    this.resumeName = this.originalFileName || this.originalName || 'My Resume';
  }
  if (!this.mimeType && this.fileType) {
    const ext = (this.fileType || '').toLowerCase();
    const map = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      txt: 'text/plain',
      rtf: 'application/rtf'
    };
    this.mimeType = map[ext] || 'application/octet-stream';
  }
  if (!this.fileType && this.mimeType) {
    if (this.mimeType.includes('pdf')) this.fileType = 'pdf';
    else if (this.mimeType.includes('docx') || this.mimeType.includes('wordprocessingml')) this.fileType = 'docx';
    else if (this.mimeType.includes('msword')) this.fileType = 'doc';
    else if (this.mimeType.includes('plain')) this.fileType = 'txt';
    else this.fileType = 'pdf';
  }
  next();
});

export default mongoose.model('Resume', ResumeSchema);
