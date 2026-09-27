const TECH_STACK = [
  {
    category: 'Frontend',
    color: 'tech-badge-blue',
    items: ['React 18', 'Vite', 'Tailwind CSS', 'Lucide Icons', 'Recharts', 'Axios'],
  },
  {
    category: 'Backend',
    color: 'tech-badge-green',
    items: ['Node.js', 'Express.js', 'REST API', 'Mongoose ODM', 'JWT Auth', 'Multer'],
  },
  {
    category: 'Database',
    color: 'tech-badge-amber',
    items: ['MongoDB'],
  },
  {
    category: 'AI / LLM',
    color: 'tech-badge-purple',
    items: ['OpenAI API', 'GPT-4o-mini', 'Resume Parsing', 'Job Matching AI'],
  },
  {
    category: 'Integrations',
    color: 'tech-badge-rose',
    items: ['Google OAuth 2.0', 'Gmail API', 'Google APIs (googleapis)'],
  },
  {
    category: 'Automation',
    color: 'tech-badge-teal',
    items: ['n8n Webhooks', 'Cron Jobs', 'Scheduled Discovery'],
  },
  {
    category: 'Security',
    color: 'tech-badge-slate',
    items: ['Helmet.js', 'bcryptjs', 'Rate Limiting', 'DOMPurify'],
  },
  {
    category: 'Document Processing',
    color: 'tech-badge-orange',
    items: ['pdf-parse', 'mammoth (DOCX)', 'pdfkit', 'cheerio'],
  },
];

export default function TechSection() {
  return (
    <section id="tech" className="landing-section bg-white">
      <div className="landing-container">
        <div className="section-header">
          <div className="section-badge">Technology</div>
          <h2 className="section-heading">
            Built on a{' '}
            <span className="section-heading-accent">Modern, Reliable Stack</span>
          </h2>
          <p className="section-subtext">
            JOB DASHBOARD is built with production-grade technologies to ensure
            performance, security, and reliability.
          </p>
        </div>

        <div className="tech-grid">
          {TECH_STACK.map((group) => (
            <div key={group.category} className="tech-card">
              <h3 className="tech-card-category">{group.category}</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                {group.items.map((item) => (
                  <span key={item} className={`tech-badge ${group.color}`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
