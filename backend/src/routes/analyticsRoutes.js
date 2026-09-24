import express from 'express';
import {
  getDashboardStats, getApplicationsByMonth, getStatusDistribution, getCompanyAnalytics,
  getJobsByMetric, getSkillsAnalytics, getApplicationsAnalytics, getJobsAnalytics,
  getFollowUpAnalytics, getInsights, getEmailAnalytics
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/', getDashboardStats);
router.get('/monthly', getApplicationsByMonth);
router.get('/skills', getSkillsAnalytics);
router.get('/applications', getApplicationsAnalytics);
router.get('/status-distribution', getStatusDistribution);
router.get('/companies', getCompanyAnalytics);
router.get('/jobs-by', getJobsByMetric);
router.get('/jobs', getJobsAnalytics);
router.get('/followups', getFollowUpAnalytics);
router.get('/emails', getEmailAnalytics);
router.get('/insights', getInsights);
export default router;