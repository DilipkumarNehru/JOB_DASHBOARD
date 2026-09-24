import axios from 'axios';
import * as cheerio from 'cheerio';
import { ALL_SKILLS } from '../../utils/skillDictionary.js';
import { logger } from '../../utils/logger.js';

const TIMEOUT = 20000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 JobDashboard/1.0';

const get = async (url, options = {}) => {
  const res = await axios.get(url, {
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA, 'Accept': '*/*', ...(options.headers || {}) },
    ...options
  });
  return res;
};

const post = async (url, body, headers = {}) => {
  const res = await axios.post(url, body, {
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json', ...headers }
  });
  return res;
};

export const stripHtml = (html = '') => {
  const $ = cheerio.load(`<div>${html}</div>`, null, false);
  return $.text().replace(/\s+/g, ' ').trim();
};

export const extractSkills = (text = '') => {
  const lower = text.toLowerCase();
  return ALL_SKILLS.filter(s => lower.includes(s.toLowerCase()));
};

const cleanTitle = (title = '') => {
  const t = String(title).trim();
  const parenIdx = t.lastIndexOf(' (');
  if (parenIdx > 0) return t.slice(0, parenIdx).trim();
  return t;
};

const extractLocationFromTitle = (title = '') => {
  const m = String(title).match(/\(([^)]+)\)\s*$/);
  if (!m) return '';
  const raw = m[1];
  const city = raw.split(',').map(s => s.trim()).find(s => /^[A-Za-z ]+$/.test(s));
  return city || raw;
};

const extractReqId = (jobUrl = '') => {
  const m = String(jobUrl).replace(/\/+$/, '').match(/\/(\d{4,})(?:\/|$)/);
  return m ? m[1] : '';
};

const normalizeListing = (raw) => ({
  companyName: raw.companyName,
  companyWebsite: raw.companyWebsite || '',
  careerPageUrl: raw.careerPageUrl || '',
  jobTitle: cleanTitle(raw.jobTitle) || 'Untitled Role',
  jobDescription: stripHtml(raw.jobDescription || '').slice(0, 12000),
  jobUrl: raw.jobUrl || '',
  jobReqId: raw.jobReqId || extractReqId(raw.jobUrl),
  location: (raw.location || extractLocationFromTitle(raw.jobTitle) || '').trim(),
  remote: raw.remote === true || /remote/i.test((raw.location || '') + ' ' + (raw.jobDescription || '').slice(0, 2000)),
  employmentType: /part\s*time/i.test(raw.jobDescription || '') ? 'Part-time'
    : /internship/i.test(raw.jobDescription || '') ? 'Internship'
    : /contract/i.test(raw.jobDescription || '') || /freelance/i.test(raw.jobDescription || '') ? 'Contract'
    : /full\s*time/i.test(raw.jobDescription || '') ? 'Full-time'
    : raw.employmentType ? reconstructEmploymentType(raw.employmentType) : 'Full-time',
  postedDate: raw.postedDate ? new Date(raw.postedDate) : new Date(),
  salary: raw.salary || {},
  skills: extractSkills((raw.jobTitle || '') + ' ' + (raw.jobDescription || '').slice(0, 6000)),
  requiredSkills: raw.requiredSkills || extractSkills((raw.jobTitle || '') + ' ' + (raw.jobDescription || '').slice(0, 6000)),
  source: raw.source || 'Company Career Page'
});

const reconstructEmploymentType = (val) => {
  const v = String(val).toLowerCase();
  if (v.includes('part')) return 'Part-time';
  if (v.includes('intern')) return 'Internship';
  if (v.includes('contract') || v.includes('freelance')) return 'Contract';
  if (v.includes('temporary')) return 'Temporary';
  return 'Full-time';
};

const successFactorsJobs = async ({ careerPageUrl, keywords = [], credentials }) => {
  const base = careerPageUrl.replace(/\/+$/, '');
  const kw = (keywords || []).filter(Boolean).slice(0, 4).join(' ');
  const rssUrl = `${base}/services/rss/job/?locale=en_US&keywords=(${encodeURIComponent(kw) || 'jobs'})`;
  logger.info(`[SF] Fetching RSS: ${rssUrl}`);
  const { data } = await get(rssUrl, { responseType: 'text' });
  const $ = cheerio.load(data, { xmlMode: true });
  const items = [];
  $('item').each((_, el) => {
    const title = $(el).find('title').first().text();
    const guid = $(el).find('guid').first().text() || $(el).find('link').first().text();
    const description = $(el).find('description').first().text();
    const categories = [];
    $(el).find('category').each((__, cat) => categories.push($(cat).text()));
    items.push({
      jobTitle: title,
      jobUrl: guid.split('?')[0],
      jobDescription: description,
      postedDate: $(el).find('pubDate').first().text(),
      jobReqId: extractReqId(guid),
      jobFamily: categories.join(', ')
    });
  });
  logger.info(`[SF] ${items.length} listings from ${base}`);
  return items;
};

