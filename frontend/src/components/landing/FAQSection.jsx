import { useState, useMemo } from 'react';
import { ChevronDown, HelpCircle, Search, Sparkles } from 'lucide-react';

const CATEGORIES = ['All', 'AI & Resume', 'Practice & IDE', 'Gmail Sync', 'Privacy & Account'];

const FAQS = [
  {
    category: 'AI & Resume',
    q: 'How does the AI Resume Match score work?',
    a: 'When you upload your resume (PDF or DOCX), our AI extracts your skills, experience years, certifications, and technical proficiencies. When reviewing job openings, each job description is analyzed against your profile to generate an ATS compatibility percentage, along with matched skills and exact missing keywords that recruiters search for.'
  },
  {
    category: 'AI & Resume',
    q: 'Can I upload and manage multiple resume versions?',
    a: 'Yes! You can upload multiple resumes tailored for different career tracks (e.g., Full Stack Engineer, Frontend Specialist, AI Engineer). You can select which resume serves as your Primary Resume for global matching across newly discovered jobs.'
  },
  {
    category: 'Practice & IDE',
    q: 'What is the AI Mock Interview and Video Call Room?',
    a: 'The Video Call room features an AI-driven technical and behavioral interview simulation. You can practice answering real interview questions aloud, receive real-time speech and confidence feedback, and prepare for high-pressure technical screens before facing real recruiters.'
  },
  {
    category: 'Practice & IDE',
    q: 'Which programming languages are supported in the Online Compiler?',
    a: 'The integrated code compiler supports JavaScript (Node.js), Python 3, C++, Java, and Go. You can write, test, and execute algorithms right from your browser with instant console output, execution time metrics, and custom test cases.'
  },
  {
    category: 'Gmail Sync',
    q: 'How does Gmail integration work? Is my inbox private?',
    a: 'We connect directly to Gmail via secure Google OAuth 2.0. Our scanner solely searches for and categorizes job-related emails into Interview Invites, Application Confirmations, Shortlists, Rejections, and Follow-ups. Your personal correspondence is never accessed, stored, or shared.'
  },
  {
    category: 'Privacy & Account',
    q: 'Does Job Dashboard automatically apply to jobs on my behalf?',
    a: 'No. We believe automated mass-applying damages candidate reputation and triggers recruiter spam filters. Instead, Job Dashboard assists, prioritizes, and accelerates your applications while keeping you in 100% control of every submission.'
  },
  {
    category: 'Privacy & Account',
    q: 'Is there a free tier to get started?',
    a: 'Yes! You can register for free without a credit card. You get full access to resume parsing, job discovery, application tracking, the online code compiler, and interview practice.'
  },
  {
    category: 'Privacy & Account',
    q: 'Can I log into my existing Job Dashboard account?',
    a: 'Absolutely. Existing accounts can log in directly using the Login page. All your uploaded resumes, saved applications, interview schedules, and notes are preserved.'
  }
];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchCat = activeCategory === 'All' || faq.category === activeCategory;
      const matchSearch =
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="landing-section bg-slate-950 text-white py-24 relative overflow-hidden border-t border-slate-800">
      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <HelpCircle className="h-3.5 w-3.5 text-brand-400" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Questions</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            Everything you need to know about the platform, AI matching, video interviews, and privacy.
          </p>
        </div>

        {/* Search and Category Filters */}
        <div className="max-w-3xl mx-auto mb-10 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions (e.g. ATS, Gmail, Compiler, Free tier)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={item.q}
                  className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors"
                  >
                    <span className="text-sm md:text-base font-semibold text-white">{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-brand-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-slate-900 rounded-xl border border-slate-800">
              <p className="text-sm text-slate-400">No matching questions found.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="mt-2 text-xs text-brand-400 font-semibold hover:underline"
              >
                Reset search
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
