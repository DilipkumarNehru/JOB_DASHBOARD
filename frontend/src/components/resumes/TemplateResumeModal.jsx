import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles, Plus, Trash2, Eye, Download, Check, X,
  FileText, Briefcase, GraduationCap, Award, FolderGit2,
  RefreshCw, Palette, Layers, User, Phone, Mail, MapPin,
  Globe, Linkedin, Github, ChevronRight, Crown, AlertCircle, FileType
} from 'lucide-react';
import { resumeService } from '../../services';

export const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Tech',
    category: 'Engineering & Tech',
    badge: 'Popular',
    desc: 'Crisp royal blue accents with modern pill tags, optimized for developers & technical roles.',
    accentColor: '#2563eb',
    accentClass: 'bg-blue-600',
    lightClass: 'bg-blue-50 border-blue-200 text-blue-700',
    previewBorder: 'border-blue-500',
  },
  {
    id: 'executive',
    name: 'Executive Elite',
    category: 'Leadership & Management',
    badge: 'Authoritative',
    desc: 'Deep slate-navy headers with commanding typography, ideal for managers & directors.',
    accentColor: '#0f172a',
    accentClass: 'bg-slate-900',
    lightClass: 'bg-slate-100 border-slate-300 text-slate-800',
    previewBorder: 'border-slate-800',
  },
  {
    id: 'minimal',
    name: 'Minimalist ATS',
    category: 'Universal ATS',
    badge: '100% ATS Friendly',
    desc: 'Clean monochrome structure engineered for maximum parsing accuracy across all ATS systems.',
    accentColor: '#18181b',
    accentClass: 'bg-zinc-800',
    lightClass: 'bg-zinc-100 border-zinc-300 text-zinc-800',
    previewBorder: 'border-zinc-800',
  },
  {
    id: 'creative',
    name: 'Creative & Product',
    category: 'Product & Design',
    badge: 'Contemporary',
    desc: 'Vibrant emerald accents highlighting projects, portfolio showcases, and user impact.',
    accentColor: '#059669',
    accentClass: 'bg-emerald-600',
    lightClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    previewBorder: 'border-emerald-500',
  },
  {
    id: 'datascience',
    name: 'Data Science & AI',
    category: 'Data & Analytics',
    badge: 'Analytical',
    desc: 'Sky-blue accents for data scientists, ML engineers, and analytics professionals with research emphasis.',
    accentColor: '#0284c7',
    accentClass: 'bg-sky-600',
    lightClass: 'bg-sky-50 border-sky-200 text-sky-700',
    previewBorder: 'border-sky-500',
  },
  {
    id: 'sales',
    name: 'Sales & Marketing',
    category: 'Business & Revenue',
    badge: 'Results-Driven',
    desc: 'Warm amber-orange accents conveying energy and revenue impact for sales, BDR, and marketing pros.',
    accentColor: '#d97706',
    accentClass: 'bg-amber-600',
    lightClass: 'bg-amber-50 border-amber-200 text-amber-700',
    previewBorder: 'border-amber-500',
  },
  {
    id: 'devops',
    name: 'DevOps & Cloud',
    category: 'Infrastructure & SRE',
    badge: 'Technical',
    desc: 'Deep teal accents for cloud architects, DevOps, SRE, and platform engineers.',
    accentColor: '#0d9488',
    accentClass: 'bg-teal-600',
    lightClass: 'bg-teal-50 border-teal-200 text-teal-700',
    previewBorder: 'border-teal-500',
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    category: 'Health & Life Sciences',
    badge: 'Professional',
    desc: 'Crimson rose accents for healthcare workers, nurses, pharmacists, and medical professionals.',
    accentColor: '#e11d48',
    accentClass: 'bg-rose-600',
    lightClass: 'bg-rose-50 border-rose-200 text-rose-700',
    previewBorder: 'border-rose-500',
  },
  {
    id: 'accounting',
    name: 'Finance & Accounting',
    category: 'Finance & Compliance',
    badge: 'Corporate',
    desc: 'Classic corporate blue for accountants, auditors, financial analysts, and banking professionals.',
    accentColor: '#2563eb',
    accentClass: 'bg-blue-600',
    lightClass: 'bg-blue-50 border-blue-200 text-blue-700',
    previewBorder: 'border-blue-500',
  },
  {
    id: 'fresher',
    name: 'Fresher — General',
    category: 'Entry Level & Students',
    badge: 'High Impact',
    desc: 'Vibrant violet accents putting education, academic projects, and core skills front and center.',
    accentColor: '#7c3aed',
    accentClass: 'bg-violet-600',
    lightClass: 'bg-violet-50 border-violet-200 text-violet-700',
    previewBorder: 'border-violet-500',
  },
  {
    id: 'fresher_it',
    name: 'Fresher — IT & CS',
    category: 'Entry Level IT / CSE',
    badge: 'Campus Ready',
    desc: 'Bold orange accents designed for B.Tech / BCA / MCA freshers with coding projects and internship focus.',
    accentColor: '#ea580c',
    accentClass: 'bg-orange-600',
    lightClass: 'bg-orange-50 border-orange-200 text-orange-700',
    previewBorder: 'border-orange-500',
  },
  {
    id: 'fresher_nonit',
    name: 'Fresher — Non-IT',
    category: 'Entry Level Non-Tech',
    badge: 'Versatile',
    desc: 'Indigo accents for freshers in MBA, Commerce, Arts, Nursing, or any non-technical graduation.',
    accentColor: '#4f46e5',
    accentClass: 'bg-indigo-600',
    lightClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    previewBorder: 'border-indigo-500',
  },
];

