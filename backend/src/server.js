// JOB_DASHBOARD Backend Server
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
import adminRoutes from './routes/adminRoutes.js';
import http from 'http';
import practiceRoutes from './routes/practiceRoutes.js';
import callRoutes from './routes/callRoutes.js';
import { initCallSocket } from './socket/callSocket.js';
import { ensureAdminAccount } from './config/seedAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Bypass Express completely for Socket.IO requests so Express does not parse body or send 404
app.use((req, res, next) => {
  if (req.url && (req.url.startsWith('/socket.io') || req.url.startsWith('/api/socket.io'))) {
    return;
  }
  next();
});

// Security & logging middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// CORS
const configuredOrigin = process.env.FRONTEND_URL;
const allowedOrigins = configuredOrigin && configuredOrigin.includes(',')
  ? configuredOrigin.split(',').map((s) => s.trim())
  : [configuredOrigin || 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin
    if (!origin) return callback(null, true);
    // If FRONTEND_URL is set to wildcard or matches
    if (!configuredOrigin || configuredOrigin === '*' || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // Allow live domain dynamically
    return callback(null, true);
  },
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
app.use('/api/admin', adminRoutes);
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
app.use('/api/practice', practiceRoutes);
app.use('/api/calls', callRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Connect DB then start
connectDB().then(async () => {
  try {
    await ensureAdminAccount();
  } catch (err) {
    console.warn('[Admin] Seed error:', err.message);
  }
  try {
    const { syncUserApiKeysFromEnv } = await import('./config/seedUserApiKeys.js');
    await syncUserApiKeysFromEnv();
  } catch (err) {
    console.warn('[API Keys] Seed error:', err.message);
  }
  try {
    const { startScheduledJobs } = await import('./jobs/cronJobs.js');
    startScheduledJobs();
  } catch (err) {
    console.warn('[Cron] Could not start scheduled jobs:', err.message);
  }
  const server = http.createServer(app);
  const io = initCallSocket(server, process.env.FRONTEND_URL || 'http://localhost:5173');

  // Seamlessly support both /socket.io and /api/socket.io:
  // When running behind reverse proxies (e.g. Nginx on live domain) where only /api is proxied to Node,
  // rewriting /api/socket.io -> /socket.io allows Socket.IO to receive requests without any proxy changes!
  server.prependListener('request', (req, res) => {
    if (req.url && req.url.startsWith('/api/socket.io')) {
      req.url = req.url.replace('/api/socket.io', '/socket.io');
    }
  });

  server.prependListener('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/api/socket.io')) {
      req.url = req.url.replace('/api/socket.io', '/socket.io');
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Job Dashboard API running at http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🛡️ Admin API: http://localhost:${PORT}/api/admin/stats`);
    console.log(`📹 Video Calls & WebRTC Socket.IO signaling active on /socket.io`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
  });
});

