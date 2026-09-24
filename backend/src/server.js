import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import gmailRoutes from './routes/gmailRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import n8nRoutes from './routes/n8nRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security & logging middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiter on API routes
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Job Dashboard API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/n8n', n8nRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Connect DB then start
connectDB().then(async () => {
  try {
    const { startScheduledJobs } = await import('./jobs/cronJobs.js');
    startScheduledJobs();
  } catch (err) {
    console.warn('[Cron] Could not start scheduled jobs:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`\n🚀 Job Dashboard API running at http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
  });
});
