import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RefreshCw, Search, Mail, Paperclip, Check, CheckCheck,
  ExternalLink, Inbox, Tag, ChevronLeft, ChevronRight,
  Wifi, WifiOff, Settings, Copy,
  ShieldCheck, LogOut, Clock,
  AlertTriangle, Users, Layers, Star, Info,
  Filter, X, Database, Eye, EyeOff
} from 'lucide-react';
import { emailService, gmailService } from '../services';
import { useAuth } from '../context/AuthContext.jsx';
import { EMAIL_CATEGORIES } from '../utils/constants.js';
import { ErrorState } from '../components/common/Feedbacks.jsx';

// Gmail-style date formatter
function formatGmailDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();

  // If today: "3:45 PM"
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // If this year: "Oct 12"
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // If older year: "10/12/2024"
  return d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export default function GmailInbox() {
  const { user, reload } = useAuth();
  const [params, setParams] = useSearchParams();
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [folderCounts, setFolderCounts] = useState({
    all: 0,
    primary: 0,
    updates: 0,
    promotions: 0,
    social: 0,
    spam: 0,
    starred: 0,
    unread: 0,
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingOlder, setSyncingOlder] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selected, setSelected] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const [syncProgress, setSyncProgress] = useState('');
  const [gmailStatus, setGmailStatus] = useState(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Advanced developer options (hidden by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const folder = params.get('folder') || 'primary';
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

  const handleFolderChange = (targetFolder) => {
    const next = new URLSearchParams(params);
    next.set('folder', targetFolder);
    next.set('page', '1');
    setParams(next);
    setPage(1);
  };

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await emailService.getAll({
        folder: folder || 'primary',
        search: search || undefined,
        category: category || undefined,
        unread: unreadOnly ? 'true' : undefined,
        page,
        limit,
      });
      setEmails(res.emails || []);
      setTotal(res.total || 0);
      if (res.folderCounts) {
        setFolderCounts(res.folderCounts);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [folder, search, category, unreadOnly, page, limit]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await gmailService.status();
      setGmailStatus(res);
      if (res.lastGmailSync) setLastSync(res.lastGmailSync);
      if (typeof res.hasMoreOlder === 'boolean') setHasMoreOlder(res.hasMoreOlder);
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
      toast.success('Gmail connected successfully! Starting full mailbox sync…');
      setTimeout(() => sync({ syncAll: true, maxResults: 100, maxPages: 20 }), 1000);
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
          toast.success('Gmail connected! Starting full mailbox sync…');
          setTimeout(() => sync({ syncAll: true, maxResults: 100, maxPages: 20 }), 1000);
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
      const popup = window.open(res.authUrl, 'google_oauth_popup', 'width=520,height=660,menubar=no,toolbar=no');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = res.authUrl;
      }
    } catch (err) {
      toast.error(err.message || 'Could not connect to Google');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Are you sure you want to disconnect Gmail for ${connectedEmail}? All your previously imported emails will remain safely preserved in your dashboard.`)) {
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

  // Sync emails (recent, older, or full historical mailbox)
  const sync = async (opts = {}) => {
    const isFetchingOlder = Boolean(opts.fetchOlder);
    const isSyncAll = Boolean(opts.syncAll);
    if (syncing || syncingOlder || syncingAll) return;

    if (isSyncAll) {
      setSyncingAll(true);
      setSyncProgress('Performing deep historical sync across entire Gmail archive (Primary, Updates, Promotions, Social, Spam)…');
    } else if (isFetchingOlder) {
      setSyncingOlder(true);
      setSyncProgress('Fetching older historical emails from Gmail archive…');
    } else {
      setSyncing(true);
      setSyncProgress('Checking for new incoming emails across all folders…');
    }

    try {
      const res = await gmailService.sync({
        maxResults: opts.maxResults || (isSyncAll ? 100 : 50),
        maxPages: opts.maxPages || (isSyncAll ? 25 : 3),
        fetchOlder: isFetchingOlder,
        syncAll: isSyncAll,
        folder: opts.folder || 'ALL',
      });
      setLastSync(new Date().toISOString());
      if (typeof res.hasMoreOlder === 'boolean') setHasMoreOlder(res.hasMoreOlder);

      toast.success(res.message || 'Sync completed successfully!');
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
      setSyncingOlder(false);
      setSyncingAll(false);
      fetchEmails();
    }
  };

  // Toggle star
  const handleToggleStar = async (emailId, ev) => {
    if (ev) ev.stopPropagation();
    try {
      // Optimistically update UI
      setEmails(prev => prev.map(e => {
        if (e._id !== emailId) return e;
        const currentStarred = (e.labels || []).includes('STARRED');
        const nextLabels = currentStarred
          ? (e.labels || []).filter(l => l !== 'STARRED')
          : [...(e.labels || []), 'STARRED'];
        return { ...e, labels: nextLabels };
      }));

      await emailService.toggleStar(emailId);
      // Refresh folder counts
      const res = await emailService.getAll({ folder: 'starred', limit: 1 });
      if (res.folderCounts) setFolderCounts(res.folderCounts);
    } catch (err) {
      toast.error('Could not toggle star: ' + err.message);
      fetchEmails();
    }
  };

  // Toggle single read/unread status
  const handleToggleRead = async (emailId, currentRead, ev) => {
    if (ev) ev.stopPropagation();
    try {
      setEmails(prev => prev.map(e => e._id === emailId ? { ...e, isRead: !currentRead } : e));
      await emailService.markRead(emailId, !currentRead);
    } catch (err) {
      toast.error('Could not update read status: ' + err.message);
      fetchEmails();
    }
  };

  const toggleSelect = (id, ev) => {
    if (ev) ev.stopPropagation();
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

  const selectRead = () => {
    const readMap = {};
    emails.forEach(e => { if (e.isRead) readMap[e._id] = true; });
    setSelected(readMap);
  };

  const selectUnread = () => {
    const unreadMap = {};
    emails.forEach(e => { if (!e.isRead) unreadMap[e._id] = true; });
    setSelected(unreadMap);
  };

  const selectStarred = () => {
    const starredMap = {};
    emails.forEach(e => { if ((e.labels || []).includes('STARRED')) starredMap[e._id] = true; });
    setSelected(starredMap);
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
  const isAnySyncing = syncing || syncingOlder || syncingAll;

  // Gmail folder tab configuration
  const folderTabs = useMemo(() => [
    { id: 'primary', label: 'Primary', icon: Inbox, count: folderCounts.primary, color: 'text-blue-600', activeBorder: 'border-blue-600 text-blue-700 bg-blue-50/60' },
    { id: 'promotions', label: 'Promotions', icon: Tag, count: folderCounts.promotions, color: 'text-emerald-600', activeBorder: 'border-emerald-600 text-emerald-700 bg-emerald-50/60' },
    { id: 'social', label: 'Social', icon: Users, count: folderCounts.social, color: 'text-violet-600', activeBorder: 'border-violet-600 text-violet-700 bg-violet-50/60' },
    { id: 'updates', label: 'Updates', icon: Info, count: folderCounts.updates, color: 'text-amber-600', activeBorder: 'border-amber-600 text-amber-700 bg-amber-50/60' },
    { id: 'starred', label: 'Starred', icon: Star, count: folderCounts.starred, color: 'text-yellow-500', activeBorder: 'border-yellow-500 text-yellow-700 bg-yellow-50/60' },
    { id: 'spam', label: 'Spam', icon: AlertTriangle, count: folderCounts.spam, color: 'text-rose-600', activeBorder: 'border-rose-600 text-rose-700 bg-rose-50/60', isWarning: true },
    { id: 'all', label: 'All Mail', icon: Layers, count: folderCounts.all, color: 'text-slate-600', activeBorder: 'border-slate-800 text-slate-900 bg-slate-100/60' },
  ], [folderCounts]);

  const catColors = {
    JOB_APPLICATION: 'bg-blue-50 text-blue-700 border-blue-200',
    INTERVIEW: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
    OFFER: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    REJECTION: 'bg-rose-50 text-rose-700 border-rose-200',
    SHORTLIST: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ASSESSMENT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    FOLLOW_UP: 'bg-amber-50 text-amber-700 border-amber-200',
    RECRUITER_CONTACT: 'bg-violet-50 text-violet-700 border-violet-200',
    JOB_OPENING: 'bg-sky-50 text-sky-700 border-sky-200',
    ONBOARDING: 'bg-teal-50 text-teal-700 border-teal-200',
    COURSE: 'bg-amber-50 text-amber-700 border-amber-200',
    CERTIFICATION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PROMOTION: 'bg-orange-50 text-orange-700 border-orange-200',
    SOCIAL: 'bg-blue-50 text-blue-600 border-blue-200',
    NEWSLETTER: 'bg-slate-100 text-slate-600 border-slate-200',
    OTHER: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // ─── DISCONNECTED STATE (1-Click Google Sign-in) ───────────────────────────
  if (!gmailConnected) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-2">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-red-500/20">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            Gmail Integration
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Connect your Google account with one click to replicate your complete Gmail inbox with all historical older emails, folder separation, and automatic job tracking.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 sm:p-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Connecting for account: <span className="font-semibold text-slate-900">{user?.email}</span>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-base shadow-sm transition-all hover:shadow-md active:scale-[0.99] disabled:opacity-75 cursor-pointer"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {connecting ? 'Connecting with Google…' : 'Sign in & Connect with Google'}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Syncs Primary, Updates, Promotions, Social, Spam &amp; all historical emails</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold">1</div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Gmail Replica Folders</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Exact Primary, Updates, Promotions, Social, Starred and Spam views.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold">2</div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">All Older Mail History</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Bulk historical ingestion syncs thousands of past emails directly to your dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 font-bold">3</div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Auto Job Application Tracking</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Instant classification of Interview calls, Offers, Confirmations, and Rejections.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Developer Settings (Folded away by default) */}
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
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
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-800 cursor-pointer"
                >
                  {copiedRedirect ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedRedirect ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono bg-slate-50 p-2 rounded border border-slate-200 truncate select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/gmail/callback` : ''}
              </div>
              <p className="text-[11px] text-slate-400">
                Managed automatically in <Link to="/settings" className="underline text-brand-600">Settings → API Keys</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── AUTHENTIC GMAIL REPLICA INBOX ─────────────────────────────────────────
  return (
    <div className="space-y-3 font-sans">
      {/* ─── GMAIL TOP SEARCH PILL BAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Gmail Search Pill */}
        <div className="relative flex-1 max-w-2xl">
          <div className="relative flex items-center bg-slate-100/90 hover:bg-slate-100 focus-within:bg-white focus-within:shadow-md focus-within:border-slate-300 border border-transparent rounded-full px-4 py-2 transition-all">
            <Search className="h-4 w-4 text-slate-500 shrink-0 mr-3" />
            <input
              type="text"
              value={search}
              onChange={e => updateParam('search', e.target.value)}
              placeholder="Search in mail (sender, company, subject, keywords)…"
              className="w-full bg-transparent border-0 p-0 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-0"
            />
            {search && (
              <button
                onClick={() => updateParam('search', '')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer mr-1"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer ${showFilterDropdown ? 'bg-slate-200 text-slate-900' : ''}`}
              title="Show search filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Dropdown Popover */}
          {showFilterDropdown && (
            <div className="absolute left-0 right-0 mt-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mail Filter Options</span>
                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Job Application Category</label>
                  <select
                    value={category}
                    onChange={e => updateParam('category', e.target.value)}
                    className="w-full text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-2.5 focus:border-brand-500 focus:ring-brand-500"
                  >
                    <option value="">All Categories</option>
                    {(EMAIL_CATEGORIES || []).map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Read / Unread</label>
                  <select
                    value={unreadOnly ? 'unread' : 'all'}
                    onChange={e => updateParam('unread', e.target.value === 'unread' ? '1' : '')}
                    className="w-full text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-2.5 focus:border-brand-500 focus:ring-brand-500"
                  >
                    <option value="all">All Messages (Read &amp; Unread)</option>
                    <option value="unread">Unread Only</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    updateParam('category', '');
                    updateParam('unread', '');
                    setShowFilterDropdown(false);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Sync Status Pill */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs text-slate-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold truncate max-w-[170px] sm:max-w-[220px]" title={connectedEmail}>
              {connectedEmail}
            </span>
          </div>

          <a
            href="https://mail.google.com/mail/u/0/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Open real Gmail web app in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Disconnect Gmail Account"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── GMAIL SYNC STATUS NOTIFICATION BANNER ────────────────────────── */}
      {isAnySyncing && syncProgress && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-2.5 text-xs sm:text-sm text-blue-800 shadow-xs">
          <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-blue-600" />
          <div className="flex-1 font-medium">{syncProgress}</div>
        </div>
      )}

      {/* ─── GMAIL MAIN CONTAINER ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* ─── AUTHENTIC GMAIL FOLDER TABS ─────────────────────────────────── */}
        <div className="border-b border-slate-200 bg-slate-50/50 flex items-center px-1 overflow-x-auto scrollbar-none">
          {folderTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = folder === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleFolderChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${isActive
                    ? `${tab.activeBorder} shadow-2xs`
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? tab.color : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive
                      ? tab.isWarning ? 'bg-rose-200 text-rose-900' : 'bg-slate-200 text-slate-800'
                      : 'bg-slate-200 text-slate-600'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Spam Banner if viewing Spam tab */}
        {folder === 'spam' && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>
                <b>Spam Folder:</b> Messages here were categorized as Spam by Google. Job offers or confirmations may occasionally appear here.
              </span>
            </div>
            <button
              onClick={() => sync({ folder: 'SPAM', maxResults: 100, maxPages: 5 })}
              disabled={isAnySyncing}
              className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 font-semibold text-rose-800 transition-colors cursor-pointer shrink-0"
            >
              Scan Spam
            </button>
          </div>
        )}

        {/* ─── GMAIL ACTION TOOLBAR (Select, Refresh, Bulk Actions, Pager) ─── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 bg-white text-slate-600 text-xs">
          {/* Left toolbar: Checkbox dropdown, Refresh button, Bulk actions */}
          <div className="flex items-center gap-1">
            {/* Selection Checkbox */}
            <div className="relative inline-flex items-center p-1.5 hover:bg-slate-100 rounded-md transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={emails.length > 0 && Object.keys(selected).length === emails.length}
                onChange={selectAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                title="Select all"
              />
            </div>

            {/* Refresh / Fast Sync Button */}
            <button
              onClick={() => sync({ maxResults: 50, maxPages: 2, fetchOlder: false })}
              disabled={isAnySyncing}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh / Sync new emails"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* When items are selected, show bulk action bar */}
            {selectedCount > 0 ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="font-semibold text-slate-800 mr-1">{selectedCount} selected</span>
                <button
                  onClick={() => bulkSetRead(true)}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => bulkSetRead(false)}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Mark as unread"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelected({})}
                  className="px-2 py-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              /* Sync Control Buttons when nothing is selected */
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                {/* 1. Deep Full Historical Mailbox Sync */}
                <button
                  onClick={() => sync({ syncAll: true, maxResults: 100, maxPages: 30 })}
                  disabled={isAnySyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                  title="Sync your entire Gmail history from older to newer across all folders"
                >
                  <Database className={`h-3.5 w-3.5 ${syncingAll ? 'animate-bounce' : ''}`} />
                  <span>{syncingAll ? 'Syncing Full Mailbox…' : 'Sync All Mailbox History'}</span>
                </button>

                {/* 2. Fetch Older Slice */}
                <button
                  onClick={() => sync({ maxResults: 100, maxPages: 5, fetchOlder: true })}
                  disabled={isAnySyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  title="Fetch older historical emails page by page"
                >
                  <Clock className={`h-3.5 w-3.5 text-indigo-600 ${syncingOlder ? 'animate-spin' : ''}`} />
                  <span>{syncingOlder ? 'Fetching…' : 'Fetch Older'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right toolbar: Pagination Pager (e.g. "1–50 of 2,431") */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium text-xs select-none">
              {total > 0 ? `${startItem}–${endItem} of ${total.toLocaleString()}` : '0 of 0'}
            </span>
            <div className="flex items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer"
                title="Newer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer"
                title="Older"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── EMAIL LIST ROWS (Exact Gmail Desktop Replica) ───────────────── */}
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-white">
                <div className="h-4 w-4 rounded bg-slate-100 animate-pulse" />
                <div className="h-4 w-4 rounded bg-slate-100 animate-pulse" />
                <div className="w-36 h-3.5 rounded bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 h-3.5 rounded bg-slate-100 animate-pulse" />
                <div className="w-16 h-3.5 rounded bg-slate-100 animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchEmails} />
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              {search || category || unreadOnly
                ? `No messages found matching your filter in ${folderTabs.find(t => t.id === folder)?.label}`
                : `Your ${folderTabs.find(t => t.id === folder)?.label} folder is currently empty`}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              {search || category || unreadOnly
                ? 'Try resetting the job category filter or clearing your search term.'
                : 'Click "Sync All Mailbox History" to import all past emails directly from Google.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => sync({ syncAll: true, maxResults: 100, maxPages: 25 })}
                disabled={isAnySyncing}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Database className="h-4 w-4" /> Sync All Mailbox History
              </button>
              <button
                onClick={() => sync({ maxResults: 100, maxPages: 5, fetchOlder: true })}
                disabled={isAnySyncing}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Clock className="h-4 w-4 text-indigo-600" /> Fetch Older Emails
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/90 text-sm">
            {emails.map(e => {
              const unread = !e.isRead;
              const isStarred = (e.labels || []).includes('STARRED');
              const isSpamMsg = (e.labels || []).includes('SPAM');
              const catClass = catColors[e.category] || catColors['OTHER'];

              return (
                <div
                  key={e._id}
                  onClick={() => window.location.href = `#/emails/${e._id}`}
                  className={`group relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 transition-colors cursor-pointer border-l-4 ${unread
                      ? 'bg-white hover:bg-slate-50/90 font-semibold border-l-blue-600'
                      : 'bg-slate-50/40 hover:bg-slate-100/70 text-slate-600 border-l-transparent'
                    }`}
                >
                  {/* Select Checkbox */}
                  <div
                    onClick={ev => toggleSelect(e._id, ev)}
                    className="p-0.5 rounded hover:bg-slate-200/60 cursor-pointer shrink-0"
                  >
                    <input
                      type="checkbox"
                      checked={!!selected[e._id]}
                      onChange={() => { }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
                    />
                  </div>

                  {/* Interactive Star Toggle */}
                  <button
                    onClick={ev => handleToggleStar(e._id, ev)}
                    className="p-1 rounded-full hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
                    title={isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star
                      className={`h-4 w-4 transition-colors ${isStarred
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 group-hover:text-slate-400'
                        }`}
                    />
                  </button>

                  {/* Sender Name */}
                  <div className="min-w-0 w-32 sm:w-44 lg:w-48 shrink-0">
                    <p className={`truncate text-xs sm:text-sm ${unread ? 'font-bold text-slate-900' : 'font-normal text-slate-700'}`}>
                      {e.sender || e.senderEmail || 'Unknown'}
                    </p>
                  </div>

                  {/* Subject + Body Snippet (Separated by hyphen) */}
                  <div className="min-w-0 flex-1 flex items-baseline gap-1.5 overflow-hidden text-xs sm:text-sm">
                    {/* Category badge */}
                    {e.category && e.category !== 'OTHER' && (
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border shrink-0 ${catClass}`}>
                        {e.category.replace('_', ' ')}
                      </span>
                    )}

                    {isSpamMsg && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 shrink-0">
                        SPAM
                      </span>
                    )}

                    <span className={`truncate ${unread ? 'font-bold text-slate-900' : 'font-normal text-slate-800'}`}>
                      {e.subject || '(no subject)'}
                    </span>

                    <span className="text-slate-400 font-normal hidden md:inline shrink-0">-</span>

                    <span className="truncate text-slate-400 font-normal hidden md:inline">
                      {e.bodySnippet || ''}
                    </span>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-white/95 px-1 py-0.5 rounded shadow-2xs">
                    <button
                      onClick={ev => handleToggleRead(e._id, !unread, ev)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                      title={unread ? 'Mark as read' : 'Mark as unread'}
                    >
                      {unread ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Attachment Icon */}
                  <div className="w-4 shrink-0 text-slate-400">
                    {e.hasAttachments && <Paperclip className="h-3.5 w-3.5" />}
                  </div>

                  {/* Date / Time */}
                  <div className="w-16 sm:w-20 shrink-0 text-right">
                    <span className={`text-[11px] sm:text-xs whitespace-nowrap ${unread ? 'font-bold text-slate-900' : 'font-normal text-slate-500'}`}>
                      {formatGmailDate(e.receivedAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── BOTTOM FOOTER WITH NEXT BATCH & STATS ───────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {folderCounts.all || total} total emails synced
            </span>
            <span>·</span>
            <span>{folderCounts.unread || 0} unread</span>
            {lastSync && (
              <>
                <span>·</span>
                <span>Last checked {formatGmailDate(lastSync)}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => sync({ maxResults: 100, maxPages: 5, fetchOlder: true })}
              disabled={isAnySyncing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              {syncingOlder ? 'Loading Older…' : 'Load Next Batch of Older Emails'}
            </button>
            <button
              onClick={() => sync({ syncAll: true, maxResults: 100, maxPages: 25 })}
              disabled={isAnySyncing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5" />
              Sync Entire Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}