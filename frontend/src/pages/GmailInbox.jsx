import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RefreshCw, Search, Mail, Paperclip, Check, CheckCheck,
  ExternalLink, Inbox, Tag, ChevronRight,
  Wifi, WifiOff, Settings, Copy, CheckCircle2,
  ShieldCheck, Sparkles, LogOut, Lock, ArrowRight,
  Clock, AlertCircle
} from 'lucide-react';
import { emailService, gmailService, authService } from '../services';
import { useAuth } from '../context/AuthContext.jsx';
import { EMAIL_CATEGORIES } from '../utils/constants.js';
import { ErrorState } from '../components/common/Feedbacks.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { relativeTime, initials } from '../utils/format.js';

export default function GmailInbox() {
  const { user, reload } = useAuth();
  const [params, setParams] = useSearchParams();
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selected, setSelected] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const [syncProgress, setSyncProgress] = useState('');
  const [gmailStatus, setGmailStatus] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Advanced developer options (hidden by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const unreadOnly = params.get('unread') === '1';

  const gmailConnected = Boolean(user?.gmailConnected || gmailStatus?.connected);
  const connectedEmail = user?.gmailEmail || gmailStatus?.gmailEmail || user?.email || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setParams(next);
    setPage(1);
  };

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await emailService.getAll({
        search: search || undefined,
        category: category || undefined,
        unread: unreadOnly ? 'true' : undefined,
        page,
        limit,
      });
      setEmails(res.emails || []);
      setTotal(res.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, unreadOnly, page, limit]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await gmailService.status();
      setGmailStatus(res);
      if (res.lastGmailSync) setLastSync(res.lastGmailSync);
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (gmailConnected) fetchEmails();
    else setLoading(false);
  }, [gmailConnected, fetchEmails]);

  // Handle OAuth callback query params & popup messages
  useEffect(() => {
    if (!params.get('gmail')) return;
    const p = new URLSearchParams(params);
    const status = p.get('gmail');
    const reason = p.get('reason') || '';
    p.delete('gmail');
    p.delete('reason');
    setParams(p, { replace: true });
    reload();
    fetchStatus();

    // If opened inside popup window, signal opener and close
    if (window.opener && window.opener !== window) {
      try {
        window.opener.postMessage({ type: 'GMAIL_AUTH_COMPLETE', status, reason }, window.location.origin);
        window.close();
      } catch {
        // Fallback
      }
    }

    if (status === 'connected') {
      toast.success('Gmail connected successfully! Starting automatic inbox sync…');
      setTimeout(() => sync(), 1200);
    } else {
      toast.error(reason ? `Connection failed: ${reason}` : 'Google connection was cancelled or failed.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for popup auth messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GMAIL_AUTH_COMPLETE') {
        reload();
        fetchStatus();
        if (event.data.status === 'connected') {
          toast.success('Gmail connected! Syncing emails now…');
          setTimeout(() => sync(), 1000);
        } else if (event.data.reason) {
          toast.error(`Google auth error: ${event.data.reason}`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1-Click Connect to Google
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await gmailService.getAuthUrl();
      if (!res.authUrl) {
        toast.error(res.message || 'Gmail integration is being prepared. Please try again.');
        return;
      }
      // Open standard Google OAuth popup window
      const popup = window.open(res.authUrl, 'google_oauth_popup', 'width=520,height=660,menubar=no,toolbar=no');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Popup blocked: redirect in current window
        window.location.href = res.authUrl;
      }
    } catch (err) {
      toast.error(err.message || 'Could not connect to Google');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Are you sure you want to disconnect Gmail for ${connectedEmail}? All your previously imported job emails will remain safe in your dashboard.`)) {
      return;
    }
    setDisconnecting(true);
    try {
      await gmailService.disconnect();
      toast.success('Gmail disconnected');
      await reload();
      await fetchStatus();
      setEmails([]);
      setTotal(0);
    } catch (err) {
      toast.error(err.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const sync = async (opts = {}) => {
    if (syncing) return;
    setSyncing(true);
    setSyncProgress('Connecting to your Gmail inbox…');
    try {
      setSyncProgress('Scanning job-related emails & replies…');
      const res = await gmailService.sync({
        maxResults: opts.maxResults || 25,
        maxPages: opts.maxPages || 1,
      });
      setLastSync(new Date().toISOString());
      toast.success(res.message || 'Inbox synchronized successfully!');
      await fetchStatus();
    } catch (err) {
      if (err.message?.includes('expired') || err.message?.includes('reconnect') || err.message?.includes('not connected')) {
        toast.error(
          <div className="flex items-center gap-2">
            <span>Gmail connection expired.</span>
            <button onClick={handleConnect} className="underline font-bold">Reconnect Now</button>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(err.message || 'Failed to sync Gmail');
      }
    } finally {
      setSyncProgress('');
      setSyncing(false);
      fetchEmails();
    }
  };

  const toggleSelect = (id) => {
    setSelected(s => {
      const next = { ...s };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const selectAll = () => {
    if (Object.keys(selected).length === emails.length && emails.length > 0) setSelected({});
    else setSelected(Object.fromEntries(emails.map(e => [e._id, true])));
  };

  const bulkSetRead = async (read) => {
    const ids = Object.keys(selected);
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id => emailService.markRead(id, read)));
      toast.success(read ? `Marked ${ids.length} as read` : `Marked ${ids.length} as unread`);
      setSelected({});
      fetchEmails();
    } catch (err) {
      toast.error('Bulk update failed: ' + err.message);
    }
  };

  const copyRedirectUri = () => {
    const uri = typeof window !== 'undefined' ? `${window.location.origin}/api/gmail/callback` : '';
    if (!uri) return;
    navigator.clipboard.writeText(uri);
    setCopiedRedirect(true);
    toast.success('Redirect URI copied to clipboard!');
    setTimeout(() => setCopiedRedirect(false), 2500);
  };

  const selectedCount = Object.keys(selected).length;
  const unreadCount = emails.filter(e => !e.isRead).length;

  const catColors = {
    JOB_APPLICATION: 'bg-blue-100 text-blue-700 border-blue-200',
    INTERVIEW: 'bg-purple-100 text-purple-700 border-purple-200',
    OFFER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTION: 'bg-rose-100 text-rose-700 border-rose-200',
    SHORTLIST: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    ASSESSMENT: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    FOLLOW_UP: 'bg-amber-100 text-amber-700 border-amber-200',
    RECRUITER: 'bg-violet-100 text-violet-700 border-violet-200',
    OTHER: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  // ─── 1-CLICK EASY DISCONNECTED STATE ───────────────────────────────────────
  if (!gmailConnected) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-2">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-red-500/20">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            Gmail Integration
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Connect your Google account with one click to automatically track job applications, schedule interviews, and capture offer updates.
          </p>
        </div>

        {/* 1-Click Connect Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 sm:p-10 text-center">
            {/* Account Confirmation Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Connecting for account: <span className="font-semibold text-slate-900">{user?.email}</span>
            </div>

            {/* Big Google Button */}
            <div className="max-w-md mx-auto space-y-3">
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-base shadow-sm transition-all hover:shadow-md active:scale-[0.99] disabled:opacity-75"
              >
                {/* Official Google G Icon */}
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {connecting ? 'Connecting with Google…' : 'Sign in & Connect with Google'}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Read-only access · We never send emails or share your data</span>
              </div>
            </div>
          </div>

          {/* Automatic Features Info */}
          <div className="border-t border-slate-100 bg-slate-50/70 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">1-Click Authorize</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Select your Google account in the popup. No manual API setup needed.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Auto-Sync Emails</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Inbox emails are fetched and linked to your applied job listings automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 font-bold">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">AI Classification</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Smart categorization for Interview invites, Assessments, Offers &amp; Rejections.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Developer Settings (Folded away by default) */}
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors inline-flex items-center gap-1"
          >
            <Settings className="h-3.5 w-3.5" />
            {showAdvanced ? 'Hide Advanced Settings' : 'Advanced Settings'}
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white text-left text-xs text-slate-600 space-y-3 max-w-lg mx-auto">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">OAuth Callback URI</span>
                <button
                  onClick={copyRedirectUri}
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-800"
                >
                  {copiedRedirect ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedRedirect ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono bg-slate-50 p-2 rounded border border-slate-200 truncate select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/gmail/callback` : ''}
              </div>
              <p className="text-[11px] text-slate-400">
                Managed automatically by system settings in <Link to="/settings" className="underline text-brand-600">Settings → API Keys</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── CONNECTED STATE ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Mail className="h-4 w-4" />
            </div>
            Gmail Inbox
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-brand-600 text-[11px] font-bold text-white px-1.5">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected: {connectedEmail}
            </span>
            <span className="text-slate-400">·</span>
            <span>{total} emails synced</span>
            {lastSync && (
              <>
                <span className="text-slate-400">·</span>
                <span>last sync {relativeTime(lastSync)}</span>
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://mail.google.com/mail/u/0/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" /> Open Gmail
          </a>

          <button
            onClick={() => sync({ maxResults: 25, maxPages: 1 })}
            disabled={syncing}
            className="btn-primary text-xs shadow-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? (syncProgress || 'Syncing…') : 'Sync Inbox'}
          </button>

          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
            title="Disconnect Gmail Account"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Sync progress banner */}
      {syncing && syncProgress && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-700 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-brand-600" />
          <span className="font-medium">{syncProgress}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={e => updateParam('search', e.target.value)}
              placeholder="Search sender, company, subject, message body…"
              className="input pl-9 text-sm"
            />
          </div>
          <select
            value={category}
            onChange={e => updateParam('category', e.target.value)}
            className="input text-sm w-auto"
          >
            <option value="">All Categories</option>
            {(EMAIL_CATEGORIES || []).map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={() => updateParam('unread', unreadOnly ? '' : '1')}
            className={`btn-secondary text-sm ${unreadOnly ? 'bg-brand-50 text-brand-700 border-brand-300 font-semibold' : ''}`}
          >
            <Mail className="h-4 w-4" /> Unread Only
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
          <span><b>{selectedCount}</b> selected</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkSetRead(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-200 text-xs font-medium hover:bg-brand-50 transition-colors">
              <Check className="h-3.5 w-3.5" /> Mark read
            </button>
            <button onClick={() => bulkSetRead(false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brand-200 text-xs font-medium hover:bg-brand-50 transition-colors">
              <CheckCheck className="h-3.5 w-3.5" /> Mark unread
            </button>
            <button onClick={() => setSelected({})} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Email List */}
      {loading ? (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-4 w-4 rounded bg-slate-100 animate-pulse" />
              <div className="h-9 w-9 rounded-full bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 rounded bg-slate-100 animate-pulse" />
                <div className="h-3 w-48 rounded bg-slate-100 animate-pulse" />
              </div>
              <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEmails} />
      ) : emails.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            {search || category || unreadOnly ? 'No emails match your filters' : 'Inbox is empty'}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            {search || category || unreadOnly
              ? 'Try adjusting your search criteria or resetting the category filter.'
              : 'Click "Sync Inbox" to fetch your latest job-related Gmail messages.'}
          </p>
          {!search && !category && !unreadOnly && (
            <button onClick={() => sync()} disabled={syncing} className="btn-primary text-sm mx-auto flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync Inbox Now
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              <input
                type="checkbox"
                checked={emails.length > 0 && Object.keys(selected).length === emails.length}
                onChange={selectAll}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="w-9" />
              <span className="flex-1">From</span>
              <span className="hidden flex-[2] md:block">Subject</span>
              <span className="hidden w-28 lg:block text-center">Category</span>
              <span className="hidden w-24 text-right sm:block">Date</span>
              <span className="w-5" />
            </div>

            <div className="divide-y divide-slate-100">
              {emails.map(e => {
                const unread = !e.isRead;
                const catClass = catColors[e.category] || catColors['OTHER'];
                return (
                  <div
                    key={e._id}
                    className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 cursor-pointer ${unread ? 'bg-white font-medium' : 'bg-slate-50/40 text-slate-600'}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selected[e._id]}
                      onChange={() => toggleSelect(e._id)}
                      onClick={ev => ev.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {/* Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        unread
                          ? 'bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {initials(e.sender)}
                    </div>

                    <Link to={`/emails/${e._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      {/* Sender */}
                      <div className="min-w-0 w-36 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                            {e.sender}
                          </p>
                          {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                        </div>
                        <p className="truncate text-[11px] text-slate-400">{e.senderEmail}</p>
                      </div>

                      {/* Subject + snippet */}
                      <div className="min-w-0 flex-1 hidden md:block">
                        <div className="flex items-baseline gap-2">
                          <span className={`truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {e.subject || '(no subject)'}
                          </span>
                          <span className="truncate text-xs text-slate-400 hidden lg:inline">{e.bodySnippet}</span>
                        </div>
                      </div>

                      {/* Category tag */}
                      {e.category && (
                        <span className={`hidden lg:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${catClass} w-28 justify-center shrink-0`}>
                          <Tag className="h-2.5 w-2.5" />
                          {e.category.replace('_', ' ')}
                        </span>
                      )}

                      {/* Date */}
                      <span className={`hidden w-24 shrink-0 text-right text-xs sm:block ${unread ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                        {relativeTime(e.receivedAt)}
                      </span>

                      {/* Attachment */}
                      <span className="w-5 shrink-0 text-slate-400">
                        {e.hasAttachments ? <Paperclip className="h-3.5 w-3.5" /> : null}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <Pagination page={page} pages={Math.ceil(total / limit)} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 px-1">
        <div className="flex items-center gap-2">
          {gmailConnected ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <Wifi className="h-3.5 w-3.5" /> Connected ({connectedEmail})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <WifiOff className="h-3.5 w-3.5 text-rose-400" /> Disconnected
            </span>
          )}
        </div>
        {lastSync && <span>Last synced {relativeTime(lastSync)}</span>}
      </div>
    </div>
  );
}