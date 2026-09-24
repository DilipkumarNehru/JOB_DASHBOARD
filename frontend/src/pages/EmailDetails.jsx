import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { ArrowLeft, Mail, Link2, User, Briefcase, Eye, Paperclip, CheckCheck, Check } from 'lucide-react';
import { emailService, applicationService } from '../services';
import { EMAIL_CATEGORIES } from '../utils/constants.js';
import { PageLoader, ErrorState } from '../components/common/Feedbacks.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge, StatusBadge } from '../components/common/Badge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { EMAIL_STATUS_BADGE } from '../utils/constants.js';
import { formatDateTime, formatBytes } from '../utils/format.js';

export default function EmailDetails() {
  const { id } = useParams();
  const [email, setEmail] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLink, setShowLink] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await emailService.get(id);
      setEmail(res.email);
      const ares = await applicationService.getAll({ limit: 50 });
      setApps(ares.applications || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const changeCategory = async (category) => {
    try {
      const res = await emailService.updateCategory(id, { category });
      setEmail(res.email);
      toast.success(`Category → ${category}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleRead = async () => {
    try {
      const res = await emailService.markRead(id, !email.isRead);
      setEmail(res.email);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const link = async (applicationId) => {
    try {
      const res = await emailService.link(id, { applicationId });
      setEmail(res.email);
      setShowLink(false);
      toast.success('Email linked to application');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const autoLink = async () => {
    try {
      const res = await emailService.link(id, {});
      if (res.linked) { setEmail(res.email); toast.success('Auto-linked to an application'); }
      else toast.error(res.message || 'Could not auto-link');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!email) return null;

  const cat = EMAIL_CATEGORIES.find((c) => c.key === email.category);
  const recipients = email.recipients?.length ? email.recipients : (email.recipient ? [email.recipient] : []);
  const hasHtml = !!email.bodyHtml;
  const bodyText = email.bodyFull || email.bodySnippet;
  const sanitizedHtml = hasHtml ? DOMPurify.sanitize(email.bodyHtml) : '';

  return (
    <div className="space-y-5">
      <Link to="/emails" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to emails
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{email.subject || '(no subject)'}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />{email.sender} {email.senderEmail && <span className="text-xs text-slate-400">&lt;{email.senderEmail}&gt;</span>}</span>
              {!email.isRead && <Badge className="bg-brand-100 text-brand-700">Unread</Badge>}
              <span>{formatDateTime(email.receivedAt)}</span>
            </div>
            {recipients.length > 0 && <p className="mt-1 text-xs text-slate-400">To: {recipients.join(', ')}</p>}
            {email.cc?.length > 0 && <p className="mt-0.5 text-xs text-slate-400">Cc: {email.cc.join(', ')}</p>}
            {email.bcc?.length > 0 && <p className="mt-0.5 text-xs text-slate-400">Bcc: {email.bcc.join(', ')}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={cat?.color || 'bg-slate-100 text-slate-600'}>{email.category}</Badge>
            <Badge className={EMAIL_STATUS_BADGE[email.status] || EMAIL_STATUS_BADGE.unlinked}>{email.status}</Badge>
            <button onClick={toggleRead} className="btn-secondary px-2.5 py-1.5 text-xs" title="Toggle read status">
              {email.isRead ? <><Check className="h-3.5 w-3.5" /> Mark unread</> : <><CheckCheck className="h-3.5 w-3.5" /> Mark read</>}
            </button>
          </div>
        </div>

        {email.labels?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {email.labels.map((l) => <Badge key={l}>{l}</Badge>)}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <select className="input w-56" value={email.category} onChange={(e) => changeCategory(e.target.value)}>
            {EMAIL_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {email.status !== 'linked' && (
            <>
              <button onClick={autoLink} className="btn-secondary"><Link2 className="h-4 w-4" /> Auto-link</button>
              <button onClick={() => setShowLink(true)} className="btn-secondary"><User className="h-4 w-4" /> Link to application</button>
            </>
          )}
        </div>

        {(email.companyName || email.jobRole) && (
          <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
            {email.companyName && (
              <div className="flex items-center gap-2 text-sm"><Briefcase className="h-4 w-4 text-slate-400" /> <span className="text-slate-500">Company:</span> <b className="text-slate-800">{email.companyName}</b></div>
            )}
            {email.jobRole && (
              <div className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4 text-slate-400" /> <span className="text-slate-500">Role:</span> <b className="text-slate-800">{email.jobRole}</b></div>
            )}
          </div>
        )}

        {email.aiConfidence > 0 && (
          <p className="mt-3 text-xs text-slate-400">Classifier confidence: {Math.round(email.aiConfidence * 100)}%{email.classificationReason ? ` — ${email.classificationReason}` : ''}</p>
        )}

        {email.applicationId && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="text-sm text-emerald-800">
              Linked to application: <b>{email.applicationId.company || 'Unknown'} · {email.applicationId.role || '—'}</b>
              {email.applicationId.status && (
                <span className="ml-2 inline-flex"><StatusBadge status={email.applicationId.status} /></span>
              )}
            </div>
            <Link to={`/applications/${email.applicationId._id}`} className="text-xs font-medium text-emerald-700 hover:underline">Open →</Link>
          </div>
        )}
      </div>

      <Card title="Message">
        {hasHtml ? (
          <div className="email-body" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        ) : bodyText ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{bodyText}</div>
        ) : (
          <p className="text-sm text-slate-400">(empty message)</p>
        )}

        {email.attachments?.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Attachments ({email.attachments.length})</p>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att, i) => (
                <div key={i} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  <span className="max-w-48 truncate">{att.filename || 'attachment'}</span>
                  {typeof att.size === 'number' && att.size > 0 && <span className="text-slate-400">· {formatBytes(att.size)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        {email.webViewLink && (
          <a href={email.webViewLink} target="_blank" rel="noreferrer" className="btn-secondary">Open in Gmail</a>
        )}
      </div>

      <LinkModal open={showLink} onClose={() => setShowLink(false)} apps={apps} onSelect={link} />
    </div>
  );
}

const LinkModal = ({ open, onClose, apps, onSelect }) => (
  <Modal open={open} onClose={onClose} title="Link to application">
    {apps.length === 0 ? (
      <p className="text-sm text-slate-500">No applications yet. Create one first.</p>
    ) : (
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {apps.map((a) => (
          <button key={a._id} onClick={() => onSelect(a._id)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-800">{a.role}</p>
              <p className="text-xs text-slate-500">{a.company} · {a.status}</p>
            </div>
            <StatusBadge status={a.status} />
          </button>
        ))}
      </div>
    )}
    <div className="mt-4 flex justify-end"><button className="btn-secondary" onClick={onClose}>Cancel</button></div>
  </Modal>
);