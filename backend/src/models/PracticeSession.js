import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['technical', 'coding', 'system_design', 'behavioral', 'skill_gap'],
    default: 'technical',
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  targetSkill: { type: String, default: 'General' },
  question: { type: String, required: true },
  modelAnswer: { type: String, required: true },
  keyPoints: [{ type: String }],
  followUps: [{ type: String }],
  // Step-by-step hints explaining intuition and why each step is chosen
  hints: [{
    stepNumber: { type: Number },
    stepTitle: { type: String },
    content: { type: String },
    whyThisStep: { type: String },
    codeSnippet: { type: String, default: '' },
  }],
  // Coding specific fields
  starterCode: { type: mongoose.Schema.Types.Mixed, default: {} },
  solutionCode: { type: String, default: '' },
  testCases: [{
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    description: { type: String, default: '' },
  }],
  // User practice state
  userStatus: {
    type: String,
    enum: ['unattempted', 'practicing', 'mastered'],
    default: 'unattempted',
  },
  userNotes: { type: String, default: '' },
  lastAttemptedAt: { type: Date },
}, { _id: false });

const PracticeSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
    index: true,
  },
  companyName: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  resumeName: { type: String, default: '' },
  matchScore: { type: Number, default: 0 },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  questions: [QuestionSchema],
  readinessScore: { type: Number, default: 0 },
  lastGeneratedAt: { type: Date, default: Date.now },
}, { timestamps: true });

PracticeSessionSchema.index({ userId: 1, jobId: 1, resumeId: 1 }, { unique: true });

export default mongoose.model('PracticeSession', PracticeSessionSchema);
