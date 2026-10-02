import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import JobMatch from '../models/JobMatch.js';
import { generateJobHash } from '../utils/duplicateDetector.js';
import { calculateMatch } from '../services/matchingEngineService.js';
import { logger } from '../utils/logger.js';

export const getResumeDisplayName = (resume) => {
  if (!resume) return '';
  return resume.resumeName || resume.originalFileName || resume.originalName || 'My Resume';
};

export const getJobs = async (req, res, next) => {
  try {
    const {
      status, location, remote, source, minMatch, role, company,
      page = 1, limit = 20, search,
      resumeId, primaryOnly, minAts
    } = req.query;

    // ── Primary resume filter ──────────────────────────────────────────────
    if (primaryOnly === 'true' || resumeId) {
      let targetResumeId = resumeId;
      let targetResume = null;

      if (primaryOnly === 'true' && !resumeId) {
        targetResume = await Resume.findOne({ userId: req.user.id, isPrimary: true });
        if (!targetResume) {
          targetResume = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
        }
        if (!targetResume) {
          return res.json({ success: true, count: 0, total: 0, page: 1, pages: 1, jobs: [], primaryResumeId: null });
        }
        targetResumeId = targetResume._id;
      } else {
        targetResume = await Resume.findOne({ _id: targetResumeId, userId: req.user.id });
      }

      const targetResumeDisplayName = getResumeDisplayName(targetResume);

      // Find JobMatch records for this resume
      const matchFilter = { userId: req.user.id, resumeId: targetResumeId };
      if (minAts) matchFilter.overallMatch = { $gte: parseInt(minAts) };
      if (minMatch) matchFilter.overallMatch = { ...matchFilter.overallMatch, $gte: parseInt(minMatch) };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      let [matchRecords, totalMatches] = await Promise.all([
        JobMatch.find(matchFilter)
          .sort({ overallMatch: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        JobMatch.countDocuments(matchFilter)
      ]);

      // If no JobMatch records exist yet for this resume, auto-compute matches against existing jobs!
      if (totalMatches === 0 && targetResume) {
        const existingJobs = await Job.find({}).limit(50).lean();
        if (existingJobs.length > 0) {
          for (const j of existingJobs) {
            try {
              const matchData = await calculateMatch(targetResume, j);
              await JobMatch.findOneAndUpdate(
                { userId: req.user.id, jobId: j._id, resumeId: targetResume._id },
                {
                  ...matchData,
                  resumeId: targetResume._id,
                  resumeName: targetResumeDisplayName,
                  calculatedAt: new Date()
                },
                { upsert: true, new: true }
              );
            } catch (_) {}
          }
          [matchRecords, totalMatches] = await Promise.all([
            JobMatch.find(matchFilter)
              .sort({ overallMatch: -1 })
              .skip(skip)
              .limit(parseInt(limit))
              .lean(),
            JobMatch.countDocuments(matchFilter)
          ]);
        }
      }

      if (matchRecords.length === 0) {
        return res.json({ success: true, count: 0, total: totalMatches, page: parseInt(page), pages: Math.ceil(totalMatches / parseInt(limit)), jobs: [], primaryResumeId: targetResumeId });
      }

      const jobIds = matchRecords.map(m => m.jobId);
      const matchMap = {};
      for (const m of matchRecords) {
        matchMap[m.jobId.toString()] = m;
      }

      // Build job filter
      const jobFilter = { _id: { $in: jobIds } };
      if (status) jobFilter.status = status;
      if (location) jobFilter.location = new RegExp(location, 'i');
      if (remote === 'true') jobFilter.remote = true;
      if (source) jobFilter.source = source;
      if (role) jobFilter.jobTitle = new RegExp(role, 'i');
      if (company) jobFilter.companyName = new RegExp(company, 'i');
      if (search) jobFilter.$text = { $search: search };

      const jobs = await Job.find(jobFilter).lean();

      // Attach match data from the JobMatch record
      const enrichedJobs = jobs.map(job => {
        const match = matchMap[job._id.toString()];
        return {
          ...job,
          matchScore: match?.overallMatch ?? job.matchScore ?? 0,
          matchedSkills: match?.matchedSkills || job.matchedSkills || [],
          missingSkills: match?.missingSkills || job.missingSkills || [],
          matchBreakdown: {
            skills: match?.skillsMatch || 0,
            experience: match?.experienceMatch || 0,
            location: match?.locationMatch || 0,
            role: match?.roleMatch || 0,
            education: match?.educationMatch || 0,
            responsibilities: match?.responsibilitiesMatch || 0,
          },
          matchReason: match?.whyItMatches || job.matchReason || '',
          matchedResumeId: targetResumeId,
          matchedResumeName: match?.resumeName || targetResumeDisplayName,
        };
      }).sort((a, b) => b.matchScore - a.matchScore);

      return res.json({
        success: true,
        count: enrichedJobs.length,
        total: totalMatches,
        page: parseInt(page),
        pages: Math.ceil(totalMatches / parseInt(limit)),
        jobs: enrichedJobs,
        primaryResumeId: targetResumeId
      });
    }

    // ── Default: return all jobs (with global match scores) ────────────────
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

    let primary = await Resume.findOne({ userId: req.user.id, isPrimary: true });
    if (!primary) {
      primary = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    const primaryDisplayName = getResumeDisplayName(primary);

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ matchScore: -1, postedDate: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Job.countDocuments(filter)
    ]);

    const enrichedAllJobs = jobs.map(j => ({
      ...j,
      matchedResumeName: j.matchedResumeName || primaryDisplayName || '',
    }));

    res.json({ success: true, count: enrichedAllJobs.length, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), jobs: enrichedAllJobs });
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
    await JobMatch.deleteMany({ jobId: req.params.id });
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) { next(err); }
};

