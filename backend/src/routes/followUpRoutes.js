import express from 'express';
import { getFollowUps, createFollowUp, updateFollowUp } from '../controllers/followUpController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/', getFollowUps);
router.post('/', createFollowUp);
router.put('/:id', updateFollowUp);
export default router;
