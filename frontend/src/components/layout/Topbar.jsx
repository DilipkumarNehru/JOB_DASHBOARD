import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Search, ShieldCheck, MessageSquare, PhoneCall } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDirectMessages } from '../../context/DirectMessageContext.jsx';

export const Topbar = ({ onMenuClick, title }) => {
  const { unread } = useNotifications();
  const { unreadCount: unreadDirectMessages, openDrawer, openAudioModal } = useDirectMessages();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (query.trim()) window.location.href = `/jobs?search=${encodeURIComponent(query.trim())}`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button className="btn-ghost h-9 w-9 p-0 lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <h1 className="hidden text-sm font-semibold text-slate-800 sm:block">{title || 'Dashboard'}</h1>
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="hidden sm:inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-xs"
          >
            <ShieldCheck className="h-3 w-3 text-rose-600" />
            ADMIN
          </Link>
        )}
      </div>

      <form onSubmit={submit} className="ml-auto flex w-full max-w-sm items-center">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, companies…"
            className="input pl-9"
          />
        </div>
      </form>

      {user?.role === 'admin' && (
        <Link
          to="/admin"
          className="sm:hidden flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"
          title="Admin Dashboard"
        >
          <ShieldCheck className="h-4 w-4" />
        </Link>
      )}

      {/* Audio / Voice Call Button */}
      <button
        type="button"
        onClick={() => openAudioModal()}
        className="relative btn-ghost h-9 w-9 p-0 text-slate-600 hover:text-emerald-600 transition-colors"
        aria-label="Instant Audio Call"
        title="Instant Voice & Audio Call"
      >
        <PhoneCall className="h-5 w-5" />
      </button>

      {/* Direct Messages Icon Button */}
      <button
        type="button"
        onClick={() => openDrawer()}
        className="relative btn-ghost h-9 w-9 p-0 text-slate-600 hover:text-indigo-600 transition-colors"
        aria-label="Direct Messages"
        title="Direct Messages & Teammates"
      >
        <MessageSquare className="h-5 w-5" />
        {unreadDirectMessages > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm shadow-indigo-600/50 animate-pulse">
            {unreadDirectMessages > 9 ? '9+' : unreadDirectMessages}
          </span>
        )}
      </button>

      <Link to="/notifications" className="relative btn-ghost h-9 w-9 p-0" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </header>
  );
};