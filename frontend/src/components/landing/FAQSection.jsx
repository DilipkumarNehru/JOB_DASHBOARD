import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'What is JOB DASHBOARD?',
    a: 'JOB DASHBOARD is an AI-assisted job search and application management platform. It helps job seekers discover relevant job openings, match their resumes with job descriptions, track applications, and organize job-related emails — all from a single dashboard.',
  },
  {
    q: 'How does job matching work?',
    a: 'When you upload your resume, our AI parses and extracts your skills, experience, and education. When jobs are discovered, each job description is compared against your profile to generate a compatibility score. You can also manually compare any job description against your resume to get a detailed match report.',
  },
  {
    q: 'Can I upload my resume?',
    a: 'Yes. You can upload your resume in PDF or DOCX format. The system will extract your skills, experience, certifications, and education automatically. You can manage multiple resume versions and choose which one to use for matching.',
  },
  {
    q: 'Can I track my job applications?',
    a: 'Yes. The Application Tracker lets you log and track every application with statuses like Applied, Interview Scheduled, Shortlisted, Rejected, Follow-up Needed, and Offer Received. You can add notes, dates, and view full application history.',
  },
  {
    q: 'Can I connect my Gmail account?',
    a: 'Yes. JOB DASHBOARD supports Gmail integration via Google OAuth 2.0. Once connected, job-related emails are automatically identified and classified into categories such as Interview, Shortlisted, Applied, Rejected, Follow-up, and more.',
  },
  {
    q: 'Can I manage follow-ups?',
    a: 'Yes. You can set follow-up reminders for any application or recruiter communication. The dashboard highlights follow-ups that are due today and overdue follow-ups so you never miss an important action.',
  },
  {
    q: 'Can I see my job-search statistics?',
    a: 'Yes. The Analytics section shows charts and statistics including total jobs found, applications submitted, interviews scheduled, shortlisted applications, rejections, skill distribution in the job pool, and more.',
  },
  {
    q: 'Is my existing login account supported?',
    a: 'Yes. If you already have an account on JOB DASHBOARD, you can log in using the existing Login page. All your data, applications, resumes, and settings are preserved. There is no need to create a new account.',
  },
  {
    q: 'Does JOB DASHBOARD automatically apply to jobs on my behalf?',
    a: 'No. JOB DASHBOARD is designed to assist and organize your job search — it intentionally does not auto-apply to jobs on your behalf. You stay in full control of every application you submit.',
  },
  {
    q: 'What document formats are supported for resume upload?',
    a: 'JOB DASHBOARD supports PDF and DOCX (Microsoft Word) formats for resume uploads. The system processes the document and extracts structured information using AI-powered parsing.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'faq-item-open' : ''}`}>
      <button
        className="faq-question"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className={`faq-chevron ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="faq-answer">
          <p>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQSection() {
  return (
    <section id="faq" className="landing-section bg-slate-50">
      <div className="landing-container">
        <div className="section-header">
          <div className="section-badge">FAQ</div>
          <h2 className="section-heading">
            Frequently Asked{' '}
            <span className="section-heading-accent">Questions</span>
          </h2>
          <p className="section-subtext">
            Everything you need to know about JOB DASHBOARD.
          </p>
        </div>

        <div className="faq-list">
          {FAQS.map((item) => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
