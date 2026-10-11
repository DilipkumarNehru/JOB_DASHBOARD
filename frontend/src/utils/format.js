import dayjs from 'dayjs';

export const formatDate = (value) => {
  if (!value) return '—';
  return dayjs(value).format('DD MMM YYYY');
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return dayjs(value).format('DD MMM YYYY, h:mm A');
};

export const relativeTime = (value) => {
  if (!value) return '—';
  const now = dayjs();
  const dt = dayjs(value);
  const diffMins = now.diff(dt, 'minute');
  const diffHours = now.diff(dt, 'hour');
  const diffDays = now.diff(dt, 'day');
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return dt.format('DD MMM YYYY');
};

export const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return '';
  const b = Number(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const getMonthLabel = (year, month) => {
  return dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('MMM YY');
};

export const formatSalary = (salary) => {
  if (!salary || (!salary.min && !salary.max)) return 'Not disclosed';
  const cur = salary.currency || 'INR';
  const fmt = (n) => (n ? n.toLocaleString('en-IN') : '');
  if (salary.min && salary.max) return `${cur} ${fmt(salary.min)} – ${fmt(salary.max)}`;
  if (salary.min) return `${cur} ${fmt(salary.min)}+`;
  return `${cur} ${fmt(salary.max)}`;
};

export const formatNumber = (n) => {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString();
};

export const initials = (name = '') => {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'U';
};

export const truncate = (text, max = 120) => {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
};

export const toQueryString = (params) => {
  const filtered = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return new URLSearchParams(filtered).toString();
};

export const sortJobs = (jobs, sortBy) => {
  const list = [...(jobs || [])];
  switch (sortBy) {
    case 'match':
      return list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    case 'posted':
      return list.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    case 'company':
      return list.sort((a, b) => a.companyName.localeCompare(b.companyName));
    case 'role':
      return list.sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));
    case 'location':
      return list.sort((a, b) => a.location.localeCompare(b.location));
    default:
      return list;
  }
};