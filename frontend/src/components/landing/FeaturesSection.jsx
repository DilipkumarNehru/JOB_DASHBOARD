import {
  Search, FileText, Target, FileCheck, Mail, BellRing, BarChart3, Zap
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    color: 'feature-icon-brand',
    title: 'AI Job Matching',
    description:
      'Our AI analyzes your resume and compares it against job descriptions to identify the most relevant opportunities — scored and ranked by compatibility.',
    tags: ['Resume Analysis', 'Scoring', 'Ranking'],
  },
  {
    icon: Search,
    color: 'feature-icon-blue',
    title: 'Job Search',
    description:
      'Discover relevant job openings from supported company career pages and job sources. All results are automatically indexed and deduplicated.',
    tags: ['Career Pages', 'Auto-Index', 'Live Data'],
  },
  {
    icon: FileText,
    color: 'feature-icon-purple',
    title: 'Resume Analysis',
    description:
      'Upload your resume and extract skills, experience, education, certifications, projects, and key information in seconds using AI-powered parsing.',
    tags: ['PDF/DOCX', 'Skill Extraction', 'AI Parsing'],
  },
  {
    icon: Target,
    color: 'feature-icon-emerald',
    title: 'Resume Matching',
    description:
      'Compare your resume against any job description and receive a detailed breakdown: matching skills, missing skills, experience alignment, and keyword match.',
    tags: ['Skill Gap', 'Keywords', 'Compatibility'],
  },
  {
    icon: FileCheck,
    color: 'feature-icon-amber',
    title: 'Application Tracker',
    description:
      'Track every application through its lifecycle — Applied, Interview, Shortlisted, Rejected, Follow-up, Offer — with full history and notes.',
    tags: ['Status Tracking', 'History', 'Notes'],
  },
  {
    icon: Mail,
    color: 'feature-icon-rose',
    title: 'Gmail Integration',
    description:
      'Connect your Gmail account and automatically classify job-related emails into Interview, Applied, Shortlisted, Rejected, Follow-up, and other categories.',
    tags: ['OAuth', 'Auto-Classify', 'Inbox'],
  },
  {
    icon: BellRing,
    color: 'feature-icon-orange',
    title: 'Follow-up Management',
    description:
      'Never miss an important follow-up. Set reminders for recruiter communication, application deadlines, interview preparations, and callbacks.',
    tags: ['Reminders', 'Deadlines', 'Communication'],
  },
  {
    icon: BarChart3,
    color: 'feature-icon-teal',
    title: 'Dashboard Analytics',
    description:
      'Get a complete picture of your job search with key stats: jobs discovered, applied, interviews, shortlisted, rejected, and follow-ups pending.',
    tags: ['Charts', 'Statistics', 'Insights'],
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="landing-section bg-slate-50">
      <div className="landing-container">
        <div className="section-header">
          <div className="section-badge">Core Features</div>
          <h2 className="section-heading">
            Everything You Need to{' '}
            <span className="section-heading-accent">Manage Your Job Search</span>
          </h2>
          <p className="section-subtext">
            JOB DASHBOARD brings together job discovery, resume intelligence,
            application tracking, and email management into one unified workspace.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="feature-card group">
                <div className={`feature-card-icon ${f.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.description}</p>
                <div className="feature-tags">
                  {f.tags.map((t) => (
                    <span key={t} className="feature-tag">{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