/**
 * Run ATS match for a specific job against ALL user resumes.
 * Stores per-resume match in JobMatch collection.
 * Updates the job's global matchScore with the best match.
 */
export const matchJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const resumes = await Resume.find({ userId: req.user.id });
    if (!resumes.length) return res.status(404).json({ success: false, message: 'Upload a resume first' });

    const results = [];
    let bestMatch = null;
    let bestResume = null;

    for (const resume of resumes) {
      try {
        const matchData = await calculateMatch(resume, job);
        const resumeDisplayName = getResumeDisplayName(resume);

        // Upsert per-resume match record
        await JobMatch.findOneAndUpdate(
          { userId: req.user.id, jobId: job._id, resumeId: resume._id },
          {
            ...matchData,
            resumeId: resume._id,
            resumeName: resumeDisplayName,
            calculatedAt: new Date()
          },
          { upsert: true, new: true }
        );

        results.push({
          resumeId: resume._id,
          resumeName: resumeDisplayName,
          isPrimary: resume.isPrimary,
          ...matchData
        });

        if (!bestMatch || matchData.overallMatch > bestMatch.overallMatch) {
          bestMatch = matchData;
          bestResume = resume;
        }
      } catch (err) {
        logger.warn(`Match failed for resume ${resume._id}: ${err.message}`);
      }
    }

    // Update job's global match data with best match (for backward compatibility)
    if (bestMatch) {
      await Job.findByIdAndUpdate(job._id, {
        matchScore: bestMatch.overallMatch,
        matchedSkills: bestMatch.matchedSkills,
        missingSkills: bestMatch.missingSkills,
        matchBreakdown: {
          skills: bestMatch.skillsMatch,
          experience: bestMatch.experienceMatch,
          location: bestMatch.locationMatch,
          role: bestMatch.roleMatch,
          education: bestMatch.educationMatch
        },
        matchReason: bestMatch.whyItMatches
      });
    }

    res.json({
      success: true,
      results,
      bestMatch: bestMatch ? {
        resumeId: bestResume._id,
        resumeName: getResumeDisplayName(bestResume),
        ...bestMatch
      } : null
    });
  } catch (err) { next(err); }
};

/**
 * Get detailed ATS match for a specific job + resume pair
 */
