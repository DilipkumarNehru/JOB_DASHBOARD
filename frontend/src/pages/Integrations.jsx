import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, Unplug, Play, Plug, ShieldCheck, Webhook } from 'lucide-react';
import { gmailService, n8nService } from '../services';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { ErrorState } from '../components/common/Feedbacks.jsx';
import { useForm } from '../hooks/useForm.js';
import { formatDateTime } from '../utils/format.js';

export default function Integrations() {
  const { user, reload } = useAuth();
  const [params, setParams] = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [authError, setAuthError] = useState('');

  const gmailConnected = !!user?.gmailConnected;

  useEffect(() => {
    if (params.get('gmail') === 'connected') {
      reload();
      const p = new URLSearchParams(params);
      p.delete('gmail');
      setParams(p, { replace: true });
      toast.success('Gmail connected successfully');
    }
  }, []);

  const connect = async () => {
    setAuthError('');
    try {
      const res = await gmailService.getAuthUrl();
      if (!res.authUrl) {
        setAuthError(res.message || 'Gmail not configured on the server');
        return;
      }
      window.location.href = res.authUrl;
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await gmailService.sync();
      toast.success(res.message);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Gmail from this dashboard? Existing emails stay saved locally.')) return;
    setDisconnecting(true);
    try {
      const res = await gmailService.disconnect();
      toast.success(res.message);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Integrations</h2>
        <p className="text-sm text-slate-500">Connect external tools to automate your job search.</p>
      </div>

      <Card title="Gmail" subtitle="Sync recruiter emails and auto-link them to applications">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${gmailConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{gmailConnected ? 'Gmail connected' : 'Gmail not connected'}</p>
              <p className="mt-1 max-w-lg text-sm text-slate-500">
                Connect with Google OAuth to ingest recruiter emails. Only job-search-related emails are classified — nothing is ever sent automatically.
              </p>
              {gmailConnected && user?.gmailEmail && (
                <p className="mt-1 text-xs text-slate-400">Account: <b>{user.gmailEmail}</b></p>
              )}
              {gmailConnected && user?.lastGmailSync && (
                <p className="mt-1 text-xs text-slate-400">Last sync: {formatDateTime(user.lastGmailSync)}</p>
              )}
            </div>
          </div>

          {gmailConnected ? (
            <div className="flex shrink-0 gap-2">
              <button onClick={sync} disabled={syncing} className="btn-primary">
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Sync now'}
              </button>
              <button onClick={disconnect} disabled={disconnecting} className="btn-secondary text-red-600"><Unplug className="h-4 w-4" /> Disconnect</button>
            </div>
          ) : (
            <div className="shrink-0 space-y-2 text-right">
              <button onClick={connect} className="btn-primary"><Plug className="h-4 w-4" /> Connect Gmail</button>
              {authError && <p className="text-xs text-red-600">{authError}</p>}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Requires <code>GOOGLE_CLIENT_ID</code> & <code>GOOGLE_CLIENT_SECRET</code> in the server <code>.env</code>. OAuth is read-scope only.
        </div>
      </Card>

      <Card title="n8n automation" subtitle="Trigger local workflows or push data to the dashboard webhooks">
        <p className="text-sm text-slate-600">
          Your dashboard exposes webhooks for n8n at <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/api/n8n/*</code> (jobs, emails, followups). Prebuilt workflows live in the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">n8n/workflows</code> folder of the repo.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[
            ['gmail-sync', 'Pushes new recruiter emails into the dashboard'],
            ['job-discovery', 'Discovers jobs from APIs & career pages'],
            ['resume-matching', 'Scores new jobs against your resume'],
            ['resume-customization', 'Generates tailored resumes for high-match roles'],
            ['follow-up-reminder', 'Schedules follow-up reminders'],
          ].map(([wf, desc]) => (
            <div key={wf} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-700"><Webhook className="mr-1.5 inline h-4 w-4 text-slate-400" />{wf}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <TriggerButton workflow={wf} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Job discovery sources" subtitle="Sources the dashboard scans when you run discovery">
        <div className="space-y-2 text-sm text-slate-600">
          <p>• <b>RemoteOK</b> & <b>Arbeitnow</b> APIs — imported with keywords from your resume profile.</p>
          <p>• <b>Company career pages</b> — from your tracked companies in the Companies section.</p>
          <p>• <b>n8n / manual entry</b> — anything pushed via webhooks or added manually.</p>
          <Link to="/companies" className="inline-block font-medium text-brand-600 hover:underline">Manage companies →</Link>
        </div>
      </Card>
    </div>
  );
}

const TriggerButton = ({ workflow }) => {
  const { values, handleChange, handleSubmit, submitting } = useForm(
    { userId: '', payload: '' },
    async (v) => {
      let payload = {};
      if (v.payload.trim()) {
        try {
          payload = JSON.parse(v.payload);
        } catch {
          throw new Error('Payload must be valid JSON');
        }
      }
      if (v.userId.trim()) payload.userId = v.userId.trim();
      const res = await n8nService.trigger({ workflow, payload });
      if (res.success) toast.success(`n8n '${workflow}' triggered`);
      else toast(res.error || `n8n not reachable (see server logs)`, { icon: 'ℹ️' });
    }
  );

  if (!submitting) {
    return (
      <div className="relative">
        <input className="input w-44 px-2 py-1 text-xs" placeholder={workflow === 'gmail-sync' ? 'userId…' : 'payload JSON…'} value={values.payload || values.userId} onChange={(e) => { if (workflow === 'gmail-sync') handleChange({ target: { name: 'userId', value: e.target.value } }); else handleChange({ target: { name: 'payload', value: e.target.value } }); }} />
        <button onClick={handleSubmit} className="btn-secondary ml-1.5 px-2.5 py-1 text-xs"><Play className="h-3 w-3" /> Run</button>
      </div>
    );
  }
  return <span className="text-xs text-slate-400">Triggering…</span>;
};