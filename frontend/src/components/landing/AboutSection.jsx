import { Layers, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';

const PILLARS = [
  {
    icon: Zap,
    title: 'Zero Latency & Live Discovery',
    description:
      'Engineered with modern reactive state management and high-frequency career crawlers, ensuring you receive immediate notification of newly published vacancies.'
  },
  {
    icon: ShieldCheck,
    title: 'Bank-Grade Data Privacy',
    description:
      'Your resumes, personal portfolio data, and synced Gmail messages are encrypted. We never resell your applicant data or share your profile with third-party brokers.'
  },
  {
    icon: Layers,
    title: 'Unified Application Hub',
    description:
      'Seamlessly merges resume parsing, ATS scoring, interview preparation, online code execution, and email classification into one cohesive workspace.'
  },
  {
    icon: Globe,
    title: 'Built for Global Tech Roles',
    description:
      'Tailored for modern software engineering, AI/ML, cloud, and product disciplines across both remote global setups and localized tech hubs.'
  }
];

export default function AboutSection() {
  return (
    <section id="about" className="landing-section bg-slate-900 text-white py-24 relative overflow-hidden border-t border-slate-800">
      <div className="landing-container relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          {/* Left: Vision */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              <span>Our Vision</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Democratizing the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Engineering Job Search</span>
            </h2>

            <p className="text-slate-300 text-base leading-relaxed">
              Today's hiring process is heavily automated by enterprise Applicant Tracking Systems (ATS) and algorithmic filters. Most qualified engineers are rejected before a human ever reads their resume.
            </p>

            <p className="text-slate-300 text-base leading-relaxed">
              <strong>JOB DASHBOARD</strong> levels the playing field. By equipping candidates with the same intelligence recruiters use — ATS score modeling, keyword gap identification, and automated organization — candidates regain control of their career outcomes.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> 100% Free Forever Tier
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <Globe className="h-4 w-4" /> Global Opportunities
              </span>
            </div>
          </div>

          {/* Right: Pillars Grid */}
          <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 hover:border-brand-500/40 hover:bg-slate-800 transition-all duration-300 flex flex-col justify-between group shadow-lg"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/30 mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">{p.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>
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
