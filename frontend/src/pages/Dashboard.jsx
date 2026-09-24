import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Target, FileCheck, Hourglass, Users, CalendarRange, XCircle, BellRing, Gift } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { analyticsService, jobService } from '../services';
import { StatCard, Card } from '../components/common/Card.jsx';
import { PageLoader, ErrorState, EmptyState } from '../components/common/Feedbacks.jsx';
import { BarChartWidget, PieChartWidget } from '../charts';
import { getMonthLabel, formatNumber } from '../utils/format.js';
import { JobCard } from '../components/jobs/JobCard.jsx';

const statDefs = (s = {}) => [
  { label: 'Total Jobs Found', value: formatNumber(s.totalJobs), icon: Briefcase, color: 'bg-brand-50 text-brand-600', sub: `${formatNumber(s.newJobs)} new` },
  { label: 'Matched Jobs', value: formatNumber(s.matchedJobs), icon: Target, color: 'bg-emerald-50 text-emerald-600', sub: '≥ 70% match' },
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
        subtitle="Best matching jobs based on your resume profile"
        actions={<Link to="/jobs?recommended=1" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>}
      >
        {recommended.loading ? (
          <div className="grid gap-4 md:grid-cols-2"><div className="h-24 animate-pulse rounded bg-slate-100" /><div className="h-24 animate-pulse rounded bg-slate-100" /></div>
        ) : (recommended.data?.jobs || []).length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {(recommended.data.jobs).slice(0, 4).map((job) => <JobCard key={job._id} job={job} />)}
          </div>
        ) : (
          <EmptyState icon="🎯" title="No recommendations yet" description="Discovered jobs with ≥70% match will appear here." action={<button onClick={runDiscovery} disabled={discovering} className="btn-primary">{discovering ? 'Discovering…' : 'Discover jobs'}</button>} />
        )}
      </Card>
    </div>
  );
}