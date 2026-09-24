import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { Topbar } from '../components/layout/Topbar.jsx';
import { useNotifications } from '../hooks/useNotifications.js';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs',
  '/applications': 'Applications',
  '/resumes': 'Resume Management',
  '/emails': 'Email Intelligence',
  '/companies': 'Companies',
  '/interviews': 'Interviews',
  '/follow-ups': 'Follow-ups',
  '/analytics': 'Analytics & AI Insights',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/integrations': 'Integrations',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useNotifications();

  const title = Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || 'Dashboard';

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-xs text-slate-400">
          Job Dashboard — AI-powered job search &amp; application tracking. Deliberately assists, never auto-applies.
        </footer>
      </div>
    </div>
  );
}