export const getJobMatchDetails = async (req, res, next) => {
  try {
    const { id: jobId } = req.params;
    const { resumeId } = req.query;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    let targetResumeId = resumeId;
    if (!targetResumeId) {
      const primary = await Resume.findOne({ userId: req.user.id, isPrimary: true });
      if (!primary) return res.status(404).json({ success: false, message: 'No primary resume' });
      targetResumeId = primary._id;
    }

    const resume = await Resume.findOne({ _id: targetResumeId, userId: req.user.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    // Check cached match
    let matchRecord = await JobMatch.findOne({ userId: req.user.id, jobId, resumeId: targetResumeId });

    // If no cache or stale, recalculate
    if (!matchRecord) {
      const matchData = await calculateMatch(resume, job);
      const resumeDisplayName = getResumeDisplayName(resume);
      matchRecord = await JobMatch.findOneAndUpdate(
        { userId: req.user.id, jobId, resumeId: targetResumeId },
        { ...matchData, resumeId: targetResumeId, resumeName: resumeDisplayName, calculatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // Get match data for ALL resumes (for comparison)
    const allMatches = await JobMatch.find({ userId: req.user.id, jobId })
      .select('resumeId resumeName overallMatch skillsMatch matchedSkills missingSkills')
      .lean();

    res.json({
      success: true,
      job: { _id: job._id, jobTitle: job.jobTitle, companyName: job.companyName, location: job.location },
      resume: { _id: resume._id, resumeName: getResumeDisplayName(resume), isPrimary: resume.isPrimary },
      match: matchRecord,
      allResumeMatches: allMatches,
    });
  } catch (err) { next(err); }
};

/**
 * Get jobs filtered by a specific resume's ATS matches
 */
export const getPrimaryResumeJobs = async (req, res, next) => {
  try {
    const { minMatch = 0, page = 1, limit = 20 } = req.query;

    let primary = await Resume.findOne({ userId: req.user.id, isPrimary: true });
    if (!primary) {
      primary = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    if (!primary) {
      return res.json({ success: true, count: 0, total: 0, jobs: [], primaryResume: null });
    }

    const primaryDisplayName = getResumeDisplayName(primary);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const matchFilter = {
      userId: req.user.id,
      resumeId: primary._id,
      overallMatch: { $gte: parseInt(minMatch) }
    };

    const [matchRecords, total] = await Promise.all([
      JobMatch.find(matchFilter).sort({ overallMatch: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      JobMatch.countDocuments(matchFilter)
    ]);

    const jobIds = matchRecords.map(m => m.jobId);
    const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
    const matchMap = {};
    for (const m of matchRecords) matchMap[m.jobId.toString()] = m;

    const enrichedJobs = jobs.map(job => ({
      ...job,
      matchScore: matchMap[job._id.toString()]?.overallMatch || 0,
      matchedSkills: matchMap[job._id.toString()]?.matchedSkills || [],
      missingSkills: matchMap[job._id.toString()]?.missingSkills || [],
      matchBreakdown: {
        skills: matchMap[job._id.toString()]?.skillsMatch,
        experience: matchMap[job._id.toString()]?.experienceMatch,
        role: matchMap[job._id.toString()]?.roleMatch,
        education: matchMap[job._id.toString()]?.educationMatch,
      },
      matchReason: matchMap[job._id.toString()]?.whyItMatches || '',
      matchedResumeName: matchMap[job._id.toString()]?.resumeName || primaryDisplayName,
    })).sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      count: enrichedJobs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      jobs: enrichedJobs,
      primaryResume: {
        _id: primary._id,
        resumeName: primaryDisplayName,
        profile: primary.parsedProfile?.profile,
        skills: (primary.parsedProfile?.skills || []).slice(0, 10),
        experienceYears: primary.parsedProfile?.experienceYears,
      }
    });
  } catch (err) { next(err); }
};

export const getRecommended = async (req, res, next) => {
  try {
    // Try to get primary resume jobs first
    let primary = await Resume.findOne({ userId: req.user.id, isPrimary: true });
    if (!primary) {
      primary = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    if (primary) {
      const primaryDisplayName = getResumeDisplayName(primary);
      const matches = await JobMatch.find({
        userId: req.user.id,
        resumeId: primary._id,
        overallMatch: { $gte: 70 }
      }).sort({ overallMatch: -1 }).limit(20).lean();

      const jobIds = matches.map(m => m.jobId);
      const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
      const matchMap = {};
      for (const m of matches) matchMap[m.jobId.toString()] = m;

      const enriched = jobs.map(j => ({
        ...j,
        matchScore: matchMap[j._id.toString()]?.overallMatch || 0,
        matchedSkills: matchMap[j._id.toString()]?.matchedSkills || [],
        missingSkills: matchMap[j._id.toString()]?.missingSkills || [],
        matchedResumeName: matchMap[j._id.toString()]?.resumeName || primaryDisplayName,
      })).sort((a, b) => b.matchScore - a.matchScore);

      if (enriched.length > 0) {
        return res.json({ success: true, count: enriched.length, jobs: enriched });
      }
    }

    // Fallback to global match score
    const jobs = await Job.find({ matchScore: { $gte: 70 } }).sort({ matchScore: -1 }).limit(20);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) { next(err); }
};

/**
 * Recalculate matches for all jobs against all user resumes.
 * This is triggered when user changes their primary resume.
 */
export const recalculateAllMatches = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id });
    if (!resumes.length) return res.json({ success: true, message: 'No resumes to match' });

    const { limit: jobLimit = 100 } = req.body;

    // Get jobs to recalculate
    const jobs = await Job.find({}).limit(parseInt(jobLimit)).lean();
    let calculated = 0;
    let errors = 0;

    for (const job of jobs) {
      for (const resume of resumes) {
        try {
          // Check if already calculated recently (within 24 hours) — skip to save compute
          const existing = await JobMatch.findOne({
            userId: req.user.id,
            jobId: job._id,
            resumeId: resume._id
          });

          if (existing && existing.calculatedAt) {
            const ageHours = (Date.now() - existing.calculatedAt.getTime()) / (1000 * 60 * 60);
            if (ageHours < 24) continue; // Use cached result
          }

          const matchData = await calculateMatch(resume, job);
          await JobMatch.findOneAndUpdate(
            { userId: req.user.id, jobId: job._id, resumeId: resume._id },
            {
              ...matchData,
              resumeId: resume._id,
              resumeName: getResumeDisplayName(resume),
              calculatedAt: new Date()
            },
            { upsert: true, new: true }
          );
          calculated++;
        } catch (err) {
          errors++;
        }
      }
    }

    res.json({
      success: true,
      message: `Recalculated ${calculated} matches (${errors} errors) across ${resumes.length} resumes and ${jobs.length} jobs`
    });
  } catch (err) { next(err); }
};

/**
 * Get total job statistics across all resumes (for dashboard)
 */
export const getJobStats = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).select('_id resumeName originalFileName originalName isPrimary parsedProfile.profile');
    const primary = resumes.find(r => r.isPrimary) || resumes[0];

    // Total unique jobs matched across all resumes (union)
    const allMatchedJobIds = await JobMatch.distinct('jobId', { userId: req.user.id });
    const totalUniqueJobs = allMatchedJobIds.length;

    // Total jobs in collection
    const totalJobs = await Job.countDocuments({});

    // Primary resume job count
    let primaryResumeJobCount = 0;
    if (primary) {
      primaryResumeJobCount = await JobMatch.countDocuments({
        userId: req.user.id,
        resumeId: primary._id
      });
    }

    // Per-resume counts
    const perResume = await Promise.all(resumes.map(async (r) => ({
      resumeId: r._id,
      resumeName: getResumeDisplayName(r),
      isPrimary: r.isPrimary,
      profile: r.parsedProfile?.profile,
      jobCount: await JobMatch.countDocuments({ userId: req.user.id, resumeId: r._id })
    })));

    res.json({
      success: true,
      stats: {
        totalResumes: resumes.length,
        totalJobs,
        totalUniqueJobs,
        primaryResumeJobCount,
        primaryResume: primary ? {
          _id: primary._id,
          resumeName: getResumeDisplayName(primary),
          profile: primary.parsedProfile?.profile,
        } : null,
        perResume
      }
    });
  } catch (err) { next(err); }
};

