import mongoose from 'mongoose';
import User from '../models/User.js';
import AuthLog from '../models/AuthLog.js';
import Resume from '../models/Resume.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import JobMatch from '../models/JobMatch.js';
import Interview from '../models/Interview.js';
import FollowUp from '../models/FollowUp.js';
import { encryptSecret, decryptSecret } from '../utils/encryptionUtil.js';

// Helper: calculate online threshold (users active in the last 15 minutes)
const getOnlineThreshold = () => new Date(Date.now() - 15 * 60 * 1000);

/* ─── 1. Admin System Stats & Live Overview ────────────────────────── */
export const getAdminStats = async (req, res, next) => {
  try {
    const onlineThreshold = getOnlineThreshold();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      totalResumes,
      totalJobs,
      totalApplications,
      logins24h,
      failedLogins24h,
      totalLogs,
      liveLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: { $ne: 'suspended' } }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: 'admin' }),
      Resume.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      AuthLog.countDocuments({ action: 'login', status: 'success', createdAt: { $gte: last24h } }),
      AuthLog.countDocuments({ action: 'failed_login', createdAt: { $gte: last24h } }),
      AuthLog.countDocuments(),
      AuthLog.find({ isLive: true, lastActiveAt: { $gte: onlineThreshold } })
        .populate('userId', 'name email role title')
        .sort({ lastActiveAt: -1 })
        .limit(50),
    ]);

    // Distinct live users from logs or user records
    const liveUserIds = liveLogs.map(l => l.userId?._id?.toString() || l.userId?.toString()).filter(Boolean);
    const liveUsersFromUserTable = await User.countDocuments({
      isOnline: true,
      lastActiveAt: { $gte: onlineThreshold },
    });

    const liveUsersCount = Math.max(liveLogs.length, liveUsersFromUserTable);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          admins: adminUsers,
          live: liveUsersCount,
        },
        entities: {
          resumes: totalResumes,
          jobs: totalJobs,
          applications: totalApplications,
        },
        activity: {
          logins24h,
          failedLogins24h,
          totalLogs,
        },
      },
      liveSessions: liveLogs.map(log => ({
        id: log._id,
        user: log.userId || { name: log.name, email: log.email, role: log.role },
        email: log.email,
        name: log.name,
        role: log.role,
        ipAddress: log.ipAddress,
        browser: log.browser,
        os: log.os,
        device: log.device,
        loginAt: log.loginAt,
        lastActiveAt: log.lastActiveAt,
        minutesActive: log.loginAt ? Math.round((Date.now() - new Date(log.loginAt).getTime()) / 60000) : 0,
      })),
    });
  } catch (err) { next(err); }
};

