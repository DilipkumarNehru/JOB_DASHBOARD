import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Email from '../models/Email.js';
import Resume from '../models/Resume.js';
import FollowUp from '../models/FollowUp.js';
import JobMatch from '../models/JobMatch.js';

const STATUS_GROUPS = {
  Saved: ['Saved'],
  Applied: ['Applied', 'Application Viewed', 'Recruiter Contacted'],
  Shortlisted: ['Shortlisted'],
  Assessment: ['Assessment'],
  Interview: ['Interview Scheduled', 'Technical Interview', 'HR Interview'],
  Offer: ['Offer'],
  Rejected: ['Rejected', 'Withdrawn'],
  NoResponse: ['No Response']
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get primary or requested resume for resume-specific stats
    const requestedResumeId = req.query.resumeId;
    let primaryResume = null;
    if (requestedResumeId) {
      primaryResume = await Resume.findOne({ _id: requestedResumeId, userId });
    }
    if (!primaryResume) {
      primaryResume = await Resume.findOne({ userId, isPrimary: true });
    }
    if (!primaryResume) {
      primaryResume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
    }
    const allResumes = await Resume.find({ userId }).select('_id resumeName originalFileName originalName isPrimary');

    // Auto-calculate matches for primary resume if none exist yet
    if (primaryResume) {
      const matchCount = await JobMatch.countDocuments({ userId, resumeId: primaryResume._id });
      if (matchCount === 0) {
        const existingJobs = await Job.find({}).limit(50).lean();
        if (existingJobs.length > 0) {
          const { calculateMatch } = await import('../services/matchingEngineService.js');
          const resumeName = primaryResume.resumeName || primaryResume.originalFileName || primaryResume.originalName || 'My Resume';
          for (const j of existingJobs) {
            try {
              const matchData = await calculateMatch(primaryResume, j);
              await JobMatch.findOneAndUpdate(
                { userId, jobId: j._id, resumeId: primaryResume._id },
                { ...matchData, resumeId: primaryResume._id, resumeName, calculatedAt: new Date() },
                { upsert: true, new: true }
              );
            } catch (_) {}
          }
        }
      }
    }

    const [
      totalJobs, newJobs, globalMatchedJobs,
      totalApps, inProgress, interviews, shortlisted, offers, rejected, followUpsDue, followUpsDueTomorrow, overdue
    ] = await Promise.all([
      Job.countDocuments({}),
      Job.countDocuments({ status: 'new' }),
      Job.countDocuments({ matchScore: { $gte: 70 } }),
      Application.countDocuments({ userId }),
      Application.countDocuments({ userId, status: { $in: [...STATUS_GROUPS.Applied, ...STATUS_GROUPS.Assessment] } }),
      Application.countDocuments({ userId, status: { $in: STATUS_GROUPS.Interview } }),
      Application.countDocuments({ userId, status: 'Shortlisted' }),
      Application.countDocuments({ userId, status: 'Offer' }),
      Application.countDocuments({ userId, status: { $in: STATUS_GROUPS.Rejected } }),
      Application.countDocuments({ userId, nextFollowUpDate: { $gte: new Date().setHours(0,0,0,0), $lte: new Date().setHours(23,59,59,999) } }),
      Application.countDocuments({ userId, nextFollowUpDate: { $gte: new Date(Date.now() + 86400000).setHours(0,0,0,0), $lte: new Date(Date.now() + 86400000).setHours(23,59,59,999) } }),
      Application.countDocuments({ userId, nextFollowUpDate: { $lte: new Date() }, status: { $nin: ['Offer', 'Rejected', 'Withdrawn'] } })
    ]);

    // Multi-resume stats from JobMatch collection
    const totalUniqueMatchedJobs = (await JobMatch.distinct('jobId', { userId })).length;
    const primaryResumeJobCount = primaryResume
      ? await JobMatch.countDocuments({ userId, resumeId: primaryResume._id })
      : 0;

    // Matched jobs specifically for the active primary resume
    let matchThreshold = 70;
    let primaryResumeMatchedJobs = 0;
    if (primaryResume) {
      primaryResumeMatchedJobs = await JobMatch.countDocuments({
        userId,
        resumeId: primaryResume._id,
        overallMatch: { $gte: 70 }
      });
      // If 0 matches >= 70% but jobs exist in pool, check >= 50%
      if (primaryResumeMatchedJobs === 0 && primaryResumeJobCount > 0) {
        const count50 = await JobMatch.countDocuments({
          userId,
          resumeId: primaryResume._id,
          overallMatch: { $gte: 50 }
        });
        if (count50 > 0) {
          primaryResumeMatchedJobs = count50;
          matchThreshold = 50;
        }
      }
    } else {
      primaryResumeMatchedJobs = globalMatchedJobs;
    }

    const matchedJobs = primaryResume ? primaryResumeMatchedJobs : globalMatchedJobs;

    // Build resume list with per-resume job & match stats
    const allResumesWithStats = await Promise.all(
      allResumes.map(async (r) => {
        const rName = r.resumeName || r.originalFileName || r.originalName || 'Resume';
        const jobCount = await JobMatch.countDocuments({ userId, resumeId: r._id });
        let matchedCount = await JobMatch.countDocuments({ userId, resumeId: r._id, overallMatch: { $gte: 70 } });
        if (matchedCount === 0 && jobCount > 0) {
          matchedCount = await JobMatch.countDocuments({ userId, resumeId: r._id, overallMatch: { $gte: 50 } });
        }
        return {
          _id: r._id,
          resumeName: rName,
          isPrimary: !!r.isPrimary,
          jobCount,
          matchedCount,
        };
      })
    );

    res.json({
      success: true,
      stats: {
        totalJobs,
        newJobs,
        matchedJobs,
        matchThreshold,
        totalApps,
        inProgress,
        interviews,
        shortlisted,
        offers,
        rejected,
        followUpsDue,
        followUpsDueTomorrow,
        overdue,
        // Multi-resume stats
        totalResumes: allResumes.length,
        primaryResumeJobCount,
        totalUniqueMatchedJobs,
        allResumes: allResumesWithStats,
        primaryResume: primaryResume ? {
          _id: primaryResume._id,
          resumeName: primaryResume.resumeName || primaryResume.originalFileName || primaryResume.originalName,
          isPrimary: !!primaryResume.isPrimary,
          jobCount: primaryResumeJobCount,
          matchedJobs: primaryResumeMatchedJobs,
          matchThreshold,
        } : null,
      }
    });
  } catch (err) { next(err); }
};

