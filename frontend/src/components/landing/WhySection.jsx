import { Check, X, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const COMPARISON = [
  {
    feature: 'Job Discovery',
    oldWay: 'Browsing 10+ open job boards manually with duplicate results',
    newWay: 'Automated career crawler indexes & deduplicates high-match roles daily'
  },
  {
    feature: 'Resume Optimization',
    oldWay: 'Guessing keywords or paying $200+ for manual resume reviews',
    newWay: 'Instant AI ATS audit reveals exact matching & missing keywords'
  },
  {
    feature: 'Interview Prep',
    oldWay: 'Reading static articles without practice or objective feedback',
    newWay: 'AI mock video room with real-time speech and technical scoring'
  },
  {
    feature: 'Coding Assessments',
    oldWay: 'Switching to external IDEs or separate coding websites',
    newWay: 'Integrated online compiler supports JS, Python, C++, Java, Go'
  },
  {
    feature: 'Application Management',
    oldWay: 'Messy manual spreadsheets that easily get forgotten',
    newWay: 'Full Kanban pipeline with automated stage transitions & notes'
  },
  {
    feature: 'Recruiter Communications',
    oldWay: 'Lost in cluttered personal inboxes and missed follow-ups',
    newWay: 'Gmail OAuth sync auto-tags Interview Invites, Offers & Rejections'
  }
];

export default function WhySection() {
  return (
    <section id="why" className="landing-section bg-slate-950 text-white py-24 relative overflow-hidden border-t border-slate-800">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-brand-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>The Competitive Edge</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Why Upgrade From <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-brand-400">Messy Spreadsheets?</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            See the clear difference between the traditional stressful job hunt and an AI-accelerated job search system.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-w-5xl mx-auto mb-12">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-950/80 px-6 py-4 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
            <div className="col-span-3 text-slate-400">Workflow Dimension</div>
            <div className="col-span-4 text-rose-400 flex items-center gap-1.5">
              <X className="h-4 w-4" /> Traditional Approach
            </div>
            <div className="col-span-5 text-emerald-400 flex items-center gap-1.5">
              <Check className="h-4 w-4" /> With JOB DASHBOARD
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-800/80">
            {COMPARISON.map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-12 px-6 py-4 items-center text-xs md:text-sm ${
                  idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/80'
                } hover:bg-slate-850 transition-colors`}
              >
                <div className="col-span-3 font-semibold text-slate-200">
                  {row.feature}
                </div>
                <div className="col-span-4 text-slate-400 flex items-start gap-2 pr-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 shrink-0 mt-2" />
                  <span>{row.oldWay}</span>
                </div>
                <div className="col-span-5 text-emerald-300 font-medium flex items-start gap-2 bg-emerald-950/20 py-2 px-3 rounded-xl border border-emerald-900/30">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{row.newWay}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-brand-600/30 transition-all"
          >
            Upgrade Your Job Search Today
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
