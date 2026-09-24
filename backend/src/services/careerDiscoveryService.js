import Job from '../models/Job.js';
import JobMatch from '../models/JobMatch.js';
import ResumeVersion from '../models/ResumeVersion.js';
import { generateJobHash } from '../utils/duplicateDetector.js';
import { calculateMatch } from './matchingEngineService.js';
import { fetchCompanyJobs } from '../integrations/careers/careerAdapters.js';
import { customizeResume } from './resumeCustomizationService.js';
import { buildPdfFromCustomized } from './resumeVersionService.js';
import { decryptSecret } from '../utils/encryptionUtil.js';
import { logger } from '../utils/logger.js';
import { createNotification, notifyNewJob } from './notificationService.js';

const extractExperience = (description = '') => {
  const text = description.toLowerCase();
  const range = text.match(/(\d{1,2})\s*\+?\s*(?:-|to)\s*(\d{1,2})\s*\+?\s*years?/i);
  if (range) return { minExperienceYears: parseInt(range[1]), maxExperienceYears: parseInt(range[2]) };
  const single = text.match(/(\d{1,2})\s*\+?\s*years?\s*(?:of)?\s*(?:experience|exp|work)/i);
  if (single) {
    const min = parseInt(single[1]);
    return { minExperienceYears: min, maxExperienceYears: min + 5 };
  }
  return {};
};

const recommendKeywords = (company, resume) => {
  const set = new Set();
  for (const role of (company.preferredRoles || [])) {
    const words = String(role).split(/\s+/).filter(w => w.length > 1);
    if (words.length <= 3) set.add(String(role));
    else set.add(words[0]);
  }
  for (const role of (resume?.parsedProfile?.preferredRoles || [])) {
    const words = String(role).split(/\s+/).filter(w => w.length > 1);
    if (words.length <= 3) set.add(String(role));
    else set.add(words[0]);
  }
  for (const skill of (resume?.parsedProfile?.skills || []).slice(0, 4)) set.add(String(skill));
  return Array.from(set).slice(0, 4);
};

const autoCustomizeForJob = async ({ userId, resume, job }) => {
  const existing = await ResumeVersion.findOne({ originalResumeId: resume._id, jobId: job._id });
  if (existing) return null;
  try {
    const tailored = await customizeResume(resume.parsedProfile, job);
    const pdfPath = await buildPdfFromCustomized(tailored);
    const version = await ResumeVersion.create({
      userId,
      originalResumeId: resume._id,
      jobId: job._id,
      targetCompany: job.companyName,
      targetRole: job.jobTitle,
      versionName: `Auto-tailored - ${job.companyName} (${job.jobTitle})`,
      tailoredContent: tailored,
      changesMade: tailored.changesMade || [],
      pdfPath,
    });
    await createNotification(
      userId,
      'RESUME_CUSTOMIZED',
      'Resume auto-customized',
      `Resume tailored for ${job.companyName} (${job.jobTitle}) — review and mark primary before applying.`,
      `/resumes/${resume._id}?version=${version._id}`,
      { resumeId: resume._id, versionId: version._id, jobId: job._id }
    );
    return version;
  } catch (err) {
    logger.warn(`Auto-customize failed for ${job.companyName} ${job.jobTitle}: ${err.message}`);
    return null;
  }
};

