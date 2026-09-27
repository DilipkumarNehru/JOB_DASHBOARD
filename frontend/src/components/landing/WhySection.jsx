import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const BENEFITS = [
  'One centralized job-search platform — no more scattered spreadsheets',
  'AI-assisted job matching based on your actual resume content',
  'Resume-based recommendations tailored to your skill profile',
  'Full application lifecycle tracking with status history',
  'Automated email organization via Gmail integration',
  'Follow-up reminders for recruiter communication and deadlines',
  'Job-search analytics with charts and pipeline insights',
  'Clean, easy-to-use dashboard designed for productivity',
];

export default function WhySection() {
  return (
    <section id="why" className="landing-section bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-800/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />

      <div className="landing-container relative z-10">
        <div className="why-grid">
          {/* Left */}
          <div>
            <div className="section-badge-dark mb-4">Why Choose Us</div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-5">
              Why Use{' '}
              <span className="text-brand-400">JOB DASHBOARD?</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Managing a job search involves hundreds of small tasks: finding jobs, tracking
              applications, following up with recruiters, analyzing which roles match your
              skills. JOB DASHBOARD handles all of that in one place.
            </p>
            <p className="text-slate-400 leading-relaxed mb-8">
              We do not promise guaranteed interviews or job offers. We give you the
              tools, structure, and clarity to run a more organized and informed
              job search.
            </p>
            <div className="flex gap-3">
              <Link to="/register" className="landing-btn-primary">Get Started Free</Link>
              <Link to="/login" className="landing-btn-ghost-light">Login</Link>
            </div>
          </div>

          {/* Right: Benefits list */}
          <div className="why-benefits-card">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Platform Benefits
            </h3>
            <ul className="space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 mt-0.5">
                    <Check className="h-3 w-3 text-brand-600" />
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
