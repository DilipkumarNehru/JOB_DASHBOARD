import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import mammoth from 'mammoth';
import Resume from '../models/Resume.js';
import JobMatch from '../models/JobMatch.js';
import { parseResume } from '../services/resumeParserService.js';
import { customizeResume } from '../services/resumeCustomizationService.js';
import { buildPdfFromProfile, buildPdfFromCustomized, buildDocxFromProfile } from '../services/resumeVersionService.js';
import { detectResumeDomain } from '../services/matchingEngineService.js';
import Job from '../models/Job.js';
import { storeFile } from '../services/gridFsService.js';

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

    // Detect domain/profile from parsed content
    const detectedProfile = detectResumeDomain(parsedProfile);
    parsedProfile.profile = parsedProfile.profile || detectedProfile;

    const calculatedAts = computeAts(parsedProfile);

    // Check if this is the user's first resume → set as primary
    const existingCount = await Resume.countDocuments({ userId: req.user.id });
    const shouldBePrimary = existingCount === 0;

    // Generate a resume name from the original file name or parsed name
    const baseName = req.file.originalname.replace(/\.(pdf|docx|doc|txt|rtf)$/i, '');
    const resumeName = req.body.resumeName || baseName || (parsedProfile.name ? `${parsedProfile.name}'s Resume` : 'My Resume');

    // If this should be primary, un-primary any existing ones first
    if (shouldBePrimary) {
      await Resume.updateMany({ userId: req.user.id }, { isPrimary: false });
    }
    let fileId = null;
    try {
      fileId = await storeFile(req.file.path, req.file.originalname, req.file.mimetype, req.user.id);
    } catch (storeErr) {
      console.warn('GridFS storeFile failed, saving with disk storage fallback:', storeErr.message);
    }

    const resume = await Resume.create({
      userId: req.user.id,
      resumeName,
      originalFileName: req.file.originalname,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileType: ext,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileId,
      rawText,
      parsedProfile,
      isPrimary: shouldBePrimary,
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

export const getPrimaryResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id, isPrimary: true });
    if (!resume) return res.status(404).json({ success: false, message: 'No primary resume found' });
    res.json({ success: true, resume });
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

/**
 * Set a resume as primary. Only one resume can be primary at a time.
 * When changed, the previous primary is automatically demoted.
 * The caller can optionally trigger job re-matching (expensive).
 */
export const setPrimaryResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    // Atomically: demote all → promote selected
    await Resume.updateMany({ userId: req.user.id }, { isPrimary: false });
    resume.isPrimary = true;
    await resume.save();

    // Auto-calculate matches if none exist yet for this resume
    const matchCount = await JobMatch.countDocuments({ userId: req.user.id, resumeId: resume._id });
    if (matchCount === 0) {
      const existingJobs = await Job.find({}).limit(50).lean();
      if (existingJobs.length > 0) {
        const { calculateMatch } = await import('../services/matchingEngineService.js');
        const resumeName = resume.resumeName || resume.originalFileName || resume.originalName || 'My Resume';
        for (const j of existingJobs) {
          try {
            const matchData = await calculateMatch(resume, j);
            await JobMatch.findOneAndUpdate(
              { userId: req.user.id, jobId: j._id, resumeId: resume._id },
              { ...matchData, resumeId: resume._id, resumeName, calculatedAt: new Date() },
              { upsert: true, new: true }
            );
          } catch (_) {}
        }
      }
    }

    res.json({
      success: true,
      message: `"${resume.resumeName || resume.originalFileName || resume.originalName}" is now your primary resume.`,
      resume
    });
  } catch (err) { next(err); }
};

/**
 * Update resume name
 */
