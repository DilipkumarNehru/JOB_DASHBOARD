import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const createNotification = async (userId, type, title, message, link = '', metadata = {}) => {
  try {
    const allowedTypes = [
      'HIGH_MATCH_JOB', 'INTERVIEW_UPCOMING', 'FOLLOW_UP_DUE', 'RECRUITER_EMAIL',
      'APPLICATION_SHORTLIST', 'APPLICATION_REJECTED', 'COMPANY_NEW_JOB',
      'RESUME_CUSTOMIZED', 'GMAIL_SYNC_COMPLETE'
    ];
    if (!allowedTypes.includes(type)) type = 'COMPANY_NEW_JOB';
    return await Notification.create({ userId, type, title, message, link, metadata });
  } catch (err) {
    console.error('[NotificationService]', err.message);
    return null;
  }
};

export const notifyNewJob = async (job) => {
  try {
    const users = await User.find({}).select('settings');
    for (const user of users) {
      const threshold = user.settings?.notifications?.highMatchThreshold || 85;
      if (job.matchScore >= threshold) {
        await createNotification(
          user._id,
          'HIGH_MATCH_JOB',
          `${job.matchScore}% match found`,
          `${job.jobTitle} at ${job.companyName} (${job.location || 'Remote'})`,
          `/jobs/${job._id}`,
          { jobId: job._id, company: job.companyName }
        );
      }
    }
  } catch (err) {
    console.error('[NotifyNewJob]', err.message);
  }
};