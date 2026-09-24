import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import JobMatch from '../models/JobMatch.js';
import { generateJobHash } from '../utils/duplicateDetector.js';
import { calculateMatch } from '../services/matchingEngineService.js';

export const getJobs = async (req, res, next) => {
  try {
    const { status, location, remote, source, minMatch, role, company, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (location) filter.location = new RegExp(location, 'i');
    if (remote === 'true') filter.remote = true;
    if (source) filter.source = source;
    if (role) filter.jobTitle = new RegExp(role, 'i');
    if (company) filter.companyName = new RegExp(company, 'i');
    if (minMatch) filter.matchScore = { $gte: parseInt(minMatch) };
    if (search) filter.$text = { $search: search };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ matchScore: -1, postedDate: -1 }).skip(skip).limit(parseInt(limit)),
      Job.countDocuments(filter)
    ]);
    res.json({ success: true, count: jobs.length, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), jobs });
  } catch (err) { next(err); }
};

export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) { next(err); }
};

export const createJob = async (req, res, next) => {
  try {
    const uniqueHash = generateJobHash(req.body.companyName, req.body.jobTitle, req.body.jobUrl);
    const existing = await Job.findOne({ uniqueHash });
    if (existing) return res.status(409).json({ success: false, message: 'Duplicate job detected', job: existing });
    const job = await Job.create({ ...req.body, uniqueHash });
    res.status(201).json({ success: true, job });
  } catch (err) { next(err); }
};

export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) { next(err); }
};

export const deleteJob = async (req, res, next) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) { next(err); }
};

export const matchJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const resume = await Resume.findOne({ userId: req.user.id, isPrimary: true });
    if (!resume) return res.status(404).json({ success: false, message: 'Upload a resume first' });
    const matchData = await calculateMatch(resume, job);
    await JobMatch.findOneAndUpdate(
      { userId: req.user.id, jobId: job._id },
      { ...matchData, resumeId: resume._id },
      { upsert: true, new: true }
    );
    await Job.findByIdAndUpdate(job._id, {
      matchScore: matchData.overallMatch,
      matchedSkills: matchData.matchedSkills,
      missingSkills: matchData.missingSkills,
      matchBreakdown: {
        skills: matchData.skillsMatch, experience: matchData.experienceMatch,
        location: matchData.locationMatch, role: matchData.roleMatch, education: matchData.educationMatch
      },
      matchReason: matchData.whyItMatches
    });
    res.json({ success: true, match: matchData });
  } catch (err) { next(err); }
};

export const getRecommended = async (req, res, next) => {
  try {
    const jobs = await Job.find({ matchScore: { $gte: 70 } }).sort({ matchScore: -1 }).limit(20);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) { next(err); }
};

export const discoverJobs = async (req, res, next) => {
  try {
    const { fetchRemoteOKJobs, fetchArbeitnowJobs } = await import('../integrations/jobSources/publicApiSource.js');
    const { logger } = await import('../utils/logger.js');

    const sourcePromises = [];
    if (!req.body.sources || req.body.sources.includes('RemoteOK')) sourcePromises.push(fetchRemoteOKJobs(20));
    if (!req.body.sources || req.body.sources.includes('Arbeitnow')) sourcePromises.push(fetchArbeitnowJobs(20));

    const results = await Promise.all(sourcePromises);
    const rawJobs = results.flat().filter(Boolean);

    const resume = await Resume.findOne({ userId: req.user.id, isPrimary: true });
    let created = 0, duplicates = 0, matched = 0;

    for (const raw of rawJobs) {
      const uniqueHash = generateJobHash(raw.companyName, raw.jobTitle, raw.jobUrl);
      const existing = await Job.findOne({ uniqueHash });
      if (existing) { duplicates++; continue; }

      let matchData = null;
      if (resume) {
        try {
          matchData = await calculateMatch(resume, { ...raw, requiredSkills: raw.skills || [], skills: raw.skills || [] });
        } catch (matchErr) {
          logger.warn(`Match computation skipped for ${raw.jobTitle}: ${matchErr.message}`);
        }
      }

      const job = await Job.create({
        ...raw,
        uniqueHash,
        status: 'new',
        matchScore: matchData?.overallMatch || 0,
        matchedSkills: matchData?.matchedSkills || [],
        missingSkills: matchData?.missingSkills || [],
        matchBreakdown: matchData ? {
          skills: matchData.skillsMatch, experience: matchData.experienceMatch,
          location: matchData.locationMatch, role: matchData.roleMatch, education: matchData.educationMatch
        } : { skills: 0, experience: 0, location: 0, role: 0, education: 0 },
        matchReason: matchData?.whyItMatches || ''
      });
      created++;
      if (matchData?.overallMatch) matched++;

      if (matchData?.overallMatch >= 70) {
        const { notifyNewJob } = await import('../services/notificationService.js');
        await notifyNewJob({ ...job.toObject(), capturedMatch: matchData.overallMatch });
      }

      if (matchData) {
        await JobMatch.findOneAndUpdate(
          { userId: req.user.id, jobId: job._id },
          { ...matchData, resumeId: resume?._id },
          { upsert: true, new: true }
        );
      }
    }

    res.json({ success: true, created, duplicates, matched, message: `Discovered ${created} new jobs (${duplicates} duplicates, ${matched} matched)` });
  } catch (err) { next(err); }
};

export const getJobSources = async (req, res, next) => {
  try {
    const sources = [
      { key: 'RemoteOK', name: 'RemoteOK API', description: 'Remote-friendly developer jobs via public API', type: 'api' },
      { key: 'Arbeitnow', name: 'Arbeitnow API', description: 'Developer job board with free public API', type: 'api' },
      { key: 'companyCareers', name: 'Company Career Pages', description: 'HEAD/availability checks for tracked career pages', type: 'career' }
    ];
    res.json({ success: true, sources });
  } catch (err) { next(err); }
};

export const scanCompanies = async (req, res, next) => {
  try {
    const CompanyModel = await import('../models/Company.js');
    const ResumeModel = await import('../models/Resume.js');
    const { scanCompanyForJobs } = await import('../services/careerDiscoveryService.js');

    const companies = await CompanyModel.default.find({ userId: req.user.id });
    const resume = await ResumeModel.default.findOne({ userId: req.user.id, isPrimary: true });
    const results = [];
    for (const company of companies) {
      try {
        const result = await scanCompanyForJobs({ userId: req.user.id, company, resume });
        results.push(result);
      } catch (err) {
        results.push({ company: company.name, success: false, error: err.message });
      }
    }
    const newJobs = results.reduce((sum, r) => sum + (r.newJobs || 0), 0);
    const customized = results.reduce((sum, r) => sum + (r.customized || 0), 0);
    res.json({ success: true, results, message: `Scanned ${results.length} companies: ${newJobs} new jobs (${customized} resumes customized)` });
  } catch (err) { next(err); }
};