const greenhouseJobs = async ({ careerPageUrl, keywords = [], boardToken }) => {
  if (!boardToken) return [];
  const { data } = await get(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`);
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  return jobs.map(j => ({
    jobTitle: j.title,
    jobUrl: j.absolute_url || '',
    jobDescription: j.content || '',
    jobReqId: j.requisition_id ? String(j.requisition_id) : String(j.id),
    location: typeof j.location === 'object' ? j.location?.name : j.location || '',
    postedDate: j.updated_at || j.first_published,
    salary: {}
  }));
};

const leverJobs = async ({ companySlug }) => {
  if (!companySlug) return [];
  const { data } = await get(`https://api.lever.co/v0/postings/${companySlug}?mode=json`);
  const jobs = Array.isArray(data) ? data : [];
  return jobs.map(j => ({
    jobTitle: j.text || '',
    jobUrl: j.hostedUrl || '',
    jobDescription: j.description || j.descriptionPlain || '',
    jobReqId: j.id || '',
    location: typeof j.categories?.location === 'string' ? j.categories.location : '',
    employmentType: j.categories?.commitment || 'Full-time',
    postedDate: j.createdAt ? new Date(j.createdAt) : new Date(),
    salary: {}
  }));
};

const smartRecruitersJobs = async ({ companySlug }) => {
  if (!companySlug) return [];
  const { data } = await get(`https://api.smartrecruiters.com/v1/companies/${companySlug}/postings?limit=100`);
  const jobs = Array.isArray(data?.content) ? data.content : [];
  return jobs
    .filter(j => j.releasedDate)
    .map(j => {
      const sections = Array.isArray(j.jobAd?.sections) ? j.jobAd.sections : [];
      const joinSections = (keys) => sections.filter(s => keys.includes(s?.title?.toLowerCase())).map(s => Array.isArray(s?.text) ? s.text.map(t => t.content || '').join(' ') : (s?.text?.content || '')).join(' ');
      const desc = [joinSections(['jobdescription', 'description', 'job description']), joinSections(['qualifications', 'requirements']), joinSections(['companydescription', 'company'])].filter(Boolean).join(' ');
      const city = j.location?.city || '';
      const country = j.location?.country || '';
      return {
        jobTitle: j.name || '',
        jobUrl: j.applyUrl || (j.ref ? `https://jobs.smartrecruiters.com/companies/${companySlug}/jobs/${j.ref}` : ''),
        jobDescription: desc || j.additionalInformation || '',
        jobReqId: j.ref || '',
        location: [city, country].filter(Boolean).join(', '),
        postedDate: j.releasedDate ? new Date(j.releasedDate) : new Date(),
        salary: {}
      };
    });
};

const workdayJobs = async ({ careerPageUrl, keywords = [], tenant, site }) => {
  if (!tenant || !site) return [];
  const m = careerPageUrl.match(/(https?:\/\/[^/]+)/);
  const host = m ? m[1] : careerPageUrl;
  const url = `${host}/wday/cxs/${tenant}/${site}/jobs`;
  const searchText = (keywords || []).filter(Boolean).join(' ');
  const { data } = await post(url, {
    appliedFacets: {},
    limit: 20,
    offset: 0,
    searchText
  });
  const jobs = Array.isArray(data?.jobPostings) ? data.jobPostings : [];
  return jobs.map(j => ({
    jobTitle: j.title || '',
    jobUrl: `${host}${j.externalPath || ''}`,
    jobDescription: j.jobDescription || '',
    jobReqId: j.jobPostingId || '',
    location: j.locationsText || '',
    postedDate: j.postedOn ? new Date(j.postedOn) : new Date(),
    salary: {}
  }));
};

const genericJobs = async ({ careerPageUrl }) => {
  const { data: html } = await get(careerPageUrl, { responseType: 'text' });
  const $ = cheerio.load(html);
  const items = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw || !/JobPosting/i.test(raw)) return;
    try {
      const parsed = JSON.parse(raw);
      const blocks = Array.isArray(parsed) ? parsed : [parsed];
      for (const block of blocks) {
        const type = Array.isArray(block['@type']) ? block['@type'] : [block['@type']];
        if (!type.some(t => /JobPosting/i.test(t || ''))) continue;
        const url = block.url || block.occupationalCategory || '';
        if (!url || url === careerPageUrl) return;
        items.push({ jobTitle: block.title || '', jobUrl: url, jobDescription: block.description || '', postedDate: block.datePosted || new Date(), jobReqId: '', location: block.jobLocation?.address?.addressLocality || block.jobLocation?.addressLocality || '' });
      }
    } catch (err) { /* skip malformed ld+json */ }
  });
  if (items.length) return items;

  const base = careerPageUrl.replace(/\/+$/, '');
  let count = 0;
  $('a[href*="job"]').each((_, el) => {
    if (count >= 30) return false;
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim();
    if (!href || !text || text.length < 4 || text.length > 150) return;
    if (/^(javascript|#)/.test(href)) return;
    const url = href.startsWith('http') ? href : new URL(href, base).toString();
    items.push({ jobTitle: text, jobUrl: url, jobDescription: '', jobReqId: extractReqId(url), location: '', postedDate: new Date(), salary: {} });
    count++;
  });
  return items;
};

export const detectPlatform = (html = '', careerPageUrl = '') => {
  const url = String(careerPageUrl);
  if (url.includes('myworkdayjobs') || /wday\/cxs\/.+\/.+\/jobs/i.test(html || '')) return 'workday';
  if (url.includes('jobs.lever.co') || url.includes('lever.co/jobs')) return 'lever';
  if (url.includes('smartrecruiters.com')) return 'smartrecruiters';
  if (url.includes('greenhouse.io') || (html || '').includes('boards.greenhouse.io')) return 'greenhouse';
  if ((html || '').includes('sapsf') || (html || '').includes('successfactors') || (html || '').includes('rmkcdn.successfactors') || /jobSearch_|services\/rss\/job/i.test(html || '')) return 'successfactors';
  return 'generic';
};

export const fetchCompanyJobs = async ({ company, keywords = [], credentials }) => {
  const careerPageUrl = company.careerPageUrl;
  if (!careerPageUrl) return [];
  let html = '';
  let platform = detectPlatform('', careerPageUrl);
  if (!['workday', 'lever', 'smartrecruiters', 'greenhouse'].includes(platform)) {
    try {
      const res = await get(careerPageUrl, { responseType: 'text' });
      html = res.data || '';
      platform = detectPlatform(html, careerPageUrl);
    } catch (err) {
      logger.warn(`[Careers] Could not fetch career page ${careerPageUrl}: ${err.message}`);
      if (platform === 'generic') return [];
    }
  }

  const slugs = {
    lever: (careerPageUrl.match(/lever\.co\/([a-z0-9\-]+)/i) || [])[1],
    smartrecruiters: (() => {
      const sub = careerPageUrl.match(/https?:\/\/([a-z0-9\-]+)\.smartrecruiters\.com/i);
      if (sub) return sub[1];
      return (careerPageUrl.match(/smartrecruiters\.com\/(?:jobs\/)?([a-z0-9\-]+)/i) || [])[1];
    })(),
    greenhouse: (() => {
      const m = (html || careerPageUrl).match(/boards\.greenhouse\.io\/([a-z0-9\-]+)/i);
      return m ? m[1] : '';
    })(),
    workday: (() => {
      const m = (careerPageUrl + ' ' + (html || '')).match(/wday\/cxs\/([^/]+)\/([^/]+)\/(?:jobs|home)/i);
      return m ? { tenant: m[1], site: m[2] } : null;
    })()
  };

  try {
    const baseCompany = {
      companyName: company.name,
      careerPageUrl,
      companyWebsite: company.website
    };
    const opts = { careerPageUrl, companySlug: slugs.lever, keywords, credentials };

    if (platform === 'workday' && slugs.workday) {
      const list = await workdayJobs({ careerPageUrl, keywords, ...slugs.workday });
      return list.map(l => normalizeListing({ ...baseCompany, ...l }));
    }
    if (platform === 'lever' && slugs.lever) {
      const list = await leverJobs({ companySlug: slugs.lever });
      return list.map(l => normalizeListing({ ...baseCompany, ...l }));
    }
    if (platform === 'smartrecruiters' && slugs.smartrecruiters) {
      const list = await smartRecruitersJobs({ companySlug: slugs.smartrecruiters });
      return list.map(l => normalizeListing({ ...baseCompany, ...l }));
    }
    if (platform === 'greenhouse' && slugs.greenhouse) {
      const list = await greenhouseJobs({ careerPageUrl, boardToken: slugs.greenhouse });
      return list.map(l => normalizeListing({ ...baseCompany, ...l }));
    }
    if (platform === 'successfactors') {
      const list = await successFactorsJobs({ careerPageUrl, keywords });
      return list.map(l => normalizeListing({ ...baseCompany, ...l }));
    }
    const list = await genericJobs({ careerPageUrl });
    return list.map(l => normalizeListing({ ...baseCompany, ...l }));
  } catch (err) {
    logger.warn(`[Careers] Planner ${platform} failed for ${company.name}: ${err.message}`);
    return [];
  }
};