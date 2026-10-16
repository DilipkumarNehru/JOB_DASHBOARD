import { Star, Quote, CheckCircle2 } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Aarav Sharma',
    role: 'Senior Full Stack Developer',
    company: 'Fintech Unicorn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    stat: '4 Offers in 4 Weeks',
    quote:
      'The ATS match scanner identified that my resume was missing 3 crucial distributed system keywords. Once I updated it, my recruiter callback rate literally tripled.'
  },
  {
    name: 'Emily Watson',
    role: 'Frontend Engineer',
    company: 'Global SaaS',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    stat: 'Reclaimed 12h/week',
    quote:
      'Having the Online Compiler, AI Mock Interviewer, and Gmail auto-classifier all in one cohesive dashboard changed everything. No more lost spreadsheets!'
  },
  {
    name: 'Rohan Deshmukh',
    role: 'Cloud & DevOps Engineer',
    company: 'Enterprise Tech',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    stat: '35% Salary Bump',
    quote:
      'The AI mock interview practice questions matched almost verbatim what the hiring team asked in my system design loop. I felt 100% prepared.'
  }
];

export default function TestimonialsSection() {
  return (
    <section className="landing-section bg-slate-900 text-white py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-slate-900 to-slate-900 pointer-events-none" />

      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>Success Stories</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Engineers Landing Roles with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Job Dashboard</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            See how developers and tech professionals optimize their job search and accelerate their career transition.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 shadow-xl flex flex-col justify-between hover:border-brand-500/50 hover:bg-slate-800 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                    {t.stat}
                  </span>
                </div>

                <Quote className="h-6 w-6 text-brand-400/40 mb-2" />
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-700/60">
                <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center text-sm border-2 border-slate-600 shrink-0">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {t.name}
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                  </h4>
                  <p className="text-xs text-slate-400">{t.role} • <span className="text-slate-300 font-medium">{t.company}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
