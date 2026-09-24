import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';

export const getApplications = async (req, res, next) => {
  try {
    const { status, company, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (company) filter.company = new RegExp(company, 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total] = await Promise.all([
      Application.find(filter).populate('jobId', 'jobTitle companyName matchScore location').sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Application.countDocuments(filter)
    ]);
    res.json({ success: true, count: applications.length, total, applications });
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
    res.status(201).json({ success: true, application: app });
  } catch (err) { next(err); }
};

export const getApplication = async (req, res, next) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('jobId').populate('emails').populate('interviews');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, application: app });
  } catch (err) { next(err); }
};

export const updateApplication = async (req, res, next) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.user.id });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    if (req.body.status && req.body.status !== app.status) {
      app.timeline.push({ status: req.body.status, date: new Date(), note: req.body.statusNote || '' });
    }
    Object.assign(app, req.body);
    await app.save();
    res.json({ success: true, application: app });
  } catch (err) { next(err); }
};
