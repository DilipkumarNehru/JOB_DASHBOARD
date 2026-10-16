import { useState } from 'react';
import {
  LayoutDashboard, Briefcase, FileText, Target, FileCheck, Mail, Terminal, Video,
  Sparkles, CheckCircle2, Play, ExternalLink, ChevronRight, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductPreview() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <section id="preview" className="landing-section bg-slate-950 text-white py-24 relative overflow-hidden border-t border-slate-800">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-brand-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Interactive App Tour</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            See the Platform in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Action</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            Click through each module to explore how Job Dashboard streamlines candidate discovery, preparation, and tracking.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-4xl mx-auto">
          {[
            { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
            { id: 'jobs', label: 'Job Discovery', icon: Briefcase },
            { id: 'resume', label: 'Resume ATS Studio', icon: FileText },
            { id: 'practice', label: 'AI Practice & Mock', icon: Video },
            { id: 'compiler', label: 'Online Compiler', icon: Terminal },
            { id: 'gmail', label: 'Gmail Classifier', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/30 ring-2 ring-brand-400/20'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Screen Preview */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden max-w-5xl mx-auto backdrop-blur-xl">
          {/* Top chrome */}
          <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-400 font-mono ml-2">
                jobdashboard.app/{activeTab}
              </span>
            </div>
            <Link
              to="/register"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              Open Live <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Screen Content Panels */}
          <div className="p-6 md:p-8 min-h-[420px]">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Pipeline Summary &amp; Analytics</h3>
                    <p className="text-xs text-slate-400 mt-1">Real-time status across 142 discovered jobs &amp; primary resume</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Primary: FullStack_v2.pdf
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Jobs Discovered', val: '142', change: '+18 today', color: 'text-brand-400' },
                    { label: 'Matched (≥70%)', val: '28', change: '87% avg match', color: 'text-emerald-400' },
                    { label: 'Active Applications', val: '12', change: '3 screening', color: 'text-blue-400' },
                    { label: 'Interviews Booked', val: '4', change: '1 scheduled today', color: 'text-purple-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-xs text-slate-400 block">{stat.label}</span>
                      <span className={`text-2xl font-black ${stat.color} block my-1`}>{stat.val}</span>
                      <span className="text-[11px] text-slate-500">{stat.change}</span>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs font-bold text-slate-300 block mb-4">Application Velocity (Last 8 Weeks)</span>
                    <div className="flex items-end gap-3 h-32 px-2">
                      {[35, 55, 45, 75, 60, 90, 80, 100].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <div
                            className="w-full bg-gradient-to-t from-brand-600 to-indigo-500 rounded-t-md transition-all duration-500"
                            style={{ height: `${h}%` }}
                          />
                          <span className="text-[10px] text-slate-500">W{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block mb-3">Interview Pipeline Funnel</span>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Applied</span>
                          <span className="text-white font-bold">12</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full w-[100%]" />
                        </div>

                        <div className="flex justify-between text-slate-400 pt-1">
                          <span>Recruiter Screen</span>
                          <span className="text-white font-bold">6</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full w-[50%]" />
                        </div>

                        <div className="flex justify-between text-slate-400 pt-1">
                          <span>Final Rounds</span>
                          <span className="text-white font-bold">4</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[33%]" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-semibold mt-3">33% Application-to-Interview Rate</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xl font-bold text-white">Live Discovered Jobs Feed</h3>
                  <span className="text-xs text-brand-400 bg-brand-950 border border-brand-800 px-3 py-1 rounded-full">
                    Auto-Crawled from Career Portals
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Senior Full Stack Engineer', company: 'Stripe', match: 96, loc: 'Remote', salary: '$140k - $185k' },
                    { title: 'AI Platform / LLM Engineer', company: 'Scale AI', match: 92, loc: 'San Francisco, CA', salary: '$160k - $210k' },
                    { title: 'Staff Frontend Developer', company: 'Vercel', match: 89, loc: 'Remote', salary: '$150k - $190k' },
                  ].map((job) => (
                    <div key={job.title} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-400">{job.company}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-500">{job.loc}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{job.title}</h4>
                        <span className="text-xs text-slate-400 mt-1 block">{job.salary}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-emerald-400 block">{job.match}% Match</span>
                        <span className="text-[11px] text-slate-500">Based on primary resume</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'resume' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xl font-bold text-white">AI Resume Analysis &amp; ATS Audit</h3>
                  <span className="text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
                    Parsed: 22 Skills Extracted
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Extracted Skill Profile</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['React', 'Node.js', 'Express', 'MongoDB', 'Python', 'OpenAI API', 'REST API', 'Docker', 'JWT', 'Git', 'Tailwind CSS'].map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-emerald-400 block">ATS Score Breakdown</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Keyword Density Alignment</span>
                        <span className="text-emerald-400 font-bold">96%</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Experience Relevance</span>
                        <span className="text-emerald-400 font-bold">92%</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Formatting &amp; Parseability</span>
                        <span className="text-emerald-400 font-bold">100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'practice' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xl font-bold text-white">AI Technical Practice &amp; Video Mock Room</h3>
                  <span className="text-xs text-purple-400 bg-purple-950 border border-purple-800 px-3 py-1 rounded-full">
                    Dynamic AI Question Engine
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                      Target Role: Senior Full Stack Engineer
                    </span>
                    <span className="text-xs text-slate-400">Difficulty: Medium / Hard</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    "Can you explain the trade-offs between Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG) in high-traffic applications?"
                  </p>
                  <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-lg text-xs text-purple-300 flex items-center justify-between">
                    <span>💡 Hint: Focus on Time-to-First-Byte (TTFB), SEO requirements, and caching strategies.</span>
                    <span className="text-emerald-400 font-bold">AI Evaluator Ready</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compiler' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-brand-400 font-bold text-sm">Online Compiler IDE (5 Languages Supported)</span>
                  <span className="text-emerald-400">Ready: Node.js, Python, C++, Java, Go</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-xs leading-relaxed">
                  <p className="text-purple-400">// Two Sum Problem (LeetCode #1)</p>
                  <p><span className="text-blue-400">function</span> <span className="text-yellow-400">twoSum</span>(nums, target) &#123;</p>
                  <p className="pl-4"><span className="text-purple-400">const</span> map = <span className="text-purple-400">new</span> Map();</p>
                  <p className="pl-4"><span className="text-purple-400">for</span> (<span className="text-purple-400">let</span> i = 0; i &lt; nums.length; i++) &#123;</p>
                  <p className="pl-8"><span className="text-purple-400">const</span> diff = target - nums[i];</p>
                  <p className="pl-8"><span className="text-purple-400">if</span> (map.has(diff)) <span className="text-purple-400">return</span> [map.get(diff), i];</p>
                  <p className="pl-8">map.set(nums[i], i);</p>
                  <p className="pl-4">&#125;</p>
                  <p>&#125;</p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 flex items-center justify-between">
                  <span>Output: [0, 1] (Target 9 found with [2, 7])</span>
                  <span className="text-slate-500">Execution: 0.038s</span>
                </div>
              </div>
            )}

            {activeTab === 'gmail' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xl font-bold text-white">Smart Recruiter Email Organizer</h3>
                  <span className="text-xs text-rose-400 bg-rose-950 border border-rose-800 px-3 py-1 rounded-full">
                    OAuth 2.0 Synced
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { from: 'Recruiting Team @ Stripe', subject: 'Invitation to Technical Interview (Senior Full Stack)', cat: 'Interview Invite', catColor: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
                    { from: 'Talent Acquisition @ Scale AI', subject: 'Application Update: Next Steps in Engineering Review', cat: 'Shortlisted', catColor: 'bg-blue-950 text-blue-300 border-blue-800' },
                    { from: 'Careers @ GitHub', subject: 'Thank you for your application to GitHub Infrastructure', cat: 'Applied', catColor: 'bg-slate-800 text-slate-300 border-slate-700' },
                  ].map((email) => (
                    <div key={email.subject} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block mb-1">{email.from}</span>
                        <h4 className="text-sm font-bold text-white">{email.subject}</h4>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${email.catColor}`}>
                        {email.cat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
