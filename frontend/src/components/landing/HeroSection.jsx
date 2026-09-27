import { Link } from 'react-router-dom';
import { ArrowRight, Play, Search, Target, BarChart3, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const FloatingCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <div
    className="floating-stat-card"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className={`floating-stat-icon ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default function HeroSection() {
  const { token } = useAuth();

  return (
    <section id="home" className="hero-section">
      {/* Background elements */}
      <div className="hero-bg-grid" />
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      <div className="landing-container relative z-10 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="hero-text-col">
            {/* Badge */}
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span>AI-Powered Job Search Platform</span>
            </div>

            <h1 className="hero-heading">
              Find. Track. Manage.{' '}
              <span className="hero-heading-highlight">Grow Your Career.</span>
            </h1>

            <p className="hero-subtext">
              JOB DASHBOARD is an AI-assisted job search and application management
              platform that helps job seekers discover relevant opportunities, match
              their resumes with job requirements, track applications, and manage
              job-related emails — all from one place.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta-group">
              <Link
                to={token ? '/dashboard' : '/register'}
                className="hero-btn-primary"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="hero-btn-secondary">
                <Play className="h-4 w-4" />
                Login to Dashboard
              </Link>
            </div>

            {/* Social proof */}
            <div className="hero-trust-row">
              <div className="flex -space-x-2">
                {['A', 'B', 'C', 'D'].map((l) => (
                  <div key={l} className="hero-avatar">{l}</div>
                ))}
              </div>
              <p className="text-sm text-slate-400">
                <span className="text-white font-semibold">Centralized</span>{' '}
                job search management platform
              </p>
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="hero-visual-col">
            <div className="hero-dashboard-mockup">
              {/* Browser chrome */}
              <div className="mockup-chrome">
                <div className="flex items-center gap-1.5">
                  <span className="chrome-dot bg-red-400" />
                  <span className="chrome-dot bg-yellow-400" />
                  <span className="chrome-dot bg-green-400" />
                </div>
                <div className="mockup-url-bar">
                  <span className="text-slate-400">jobdashboard.app/dashboard</span>
                </div>
              </div>

              {/* Dashboard content preview */}
              <div className="mockup-body">
                {/* Sidebar */}
                <div className="mockup-sidebar">
                  <div className="mockup-logo-row">
                    <div className="w-6 h-6 rounded bg-brand-600 flex-shrink-0" />
                    <div className="h-3 bg-white/20 rounded flex-1" />
                  </div>
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`mockup-nav-item ${i === 0 ? 'active' : ''}`}>
                      <div className="w-3 h-3 rounded-sm bg-current opacity-60 flex-shrink-0" />
                      <div className="h-2 bg-current opacity-40 rounded flex-1" />
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="mockup-main">
                  <div className="mockup-topbar" />
                  {/* Stats row */}
                  <div className="mockup-stats-row">
                    {[
                      { color: 'bg-brand-100', w: 'w-8', label: '142 Jobs' },
                      { color: 'bg-emerald-100', w: 'w-6', label: '28 Match' },
                      { color: 'bg-blue-100', w: 'w-5', label: '12 Applied' },
                      { color: 'bg-violet-100', w: 'w-4', label: '3 Interview' },
                    ].map(({ color, w, label }) => (
                      <div key={label} className="mockup-stat-card">
                        <div className={`${color} rounded-full ${w} h-4 mb-2`} />
                        <div className="h-3 font-semibold text-[9px] text-slate-600">{label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart placeholder */}
                  <div className="mockup-chart">
                    <div className="flex items-end gap-1 h-full px-2 pb-2">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-brand-500/30 rounded-t-sm"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stat cards */}
            <FloatingCard
              icon={Search}
              label="Jobs Found"
              value="142 new"
              color="text-brand-600 bg-brand-50"
              delay={0}
            />
            <FloatingCard
              icon={Target}
              label="Resume Match"
              value="87% score"
              color="text-emerald-600 bg-emerald-50"
              delay={0.5}
            />
            <FloatingCard
              icon={BarChart3}
              label="Applications"
              value="12 tracked"
              color="text-violet-600 bg-violet-50"
              delay={1}
            />
            <FloatingCard
              icon={Mail}
              label="Emails Sorted"
              value="47 organized"
              color="text-blue-600 bg-blue-50"
              delay={1.5}
            />
          </div>
        </div>
      </div>

      {/* Wave separator */}
      <div className="hero-wave">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L60 69.3C120 58.7 240 37.3 360 32C480 26.7 600 37.3 720 42.7C840 48 960 48 1080 42.7C1200 37.3 1320 26.7 1380 21.3L1440 16V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#f8fafc" />
        </svg>
      </div>
    </section>
  );
}
