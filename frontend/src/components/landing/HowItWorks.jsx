import {
  UserPlus, FileUp, Cpu, Search, MousePointerClick, Inbox
} from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Your Account',
    description:
      'Sign up with your email and create a secure workspace. Your data is private and only accessible to you.',
  },
  {
    step: '02',
    icon: FileUp,
    title: 'Upload Your Resume',
    description:
      'Upload your resume in PDF or DOCX format. Our AI parser extracts your skills, experience, education, and more automatically.',
  },
  {
    step: '03',
    icon: Cpu,
    title: 'Analyze Your Profile',
    description:
      'Your resume is analyzed and a skill profile is built. This profile is used to match you with relevant jobs and identify skill gaps.',
  },
  {
    step: '04',
    icon: Search,
    title: 'Discover Matching Jobs',
    description:
      'Run job discovery to find relevant openings. Jobs are scored and ranked by compatibility with your resume profile.',
  },
  {
    step: '05',
    icon: MousePointerClick,
    title: 'Apply and Track',
    description:
      'Apply to jobs and track every application with status updates — Applied, Interview, Shortlisted, Offer, and more.',
  },
  {
    step: '06',
    icon: Inbox,
    title: 'Manage Emails & Follow-ups',
    description:
      'Connect Gmail to automatically organize job-related emails. Set follow-up reminders and never miss a recruiter message.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-section bg-white">
      <div className="landing-container">
        <div className="section-header">
          <div className="section-badge">How It Works</div>
          <h2 className="section-heading">
            Get Started in{' '}
            <span className="section-heading-accent">Six Simple Steps</span>
          </h2>
          <p className="section-subtext">
            From creating your account to managing recruiter emails — JOB DASHBOARD
            guides you through each step of your job-search journey.
          </p>
        </div>

        <div className="steps-grid">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="step-card group">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="step-connector hidden lg:block" />
                )}
                <div className="step-number-row">
                  <div className="step-icon-wrapper">
                    <Icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <span className="step-label">Step {s.step}</span>
                </div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