export const discoverJobs = async (req, res, next) => {
  try {
    const { fetchRemoteOKJobs, fetchArbeitnowJobs } = await import('../integrations/jobSources/publicApiSource.js');

    const sourcePromises = [];
    if (!req.body.sources || req.body.sources.includes('RemoteOK')) sourcePromises.push(fetchRemoteOKJobs(20));
    if (!req.body.sources || req.body.sources.includes('Arbeitnow')) sourcePromises.push(fetchArbeitnowJobs(20));

    const results = await Promise.all(sourcePromises);
    const rawJobs = results.flat().filter(Boolean);

    // Get ALL user resumes for matching
    const resumes = await Resume.find({ userId: req.user.id });
    const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];

    let created = 0, duplicates = 0, matched = 0;

    for (const raw of rawJobs) {
      const uniqueHash = generateJobHash(raw.companyName, raw.jobTitle, raw.jobUrl);
      const existing = await Job.findOne({ uniqueHash });
      if (existing) {
        duplicates++;
        // Still update match data for existing jobs if we have resumes
        if (resumes.length > 0) {
          for (const resume of resumes) {
            const existingMatch = await JobMatch.findOne({
              userId: req.user.id,
              jobId: existing._id,
              resumeId: resume._id
            });
            if (!existingMatch) {
              try {
                const matchData = await calculateMatch(resume, { ...existing.toObject(), requiredSkills: existing.skills || [], skills: existing.skills || [] });
                await JobMatch.findOneAndUpdate(
                  { userId: req.user.id, jobId: existing._id, resumeId: resume._id },
                  { ...matchData, resumeId: resume._id, resumeName: getResumeDisplayName(resume), calculatedAt: new Date() },
                  { upsert: true, new: true }
                );
              } catch (matchErr) {
                logger.warn(`Match skipped for existing job ${existing._id}: ${matchErr.message}`);
              }
            }
          }
        }
        continue;
      }

      // Create the job first with primary resume match for backward compat
      let primaryMatchData = null;
      if (primaryResume) {
        try {
          primaryMatchData = await calculateMatch(primaryResume, { ...raw, requiredSkills: raw.skills || [], skills: raw.skills || [] });
        } catch (matchErr) {
          logger.warn(`Primary match computation skipped for ${raw.jobTitle}: ${matchErr.message}`);
        }
      }

      const job = await Job.create({
        ...raw,
        uniqueHash,
        status: 'new',
        matchScore: primaryMatchData?.overallMatch || 0,
        matchedSkills: primaryMatchData?.matchedSkills || [],
        missingSkills: primaryMatchData?.missingSkills || [],
        matchBreakdown: primaryMatchData ? {
          skills: primaryMatchData.skillsMatch,
          experience: primaryMatchData.experienceMatch,
          location: primaryMatchData.locationMatch,
          role: primaryMatchData.roleMatch,
          education: primaryMatchData.educationMatch
        } : { skills: 0, experience: 0, location: 0, role: 0, education: 0 },
        matchReason: primaryMatchData?.whyItMatches || ''
      });
      created++;

      // Store match for ALL resumes
      for (const resume of resumes) {
        try {
          let matchData = primaryMatchData;
          if (resume._id.toString() !== primaryResume?._id?.toString()) {
            matchData = await calculateMatch(resume, { ...raw, requiredSkills: raw.skills || [], skills: raw.skills || [] });
          }
          if (matchData) {
            await JobMatch.findOneAndUpdate(
              { userId: req.user.id, jobId: job._id, resumeId: resume._id },
              {
                ...matchData,
                resumeId: resume._id,
                resumeName: getResumeDisplayName(resume),
                calculatedAt: new Date()
              },
              { upsert: true, new: true }
            );
            if (matchData.overallMatch > 0) matched++;
          }
        } catch (matchErr) {
          logger.warn(`Match for resume ${resume._id} skipped: ${matchErr.message}`);
        }
      }

      // Notify for high-match primary jobs
      if (primaryMatchData?.overallMatch >= 70) {
        try {
          const { notifyNewJob } = await import('../services/notificationService.js');
          await notifyNewJob({ ...job.toObject(), capturedMatch: primaryMatchData.overallMatch });
        } catch (notifErr) {
          logger.warn('Notification skipped:', notifErr.message);
        }
      }
    }

    res.json({
      success: true,
      created,
      duplicates,
      matched,
      message: `Discovered ${created} new jobs (${duplicates} duplicates, ${matched} resume-job matches created)`
    });
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
