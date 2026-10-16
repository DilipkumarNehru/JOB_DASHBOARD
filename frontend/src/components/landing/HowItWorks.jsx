import {
  UserPlus, FileUp, Cpu, Search, MousePointerClick, Inbox, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Your Workspace',
    description:
      'Sign up securely in 30 seconds. Your job pipeline, notes, and resumes remain 100% private and encrypted.',
    tag: 'Quick Setup'
  },
  {
    step: '02',
    icon: FileUp,
    title: 'Upload Your Resume',
    description:
      'Upload PDF or DOCX format. The AI parser extracts technical skills, education, and work history instantaneously.',
    tag: 'AI Parsing'
  },
  {
    step: '03',
    icon: Cpu,
    title: 'Benchmark ATS Score',
    description:
      'See instant compatibility reports against industry standards and uncover missing keywords before applying.',
    tag: 'Gap Analysis'
  },
  {
    step: '04',
    icon: Search,
    title: 'Discover High-Match Jobs',
    description:
      'Explore live opportunities scraped daily from top career pages, scored and ranked by match probability.',
    tag: 'Live Crawlers'
  },
  {
    step: '05',
    icon: MousePointerClick,
    title: 'Practice & Apply',
    description:
      'Practice with the AI mock interviewer, sharpen coding with the online compiler, and submit confident applications.',
    tag: 'Interview Ready'
  },
  {
    step: '06',
    icon: Inbox,
    title: 'Track Offers & Emails',
    description:
      'Sync Gmail to automatically catalog recruiter replies, follow-up alerts, and offer letters in one unified view.',
    tag: 'Automated Sync'
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-section bg-slate-900 text-white py-24 relative overflow-hidden border-t border-slate-800">
      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <span>Simple 6-Step Workflow</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            How Job Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Transforms Your Search</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            From initial resume audit to final offer negotiation, here is your path to career acceleration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-14">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-slate-800/80 rounded-2xl p-7 border border-slate-700/80 hover:border-brand-500/50 hover:bg-slate-800 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/30 group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-brand-300 font-mono bg-brand-950/80 px-2.5 py-1 rounded-md border border-brand-800/60">
                      STEP {s.step}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                    {s.tag}
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-xl shadow-brand-600/30 transition-all"
          >
            Start Step 01 Today Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
