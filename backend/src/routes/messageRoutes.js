import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
} from '../controllers/messageController.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:userId', getMessages);
router.post('/:userId', sendMessage);
router.put('/:userId/read', markConversationRead);

export default router;

