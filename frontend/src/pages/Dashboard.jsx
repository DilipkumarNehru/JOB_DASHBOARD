import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Briefcase, Target, FileCheck, Hourglass, Users, CalendarRange, XCircle, BellRing, Gift,
  FileText, Crown, Layers
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { analyticsService, jobService } from '../services';
import { StatCard, Card } from '../components/common/Card.jsx';
import { PageLoader, ErrorState, EmptyState } from '../components/common/Feedbacks.jsx';
import { BarChartWidget, PieChartWidget } from '../charts';
import { getMonthLabel, formatNumber } from '../utils/format.js';
import { JobCard } from '../components/jobs/JobCard.jsx';

const statDefs = (s = {}) => [
  {
    label: 'Total Resumes',
    value: formatNumber(s.totalResumes || 0),
    icon: FileText,
    color: 'bg-violet-50 text-violet-600',
    sub: s.primaryResume ? `Primary: ${s.primaryResume.resumeName}` : 'No primary set'
  },
  {
    label: 'Total Jobs Found',
    value: formatNumber(s.totalUniqueMatchedJobs || s.totalJobs || 0),
    icon: Layers,
    color: 'bg-brand-50 text-brand-600',
    sub: 'across all resumes'
  },
  {
    label: 'Primary Resume Jobs',
    value: formatNumber(s.primaryResumeJobCount || 0),
    icon: Crown,
    color: 'bg-blue-50 text-blue-600',
    sub: s.primaryResume ? `Pool for ${s.primaryResume.resumeName}` : '—'
  },
  {
    label: 'Matched Jobs',
    value: formatNumber(s.matchedJobs),
    icon: Target,
    color: 'bg-emerald-50 text-emerald-600',
    sub: s.primaryResume ? `${s.matchedJobs} of ${s.primaryResumeJobCount || 0} jobs matched (≥ ${s.matchThreshold || 70}%)` : '≥ 70% ATS score'
  },
  { label: 'Jobs Applied', value: formatNumber(s.totalApps), icon: FileCheck, color: 'bg-blue-50 text-blue-600' },
  { label: 'In Progress', value: formatNumber(s.inProgress), icon: Hourglass, color: 'bg-amber-50 text-amber-600' },
  { label: 'Shortlisted', value: formatNumber(s.shortlisted), icon: Users, color: 'bg-green-50 text-green-600' },
  { label: 'Interviews', value: formatNumber(s.interviews), icon: CalendarRange, color: 'bg-violet-50 text-violet-600' },
  { label: 'Rejected', value: formatNumber(s.rejected), icon: XCircle, color: 'bg-red-50 text-red-600' },
  { label: 'Offers', value: formatNumber(s.offers), icon: Gift, color: 'bg-lime-50 text-lime-600' },
];

