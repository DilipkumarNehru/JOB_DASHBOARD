import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileCheck, FileText, Mail, Building2,
  CalendarClock, BellRing, BarChart3, Bell, Plug, Settings, LogOut,
  BriefcaseBusiness, X, Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';

const ICONS = {
  LayoutDashboard, Briefcase, FileCheck, FileText, Mail, Building2,
  CalendarClock, BellRing, BarChart3, Bell, Plug, Settings, Inbox
};

const NAV = [
  { section: 'Main', items: [
    { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
    { to: '/jobs', label: 'Jobs', icon: 'Briefcase' },
    { to: '/applications', label: 'Applications', icon: 'FileCheck' },
    { to: '/resumes', label: 'Resume', icon: 'FileText' },
    { to: '/gmail', label: 'Gmail Inbox', icon: 'Mail' },
    { to: '/emails', label: 'Email Intelligence', icon: 'Inbox' },
    { to: '/companies', label: 'Companies', icon: 'Building2' },
  ] },
  { section: 'Tracking', items: [
    { to: '/interviews', label: 'Interviews', icon: 'CalendarClock' },
    { to: '/follow-ups', label: 'Follow-ups', icon: 'BellRing' },
  ] },
  { section: 'Insights', items: [
    { to: '/analytics', label: 'Analytics', icon: 'BarChart3' },
    { to: '/notifications', label: 'Notifications', icon: 'Bell' },
  ] },
  { section: 'System', items: [
    { to: '/integrations', label: 'Integrations', icon: 'Plug' },
    { to: '/settings', label: 'Settings', icon: 'Settings' },
  ] },
];

export const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <BriefcaseBusiness className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">Job Dashboard</p>
              <p className="text-[11px] text-slate-400">AI · Search · Track</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => (
            <div key={group.section} className="mt-4">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.section}</p>
              <div className="mt-1.5 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICONS[item.icon];
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
                      }
                    >
                      {Icon && <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />}
                      <span className="flex-1">{item.label}</span>
                      {item.to === '/notifications' && unread > 0 && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || ''}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-400" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};