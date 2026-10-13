import mongoose from 'mongoose';
import Email from '../models/Email.js';
import Application from '../models/Application.js';
import { matchEmailToApplication, relinkAllUnlinkedEmails } from '../services/emailMatcherService.js';

export const getEmails = async (req, res, next) => {
  try {
    const { folder, category, status, company, sender, search, unread, page = 1, limit = 30 } = req.query;
    const filter = { userId: req.user.id };

    if (folder) {
      const f = String(folder).toLowerCase();
      if (f === 'primary') {
        filter.$and = [
          { labels: { $ne: 'SPAM' } },
          { labels: { $nin: ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'CATEGORY_UPDATES'] } }
        ];
      } else if (f === 'updates') {
        filter.labels = 'CATEGORY_UPDATES';
      } else if (f === 'promotions') {
        filter.$or = [{ labels: 'CATEGORY_PROMOTIONS' }, { category: 'PROMOTION' }];
      } else if (f === 'social') {
        filter.$or = [{ labels: 'CATEGORY_SOCIAL' }, { category: 'SOCIAL' }];
      } else if (f === 'spam') {
        filter.labels = 'SPAM';
      } else if (f === 'starred') {
        filter.labels = 'STARRED';
      }
      // 'all' includes all messages
    } else if (!search) {
      // Default view excludes SPAM
      filter.labels = { $ne: 'SPAM' };
    }

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

    const userObjId = new mongoose.Types.ObjectId(req.user.id);

    const [emails, total, folderAgg] = await Promise.all([
      Email.find(filter).populate('applicationId', 'company role status').sort({ receivedAt: -1 }).skip(skip).limit(maxLimit),
      Email.countDocuments(filter),
      Email.aggregate([
        { $match: { userId: userObjId } },
        {
          $group: {
            _id: null,
            all: { $sum: 1 },
            spam: { $sum: { $cond: [{ $in: ['SPAM', '$labels'] }, 1, 0] } },
            updates: { $sum: { $cond: [{ $in: ['CATEGORY_UPDATES', '$labels'] }, 1, 0] } },
            promotions: { $sum: { $cond: [{ $or: [{ $in: ['CATEGORY_PROMOTIONS', '$labels'] }, { $eq: ['$category', 'PROMOTION'] }] }, 1, 0] } },
            social: { $sum: { $cond: [{ $or: [{ $in: ['CATEGORY_SOCIAL', '$labels'] }, { $eq: ['$category', 'SOCIAL'] }] }, 1, 0] } },
            starred: { $sum: { $cond: [{ $in: ['STARRED', '$labels'] }, 1, 0] } },
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
            primary: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $not: [{ $in: ['SPAM', '$labels'] }] },
                      { $not: [{ $in: ['CATEGORY_UPDATES', '$labels'] }] },
                      { $not: [{ $in: ['CATEGORY_PROMOTIONS', '$labels'] }] },
                      { $not: [{ $in: ['CATEGORY_SOCIAL', '$labels'] }] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    const folderStats = folderAgg && folderAgg[0] ? folderAgg[0] : {
      all: total,
      primary: total,
      updates: 0,
      promotions: 0,
      social: 0,
      spam: 0,
      starred: 0,
      unread: 0,
    };

    res.json({
      success: true,
      count: emails.length,
      total,
      folderCounts: folderStats,
      emails
    });
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

export const toggleEmailStar = async (req, res, next) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, userId: req.user.id });
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

    const isStarred = (email.labels || []).includes('STARRED');
    if (isStarred) {
      email.labels = email.labels.filter(l => l !== 'STARRED');
    } else {
      email.labels = [...(email.labels || []), 'STARRED'];
    }
    await email.save();
    res.json({ success: true, email, isStarred: !isStarred });
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
    const user = await User.findById(req.user.id).select(
      '+gmailTokensEncrypted +apiKeys.openaiApiKeyEncrypted +apiKeys.googleClientSecretEncrypted +apiKeys.n8nWebhookSecretEncrypted'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.gmailConnected) {
      return res.status(400).json({
        success: false,
        message: 'Gmail is not connected. Please connect your Gmail account in the Gmail Inbox page first.'
      });
    }

    const { maxResults, maxPages, query } = req.body || {};
    const stats = await syncEmailsForUser(user, {
      maxResults: Math.min(parseInt(maxResults) || 25, 100),
      maxPages: Math.min(parseInt(maxPages) || 1, 5),
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
  } catch (err) {
    if (err && err.code === 'GOOGLE_NOT_CONFIGURED') {
      return res.status(503).json({ success: false, message: 'Google OAuth is not configured. Please set your Google credentials in Settings → API Keys.' });
    }
    if (err && (err.status === 403 || err.status === 401 || err.code === 'GOOGLE_TOKEN_REVOKED')) {
      return res.status(err.status || 401).json({ success: false, message: err.message || 'Gmail connection expired. Please reconnect your Google account.' });
    }
    logger.error('Email sync failed: ' + err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to sync emails. Please check your connection.',
    });
  }
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
