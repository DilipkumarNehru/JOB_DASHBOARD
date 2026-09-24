import express from 'express';
import Job from '../models/Job.js';
import Email from '../models/Email.js';
import FollowUp from '../models/FollowUp.js';
import Notification from '../models/Notification.js';
import { generateJobHash } from '../utils/duplicateDetector.js';
import { classifyEmail } from '../services/emailClassifierService.js';
import { matchEmailToApplication } from '../services/emailMatcherService.js';
import { generateCompletion } from '../integrations/openai/llmClient.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'job_dashboard_n8n_secret_token_2026';

const verifySecret = (req, res, next) => {
  const provided = req.headers['x-job-dashboard-secret'] || req.headers['x-n8n-secret'];
  if (provided !== WEBHOOK_SECRET) {
    // Allow internal calls without secret in dev mode when n8n is not configured
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, message: 'Invalid webhook secret' });
    }
  }
  next();
};

// Health endpoint for n8n to confirm connectivity
router.get('/health', verifySecret, (req, res) => {
  res.json({ success: true, message: 'Job dashboard webhook endpoint healthy', time: new Date().toISOString() });
});

// n8n -> Job Dashboard: resolve the dashboard user so workflows can attach data
router.get('/users', verifySecret, async (req, res, next) => {
  try {
    const UserModel = await import('../models/User.js');
    const user = await UserModel.default.findOne({}).sort({ createdAt: 1 }).select('_id email name');
    res.json({ success: true, userId: user ? String(user._id) : null, user });
  } catch (err) { next(err); }
});

// n8n -> Job Dashboard: push discovered jobs
router.post('/jobs', verifySecret, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    let created = 0, duplicates = 0;
    for (const item of items) {
      const uniqueHash = generateJobHash(item.companyName, item.jobTitle, item.jobUrl);
      const existing = await Job.findOne({ uniqueHash });
      if (existing) { duplicates++; continue; }
      const job = await Job.create({ ...item, uniqueHash });
      created++;
      const { notifyNewJob } = await import('../services/notificationService.js');
      await notifyNewJob(job);
    }
    res.status(200).json({ success: true, created, duplicates, message: `Created ${created} jobs (${duplicates} duplicates skipped)` });
  } catch (err) { next(err); }
});

// n8n -> Job Dashboard: push synced emails (already classified)
router.post('/emails', verifySecret, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    let synced = 0, skipped = 0, linked = 0;
    const UserModel = await import('../models/User.js');
    const fallbackUser = await UserModel.default.findOne({}).sort({ createdAt: 1 }).select('_id');
    for (const item of items) {
      const userId = item.userId || (fallbackUser ? String(fallbackUser._id) : null);
      if (!userId) { skipped++; continue; }
      const existing = await Email.findOne({ userId, gmailMessageId: item.gmailMessageId });
      if (existing) { skipped++; continue; }
      const classification = await classifyEmail(item);
      const email = await Email.create({
        userId,
        gmailMessageId: item.gmailMessageId,
        threadId: item.threadId,
        sender: item.sender,
        senderEmail: item.senderEmail,
        recipient: item.recipient,
        subject: item.subject,
        bodySnippet: item.bodySnippet,
        bodyFull: (item.bodyFull || '').slice(0, 3000),
        receivedAt: item.receivedAt,
        labels: item.labels || [],
        category: classification.category || item.category || 'OTHER',
        aiConfidence: classification.confidence || 0,
        companyName: classification.companyName || '',
        jobRole: classification.jobRole || '',
        classificationReason: classification.classificationReason || '',
        status: 'unlinked'
      });
      synced++;
      const match = await matchEmailToApplication(email);
      if (match.linked) linked++;
    }
    res.json({ success: true, synced, skipped, linked });
  } catch (err) { next(err); }
});

// n8n -> Job Dashboard: create follow-up reminders
router.post('/followups', verifySecret, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    let created = 0;
    for (const item of items) {
      const { userId, applicationId, company, role, dueDate, nextAction } = item;
      await FollowUp.create({ userId, applicationId, company, role, dueDate, nextAction });
      await Notification.create({
        userId,
        type: 'FOLLOW_UP_DUE',
        title: 'Follow-up due',
        message: `Follow-up for ${company} (${role}) is due on ${new Date(dueDate).toDateString()}`,
        link: '/follow-ups',
        metadata: { company, role }
      });
      created++;
    }
    res.json({ success: true, created });
  } catch (err) { next(err); }
});

// n8n -> Job Dashboard: query new jobs for workflow processing
router.post('/jobs/query', verifySecret, async (req, res, next) => {
  try {
    const { matchScore, limit = 20, status } = req.body;
    const filter = {};
    if (matchScore) filter.matchScore = { $gte: matchScore };
    if (status) filter.status = status;
    let query = Job.find(filter).sort({ matchScore: -1, postedDate: -1 }).limit(limit);
    const userId = req.body.userId || req.query.userId;
    if (userId) {
      query = query.limit(limit);
    }
    const jobs = await query;
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) { next(err); }
});

// Job Dashboard -> n8n: trigger a workflow
router.post('/trigger', async (req, res, next) => {
  try {
    const { workflow, payload } = req.body;
    const { triggerN8nWorkflow } = await import('../integrations/n8n/webhookHandler.js');
    const result = await triggerN8nWorkflow(workflow, payload || {});
    res.json(result);
  } catch (err) { next(err); }
});

// Simulated AI classification endpoint used by n8n workflows
router.post('/ai/classify', verifySecret, async (req, res, next) => {
  try {
    const { text, type } = req.body;
    const result = await generateCompletion({
      systemPrompt: type === 'email'
        ? 'Classify email into one of: INTERVIEW, SHORTLIST, REJECTION, OFFER, ASSESSMENT, RECRUITER_CONTACT, JOB_OPENING, FOLLOW_UP, JOB_APPLICATION, ONBOARDING, COURSE, CERTIFICATION, PROMOTION, SOCIAL, NEWSLETTER, OTHER. Extract companyName, jobRole, confidence. Return JSON.'
        : 'Extract key skills from job description. Return JSON with skills[].',
      userPrompt: (text || '').slice(0, 3000),
      temperature: 0.2,
      responseFormat: 'json_object'
    });
    res.json({ success: true, result });
  } catch (err) { next(err); }
});

export default router;