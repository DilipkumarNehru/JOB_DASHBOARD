import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RefreshCw, Search, Mail, Paperclip, Check, CheckCheck,
  Plug, ExternalLink, CloudOff, Inbox, Tag, Clock,
  ChevronRight, MoreVertical, Wifi, WifiOff, Settings
} from 'lucide-react';
import { emailService, gmailService } from '../services';
import { useAuth } from '../context/AuthContext.jsx';
import { EMAIL_CATEGORIES } from '../utils/constants.js';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
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
  const syncTimerRef = useRef(null);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const unreadOnly = params.get('unread') === '1';

  const gmailConnected = !!user?.gmailConnected;

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

  useEffect(() => {
    if (gmailConnected) fetchEmails();
    else setLoading(false);
  }, [gmailConnected, fetchEmails]);

  // Handle OAuth callback query params
  useEffect(() => {
    if (!params.get('gmail')) return;
    const p = new URLSearchParams(params);
    const status = p.get('gmail');
    p.delete('gmail');
    p.delete('reason');
    setParams(p, { replace: true });
    reload();
    if (status === 'connected') {
      toast.success('Gmail connected! Syncing your inbox…');
      setTimeout(() => sync(), 1000);
    } else {
      const reason = params.get('reason') || '';
      toast.error(reason ? `Gmail connection failed: ${reason}` : 'Gmail connection failed. Please try again.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch Gmail status on mount
  useEffect(() => {
    if (!gmailConnected) return;
    gmailService.status()
      .then(res => {
        setLastSync(res.lastGmailSync);
        setGmailStatus(res);
      })
      .catch(() => {});
  }, [gmailConnected]);

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await gmailService.getAuthUrl();
      if (!res.authUrl) {
        toast.error(res.message || 'Gmail not configured. Please add Google credentials in Settings.');
        return;
      }
      window.open(res.authUrl, '_blank', 'width=500,height=600');
    } catch (err) {
      toast.error(err.message || 'Failed to get Gmail auth URL');
    } finally {
      setConnecting(false);
    }
  };

  const sync = async (opts = {}) => {
    if (syncing) return;
    setSyncing(true);
    setSyncProgress('Connecting to Gmail…');
    try {
      setSyncProgress('Fetching emails from your inbox…');
      const res = await gmailService.sync({
        maxResults: opts.maxResults || 25,
        maxPages: opts.maxPages || 1,
      });
      setLastSync(new Date().toISOString());
      toast.success(res.message || 'Gmail synced successfully!');
    } catch (err) {
      if (err.message?.includes('not configured') || err.message?.includes('Settings')) {
        toast.error(
          <span>
            {err.message}&nbsp;
            <Link to="/settings" className="underline font-semibold">Go to Settings</Link>
          </span>,
          { duration: 8000 }
        );
      } else if (err.message?.includes('expired') || err.message?.includes('reconnect')) {
        toast.error(
          <span>
            {err.message}&nbsp;
            <button onClick={connect} className="underline font-semibold ml-1">Reconnect Gmail</button>
          </span>,
          { duration: 8000 }
        );
      } else {
        toast.error(err.message || 'Failed to sync Gmail');
      }
    } finally {
      setSyncProgress('');
      setSyncing(false);
      // Always refresh emails to display whatever is in DB
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
      toast.error(err.message);
    }
  };

  const selectedCount = Object.keys(selected).length;
  const unreadCount = emails.filter(e => !e.isRead).length;

  // Category colors
  const catColors = {
    JOB_APPLICATION: 'bg-blue-100 text-blue-700',
    INTERVIEW: 'bg-purple-100 text-purple-700',
    OFFER: 'bg-green-100 text-green-700',
    REJECTION: 'bg-red-100 text-red-700',
    FOLLOW_UP: 'bg-amber-100 text-amber-700',
    RECRUITER: 'bg-indigo-100 text-indigo-700',
    OTHER: 'bg-slate-100 text-slate-600',
  };

  // ─── NOT CONNECTED STATE ───────────────────────────────────────────────────
  if (!gmailConnected) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Mail className="h-4 w-4" />
              </div>
              Gmail Inbox
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Your job-related emails, synced and organized.</p>
          </div>
        </div>

        {/* Connect Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400 to-orange-400 shadow-lg">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Connect Your Gmail</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Sync your Gmail inbox to automatically detect job applications, interview invitations, offers, and rejections. Read-only access — the app never sends emails.
            </p>
            <button
              onClick={connect}
              disabled={connecting}
              className="btn-primary px-6 py-2.5 text-sm shadow-sm"
            >
              <Plug className="h-4 w-4" />
              {connecting ? 'Opening Google…' : 'Connect Gmail Account'}
            </button>
          </div>

          {/* Steps */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🔑', title: 'Sign in with Google', desc: 'Authorize read-only Gmail access in a pop-up window.' },
              { icon: '📥', title: 'Emails sync automatically', desc: 'Inbox emails are pulled into your dashboard.' },
              { icon: '🤖', title: 'AI categorizes them', desc: 'Applications, interviews, offers & rejections labeled instantly.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-2xl">{step.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings reminder */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 shrink-0" />
            <span>Make sure your Google OAuth credentials (Client ID &amp; Secret) are saved in <b>Settings → API Keys</b> before connecting.</span>
          </div>
          <Link to="/settings" className="font-semibold text-amber-700 hover:underline shrink-0 flex items-center gap-1">
            Settings <ChevronRight className="h-3.5 w-3.5" />
          </Link>
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
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{user?.gmailEmail}</span>
            <span className="mx-1.5">·</span>
            {total} emails synced
            {lastSync && (
              <span className="hidden sm:inline">
                <span className="mx-1.5">·</span>last sync {relativeTime(lastSync)}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://mail.google.com/mail/u/0/`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            <ExternalLink className="h-4 w-4" /> Open Gmail
          </a>
          <button
            onClick={() => sync({ maxResults: 25, maxPages: 1 })}
            disabled={syncing}
            className="btn-primary text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? (syncProgress || 'Syncing…') : 'Sync Inbox'}
          </button>
        </div>
      </div>

      {/* Sync progress banner */}
      {syncing && syncProgress && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
          <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
          <span>{syncProgress}</span>
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
              placeholder="Search sender, subject, body…"
              className="input pl-9 text-sm"
            />
          </div>
          <select
            value={category}
            onChange={e => updateParam('category', e.target.value)}
            className="input text-sm w-auto"
          >
            <option value="">All categories</option>
            {(EMAIL_CATEGORIES || []).map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={() => updateParam('unread', unreadOnly ? '' : '1')}
            className={`btn-secondary text-sm ${unreadOnly ? 'bg-brand-50 text-brand-700 border-brand-300' : ''}`}
          >
            <Mail className="h-4 w-4" /> Unread
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
              ? 'Try a different search or clear the filters.'
              : 'Click "Sync Inbox" to pull your latest Gmail messages.'}
          </p>
          {!search && !category && !unreadOnly && (
            <button onClick={() => sync()} disabled={syncing} className="btn-primary text-sm mx-auto">
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync Inbox
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
              <span className="hidden w-24 lg:block">Category</span>
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
                    className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 cursor-pointer ${unread ? 'bg-white' : 'bg-slate-50/40'}`}
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
                          ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {initials(e.sender)}
                    </div>

                    <Link to={`/emails/${e._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      {/* Sender */}
                      <div className="min-w-0 w-32 shrink-0">
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
                      {e.category && e.category !== 'OTHER' && (
                        <span className={`hidden lg:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${catClass} w-24 justify-center shrink-0`}>
                          <Tag className="h-2.5 w-2.5" />
                          {e.category.replace('_', ' ')}
                        </span>
                      )}
                      {(!e.category || e.category === 'OTHER') && <span className="hidden lg:block w-24" />}

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

      {/* Status footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 px-1">
        <div className="flex items-center gap-1.5">
          {gmailConnected ? (
            <><Wifi className="h-3.5 w-3.5 text-emerald-500" /> Connected as {user?.gmailEmail}</>
          ) : (
            <><WifiOff className="h-3.5 w-3.5 text-red-400" /> Not connected</>
          )}
        </div>
        {lastSync && <span>Last synced {relativeTime(lastSync)}</span>}
      </div>
    </div>
  );
}