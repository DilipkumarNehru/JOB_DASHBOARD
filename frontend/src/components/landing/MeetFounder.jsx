import { Github, Linkedin, Code2, Cpu, Globe } from 'lucide-react';

const SKILLS = [
  'React', 'Node.js', 'Express', 'MongoDB',
  'Python', 'OpenAI API', 'Google OAuth', 'REST APIs',
  'n8n', 'JWT Auth', 'Tailwind CSS', 'Vite',
];

export default function MeetFounder() {
  return (
    <section id="founder" className="landing-section bg-white relative overflow-hidden">
      {/* Subtle background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 50%, rgba(37,71,235,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="landing-container relative z-10">
        {/* Section header */}
        <div className="section-header">
          <div className="section-badge">Meet the Founder</div>
          <h2 className="section-heading">
            The Person Behind{' '}
            <span className="section-heading-accent">JOB DASHBOARD</span>
          </h2>
          <p className="section-subtext">
            Built by a developer who understands the challenges of modern job searching.
          </p>
        </div>

        {/* Content grid */}
        <div className="founder-grid">
          {/* Left: Profile card */}
          <div className="founder-card-col">
            <div className="founder-img-wrapper">
              <img
                src="/founder.jpg"
                alt="Dilipkumar Nehru — CEO & Founder, Full Stack Developer"
                className="founder-img"
              />
              {/* Decorative ring */}
              <div className="founder-img-ring" />
              {/* Floating badge */}
              <div className="founder-floating-badge">
                <Code2 className="h-4 w-4 text-brand-600" />
                <span>Full Stack Developer</span>
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="founder-info-col">
            <div className="founder-name-row">
              <h3 className="founder-name">Dilipkumar Nehru</h3>
              <span className="founder-role-badge">CEO &amp; Founder</span>
            </div>

            <p className="founder-bio">
              Dilipkumar Nehru is the creator and lead developer of JOB DASHBOARD — an
              AI-assisted job search and application management platform designed to
              centralize and simplify the modern job-search experience.
            </p>
            <p className="founder-bio">
              With hands-on experience across the full stack, Dilipkumar built JOB DASHBOARD
              from the ground up — covering backend API design, AI integrations, Gmail
              automation, resume parsing, and the complete frontend interface.
            </p>
            <p className="founder-bio">
              The platform was built to solve a real problem: managing dozens of job
              applications, recruiter emails, follow-ups, and interview schedules
              simultaneously — without losing track of any of them.
            </p>

            {/* Tech stack pills */}
            <div className="founder-skills-section">
              <div className="founder-skills-header">
                <Cpu className="h-4 w-4 text-brand-600" />
                <span>Technologies &amp; Skills</span>
              </div>
              <div className="founder-skills-list">
                {SKILLS.map((s) => (
                  <span key={s} className="founder-skill-tag">{s}</span>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="founder-stats-row">
              {[
                { icon: Globe, label: 'Platform Built', value: 'JOB DASHBOARD' },
                { icon: Code2, label: 'Stack', value: 'Full Stack' },
                { icon: Cpu, label: 'AI Integration', value: 'OpenAI + n8n' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="founder-stat">
                  <Icon className="h-5 w-5 text-brand-600 mb-1" />
                  <p className="founder-stat-value">{value}</p>
                  <p className="founder-stat-label">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
