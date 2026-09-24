import path from 'path';
import Resume from '../models/Resume.js';
import { parseResume } from '../services/resumeParserService.js';
import { customizeResume } from '../services/resumeCustomizationService.js';
import { buildPdfFromProfile, buildPdfFromCustomized } from '../services/resumeVersionService.js';
import Job from '../models/Job.js';

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const { rawText, parsedProfile } = await parseResume(req.file.path, ext);
    await Resume.updateMany({ userId: req.user.id }, { isPrimary: false });
    const resume = await Resume.create({
      userId: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: ext,
      rawText,
      parsedProfile,
      isPrimary: true,
      analyzedAt: new Date(),
    });
    res.status(201).json({ success: true, resume });
  } catch (err) { next(err); }
};

export const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: resumes.length, resumes });
  } catch (err) { next(err); }
};

export const getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, resume });
  } catch (err) { next(err); }
};

export const updateResumeProfile = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { parsedProfile: req.body.parsedProfile },
      { new: true }
    );
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, resume });
  } catch (err) { next(err); }
};

export const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, message: 'Resume deleted' });
  } catch (err) { next(err); }
};

export const analyzeResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (!resume.rawText) return res.status(400).json({ success: false, message: 'No extracted text available to analyze' });

    const { parsedProfile } = await parseResumeFromText(resume.rawText);
    resume.parsedProfile = parsedProfile;
    resume.analyzedAt = new Date();
    await resume.save();
    res.json({ success: true, resume });
  } catch (err) { next(err); }
};

export const customizeResumeForJob = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const { jobId, versionName } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const tailored = await customizeResume(resume.parsedProfile, job);
    const pdfPath = await buildPdfFromCustomized(tailored);

    const { default: ResumeVersion } = await import('../models/ResumeVersion.js');
    const version = await ResumeVersion.create({
      userId: req.user.id,
      originalResumeId: resume._id,
      jobId: job._id,
      targetCompany: job.companyName,
      targetRole: job.jobTitle,
      versionName: versionName || `Customized - ${job.companyName} (${job.jobTitle})`,
      tailoredContent: tailored,
      changesMade: tailored.changesMade || [],
      pdfPath,
    });

    const { default: Notification } = await import('../models/Notification.js');
    await Notification.create({
      userId: req.user.id,
      type: 'RESUME_CUSTOMIZED',
      title: 'Resume customization completed',
      message: `Customized resume for ${job.companyName} (${job.jobTitle}) is ready to review.`,
      link: `/resumes/${resume._id}?version=${version._id}`,
      metadata: { resumeId: resume._id, versionId: version._id, jobId: job._id }
    });

    res.status(201).json({ success: true, version });
  } catch (err) { next(err); }
};

export const downloadResumePdf = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const pdfPath = await buildPdfFromProfile(resume.parsedProfile, resume.parsedProfile.name || 'resume');
    res.download(pdfPath, `${resume.originalName.replace(/\.(pdf|docx|doc)$/i, '')}-formatted.pdf`);
  } catch (err) { next(err); }
};

const parseResumeFromText = async (rawText) => {
  const { generateCompletion } = await import('../integrations/openai/llmClient.js');
  const { ALL_SKILLS } = await import('../utils/skillDictionary.js');

  const aiResult = await generateCompletion({
    systemPrompt: 'You are a resume parser. Extract structured data from the text. Return ONLY valid JSON with fields: name, email, phone, summary, skills[], experienceYears, companies[], jobTitles[], education[], certifications[], projects[], location, preferredRoles[], preferredLocations[]. Do not invent data.', 
    userPrompt: rawText.slice(0, 6000),
    temperature: 0.1,
    responseFormat: 'json_object'
  });

  if (aiResult) return { rawText, parsedProfile: aiResult };

  const lower = rawText.toLowerCase();
  const nameMatch = rawText.split('\n').find(l => l.trim().length > 2 && l.length < 50 && !/@|\d{5,}/.test(l));
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+91[\-\s]?)?[6-9]\d{9}/);
  const skills = ALL_SKILLS.filter(s => lower.includes(s.toLowerCase()));
  const expMatch = rawText.match(/(\d+)\+?\s*(?:year|yr)s?\s*(?:of)?\s*(?:experience|exp)/i);

  return {
    rawText,
    parsedProfile: {
      name: nameMatch?.trim() || 'Unknown',
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0] || '',
      summary: rawText.slice(0, 400),
      skills,
      experienceYears: expMatch ? parseInt(expMatch[1]) : 0,
      companies: [], jobTitles: [], education: [], certifications: [], projects: [],
      location: '', preferredRoles: ['Software Engineer'], preferredLocations: ['Remote']
    }
  };
};