/* ─── 2. Get All Users (with search, pagination, stats) ─────────────── */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = (req.query.search || '').trim();
    const role = req.query.role; // 'admin' | 'user' | 'all'
    const status = req.query.status; // 'active' | 'suspended' | 'all'
    const online = req.query.online; // 'online' | 'offline' | 'all'

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const onlineThreshold = getOnlineThreshold();
    if (online === 'online') {
      filter.isOnline = true;
      filter.lastActiveAt = { $gte: onlineThreshold };
    } else if (online === 'offline') {
      filter.$or = [
        { isOnline: false },
        { isOnline: { $exists: false } },
        { lastActiveAt: { $lt: onlineThreshold } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('+encryptedPassword -password -gmailTokens -gmailTokensEncrypted')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Attach resume count and application count for each user
    const userIds = users.map(u => u._id);
    const [resumeCounts, appCounts, activeSessions] = await Promise.all([
      Resume.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      AuthLog.find({
        userId: { $in: userIds },
        isLive: true,
        lastActiveAt: { $gte: onlineThreshold },
      }),
    ]);

    const resumeCountMap = {};
    resumeCounts.forEach(r => { resumeCountMap[r._id.toString()] = r.count; });

    const appCountMap = {};
    appCounts.forEach(a => { appCountMap[a._id.toString()] = a.count; });

    const activeSessionMap = {};
    activeSessions.forEach(s => { activeSessionMap[s.userId.toString()] = s; });

    const enrichedUsers = users.map(u => {
      const uObj = u.toObject();
      const isActuallyLive = u.isOnline && u.lastActiveAt && new Date(u.lastActiveAt) >= onlineThreshold;
      const plainPassword = u.encryptedPassword ? decryptSecret(u.encryptedPassword) : null;
      delete uObj.encryptedPassword;
      return {
        ...uObj,
        isOnline: Boolean(isActuallyLive),
        decryptedPassword: plainPassword || null,
        hasDecryptedPassword: Boolean(plainPassword),
        resumesCount: resumeCountMap[u._id.toString()] || 0,
        applicationsCount: appCountMap[u._id.toString()] || 0,
        activeSession: activeSessionMap[u._id.toString()] || null,
      };
    });

    res.json({
      success: true,
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
};

/* ─── 3. Get Single User Details & Complete User Dashboard Data ───── */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+password +encryptedPassword -gmailTokens -gmailTokensEncrypted');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [
      resumes,
      applications,
      recentLogs,
      jobMatchesCount,
      highMatchesCount,
      topMatches,
      interviews,
      followUps,
    ] = await Promise.all([
      Resume.find({ userId: user._id }).sort({ isPrimary: -1, createdAt: -1 }),
      Application.find({ userId: user._id }).sort({ createdAt: -1 }),
      AuthLog.find({ userId: user._id }).sort({ createdAt: -1 }).limit(30),
      JobMatch.countDocuments({ userId: user._id }),
      JobMatch.countDocuments({ userId: user._id, overallMatch: { $gte: 75 } }),
      JobMatch.find({ userId: user._id })
        .populate('jobId', 'jobTitle companyName location salary source jobUrl careerPageUrl companyWebsite skills')
        .sort({ overallMatch: -1 })
        .limit(20),
      Interview.find({ userId: user._id }).sort({ scheduledDate: -1 }).limit(5),
      FollowUp.find({ userId: user._id }).sort({ dueDate: -1 }).limit(5),
    ]);

    const onlineThreshold = getOnlineThreshold();
    const isLive = Boolean(user.isOnline && user.lastActiveAt && new Date(user.lastActiveAt) >= onlineThreshold);

    // Calculate user dashboard metrics summary
    const primaryResume = resumes.find(r => r.isPrimary) || resumes[0] || null;
    const scoredResumes = resumes.filter(r => r.atsScore !== null && r.atsScore !== undefined);
    const avgAtsScore = scoredResumes.length ? Math.round(scoredResumes.reduce((a, b) => a + b.atsScore, 0) / scoredResumes.length) : null;

    const applicationStatusCounts = {
      applied: applications.filter(a => a.status === 'applied').length,
      screening: applications.filter(a => a.status === 'screening').length,
      interviewing: applications.filter(a => a.status === 'interviewing').length,
      offer: applications.filter(a => a.status === 'offer').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    };

    const plainPassword = user.encryptedPassword ? decryptSecret(user.encryptedPassword) : null;
    const userObj = user.toObject();
    delete userObj.encryptedPassword;

    res.json({
      success: true,
      user: {
        ...userObj,
        isOnline: isLive,
        decryptedPassword: plainPassword || null,
        hasDecryptedPassword: Boolean(plainPassword),
      },
      dashboard: {
        metrics: {
          totalResumes: resumes.length,
          primaryResumeName: primaryResume ? (primaryResume.resumeName || primaryResume.originalFileName) : 'None',
          avgAtsScore,
          totalJobMatches: jobMatchesCount,
          highJobMatches: highMatchesCount,
          totalApplications: applications.length,
          applicationStatusCounts,
          totalInterviews: interviews.length,
          totalFollowUps: followUps.length,
          gmailConnected: user.gmailConnected,
          gmailEmail: user.gmailEmail,
        },
        topMatches,
        interviews,
        followUps,
      },
      resumes,
      applications,
      recentLogs,
    });
  } catch (err) { next(err); }
};

/* ─── 4. Update User Profile & Role / Status ───────────────────────── */
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, status, title, location, phone, experienceYears } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // If changing email, check uniqueness
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
      user.email = email.toLowerCase();
    }

    if (name) user.name = name.trim();
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (status && ['active', 'suspended'].includes(status)) {
      user.status = status;
      // If suspended, kick them out of live sessions
      if (status === 'suspended') {
        user.isOnline = false;
        await AuthLog.updateMany(
          { userId: user._id, isLive: true },
          { $set: { isLive: false, logoutAt: new Date(), failureReason: 'Account suspended by admin' } }
        );
      }
    }
    if (title !== undefined) user.title = title;
    if (location !== undefined) user.location = location;
    if (phone !== undefined) user.phone = phone;
    if (experienceYears !== undefined) user.experienceYears = Number(experienceYears) || 0;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        title: user.title,
        location: user.location,
        phone: user.phone,
        experienceYears: user.experienceYears,
      },
    });
  } catch (err) { next(err); }
};

/* ─── 5. Admin Change/Reset User Password ──────────────────────────── */
export const changeUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.params.id).select('+password +encryptedPassword');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Setting user.password triggers the UserSchema.pre('save') bcrypt hashing
    // and encryptedPassword stores the reversible AES-256 encrypted password
    user.password = newPassword;
    user.encryptedPassword = encryptSecret(newPassword);
    await user.save();

    // Log the password change in AuthLog
    await AuthLog.create({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      action: 'password_change',
      status: 'success',
      details: {
        changedBy: 'admin',
        adminId: req.user._id,
        adminEmail: req.user.email,
      },
    });

    res.json({
      success: true,
      message: `Password for user "${user.name}" (${user.email}) changed successfully.`,
      decryptedPassword: newPassword,
    });
  } catch (err) { next(err); }
};

/* ─── 6. Delete User ───────────────────────────────────────────────── */
export const deleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own administrative account' });
    }

    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent deleting the last remaining admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the only remaining administrator' });
      }
    }

    // Cascade delete user data
    await Promise.all([
      User.findByIdAndDelete(targetUserId),
      Resume.deleteMany({ userId: targetUserId }),
      Application.deleteMany({ userId: targetUserId }),
      JobMatch.deleteMany({ userId: targetUserId }),
      AuthLog.deleteMany({ userId: targetUserId }),
    ]);

    res.json({
      success: true,
      message: `User "${user.name}" (${user.email}) and all associated data deleted successfully.`,
    });
  } catch (err) { next(err); }
};

