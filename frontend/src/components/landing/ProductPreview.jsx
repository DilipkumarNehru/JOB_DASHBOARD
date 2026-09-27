import { useState } from 'react';
import {
  LayoutDashboard, Briefcase, FileText, Target, FileCheck, Mail
} from 'lucide-react';

const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    title: 'Your Job Search Overview',
    description:
      'Get a real-time snapshot of your entire job search pipeline. See total jobs found, matched jobs, applications submitted, interviews scheduled, and more — all in one view with interactive charts.',
    preview: <DashboardPreview />,
  },
  {
    id: 'jobs',
    label: 'Job Listings',
    icon: Briefcase,
    title: 'Discover Relevant Jobs',
    description:
      'Browse job openings discovered from supported company career pages. Each job shows match score, title, company, location, and type so you can quickly identify the best opportunities.',
    preview: <JobsPreview />,
  },
  {
    id: 'resume',
    label: 'Resume Analysis',
    icon: FileText,
    title: 'AI-Powered Resume Parsing',
    description:
      'Upload your resume and get a structured breakdown of your skills, work experience, education, certifications, and projects — all automatically extracted and organized.',
    preview: <ResumePreview />,
  },
  {
    id: 'matching',
    label: 'Job Matching',
    icon: Target,
    title: 'Resume-to-Job Match Score',
    description:
      'Compare your resume against any job description and get a detailed compatibility report: matching skills, missing skills, experience alignment, and an overall match score.',
    preview: <MatchingPreview />,
  },
  {
    id: 'tracker',
    label: 'App Tracker',
    icon: FileCheck,
    title: 'Track Every Application',
    description:
      'Log every job application and track it through each stage of the hiring process. Never lose track of where you applied, your status, or your next steps.',
    preview: <TrackerPreview />,
  },
  {
    id: 'gmail',
    label: 'Gmail',
    icon: Mail,
    title: 'Organized Job Emails',
    description:
      'Connect your Gmail and automatically classify job-related emails into categories: Interview, Applied, Shortlisted, Rejected, Follow-up, and more.',
    preview: <GmailPreview />,
  },
];

