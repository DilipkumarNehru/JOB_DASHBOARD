export const SKILL_CATEGORIES = {
  backend: [
    'Node.js', 'Express.js', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
    'Java', 'Spring Boot', 'C#', '.NET', 'Go', 'Golang', 'Rust', 'Ruby on Rails',
    'PHP', 'Laravel', 'REST API', 'GraphQL', 'gRPC', 'Microservices', 'WebSockets',
    'RabbitMQ', 'Kafka', 'Celery', 'Redis', 'BullMQ'
  ],
  frontend: [
    'React.js', 'React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte',
    'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap',
    'Redux', 'Zustand', 'React Query', 'Vite', 'Webpack'
  ],
  database: [
    'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Cassandra', 'DynamoDB',
    'Elasticsearch', 'Mongoose', 'Prisma', 'TypeORM', 'Sequelize', 'Oracle', 'MS SQL Server',
    'SQL Server', 'SQL', 'NoSQL', 'Firebase'
  ],
  devops_cloud: [
    'Docker', 'Kubernetes', 'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud',
    'CI/CD', 'GitHub Actions', 'Jenkins', 'Terraform', 'Linux', 'Nginx', 'Serverless'
  ],
  testing: [
    'Selenium', 'Postman', 'JMeter', 'Jest', 'Mocha', 'Chai', 'Cypress', 'Playwright',
    'Automation Testing', 'Manual Testing', 'Unit Testing'
  ],
  concepts_practices: [
    'Agile', 'Scrum', 'Git', 'GitHub', 'Bitbucket', 'OAuth 2.0', 'JWT', 'RBAC',
    'System Design', 'Event-Driven Architecture', 'Clean Architecture', 'TDD',
    'SOLID Principles', 'Design Patterns', 'Object-Oriented Programming', 'Functional Programming'
  ],
  accounting_finance: [
    'Accounting', 'Tally', 'Tally ERP', 'Tally ERP 9', 'GST', 'GST Filing', 'TDS',
    'Accounts Payable', 'Accounts Receivable', 'Financial Reporting', 'Financial Statements',
    'Balance Sheet', 'Profit and Loss', 'P&L', 'Budgeting', 'Forecasting', 'Auditing',
    'Internal Audit', 'Statutory Audit', 'Taxation', 'Income Tax', 'Indirect Tax',
    'Direct Tax', 'SAP', 'SAP FICO', 'SAP Finance', 'QuickBooks', 'MYOB',
    'Financial Analysis', 'Cost Accounting', 'Management Accounting', 'Bookkeeping',
    'Bank Reconciliation', 'Accounts Management', 'General Ledger', 'IFRS', 'GAAP',
    'Cash Flow', 'Fund Flow', 'Treasury', 'Payroll', 'Invoice Processing',
    'Vendor Management', 'Vendor Payments', 'Invoice Management', 'GSTR',
    'ITR', 'ROC', 'MCA', 'Zoho Books', 'FreshBooks', 'Xero', 'ERPNext',
    'Fixed Assets', 'Depreciation', 'Variance Analysis', 'Financial Planning'
  ],
  sales_marketing: [
    'Sales', 'B2B Sales', 'B2C Sales', 'Inside Sales', 'Field Sales', 'Direct Sales',
    'Business Development', 'Lead Generation', 'Cold Calling', 'Prospecting',
    'CRM', 'Salesforce', 'HubSpot', 'Zoho CRM', 'Pipedrive',
    'Negotiation', 'Closing', 'Sales Closing', 'Customer Relationship Management',
    'Account Management', 'Key Account Management', 'Territory Management',
    'Revenue Generation', 'Target Achievement', 'Quota Achievement',
    'Market Research', 'Competitor Analysis', 'Sales Strategy', 'Sales Planning',
    'Product Demonstration', 'Demo', 'Proposal Writing', 'RFP', 'Tender',
    'Partnership Development', 'Channel Sales', 'Enterprise Sales', 'SaaS Sales',
    'Customer Acquisition', 'Retention', 'Upselling', 'Cross-selling',
    'Digital Marketing', 'Social Media Marketing', 'Content Marketing',
    'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Email Marketing',
    'LinkedIn Sales Navigator', 'Apollo', 'Outreach'
  ],
  hr_operations: [
    'Recruitment', 'Talent Acquisition', 'Hiring', 'Screening', 'Interviewing',
    'Onboarding', 'HR Operations', 'HRMS', 'Payroll Processing', 'PF', 'ESIC',
    'Employee Relations', 'Performance Management', 'Training & Development',
    'Learning & Development', 'Compensation & Benefits', 'Job Posting', 'ATS Systems',
    'Background Verification', 'Offer Management', 'Employer Branding'
  ],
  data_analytics: [
    'Data Analysis', 'Data Analytics', 'Python', 'R', 'Pandas', 'NumPy', 'Matplotlib',
    'Tableau', 'Power BI', 'Looker', 'Google Analytics', 'Data Visualization',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn',
    'Statistics', 'Statistical Analysis', 'Excel', 'Advanced Excel', 'VBA',
    'SQL', 'BigQuery', 'Snowflake', 'dbt', 'ETL', 'Data Pipeline', 'Airflow'
  ],
  office_tools: [
    'Microsoft Office', 'MS Office', 'Excel', 'Advanced Excel', 'Word', 'PowerPoint',
    'Outlook', 'Teams', 'Google Workspace', 'Google Sheets', 'Google Docs',
    'Pivot Tables', 'VLOOKUP', 'HLOOKUP', 'Macros', 'VBA', 'Power Query'
  ],
  soft_skills: [
    'Communication', 'Leadership', 'Team Management', 'Problem Solving',
    'Critical Thinking', 'Time Management', 'Project Management', 'Stakeholder Management',
    'Presentation Skills', 'Client Management', 'Cross-functional Collaboration',
    'Analytical Skills', 'Attention to Detail', 'Multitasking', 'Adaptability'
  ]
};

