export const APPLICATION_STATUSES = [
  'Saved',
  'Applied',
  'Application Viewed',
  'Recruiter Contacted',
  'Shortlisted',
  'Assessment',
  'Interview Scheduled',
  'Technical Interview',
  'HR Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'No Response'
];

export const EMAIL_CATEGORIES = [
  { key: 'JOB_APPLICATION', label: 'Job Applications', color: 'bg-blue-100 text-blue-700' },
  { key: 'INTERVIEW', label: 'Interviews', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'SHORTLIST', label: 'Shortlisted', color: 'bg-green-100 text-green-700' },
  { key: 'REJECTION', label: 'Rejections', color: 'bg-red-100 text-red-700' },
  { key: 'ASSESSMENT', label: 'Assessments', color: 'bg-amber-100 text-amber-700' },
  { key: 'RECRUITER_CONTACT', label: 'Recruiters', color: 'bg-purple-100 text-purple-700' },
  { key: 'JOB_OPENING', label: 'Job Openings', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'FOLLOW_UP', label: 'Follow-ups', color: 'bg-teal-100 text-teal-700' },
  { key: 'OFFER', label: 'Offers', color: 'bg-lime-100 text-lime-700' },
  { key: 'ONBOARDING', label: 'Onboarding', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'COURSE', label: 'Courses', color: 'bg-orange-100 text-orange-700' },
  { key: 'CERTIFICATION', label: 'Certifications', color: 'bg-fuchsia-100 text-fuchsia-700' },
  { key: 'PROMOTION', label: 'Promotions', color: 'bg-pink-100 text-pink-700' },
  { key: 'SOCIAL', label: 'Social', color: 'bg-violet-100 text-violet-700' },
  { key: 'NEWSLETTER', label: 'Newsletters', color: 'bg-slate-100 text-slate-600' },
  { key: 'OTHER', label: 'Other', color: 'bg-slate-200 text-slate-700' }
];

export const emailCategoryMap = Object.fromEntries(EMAIL_CATEGORIES.map((c) => [c.key, c]));

export const JOB_SOURCES = ['Company Career Page', 'RemoteOK API', 'Arbeitnow API', 'Manual Entry'];

export const STATUS_BADGE = {
  'new': 'bg-sky-100 text-sky-700',
  'saved': 'bg-blue-100 text-blue-700',
  'applied': 'bg-emerald-100 text-emerald-700',
  'rejected': 'bg-red-100 text-red-700',
  'archived': 'bg-slate-200 text-slate-600',
};

export const matchColor = (score) => {
  if (score >= 80) return 'text-emerald-700';
  if (score >= 60) return 'text-amber-700';
  return 'text-red-600';
};

export const matchBarColor = (score) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

export const APP_STATUS_BADGE = {
  'Saved': 'bg-slate-100 text-slate-600',
  'Applied': 'bg-blue-100 text-blue-700',
  'Application Viewed': 'bg-sky-100 text-sky-700',
  'Recruiter Contacted': 'bg-purple-100 text-purple-700',
  'Shortlisted': 'bg-green-100 text-green-700',
  'Assessment': 'bg-amber-100 text-amber-700',
  'Interview Scheduled': 'bg-emerald-100 text-emerald-700',
  'Technical Interview': 'bg-emerald-100 text-emerald-700',
  'HR Interview': 'bg-emerald-100 text-emerald-700',
  'Offer': 'bg-lime-100 text-lime-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Withdrawn': 'bg-slate-200 text-slate-600',
  'No Response': 'bg-yellow-100 text-yellow-700',
};

export const EMAIL_STATUS_BADGE = {
  'linked': 'bg-emerald-100 text-emerald-700',
  'needs_review': 'bg-amber-100 text-amber-700',
  'unlinked': 'bg-slate-100 text-slate-600',
  'ignored': 'bg-slate-200 text-slate-500',
};

export const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { to: '/jobs', label: 'Jobs', icon: 'Briefcase' },
      { to: '/applications', label: 'Applications', icon: 'FileCheck' },
      { to: '/resumes', label: 'Resume', icon: 'FileText' },
      { to: '/gmail', label: 'Gmail Inbox', icon: 'Mail' },
      { to: '/emails', label: 'Email Intelligence', icon: 'Inbox' },
      { to: '/companies', label: 'Companies', icon: 'Building2' },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { to: '/interviews', label: 'Interviews', icon: 'CalendarClock' },
      { to: '/follow-ups', label: 'Follow-ups', icon: 'BellRing' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', label: 'Analytics', icon: 'BarChart3' },
      { to: '/notifications', label: 'Notifications', icon: 'Bell' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/integrations', label: 'Integrations', icon: 'Plug' },
      { to: '/settings', label: 'Settings', icon: 'Settings' },
    ],
  },
];