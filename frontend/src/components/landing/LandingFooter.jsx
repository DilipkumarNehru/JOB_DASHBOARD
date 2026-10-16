import { BriefcaseBusiness, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';

const PRODUCT_LINKS = [
  { label: 'Executive Dashboard', to: '/dashboard' },
  { label: 'Live Job Discovery', to: '/jobs' },
  { label: 'Resume ATS Studio', to: '/resumes' },
  { label: 'AI Practice Questions', to: '/practice' },
  { label: 'In-Browser Compiler', to: '/compiler' },
  { label: 'Mock Interview & Video', to: '/video-call' },
  { label: 'Application Tracker', to: '/applications' },
  { label: 'Gmail Organizer', to: '/gmail' },
  { label: 'Pipeline Analytics', to: '/analytics' },
];

const COMPANY_LINKS = [
  { label: 'Platform Vision', href: '#about' },
  { label: 'ATS Simulator', href: '#live-demo' },
  { label: 'Live Job Feed', href: '#live-jobs' },
  { label: 'Bento Grid Features', href: '#features' },
  { label: 'Time & ROI Calculator', href: '#roi-calculator' },
  { label: 'Meet the Founders', href: '#founder' },
  { label: 'Tech Stack', href: '#tech' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact Team', href: '#contact' },
];

const ACCOUNT_LINKS = [
  { label: 'Sign In', to: '/login' },
  { label: 'Register Free', to: '/register' },
  { label: 'Forgot Password', to: '/forgot-password' },
  { label: 'Integrations Hub', to: '/integrations' },
  { label: 'Settings', to: '/settings' },
];

export default function LandingFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    toast.success('Subscribed to Job Dashboard career drops!');
  };

  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-white pt-20 pb-12 border-t border-slate-800">
      <div className="landing-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-600/30">
                <BriefcaseBusiness className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white block">
                  JOB DASHBOARD
                </span>
                <span className="text-xs text-brand-400 font-medium">AI Career Intelligence Engine</span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The all-in-one AI platform for technical job discovery, ATS resume matching, real-time mock interviews, live code execution, and recruiter email classification.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">All Systems Operational • Real-time Crawlers Live</span>
            </div>

            {/* Newsletter form */}
            <div className="pt-3 max-w-sm">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Join our Weekly Tech Hiring Drops
              </span>
              {subscribed ? (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>You're subscribed! Watch your inbox on Mondays.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email for job drops..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 flex-1"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-md"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Product Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              AI Suite
            </h4>
            <ul className="space-y-2.5 text-xs">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    onClick={(e) => scrollTo(e, l.href)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account & Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Account
            </h4>
            <ul className="space-y-2.5 text-xs">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} JOB DASHBOARD. Conceived &amp; Developed by Dilipkumar Nehru.</p>
          <div className="flex items-center gap-6">
            <span>Candidate Data Privacy</span>
            <span>•</span>
            <span>Zero Subscription Traps</span>
            <span>•</span>
            <span>Encrypted OAuth 2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
