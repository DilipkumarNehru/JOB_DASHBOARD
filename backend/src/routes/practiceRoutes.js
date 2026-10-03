import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMatchedJobs,
  getPracticeSession,
  generateQuestions,
  updateQuestionProgress,
  executeCode,
  getPracticeStats,
} from '../controllers/practiceController.js';

const router = express.Router();

// All practice endpoints require authentication
router.use(protect);

router.get('/matched-jobs', getMatchedJobs);
router.get('/session', getPracticeSession);
router.post('/generate-questions', generateQuestions);
router.put('/questions/:questionId', updateQuestionProgress);
router.post('/execute', executeCode);
router.get('/stats', getPracticeStats);

export default router;
