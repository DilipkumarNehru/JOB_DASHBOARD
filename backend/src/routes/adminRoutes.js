import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  getUserById,
  updateUser,
  changeUserPassword,
  deleteUser,
  getAuthLogs,
  getLiveUsers,
  forceLogoutUser,
  getAllApplications,
  getAllResumes,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Apply protect & adminOnly to all admin routes
router.use(protect, adminOnly);

// Stats & live monitoring
router.get('/stats', getAdminStats);
router.get('/live-users', getLiveUsers);

// Logs & Activities
router.get('/logs', getAuthLogs);
router.get('/activity', getAuthLogs);

// Cross-user Applications & Resumes
router.get('/applications', getAllApplications);
router.get('/resumes', getAllResumes);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.post('/users/:id/change-password', changeUserPassword);
router.post('/users/:id/force-logout', forceLogoutUser);
router.delete('/users/:id', deleteUser);

export default router;
