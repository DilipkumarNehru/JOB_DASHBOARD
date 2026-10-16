import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Zap, Target, RefreshCw } from 'lucide-react';

const PRESET_ROLES = [
  {
    id: 'fullstack',
    title: 'Full Stack Engineer',
    company: 'NextGen SaaS',
    baseScore: 92,
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', 'Docker'],
    missing: ['GraphQL', 'AWS ECS'],
    feedback: 'High ATS match. Adding GraphQL and AWS cloud containerization will boost your interview callback probability to 98%.'
  },
  {
    id: 'ai-ml',
    title: 'AI / LLM Application Developer',
    company: 'Cognitive Labs',
    baseScore: 89,
    skills: ['Python', 'OpenAI API', 'LangChain', 'Vector DBs', 'FastAPI'],
    missing: ['LlamaIndex', 'Fine-Tuning'],
    feedback: 'Strong alignment with generative AI frameworks. Highlight RAG pipeline benchmarks on your resume.'
  },
  {
    id: 'frontend',
    title: 'Senior Frontend Architect',
    company: 'FinTech Global',
    baseScore: 95,
    skills: ['React 18', 'Tailwind CSS', 'Next.js', 'State Management', 'Web Vitals', 'Testing'],
    missing: ['Micro-frontends'],
    feedback: 'Exceptional match! Your modern React and UI optimization keywords match top ATS filters.'
  },
  {
    id: 'backend',
    title: 'Backend Systems Engineer',
    company: 'CloudScale Corp',
    baseScore: 88,
    skills: ['Node.js / Express', 'MongoDB', 'Redis', 'System Design', 'JWT Auth'],
    missing: ['Kafka / RabbitMQ', 'Kubernetes'],
    feedback: 'Solid backend fundamentals. Incorporating event-driven architecture keywords will unlock Tier-1 recruiter screens.'
  }
];

export default function LiveAtsDemo() {
  const [selectedRole, setSelectedRole] = useState(PRESET_ROLES[0]);
  const [addedSkills, setAddedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');

  const currentMissing = selectedRole.missing.filter((s) => !addedSkills.includes(s));
  const effectiveScore = Math.min(100, selectedRole.baseScore + (addedSkills.length * 4));

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setAddedSkills([]);
  };

  const handleAddMissing = (skill) => {
    if (!addedSkills.includes(skill)) {
      setAddedSkills([...addedSkills, skill]);
    }
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (customSkill.trim() && !addedSkills.includes(customSkill.trim())) {
      setAddedSkills([...addedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleReset = () => {
    setAddedSkills([]);
  };

  return (
    <section id="live-demo" className="landing-section bg-slate-900 text-white relative overflow-hidden py-24">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Test Drive the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">AI ATS Match Engine</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            See how our algorithm compares candidate resumes against live job requirements, pinpoints missing keywords, and optimizes your score before you hit submit.
          </p>
        </div>

        {/* Role selector tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
          {PRESET_ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 border ${
                selectedRole.id === role.id
                  ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/30 ring-2 ring-brand-400/20'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {role.title}
            </button>
          ))}
        </div>

        {/* Interactive Match Console */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-2xl p-6 md:p-8 max-w-4xl mx-auto backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between pb-6 mb-6 border-b border-slate-700/70 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
                <span>Target Job Opportunity</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                <span>{selectedRole.company}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">{selectedRole.title}</h3>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-700">
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">ATS Match Score</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  {effectiveScore}%
                </span>
              </div>
              {/* Radial or meter indicator */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="#334155" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#10b981"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 - (125.6 * effectiveScore) / 100}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <Zap className="h-4 w-4 text-emerald-400 absolute" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Matched skills */}
            <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Matched Skills ({selectedRole.skills.length + addedSkills.length})</span>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">ATS Verified</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedRole.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    {skill}
                  </span>
                ))}
                {addedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse"
                  >
                    <Sparkles className="h-3 w-3 text-blue-400" />
                    {skill} (Just Added)
                  </span>
                ))}
              </div>
            </div>

            {/* Missing keywords */}
            <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Missing Keywords ({currentMissing.length})</span>
                  </div>
                  {addedSkills.length > 0 && (
                    <button
                      onClick={handleReset}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" /> Reset
                    </button>
                  )}
                </div>

                {currentMissing.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentMissing.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => handleAddMissing(skill)}
                        title="Click to simulate adding this skill to resume"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/30 hover:border-amber-400 transition-all cursor-pointer group"
                      >
                        <span>+ {skill}</span>
                        <span className="text-[10px] text-amber-400/70 group-hover:text-amber-200">(+4%)</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>All high-priority ATS keywords covered! Score maximized.</span>
                  </div>
                )}
              </div>

              {/* Add custom skill input */}
              <form onSubmit={handleAddCustom} className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Test custom skill (e.g. Redis, AWS)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 flex-1"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
                >
                  Test Skill
                </button>
              </form>
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-950/80 to-slate-900 border border-brand-500/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-600/20 text-brand-400 shrink-0 mt-0.5">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-brand-300 uppercase tracking-wider block mb-1">
                AI Recommendation Engine
              </span>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                {selectedRole.feedback}
              </p>
            </div>
            <Link
              to="/resumes"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shrink-0 transition-colors shadow-md shadow-brand-600/30"
            >
              Analyze Resume
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