export const updateResumeName = async (req, res, next) => {
  try {
    const { resumeName } = req.body;
    if (!resumeName) return res.status(400).json({ success: false, message: 'resumeName is required' });

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { resumeName },
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

    // If we deleted the primary, promote the most recent one
    if (resume.isPrimary) {
      const next = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
      if (next) {
        next.isPrimary = true;
        await next.save();
      }
    }

    // Clean up JobMatch records for this resume
    const { default: JobMatch } = await import('../models/JobMatch.js');
    await JobMatch.deleteMany({ userId: req.user.id, resumeId: resume._id });

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

    // Detect/update domain profile
    const detectedProfile = detectResumeDomain(parsedProfile);
    parsedProfile.profile = parsedProfile.profile || detectedProfile;

    resume.rawText = rawText;
    resume.parsedProfile = parsedProfile;
    resume.analyzedAt = new Date();
    resume.atsScore = computeAts(parsedProfile);
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
    const result = await buildPdfFromProfile(resume.parsedProfile || {}, resume.parsedProfile?.name || 'resume', resume.rawText || '');
    const pdfPath = result.filePath || result;
    const baseName = (resume.originalFileName || resume.resumeName || 'resume').replace(/\.(pdf|docx|doc)$/i, '');
    res.download(pdfPath, `${baseName}-formatted.pdf`);
  } catch (err) { next(err); }
};

export const downloadResumeDocx = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const baseName = (resume.resumeName || resume.originalFileName || resume.originalName || 'resume').replace(/\.(pdf|docx|doc|txt|rtf)$/i, '');
    const { filePath } = await buildDocxFromProfile(resume.parsedProfile || {}, resume.rawText || '', baseName);
    res.download(filePath, `${baseName}.docx`);
  } catch (err) { next(err); }
};

/**
 * Universal Resume Converter & In-App Editor
 * Converts any resume to PDF or Word (.docx), with options to overwrite or save as a new resume.
 */
