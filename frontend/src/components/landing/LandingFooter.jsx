import { BriefcaseBusiness } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRODUCT_LINKS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Job Search', to: '/jobs' },
  { label: 'Resume Manager', to: '/resumes' },
  { label: 'Application Tracker', to: '/applications' },
  { label: 'Gmail Integration', to: '/gmail' },
  { label: 'Analytics', to: '/analytics' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

const SUPPORT_LINKS = [
  { label: 'Login', to: '/login' },
  { label: 'Register', to: '/register' },
  { label: 'Forgot Password', to: '/forgot-password' },
];

const scrollTo = (e, href) => {
  e.preventDefault();
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="footer-grid">
          {/* Brand column */}
          <div className="footer-brand-col">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                <BriefcaseBusiness className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">JOB DASHBOARD</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              AI-assisted job search and application management platform. Discover opportunities,
              match your resume, track applications, and manage job-related emails — all in one place.
            </p>
          </div>

          {/* Product column */}
          <div>
            <h4 className="footer-col-heading">Product</h4>
            <ul className="footer-link-list">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="footer-link">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h4 className="footer-col-heading">Company</h4>
            <ul className="footer-link-list">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} onClick={(e) => scrollTo(e, l.href)} className="footer-link">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 className="footer-col-heading">Account</h4>
            <ul className="footer-link-list">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="footer-link">{l.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h4 className="footer-col-heading">Legal</h4>
              <ul className="footer-link-list">
                <li><span className="footer-link-muted">Privacy Policy</span></li>
                <li><span className="footer-link-muted">Terms of Service</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} JOB DASHBOARD. All rights reserved.
          </p>
          <p className="text-sm text-slate-600">
            AI-powered · Job Search · Application Tracking · Email Management
          </p>
        </div>
      </div>
    </footer>
  );
}
