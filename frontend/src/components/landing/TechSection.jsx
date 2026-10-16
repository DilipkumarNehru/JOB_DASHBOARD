import { Cpu, Server, Database, Sparkles, Shield, GitBranch, Layers, Code2 } from 'lucide-react';

const TECH_STACK = [
  {
    category: 'Frontend Core',
    icon: Code2,
    color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    items: ['React 18', 'Vite', 'Tailwind CSS', 'Lucide Icons', 'Recharts', 'PrismJS'],
  },
  {
    category: 'Backend & APIs',
    icon: Server,
    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    items: ['Node.js (LTS)', 'Express.js', 'REST API Architecture', 'JWT Authentication', 'Multer'],
  },
  {
    category: 'Database & Models',
    icon: Database,
    color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    items: ['MongoDB Atlas', 'Mongoose ODM', 'Aggregation Pipelines', 'Indexing Optimization'],
  },
  {
    category: 'AI & Machine Learning',
    icon: Sparkles,
    color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    items: ['OpenAI API (GPT-4o)', 'Resume Parser AI', 'ATS Match Algorithm', 'Practice Q Generator'],
  },
  {
    category: 'Integrations & Sync',
    icon: GitBranch,
    color: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    items: ['Google OAuth 2.0', 'Gmail REST API', 'WebSockets (Socket.io)', 'Live Video WebRTC'],
  },
  {
    category: 'Security & Sanitization',
    icon: Shield,
    color: 'border-teal-500/40 text-teal-400 bg-teal-500/10',
    items: ['DOMPurify', 'Helmet.js', 'bcryptjs', 'Rate Limiting', 'CORS Safeguards'],
  },
];

export default function TechSection() {
  return (
    <section id="tech" className="landing-section bg-slate-900 text-white py-24 relative overflow-hidden border-t border-slate-800">
      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Cpu className="h-3.5 w-3.5 text-brand-400" />
            <span>Modern Engineering</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Engineered on a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Production-Grade Stack</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            Built with modern, battle-tested technologies designed for sub-second responses, high availability, and candidate data security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TECH_STACK.map((group) => {
            const Icon = group.icon;
            return (
              <div
                key={group.category}
                className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 hover:border-brand-500/40 hover:bg-slate-800 transition-all duration-300 group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${group.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-wide">{group.category}</h3>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/80 text-slate-300 border border-slate-700/70"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
