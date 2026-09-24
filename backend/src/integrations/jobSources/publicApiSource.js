import axios from 'axios';
import { logger } from '../../utils/logger.js';
import { ALL_SKILLS } from '../../utils/skillDictionary.js';

export const fetchRemoteOKJobs = async (limit = 20) => {
  try {
    const res = await axios.get('https://remoteok.com/api', {
      headers: { 'User-Agent': 'JobDashboardApp/1.0 (Compliance Job Search)' },
      timeout: 10000
    });
    
    // First item in RemoteOK is legal/metadata notice
    const items = Array.isArray(res.data) ? res.data.slice(1, limit + 1) : [];
    return items.map(item => ({
      companyName: item.company || 'Tech Company',
      companyWebsite: item.company_url || '',
      careerPageUrl: '',
      jobTitle: item.position || 'Software Engineer',
      jobDescription: (item.description || '').replace(/<[^>]*>?/gm, '').slice(0, 4000),
      jobUrl: item.url || ('https://remoteok.com/l/' + (item.id || Date.now())),
      location: item.location || 'Remote',
      remote: true,
      employmentType: 'Full-time',
      experienceRequired: '2+ years',
      minExperienceYears: 2,
      maxExperienceYears: 5,
      salary: {
        min: item.salary_min || null,
        max: item.salary_max || null,
        currency: 'USD',
        period: 'yearly'
      },
      skills: (item.tags || []).filter(t => t.length > 1),
      source: 'RemoteOK API',
      postedDate: item.date ? new Date(item.date) : new Date(),
    }));
  } catch (err) {
    logger.warn('RemoteOK fetch skipped or failed: ' + err.message);
    return [];
  }
};

const normalizeEmploymentType = (raw) => {
  const v = String(raw || '').toLowerCase().replace(/[^a-z]/g, '');
  if (v.includes('part')) return 'Part-time';
  if (v.includes('contract')) return 'Contract';
  if (v.includes('intern')) return 'Internship';
  if (v.includes('temp')) return 'Temporary';
  if (v.includes('other')) return 'Other';
  if (v.includes('full') || v.includes('permanent')) return 'Full-time';
  return 'Full-time';
};

export const fetchArbeitnowJobs = async (limit = 20) => {
  try {
    const res = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
      timeout: 10000
    });
    const items = (res.data && res.data.data) ? res.data.data.slice(0, limit) : [];
    return items.map(item => ({
      companyName: item.company_name || 'Tech Company',
      companyWebsite: '',
      careerPageUrl: '',
      jobTitle: item.title || 'Developer',
      jobDescription: (item.description || '').replace(/<[^>]*>?/gm, '').slice(0, 4000),
      jobUrl: item.url || '',
      location: item.location || 'Remote',
      remote: item.remote || false,
      employmentType: normalizeEmploymentType(item.job_types && item.job_types[0]) || 'Full-time',
      experienceRequired: '3+ years',
      minExperienceYears: 3,
      maxExperienceYears: 6,
      salary: { min: null, max: null, currency: 'EUR', period: 'yearly' },
      skills: (item.tags || []).filter(t => t.length > 1),
      source: 'Arbeitnow API',
      postedDate: item.created_at ? new Date(item.created_at * 1000) : new Date(),
    }));
  } catch (err) {
    logger.warn('Arbeitnow fetch skipped or failed: ' + err.message);
    return [];
  }
};
