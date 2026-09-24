import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { notificationService } from '../services';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { relativeTime } from '../utils/format.js';

const TYPE_COLOR = {
  FOLLOW_UP_DUE: 'bg-amber-100 text-amber-700',
  INTERVIEW_UPCOMING: 'bg-violet-100 text-violet-700',
  JOB_MATCH: 'bg-emerald-100 text-emerald-700',
  EMAIL_NEEDS_REVIEW: 'bg-amber-100 text-amber-700',
  RESUME_CUSTOMIZED: 'bg-brand-100 text-brand-700',
  GMAIL_SYNC: 'bg-sky-100 text-sky-700',
  SYSTEM: 'bg-slate-100 text-slate-600',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll();
      setNotifications(res.notifications || []);
      setUnread(res.unread || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const open = async (n) => {
    if (!n.read) {
      try {
        await notificationService.markRead(n._id);
        setUnread((u) => Math.max(0, u - 1));
        setNotifications((ns) => ns.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      } catch { /* ignore */ }
    }
  };

  const markAll = async () => {
    try {
      await notificationService.markAllRead();
      setUnread(0);
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500">{unread} unread</p>
        </div>
        <button onClick={markAll} className="btn-secondary"><CheckCheck className="h-4 w-4" /> Mark all read</button>
      </div>

      <div className="flex gap-2">
        {[['', `All (${notifications.length})`], ['unread', `Unread (${unread})`]].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`badge ${filter === key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAll} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔕" title="No notifications" description="Follow-up reminders, interview alerts and system updates will appear here." />
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {filtered.map((n) => (
            <div key={n._id} className={`flex items-start gap-3 px-4 py-3.5 ${n.read ? 'bg-white' : 'bg-brand-50/50'}`}>
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TYPE_COLOR[n.type] || TYPE_COLOR.SYSTEM}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${n.read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{n.title}</p>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{relativeTime(n.createdAt)} · {n.type}</p>
              </div>
              {n.link && (
                <Link to={n.link} onClick={() => open(n)} className="mt-1 shrink-0 text-xs font-medium text-brand-600 hover:underline">
                  View <ArrowRight className="inline h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}