export const getApplicationsByMonth = async (req, res, next) => {
  try {
    const data = await Application.aggregate([
      { $match: { userId: req.user.id } },
      { $group: {
        _id: { year: { $year: '$applicationDate' }, month: { $month: '$applicationDate' } },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getStatusDistribution = async (req, res, next) => {
  try {
    const data = await Application.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getCompanyAnalytics = async (req, res, next) => {
  try {
    const data = await Job.aggregate([
      { $group: { _id: '$companyName', count: { $sum: 1 }, avgMatch: { $avg: '$matchScore' } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
    res.json({ success: true, companies: data });
  } catch (err) { next(err); }
};

export const getJobsByMetric = async (req, res, next) => {
  try {
    const field = req.query.field || 'location';
    const allowed = { location: '$location', company: '$companyName', source: '$source', experience: '$experienceRequired' };
    const groupField = allowed[field] || '$location';
    const data = await Job.aggregate([
      { $match: { [field]: { $ne: null, $ne: '' } } },
      { $group: { _id: groupField, count: { $sum: 1 }, avgMatch: { $avg: '$matchScore' } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
    res.json({ success: true, field, data });
  } catch (err) { next(err); }
};

export const getSkillsAnalytics = async (req, res, next) => {
  try {
    const data = await Job.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 }, avgMatch: { $avg: '$matchScore' } } },
      { $sort: { count: -1 } },
      { $limit: 25 }
    ]);
    res.json({ success: true, skills: data });
  } catch (err) { next(err); }
};

export const getApplicationsAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [total, byStatus, applied, responded, interviews, offers, rejected] = await Promise.all([
      Application.countDocuments({ userId }),
      Application.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Application.countDocuments({ userId, status: { $nin: ['Saved'] } }),
      Application.countDocuments({ userId, status: { $in: ['Application Viewed', 'Recruiter Contacted', 'Shortlisted', 'Assessment', 'Interview Scheduled', 'Technical Interview', 'HR Interview', 'Offer', 'Rejected'] } }),
      Application.countDocuments({ userId, status: { $in: STATUS_GROUPS.Interview } }),
      Application.countDocuments({ userId, status: 'Offer' }),
      Application.countDocuments({ userId, status: { $in: STATUS_GROUPS.Rejected } })
    ]);

    const byMonth = await Application.aggregate([
      { $match: { userId } },
      { $group: { _id: { y: { $year: '$applicationDate' }, m: { $month: '$applicationDate' } }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      analytics: {
        total,
        applied,
        byStatus,
        byMonth,
        responseRate: applied ? Math.round((responded / applied) * 100) : 0,
        interviewConversionRate: applied ? Math.round((interviews / applied) * 100) : 0,
        offerRate: applied ? Math.round((offers / applied) * 100) : 0,
        rejectionRate: applied ? Math.round((rejected / applied) * 100) : 0
      }
    });
  } catch (err) { next(err); }
};

export const getJobsAnalytics = async (req, res, next) => {
  try {
    const [perWeek, bySource, byLocation, byExperience] = await Promise.all([
      Job.aggregate([
        { $group: { _id: { y: { $isoWeekYear: '$postedDate' }, w: { $isoWeek: '$postedDate' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': -1, '_id.w': -1 } },
        { $limit: 12 }
      ]),
      Job.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Job.aggregate([{ $group: { _id: '$location', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 12 }]),
      Job.aggregate([{ $group: { _id: '$experienceRequired', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }])
    ]);
    res.json({ success: true, jobs: { perWeek, bySource, byLocation, byExperience } });
  } catch (err) { next(err); }
};

export const getFollowUpAnalytics = async (req, res, next) => {
  try {
    const [total, pending, completed, overdue] = await Promise.all([
      FollowUp.countDocuments({ userId: req.user.id }),
      FollowUp.countDocuments({ userId: req.user.id, status: 'pending' }),
      FollowUp.countDocuments({ userId: req.user.id, status: 'completed' }),
      FollowUp.countDocuments({ userId: req.user.id, status: 'overdue' })
    ]);
    res.json({ success: true, analytics: { total, pending, completed, overdue } });
  } catch (err) { next(err); }
};

export const getInsights = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id, isPrimary: true });
    const profile = resume?.parsedProfile || { skills: [], experienceYears: 0, preferredRoles: [], preferredLocations: [] };

    const topSkills = await Job.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    const profileSkills = (profile.skills || []).map(s => s.toLowerCase());
    const missingSkills = topSkills
      .filter(s => !profileSkills.includes(s._id.toLowerCase()))
      .slice(0, 10)
      .map(s => s._id);

    const matchedSkillCounts = await Job.aggregate([
      { $unwind: '$matchedSkills' },
      { $group: { _id: '$matchedSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topCompanies = await Job.aggregate([
      { $group: { _id: '$companyName', count: { $sum: 1 }, avgMatch: { $avg: '$matchScore' } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const topRoles = await Job.aggregate([
      { $group: { _id: '$jobTitle', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const apps = await Application.find({ userId: req.user.id }).select('status').lean();
    const totalApps = apps.length;
    const applied = apps.filter(a => a.status !== 'Saved').length;
    const responded = apps.filter(a => ['Application Viewed', 'Recruiter Contacted', 'Shortlisted', 'Assessment', 'Interview Scheduled', 'Technical Interview', 'HR Interview', 'Offer', 'Rejected'].includes(a.status)).length;
    const interviews = apps.filter(a => STATUS_GROUPS.Interview.includes(a.status)).length;
    const offers = apps.filter(a => a.status === 'Offer').length;

    res.json({
      success: true,
      insights: {
        strongestMatchingSkill: matchedSkillCounts[0]?._id || null,
        frequentlyRequestedSkills: topSkills.map(s => s._id),
        missingFromProfile: missingSkills,
        matchSkillCounts: matchedSkillCounts,
        topCompanies: topCompanies.filter(c => c._id !== 'Tech Company'),
        topRoles,
        performance: {
          totalApps,
          applied,
          responseRate: applied ? Math.round((responded / applied) * 100) : 0,
          interviewConversionRate: applied ? Math.round((interviews / applied) * 100) : 0,
          rejectionRate: applied ? Math.round((apps.filter(a => STATUS_GROUPS.Rejected.includes(a.status)).length / applied) * 100) : 0,
          offerRate: applied ? Math.round((offers / applied) * 100) : 0
        }
      }
    });
  } catch (err) { next(err); }
};

export const getEmailAnalytics = async (req, res, next) => {
  try {
    const data = await Email.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const total = await Email.countDocuments({ userId: req.user.id });
    const needsReview = await Email.countDocuments({ userId: req.user.id, status: 'needs_review' });
    const linked = await Email.countDocuments({ userId: req.user.id, status: 'linked' });
    res.json({ success: true, analytics: { total, needsReview, linked, byCategory: data } });
  } catch (err) { next(err); }
};