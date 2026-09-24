import { Link } from 'react-router-dom';
import { MapPin, Building2, Briefcase, ArrowUpRight } from 'lucide-react';
import { MatchBadge } from '../common/Badge.jsx';
import { StatusBadge } from '../common/Badge.jsx';
import { relativeTime, formatSalary } from '../../utils/format.js';
import { STATUS_BADGE } from '../../utils/constants.js';

export const JobCard = ({ job, actions }) => (
  <div className="card p-5 transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link to={`/jobs/${job._id}`} className="block">
          <h3 className="truncate text-[15px] font-semibold text-slate-900 hover:text-brand-600">{job.jobTitle}</h3>
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.companyName}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.remote ? 'Remote' : job.location || '—'}</span>
          {job.employmentType && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.employmentType}</span>}
        </div>
      </div>
      <MatchBadge score={job.matchScore} />
    </div>

    <div className="mt-3 flex flex-wrap gap-1.5">
      {(job.skills || []).slice(0, 5).map((s) => (
        <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>
      ))}
      {(job.skills || []).length > 5 && <span className="badge bg-slate-100 text-slate-400">+{(job.skills).length - 5}</span>}
    </div>

    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>{relativeTime(job.postedDate)}</span>
        <span className="text-slate-300">•</span>
        <span>{formatSalary(job.salary)}</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={job.status} map={STATUS_BADGE} />
        <Link to={`/jobs/${job._id}`} title="Open job" className="text-slate-400 hover:text-brand-600">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        {actions}
      </div>
    </div>
  </div>
);

export const JobCardSkeleton = () => (
  <div className="card p-5">
    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
    <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
    <div className="mt-3 flex gap-2">
      <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
    </div>
    <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
  </div>
);