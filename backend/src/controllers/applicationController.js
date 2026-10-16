import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import AuthLog from '../models/AuthLog.js';

export const getApplications = async (req, res, next) => {
  try {
    const { status, company, page = 1, limit = 20, group, userId } = req.query;
    const filter = {};

    if (req.user.role === 'admin') {
      if (userId) filter.userId = userId;
    } else {
      filter.userId = req.user.id;
    }

    if (group === 'inProgress' || status === 'In Progress' || status === 'in-progress' || status === 'inProgress') {
      filter.status = { $in: ['Applied', 'Application Viewed', 'Recruiter Contacted', 'Assessment'] };
    } else if (group === 'interviews' || status === 'Interview' || status === 'interviews') {
      filter.status = { $in: ['Interview Scheduled', 'Technical Interview', 'HR Interview'] };
    } else if (group === 'rejected' || status === 'Rejected' || status === 'rejected') {
      filter.status = { $in: ['Rejected', 'Withdrawn'] };
    } else if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        filter.status = status;
      }
    }

    if (company) filter.company = new RegExp(company, 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const targetUserMatch = filter.userId ? { userId: filter.userId } : {};

    const [applications, total, totalUserApps, statusAgg] = await Promise.all([
      Application.find(filter)
        .populate('userId', 'name email role title')
        .populate('jobId', 'jobTitle companyName matchScore location')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Application.countDocuments(filter),
      Application.countDocuments(targetUserMatch),
      Application.aggregate([
        ...(filter.userId ? [{ $match: targetUserMatch }] : []),
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const statusCounts = (statusAgg || []).reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const inProgressCount = (statusCounts['Applied'] || 0) + (statusCounts['Application Viewed'] || 0) + (statusCounts['Recruiter Contacted'] || 0) + (statusCounts['Assessment'] || 0);
    const interviewsCount = (statusCounts['Interview Scheduled'] || 0) + (statusCounts['Technical Interview'] || 0) + (statusCounts['HR Interview'] || 0);
    const rejectedCount = (statusCounts['Rejected'] || 0) + (statusCounts['Withdrawn'] || 0);

    res.json({
      success: true,
      count: applications.length,
      total,
      totalUserApps,
      statusCounts: {
        ...statusCounts,
        inProgress: inProgressCount,
        interviews: interviewsCount,
        rejected: rejectedCount,
      },
      applications
    });
  } catch (err) { next(err); }
};

export const createApplication = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const existing = await Application.findOne({ userId: req.user.id, jobId });
    if (existing) return res.status(409).json({ success: false, message: 'Application already exists', application: existing });
    const job = await Job.findById(jobId);
    const app = await Application.create({
      userId: req.user.id,
      jobId,
      company: job?.companyName || req.body.company,
      role: job?.jobTitle || req.body.role,
      ...req.body,
      timeline: [{ status: req.body.status || 'Applied', date: new Date(), note: 'Application created' }]
    });
    if (job) await Job.findByIdAndUpdate(jobId, { status: 'applied' });

    // Track user activity
    AuthLog.create({
      userId: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      action: 'application_create',
      status: 'success',
      details: {
        applicationId: app._id,
        company: app.company,
        role: app.role,
        status: app.status
      }
    }).catch(() => {});

    res.status(201).json({ success: true, application: app });
  } catch (err) { next(err); }
};

export const getApplication = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const app = await Application.findOne(filter)
      .populate('userId', 'name email role title')
      .populate('jobId')
      .populate('emails')
      .populate('interviews');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, application: app });
  } catch (err) { next(err); }
};

export const updateApplication = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const app = await Application.findOne(filter);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    if (req.body.status && req.body.status !== app.status) {
      app.timeline.push({ status: req.body.status, date: new Date(), note: req.body.statusNote || '' });
    }
    Object.assign(app, req.body);
    await app.save();

    // Track user activity
    AuthLog.create({
      userId: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      action: 'application_update',
      status: 'success',
      details: {
        applicationId: app._id,
        company: app.company,
        role: app.role,
        status: app.status
      }
    }).catch(() => {});

    res.json({ success: true, application: app });
  } catch (err) { next(err); }
};
