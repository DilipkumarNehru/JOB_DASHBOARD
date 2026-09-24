import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../models/User.js';
import Resume from '../models/Resume.js';
import { parseResume } from '../services/resumeParserService.js';

const importResume = async () => {
  const pdfPath = process.argv[2];
  const email = process.argv[3] || 'demo@jobdashboard.local';
  if (!pdfPath) {
    console.error('Usage: node src/scripts/importResume.js <path-to.pdf> [userEmail]');
    process.exit(1);
  }
  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job_dashboard';
  await mongoose.connect(uri);
  console.log(`[Import] Connected to ${uri}`);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.findOne({}).sort({ createdAt: 1 });
    console.warn(`[Import] User ${email} not found; falling back to ${user?.email}`);
  }
  if (!user) throw new Error('No user found in database');

  const ext = path.extname(pdfPath).toLowerCase().replace('.', '');
  const { rawText, parsedProfile } = await parseResume(pdfPath, ext);
  console.log(`[Import] Parsed resume. Name: ${parsedProfile?.name || 'Unknown'}, email: ${parsedProfile?.email || 'n/a'}, skills: ${(parsedProfile?.skills || []).length}, experienceYears: ${parsedProfile?.experienceYears ?? 0}`);

  const uploadsDir = path.resolve(__dirname, '../../uploads/resumes');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const fileName = `imported-${Date.now()}.${ext}`;
  const dest = path.join(uploadsDir, fileName);
  fs.copyFileSync(pdfPath, dest);

  await Resume.updateMany({ userId: user._id }, { isPrimary: false });
  const resume = await Resume.create({
    userId: user._id,
    fileName,
    originalName: path.basename(pdfPath),
    filePath: path.resolve(dest),
    fileSize: fs.statSync(dest).size,
    fileType: ext,
    rawText,
    parsedProfile,
    isPrimary: true,
    analyzedAt: new Date()
  });
  console.log(`[Import] Resume saved as primary for ${user.email} -> ${resume._id}`);
  process.exit(0);
};

importResume().catch((err) => { console.error('[Import] Failed:', err); process.exit(1); });