export default function Dashboard() {
  const { data, loading, error, refetch } = useFetch(analyticsService.stats);
  const monthly = useFetch(analyticsService.monthly);
  const status = useFetch(analyticsService.statusDistribution);
  const companies = useFetch(() => analyticsService.companies());
  const skills = useFetch(analyticsService.skills);
  const recommended = useFetch(jobService.recommended);

  const [discovering, setDiscovering] = useState(false);
  const [switching, setSwitching] = useState(false);

  const runDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await jobService.discover({});
      toast.success(res.message);
      await Promise.all([refetch()]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDiscovering(false);
    }
  };

  const handleSwitchPrimary = async (resumeId) => {
    if (!resumeId || switching) return;
    setSwitching(true);
    try {
      await resumeService.setPrimary(resumeId);
      const target = (stats.allResumes || []).find(r => r._id === resumeId);
      toast.success(`Active resume updated to "${target?.resumeName || 'selected resume'}"!`);
      await refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to switch primary resume');
    } finally {
      setSwitching(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const stats = data?.stats || {};
  const monthlyData = (monthly.data?.data || []).map((d) => ({
    label: getMonthLabel(d._id.year, d._id.month),
    count: d.count,
  }));
  const statusData = (status.data?.data || []).map((d) => ({ name: d._id, value: d.count }));
  const companyData = (companies.data?.companies || []).map((c) => ({ label: c._id, count: c.count }));
  const skillsData = (skills.data?.skills || []).slice(0, 10).map((s) => ({ label: s._id, count: s.count }));
  const followUpsDue = stats.followUpsDue || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Overview</h2>
          <p className="text-sm text-slate-500">A snapshot of your job search pipeline.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={runDiscovery} disabled={discovering} className="btn-secondary">
            {discovering ? 'Discovering…' : '↺ Run job discovery'}
          </button>
          <Link to="/jobs" className="btn-primary">Browse jobs</Link>
        </div>
      </div>

      {/* Primary resume banner with quick resume switch */}
      {stats.primaryResume && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-white px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Crown className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Active Primary Resume</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {stats.matchedJobs} of {stats.primaryResumeJobCount || 0} jobs matched
                </span>
              </div>
              <p className="truncate text-base font-bold text-slate-900 mt-0.5">
                {stats.primaryResume.resumeName}
              </p>
              <p className="text-xs text-slate-500">
                Matches calculated at ≥ {stats.matchThreshold || 70}% score · {formatNumber(stats.totalUniqueMatchedJobs || stats.totalJobs || 0)} total jobs across all resumes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats.allResumes && stats.allResumes.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-lg p-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 pl-1.5">Switch Resume:</span>
                <select
                  value={stats.primaryResume._id}
                  onChange={(e) => handleSwitchPrimary(e.target.value)}
                  disabled={switching}
                  className="rounded-md border-0 bg-transparent py-1 pl-1 pr-6 text-xs font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {stats.allResumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.resumeName} ({r.matchedJobs} matched / {r.jobCount} jobs) {r.isPrimary ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Link to="/resumes" className="btn-secondary text-xs shrink-0">Manage Resumes</Link>
            <Link to="/jobs" className="btn-primary text-xs shrink-0">View {stats.matchedJobs} Matched Jobs</Link>
          </div>
        </div>
      )}

      {!stats.primaryResume && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <FileText className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="flex-1 text-sm text-amber-800">
            <b>No primary resume set.</b> Upload a resume and set it as primary to see job matches.
          </p>
          <Link to="/resumes" className="btn-secondary text-xs shrink-0">Upload Resume</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {statDefs(stats).map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {followUpsDue > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <BellRing className="h-5 w-5 text-amber-600" />
          <p className="flex-1 text-sm text-amber-800">
            <b>{followUpsDue}</b> application{followUpsDue === 1 ? '' : 's'} need follow-up today. Overdue: <b>{stats.overdue || 0}</b>.
          </p>
          <Link to="/follow-ups" className="btn-secondary text-xs">View follow-ups</Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Applications by month" subtitle="Submitted applications per month">
          {monthlyData.length ? <BarChartWidget data={monthlyData} name="Applications" /> : <EmptyState title="No application data" />}
        </Card>
        <Card title="Application status distribution">
          {statusData.length ? <PieChartWidget data={statusData} /> : <EmptyState title="No status data" />}
        </Card>
        <Card title="Jobs by company" subtitle="Discoveries & matches">
          {companyData.length ? <BarChartWidget data={companyData} color="#10b981" /> : <EmptyState title="No company data" />}
        </Card>
        <Card title="Top skills in job pool">
          {skillsData.length ? <BarChartWidget data={skillsData} color="#8b5cf6" /> : <EmptyState title="No skill data" />}
        </Card>
      </div>

      <Card
        title="Recommended for you"
        subtitle={stats.primaryResume ? `Best matching jobs based on ${stats.primaryResume.resumeName}` : "Best matching jobs based on your primary resume"}
        actions={<Link to="/jobs" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>}
      >
        {recommended.loading ? (
          <div className="grid gap-4 md:grid-cols-2"><div className="h-24 animate-pulse rounded bg-slate-100" /><div className="h-24 animate-pulse rounded bg-slate-100" /></div>
        ) : (recommended.data?.jobs || []).length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(recommended.data.jobs).slice(0, 4).map((job) => <JobCard key={job._id} job={job} />)}
          </div>
        ) : (
          <EmptyState
            icon="🎯"
            title="No recommendations yet"
            description={stats.primaryResume ? `Discover jobs to find matches for your ${stats.primaryResume.resumeName}.` : "Upload a resume, set it as primary, then discover jobs."}
            action={
              <div className="flex gap-2">
                {!stats.primaryResume && <Link to="/resumes" className="btn-secondary">Upload Resume</Link>}
                <button onClick={runDiscovery} disabled={discovering} className="btn-primary">{discovering ? 'Discovering…' : 'Discover jobs'}</button>
              </div>
            }
          />
        )}
      </Card>
    </div>
  );
}