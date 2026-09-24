import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarPlus, CalendarClock, Video, User, Trash2 } from 'lucide-react';
import { interviewService } from '../services';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge, Badge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { useForm } from '../hooks/useForm.js';
import { formatDateTime } from '../utils/format.js';

const INTERVIEW_STATUSES = ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'];
const INTERVIEW_STATUS_BADGE = {
  Scheduled: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-slate-200 text-slate-600',
  Rescheduled: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getAll({ upcoming: upcomingOnly || undefined });
      setInterviews(res.interviews || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterviews(); }, [upcomingOnly]);

  const changeStatus = async (iv, status) => {
    try {
      await interviewService.update(iv._id, { status });
      toast.success('Interview updated');
      fetchInterviews();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try {
      await interviewService.remove(id);
      toast.success('Interview deleted');
      fetchInterviews();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const upcoming = interviews.filter((i) => new Date(i.scheduledDate) >= new Date());

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Interviews</h2>
          <p className="text-sm text-slate-500">{upcoming.length} upcoming · {interviews.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setUpcomingOnly((v) => !v)} className="btn-secondary">
            <input type="checkbox" className="mr-1.5" checked={upcomingOnly} readOnly /> Upcoming only
          </button>
          <button onClick={() => setShowNew(true)} className="btn-primary"><CalendarPlus className="h-4 w-4" /> Schedule interview</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInterviews} />
      ) : interviews.length === 0 ? (
        <EmptyState icon="📅" title="No interviews scheduled" description="Schedule interviews from an application's detail page or here." action={<button onClick={() => setShowNew(true)} className="btn-primary">Schedule interview</button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {interviews.map((iv) => (
            <Card key={iv._id} className="p-0">
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 shrink-0 text-brand-600" />
                    <p className="truncate font-semibold text-slate-800">{iv.round}</p>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                    <Video className="h-4 w-4 text-slate-400" /> {iv.type}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    {iv.applicationId ? (
                      <Link to={`/applications/${iv.applicationId._id}`} className="truncate font-medium text-brand-600 hover:underline">
                        {iv.applicationId.company} · {iv.applicationId.role}
                      </Link>
                    ) : (
                      <span className="text-slate-400">No linked application</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 space-y-2 text-right">
                  <StatusBadge status={iv.status} map={INTERVIEW_STATUS_BADGE} />
                  <div className="flex gap-1">
                    <select className="input w-auto px-2 py-1 text-xs" value={iv.status} onChange={(e) => changeStatus(iv, e.target.value)}>
                      {INTERVIEW_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => remove(iv._id)} className="btn-ghost h-8 w-8 p-0 text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-700"><CalendarClock className="mr-1.5 inline h-4 w-4" />{formatDateTime(iv.scheduledDate)} · {iv.durationMinutes || 60} min</p>
                {iv.interviewerName && <p className="mt-1 text-xs text-slate-500"><User className="mr-1 inline h-3 w-3" />{iv.interviewerName}</p>}
                {iv.meetingLink && (
                  <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-brand-600 hover:underline">Join meeting →</a>
                )}
                {iv.preparationNotes && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">{iv.preparationNotes}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewInterviewModal open={showNew} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); fetchInterviews(); }} />
    </div>
  );
}

const NewInterviewModal = ({ open, onClose, onSaved }) => {
  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    applicationId: '', round: 'Round 1 - Technical', type: 'Technical Interview',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: 60, interviewerName: '', meetingLink: '', preparationNotes: '', status: 'Scheduled',
  }, async (v) => {
    if (!v.applicationId) throw new Error('An application is required. Create one, then schedule from its detail page.');
    if (v.scheduledDate.length === 16) v.scheduledDate = new Date(v.scheduledDate).toISOString();
    await interviewService.create(v);
    toast.success('Interview scheduled');
    onSaved();
  });

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Schedule interview"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Schedule'}</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">Application ID</label>
          <input name="applicationId" className="input" value={values.applicationId} onChange={handleChange} placeholder="Paste application id (open the application first)" />
          <p className="mt-1 text-xs text-slate-400">Tip: schedule from an application's detail page instead — the link is automatic.</p>
        </div>
        <div><label className="label">Round</label><input name="round" className="input" value={values.round} onChange={handleChange} /></div>
        <div><label className="label">Type</label>
          <select name="type" className="input" value={values.type} onChange={handleChange}>
            {['Screening', 'Technical Interview', 'Coding Challenge', 'System Design', 'HR Interview', 'Managerial', 'Final Round'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="label">Date & time *</label><input type="datetime-local" name="scheduledDate" className="input" value={values.scheduledDate} onChange={handleChange} required /></div>
        <div><label className="label">Duration (min)</label><input type="number" name="durationMinutes" className="input" value={values.durationMinutes} onChange={handleChange} /></div>
        <div><label className="label">Interviewer</label><input name="interviewerName" className="input" value={values.interviewerName} onChange={handleChange} /></div>
        <div><label className="label">Meeting link</label><input name="meetingLink" className="input" value={values.meetingLink} onChange={handleChange} /></div>
        <div className="md:col-span-2"><label className="label">Preparation notes</label><textarea name="preparationNotes" className="input" value={values.preparationNotes} onChange={handleChange} /></div>
      </div>
      {errors.submit && <p className="mt-3 text-sm text-red-600">{errors.submit}</p>}
    </Modal>
  );
};