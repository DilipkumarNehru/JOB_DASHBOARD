import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Job Search', href: '#features' },
  { label: 'Resume Matching', href: '#features' },
  { label: 'App Tracking', href: '#features' },
  { label: 'Gmail', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Founder', href: '#founder' },
  { label: 'Contact', href: '#contact' },
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
      className={`landing-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-scrolled' : 'nav-transparent'
      }`}
    >
      <div className="landing-container flex items-center justify-between h-16 lg:h-18">
        {/* Logo */}
        <a href="#home" onClick={(e) => handleScroll(e, '#home')} className="flex items-center gap-2.5 no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
            <BriefcaseBusiness className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white landing-logo-text">
            JOB DASHBOARD
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScroll(e, link.href)}
              className="landing-nav-link"
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
              className="landing-btn-primary"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="landing-btn-ghost">Login</Link>
              <Link to="/register" className="landing-btn-primary">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden mobile-menu">
          <nav className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="mobile-nav-link"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4 border-t border-white/10 mt-2">
              {token ? (
                <button
                  onClick={() => { navigate('/dashboard'); setOpen(false); }}
                  className="landing-btn-primary text-center"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="landing-btn-ghost text-center">Login</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="landing-btn-primary text-center">Get Started Free</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
