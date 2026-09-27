import { Layers, Users, Globe, Shield } from 'lucide-react';

const PILLARS = [
  {
    icon: Layers,
    title: 'Centralized Platform',
    description:
      'One place for job discovery, resume management, application tracking, email organization, and analytics. No more switching between multiple tools.',
  },
  {
    icon: Users,
    title: 'Built for Job Seekers',
    description:
      'Designed from the ground up for individual job seekers who want to manage their search professionally without enterprise-level complexity.',
  },
  {
    icon: Globe,
    title: 'Live Job Data',
    description:
      'Jobs are discovered from real company career pages and sources — not a static database. Your job pool stays current with the market.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description:
      'Your resume, applications, and emails are stored securely and never shared. Only you have access to your job search workspace.',
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="landing-section bg-white">
      <div className="landing-container">
        <div className="about-grid">
          {/* Text column */}
          <div className="about-text-col">
            <div className="section-badge mb-4">About JOB DASHBOARD</div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-5">
              Simplifying the Modern{' '}
              <span className="section-heading-accent">Job Search Process</span>
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              JOB DASHBOARD is designed to simplify the modern job-search process by
              bringing job discovery, resume analysis, application tracking, email
              management, and follow-up management into one platform.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              The goal is to reduce the effort required to manage multiple job
              applications and provide users with a centralized view of their
              job-search journey — from discovering an opportunity to receiving an offer.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Whether you are actively searching, passively exploring, or managing
              multiple application pipelines simultaneously, JOB DASHBOARD gives you
              the structure and visibility you need.
            </p>
          </div>

          {/* Cards column */}
          <div className="about-cards-col">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="about-card">
                  <div className="about-card-icon">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{p.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{p.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
