import { Link } from 'react-router-dom';
import { MapPin, Building2, Briefcase, ArrowUpRight, CheckCircle2, XCircle, Crown } from 'lucide-react';
import { MatchBadge } from '../common/Badge.jsx';
import { StatusBadge } from '../common/Badge.jsx';
import { relativeTime, formatSalary } from '../../utils/format.js';
import { STATUS_BADGE } from '../../utils/constants.js';

const atsColor = (score) => {
  if (!score) return 'bg-slate-100 text-slate-500';
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 65) return 'bg-blue-100 text-blue-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

export const JobCard = ({ job, actions }) => {
  const matchScore = job.matchScore || 0;
  const matchedSkills = job.matchedSkills || [];
  const missingSkills = job.missingSkills || [];
  const matchedResumeName = job.matchedResumeName || job.resumeName || job.originalFileName || job.originalName || '';

  return (
    <div className="card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link to={`/jobs/${job._id}`} className="block">
            <h3 className="truncate text-[15px] font-semibold text-slate-900 hover:text-brand-600">{job.jobTitle}</h3>
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.companyName}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.remote ? 'Remote' : job.location || '—'}</span>
            {job.employmentType && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.employmentType}</span>}
          </div>
          {matchedResumeName && (
            <div className="mt-1 flex items-center gap-1">
              <Crown className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] text-blue-600 font-medium">{matchedResumeName}</span>
            </div>
          )}
        </div>
        {/* ATS Score badge */}
        {matchScore > 0 ? (
          <div className={`shrink-0 rounded-xl px-2.5 py-1.5 text-center ${atsColor(matchScore)}`}>
            <p className="text-lg font-black">{matchScore}%</p>
            <p className="text-[9px] font-semibold uppercase">ATS</p>
          </div>
        ) : (
          <MatchBadge score={matchScore} />
        )}
        {/* Experience match badge */}
        {job.experienceMatch !== undefined && (
          <div className={`shrink-0 rounded-xl px-2.5 py-1.5 text-center ${atsColor(job.experienceMatch)}`}>
            <p className="text-lg font-black">{job.experienceMatch}%</p>
            <p className="text-[9px] font-semibold uppercase">EXP</p>
          </div>
        )}
      </div>

      {/* Matched skills */}
      {matchedSkills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {matchedSkills.slice(0, 4).map((s) => (
            <span key={s} className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              <CheckCircle2 className="h-2.5 w-2.5" />{s}
            </span>
          ))}
          {matchedSkills.length > 4 && (
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600">+{matchedSkills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Missing skills */}
      {missingSkills.length > 0 && matchedSkills.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {missingSkills.slice(0, 2).map((s) => (
            <span key={s} className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
              <XCircle className="h-2.5 w-2.5" />{s}
            </span>
          ))}
          {missingSkills.length > 2 && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">+{missingSkills.length - 2} missing</span>
          )}
        </div>
      )}

      {/* Fallback: generic skills when no match data */}
      {matchedSkills.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(job.skills || []).slice(0, 5).map((s) => (
            <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>
          ))}
          {(job.skills || []).length > 5 && <span className="badge bg-slate-100 text-slate-400">+{(job.skills).length - 5}</span>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{relativeTime(job.postedDate)}</span>
          <span className="text-slate-300">•</span>
          <span>{formatSalary(job.salary)}</span>
          {job.experienceRequired && (
            <>
              <span className="text-slate-300">•</span>
              <span>{job.experienceRequired}</span>
            </>
          )}
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
};

export const JobCardSkeleton = () => (
  <div className="card p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-10 w-12 animate-pulse rounded-xl bg-slate-100" />
    </div>
    <div className="mt-3 flex gap-2">
      <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
    </div>
    <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
  </div>
);