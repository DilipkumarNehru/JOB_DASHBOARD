import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, ChevronRight, FileCheck, Hourglass, Users, CalendarRange, Gift, XCircle, X } from 'lucide-react';
import { applicationService } from '../services';
import { APPLICATION_STATUSES } from '../utils/constants.js';
import { Pagination } from '../components/common/Pagination.jsx';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { FilterSelect } from '../components/common/Form.jsx';
import { useForm } from '../hooks/useForm.js';
import { APP_STATUS_BADGE, STATUS_BADGE } from '../utils/constants.js';
import { MatchBadge } from '../components/common/Badge.jsx';
import { formatDate } from '../utils/format.js';

const QUICK_FILTERS = [
  ['', 'All'],
  ['In Progress', 'In Progress'],
  ['Applied', 'Applied'],
  ['Shortlisted', 'Shortlisted'],
  ['Interview', 'Interviews'],
  ['Offer', 'Offers'],
  ['Rejected', 'Rejected'],
];

export default function Applications() {
  const [params, setParams] = useSearchParams();
  const urlStatus = params.get('status') || '';
  const urlCompany = params.get('company') || '';

  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalUserApps, setTotalUserApps] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(urlStatus);
  const [company, setCompany] = useState(urlCompany);
  const [showNew, setShowNew] = useState(false);

  // Sync state if URL search params change
  useEffect(() => {
    setStatus(urlStatus);
  }, [urlStatus]);

  useEffect(() => {
    setCompany(urlCompany);
  }, [urlCompany]);

  const updateStatusFilter = (newStatus) => {
    const next = new URLSearchParams(params);
    if (newStatus && status !== newStatus) {
      next.set('status', newStatus);
    } else {
      next.delete('status');
    }
    next.set('page', '1');
    setParams(next);
    setPage(1);
  };

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await applicationService.getAll({
        status: status || undefined,
        company: company || undefined,
        page,
        limit: 12
      });
      setApps(res.applications || []);
      setTotal(res.total || 0);
      setTotalUserApps(res.totalUserApps ?? res.total ?? 0);
      setStatusCounts(res.statusCounts || {});
      setPages(res.pages || 1);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, [status, company, page]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Applications</h2>
          <p className="text-sm text-slate-500">
            {status ? (
              <>
                Showing {total} applications with status <strong>{status}</strong>
              </>
            ) : (
              `${totalUserApps || total} applications tracked`
            )}
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="h-4 w-4" /> New application</button>
      </div>

      {/* Interactive KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            key: '',
            label: 'All Apps',
            count: totalUserApps || total,
            icon: FileCheck,
            color: 'text-slate-700 bg-slate-100',
            border: 'border-slate-200'
          },
          {
            key: 'In Progress',
            label: 'In Progress',
            count: statusCounts.inProgress || 0,
            icon: Hourglass,
            color: 'text-amber-700 bg-amber-50',
            border: 'border-amber-200'
          },
          {
            key: 'Shortlisted',
            label: 'Shortlisted',
            count: statusCounts['Shortlisted'] || 0,
            icon: Users,
            color: 'text-green-700 bg-green-50',
            border: 'border-green-200'
          },
          {
            key: 'Interview',
            label: 'Interviews',
            count: statusCounts.interviews || 0,
            icon: CalendarRange,
            color: 'text-violet-700 bg-violet-50',
            border: 'border-violet-200'
          },
          {
            key: 'Offer',
            label: 'Offers',
            count: statusCounts['Offer'] || 0,
            icon: Gift,
            color: 'text-lime-700 bg-lime-50',
            border: 'border-lime-200'
          },
          {
            key: 'Rejected',
            label: 'Rejected',
            count: statusCounts.rejected || 0,
            icon: XCircle,
            color: 'text-red-700 bg-red-50',
            border: 'border-red-200'
          },
        ].map((c) => {
          const isActive = status === c.key || (!status && c.key === '');
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              onClick={() => updateStatusFilter(c.key)}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 select-none hover:-translate-y-0.5 hover:shadow-md ${
                isActive
                  ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-sm'
                  : `bg-white ${c.border} hover:border-slate-300`
              }`}
              title={`Click to filter by ${c.label}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">{c.label}</span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{c.count}</p>
            </div>
          );
        })}
      </div>

      {/* Active Filter Bar if filtered */}
      {status && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2 text-xs text-brand-900">
          <span>Filtering by status: <strong>{status}</strong> ({total} applications)</span>
          <button
            onClick={() => updateStatusFilter('')}
            className="flex items-center gap-1 font-bold text-red-600 hover:text-red-700 bg-white px-2 py-0.5 rounded-md border border-red-200"
          >
            <X className="h-3 w-3" /> Clear filter
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {QUICK_FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => updateStatusFilter(key)}
            className={`badge ${
              status === key || (!status && key === '')
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto w-48">
          <FilterSelect
            label=""
            value={status}
            onChange={(v) => updateStatusFilter(v)}
            options={APPLICATION_STATUSES}
            allLabel="All Statuses"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-1"><div className="grid grid-cols-5 gap-4 p-4"><div className="h-4 animate-pulse rounded bg-slate-200" /><div className="h-4 animate-pulse rounded bg-slate-200" /><div className="h-4 animate-pulse rounded bg-slate-200" /><div className="h-4 animate-pulse rounded bg-slate-200" /><div className="h-4 animate-pulse rounded bg-slate-200" /></div></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchApps} />
      ) : apps.length === 0 ? (
        <EmptyState icon="📋" title="No applications yet" description="Track every application you send. Create one manually or apply from a job." action={<button onClick={() => setShowNew(true)} className="btn-primary">New application</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead className="bg-slate-50"><tr>
              <th className="th">Company / Role</th>
              <th className="th">Status</th>
              <th className="th">Applied</th>
              <th className="th">Match</th>
              <th className="th">Next follow-up</th>
              <th className="th"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="td">
                    <p className="font-semibold text-slate-800">{a.role}</p>
                    <p className="text-xs text-slate-500">{a.company}</p>
                  </td>
                  <td className="td"><StatusBadge status={a.status} map={APP_STATUS_BADGE} /></td>
                  <td className="td text-slate-600">{formatDate(a.applicationDate)}</td>
                  <td className="td"><MatchBadge score={a.jobId?.matchScore ?? a.matchScore} /></td>
                  <td className="td text-slate-600">{formatDate(a.nextFollowUpDate)}</td>
                  <td className="td"><Link to={`/applications/${a._id}`} className="text-brand-600 hover:text-brand-700"><ChevronRight className="h-4 w-4" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}

      <NewApplicationModal open={showNew} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); fetchApps(); }} />
    </div>
  );
}

const NewApplicationModal = ({ open, onClose, onSaved }) => {
  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    jobId: '', company: '', role: '', status: 'Applied', applicationUrl: '', applicationDate: new Date().toISOString().slice(0, 10), notes: '',
  }, async (v) => {
    const payload = { ...v };
    if (!String(payload.jobId || '').trim()) delete payload.jobId;
    payload.company = v.company && v.company.trim() ? v.company.trim() : undefined;
    payload.role = v.role && v.role.trim() ? v.role.trim() : undefined;
    if (!payload.jobId && (!payload.company || !payload.role)) throw new Error('Provide company and role, or a job ID');
    if (payload.applicationDate && payload.applicationDate.length === 10) payload.applicationDate = new Date(payload.applicationDate).toISOString();
    const res = await applicationService.create(payload);
    toast.success(res.success ? 'Application created' : res.message);
    onSaved();
  });

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="New application"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Create'}</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className="label">Job ID (optional)</label><input name="jobId" className="input" value={values.jobId} onChange={handleChange} placeholder="Mongo id" /></div>
        <div><label className="label">Status</label>
          <select name="status" className="input" value={values.status} onChange={handleChange}>{APPLICATION_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <div><label className="label">Company</label><input name="company" className="input" value={values.company} onChange={handleChange} /></div>
        <div><label className="label">Role</label><input name="role" className="input" value={values.role} onChange={handleChange} /></div>
        <div><label className="label">Application date</label><input type="date" name="applicationDate" className="input" value={values.applicationDate} onChange={handleChange} /></div>
        <div><label className="label">Application URL</label><input name="applicationUrl" className="input" value={values.applicationUrl} onChange={handleChange} /></div>
        <div className="md:col-span-2"><label className="label">Notes</label><textarea name="notes" className="input" value={values.notes} onChange={handleChange} /></div>
      </div>
      {errors.submit && <p className="mt-3 text-sm text-red-600">{errors.submit}</p>}
      <p className="mt-3 text-xs text-slate-400">Tip: open a job first and use its detail page Apply button — it links the application to the job automatically.</p>
    </Modal>
  );
};