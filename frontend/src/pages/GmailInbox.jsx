import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RefreshCw, Search, Mail, Paperclip, Check, CheckCheck, Plug, ExternalLink, CloudOff } from 'lucide-react';
import { emailService, gmailService } from '../services';
import { useAuth } from '../context/AuthContext.jsx';
import { EMAIL_CATEGORIES } from '../utils/constants.js';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { SearchBar, FilterSelect } from '../components/common/Form.jsx';
import { relativeTime, initials } from '../utils/format.js';

const SYNC_STATES = {
  idle: 'Sync Gmail',
  syncing: 'Syncing…',
};

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
  const [syncState, setSyncState] = useState(SYNC_STATES.idle);
  const [connecting, setConnecting] = useState(false);
  const [selected, setSelected] = useState({});
  const [lastSync, setLastSync] = useState(null);

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
      setEmails(res.emails);
      setTotal(res.total);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, unreadOnly, page, limit]);

  useEffect(() => {
    if (gmailConnected) fetchEmails();
  }, [gmailConnected, fetchEmails]);

  useEffect(() => {
    if (!params.get('gmail')) return;
    const p = new URLSearchParams(params);
    const status = p.get('gmail');
    p.delete('gmail');
    setParams(p, { replace: true });
    reload();
    if (status === 'connected') toast.success('Gmail connected successfully');
    else toast.error(p.get('reason') ? 'Gmail connection failed. Please try again.' : 'Gmail connection failed');
  }, []);

  const refreshStatus = async () => {
    try {
      const res = await gmailService.status();
      setLastSync(res.lastGmailSync);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (gmailConnected) refreshStatus();
  }, [gmailConnected]);

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await gmailService.getAuthUrl();
      if (!res.authUrl) {
        toast.error(res.message || 'Gmail not configured on the server');
        return;
      }
      window.location.href = res.authUrl;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    setSyncState(SYNC_STATES.syncing);
    try {
      const res = await gmailService.sync({ maxResults: 50, maxPages: 2 });
      setLastSync(new Date().toISOString());
      toast.success(res.message);
      fetchEmails();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
      setSyncState(SYNC_STATES.idle);
    }
  };

  const toggleSelect = (id) => {
    setSelected((s) => {
      const next = { ...s };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const selectAll = () => {
    if (Object.keys(selected).length === emails.length && emails.length > 0) setSelected({});
    else setSelected(Object.fromEntries(emails.map((e) => [e._id, true])));
  };

  const bulkSetRead = async (read) => {
    const ids = Object.keys(selected);
    if (!ids.length) return;
    try {
      await Promise.all(ids.map((id) => emailService.markRead(id, read)));
      toast.success(read ? `Marked ${ids.length} as read` : `Marked ${ids.length} as unread`);
      setSelected({});
      fetchEmails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const selectedCount = Object.keys(selected).length;

  if (!gmailConnected) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gmail</h2>
            <p className="text-sm text-slate-500">Your inbox, mirrored inside Job Dashboard.</p>
          </div>
        </div>
        <EmptyState
          icon="📧"
          title="Gmail is not connected"
          description="Connect your Google account to read-only sync your inbox. Emails are stored locally and shown here; nothing is ever sent from your account."
          action={
            <button onClick={connect} disabled={connecting} className="btn-primary">
              <Plug className="h-4 w-4" /> {connecting ? 'Opening Google…' : 'Connect Gmail'}
            </button>
          }
        />
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <CloudOff className="h-4 w-4" />
          Needs <code>GOOGLE_CLIENT_ID</code> & <code>GOOGLE_CLIENT_SECRET</code> in the server <code>.env</code> (read-scope only).
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gmail</h2>
          <p className="text-sm text-slate-500">
            {user?.gmailEmail || 'Inbox'} · {total} emails
            {user?.lastGmailSync && <span className="hidden sm:inline"> · last sync {relativeTime(user.lastGmailSync)}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={connect} className="btn-secondary"><ExternalLink className="h-4 w-4" /> Open in Gmail</button>
          <button onClick={sync} disabled={syncing} className="btn-primary">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> {syncState}
          </button>
        </div>
      </div>

      <div className="card p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search sender, subject, body…"
              className="input pl-9"
            />
          </div>
          <FilterSelect value={category} onChange={(v) => updateParam('category', v)} options={EMAIL_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} allLabel="All categories" />
          <button
            onClick={() => updateParam('unread', unreadOnly ? '' : '1')}
            className={`btn-secondary ${unreadOnly ? 'bg-brand-50 text-brand-700' : ''}`}
          >
            <Mail className="h-4 w-4" /> Unread
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
          <span><b>{selectedCount}</b> selected</span>
          <button onClick={() => bulkSetRead(true)} className="ml-auto inline-flex items-center gap-1.5 font-medium hover:underline"><Check className="h-4 w-4" /> Mark read</button>
          <button onClick={() => bulkSetRead(false)} className="inline-flex items-center gap-1.5 font-medium hover:underline"><CheckCheck className="h-4 w-4" /> Mark unread</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEmails} />
      ) : emails.length === 0 ? (
        <EmptyState
          icon="📭"
          title={search || unreadOnly ? 'No emails match your filters' : 'Inbox is empty'}
          description={search || unreadOnly ? 'Try a different search or clear the unread filter.' : 'Click "Sync Gmail" to pull your latest inbox messages.'}
          action={!search && !unreadOnly ? <button onClick={sync} disabled={syncing} className="btn-primary"><RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync Gmail</button> : undefined}
        />
      ) : (
        <>
          <div className="card divide-y divide-slate-100 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <input type="checkbox" checked={emails.length > 0 && Object.keys(selected).length === emails.length} onChange={selectAll} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span className="w-9" />
              <span className="flex-1">Sender</span>
              <span className="hidden flex-[2] md:block">Subject</span>
              <span className="hidden w-28 text-right sm:block">Date</span>
              <span className="w-5" />
            </div>
            {emails.map((e) => {
              const unread = !e.isRead;
              return (
                <div key={e._id} className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${unread ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <input type="checkbox" checked={!!selected[e._id]} onChange={() => toggleSelect(e._id)} onClick={(ev) => ev.stopPropagation()} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${unread ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {initials(e.sender)}
                  </div>
                  <Link to={`/emails/${e._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className={`truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{e.sender}</p>
                        {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" title="Unread" />}
                      </div>
                    </div>
                    <div className="min-w-0 hidden flex-[2] md:flex md:items-baseline md:gap-2">
                      <span className={`truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{e.subject || '(no subject)'}</span>
                      <span className="mt-0.5 truncate text-xs text-slate-400">{e.bodySnippet}</span>
                    </div>
                    <span className={`hidden w-28 shrink-0 text-right text-xs sm:block ${unread ? 'font-medium text-slate-700' : 'text-slate-400'}`}>{relativeTime(e.receivedAt)}</span>
                    <span className="w-5 shrink-0 text-slate-400">{e.hasAttachments ? <Paperclip className="h-4 w-4" /> : null}</span>
                  </Link>
                </div>
              );
            })}
          </div>
          <Pagination page={page} pages={Math.ceil(total / limit)} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}