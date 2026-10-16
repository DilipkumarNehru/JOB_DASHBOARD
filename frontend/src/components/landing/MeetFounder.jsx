import { Github, Linkedin, Code2, Cpu, Globe, Award, Sparkles, Mail } from 'lucide-react';

const SKILLS = [
  'React 18', 'Node.js', 'Express', 'MongoDB',
  'Python', 'OpenAI API', 'Google OAuth 2.0', 'REST APIs',
  'WebRTC', 'Tailwind CSS', 'Vite', 'JWT Security'
];

export default function MeetFounder() {
  return (
    <section id="founder" className="landing-section bg-slate-950 text-white py-24 relative overflow-hidden border-t border-slate-800">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[300px] bg-brand-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Award className="h-3.5 w-3.5 text-brand-400" />
            <span>Leadership &amp; Engineering</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Meet the Builders Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">JOB DASHBOARD</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            Built by engineers who experienced the friction of fragmented job searching firsthand and engineered the solution.
          </p>
        </div>

        {/* Main Founder Card: Dilipkumar Nehru */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-10 max-w-5xl mx-auto mb-10 backdrop-blur-xl">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Founder Photo & Badges */}
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="relative mb-3 group w-full max-w-[280px]">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-brand-500/15 border-2 border-brand-500/30 bg-slate-950 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-brand-500/60">
                  <img
                    src="/founder.jpg"
                    alt="Dilipkumar Nehru — CEO & Founder | Full Stack Developer"
                    className="w-full h-auto object-contain block"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold border border-slate-700"
                  aria-label="GitHub Profile"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-300 hover:text-white hover:bg-brand-600 transition-colors text-xs font-semibold border border-brand-500/40"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
              </div>
            </div>

            {/* Founder Story & Core Competencies */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs text-brand-300 font-medium bg-brand-950/60 border border-brand-800/60 px-3 py-1 rounded-md">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>Founder's Note</span>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                "I engineered <strong>JOB DASHBOARD</strong> to solve a fundamental problem faced by thousands of technical candidates: the cognitive overload of tracking dozens of applications across chaotic tabs, blind ATS keyword rejections, and lost recruiter emails."
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                "By pairing an intelligent resume analyzer with live video mock interviews, an integrated coding environment, and automated Gmail classification, we give candidates an institutional-grade advantage."
              </p>

              {/* Skills */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Technical Architecture &amp; Expertise
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Co-Founder Card: Shrishail Chavan */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 max-w-3xl mx-auto backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-brand-500/30 shrink-0">
              <img
                src="/cofounder.jpg"
                alt="Shrishail Chavan — Co-Founder & Full Stack Developer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h4 className="text-base font-bold text-white">Shrishail Chavan</h4>
                <span className="text-[11px] font-semibold text-brand-300 bg-brand-950 px-2 py-0.5 rounded border border-brand-800">
                  Co-Founder &amp; Full Stack Developer
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Key contributor to technical system design, backend scalability, full-stack micro-modules, and integration engineering across the Job Dashboard platform.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 text-[11px] text-slate-400">
                <span className="px-2 py-0.5 bg-slate-800 rounded">Full Stack</span>
                <span className="px-2 py-0.5 bg-slate-800 rounded">React</span>
                <span className="px-2 py-0.5 bg-slate-800 rounded">Node.js</span>
                <span className="px-2 py-0.5 bg-slate-800 rounded">REST APIs</span>
                <span className="px-2 py-0.5 bg-slate-800 rounded">Express</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
