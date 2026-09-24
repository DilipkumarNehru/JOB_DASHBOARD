import Email from '../models/Email.js';
import Application from '../models/Application.js';
import { matchEmailToApplication, relinkAllUnlinkedEmails } from '../services/emailMatcherService.js';

export const getEmails = async (req, res, next) => {
  try {
    const { category, status, company, sender, search, unread, page = 1, limit = 30 } = req.query;
    const filter = { userId: req.user.id };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (company) filter.companyName = new RegExp(company, 'i');
    if (sender) filter.sender = new RegExp(sender, 'i');
    if (unread === 'true') filter.isRead = false;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ sender: rx }, { senderEmail: rx }, { recipient: rx }, { subject: rx }, { bodySnippet: rx }, { bodyFull: rx }];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit) || 30, 100);
    const [emails, total] = await Promise.all([
      Email.find(filter).populate('applicationId', 'company role status').sort({ receivedAt: -1 }).skip(skip).limit(maxLimit),
      Email.countDocuments(filter)
    ]);
    res.json({ success: true, count: emails.length, total, emails });
  } catch (err) { next(err); }
};

export const markEmailRead = async (req, res, next) => {
  try {
    const read = req.body.read !== false;
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: read, readStatusChangedAt: new Date() },
      { new: true }
    ).populate('applicationId');
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    res.json({ success: true, email });
  } catch (err) { next(err); }
};

export const getEmail = async (req, res, next) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('applicationId');
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    res.json({ success: true, email });
  } catch (err) { next(err); }
};

export const getEmailCategories = async (req, res, next) => {
  try {
    const counts = await Email.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const total = await Email.countDocuments({ userId: req.user.id });
    res.json({ success: true, total, categories: counts });
  } catch (err) { next(err); }
};

export const updateEmailCategory = async (req, res, next) => {
  try {
    const email = await Email.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { category: req.body.category, status: req.body.status || 'ignored' },
      { new: true }
    );
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    res.json({ success: true, email });
  } catch (err) { next(err); }
};

export const linkEmailToApplication = async (req, res, next) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, userId: req.user.id });
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });
    if (req.body.applicationId) {
      const app = await Application.findOne({ _id: req.body.applicationId, userId: req.user.id });
      if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
      email.applicationId = app._id;
      email.jobId = app.jobId;
      email.status = 'linked';
      await email.save();
      if (!app.emails.includes(email._id)) {
        app.emails.push(email._id);
        await app.save();
      }
      return res.json({ success: true, email });
    }
    const result = await matchEmailToApplication(email);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const syncEmails = async (req, res, next) => {
  try {
    const { default: User } = await import('../models/User.js');
    const { syncEmailsForUser } = await import('../services/gmailService.js');
    const user = await User.findById(req.user.id).select('+gmailTokensEncrypted');

    const { maxResults, maxPages, query } = req.body || {};
    const stats = await syncEmailsForUser(user, {
      maxResults: Math.min(parseInt(maxResults) || 50, 100),
      maxPages: Math.min(parseInt(maxPages) || 2, 5),
      query: String(query || '').trim(),
    });

    user.lastGmailSync = new Date();
    await user.save();

    res.json({
      success: true,
      synced: stats.newEmails,
      totalFetched: stats.totalFetched,
      newEmails: stats.newEmails,
      updatedEmails: stats.updatedEmails,
      linked: stats.linked,
      message: `Synced ${stats.totalFetched} emails (${stats.newEmails} new, ${stats.updatedEmails} updated, ${stats.linked} auto-linked)`
    });
  } catch (err) { next(err); }
};

export const relinkEmails = async (req, res, next) => {
  try {
    const result = await relinkAllUnlinkedEmails(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const deleteAllEmails = async (req, res, next) => {
  try {
    const { deletedCount } = await Email.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: `Deleted ${deletedCount} emails from local storage` });
  } catch (err) { next(err); }
};
