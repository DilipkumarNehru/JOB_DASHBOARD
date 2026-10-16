import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, Menu, X, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'ATS Simulator', href: '#live-demo' },
  { label: 'Live Jobs', href: '#live-jobs' },
  { label: 'Bento Suite', href: '#features' },
  { label: 'App Tour', href: '#preview' },
  { label: 'Impact Calc', href: '#roi-calculator' },
  { label: 'Workflow', href: '#how-it-works' },
  { label: 'Comparison', href: '#why' },
  { label: 'Founders', href: '#founder' },
  { label: 'FAQ', href: '#faq' },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScroll = (e, href) => {
    e.preventDefault();
    setOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-2xl py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="landing-container flex items-center justify-between">
        {/* Logo */}
        <a
          href="#home"
          onClick={(e) => handleScroll(e, '#home')}
          className="flex items-center gap-3 no-underline group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
            <BriefcaseBusiness className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">
                JOB DASHBOARD
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                AI 2.0
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Career Intelligence Suite</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80 backdrop-blur-md">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScroll(e, link.href)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {token ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/25 transition-all flex items-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800/60 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Get Started Free</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="xl:hidden text-white p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="xl:hidden bg-slate-950/95 border-b border-slate-800 px-6 py-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-2 mb-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
            {token ? (
              <button
                onClick={() => { setOpen(false); navigate('/dashboard'); }}
                className="w-full py-3 rounded-xl bg-brand-600 text-white text-center font-semibold text-sm shadow-md"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full py-2.5 text-center text-slate-300 font-semibold text-sm hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white text-center font-semibold text-sm shadow-md"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