export const convertAndSaveResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      format = 'docx', // 'docx' | 'pdf'
      saveAsNew = false,
      resumeName,
      newResumeName,
      parsedProfile,
      rawText,
      name,
      email,
      phone,
      location,
      summary,
      skills,
      experienceYears,
      companies,
      education,
      projects,
      certifications,
    } = req.body;

    const sourceResume = await Resume.findOne({ _id: id, userId: req.user.id });
    if (!sourceResume) return res.status(404).json({ success: false, message: 'Resume not found' });

    // Merged profile
    const finalProfile = {
      ...(sourceResume.parsedProfile?.toObject?.() || sourceResume.parsedProfile || {}),
      ...(parsedProfile || {}),
    };
    if (name !== undefined) finalProfile.name = name.trim();
    if (email !== undefined) finalProfile.email = email.trim();
    if (phone !== undefined) finalProfile.phone = phone.trim();
    if (location !== undefined) finalProfile.location = location.trim();
    if (summary !== undefined) finalProfile.summary = summary.trim();
    if (skills !== undefined) {
      finalProfile.skills = Array.isArray(skills)
        ? skills
        : skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (experienceYears !== undefined) finalProfile.experienceYears = Number(experienceYears) || 0;
    if (companies !== undefined) finalProfile.companies = companies;
    if (education !== undefined) finalProfile.education = education;
    if (projects !== undefined) finalProfile.projects = projects;
    if (certifications !== undefined) finalProfile.certifications = certifications;

    const detectedDomain = detectResumeDomain(finalProfile);
    finalProfile.profile = finalProfile.profile || detectedDomain;
    const atsScore = computeAts(finalProfile);
    const finalRawText = rawText !== undefined ? rawText : (sourceResume.rawText || '');

    // Target format and extensions
    const isPdf = (format || 'docx').toLowerCase() === 'pdf';
    const targetExt = isPdf ? 'pdf' : 'docx';
    const targetMime = isPdf
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    let requestedName = (newResumeName || resumeName || '').trim();
    if (!requestedName) {
      const base = (sourceResume.resumeName || sourceResume.originalFileName || sourceResume.originalName || 'Resume').replace(/\.[^/.]+$/, '');
      requestedName = saveAsNew ? `${base}_${targetExt.toUpperCase()}` : base;
    }
    requestedName = requestedName.replace(/\.[^/.]+$/, '');
    const finalFileName = `${requestedName}.${targetExt}`;
    const displayResumeName = requestedName;

    let generatedFilePath = '';
    let generatedBuffer = null;

    if (isPdf) {
      const { buildPdfFromProfile } = await import('../services/resumeVersionService.js');
      const result = await buildPdfFromProfile(finalProfile, requestedName, finalRawText);
      generatedFilePath = result.filePath || result;
      generatedBuffer = result.buffer || (fs.existsSync(generatedFilePath) ? fs.readFileSync(generatedFilePath) : null);
    } else {
      const { buildDocxFromProfile } = await import('../services/resumeVersionService.js');
      const result = await buildDocxFromProfile(finalProfile, finalRawText, requestedName);
      generatedFilePath = result.filePath;
      generatedBuffer = result.buffer;
    }

    // Store in GridFS if possible
    let fileId = null;
    try {
      fileId = await storeFile(generatedFilePath, finalFileName, targetMime, req.user.id);
    } catch (storeErr) {
      console.warn('GridFS storeFile warning:', storeErr.message);
    }

    let targetResumeDoc;
    if (saveAsNew) {
      targetResumeDoc = await Resume.create({
        userId: req.user.id,
        resumeName: displayResumeName,
        originalFileName: finalFileName,
        originalName: finalFileName,
        fileName: path.basename(generatedFilePath),
        filePath: generatedFilePath,
        fileType: targetExt,
        mimeType: targetMime,
        fileSize: generatedBuffer?.length || 0,
        fileId,
        rawText: finalRawText,
        parsedProfile: finalProfile,
        isPrimary: false,
        atsScore,
        analyzedAt: new Date(),
      });

      // Compute matches for new resume against existing jobs
      const existingJobs = await Job.find({}).limit(50).lean();
      if (existingJobs.length > 0) {
        const { calculateMatch } = await import('../services/matchingEngineService.js');
        for (const j of existingJobs) {
          try {
            const matchData = await calculateMatch(targetResumeDoc, j);
            await JobMatch.create({
              userId: req.user.id,
              jobId: j._id,
              resumeId: targetResumeDoc._id,
              resumeName: displayResumeName,
              ...matchData,
              calculatedAt: new Date(),
            });
          } catch (_) {}
        }
      }
    } else {
      sourceResume.resumeName = displayResumeName;
      sourceResume.originalFileName = finalFileName;
      sourceResume.originalName = finalFileName;
      sourceResume.fileType = targetExt;
      sourceResume.mimeType = targetMime;
      sourceResume.filePath = generatedFilePath;
      if (fileId) sourceResume.fileId = fileId;
      sourceResume.fileSize = generatedBuffer?.length || sourceResume.fileSize;
      sourceResume.rawText = finalRawText;
      sourceResume.parsedProfile = finalProfile;
      sourceResume.atsScore = atsScore;
      sourceResume.analyzedAt = new Date();
      await sourceResume.save();
      targetResumeDoc = sourceResume;

      // Recalculate matches for updated resume
      const existingJobs = await Job.find({}).limit(50).lean();
      if (existingJobs.length > 0) {
        const { calculateMatch } = await import('../services/matchingEngineService.js');
        for (const j of existingJobs) {
          try {
            const matchData = await calculateMatch(sourceResume, j);
            await JobMatch.findOneAndUpdate(
              { userId: req.user.id, jobId: j._id, resumeId: sourceResume._id },
              { ...matchData, resumeName: displayResumeName, calculatedAt: new Date() },
              { upsert: true }
            );
          } catch (_) {}
        }
      }
    }

    res.json({
      success: true,
      message: saveAsNew
        ? `Successfully saved as new ${targetExt.toUpperCase()} resume: "${finalFileName}"`
        : `Successfully updated resume and converted to ${targetExt.toUpperCase()}: "${finalFileName}"`,
      resume: targetResumeDoc,
      isNew: saveAsNew,
      format: targetExt,
      downloadUrl: isPdf
        ? `/api/resumes/${targetResumeDoc._id}/download.pdf`
        : `/api/resumes/${targetResumeDoc._id}/download.docx`,
    });
  } catch (err) { next(err); }
};

export const convertAndSaveDocx = async (req, res, next) => {
  req.body.format = 'docx';
  return convertAndSaveResume(req, res, next);
};

export const convertAndSavePdf = async (req, res, next) => {
  req.body.format = 'pdf';
  return convertAndSaveResume(req, res, next);
};

/**
 * Preview any resume as formatted HTML (using Mammoth for DOCX with full styled fallback)
 */