function DashboardPreview() {
  return (
    <div className="preview-container">
      <div className="preview-topbar">
        <div className="preview-topbar-dot active" />
        <span className="text-xs font-semibold text-slate-700">Dashboard Overview</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'Jobs Found', val: '142', color: 'bg-brand-50 text-brand-700' },
          { label: 'Match ≥70%', val: '28', color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Applied', val: '12', color: 'bg-blue-50 text-blue-700' },
          { label: 'Interviews', val: '3', color: 'bg-violet-50 text-violet-700' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`rounded-lg p-3 ${color}`}>
            <p className="text-lg font-bold">{val}</p>
            <p className="text-xs opacity-80">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-500 mb-2">Applications by Month</p>
        <div className="flex items-end gap-1 h-16">
          {[30, 55, 40, 70, 60, 85, 75, 90].map((h, i) => (
            <div key={i} className="flex-1 bg-brand-400 rounded-t-sm opacity-70" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JobsPreview() {
  const jobs = [
    { title: 'Senior React Developer', company: 'TechCorp', match: 91, type: 'Remote', status: 'New' },
    { title: 'Full Stack Engineer', company: 'StartupXYZ', match: 84, type: 'Hybrid', status: 'Saved' },
    { title: 'Frontend Developer', company: 'Digital Inc.', match: 76, type: 'On-site', status: 'New' },
  ];
  return (
    <div className="preview-container">
      <div className="preview-topbar">
        <div className="preview-topbar-dot active" />
        <span className="text-xs font-semibold text-slate-700">Job Listings</span>
      </div>
      <div className="space-y-2">
        {jobs.map((j) => (
          <div key={j.title} className="rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-sm flex-shrink-0">
              {j.company.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{j.title}</p>
              <p className="text-xs text-slate-500">{j.company} · {j.type}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-bold text-emerald-600">{j.match}%</span>
              <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-medium">{j.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumePreview() {
  return (
    <div className="preview-container">
      <div className="preview-topbar">
        <div className="preview-topbar-dot active" />
        <span className="text-xs font-semibold text-slate-700">Resume Analysis</span>
      </div>
      <div className="space-y-3">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-xs font-semibold text-emerald-700 mb-2">Extracted Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {['React', 'Node.js', 'MongoDB', 'TypeScript', 'REST APIs', 'Git', 'Python'].map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-xs text-emerald-700">{s}</span>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-600 mb-2">Experience Highlights</p>
          <div className="space-y-1.5">
            {[
              { role: 'Senior Frontend Developer', yrs: '3 years' },
              { role: 'Full Stack Engineer', yrs: '2 years' },
            ].map((e) => (
              <div key={e.role} className="flex justify-between text-xs">
                <span className="text-slate-700">{e.role}</span>
                <span className="text-slate-400">{e.yrs}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchingPreview() {
  return (
    <div className="preview-container">
      <div className="preview-topbar">
        <div className="preview-topbar-dot active" />
        <span className="text-xs font-semibold text-slate-700">Resume Match Analysis</span>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-3xl font-bold text-brand-600">87%</p>
          <p className="text-xs text-slate-500">Match Score</p>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Skills', pct: 90, color: 'bg-emerald-500' },
            { label: 'Exp.', pct: 85, color: 'bg-brand-500' },
            { label: 'Keys', pct: 80, color: 'bg-violet-500' },
          ].map(({ label, pct, color }) => (
            <div key={label} className="text-center">
              <div className="h-12 w-6 bg-slate-100 rounded-sm relative overflow-hidden">
                <div className={`absolute bottom-0 w-full ${color} rounded-sm`} style={{ height: `${pct}%` }} />
              </div>
              <p className="text-[9px] text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
          <p className="text-[10px] font-semibold text-emerald-700 mb-1">Matching Skills</p>
          <div className="flex flex-wrap gap-1">
            {['React', 'Node.js', 'MongoDB'].map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px]">✓ {s}</span>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
          <p className="text-[10px] font-semibold text-amber-700 mb-1">Missing Skills</p>
          <div className="flex flex-wrap gap-1">
            {['AWS', 'Docker'].map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">! {s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackerPreview() {
  const apps = [
    { company: 'TechCorp', role: 'React Developer', status: 'Interview', color: 'bg-violet-100 text-violet-700' },
    { company: 'StartupXYZ', role: 'Full Stack Eng.', status: 'Applied', color: 'bg-blue-100 text-blue-700' },
    { company: 'Digital Inc.', role: 'Frontend Dev', status: 'Shortlisted', color: 'bg-emerald-100 text-emerald-700' },
    { company: 'CloudBase', role: 'JS Developer', status: 'Follow-up', color: 'bg-amber-100 text-amber-700' },
  ];
  return (
    <div className="preview-container">
      <div className="preview-topbar">
        <div className="preview-topbar-dot active" />
        <span className="text-xs font-semibold text-slate-700">Application Tracker</span>
      </div>
      <div className="space-y-2">
        {apps.map((a) => (
          <div key={a.company} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-2.5">
            <div className="h-7 w-7 rounded-md bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {a.company.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{a.role}</p>
              <p className="text-[10px] text-slate-500">{a.company}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${a.color}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GmailPreview() {
  const emails = [
    { from: 'TechCorp HR', subject: 'Interview invitation — React Dev', tag: 'Interview', color: 'bg-violet-100 text-violet-700' },
    { from: 'StartupXYZ', subject: 'Application received — Full Stack', tag: 'Applied', color: 'bg-blue-100 text-blue-700' },
    { from: 'Recruiter', subject: 'Your profile has been shortlisted', tag: 'Shortlisted', color: 'bg-emerald-100 text-emerald-700' },
    { from: 'CloudBase', subject: 'Follow up on your application', tag: 'Follow-up', color: 'bg-amber-100 text-amber-700' },
  ];
  return (
    <div className="preview-container">
      <div className="preview-topbar">
        <div className="preview-topbar-dot active" />
        <span className="text-xs font-semibold text-slate-700">Gmail Intelligence</span>
      </div>
      <div className="space-y-2">
        {emails.map((e) => (
          <div key={e.from} className="rounded-lg border border-slate-100 bg-white p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700">{e.from}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${e.color}`}>{e.tag}</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">{e.subject}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductPreview() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const active = TABS.find((t) => t.id === activeTab);

  return (
    <section id="preview" className="landing-section bg-slate-50">
      <div className="landing-container">
        <div className="section-header">
          <div className="section-badge">Product Preview</div>
          <h2 className="section-heading">
            See JOB DASHBOARD{' '}
            <span className="section-heading-accent">in Action</span>
          </h2>
          <p className="section-subtext">
            Explore the key screens and features of the JOB DASHBOARD application.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="preview-tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`preview-tab ${activeTab === t.id ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="preview-content-area">
          <div className="preview-info">
            <h3 className="text-xl font-bold text-slate-900 mb-3">{active.title}</h3>
            <p className="text-slate-600 leading-relaxed">{active.description}</p>
          </div>
          <div className="preview-visual">
            {active.preview}
          </div>
        </div>
      </div>
    </section>
  );
}