/* ─── 7. Get Login & Logout Logs (Filterable, Paginated) ───────────── */
export const getAuthLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const action = req.query.action; // 'login' | 'logout' | 'failed_login' | 'all'
    const status = req.query.status; // 'success' | 'failed' | 'all'
    const isLive = req.query.isLive; // 'true' | 'false' | 'all'
    const search = (req.query.search || '').trim();

    const filter = {};

    if (action && action !== 'all') {
      filter.action = action;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (isLive === 'true') {
      filter.isLive = true;
    } else if (isLive === 'false') {
      filter.isLive = false;
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { browser: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await AuthLog.countDocuments(filter);
    const logs = await AuthLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
};

/* ─── 8. Get Live/Online Users Only ────────────────────────────────── */
export const getLiveUsers = async (req, res, next) => {
  try {
    const onlineThreshold = getOnlineThreshold();

    // Get live logs
    const liveLogs = await AuthLog.find({
      isLive: true,
      lastActiveAt: { $gte: onlineThreshold },
    })
      .populate('userId', 'name email role title location')
      .sort({ lastActiveAt: -1 });

    // Also get any users marked isOnline in DB
    const onlineUsers = await User.find({
      isOnline: true,
      lastActiveAt: { $gte: onlineThreshold },
    }).select('-password -gmailTokens');

    res.json({
      success: true,
      count: Math.max(liveLogs.length, onlineUsers.length),
      liveLogs,
      onlineUsers,
    });
  } catch (err) { next(err); }
};

/* ─── 9. Force Logout a User ───────────────────────────────────────── */
export const forceLogoutUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isOnline = false;
    user.lastActiveAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Close all live logs for this user
    await AuthLog.updateMany(
      { userId: targetUserId, isLive: true },
      {
        $set: {
          isLive: false,
          logoutAt: new Date(),
          failureReason: `Force logged out by admin (${req.user.email})`,
        },
      }
    );

    // Create a force logout record
    await AuthLog.create({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      action: 'force_logout',
      status: 'success',
      isLive: false,
      details: {
        forcedBy: req.user.email,
        forcedById: req.user._id,
      },
    });

    res.json({
      success: true,
      message: `User "${user.name}" (${user.email}) has been force logged out.`,
    });
  } catch (err) { next(err); }
};

/* ─── Admin: Get All Jobs (global, not user-scoped) ─────────────── */
export const getAllJobsAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      source,
      location,
      sortBy = 'latest',
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') filter.status = status;
    if (source && source !== 'all') filter.source = source;
    if (location && location !== 'all') filter.location = { $regex: location, $options: 'i' };

    let sortObj = { createdAt: -1, postedDate: -1 };
    if (sortBy === 'ats') {
      sortObj = { matchScore: -1, createdAt: -1 };
    } else if (sortBy === 'posted') {
      sortObj = { postedDate: -1, createdAt: -1 };
    } else if (sortBy === 'company') {
      sortObj = { companyName: 1, createdAt: -1 };
    } else {
      sortObj = { createdAt: -1, postedDate: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Job.countDocuments(filter),
    ]);

    // Enrich with JobMatch ATS scores & skills
    const jobIds = jobs.map((j) => j._id);
    const matches = await JobMatch.find({ jobId: { $in: jobIds } })
      .sort({ overallMatch: -1 })
      .lean();

    const matchByJob = {};
    for (const m of matches) {
      const jIdStr = m.jobId?.toString();
      // Prioritize admin's own resume match or highest overallMatch
      if (!matchByJob[jIdStr] || (req.user && m.userId?.toString() === req.user._id?.toString())) {
        matchByJob[jIdStr] = m;
      }
    }

    const enrichedJobs = jobs.map((j) => {
      const match = matchByJob[j._id?.toString()];
      const matchScore = match?.overallMatch ?? j.matchScore ?? 0;
      const matchedSkills = (match?.matchedSkills && match.matchedSkills.length > 0)
        ? match.matchedSkills
        : (j.matchedSkills && j.matchedSkills.length > 0 ? j.matchedSkills : (j.skills || []).slice(0, 3));
      const missingSkills = (match?.missingSkills && match.missingSkills.length > 0)
        ? match.missingSkills
        : (j.missingSkills || []);
      return {
        ...j,
        matchScore,
        matchedSkills,
        missingSkills,
      };
    });

    res.json({
      success: true,
      jobs: enrichedJobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { next(err); }
};

/* ─── Admin: Delete Any Job ─────────────────────────────────────── */
export const deleteJobAdmin = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    // Also remove associated job matches
    await JobMatch.deleteMany({ jobId: req.params.id });
    res.json({ success: true, message: `Job "${job.jobTitle}" at ${job.companyName} deleted.` });
  } catch (err) { next(err); }
};