export const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

// Alias map for intelligent skill normalization
const SKILL_ALIASES = {
  'nodejs': 'Node.js',
  'node js': 'Node.js',
  'node.js': 'Node.js',
  'reactjs': 'React.js',
  'react js': 'React.js',
  'vuejs': 'Vue.js',
  'vue js': 'Vue.js',
  'angularjs': 'Angular',
  'angular js': 'Angular',
  'expressjs': 'Express.js',
  'express js': 'Express.js',
  'nextjs': 'Next.js',
  'next js': 'Next.js',
  'nestjs': 'NestJS',
  'nest js': 'NestJS',
  'mongodb': 'MongoDB',
  'mongo db': 'MongoDB',
  'mongo': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'mysql': 'MySQL',
  'javascript': 'JavaScript',
  'java script': 'JavaScript',
  'js': 'JavaScript',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'python3': 'Python',
  'golang': 'Go',
  'dotnet': '.NET',
  'dot net': '.NET',
  'springboot': 'Spring Boot',
  'spring-boot': 'Spring Boot',
  'amazon web services': 'AWS',
  'google cloud platform': 'GCP',
  'google cloud': 'GCP',
  'ms sql': 'MS SQL Server',
  'mssql': 'MS SQL Server',
  'microsoft sql server': 'MS SQL Server',
  'tally erp9': 'Tally ERP 9',
  'tally erp 9': 'Tally ERP 9',
  'ms excel': 'Excel',
  'microsoft excel': 'Excel',
  'ms office': 'MS Office',
  'microsoft office': 'MS Office',
  'power bi': 'Power BI',
  'powerbi': 'Power BI',
  'tableau': 'Tableau',
  'crm': 'CRM',
  'salesforce crm': 'Salesforce',
  'hubspot crm': 'HubSpot',
  'b2b': 'B2B Sales',
  'b2c': 'B2C Sales',
  'gst filing': 'GST Filing',
  'tds filing': 'TDS',
  'accounts payable': 'Accounts Payable',
  'accounts receivable': 'Accounts Receivable',
  'ap': 'Accounts Payable',
  'ar': 'Accounts Receivable',
  'p&l': 'Profit and Loss',
  'pl': 'Profit and Loss',
  'rest': 'REST API',
  'restful': 'REST API',
  'restful api': 'REST API',
  'rest apis': 'REST API',
  'aws lambda': 'AWS',
  'aws ec2': 'AWS',
  'devops': 'CI/CD',
  'docker container': 'Docker',
  'kubernetes k8s': 'Kubernetes',
  'k8s': 'Kubernetes',
  'html': 'HTML5',
  'css': 'CSS3',
};

export const normalizeSkill = (skillName) => {
  if (!skillName) return '';
  const cleaned = skillName.trim();
  const lower = cleaned.toLowerCase().replace(/\s+/g, ' ');

  // Check direct alias map
  if (SKILL_ALIASES[lower]) return SKILL_ALIASES[lower];

  // Check exact match (case-insensitive)
  for (const s of ALL_SKILLS) {
    if (s.toLowerCase() === lower) return s;
  }

  // Check stripped match (remove punctuation/spaces)
  const stripped = lower.replace(/[\s.\-_]/g, '');
  for (const s of ALL_SKILLS) {
    if (s.toLowerCase().replace(/[\s.\-_]/g, '') === stripped) return s;
  }

  return cleaned;
};

/**
 * Extract skills from free text using dictionary matching
 */
export const extractSkillsFromText = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matched = new Set();

  for (const skill of ALL_SKILLS) {
    const sLower = skill.toLowerCase();
    const escaped = sLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i');
    if (regex.test(lower)) {
      matched.add(skill);
    }
  }

  // Also check aliases
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i');
    if (regex.test(lower)) {
      matched.add(canonical);
    }
  }

  return Array.from(matched);
};