export const scanCompanyForJobs = async ({ userId, company, resume, autoCustomize = true, customizeCap = 5 }) => {
  const credentials = {
    username: company.careerPortalUsername || '',
    password: decryptSecret(company.careerPortalPasswordEncrypted) || ''
  };

  const keywords = recommendKeywords(company, resume);
  let listings;
  try {
    listings = await fetchCompanyJobs({ company, keywords, credentials });
  } catch (err) {
    logger.warn(`[Scan] Fetch failed for ${company.name}: ${err.message}`);
    listings = [];
  }

  const stats = { company: company.name, success: true, listings: listings.length, newJobs: 0, duplicates: 0, matched: 0, customized: 0, errors: [] };

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    try {
      if (!listing.jobUrl || !listing.jobTitle) { stats.errors.push(`Listing ${i} missing url/title`); continue; }

      if (listing.jobReqId) {
        const byReq = await Job.findOne({ companyName: company.name, jobReqId: listing.jobReqId });
        if (byReq) { stats.duplicates++; continue; }
      }
      const uniqueHash = generateJobHash(company.name, listing.jobTitle, listing.jobUrl || `req:${listing.jobReqId}`);
      const existing = await Job.findOne({ uniqueHash });
      if (existing) { stats.duplicates++; continue; }

      const exp = extractExperience(listing.jobDescription);
      let matchData = null;
      if (resume?.parsedProfile) {
        try {
          matchData = await calculateMatch(resume, { ...listing, requiredSkills: listing.requiredSkills || [], skills: listing.skills || [] });
        } catch (err) {
          logger.warn(`Match skip for ${listing.jobTitle}: ${err.message}`);
        }
      }

      const job = await Job.create({
        companyName: company.name,
        companyWebsite: listing.companyWebsite,
        careerPageUrl: listing.careerPageUrl,
        jobReqId: listing.jobReqId,
        jobTitle: listing.jobTitle,
        jobDescription: listing.jobDescription.slice(0, 12000),
        jobUrl: listing.jobUrl,
        location: listing.location || company.location || 'Remote',
        remote: listing.remote,
        employmentType: listing.employmentType,
        experienceRequired: exp.minExperienceYears ? `${exp.minExperienceYears}+ years` : '2+ years',
        minExperienceYears: exp.minExperienceYears || 2,
        maxExperienceYears: exp.maxExperienceYears || 6,
        skills: listing.skills || [],
        requiredSkills: listing.requiredSkills || [],
        source: 'Company Career Page',
        postedDate: listing.postedDate || new Date(),
        uniqueHash,
        status: 'new',
        matchScore: matchData?.overallMatch ?? 0,
        matchedSkills: matchData?.matchedSkills || [],
        missingSkills: matchData?.missingSkills || [],
        matchBreakdown: matchData ? {
          skills: matchData.skillsMatch, experience: matchData.experienceMatch,
          location: matchData.locationMatch, role: matchData.roleMatch, education: matchData.educationMatch
        } : { skills: 0, experience: 0, location: 0, role: 0, education: 0 },
        matchReason: matchData?.whyItMatches || ''
      });
      stats.newJobs++;
      if (matchData?.overallMatch) stats.matched++;

      if (matchData) {
        await JobMatch.findOneAndUpdate(
          { userId, jobId: job._id },
          { ...matchData, resumeId: resume?._id },
          { upsert: true, new: true }
        );
      }

      if (matchData?.overallMatch >= 70) {
        await notifyNewJob({ ...job.toObject(), capturedMatch: matchData.overallMatch });
      }

      if (autoCustomize && resume?._id && matchData && matchData.overallMatch < 100 && stats.customized < customizeCap) {
        const version = await autoCustomizeForJob({ userId, resume, job });
        if (version) stats.customized++;
      }
    } catch (err) {
      logger.warn(`[Scan] Failed to store listing ${i} for ${company.name}: ${err.message}`);
      stats.errors.push(String(err.message).slice(0, 160));
    }
  }

  company.lastScanned = new Date();
  company.activeJobsCount = await Job.countDocuments({ companyName: company.name });
  if (stats.errors.length) company.status = 'error';
  else company.status = 'active';
  await company.save();

  logger.info(`[Scan] ${company.name}: ${stats.newJobs} new, ${stats.duplicates} dups, ${stats.customized} customized`);
  stats.message = `Scanned ${company.name}: ${stats.newJobs} new job${stats.newJobs === 1 ? '' : 's'} (${stats.matched} matched, ${stats.customized} resume customized)`;
  return stats;
};