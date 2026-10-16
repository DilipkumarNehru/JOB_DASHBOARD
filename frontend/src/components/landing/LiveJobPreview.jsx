import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building, DollarSign, Sparkles, Filter, ExternalLink, ArrowRight, Check } from 'lucide-react';

const MOCK_JOBS = [
  {
    id: 1,
    title: 'Senior Full Stack Engineer (React / Node)',
    company: 'Stripe',
    location: 'Remote (US / Global)',
    type: 'Full-Time',
    salary: '$140,000 - $185,000',
    matchScore: 96,
    tags: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
    posted: '2 hours ago',
    featured: true
  },
  {
    id: 2,
    title: 'AI Platform & Prompt Engineer',
    company: 'Scale AI',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-Time',
    salary: '$160,000 - $210,000',
    matchScore: 92,
    tags: ['Python', 'OpenAI', 'LangChain', 'FastAPI'],
    posted: '5 hours ago',
    featured: true
  },
  {
    id: 3,
    title: 'Lead Frontend Developer',
    company: 'Vercel',
    location: 'Remote',
    type: 'Full-Time',
    salary: '$150,000 - $190,000',
    matchScore: 88,
    tags: ['Next.js', 'React 18', 'Tailwind', 'Performance'],
    posted: '1 day ago',
    featured: false
  },
  {
    id: 4,
    title: 'Backend Systems & API Architect',
    company: 'Datadog',
    location: 'New York, NY (Hybrid)',
    type: 'Full-Time',
    salary: '$165,000 - $205,000',
    matchScore: 84,
    tags: ['Node.js', 'Go', 'Distributed Systems', 'MongoDB'],
    posted: '1 day ago',
    featured: false
  },
  {
    id: 5,
    title: 'Software Engineer - Cloud Infrastructure',
    company: 'GitHub',
    location: 'Remote',
    type: 'Full-Time',
    salary: '$135,000 - $175,000',
    matchScore: 79,
    tags: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
    posted: '2 days ago',
    featured: false
  },
  {
    id: 6,
    title: 'Full Stack Product Engineer',
    company: 'Notion',
    location: 'Remote (Americas / EMEA)',
    type: 'Full-Time',
    salary: '$145,000 - $180,000',
    matchScore: 91,
    tags: ['React', 'TypeScript', 'Node.js', 'UI/UX'],
    posted: '3 days ago',
    featured: false
  }
];

export default function LiveJobPreview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [highMatchOnly, setHighMatchOnly] = useState(false);

  const filteredJobs = useMemo(() => {
    return MOCK_JOBS.filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchRemote = !remoteOnly || job.location.toLowerCase().includes('remote');
      const matchScore = !highMatchOnly || job.matchScore >= 85;
      return matchSearch && matchRemote && matchScore;
    });
  }, [searchTerm, remoteOnly, highMatchOnly]);

  return (
    <section id="live-jobs" className="landing-section bg-slate-50 py-24 relative overflow-hidden border-y border-slate-200">
      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4 border border-blue-200">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Real-Time Discovery Feed</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Curated Tech Openings, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Ranked by ATS Match</span>
          </h2>
          <p className="text-slate-600 text-base md:text-lg">
            Our automated crawlers index verified career pages daily. Try searching and filtering below to see how Job Dashboard prioritizes top matching roles.
          </p>
        </div>

        {/* Live Search and Filter Bar */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xl max-w-4xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, company, or skill (e.g. React, Stripe, Python)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`flex-1 md:flex-none px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                  remoteOnly
                    ? 'bg-brand-50 text-brand-700 border-brand-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${remoteOnly ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>
                  {remoteOnly && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
                <span>Remote Only</span>
              </button>

              <button
                onClick={() => setHighMatchOnly(!highMatchOnly)}
                className={`flex-1 md:flex-none px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                  highMatchOnly
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${highMatchOnly ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {highMatchOnly && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
                <span>Match ≥ 85%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Job Listings Grid */}
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-10">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Building className="h-3 w-3" /> {job.company}
                        </span>
                        {job.featured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            HOT ROLE
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {job.title}
                      </h4>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                        {job.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                      {job.salary}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span>Discovered {job.posted}</span>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center gap-1 text-brand-600 font-semibold hover:text-brand-700 group-hover:translate-x-0.5 transition-all"
                  >
                    View Details
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500 text-sm">No jobs match your filter criteria.</p>
              <button
                onClick={() => { setSearchTerm(''); setRemoteOnly(false); setHighMatchOnly(false); }}
                className="mt-3 text-xs text-brand-600 font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* CTA Banner */}
        <div className="text-center">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 transition-all"
          >
            Explore All 140+ Live Openings
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-slate-400 mt-2">
            No signup required to view initial discovery feed.
          </p>
        </div>
      </div>
    </section>
  );
}
