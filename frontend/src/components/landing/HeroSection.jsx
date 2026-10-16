import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Play, Search, Target, BarChart3, Mail, Sparkles,
  CheckCircle2, Video, Terminal, Flame, Bot, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const FloatingCard = ({ icon: Icon, label, value, color, delay = 0, style = {} }) => (
  <div
    className="floating-stat-card hidden sm:flex"
    style={{ animationDelay: `${delay}s`, ...style }}
  >
    <div className={`floating-stat-icon ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-[11px] text-slate-500 font-medium">{label}</p>
      <p className="text-xs font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default function HeroSection() {
  const { token } = useAuth();
  const [activeHeroTab, setActiveHeroTab] = useState('pipeline');

  const scrollToDemo = (e) => {
    e.preventDefault();
    const el = document.querySelector('#live-demo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="hero-section relative min-h-screen bg-slate-950 text-white overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
      {/* Background aurora lights and high-tech grid */}
      <div className="hero-bg-grid" />
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-brand-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="landing-container relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: Text Col */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Live Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tracking-wide">AI 2.0 Career Platform • Resumes, Mock Interviews &amp; IDE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Find. Match. Practice.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Land Your Dream Job.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl font-normal">
              JOB DASHBOARD is the all-in-one AI career accelerator: discover live jobs, optimize resumes against ATS filters, run technical mock video interviews, code in the online compiler, and organize recruiter emails effortlessly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10 w-full sm:w-auto">
              <Link
                to={token ? '/dashboard' : '/register'}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 group transition-all"
              >
                <span>{token ? 'Go to Dashboard' : 'Get Started Free (No Credit Card)'}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#live-demo"
                onClick={scrollToDemo}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm flex items-center justify-center gap-2 transition-all backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 text-brand-400" />
                <span>Try Live ATS Simulator</span>
              </a>
            </div>

            {/* Social proof & trust stats */}
            <div className="pt-6 border-t border-slate-800/80 w-full">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Engineers using Job Dashboard have interviewed at
              </p>
              <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm font-semibold opacity-85">
                <span className="hover:text-white transition-colors">Google</span>
                <span className="text-slate-700">•</span>
                <span className="hover:text-white transition-colors">Stripe</span>
                <span className="text-slate-700">•</span>
                <span className="hover:text-white transition-colors">Microsoft</span>
                <span className="text-slate-700">•</span>
                <span className="hover:text-white transition-colors">Amazon</span>
                <span className="text-slate-700">•</span>
                <span className="hover:text-white transition-colors">Razorpay</span>
                <span className="text-slate-700">•</span>
                <span className="hover:text-white transition-colors">Uber</span>
              </div>
            </div>
          </div>

          {/* Right: Interactive Live Sandbox Mockup */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Interactive Mockup Container */}
            <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Window Titlebar */}
              <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="px-3 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
                  jobdashboard.app/workspace
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                </div>
              </div>

              {/* Interactive Tab Switcher inside the hero preview */}
              <div className="grid grid-cols-4 bg-slate-950/40 p-1.5 gap-1 border-b border-slate-800 text-[11px] font-medium">
                <button
                  onClick={() => setActiveHeroTab('pipeline')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activeHeroTab === 'pipeline'
                      ? 'bg-brand-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  Pipeline
                </button>
                <button
                  onClick={() => setActiveHeroTab('ats')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activeHeroTab === 'ats'
                      ? 'bg-brand-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  ATS Scan
                </button>
                <button
                  onClick={() => setActiveHeroTab('interview')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activeHeroTab === 'interview'
                      ? 'bg-brand-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  AI Mock
                </button>
                <button
                  onClick={() => setActiveHeroTab('compiler')}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    activeHeroTab === 'compiler'
                      ? 'bg-brand-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  IDE
                </button>
              </div>

              {/* Mockup Dynamic Content */}
              <div className="p-5 min-h-[300px] flex flex-col justify-between">
                {activeHeroTab === 'pipeline' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Active Job Pipeline</span>
                      <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                        +4 Interviews This Week
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Discovered Jobs</span>
                        <span className="text-xl font-extrabold text-white">142</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-full w-[85%]" />
                        </div>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Matched ≥80%</span>
                        <span className="text-xl font-extrabold text-emerald-400">28</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[65%]" />
                        </div>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Applications Sent</span>
                        <span className="text-xl font-extrabold text-indigo-400">12</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[50%]" />
                        </div>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Final Rounds</span>
                        <span className="text-xl font-extrabold text-amber-400">4</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-amber-500 h-full w-[35%]" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-slate-300 font-medium">Stripe • Technical Screen</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">Tomorrow, 2:00 PM</span>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'ats' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">Full Stack Engineer</span>
                        <span className="text-[10px] text-slate-400">Resume: Dilip_FullStack_2026.pdf</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-400">94%</span>
                        <span className="text-[10px] text-emerald-500 block">Match High</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Matched ATS Keywords (8)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {['React', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'JWT', 'TypeScript', 'Tailwind'].map((k) => (
                          <span key={k} className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/40 text-[11px] text-blue-300 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span>AI Insight: Adding "Docker containerization" will bump score to 98%.</span>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'interview' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-bold text-white">AI Mock Interview Room</span>
                      </div>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                        Live Audio Feedback
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        AI Question #3:
                      </span>
                      <p className="text-xs text-slate-200 font-medium">
                        "How do you handle database connection pooling and failover under sudden peak traffic in Node.js?"
                      </p>
                    </div>

                    {/* Audio wave simulation */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-400">Your Voice Stream</span>
                      <div className="flex items-center gap-1 h-5">
                        {[12, 24, 18, 30, 15, 28, 20, 10, 26, 14].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-purple-400 rounded-full animate-pulse"
                            style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold">9.2 / 10 score</span>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'compiler' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                      <span className="text-brand-400">solution.js (JavaScript Node 20)</span>
                      <span className="text-emerald-400">● Run: 42ms</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                      <p><span className="text-purple-400">function</span> <span className="text-blue-400">findOptimizedPath</span>(graph, start) &#123;</p>
                      <p className="pl-4 text-slate-400">// Min-heap Dijkstra implementation</p>
                      <p className="pl-4"><span className="text-purple-400">const</span> queue = <span className="text-purple-400">new</span> PriorityQueue();</p>
                      <p className="pl-4"><span className="text-purple-400">return</span> queue.solve(graph, start);</p>
                      <p>&#125;</p>
                    </div>

                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/40 rounded-lg text-emerald-300 text-[11px]">
                      ✔ Test Case #1 Passed: [12, 45, 98] in 0.042s
                    </div>
                  </div>
                )}

                {/* Footer status row */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-brand-400" />
                    AI Assistant Active
                  </span>
                  <Link
                    to={token ? '/dashboard' : '/register'}
                    className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                  >
                    Launch Full Workspace <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Floating Glassmorphic Stat Badges */}
            <FloatingCard
              icon={Search}
              label="Jobs Discovered"
              value="142 active"
              color="text-brand-600 bg-brand-50"
              delay={0}
              style={{ top: '-1.5rem', left: '-2rem' }}
            />
            <FloatingCard
              icon={Target}
              label="ATS Match"
              value="94% score"
              color="text-emerald-600 bg-emerald-50"
              delay={0.7}
              style={{ bottom: '-1.5rem', left: '-1rem' }}
            />
            <FloatingCard
              icon={Video}
              label="AI Mock Room"
              value="Live Ready"
              color="text-purple-600 bg-purple-50"
              delay={1.2}
              style={{ top: '25%', right: '-2.5rem' }}
            />
            <FloatingCard
              icon={Mail}
              label="Gmail Sync"
              value="Auto-Sorted"
              color="text-blue-600 bg-blue-50"
              delay={1.8}
              style={{ bottom: '10%', right: '-2rem' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
