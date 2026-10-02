import express from 'express';
import {
  getJobs, getJob, createJob, updateJob, deleteJob, matchJob,
  getRecommended, discoverJobs, getJobSources, scanCompanies,
  getPrimaryResumeJobs, getJobMatchDetails, recalculateAllMatches, getJobStats
} from '../controllers/jobController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// Discovery & special routes (before /:id)
router.get('/recommended', getRecommended);
router.get('/sources', getJobSources);
router.get('/primary-resume', getPrimaryResumeJobs);
router.get('/stats', getJobStats);
router.post('/discover', discoverJobs);
router.post('/scan-companies', scanCompanies);
router.post('/recalculate-matches', recalculateAllMatches);

// CRUD
router.get('/', getJobs);
router.post('/', createJob);
router.get('/:id', getJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);
router.post('/:id/match', matchJob);
router.get('/:id/match-details', getJobMatchDetails);

export default router;