export const previewResumeHtml = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    let html = '';
    const ext = (resume.fileType || resume.originalFileName?.split('.').pop() || '').toLowerCase();

    // 1. Try mammoth if docx file exists
    if (ext === 'docx' || resume.mimeType?.includes('wordprocessingml')) {
      try {
        if (resume.filePath && fs.existsSync(resume.filePath)) {
          const mammothResult = await mammoth.convertToHtml({ path: resume.filePath });
          if (mammothResult && mammothResult.value) {
            html = mammothResult.value;
          }
        }
      } catch (mErr) {
        console.warn('Mammoth preview from path failed:', mErr.message);
      }
    }

    // 2. Fallback: generate clean, professional HTML document view
    if (!html) {
      const p = resume.parsedProfile || {};
      const name = p.name || 'Candidate';
      const contact = [p.email, p.phone, p.location].filter(Boolean).join(' &bull; ');
      const skills = (p.skills || []).map(s => `<span class="inline-block bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-md mr-1.5 mb-1.5 font-medium border border-slate-200">${s}</span>`).join('');
      
      const expHtml = (p.companies || []).map(c => `
        <div class="mb-4">
          <div class="font-bold text-slate-900 text-sm">${c.role || 'Role'} &mdash; <span class="text-blue-700">${c.name || c.company || ''}</span></div>
          ${c.startDate || c.endDate ? `<div class="text-xs text-slate-500 italic mb-1.5">${[c.startDate, c.endDate].filter(Boolean).join(' to ')}</div>` : ''}
          <ul class="list-disc pl-5 text-xs text-slate-700 space-y-1">
            ${(c.highlights || []).map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>
      `).join('');

      const eduHtml = (p.education || []).map(e => `
        <div class="text-xs text-slate-700 mb-1">
          <strong class="text-slate-900">${e.degree || ''}</strong>${e.institution ? ` &mdash; ${e.institution}` : ''}${e.year ? ` (${e.year})` : ''}
        </div>
      `).join('');

      const projHtml = (p.projects || []).map(pr => `
        <div class="mb-3">
          <div class="font-semibold text-xs text-slate-900">${pr.title || 'Project'}</div>
          ${pr.technologies?.length ? `<div class="text-[11px] text-slate-500 italic mb-1">Tech: ${pr.technologies.join(', ')}</div>` : ''}
          <ul class="list-disc pl-5 text-xs text-slate-700 space-y-0.5">
            ${(pr.highlights || []).map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>
      `).join('');

      html = `
        <div class="resume-document space-y-5">
          <div class="border-b border-slate-200 pb-4">
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">${name}</h1>
            ${contact ? `<p class="text-xs text-slate-600 mt-1">${contact}</p>` : ''}
          </div>
          ${p.summary ? `<div><h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Professional Summary</h3><p class="text-xs text-slate-700 leading-relaxed">${p.summary}</p></div>` : ''}
          ${skills ? `<div><h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Skills</h3><div class="flex flex-wrap">${skills}</div></div>` : ''}
          ${expHtml ? `<div><h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Experience</h3>${expHtml}</div>` : ''}
          ${projHtml ? `<div><h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Projects</h3>${projHtml}</div>` : ''}
          ${eduHtml ? `<div><h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Education</h3>${eduHtml}</div>` : ''}
          ${!p.summary && !skills && !expHtml && resume.rawText ? `<div><h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Document Content</h3><pre class="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">${resume.rawText}</pre></div>` : ''}
        </div>
      `;
    }

    res.json({
      success: true,
      html,
      fileName: resume.resumeName || resume.originalFileName || resume.originalName,
      fileType: ext,
    });
  } catch (err) { next(err); }
};

// Serve the original uploaded file (GridFS with fallback to disk)
export const serveResumeFile = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const fileName = resume.originalFileName || resume.originalName || 'resume';
    const mime = resume.mimeType || 'application/pdf';

    if (resume.fileId) {
      try {
        const { streamFile } = await import('../services/gridFsService.js');
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        return streamFile(resume.fileId, res, 'inline');
      } catch (streamErr) {
        console.warn('GridFS stream error, falling back to disk:', streamErr.message);
      }
    }

    if (resume.filePath) {
      const { default: fsModule } = await import('fs');
      if (fsModule.existsSync(resume.filePath)) {
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        return fsModule.createReadStream(resume.filePath).pipe(res);
      }
    }

    return res.status(404).json({ success: false, message: 'File not found in storage or on disk' });
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
