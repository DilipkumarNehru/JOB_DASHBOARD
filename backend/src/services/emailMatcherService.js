import Email from '../models/Email.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { logger } from '../utils/logger.js';

const similarity = (a, b) => {
  if (!a || !b) return 0;
  const norm = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.85;
  const aWords = new Set(x.split(/\s+/));
  const bWords = new Set(y.split(/\s+/));
  const common = [...aWords].filter(w => bWords.has(w) && w.length > 2);
  return common.length / Math.max(aWords.size, bWords.size);
};

const WHITELISTED_CATEGORIES = [
  'INTERVIEW', 'SHORTLIST', 'REJECTION', 'ASSESSMENT',
  'RECRUITER_CONTACT', 'OFFER', 'FOLLOW_UP', 'JOB_APPLICATION', 'ONBOARDING'
];

export const matchEmailToApplication = async (email) => {
  const company = (email.companyName || '').toLowerCase();
  const role = (email.jobRole || '').toLowerCase();

  const applications = await Application.find({ userId: email.userId })
    .sort({ updatedAt: -1 })
    .limit(50);

  let best = null;
  let bestScore = 0;

  for (const app of applications) {
    let score = 0;
    if (company && app.company) {
      const s = similarity(company, app.company);
      if (s >= 0.65) score += s * 0.6;
    }
    if (role && app.role) {
      const s = similarity(role, app.role);
      if (s >= 0.5) score += s * 0.4;
    }
    if (score > bestScore) {
      bestScore = score;
      best = app;
    }
  }

  if (best && bestScore >= 0.5) {
    email.applicationId = best._id;
    email.jobId = best.jobId;
    email.status = 'linked';
    await email.save();

    if (!best.emails.includes(email._id)) {
      best.emails.push(email._id);
      await best.save();
    }

    if (email.category === 'SHORTLIST' && best.status !== 'Shortlisted') {
      best.status = 'Shortlisted';
      best.timeline.push({ status: 'Shortlisted', date: new Date(), note: 'Linked from email: ' + email.subject });
      await best.save();
    }
    if (email.category === 'REJECTION' && best.status !== 'Rejected') {
      best.status = 'Rejected';
      best.timeline.push({ status: 'Rejected', date: new Date(), note: 'Linked from email: ' + email.subject });
      await best.save();
    }
    if (email.category === 'INTERVIEW' && best.status !== 'Interview Scheduled') {
      best.status = 'Interview Scheduled';
      best.timeline.push({ status: 'Interview Scheduled', date: new Date(), note: 'Linked from email: ' + email.subject });
      await best.save();
    }

    logger.success(`Email ${email.gmailMessageId} linked to application ${best._id} (score ${bestScore.toFixed(2)})`);
    return { linked: true, score: bestScore, applicationId: best._id };
  }

  if (WHITELISTED_CATEGORIES.includes(email.category)) {
    email.status = 'needs_review';
    await email.save();
    logger.info(`Email ${email.gmailMessageId} could not be auto-linked - marked for review`);
    return { linked: false, status: 'needs_review' };
  }

  return { linked: false };
};

export const relinkAllUnlinkedEmails = async (userId) => {
  const emails = await Email.find({ userId, status: { $in: ['unlinked', 'needs_review'] } }).sort({ receivedAt: -1 });
  let linked = 0;
  for (const email of emails) {
    const result = await matchEmailToApplication(email);
    if (result.linked) linked++;
  }
  return { scanned: emails.length, linked };
};