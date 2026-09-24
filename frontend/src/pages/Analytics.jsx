import { Link } from 'react-router-dom';
import {
  TrendingUp, Target, Gift, XCircle, FileText, BellRing, Mail, Send
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { analyticsService } from '../services';
import { StatCard, Card } from '../components/common/Card.jsx';
import { PageLoader, ErrorState, EmptyState } from '../components/common/Feedbacks.jsx';
import { BarChartWidget, PieChartWidget } from '../charts';
import { getMonthLabel, formatNumber } from '../utils/format.js';
import { EMAIL_CATEGORIES } from '../utils/constants.js';

const emailColor = (key) => EMAIL_CATEGORIES.find((c) => c.key === key)?.color || 'bg-slate-100 text-slate-600';

export default function Analytics() {
  const apps = useFetch(analyticsService.applications);
  const jobs = useFetch(analyticsService.jobs);
  const skills = useFetch(analyticsService.skills);
  const insights = useFetch(analyticsService.insights);
  const emailAna = useFetch(analyticsService.emails);
  const followAnas = useFetch(analyticsService.followUps);

  if (apps.loading) return <PageLoader />;
  if (apps.error) return <ErrorState message={apps.error} onRetry={apps.refetch} />;

  const a = apps.data?.analytics || {};
  const jobsData = jobs.data?.jobs || {};
  const sk = skills.data?.skills || [];
  const ins = insights.data?.insights || {};
  const em = emailAna.data?.analytics || {};
  const fu = followAnas.data?.analytics || {};

  const monthlyData = (a.byMonth || []).map((d) => ({
    label: getMonthLabel(d._id.y, d._id.m),
    count: d.count,
  }));
  const statusData = (a.byStatus || []).map((d) => ({ name: d._id, value: d.count }));
  const skillsData = sk.slice(0, 12).map((s) => ({ label: s._id, count: s.count }));
  const topCompanies = (ins.topCompanies || []).map((c) => ({ label: c._id, count: c.count }));
  const topRoles = (ins.topRoles || []).map((r) => ({ label: r._id, count: r.count }));
  const emailByCat = (em.byCategory || []).map((c) => {
    const cat = EMAIL_CATEGORIES.find((x) => x.key === c._id);
    return { name: cat?.label || c._id, value: c.count };
  });

  const perfCards = [
    { label: 'Applications Sent', value: formatNumber(a.applied), icon: Send },
    { label: 'Response Rate', value: `${a.responseRate ?? 0}%`, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
    { label: 'Interview Conversion', value: `${a.interviewConversionRate ?? 0}%`, icon: Target, color: 'bg-violet-50 text-violet-600' },
    { label: 'Offer Rate', value: `${a.offerRate ?? 0}%`, icon: Gift, color: 'bg-lime-50 text-lime-600' },
    { label: 'Rejection Rate', value: `${a.rejectionRate ?? 0}%`, icon: XCircle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-500">Pipeline performance, demand signals and email activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {perfCards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Applications per month" subtitle="Track your application momentum">
          {monthlyData.length ? <BarChartWidget data={monthlyData} name="Applications" /> : <EmptyState title="No application data" />}
        </Card>
        <Card title="Pipeline status distribution">
          {statusData.length ? <PieChartWidget data={statusData} /> : <EmptyState title="No status data yet" />}
        </Card>
        <Card title="Top companies in your pool" subtitle="Where the jobs are & average match">
          {topCompanies.length ? <BarChartWidget data={topCompanies} color="#10b981" /> : <EmptyState title="No company data" />}
        </Card>
        <Card title="Top roles in your pool">
          {topRoles.length ? <BarChartWidget data={topRoles} color="#06b6d4" /> : <EmptyState title="No role data" />}
        </Card>
        <Card title="Most requested skills" subtitle="Across discovered jobs (count)">
          {skillsData.length ? <BarChartWidget data={skillsData} color="#8b5cf6" /> : <EmptyState title="No skill data" />}
        </Card>
        <Card title="Skills you're missing" subtitle="High-demand skills absent from your resume">
          {(ins.missingFromProfile || []).length ? (
            <div className="flex flex-wrap gap-2">
              {(ins.missingFromProfile || []).map((s) => (
                <span key={s} className="badge bg-red-100 text-red-700">{s}</span>
              ))}
            </div>
          ) : <EmptyState icon="✅" title="Nothing missing" description="Your profile covers every in-demand skill found in your job pool." />}
        </Card>
      </div>

      <Card title="Gmail & follow-up activity">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Mail className="h-3.5 w-3.5" /> Emails by category
            </p>
            {emailByCat.length ? (
              <PieChartWidget data={emailByCat} height={200} />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
                <Link to="/integrations" className="font-medium text-brand-600 hover:underline">Connect Gmail →</Link>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <span className="badge bg-emerald-100 text-emerald-700">Linked: {formatNumber(em.linked)}</span>
              <span className="badge bg-amber-100 text-amber-700">Review: {formatNumber(em.needsReview)}</span>
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <BellRing className="h-3.5 w-3.5" /> Follow-up health
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Total', fu.total, 'bg-slate-100 text-slate-600'],
                ['Pending', fu.pending, 'bg-amber-100 text-amber-700'],
                ['Overdue', fu.overdue, 'bg-red-100 text-red-700'],
                ['Completed', fu.completed, 'bg-emerald-100 text-emerald-700'],
              ].map(([label, val, cls]) => (
                <div key={label} className="rounded-lg border border-slate-200 p-3 text-center">
                  <p className={`badge ${cls}`}>{val ?? 0}</p>
                  <p className="mt-1 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <FileText className="h-3.5 w-3.5" /> Email categories
            </p>
            <div className="space-y-1.5">
              {(em.byCategory || []).slice(0, 8).map((c) => (
                <div key={c._id} className="flex items-center justify-between text-sm">
                  <span className={`badge ${emailColor(c._id)}`}>{c._id}</span>
                  <span className="text-slate-600">{formatNumber(c.count)}</span>
                </div>
              ))}
              {(em.byCategory || []).length === 0 && <p className="text-sm text-slate-400">No emails synced.</p>}
            </div>
          </div>
        </div>
      </Card>

      {(ins.frequentlyRequestedSkills || []).length > 0 && (
        <Card title="Career intelligence" subtitle="Aggregated across your whole job pool">
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium text-slate-700">Strongest matching skill</p>
              <p className="mt-1 text-brand-700">{
                ins.matchedSkillCounts?.[0] ? `${ins.matchedSkillCounts[0]._id} (matches ${ins.matchedSkillCounts[0].count} jobs)` : 'Not enough data yet'
              }</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Your market position</p>
              <p className="mt-1 text-slate-600">
                {a.applied ? `${a.applied} applications → ${a.responseRate ?? 0}% response, ${a.interviewConversionRate ?? 0}% interviews, ${a.offerRate ?? 0}% offers.` : 'Apply to more roles to unlock performance insights.'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}