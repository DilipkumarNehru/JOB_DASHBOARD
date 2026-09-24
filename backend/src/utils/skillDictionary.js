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
    'Elasticsearch', 'Mongoose', 'Prisma', 'TypeORM', 'Sequelize'
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
    'System Design', 'Event-Driven Architecture', 'Clean Architecture', 'TDD'
  ]
};

export const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

export const normalizeSkill = (skillName) => {
  if (!skillName) return '';
  const cleaned = skillName.trim().toLowerCase();
  for (const s of ALL_SKILLS) {
    if (s.toLowerCase() === cleaned) return s;
    if (s.toLowerCase().replace(/[s.-_]/g, '') === cleaned.replace(/[s.-_]/g, '')) return s;
  }
  return skillName.trim();
};
