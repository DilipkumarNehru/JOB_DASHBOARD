import User from '../models/User.js';
import FollowUp from '../models/FollowUp.js';
import Notification from '../models/Notification.js';
import { logger } from '../utils/logger.js';

export const startScheduledJobs = () => {
  if (process.env.DISABLE_CRON === 'true') {
    logger.info('Scheduled jobs disabled (DISABLE_CRON=true)');
    return;
  }

  // Follow-up reminders every 30 minutes
  setInterval(async () => {
    try {
      const dueFollowUps = await FollowUp.find({
        dueDate: { $lte: new Date(Date.now() + 6 * 3600 * 1000) },
        status: 'pending',
        reminderSent: false
      }).limit(50);

      for (const fu of dueFollowUps) {
        await Notification.create({
          userId: fu.userId,
          type: 'FOLLOW_UP_DUE',
          title: fu.dueDate <= new Date() ? 'Follow-up overdue' : 'Follow-up due',
          message: `${fu.company} (${fu.role}) — ${fu.nextAction}`,
          link: '/follow-ups',
          metadata: { followUpId: fu._id, applicationId: fu.applicationId }
        });
        if (fu.dueDate <= new Date()) {
          fu.status = 'overdue';
        }
        fu.reminderSent = true;
        await fu.save();
      }
    } catch (err) {
      logger.error('Follow-up reminder job failed: ' + err.message);
    }
  }, 30 * 60 * 1000);

  // Gmail auto-sync for users with auto-sync enabled
  setInterval(async () => {
    try {
      const users = await User.find({ 'settings.autoSyncGmail': true, gmailConnected: true })
        .select('+gmailTokensEncrypted');
      for (const user of users) {
        const hours = user.settings.syncFrequencyHours || 6;
        const lastSync = user.lastGmailSync;
        if (lastSync && (Date.now() - new Date(lastSync).getTime()) < hours * 3600 * 1000) continue;

        logger.info(`Auto-syncing Gmail for user ${user.email}`);
        const { syncEmailsForUser } = await import('../services/gmailService.js');
        const stats = await syncEmailsForUser(user, { maxResults: 25, maxPages: 1 });
        logger.info(`Gmail auto-sync for ${user.email}: ${stats.totalFetched} fetched, ${stats.newEmails} new, ${stats.updatedEmails} updated`);
        user.lastGmailSync = new Date();
        await user.save();
      }
    } catch (err) {
      logger.error('Gmail auto-sync job failed: ' + err.message);
    }
  }, 60 * 60 * 1000);

  logger.info('Scheduled jobs started (follow-up reminders, gmail auto-sync)');
};