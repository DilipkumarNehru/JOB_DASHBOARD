import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Mail, User, StickyNote, CalendarPlus, CheckCircle2, ExternalLink, Phone } from 'lucide-react';
import { applicationService, interviewService, followUpService, emailService } from '../services';
import { APPLICATION_STATUSES } from '../utils/constants.js';
import { PageLoader, ErrorState } from '../components/common/Feedbacks.jsx';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge, MatchBadge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { useForm } from '../hooks/useForm.js';
import { formatDate, formatDateTime } from '../utils/format.js';

export default function ApplicationDetails() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInterview, setShowInterview] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await applicationService.get(id);
      setApp(res.application);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status) => {
    setSavingStatus(true);
    try {
      if (status !== app.status) {
        // Try to create an interview if status is interview-related
        await applicationService.update(id, { status, statusNote: 'Manual status change' });
        toast.success(`Status → ${status}`);
        load();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const linkEmail = async (emailId) => {
    try {
      await emailService.link(emailId, { applicationId: id });
      toast.success('Email linked to application');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!app) return null;

  const job = app.jobId;

  return (
    <div className="space-y-5">
      <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back</Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{app.role}</h2>
            <p className="mt-1 text-sm text-slate-500">{app.company} · Applied {formatDate(app.applicationDate)}</p>
          </div>
          <div>
            <select
              className="input w-56"
              value={app.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={savingStatus}
            >
              {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="mt-2 flex justify-end"><StatusBadge status={app.status} map={Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 'bg-brand-100 text-brand-700']))} /></div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {job && (
            <Link to={`/jobs/${job._id || app.jobId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
              {job.jobTitle || 'Job'} <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
          {app.applicationUrl && (
            <a href={app.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
              Application link <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {app.resumeVersionId && <span className="badge bg-violet-100 text-violet-700">Customized resume linked</span>}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => setShowInterview(true)} className="btn-secondary"><Calendar className="h-4 w-4" /> Schedule interview</button>
          <button onClick={() => setShowFollowUp(true)} className="btn-secondary"><CalendarPlus className="h-4 w-4" /> Schedule follow-up</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card title="Notes">
            {app.notes ? <p className="whitespace-pre-wrap text-sm text-slate-600">{app.notes}</p> : <p className="text-sm text-slate-400">No notes yet.</p>}
            <textarea className="input mt-3" defaultValue={app.notes} placeholder="Add notes…" onBlur={async (e) => { if (e.target.value !== app.notes) { await applicationService.update(id, { notes: e.target.value }); toast.success('Notes saved'); load(); } }} />
          </Card>

          <Card title="Interviews">
            {(app.interviews || []).length === 0 && <p className="text-sm text-slate-400">No interviews scheduled.</p>}
            <div className="space-y-3">
              {app.interviews.map((iv) => (
                <div key={iv._id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-800">{iv.round} <span className="text-xs text-slate-400">· {iv.type}</span></p>
                  <p className="mt-1 text-xs text-slate-500"><Calendar className="mr-1 inline h-3 w-3" />{formatDateTime(iv.scheduledDate)}</p>
                  {iv.meetingLink && <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs font-medium text-brand-600 hover:underline">Join meeting <ExternalLink className="ml-1 inline h-3 w-3" /></a>}
                  <div className="mt-2"><StatusBadge status={iv.status} map={{ Scheduled: 'bg-emerald-100 text-emerald-700', Completed: 'bg-slate-200 text-slate-600', Rescheduled: 'bg-amber-100 text-amber-700', Cancelled: 'bg-red-100 text-red-700' }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <Card title="Timeline">
            {(app.timeline || []).length === 0 ? <p className="text-sm text-slate-400">No timeline events.</p> :
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {[...(app.timeline || [])].reverse().map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-brand-600 bg-white" />
                    <p className="text-sm font-medium text-slate-800">{t.status}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(t.date)}{t.note ? ` · ${t.note}` : ''}</p>
                  </li>
                ))}
              </ol>}
          </Card>

          <Card title="Linked emails" subtitle="Emails matched to this application">
            {(app.emails || []).length === 0 && <p className="text-sm text-slate-400">No emails linked. Sync Gmail or link unlinked emails from the Emails section.</p>}
            <div className="space-y-2">
              {app.emails.map((email) => (
                <Link key={email._id} to={`/emails/${email._id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                  <div className="flex min-w-0 items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{email.subject}</p>
                      <p className="truncate text-xs text-slate-500">{email.sender}</p>
                    </div>
                  </div>
                  <span className="badge bg-slate-100 text-slate-500">{formatDate(email.receivedAt)}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Suggestions">
            <div className="space-y-2 text-sm text-slate-600">
              <p>• Keep the status updated after each recruiter interaction — this drives your analytics.</p>
              <p>• Schedule a follow-up ~5 working days after applying if there is no response.</p>
              <p>• Match recruiter emails from the <Link to="/emails?status=needs_review" className="font-medium text-brand-600 hover:underline">Emails → Needs Review</Link> section.</p>
            </div>
          </Card>
        </div>
      </div>

      <InterviewModal open={showInterview} onClose={() => setShowInterview(false)} app={app} onSaved={() => { setShowInterview(false); load(); }} />
      <FollowUpModal open={showFollowUp} onClose={() => setShowFollowUp(false)} app={app} onSaved={() => { setShowFollowUp(false); load(); }} />
    </div>
  );
}

const InterviewModal = ({ open, onClose, app, onSaved }) => {
  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    applicationId: app._id, round: 'Round 1 - Technical', type: 'Technical Interview',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), durationMinutes: 60,
    interviewerName: '', meetingLink: '', preparationNotes: '', status: 'Scheduled',
  }, async (v) => {
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

const FollowUpModal = ({ open, onClose, app, onSaved }) => {
  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    applicationId: app._id, company: app.company, role: app.role,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    recruiterName: '', recruiterEmail: '', notes: '', nextAction: 'Send polite status check email',
  }, async (v) => {
    await followUpService.create(v);
    toast.success('Follow-up scheduled');
    onSaved();
  });

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Schedule follow-up"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Schedule'}</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className="label">Due date *</label><input type="date" name="dueDate" className="input" value={values.dueDate} onChange={handleChange} required /></div>
        <div><label className="label">Recruiter name</label><input name="recruiterName" className="input" value={values.recruiterName} onChange={handleChange} /></div>
        <div><label className="label">Recruiter email</label><input name="recruiterEmail" type="email" className="input" value={values.recruiterEmail} onChange={handleChange} /></div>
        <div><label className="label">Next action</label><input name="nextAction" className="input" value={values.nextAction} onChange={handleChange} /></div>
        <div className="md:col-span-2"><label className="label">Notes</label><textarea name="notes" className="input" value={values.notes} onChange={handleChange} /></div>
      </div>
      {errors.submit && <p className="mt-3 text-sm text-red-600">{errors.submit}</p>}
    </Modal>
  );
};