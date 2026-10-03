import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import JobMatch from '../models/JobMatch.js';
import PracticeSession from '../models/PracticeSession.js';
import { generateQuestionsForJobAndResume, buildProgressiveHints } from '../services/practiceQuestionGenerator.js';
import { executeCode as runCode } from '../utils/codeRunner.js';

/**
 * 1. Get all matched jobs for the current user to practice against.
 */
export const getMatchedJobs = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get user's primary resume
    const primaryResume = await Resume.findOne({ userId, isPrimary: true }) || await Resume.findOne({ userId }).sort({ createdAt: -1 });
    const allResumes = await Resume.find({ userId }).select('resumeName originalFileName isPrimary atsScore createdAt');

    // 1. First look up JobMatch records
    let matches = await JobMatch.find({ userId })
      .populate('jobId')
      .populate('resumeId', 'resumeName originalFileName isPrimary')
      .sort({ overallMatch: -1 })
      .limit(50);

    let matchedJobs = [];

    if (matches.length > 0) {
      matchedJobs = matches
        .filter(m => m.jobId) // filter deleted jobs
        .map(m => {
          const j = m.jobId;
          return {
            _id: j._id,
            jobTitle: j.jobTitle,
            companyName: j.companyName,
            location: j.location,
            remote: j.remote,
            employmentType: j.employmentType,
            experienceRequired: j.experienceRequired,
            salary: j.salary,
            skills: j.skills || [],
            requiredSkills: j.requiredSkills || [],
            missingSkills: m.missingSkills || j.missingSkills || [],
            matchedSkills: m.matchedSkills || j.matchedSkills || [],
            matchScore: m.overallMatch || j.matchScore || 0,
            jobDescription: j.jobDescription,
            source: j.source,
            resumeId: m.resumeId?._id || primaryResume?._id,
            resumeName: m.resumeId?.resumeName || m.resumeId?.originalFileName || primaryResume?.resumeName || 'Primary Resume',
          };
        });
    } else {
      // Fallback: query jobs with high matchScore directly
      const jobs = await Job.find({ matchScore: { $gt: 0 } })
        .sort({ matchScore: -1 })
        .limit(30);

      matchedJobs = jobs.map(j => ({
        _id: j._id,
        jobTitle: j.jobTitle,
        companyName: j.companyName,
        location: j.location,
        remote: j.remote,
        employmentType: j.employmentType,
        experienceRequired: j.experienceRequired,
        salary: j.salary,
        skills: j.skills || [],
        requiredSkills: j.requiredSkills || [],
        missingSkills: j.missingSkills || [],
        matchedSkills: j.matchedSkills || [],
        matchScore: j.matchScore || 75,
        jobDescription: j.jobDescription,
        source: j.source,
        resumeId: primaryResume?._id,
        resumeName: primaryResume?.resumeName || primaryResume?.originalFileName || 'Primary Resume',
      }));
    }

    res.json({
      success: true,
      count: matchedJobs.length,
      matchedJobs,
      primaryResume,
      resumes: allResumes,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Get existing practice session or cached questions for job & resume.
 */
export const getPracticeSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { jobId, resumeId } = req.query;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const filter = { userId, jobId };
    if (resumeId) filter.resumeId = resumeId;

    const session = await PracticeSession.findOne(filter).sort({ updatedAt: -1 });

    if (!session) {
      return res.json({ success: true, session: null, questions: [] });
    }

    const enrichedQuestions = (session.questions || []).map(q => {
      const qObj = q.toObject ? q.toObject() : q;
      return {
        ...qObj,
        hints: buildProgressiveHints(qObj),
      };
    });

    res.json({
      success: true,
      session,
      questions: enrichedQuestions,
      readinessScore: session.readinessScore || 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Generate tailored interview questions & answers based on selected job JD and resume.
 */
export const generateQuestions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { jobId, resumeId: reqResumeId, refresh = false, category = 'all' } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Resolve resume
    let resume = null;
    if (reqResumeId) {
      resume = await Resume.findOne({ _id: reqResumeId, userId });
    }
    if (!resume) {
      resume = await Resume.findOne({ userId, isPrimary: true }) || await Resume.findOne({ userId }).sort({ createdAt: -1 });
    }

    const resumeId = resume ? resume._id : null;

    // Check if we already have a session and refresh is not forced
    if (!refresh && resumeId) {
      const existing = await PracticeSession.findOne({ userId, jobId, resumeId });
      if (existing && existing.questions && existing.questions.length > 0) {
        const cachedEnriched = existing.questions.map(q => {
          const qObj = q.toObject ? q.toObject() : q;
          return {
            ...qObj,
            hints: buildProgressiveHints(qObj),
          };
        });
        return res.json({
          success: true,
          cached: true,
          session: existing,
          questions: cachedEnriched,
          readinessScore: existing.readinessScore,
        });
      }
    }

    // Generate fresh questions tailored to JD + Resume
    const generatedQuestions = await generateQuestionsForJobAndResume({
      job,
      resume,
      category,
    });

    // Save or update PracticeSession
    let session = await PracticeSession.findOne({ userId, jobId, resumeId });
    if (!session) {
      session = new PracticeSession({
        userId,
        jobId,
        resumeId: resumeId || jobId, // fallback if user has no resume yet
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        resumeName: resume ? (resume.resumeName || resume.originalFileName) : 'Default Profile',
        matchScore: job.matchScore || 0,
        matchedSkills: job.matchedSkills || [],
        missingSkills: job.missingSkills || [],
        questions: generatedQuestions,
        readinessScore: 0,
        lastGeneratedAt: new Date(),
      });
    } else {
      // Preserve any user status/notes for questions with identical titles
      const oldNotesMap = {};
      session.questions.forEach(q => {
        if (q.userStatus !== 'unattempted' || q.userNotes) {
          oldNotesMap[q.title] = { status: q.userStatus, notes: q.userNotes };
        }
      });

      session.questions = generatedQuestions.map(q => ({
        ...q,
        userStatus: oldNotesMap[q.title]?.status || 'unattempted',
        userNotes: oldNotesMap[q.title]?.notes || '',
      }));
      session.lastGeneratedAt = new Date();
    }

    await session.save();

    res.json({
      success: true,
      cached: false,
      session,
      questions: session.questions,
      readinessScore: session.readinessScore,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Update individual question practice status or personal notes.
 */
export const updateQuestionProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { questionId } = req.params;
    const { jobId, resumeId, userStatus, userNotes } = req.body;

    if (!jobId || !questionId) {
      return res.status(400).json({ success: false, message: 'jobId and questionId are required' });
    }

    const session = await PracticeSession.findOne({ userId, jobId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found' });
    }

    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found in session' });
    }

    if (userStatus && ['unattempted', 'practicing', 'mastered'].includes(userStatus)) {
      question.userStatus = userStatus;
      question.lastAttemptedAt = new Date();
    }

    if (userNotes !== undefined) {
      question.userNotes = String(userNotes);
    }

    // Recalculate readiness score
    const total = session.questions.length;
    if (total > 0) {
      const mastered = session.questions.filter(q => q.userStatus === 'mastered').length;
      const practicing = session.questions.filter(q => q.userStatus === 'practicing').length;
      session.readinessScore = Math.round(((mastered * 100) + (practicing * 50)) / total);
    }

    await session.save();

    res.json({
      success: true,
      message: 'Question progress updated',
      question,
      readinessScore: session.readinessScore,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Execute code in the interactive compiler / sandbox.
 */
export const executeCode = async (req, res, next) => {
  try {
    const { language = 'javascript', code = '', testCases = [] } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Code string is required' });
    }

    // Run code through safe isolated runtime
    const result = await runCode({ language, code, testCases });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Get overall practice stats for the current user.
 */
export const getPracticeStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const sessions = await PracticeSession.find({ userId });
    let totalQuestions = 0;
    let masteredCount = 0;
    let practicingCount = 0;
    let totalCodingProblems = 0;

    sessions.forEach(s => {
      s.questions.forEach(q => {
        totalQuestions++;
        if (q.userStatus === 'mastered') masteredCount++;
        if (q.userStatus === 'practicing') practicingCount++;
        if (q.category === 'coding') totalCodingProblems++;
      });
    });

    const averageReadiness = sessions.length
      ? Math.round(sessions.reduce((acc, s) => acc + (s.readinessScore || 0), 0) / sessions.length)
      : 0;

    res.json({
      success: true,
      stats: {
        totalSessions: sessions.length,
        totalQuestions,
        masteredCount,
        practicingCount,
        totalCodingProblems,
        readinessScore: averageReadiness,
      },
    });
  } catch (err) {
    next(err);
  }
};
