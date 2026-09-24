import express from 'express';
import {
  getEmails, getEmail, getEmailCategories, updateEmailCategory, markEmailRead,
  linkEmailToApplication, syncEmails, relinkEmails, deleteAllEmails
} from '../controllers/emailController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/', getEmails);
router.get('/categories', getEmailCategories);
router.post('/sync', syncEmails);
router.post('/relink', relinkEmails);
router.delete('/delete-all', deleteAllEmails);
router.get('/:id', getEmail);
router.put('/:id/read', markEmailRead);
router.put('/:id/category', updateEmailCategory);
router.post('/:id/link', linkEmailToApplication);
export default router;