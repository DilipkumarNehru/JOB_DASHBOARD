import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BellRing, CheckCircle2, Plus, CalendarPlus, Clock, AlertTriangle, Layers } from 'lucide-react';
import { followUpService } from '../services';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { useForm } from '../hooks/useForm.js';
import { formatDate, formatDateTime, relativeTime } from '../utils/format.js';
import dayjs from 'dayjs';

const FOLLOW_UP_STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function FollowUps() {
  const [params, setParams] = useSearchParams();
  const urlStatus = params.get('status') || '';

  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(urlStatus);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    setFilter(urlStatus);
  }, [urlStatus]);

  const updateFilter = (newFilter) => {
    const next = new URLSearchParams(params);
    if (newFilter) {
      next.set('status', newFilter);
    } else {
      next.delete('status');
    }
    setParams(next);
    setFilter(newFilter);
  };

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await followUpService.getAll({ status: filter || undefined });
      setFollowUps(res.followUps || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFollowUps(); }, [filter]);

  const markCompleted = async (fu) => {
    try {
      await followUpService.update(fu._id, { status: 'completed', completedDate: new Date().toISOString() });
      toast.success('Follow-up completed');
      fetchFollowUps();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const effectiveStatus = (fu) => {
    if (fu.status === 'completed') return 'completed';
    if (fu.status === 'pending' && dayjs(fu.dueDate).isBefore(dayjs(), 'day')) return 'overdue';
    return fu.status || 'pending';
  };

  const [pending, overdue, completed] = [
    followUps.filter((f) => effectiveStatus(f) === 'pending').length,
    followUps.filter((f) => effectiveStatus(f) === 'overdue').length,
    followUps.filter((f) => effectiveStatus(f) === 'completed').length,
  ];

  const filterCards = [
    { key: '', label: 'All Follow-ups', count: followUps.length, icon: Layers, color: 'text-slate-600 bg-slate-100', border: 'border-slate-200' },
    { key: 'pending', label: 'Pending Due', count: pending, icon: Clock, color: 'text-amber-600 bg-amber-50', border: 'border-amber-200' },
    { key: 'overdue', label: 'Overdue Items', count: overdue, icon: AlertTriangle, color: 'text-red-600 bg-red-50', border: 'border-red-200' },
    { key: 'completed', label: 'Completed', count: completed, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-200' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Follow-ups</h2>
          <p className="text-sm text-slate-500">
            {filter ? (
              <>Showing <strong>{filter}</strong> follow-ups</>
            ) : (
              `${pending} pending · ${overdue} overdue`
            )}
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="h-4 w-4" /> Schedule follow-up</button>
      </div>

      {/* Interactive Status Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {filterCards.map(c => {
          const isActive = filter === c.key || (!filter && c.key === '');
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              onClick={() => updateFilter(c.key)}
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

      <div className="flex flex-wrap gap-2">
        {filterCards.map((c) => (
          <button
            key={c.key}
            onClick={() => updateFilter(c.key)}
            className={`badge ${
              filter === c.key || (!filter && c.key === '')
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.label} ({c.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchFollowUps} />
      ) : followUps.length === 0 ? (
        <EmptyState icon="🔔" title="No follow-ups scheduled" description="After applying, schedule a polite follow-up for ~5 working days later. Overdue items surface here and on the dashboard." action={<button onClick={() => setShowNew(true)} className="btn-primary">Schedule follow-up</button>} />
      ) : (
        <div className="space-y-3">
          {followUps.map((fu) => {
            const st = effectiveStatus(fu);
            return (
              <Card key={fu._id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${st === 'overdue' ? 'bg-red-50 text-red-600' : st === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <BellRing className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {fu.role || 'Role'} <span className="font-normal text-slate-500">at {fu.company || 'company'}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">{fu.nextAction || 'Send friendly status check'}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Due {formatDate(fu.dueDate)} ({relativeTime(fu.dueDate)}){fu.recruiterName && ` · ${fu.recruiterName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={st} map={FOLLOW_UP_STATUS_BADGE} />
                    {fu.applicationId && (
                      <Link to={`/applications/${fu.applicationId}`} className="text-xs font-medium text-brand-600 hover:underline">Application →</Link>
                    )}
                    {st !== 'completed' ? (
                      <button onClick={() => markCompleted(fu)} className="btn-secondary"><CheckCircle2 className="h-4 w-4" /> Mark done</button>
                    ) : (
                      <span className="text-xs text-slate-400">{fu.completedDate ? formatDateTime(fu.completedDate) : 'Done'}</span>
                    )}
                  </div>
                </div>
                {fu.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{fu.notes}</p>}
              </Card>
            );
          })}
        </div>
      )}

      <NewFollowUpModal open={showNew} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); fetchFollowUps(); }} />
    </div>
  );
}

const NewFollowUpModal = ({ open, onClose, onSaved }) => {
  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    applicationId: '', company: '', role: '',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    recruiterName: '', recruiterEmail: '', notes: '', nextAction: 'Send polite status check email',
  }, async (v) => {
    if (!v.company && !v.role) throw new Error('Provide company or role (or an application id)');
    await followUpService.create(v);
    toast.success('Follow-up scheduled');
    onSaved();
  });

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Schedule follow-up"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Schedule'}</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className="label">Application ID (optional)</label><input name="applicationId" className="input" value={values.applicationId} onChange={handleChange} /></div>
        <div><label className="label">Due date *</label><input type="date" name="dueDate" className="input" value={values.dueDate} onChange={handleChange} required /></div>
        <div><label className="label">Company</label><input name="company" className="input" value={values.company} onChange={handleChange} /></div>
        <div><label className="label">Role</label><input name="role" className="input" value={values.role} onChange={handleChange} /></div>
        <div><label className="label">Recruiter name</label><input name="recruiterName" className="input" value={values.recruiterName} onChange={handleChange} /></div>
        <div><label className="label">Recruiter email</label><input name="recruiterEmail" type="email" className="input" value={values.recruiterEmail} onChange={handleChange} /></div>
        <div className="md:col-span-2"><label className="label">Next action</label><input name="nextAction" className="input" value={values.nextAction} onChange={handleChange} /></div>
        <div className="md:col-span-2"><label className="label">Notes</label><textarea name="notes" className="input" value={values.notes} onChange={handleChange} /></div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><CalendarPlus className="h-3.5 w-3.5" />Tip: schedule follow-ups from an application without attaching a new entry.</p>
      {errors.submit && <p className="mt-3 text-sm text-red-600">{errors.submit}</p>}
    </Modal>
  );
};