const PRESETS = {
  modern: {
    name: 'Alex Rivera',
    title: 'Senior Full Stack Software Engineer',
    email: 'alex.rivera.dev@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA (or Remote)',
    linkedin: 'linkedin.com/in/alexrivera-dev',
    github: 'github.com/alexrivera',
    website: 'https://alexrivera.io',
    summary: 'High-performing Full Stack Engineer with 5+ years of experience designing scalable microservices, high-traffic React applications, and cloud-native backend architectures. Passionate about automated testing, performance tuning, and clean code.',
    skills: ['React', 'Node.js', 'TypeScript', 'Next.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'Tailwind CSS', 'Redis', 'Jest', 'CI/CD'],
    experienceYears: 5,
    companies: [
      {
        role: 'Senior Full Stack Engineer',
        name: 'Nexus Cloud Systems',
        location: 'San Francisco, CA',
        startDate: 'Jan 2022',
        endDate: 'Present',
        current: true,
        highlights: [
          'Architected and deployed a multi-tenant SaaS dashboard serving 120,000+ monthly active users, reducing p99 latency by 42%.',
          'Spearheaded transition from REST to federated GraphQL, cutting frontend network request volume by 35%.',
          'Mentored 4 junior engineers and instituted rigorous automated CI/CD pipeline checks with Jest and GitHub Actions.'
        ]
      },
      {
        role: 'Software Engineer',
        name: 'Vanguard Interactive',
        location: 'San Jose, CA',
        startDate: 'Jun 2019',
        endDate: 'Dec 2021',
        current: false,
        highlights: [
          'Engineered core features for enterprise customer portal using React, Node.js, and MongoDB.',
          'Integrated third-party payment gateways (Stripe, PayPal) processing over $8M in annual recurring revenue.'
        ]
      }
    ],
    projects: [
      {
        title: 'TaskFlow AI — Real-time Kanban & Workspace',
        technologies: ['React', 'TypeScript', 'Node.js', 'Socket.io', 'PostgreSQL'],
        highlights: [
          'Built an enterprise project management tool with collaborative real-time sync across thousands of concurrent websockets.',
          'Open-sourced on GitHub with 1.4k+ stars and integrated OAuth2 login with Google and GitHub.'
        ]
      }
    ],
    education: [
      {
        degree: 'B.S. in Computer Science',
        institution: 'University of California, Berkeley',
        year: '2019',
        details: 'Dean\u2019s Honor List, Cum Laude'
      }
    ],
    certifications: ['AWS Certified Solutions Architect \u2013 Associate', 'Certified Kubernetes Application Developer (CKAD)']
  },
  executive: {
    name: 'Sarah Jenkins',
    title: 'Director of Engineering & Technology',
    email: 'sarah.jenkins@example.com',
    phone: '+1 (555) 789-0123',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/sarah-jenkins-lead',
    github: 'github.com/sjenkins',
    website: 'https://sarahjenkins.tech',
    summary: 'Strategic engineering leader with 10+ years driving engineering excellence, scaling high-velocity teams from 8 to 45+ engineers, and delivering $50M+ enterprise platform modernization programs on time and within budget.',
    skills: ['Engineering Leadership', 'System Architecture', 'Agile/Scrum', 'Cloud Migration', 'Microservices', 'Budget Management', 'Talent Mentorship', 'DevOps Strategy', 'Python', 'Go', 'AWS'],
    experienceYears: 10,
    companies: [
      {
        role: 'Director of Engineering',
        name: 'Apex Global Financial Technologies',
        location: 'New York, NY',
        startDate: 'Mar 2020',
        endDate: 'Present',
        current: true,
        highlights: [
          'Led global engineering organization of 38 developers and engineering managers across 3 timezones.',
          'Championed cloud infrastructure migration to AWS resulting in $1.2M annual operational cost savings.',
          'Achieved 99.99% system availability while modernizing legacy monolith into event-driven microservices.'
        ]
      },
      {
        role: 'Engineering Manager',
        name: 'Stratum Digital',
        location: 'Boston, MA',
        startDate: 'Jan 2016',
        endDate: 'Feb 2020',
        current: false,
        highlights: [
          'Managed 2 cross-functional product squads delivering fintech analytics tools used by Fortune 500 banks.',
          'Decreased engineer onboarding time by 50% through comprehensive documentation and pairing programs.'
        ]
      }
    ],
    projects: [
      {
        title: 'Core Banking API Gateway Platform',
        technologies: ['Go', 'Kafka', 'Docker', 'Kubernetes', 'AWS'],
        highlights: [
          'Designed high-throughput payment transaction router handling 20,000 requests per second with strict zero-loss guarantees.'
        ]
      }
    ],
    education: [
      { degree: 'M.S. in Computer Engineering', institution: 'Columbia University', year: '2015', details: 'Specialization in Distributed Systems' },
      { degree: 'B.S. in Software Engineering', institution: 'Boston University', year: '2013', details: 'Magna Cum Laude' }
    ],
    certifications: ['Project Management Professional (PMP)', 'AWS Certified Security \u2013 Specialty']
  },
  minimal: {
    name: 'David Chen',
    title: 'Software Engineer (Backend & Distributed Systems)',
    email: 'david.chen@example.com',
    phone: '+1 (555) 456-7890',
    location: 'Austin, TX',
    linkedin: 'linkedin.com/in/davidchen-swe',
    github: 'github.com/dchen-code',
    website: '',
    summary: 'Results-driven Backend Engineer specializing in high-throughput data processing, relational databases, and resilient RESTful APIs. Strong foundation in algorithms, concurrent programming, and automated integration testing.',
    skills: ['Python', 'Java', 'SQL', 'PostgreSQL', 'Redis', 'Docker', 'RESTful APIs', 'Git', 'Linux', 'Microservices', 'FastAPI', 'Spring Boot'],
    experienceYears: 4,
    companies: [
      {
        role: 'Backend Software Engineer', name: 'DataPulse Analytics', location: 'Austin, TX',
        startDate: 'Feb 2021', endDate: 'Present', current: true,
        highlights: [
          'Engineered backend telemetry collection services processing 15M daily events using Python and PostgreSQL.',
          'Optimized database queries and indexing strategies, decreasing average API response times from 340ms to 45ms.',
          'Wrote unit and integration test suites achieving 94% test coverage across core microservices.'
        ]
      }
    ],
    projects: [
      { title: 'Distributed Log Indexer & Search', technologies: ['Python', 'FastAPI', 'Elasticsearch', 'Docker'], highlights: ['Implemented an asynchronous log indexing service with automated failover and Elasticsearch clustering.'] }
    ],
    education: [{ degree: 'B.S. in Computer Science', institution: 'University of Texas at Austin', year: '2020', details: 'GPA: 3.85 / 4.0' }],
    certifications: ['Oracle Certified Professional: Java SE Programmer']
  },
  creative: {
    name: 'Elena Rostova',
    title: 'Senior Product Designer & Frontend Developer',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 345-6789',
    location: 'Seattle, WA',
    linkedin: 'linkedin.com/in/elenarostova',
    github: 'github.com/elenarostova',
    website: 'https://elena.design',
    summary: 'Dual-skilled Product Designer and Frontend Engineer with 6+ years creating intuitive digital products. Expert in design systems, accessible UI components, interactive web animation, and cross-functional user research.',
    skills: ['Figma', 'React', 'TypeScript', 'Design Systems', 'Tailwind CSS', 'Next.js', 'UI/UX Design', 'User Testing', 'HTML5/CSS3', 'Wireframing', 'Accessibility (WCAG)'],
    experienceYears: 6,
    companies: [
      {
        role: 'Senior UI/UX & Frontend Engineer', name: 'Lumina Creative Studio', location: 'Seattle, WA',
        startDate: 'Jan 2021', endDate: 'Present', current: true,
        highlights: [
          'Created and maintained unified company Design System utilized across 8 production web applications.',
          'Conducted user interviews and usability tests with 150+ participants, boosting conversion rates by 28%.',
          'Engineered responsive, WCAG 2.1 AA accessible React component library with Storybook.'
        ]
      }
    ],
    projects: [
      { title: 'PaletteCraft \u2014 Accessible Theme Generator', technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Figma API'], highlights: ['Interactive color system tool used by 40,000+ designers and developers worldwide for WCAG contrast compliance.'] }
    ],
    education: [{ degree: 'B.A. in Human-Computer Interaction & Design', institution: 'University of Washington', year: '2018', details: 'Dean\u2019s List All Semesters' }],
    certifications: ['Nielsen Norman Group UX Master Certified', 'Google UX Design Professional Certificate']
  },
  datascience: {
    name: 'Priya Sharma',
    title: 'Machine Learning Engineer & Data Scientist',
    email: 'priya.sharma.ml@example.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India (Open to Remote)',
    linkedin: 'linkedin.com/in/priya-sharma-ml',
    github: 'github.com/priya-ml',
    website: 'https://priyasharma.ai',
    summary: 'Data Scientist and ML Engineer with 4+ years building production machine learning pipelines, predictive analytics models, and NLP systems. Strong statistical foundations and expertise in deploying models at scale using cloud-native MLOps infrastructure.',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'SQL', 'Spark', 'AWS SageMaker', 'MLflow', 'NLP', 'Deep Learning', 'Statistics', 'Docker', 'Jupyter'],
    experienceYears: 4,
    companies: [
      {
        role: 'Machine Learning Engineer', name: 'IntelliData Labs', location: 'Bangalore, India',
        startDate: 'Apr 2022', endDate: 'Present', current: true,
        highlights: [
          'Designed and deployed a real-time fraud detection pipeline processing 2M+ transactions daily with 98.6% precision.',
          'Built end-to-end NLP classification system for customer support tickets reducing manual triage time by 65%.',
          'Established MLOps workflows using MLflow, SageMaker, and Docker for automated model retraining and versioning.'
        ]
      },
      {
        role: 'Data Analyst', name: 'Quantis Analytics', location: 'Hyderabad, India',
        startDate: 'Jul 2020', endDate: 'Mar 2022', current: false,
        highlights: [
          'Developed interactive Tableau and Power BI dashboards tracking KPIs across 12 product verticals.',
          'Performed A/B testing and statistical analysis for marketing campaigns, increasing conversion rates by 18%.'
        ]
      }
    ],
    projects: [
      { title: 'SentimentScope \u2014 Social Media Sentiment Analyzer', technologies: ['Python', 'BERT', 'FastAPI', 'React', 'PostgreSQL'], highlights: ['Real-time sentiment analysis platform processing 50k+ tweets/hour using fine-tuned BERT transformer models.', 'Dashboard visualization with trend detection and alerting for brand monitoring use cases.'] }
    ],
    education: [
      { degree: 'M.Tech in Artificial Intelligence', institution: 'Indian Institute of Technology Hyderabad', year: '2020', details: 'Gold Medalist, CGPA: 9.4 / 10' },
      { degree: 'B.Tech in Computer Science', institution: 'NIT Warangal', year: '2018', details: 'CGPA: 8.8 / 10' }
    ],
    certifications: ['AWS Certified Machine Learning \u2013 Specialty', 'TensorFlow Developer Certificate', 'Google Data Analytics Professional Certificate']
  },
  sales: {
    name: 'Rahul Kapoor',
    title: 'Senior Sales Manager & Business Development Lead',
    email: 'rahul.kapoor@example.com',
    phone: '+91 90000 12345',
    location: 'Mumbai, India',
    linkedin: 'linkedin.com/in/rahulkapoor-sales',
    github: '',
    website: '',
    summary: 'Revenue-driven Sales & Business Development professional with 7+ years consistently exceeding quarterly targets by 20-35%. Expertise in B2B SaaS sales, enterprise account management, strategic partnerships, and high-value deal negotiations across APAC and EMEA regions.',
    skills: ['B2B SaaS Sales', 'Account Management', 'Lead Generation', 'CRM (Salesforce)', 'Pipeline Management', 'Revenue Forecasting', 'Negotiation', 'Strategic Partnerships', 'Market Research', 'Presentation Skills', 'Team Leadership'],
    experienceYears: 7,
    companies: [
      {
        role: 'Senior Sales Manager', name: 'CloudFirst Technologies', location: 'Mumbai, India',
        startDate: 'Feb 2021', endDate: 'Present', current: true,
        highlights: [
          'Achieved 132% of annual revenue target ($4.2M ARR) by closing 28 enterprise accounts in FY2024.',
          'Built and mentored a team of 6 BDRs and Account Executives, reducing average sales cycle from 90 to 52 days.',
          'Developed strategic partnership program with 4 channel partners contributing 30% of pipeline.'
        ]
      },
      {
        role: 'Business Development Executive', name: 'TechReach Solutions', location: 'Pune, India',
        startDate: 'Jun 2017', endDate: 'Jan 2021', current: false,
        highlights: [
          'Generated $2.8M in new business revenue through outbound prospecting and inbound lead qualification.',
          'Managed 50+ enterprise accounts with 95% retention rate and 22% average upsell revenue growth.'
        ]
      }
    ],
    projects: [
      { title: 'Enterprise Sales Playbook & Onboarding Program', technologies: ['Salesforce', 'HubSpot', 'Google Workspace', 'Notion'], highlights: ['Created comprehensive sales methodology documentation and training program adopted company-wide, reducing new hire ramp time by 40%.'] }
    ],
    education: [{ degree: 'MBA in Marketing & Sales', institution: 'Symbiosis Institute of Business Management', year: '2017', details: 'Distinction, Top 5% of Class' }],
    certifications: ['Salesforce Certified Administrator', 'HubSpot Sales Software Certification', 'Google Analytics Certification']
  },
  devops: {
    name: 'Arjun Nair',
    title: 'Senior DevOps & Cloud Infrastructure Engineer',
    email: 'arjun.nair@example.com',
    phone: '+91 88888 77777',
    location: 'Chennai, India (Remote)',
    linkedin: 'linkedin.com/in/arjun-nair-devops',
    github: 'github.com/arjunnair-ops',
    website: '',
    summary: 'Senior DevOps and Cloud Infrastructure Engineer with 6+ years designing highly available, auto-scaling production systems on AWS and GCP. Expert in Infrastructure-as-Code, container orchestration, CI/CD pipeline architecture, and site reliability engineering practices.',
    skills: ['AWS', 'GCP', 'Terraform', 'Kubernetes', 'Docker', 'Jenkins', 'GitHub Actions', 'Ansible', 'Prometheus', 'Grafana', 'Linux', 'Python', 'Bash', 'Helm', 'ArgoCD'],
    experienceYears: 6,
    companies: [
      {
        role: 'Senior DevOps Engineer', name: 'ScaleEdge Infrastructure', location: 'Chennai, India',
        startDate: 'Mar 2021', endDate: 'Present', current: true,
        highlights: [
          'Architected multi-region Kubernetes cluster deployment serving 200+ microservices with 99.99% uptime SLA.',
          'Reduced cloud infrastructure costs by 38% ($420K/year) through right-sizing, spot instances, and automated scaling policies.',
          'Implemented GitOps workflow using ArgoCD and Helm, cutting deployment frequency from weekly to 15+ daily deploys.'
        ]
      },
      {
        role: 'Cloud Engineer', name: 'HostGrid Solutions', location: 'Bangalore, India',
        startDate: 'Aug 2018', endDate: 'Feb 2021', current: false,
        highlights: [
          'Migrated 45 legacy applications from on-premises to AWS using Terraform and CloudFormation.',
          'Built centralized monitoring platform with Prometheus, Grafana, and PagerDuty, reducing MTTR from 45 to 8 minutes.'
        ]
      }
    ],
    projects: [
      { title: 'Zero-Downtime Blue-Green Deployment Pipeline', technologies: ['Kubernetes', 'Terraform', 'ArgoCD', 'AWS ALB', 'GitHub Actions'], highlights: ['Automated blue-green deployment strategy with automated canary analysis and instant rollback capability.'] }
    ],
    education: [{ degree: 'B.Tech in Information Technology', institution: 'Anna University', year: '2018', details: 'CGPA: 8.5 / 10' }],
    certifications: ['AWS Certified DevOps Engineer \u2013 Professional', 'Certified Kubernetes Administrator (CKA)', 'HashiCorp Certified: Terraform Associate']
  },
  healthcare: {
    name: 'Dr. Ananya Reddy',
    title: 'Clinical Pharmacist & Healthcare Professional',
    email: 'ananya.reddy@example.com',
    phone: '+91 99999 88888',
    location: 'Hyderabad, India',
    linkedin: 'linkedin.com/in/dr-ananya-reddy',
    github: '',
    website: '',
    summary: 'Dedicated Clinical Pharmacist with 5+ years of experience in hospital pharmacy operations, patient counseling, drug interaction analysis, and clinical research. Proven expertise in medication safety protocols, formulary management, and regulatory compliance across multi-specialty hospital environments.',
    skills: ['Clinical Pharmacy', 'Drug Information', 'Patient Counseling', 'Pharmacovigilance', 'Hospital Pharmacy', 'Medication Safety', 'Clinical Research', 'Regulatory Compliance', 'GCP/GMP', 'Drug Interaction Analysis', 'EHR Systems', 'Team Leadership'],
    experienceYears: 5,
    companies: [
      {
        role: 'Senior Clinical Pharmacist', name: 'Apollo Hospitals', location: 'Hyderabad, India',
        startDate: 'Jun 2021', endDate: 'Present', current: true,
        highlights: [
          'Managed clinical pharmacy services for 350-bed multi-specialty facility, reviewing 200+ medication orders daily.',
          'Implemented automated drug interaction screening system reducing adverse drug events by 42%.',
          'Led 12-member pharmacy team and conducted weekly continuing education sessions for nursing staff.'
        ]
      },
      {
        role: 'Staff Pharmacist', name: 'Fortis Healthcare', location: 'Chennai, India',
        startDate: 'Jul 2019', endDate: 'May 2021', current: false,
        highlights: [
          'Dispensed and verified 150+ prescriptions daily with 99.8% accuracy rate.',
          'Participated in hospital accreditation (NABH) preparation, achieving full compliance on pharmacy standards.'
        ]
      }
    ],
    projects: [
      { title: 'Antibiotic Stewardship Program', technologies: ['Clinical Database', 'Excel Analytics', 'Hospital EHR'], highlights: ['Designed and implemented hospital-wide antibiotic stewardship protocol reducing broad-spectrum antibiotic usage by 28% over 12 months.'] }
    ],
    education: [
      { degree: 'Pharm.D (Doctor of Pharmacy)', institution: 'Manipal College of Pharmaceutical Sciences', year: '2019', details: 'University Gold Medalist' },
      { degree: 'B.Pharm', institution: 'JNTU Hyderabad', year: '2015', details: 'First Class with Distinction' }
    ],
    certifications: ['Board of Pharmacy Specialties \u2013 BCPS', 'Good Clinical Practice (ICH-GCP)', 'Basic Life Support (BLS)']
  },
  accounting: {
    name: 'Sneha Gupta',
    title: 'Chartered Accountant & Financial Analyst',
    email: 'sneha.gupta.ca@example.com',
    phone: '+91 77777 66666',
    location: 'Delhi, India',
    linkedin: 'linkedin.com/in/sneha-gupta-ca',
    github: '',
    website: '',
    summary: 'Chartered Accountant with 6+ years of expertise in statutory auditing, direct & indirect taxation, financial reporting (Ind AS/IFRS), and corporate advisory. Proven ability to manage complex multi-entity audits, implement robust internal controls, and deliver actionable financial insights to C-suite stakeholders.',
    skills: ['Statutory Audit', 'Tax Planning (Direct & Indirect)', 'GST Compliance', 'Ind AS / IFRS', 'Financial Modelling', 'Tally ERP', 'SAP FICO', 'Advanced Excel', 'Internal Controls', 'Transfer Pricing', 'Company Law', 'Risk Assessment'],
    experienceYears: 6,
    companies: [
      {
        role: 'Senior Audit Associate', name: 'Deloitte India', location: 'Delhi, India',
        startDate: 'Sep 2021', endDate: 'Present', current: true,
        highlights: [
          'Led statutory and tax audit engagements for 8 listed companies with combined revenue exceeding \u20b912,000 Cr.',
          'Identified \u20b945 Cr in potential tax savings through strategic transfer pricing restructuring for a multinational client.',
          'Mentored team of 5 audit associates and drove adoption of Deloitte audit analytics tools, improving efficiency by 30%.'
        ]
      },
      {
        role: 'Audit Associate', name: 'KPMG India', location: 'Mumbai, India',
        startDate: 'Jul 2018', endDate: 'Aug 2021', current: false,
        highlights: [
          'Performed financial statement audits under Ind AS for manufacturing, FMCG, and IT services companies.',
          'Prepared detailed tax computation worksheets and ensured timely filing for 20+ corporate clients.'
        ]
      }
    ],
    projects: [
      { title: 'Automated GST Reconciliation Dashboard', technologies: ['Advanced Excel', 'Power BI', 'Tally ERP APIs'], highlights: ['Built automated GST reconciliation tool reducing manual effort from 5 days to 4 hours per month for multi-state clients.'] }
    ],
    education: [
      { degree: 'Chartered Accountant (CA)', institution: 'Institute of Chartered Accountants of India (ICAI)', year: '2018', details: 'All India Rank 42, Both Groups Cleared in First Attempt' },
      { degree: 'B.Com (Honours)', institution: 'Shri Ram College of Commerce, Delhi University', year: '2015', details: 'Gold Medalist, 92.4%' }
    ],
    certifications: ['Certified Internal Auditor (CIA)', 'GST Practitioner Certificate \u2013 ICAI', 'Advanced Excel & Financial Modelling \u2013 KPMG Learning Academy']
  },
  fresher: {
    name: 'Marcus Vance',
    title: 'Associate Software Engineer / Computer Science Graduate',
    email: 'marcus.vance@example.com',
    phone: '+1 (555) 987-6543',
    location: 'Chicago, IL',
    linkedin: 'linkedin.com/in/marcus-vance',
    github: 'github.com/marcusvance',
    website: 'https://marcusvance.me',
    summary: 'Recent Computer Science graduate with strong command of algorithms, object-oriented programming, and modern full-stack web technologies. Proven track record through successful software engineering internships and competitive hackathons.',
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'HTML/CSS', 'Data Structures', 'REST APIs', 'MongoDB', 'Express.js', 'Docker Basics'],
    experienceYears: 1,
    companies: [
      {
        role: 'Software Engineering Intern', name: 'Horizon Software Labs', location: 'Chicago, IL',
        startDate: 'Jun 2023', endDate: 'Aug 2023', current: false,
        highlights: [
          'Collaborated with senior engineers to implement user authentication modules using JWT and bcrypt.',
          'Assisted in fixing 25+ frontend bug tickets in React codebase, improving customer NPS score by 12 points.',
          'Participated in daily agile standups, code reviews, and sprint retrospectives.'
        ]
      }
    ],
    projects: [
      { title: 'StudyBuddy \u2014 Real-time Collaborative Flashcards', technologies: ['React', 'Node.js', 'MongoDB', 'Socket.io', 'Tailwind CSS'], highlights: ['Developed a web app allowing students to create, share, and review study decks together in real-time.', 'Awarded 1st place in University Annual Hackathon out of 45 participating teams.'] },
      { title: 'Algorithmic Pathfinding Visualizer', technologies: ['JavaScript', 'HTML5 Canvas', 'CSS3'], highlights: ['Interactive visualization tool for Dijkstra, A*, BFS, and DFS graph traversal algorithms with obstacle creation.'] }
    ],
    education: [{ degree: 'B.S. in Computer Science (Major in Software Systems)', institution: 'Illinois Institute of Technology', year: '2024', details: 'GPA: 3.9 / 4.0 \u00b7 Dean\u2019s List' }],
    certifications: ['Meta Front-End Developer Professional Certificate', 'HackerRank Problem Solving (Gold)']
  },
  fresher_it: {
    name: 'Amit Kumar',
    title: 'B.Tech CSE Fresher \u2014 Aspiring Software Developer',
    email: 'amit.kumar.cse@example.com',
    phone: '+91 70000 12345',
    location: 'Pune, India',
    linkedin: 'linkedin.com/in/amit-kumar-cse',
    github: 'github.com/amitkumar-dev',
    website: 'https://amitkumar.dev',
    summary: 'Enthusiastic B.Tech Computer Science graduate from VIT Pune with strong foundations in Java, Python, and web development. Built 5+ full-stack projects during college with a focus on practical, deployable applications. Eager to contribute to a dynamic engineering team and grow as a software developer.',
    skills: ['Java', 'Python', 'JavaScript', 'React', 'Node.js', 'MySQL', 'MongoDB', 'HTML/CSS', 'Git', 'Data Structures & Algorithms', 'REST APIs', 'C/C++', 'Spring Boot Basics', 'Linux'],
    experienceYears: 0,
    companies: [
      {
        role: 'Web Development Intern', name: 'TechSpark Solutions', location: 'Pune, India',
        startDate: 'Jan 2024', endDate: 'Apr 2024', current: false,
        highlights: [
          'Built and deployed a React-based employee management dashboard with REST API integration.',
          'Wrote reusable React components and implemented responsive designs for 3 client projects.',
          'Collaborated with senior developers using Git/GitHub for version control and code reviews.'
        ]
      },
      {
        role: 'Campus Ambassador & Tech Lead', name: 'Google Developer Student Club \u2013 VIT Pune', location: 'Pune, India',
        startDate: 'Aug 2022', endDate: 'May 2024', current: false,
        highlights: [
          'Organized 8 technical workshops on Web Development, DSA, and Cloud Computing attended by 500+ students.',
          'Led a team of 12 student developers building open-source campus utility applications.'
        ]
      }
    ],
    projects: [
      { title: 'EduTrack \u2014 Online Learning Management System', technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Tailwind CSS'], highlights: ['Full-stack LMS platform with course enrollment, video streaming, quiz modules, and admin analytics dashboard.', 'Deployed on Vercel + Railway with CI/CD pipeline using GitHub Actions.'] },
      { title: 'ChatVerse \u2014 Real-time Chat Application', technologies: ['React', 'Socket.io', 'Node.js', 'MongoDB'], highlights: ['Real-time messaging app with group chat, typing indicators, file sharing, and online status tracking.'] },
      { title: 'COVID-19 Live Tracker', technologies: ['JavaScript', 'Chart.js', 'REST API', 'HTML/CSS'], highlights: ['Interactive dashboard visualizing real-time COVID statistics using public APIs with country-wise comparison charts.'] }
    ],
    education: [
      { degree: 'B.Tech in Computer Science & Engineering', institution: 'VIT Pune (Vishwakarma Institute of Technology)', year: '2024', details: 'CGPA: 8.7 / 10 \u00b7 Department Rank 5 \u00b7 Dean\u2019s List' },
      { degree: 'HSC (12th \u2013 Science)', institution: 'DY Patil International School, Pune', year: '2020', details: '94.2% \u00b7 State Merit' }
    ],
    certifications: ['NPTEL \u2013 Data Structures & Algorithms (Elite + Gold)', 'Udemy \u2013 Complete Web Development Bootcamp', 'HackerRank \u2013 Java (5 Stars)', 'AWS Cloud Practitioner Essentials']
  },
  fresher_nonit: {
    name: 'Neha Patel',
    title: 'MBA Graduate \u2014 Marketing & Brand Management',
    email: 'neha.patel.mba@example.com',
    phone: '+91 80000 55555',
    location: 'Ahmedabad, India',
    linkedin: 'linkedin.com/in/neha-patel-mba',
    github: '',
    website: '',
    summary: 'MBA graduate specializing in Marketing & Brand Management with hands-on experience in digital marketing campaigns, consumer research, and brand strategy from internships at leading FMCG and e-commerce companies. Strong analytical mindset with proven ability to translate market insights into actionable growth strategies.',
    skills: ['Digital Marketing', 'Brand Strategy', 'Market Research', 'Google Analytics', 'SEO/SEM', 'Social Media Marketing', 'Content Strategy', 'MS Excel & PowerPoint', 'Consumer Behavior', 'Campaign Management', 'Canva', 'CRM Tools'],
    experienceYears: 0,
    companies: [
      {
        role: 'Marketing Intern', name: 'Hindustan Unilever Limited (HUL)', location: 'Mumbai, India',
        startDate: 'May 2024', endDate: 'Jul 2024', current: false,
        highlights: [
          'Assisted in planning and executing digital marketing campaigns for Dove brand reaching 5M+ impressions.',
          'Conducted competitive analysis across 8 FMCG brands and presented strategic recommendations to brand team.',
          'Created weekly social media content calendars and tracked engagement metrics across Instagram, Facebook, and YouTube.'
        ]
      },
      {
        role: 'Brand Management Intern', name: 'Flipkart', location: 'Bangalore, India',
        startDate: 'Dec 2023', endDate: 'Feb 2024', current: false,
        highlights: [
          'Analyzed customer purchase data for fashion category, identifying 3 high-growth product segments.',
          'Co-developed \u20b915 Lakh promotional campaign strategy for Big Billion Days achieving 22% higher click-through rate vs. prior year.'
        ]
      }
    ],
    projects: [
      { title: 'Brand Positioning Study \u2014 Indian Premium Coffee Market', technologies: ['SPSS', 'Google Forms', 'MS Excel', 'PowerPoint'], highlights: ['Conducted primary research with 350+ respondents analyzing brand perception, price sensitivity, and purchase intent.', 'Presented findings and go-to-market strategy to panel of industry professionals, receiving Best Project Award.'] },
      { title: 'Social Media Growth Strategy for College E-Cell', technologies: ['Canva', 'Buffer', 'Instagram Insights', 'Google Analytics'], highlights: ['Grew Instagram following from 800 to 4,200 in 4 months through targeted content, reels, and collaboration campaigns.'] }
    ],
    education: [
      { degree: 'MBA in Marketing & Brand Management', institution: 'Indian Institute of Management Ahmedabad (IIMA)', year: '2024', details: 'CGPA: 3.6 / 4.0 \u00b7 Marketing Club President' },
      { degree: 'BBA (Bachelor of Business Administration)', institution: 'Narsee Monjee Institute of Management Studies (NMIMS)', year: '2022', details: 'CGPA: 8.2 / 10 \u00b7 Cultural Committee Head' }
    ],
    certifications: ['Google Digital Marketing & E-commerce Professional Certificate', 'HubSpot Content Marketing Certification', 'Meta Social Media Marketing Professional Certificate']
  }
};

const SUGGESTED_SKILLS = [
  'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'AWS', 'Docker',
  'PostgreSQL', 'MongoDB', 'Next.js', 'GraphQL', 'Tailwind CSS', 'Git',
  'REST APIs', 'CI/CD', 'Kubernetes', 'Java', 'SQL', 'Redis', 'Agile/Scrum',
  'Machine Learning', 'Data Analysis', 'Excel', 'Power BI', 'Figma',
  'Salesforce', 'Communication', 'Leadership', 'Marketing', 'Accounting'
];

export default function TemplateResumeModal({ onClose, onCreated, currentUser }) {
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [activeTab, setActiveTab] = useState('basics'); // 'basics' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications'
  const [previewTab, setPreviewTab] = useState('preview'); // 'preview' | 'tips'
  const [templateFilter, setTemplateFilter] = useState('all'); // 'all' | 'tech' | 'business' | 'fresher'

  // Form state initialized with the selected template's preset
  const [form, setForm] = useState(() => {
    const base = PRESETS.modern;
    return {
      ...base,
      name: currentUser?.name || base.name,
      email: currentUser?.email || base.email,
      resumeName: `${(currentUser?.name || base.name).replace(/\s+/g, '_')}_Resume`,
      format: 'pdf', // 'pdf' | 'docx'
      isPrimary: false,
    };
  });

  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  // Handle template switch
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    const preset = PRESETS[templateId] || PRESETS.modern;
    setForm(prev => ({
      ...prev,
      ...preset,
      name: prev.name || currentUser?.name || preset.name,
      email: prev.email || currentUser?.email || preset.email,
      resumeName: `${(prev.name || currentUser?.name || preset.name).replace(/\s+/g, '_')}_${templateId}`,
    }));
    toast.success(`Loaded "${TEMPLATES.find(t => t.id === templateId)?.name}" template layout & sample content!`);
  };

  // Form helpers
  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = (skillToAdd) => {
    const s = (skillToAdd || skillInput).trim();
    if (!s) return;
    if (form.skills.includes(s)) {
      toast.error('Skill already added');
      return;
    }
    setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  // Experience handlers
  const handleAddExperience = () => {
    setForm(prev => ({
      ...prev,
      companies: [
        ...prev.companies,
        {
          role: '',
          name: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          highlights: ['']
        }
      ]
    }));
  };

  const handleUpdateExperience = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.companies];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, companies: updated };
    });
  };

  const handleRemoveExperience = (index) => {
    setForm(prev => ({
      ...prev,
      companies: prev.companies.filter((_, i) => i !== index)
    }));
  };

  const handleAddHighlight = (expIndex) => {
    setForm(prev => {
      const updated = [...prev.companies];
      const highlights = [...(updated[expIndex].highlights || []), ''];
      updated[expIndex] = { ...updated[expIndex], highlights };
      return { ...prev, companies: updated };
    });
  };

  const handleUpdateHighlight = (expIndex, hIndex, text) => {
    setForm(prev => {
      const updated = [...prev.companies];
      const highlights = [...(updated[expIndex].highlights || [])];
      highlights[hIndex] = text;
      updated[expIndex] = { ...updated[expIndex], highlights };
      return { ...prev, companies: updated };
    });
  };

  const handleRemoveHighlight = (expIndex, hIndex) => {
    setForm(prev => {
      const updated = [...prev.companies];
      const highlights = updated[expIndex].highlights.filter((_, i) => i !== hIndex);
      updated[expIndex] = { ...updated[expIndex], highlights };
      return { ...prev, companies: updated };
    });
  };

  // Education handlers
  const handleAddEducation = () => {
    setForm(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', institution: '', year: '', details: '' }
      ]
    }));
  };

  const handleUpdateEducation = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const handleRemoveEducation = (index) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Project handlers
  const handleAddProject = () => {
    setForm(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        { title: '', technologies: [], highlights: [''] }
      ]
    }));
  };

  const handleUpdateProject = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
  };

  const handleRemoveProject = (index) => {
    setForm(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  // Certifications
  const handleAddCert = () => {
    setForm(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const handleUpdateCert = (index, val) => {
    setForm(prev => {
      const updated = [...prev.certifications];
      updated[index] = val;
      return { ...prev, certifications: updated };
    });
  };

  const handleRemoveCert = (index) => {
    setForm(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  // Autofill with logged in user
  const handleAutofillUser = () => {
    if (!currentUser) return;
    setForm(prev => ({
      ...prev,
      name: currentUser.name || prev.name,
      email: currentUser.email || prev.email,
      resumeName: `${(currentUser.name || 'My').replace(/\s+/g, '_')}_Resume`,
    }));
    toast.success('Populated name and email from your account profile!');
  };

  // Real-time ATS Score calculation
  const computedScore = useMemo(() => {
    let s = 0;
    if (form.name) s += 5;
    if (form.email) s += 5;
    if (form.phone) s += 5;
    if (form.location) s += 5;

    const skillsCount = (form.skills || []).length;
    s += Math.min(20, Math.round((skillsCount / 12) * 20));

    const expYears = Number(form.experienceYears) || 0;
    s += Math.min(20, Math.round((expYears / 7) * 20));

    if ((form.education || []).length > 0) s += 10;
    if ((form.summary || '').length > 60) s += 10;
    else if ((form.summary || '').length > 10) s += 5;

    if ((form.certifications || []).filter(Boolean).length > 0) s += 10;
    if ((form.projects || []).length > 0) s += 10;

    return Math.min(100, s);
  }, [form]);

  const scoreMeta = useMemo(() => {
    if (computedScore >= 80) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    if (computedScore >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    if (computedScore >= 40) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    return { label: 'Needs Improvement', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
  }, [computedScore]);

  // Current active template object
  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  // Submit Handler
  const handleSaveResume = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter candidate full name');
      setActiveTab('basics');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Please enter email address');
      setActiveTab('basics');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        resumeName: (form.resumeName || `${form.name}_Resume`).trim(),
        templateId: selectedTemplate,
        format: form.format || 'pdf',
        name: form.name.trim(),
        title: (form.title || '').trim(),
        email: form.email.trim(),
        phone: (form.phone || '').trim(),
        location: (form.location || '').trim(),
        linkedin: (form.linkedin || '').trim(),
        github: (form.github || '').trim(),
        website: (form.website || '').trim(),
        summary: (form.summary || '').trim(),
        skills: form.skills,
        experienceYears: Number(form.experienceYears) || 0,
        companies: form.companies.filter(c => c.role || c.name),
        education: form.education.filter(e => e.degree || e.institution),
        projects: form.projects.filter(p => p.title),
        certifications: form.certifications.filter(Boolean),
        isPrimary: Boolean(form.isPrimary),
      };

      const res = await resumeService.createFromTemplate(payload);
      toast.success(res.message || 'Resume created successfully from template!');
      if (onCreated) {
        onCreated(res.resume, form.isPrimary);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create resume from template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="relative flex flex-col w-full max-w-7xl h-[94vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">Create Resume with Templates</h2>
                <span className="rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                  ATS Optimized Builder
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose a professional template, customize your background, and generate ready-to-apply PDF &amp; Word resumes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live ATS Quality Pill */}
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${scoreMeta.bg}`}>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase text-slate-500 leading-none">ATS Score</p>
                <p className={`text-sm font-black ${scoreMeta.color} leading-tight`}>{computedScore}/100</p>
              </div>
              <span className={`text-xs font-bold ${scoreMeta.color} hidden sm:inline`}>{scoreMeta.label}</span>
            </div>

            <button
              onClick={handleAutofillUser}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Populate name & email from your account profile"
            >
              <User className="h-3.5 w-3.5 text-blue-400" />
              Autofill Profile
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Template Selector Ribbon */}
        <div className="border-b border-slate-800/80 bg-slate-900/90 px-6 py-2 overflow-x-auto scrollbar-none">
          {/* Category Filter Row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">Filter:</span>
            {[
              { id: 'all', label: `All (${TEMPLATES.length})` },
              { id: 'tech', label: 'Tech & Dev' },
              { id: 'business', label: 'Business & Non-IT' },
              { id: 'fresher', label: '🎓 Freshers' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setTemplateFilter(cat.id)}
                className={`rounded-full px-3 py-0.5 text-[10px] font-bold transition-all ${
                  templateFilter === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* Template Buttons Row */}
          <div className="flex items-center gap-2.5 min-w-max">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
              <Palette className="h-3.5 w-3.5 text-blue-400" /> Templates:
            </span>
            {TEMPLATES
              .filter(tpl => {
                if (templateFilter === 'all') return true;
                if (templateFilter === 'tech') return ['modern', 'minimal', 'creative', 'datascience', 'devops'].includes(tpl.id);
                if (templateFilter === 'business') return ['executive', 'sales', 'healthcare', 'accounting'].includes(tpl.id);
                if (templateFilter === 'fresher') return ['fresher', 'fresher_it', 'fresher_nonit'].includes(tpl.id);
                return true;
              })
              .map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full ring-1 ring-white/30"
                    style={{ backgroundColor: tpl.accentColor }}
                  />
                  <span>{tpl.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    {tpl.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Split Layout: Editor Form (Left) & Real-time Live Preview (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-900">
          {/* Left Column: Form Editor */}
          <div className="w-full lg:w-[52%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-900/60">
            {/* Form Section Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/40 px-4 py-2 overflow-x-auto scrollbar-none text-xs">
              {[
                { id: 'basics', label: '1. Basics & Contact', icon: User },
                { id: 'summary', label: '2. Summary', icon: FileText },
                { id: 'skills', label: '3. Skills', icon: Sparkles },
                { id: 'experience', label: '4. Experience', icon: Briefcase },
                { id: 'projects', label: '5. Projects', icon: FolderGit2 },
                { id: 'education', label: '6. Education', icon: GraduationCap },
                { id: 'certifications', label: '7. Certifications', icon: Award },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600/90 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Content Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* TAB 1: BASICS & CONTACT */}
              {activeTab === 'basics' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5 text-xs text-blue-200 flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-100">Personal &amp; Contact Information</p>
                      <p className="text-slate-400 mt-0.5">Contact coordinates are automatically scored for ATS readiness and displayed prominently on your chosen template.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Candidate Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={e => updateField('name', e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Professional Title / Target Role
                      </label>
                      <input
                        value={form.title}
                        onChange={e => updateField('title', e.target.value)}
                        placeholder="e.g. Senior Full Stack Engineer"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => updateField('email', e.target.value)}
                        placeholder="e.g. alex@example.com"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        value={form.phone}
                        onChange={e => updateField('phone', e.target.value)}
                        placeholder="e.g. +1 (555) 234-5678"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Location / City, State
                      </label>
                      <input
                        value={form.location}
                        onChange={e => updateField('location', e.target.value)}
                        placeholder="e.g. San Francisco, CA (or Remote)"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Total Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={form.experienceYears}
                        onChange={e => updateField('experienceYears', e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Online Profiles */}
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Online Links &amp; Profiles</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">LinkedIn Profile</label>
                        <input
                          value={form.linkedin}
                          onChange={e => updateField('linkedin', e.target.value)}
                          placeholder="linkedin.com/in/username"
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">GitHub / Code URL</label>
                        <input
                          value={form.github}
                          onChange={e => updateField('github', e.target.value)}
                          placeholder="github.com/username"
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Portfolio / Website</label>
                        <input
                          value={form.website}
                          onChange={e => updateField('website', e.target.value)}
                          placeholder="https://myportfolio.io"
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Professional Summary</p>
                      <p className="text-xs text-slate-400">A concise, powerful overview of your expertise and primary career value proposition.</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {form.summary.length} characters (Recommended: 120 - 450)
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    value={form.summary}
                    onChange={e => updateField('summary', e.target.value)}
                    placeholder="Results-driven Software Engineer with 5+ years of experience building scalable applications, architecting distributed systems, and leading technical initiatives..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 p-4 text-sm text-white placeholder-slate-500 leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {/* Quick suggestion prompt pills */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Professional Summary Tips:
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                      <li>Highlight your primary job title, total years in the field, and key domain.</li>
                      <li>Mention 2-3 top core strengths (e.g. Distributed Systems, React &amp; Next.js, Cloud Migration).</li>
                      <li>Include an impactful achievement metric (e.g. "improved latency by 40%", "scaled to 100k users").</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 3: SKILLS */}
              {activeTab === 'skills' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Core Technical &amp; Professional Skills</p>
                      <span className="text-xs text-blue-400 font-bold">{form.skills.length} skills added</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Skills are heavily weighted by the ATS scoring engine and job matching algorithms.
                    </p>
                  </div>

                  {/* Add skill input */}
                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      placeholder="Type a skill and press Enter or Add (e.g. React, Docker, Kubernetes)..."
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleAddSkill()}
                      className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Add Skill
                    </button>
                  </div>

                  {/* Current skills tags */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-2">Current Skills List:</p>
                    {form.skills.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No skills added yet. Click suggested skills below or type your own.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {form.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900/40 border border-blue-500/40 px-2.5 py-1 text-xs font-semibold text-blue-200 shadow-xs"
                          >
                            <span>{skill}</span>
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-blue-400 hover:text-rose-300"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick-add popular skills */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <p className="text-xs font-bold text-slate-400 mb-2.5">Quick Add Suggested Tech Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_SKILLS.map((s) => {
                        const alreadyAdded = form.skills.includes(s);
                        return (
                          <button
                            key={s}
                            disabled={alreadyAdded}
                            onClick={() => handleAddSkill(s)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                              alreadyAdded
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-white'
                            }`}
                          >
                            + {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: EXPERIENCE */}
              {activeTab === 'experience' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Work Experience</p>
                      <p className="text-xs text-slate-400">Detail previous roles with quantified bullet points and impact statements.</p>
                    </div>
                    <button
                      onClick={handleAddExperience}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Add Experience
                    </button>
                  </div>

                  {form.companies.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                      <Briefcase className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-semibold">No work experience listed</p>
                      <p className="text-xs text-slate-500 mt-1 mb-3">Add full-time, part-time, or contract engineering roles.</p>
                      <button
                        onClick={handleAddExperience}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                      >
                        + Add First Role
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.companies.map((exp, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                              Role #{idx + 1}
                            </span>
                            <button
                              onClick={() => handleRemoveExperience(idx)}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                              title="Delete this role"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Job Title / Role</label>
                              <input
                                value={exp.role}
                                onChange={e => handleUpdateExperience(idx, 'role', e.target.value)}
                                placeholder="e.g. Senior Software Engineer"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Company / Organization</label>
                              <input
                                value={exp.name || exp.company || ''}
                                onChange={e => handleUpdateExperience(idx, 'name', e.target.value)}
                                placeholder="e.g. Nexus Cloud Systems"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Date</label>
                              <input
                                value={exp.startDate}
                                onChange={e => handleUpdateExperience(idx, 'startDate', e.target.value)}
                                placeholder="e.g. Jan 2022"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[11px] font-semibold text-slate-400">End Date</label>
                                <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(exp.current)}
                                    onChange={e => handleUpdateExperience(idx, 'current', e.target.checked)}
                                    className="rounded border-slate-700 text-blue-600 focus:ring-0"
                                  />
                                  <span>Current</span>
                                </label>
                              </div>
                              <input
                                disabled={Boolean(exp.current)}
                                value={exp.current ? 'Present' : exp.endDate}
                                onChange={e => handleUpdateExperience(idx, 'endDate', e.target.value)}
                                placeholder="e.g. Present or Dec 2023"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {/* Highlights bullet points */}
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-semibold text-slate-400">Accomplishment Bullets</label>
                              <button
                                onClick={() => handleAddHighlight(idx)}
                                className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                              >
                                + Add Bullet
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {(exp.highlights || []).map((h, hIdx) => (
                                <div key={hIdx} className="flex items-center gap-2">
                                  <span className="text-slate-600 text-xs">•</span>
                                  <input
                                    value={h}
                                    onChange={e => handleUpdateHighlight(idx, hIdx, e.target.value)}
                                    placeholder="e.g. Architected microservices pipeline reducing latency by 35%..."
                                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                  />
                                  {(exp.highlights || []).length > 1 && (
                                    <button
                                      onClick={() => handleRemoveHighlight(idx, hIdx)}
                                      className="text-slate-500 hover:text-rose-400 p-1"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Featured Projects &amp; Portfolio</p>
                      <p className="text-xs text-slate-400">Showcase technical builds, open source projects, or product launches.</p>
                    </div>
                    <button
                      onClick={handleAddProject}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Add Project
                    </button>
                  </div>

                  {form.projects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                      <FolderGit2 className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-semibold">No projects listed</p>
                      <p className="text-xs text-slate-500 mt-1 mb-3">Add open source work, client builds, or flagship applications.</p>
                      <button
                        onClick={handleAddProject}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                      >
                        + Add Project
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.projects.map((proj, pIdx) => (
                        <div key={pIdx} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                              Project #{pIdx + 1}
                            </span>
                            <button
                              onClick={() => handleRemoveProject(pIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Project Title</label>
                              <input
                                value={proj.title}
                                onChange={e => handleUpdateProject(pIdx, 'title', e.target.value)}
                                placeholder="e.g. TaskFlow AI — Real-time Kanban"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Technologies Used (comma separated)</label>
                              <input
                                value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')}
                                onChange={e => handleUpdateProject(pIdx, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="e.g. React, Node.js, Socket.io, PostgreSQL"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Project Highlight / Details</label>
                            <input
                              value={(proj.highlights || [])[0] || ''}
                              onChange={e => handleUpdateProject(pIdx, 'highlights', [e.target.value])}
                              placeholder="e.g. Built an enterprise project management tool with collaborative real-time sync across 1,000s of websockets."
                              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: EDUCATION */}
              {activeTab === 'education' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Education &amp; Academic Degrees</p>
                      <p className="text-xs text-slate-400">List university degrees, diplomas, or academic credentials.</p>
                    </div>
                    <button
                      onClick={handleAddEducation}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Add Education
                    </button>
                  </div>

                  {form.education.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                      <GraduationCap className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-semibold">No education entries listed</p>
                      <p className="text-xs text-slate-500 mt-1 mb-3">Add degree, university, and graduation year.</p>
                      <button
                        onClick={handleAddEducation}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                      >
                        + Add Education
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.education.map((edu, eIdx) => (
                        <div key={eIdx} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                              Degree #{eIdx + 1}
                            </span>
                            <button
                              onClick={() => handleRemoveEducation(eIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Degree &amp; Major</label>
                              <input
                                value={edu.degree}
                                onChange={e => handleUpdateEducation(eIdx, 'degree', e.target.value)}
                                placeholder="e.g. B.S. in Computer Science"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Graduation Year</label>
                              <input
                                value={edu.year}
                                onChange={e => handleUpdateEducation(eIdx, 'year', e.target.value)}
                                placeholder="e.g. 2021"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Institution / University</label>
                              <input
                                value={edu.institution}
                                onChange={e => handleUpdateEducation(eIdx, 'institution', e.target.value)}
                                placeholder="e.g. UC Berkeley"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Honors / GPA / Notes</label>
                              <input
                                value={edu.details}
                                onChange={e => handleUpdateEducation(eIdx, 'details', e.target.value)}
                                placeholder="e.g. Magna Cum Laude"
                                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: CERTIFICATIONS */}
              {activeTab === 'certifications' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Certifications &amp; Credentials</p>
                      <p className="text-xs text-slate-400">Industry-recognized certificates, cloud licenses, or specialized credentials.</p>
                    </div>
                    <button
                      onClick={handleAddCert}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Add Certificate
                    </button>
                  </div>

                  {form.certifications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                      <Award className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-semibold">No certifications listed</p>
                      <p className="text-xs text-slate-500 mt-1 mb-3">Add AWS, Google Cloud, Azure, or professional licenses.</p>
                      <button
                        onClick={handleAddCert}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                      >
                        + Add Certificate
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.certifications.map((cert, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-400 shrink-0" />
                          <input
                            value={cert}
                            onChange={e => handleUpdateCert(cIdx, e.target.value)}
                            placeholder="e.g. AWS Certified Solutions Architect – Associate"
                            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleRemoveCert(cIdx)}
                            className="text-slate-500 hover:text-rose-400 p-1.5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step Navigation Bar */}
            <div className="border-t border-slate-800 bg-slate-950/60 px-5 py-3 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                Editing: <span className="text-white font-bold">{currentTemplate.name}</span>
              </span>
              <div className="flex items-center gap-2">
                {activeTab !== 'basics' && (
                  <button
                    onClick={() => {
                      const tabs = ['basics', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'];
                      const currentIdx = tabs.indexOf(activeTab);
                      if (currentIdx > 0) setActiveTab(tabs[currentIdx - 1]);
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Previous Section
                  </button>
                )}
                {activeTab !== 'certifications' && (
                  <button
                    onClick={() => {
                      const tabs = ['basics', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'];
                      const currentIdx = tabs.indexOf(activeTab);
                      if (currentIdx < tabs.length - 1) setActiveTab(tabs[currentIdx + 1]);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-3.5 py-1.5 font-bold text-white hover:bg-slate-700"
                  >
                    Next Section <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Live Document Preview */}
          <div className="w-full lg:w-[48%] flex flex-col bg-slate-950/90 overflow-hidden">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-2.5 bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full animate-pulse bg-emerald-500" />
                <span className="text-xs font-bold text-slate-300">Live Document Preview</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${currentTemplate.lightClass}`}>
                  {currentTemplate.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>A4 Ready</span>
                <span>•</span>
                <span>Auto-Formatted</span>
              </div>
            </div>

            {/* Document Canvas Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-900/40">
              {/* Paper Document Container */}
              <div
                className="w-full max-w-[620px] bg-white text-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 space-y-4 border border-slate-300 min-h-[780px] font-sans transition-all text-xs leading-relaxed"
                style={{
                  borderTop: `6px solid ${currentTemplate.accentColor}`,
                }}
              >
                {/* Header */}
                <div className="border-b pb-3" style={{ borderColor: `${currentTemplate.accentColor}30` }}>
                  <h1
                    className="text-2xl font-black tracking-tight"
                    style={{ color: currentTemplate.accentColor }}
                  >
                    {form.name || 'Candidate Name'}
                  </h1>

                  {form.title && (
                    <p className="text-xs font-bold text-slate-600 mt-0.5 tracking-wide uppercase">
                      {form.title}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-2 font-medium">
                    {form.email && <span>{form.email}</span>}
                    {form.phone && <span>• {form.phone}</span>}
                    {form.location && <span>• {form.location}</span>}
                    {form.linkedin && <span>• {form.linkedin}</span>}
                    {form.github && <span>• {form.github}</span>}
                    {form.website && <span>• {form.website}</span>}
                  </div>
                </div>

                {/* Professional Summary */}
                {form.summary && (
                  <div>
                    <h3
                      className="text-[11px] font-extrabold uppercase tracking-wider mb-1"
                      style={{ color: currentTemplate.accentColor }}
                    >
                      Professional Summary
                    </h3>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-normal">
                      {form.summary}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {form.skills && form.skills.length > 0 && (
                  <div>
                    <h3
                      className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5"
                      style={{ color: currentTemplate.accentColor }}
                    >
                      Technical &amp; Core Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {form.skills.map((s, i) => (
                        <span
                          key={i}
                          className="rounded px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {form.companies && form.companies.length > 0 && (
                  <div>
                    <h3
                      className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
                      style={{ color: currentTemplate.accentColor }}
                    >
                      Work Experience
                    </h3>
                    <div className="space-y-3">
                      {form.companies.map((c, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-slate-900 text-[11px]">
                              {c.role || 'Role'} <span className="font-semibold text-slate-600">— {c.name || c.company || 'Company'}</span>
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                              {[c.startDate, c.endDate || (c.current ? 'Present' : '')].filter(Boolean).join(' – ')}
                            </span>
                          </div>
                          {c.location && <p className="text-[10px] text-slate-400 italic">{c.location}</p>}
                          {c.highlights && c.highlights.length > 0 && (
                            <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-700 mt-1">
                              {c.highlights.map((h, hi) => (
                                h ? <li key={hi}>{h}</li> : null
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {form.projects && form.projects.length > 0 && (
                  <div>
                    <h3
                      className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5"
                      style={{ color: currentTemplate.accentColor }}
                    >
                      Projects &amp; Portfolio
                    </h3>
                    <div className="space-y-2.5">
                      {form.projects.map((p, i) => (
                        <div key={i}>
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-slate-900 text-[11px]">{p.title || 'Project'}</span>
                            {p.technologies && p.technologies.length > 0 && (
                              <span className="text-[10px] text-slate-500 italic">
                                {Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies}
                              </span>
                            )}
                          </div>
                          {p.highlights && (
                            <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-700 mt-0.5">
                              {p.highlights.map((h, hi) => (
                                h ? <li key={hi}>{h}</li> : null
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {form.education && form.education.length > 0 && (
                  <div>
                    <h3
                      className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5"
                      style={{ color: currentTemplate.accentColor }}
                    >
                      Education
                    </h3>
                    <div className="space-y-1.5">
                      {form.education.map((e, i) => (
                        <div key={i} className="flex items-baseline justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-slate-900">{e.degree || 'Degree'}</span>
                            {e.institution && <span className="text-slate-600"> — {e.institution}</span>}
                            {e.details && <span className="text-slate-500 text-[10px]"> ({e.details})</span>}
                          </div>
                          {e.year && <span className="text-[10px] text-slate-500">{e.year}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {form.certifications && form.certifications.filter(Boolean).length > 0 && (
                  <div>
                    <h3
                      className="text-[11px] font-extrabold uppercase tracking-wider mb-1"
                      style={{ color: currentTemplate.accentColor }}
                    >
                      Certifications
                    </h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-slate-700">
                      {form.certifications.filter(Boolean).map((cert, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-slate-400">•</span> {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save & Format Bar */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Format & Name controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-400">Save As:</label>
              <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => updateField('format', 'pdf')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    form.format === 'pdf'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileType className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => updateField('format', 'docx')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    form.format === 'docx'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Word (.docx)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-400">Name:</label>
              <input
                value={form.resumeName}
                onChange={e => updateField('resumeName', e.target.value)}
                placeholder="Resume_Name"
                className="w-48 sm:w-60 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={e => updateField('isPrimary', e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-400" /> Set as Primary Resume
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveResume}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-black text-white hover:opacity-95 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating &amp; Saving Resume…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create Resume ({form.format.toUpperCase()})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
