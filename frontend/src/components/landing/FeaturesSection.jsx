import {
  Zap, Search, FileText, Target, FileCheck, Mail, BellRing, BarChart3,
  Video, Terminal, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturesSection() {
  return (
    <section id="features" className="landing-section bg-slate-900 text-white py-24 relative overflow-hidden">
      {/* Background radial highlights */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-brand-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[450px] h-[450px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Zap className="h-3.5 w-3.5 text-brand-400" />
            <span>Comprehensive Suite</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Dominate Your Job Search</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            A cohesive system designed to replace fragmented tools, spreadsheets, and endless tab switching with intelligent automation.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Bento Item 1: Large 2-col AI Resume Intelligence */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/90 to-slate-850/80 rounded-2xl p-7 border border-slate-700/80 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-brand-500/50 transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-brand-500/15 rounded-full blur-3xl group-hover:bg-brand-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-brand-300 bg-brand-950/80 border border-brand-800/60 px-3 py-1 rounded-full">
                  AI-Powered ATS Engine
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Deep Resume Parsing &amp; Keyword Match Scoring
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-xl">
                Upload PDF or DOCX resumes. Our AI extracts core technical proficiencies, work achievements, and certifications, then performs side-by-side gap analysis against any job description with instant percentage scoring.
              </p>
            </div>

            {/* Visual badge bar */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/80 rounded-xl border border-slate-700/80">
              <div className="text-center">
                <span className="text-lg md:text-xl font-bold text-emerald-400 block">94%</span>
                <span className="text-[11px] text-slate-400">Avg ATS Score</span>
              </div>
              <div className="text-center border-x border-slate-800">
                <span className="text-lg md:text-xl font-bold text-blue-400 block">&lt; 3s</span>
                <span className="text-[11px] text-slate-400">Parsing Speed</span>
              </div>
              <div className="text-center">
                <span className="text-lg md:text-xl font-bold text-purple-400 block">Multi</span>
                <span className="text-[11px] text-slate-400">Resume Profiles</span>
              </div>
            </div>
          </div>

          {/* Bento Item 2: AI Mock Interview Room */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-850/80 rounded-2xl p-7 border border-slate-700/80 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-purple-500/50 transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl group-hover:bg-purple-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Video className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-purple-300 bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-full">
                  Live WebRTC
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                AI Mock Interview &amp; Video Call Room
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Practice behavioral &amp; technical interviews in real-time with an AI interviewer. Receive instant feedback on articulation, confidence, and keyword coverage.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Camera &amp; Mic Testing
              </span>
              <span className="text-purple-400 font-semibold">Ready</span>
            </div>
          </div>

          {/* Bento Item 3: Built-in Code Compiler */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-850/80 rounded-2xl p-7 border border-slate-700/80 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl group-hover:bg-emerald-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Terminal className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
                  Online IDE
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                In-Browser Code Compiler
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Solve coding interview problems in JavaScript, Python, C++, Java, and Go directly inside the dashboard with real-time test execution.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="text-emerald-400">&gt; npm test --passed</span>
              <span className="text-slate-400">0.04s</span>
            </div>
          </div>

          {/* Bento Item 4: Application Pipeline Kanban */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-850/80 rounded-2xl p-7 border border-slate-700/80 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl group-hover:bg-blue-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <FileCheck className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-blue-300 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full">
                  Pipeline Tracker
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Full Lifecycle Application Tracking
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Track every application through Applied, Shortlisted, Interview rounds, and Offers with custom notes, recruiter contacts, and status logs.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="px-2 py-1 rounded bg-blue-900/40 text-blue-300 border border-blue-800/50">Applied</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-amber-900/40 text-amber-300 border border-amber-800/50">Interview</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50">Offer</span>
            </div>
          </div>

          {/* Bento Item 5: Gmail OAuth Smart Classifier */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-850/80 rounded-2xl p-7 border border-slate-700/80 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/50 transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-rose-500/15 rounded-full blur-3xl group-hover:bg-rose-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Mail className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-3 py-1 rounded-full">
                  Zero Clutter
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Intelligent Gmail Auto-Classifier
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Connect your Gmail securely via Google OAuth 2.0. The AI categorizes recruiter messages automatically into Interview Invites, Rejections, and Follow-ups.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-300">Auto-Tagged Recruiter Threads</span>
              <span className="text-emerald-400 font-semibold">100% Secure</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-brand-600/30 transition-all"
          >
            Start Using All Features Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
