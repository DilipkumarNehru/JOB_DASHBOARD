import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const resumeService = {
  upload: (formData) => api.post('/resumes', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  getAll: () => api.get('/resumes'),
  get: (id) => api.get(`/resumes/${id}`),
  update: (id, parsedProfile) => api.put(`/resumes/${id}`, { parsedProfile }),
  analyze: (id) => api.post(`/resumes/${id}/analyze`),
  atsScore: (id) => api.get(`/resumes/${id}/ats-score`),
  customize: (id, data) => api.post(`/resumes/${id}/customize`, data),
  delete: (id) => api.delete(`/resumes/${id}`),
  versions: (id) => api.get(`/resumes/${id}/versions`),
  // Returns the URL for the original uploaded file (PDF preview iframe)
  fileUrl: (id) => `/api/resumes/${id}/file`,
  downloadPdf: (id) => `/api/resumes/${id}/download.pdf`,
  getVersion: (versionId) => api.get(`/resumes/versions/${versionId}`),
  setVersionPrimary: (versionId) => api.put(`/resumes/versions/${versionId}/primary`),
  deleteVersion: (versionId) => api.delete(`/resumes/versions/${versionId}`),
  downloadVersionPdf: (versionId) => `/api/resumes/versions/${versionId}/download.pdf`,
};

export const jobService = {
  getAll: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  remove: (id) => api.delete(`/jobs/${id}`),
  match: (id) => api.post(`/jobs/${id}/match`, {}, { timeout: 120000 }),
  recommended: () => api.get('/jobs/recommended'),
  sources: () => api.get('/jobs/sources'),
  discover: (data) => api.post('/jobs/discover', data, { timeout: 180000 }),
  scanCompanies: () => api.post('/jobs/scan-companies', {}, { timeout: 120000 }),
};

export const applicationService = {
  getAll: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
};

export const followUpService = {
  getAll: (params) => api.get('/followups', { params }),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
};

export const emailService = {
  getAll: (params) => api.get('/emails', { params }),
  get: (id) => api.get(`/emails/${id}`),
  categories: () => api.get('/emails/categories'),
  sync: (data) => api.post('/emails/sync', data),
  relink: () => api.post('/emails/relink'),
  updateCategory: (id, data) => api.put(`/emails/${id}/category`, data),
  markRead: (id, read) => api.put(`/emails/${id}/read`, { read }),
  link: (id, data) => api.post(`/emails/${id}/link`, data),
  deleteAll: () => api.delete('/emails/delete-all'),
};

export const companyService = {
  getAll: () => api.get('/companies'),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  remove: (id) => api.delete(`/companies/${id}`),
  scanOne: (id) => api.post(`/companies/${id}/scan`, {}, { timeout: 180000 }),
  jobs: (id) => api.get(`/companies/${id}/jobs`),
};

export const interviewService = {
  getAll: (params) => api.get('/interviews', { params }),
  create: (data) => api.post('/interviews', data),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  remove: (id) => api.delete(`/interviews/${id}`),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const analyticsService = {
  stats: () => api.get('/analytics'),
  monthly: () => api.get('/analytics/monthly'),
  skills: () => api.get('/analytics/skills'),
  applications: () => api.get('/analytics/applications'),
  statusDistribution: () => api.get('/analytics/status-distribution'),
  companies: () => api.get('/analytics/companies'),
  jobsBy: (field) => api.get('/analytics/jobs-by', { params: { field } }),
  jobs: () => api.get('/analytics/jobs'),
  insights: () => api.get('/analytics/insights'),
  emails: () => api.get('/analytics/emails'),
  followUps: () => api.get('/analytics/followups'),
};

export const gmailService = {
  getAuthUrl: () => api.get('/gmail/auth'),
  status: () => api.get('/gmail/status'),
  sync: (data) => api.post('/gmail/sync', data),
  disconnect: () => api.post('/gmail/disconnect'),
};

export const n8nService = {
  trigger: (data) => api.post('/n8n/trigger', data),
};