import path from 'path';
import Resume from '../models/Resume.js';
import { parseResume } from '../services/resumeParserService.js';
import { customizeResume } from '../services/resumeCustomizationService.js';
import { buildPdfFromProfile, buildPdfFromCustomized } from '../services/resumeVersionService.js';
import Job from '../models/Job.js';

export const computeAts = (p = {}) => {
  const contactScore = (() => {
    let s = 0;
    if (p.name) s += 5;
    if (p.email) s += 5;
    if (p.phone) s += 5;
    if (p.location) s += 5;
    return s;
  })();
  const skillsCount = (p.skills || []).length;
  const skillsScore = Math.min(20, Math.round((skillsCount / 12) * 20));
  const expYears = p.experienceYears || 0;
  const expScore = Math.min(20, Math.round((expYears / 7) * 20));
  const educationScore = (p.education || []).length > 0 ? 10 : 0;
  const summaryScore = (p.summary || '').length > 60 ? 10 : (p.summary || '').length > 10 ? 5 : 0;
  const certScore = (p.certifications || []).length > 0 ? 10 : 0;
  const projectScore = (p.projects || []).length > 0 ? 10 : 0;

  return contactScore + skillsScore + expScore + educationScore + summaryScore + certScore + projectScore;
};

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    let rawText = '';
    let parsedProfile = {};
    try {
      const parsed = await parseResume(req.file.path, ext);
      rawText = parsed.rawText || '';
      parsedProfile = parsed.parsedProfile || {};
    } catch (parseErr) {
      console.warn('Resume parsing failed, saving file without parsed profile:', parseErr.message);
    }

    const calculatedAts = computeAts(parsedProfile);

    // Mark all existing resumes as non-primary
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
      atsScore: calculatedAts,
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
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    resume.parsedProfile = { ...resume.parsedProfile?.toObject?.() || resume.parsedProfile, ...req.body };
    resume.atsScore = computeAts(resume.parsedProfile);
    resume.analyzedAt = new Date();
    await resume.save();

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

    let rawText = resume.rawText || '';
    let parsedProfile;

    // Re-extract text from the original file on disk (uses the fixed parser)
    try {
      const { parseResume } = await import('../services/resumeParserService.js');
      const { default: fsCheck } = await import('fs');
      if (resume.filePath && fsCheck.existsSync(resume.filePath)) {
        const result = await parseResume(resume.filePath, resume.fileType || 'pdf');
        rawText = result.rawText || rawText;
        parsedProfile = result.parsedProfile;
      }
    } catch (parseErr) {
      console.warn('Re-parse from file failed, trying from stored text:', parseErr.message);
    }

    // Fallback: re-parse from stored raw text if file not available
    if (!parsedProfile) {
      if (!rawText) return res.status(400).json({ success: false, message: 'No text available to re-analyze. Please re-upload the resume.' });
      const result = await parseResumeFromText(rawText);
      parsedProfile = result.parsedProfile;
    }

    resume.rawText = rawText;
    resume.parsedProfile = parsedProfile;
    resume.analyzedAt = new Date();
    resume.atsScore = null; // reset cached ATS score so it gets recalculated
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

export const getAtsScore = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const p = resume.parsedProfile || {};

    // ── Score breakdown (total 100) ───────────────────────────────────────
    const contactScore = (() => {
      let s = 0;
      if (p.name && p.name !== 'Unknown') s += 5;
      if (p.email) s += 5;
      if (p.phone) s += 5;
      if (p.location) s += 5;
      return s; // max 20
    })();

    const skillsCount = (p.skills || []).length;
    const skillsScore = Math.min(20, Math.round((skillsCount / 12) * 20));

    const expYears = p.experienceYears || 0;
    const expScore = Math.min(20, Math.round((expYears / 7) * 20));

    const educationScore = (p.education || []).length > 0 ? 10 : 0;
    const summaryScore = (p.summary || '').length > 60 ? 10 : (p.summary || '').length > 10 ? 5 : 0;
    const certScore = (p.certifications || []).length > 0 ? 10 : 0;
    const projectScore = (p.projects || []).length > 0 ? 10 : 0;

    const total = contactScore + skillsScore + expScore + educationScore + summaryScore + certScore + projectScore;

    const categories = [
      { label: 'Contact Info',     score: contactScore,   max: 20, tip: 'Include name, email, phone & location' },
      { label: 'Skills',           score: skillsScore,    max: 20, tip: 'Add at least 12 relevant technical skills' },
      { label: 'Experience',       score: expScore,       max: 20, tip: 'Highlight years of experience clearly' },
      { label: 'Education',        score: educationScore, max: 10, tip: 'Add degree, institution & graduation year' },
      { label: 'Summary',          score: summaryScore,   max: 10, tip: 'Write a compelling 2-3 sentence professional summary' },
      { label: 'Certifications',   score: certScore,      max: 10, tip: 'Add relevant certifications to stand out' },
      { label: 'Projects',         score: projectScore,   max: 10, tip: 'Showcase 2-3 key projects with tech stack' },
    ];

    // ── AI recommendations ────────────────────────────────────────────────
    const missing = categories.filter(c => c.score < c.max).map(c => c.tip);

    let aiRecommendations = [];
    try {
      const { generateCompletion } = await import('../integrations/openai/llmClient.js');
      const prompt = `You are an expert ATS resume coach. Based on the resume profile below, give exactly 5 concise, actionable recommendations to improve the ATS score. Each recommendation should be 1-2 sentences. Return ONLY a JSON array of strings.

Profile summary:
- Name: ${p.name || 'missing'}
- Skills: ${(p.skills || []).slice(0, 10).join(', ') || 'none'}
- Experience: ${expYears} years
- Education: ${(p.education || []).length} entries
- Summary length: ${(p.summary || '').length} chars
- Certifications: ${(p.certifications || []).length}
- Projects: ${(p.projects || []).length}
- ATS Score: ${total}/100
- Weak areas: ${missing.slice(0, 3).join('; ')}`;

      const result = await generateCompletion({
        systemPrompt: 'You are an ATS resume expert. Return ONLY a valid JSON array of 5 recommendation strings.',
        userPrompt: prompt,
        temperature: 0.4,
        responseFormat: 'json_object'
      });
      // generateCompletion may return an object or array
      if (Array.isArray(result)) aiRecommendations = result;
      else if (result?.recommendations) aiRecommendations = result.recommendations;
      else if (result?.tips) aiRecommendations = result.tips;
      else aiRecommendations = missing.slice(0, 5);
    } catch {
      aiRecommendations = missing.slice(0, 5);
    }

    // Cache the score on the resume document
    await Resume.findByIdAndUpdate(resume._id, { atsScore: total });

    res.json({
      success: true,
      atsScore: total,
      categories,
      aiRecommendations,
      rawText: !!resume.rawText,
    });
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

// Serve the original uploaded file (used by the frontend PDF preview iframe)
export const serveResumeFile = async (req, res, next) => {
  try {
    const { default: fsModule } = await import('fs');
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (!fsModule.existsSync(resume.filePath)) {
      return res.status(404).json({ success: false, message: 'Original file not found on disk' });
    }
    const ext = (resume.fileType || 'pdf').toLowerCase();
    const mimeMap = {
      pdf:  'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc:  'application/msword',
      txt:  'text/plain',
      rtf:  'application/rtf',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${resume.originalName}"`);
    fsModule.createReadStream(resume.filePath).pipe(res);
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
