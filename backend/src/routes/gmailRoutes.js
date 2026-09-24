import express from 'express';
import {
  getAuthUrl, handleCallback, getGmailStatus, syncGmail, disconnectGmail
} from '../controllers/gmailController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.get('/auth', protect, getAuthUrl);
router.get('/callback', handleCallback); // public: Google redirects here after consent
router.get('/status', protect, getGmailStatus);
router.post('/sync', protect, syncGmail);
router.post('/disconnect', protect, disconnectGmail);

export default router;