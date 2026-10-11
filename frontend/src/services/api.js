import axios from 'axios';

// Base timeout: 60s for most requests
// Individual requests override this (e.g. gmailService.sync uses 120s)
const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jd_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle network/timeout errors gracefully
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new Error('Request timed out. The operation is taking longer than expected. Please try again.'));
    }
    if (!error.response) {
      // Network error — backend might be down
      return Promise.reject(new Error('Cannot reach the server. Please check your connection or try again.'));
    }

    // Handle 401 — redirect to login (but not on auth pages)
    if (error.response?.status === 401) {
      const onAuthPage = window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register') ||
        window.location.pathname.startsWith('/reset-password') ||
        window.location.pathname.startsWith('/forgot-password');
      if (!onAuthPage) {
        localStorage.removeItem('jd_token');
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;