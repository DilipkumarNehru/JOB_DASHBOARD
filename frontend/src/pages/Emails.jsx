import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, Link2, AlertTriangle, Trash2, Inbox } from 'lucide-react';
import { emailService } from '../services';
import { EMAIL_CATEGORIES } from '../utils/constants.js';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { SearchBar, FilterSelect } from '../components/common/Form.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { EMAIL_STATUS_BADGE } from '../utils/constants.js';
import { formatDateTime } from '../utils/format.js';

const STATUS_OPTS = [
  { value: 'linked', label: 'Linked to application' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'unlinked', label: 'Unlinked' },
  { value: 'ignored', label: 'Ignored' },
];

export default function Emails() {
  const [params, setParams] = useSearchParams();
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [relinking, setRelinking] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState([]);

  const category = params.get('category') || '';
  const status = params.get('status') || '';
  const search = params.get('search') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setParams(next);
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await emailService.getAll({ category: category || undefined, status: status || undefined, sender: search || undefined, page, limit: 25 });
      setEmails(res.emails);
      setTotal(res.total);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const res = await emailService.categories();
      setCategoryCounts(res.categories || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchEmails(); }, [category, status, search, page]);
  useEffect(() => { fetchCounts(); }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await emailService.sync();
      toast.success(res.message);
      fetchEmails();
      fetchCounts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const relink = async () => {
    setRelinking(true);
    try {
      const res = await emailService.relink();
      toast.success(res.linked ? `Linked ${res.linked} emails` : 'No new links found');
      fetchEmails();
      fetchCounts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRelinking(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete all synced emails from this dashboard? (Gmail is untouched)')) return;
    try {
      const res = await emailService.deleteAll();
      toast.success(res.message);
      fetchEmails();
      fetchCounts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const statusCount = (s) => {
    if (s === 'needs_review') return emails.filter((e) => e.status === 'needs_review').length;
    if (s === 'unlinked') return emails.filter((e) => e.status === 'unlinked').length;
    return 0;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Emails</h2>
          <p className="text-sm text-slate-500">{total} job-related emails from Gmail</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={relink} disabled={relinking} className="btn-secondary"><Link2 className="h-4 w-4" /> {relinking ? 'Linking…' : 'Auto-link'}</button>
          <button onClick={sync} disabled={syncing} className="btn-secondary"><RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Sync Gmail'}</button>
          <button onClick={clearAll} className="btn-secondary text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <SearchBar value={search} onChange={(v) => updateParam('search', v)} placeholder="Search sender or subject…" />
          <FilterSelect label="Category" value={category} onChange={(v) => updateParam('category', v)} options={EMAIL_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} allLabel="All categories" />
          <FilterSelect label="Status" value={status} onChange={(v) => updateParam('status', v)} options={STATUS_OPTS} allLabel="All statuses" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <div className="space-y-2">
          <button onClick={() => { const p = new URLSearchParams(); p.set('page', '1'); setParams(p); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${!category && !status && !search ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-slate-50'}`}>
            <Inbox className="h-4 w-4" /> Inbox <span className="ml-auto rounded-full bg-slate-100 px-2 text-xs">{total}</span>
          </button>
          <button onClick={() => updateParam('status', 'needs_review')} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${status === 'needs_review' ? 'bg-amber-50 font-semibold text-amber-700' : 'hover:bg-slate-50'}`}>
            <AlertTriangle className="h-4 w-4" /> Needs review <span className="ml-auto rounded-full bg-amber-100 px-2 text-xs">{statusCount('needs_review')}</span>
          </button>

          {categoryCounts.length > 0 && (
            <>
              <p className="pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Categories</p>
              {categoryCounts.map((c) => (
                <button key={c._id} onClick={() => updateParam('category', c._id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${category === c._id ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-slate-50'}`}>
                  <span className="truncate">{c._id}</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 text-xs">{c.count}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchEmails} />
          ) : emails.length === 0 ? (
            <EmptyState icon="✉️" title="No emails found" description="Connect & sync Gmail from Integrations, then emails that match your applications are categorized automatically." action={<button onClick={sync} disabled={syncing} className="btn-primary">Sync Gmail now</button>} />
          ) : (
            <>
              <div className="card divide-y divide-slate-100 overflow-hidden">
                {emails.map((e) => (
                  <Link key={e._id} to={`/emails/${e._id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`truncate text-sm ${e.status === 'needs_review' ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{e.subject || '(no subject)'}</p>
                        <span className="shrink-0 text-xs text-slate-400">{formatDateTime(e.receivedAt)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{e.sender} · {e.jobRole && <span className="text-slate-600">role: {e.jobRole} · </span>}{e.companyName || 'no company'}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge className={EMAIL_CATEGORIES.find((c) => c.key === e.category)?.color || 'bg-slate-100 text-slate-600'}>{e.category}</Badge>
                        <Badge className={EMAIL_STATUS_BADGE[e.status] || EMAIL_STATUS_BADGE.unlinked}>{e.status}</Badge>
                        {e.applicationId && <Badge className="bg-brand-100 text-brand-700">Linked to application</Badge>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination page={page} pages={Math.ceil(total / 25)} total={total} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}