import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../models/User.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import Application from '../models/Application.js';
import FollowUp from '../models/FollowUp.js';
import Interview from '../models/Interview.js';
import Email from '../models/Email.js';
import Notification from '../models/Notification.js';
import JobMatch from '../models/JobMatch.js';
import { generateJobHash } from '../utils/duplicateDetector.js';

const SKILLS = [
  'Node.js', 'Express.js', 'MongoDB', 'Redis', 'JavaScript', 'TypeScript',
  'REST API', 'JWT', 'Docker', 'Git', 'NestJS', 'MySQL', 'Kafka', 'React.js',
  'PostgreSQL', 'AWS', 'GraphQL', 'CI/CD', 'Microservices'
];

const SAMPLE_PROFILE = {
  name: 'Demo Candidate',
  email: 'demo@jobdashboard.local',
  phone: '+91 98765 43210',
  summary: 'Backend developer with 3+ years experience building scalable Node.js services, REST APIs and event-driven microservices.',
  skills: SKILLS.slice(0, 12),
  experienceYears: 3,
  companies: [
    { name: 'TechNova Solutions', role: 'Backend Developer', location: 'Bengaluru', startDate: 'Jan 2023', endDate: 'Present', highlights: ['Built 10+ REST APIs serving 1M+ requests/day', 'Introduced redis caching reducing p95 latency by 40%'] },
    { name: 'CloudSeed Systems', role: 'Software Engineer', location: 'Pune', startDate: 'Jun 2021', endDate: 'Dec 2022', highlights: ['Developed microservices with NestJS and MongoDB', 'Set up CI/CD pipelines with GitHub Actions'] }
  ],
  jobTitles: ['Backend Developer', 'Software Engineer', 'Node.js Developer'],
  education: [{ degree: 'B.Tech in Computer Science', institution: 'VTU', year: '2021' }],
  certifications: ['AWS Cloud Practitioner', 'MongoDB Associate Developer'],
  projects: [
    { title: 'Order Management System', description: 'Event-driven order pipeline using Kafka and Redis', technologies: ['Node.js', 'Kafka', 'Redis'], highlights: ['Designed event-driven architecture processing 50k orders/day'] }
  ],
  location: 'Bengaluru, India',
  preferredRoles: ['Backend Developer', 'Node.js Developer', 'Software Developer'],
  preferredLocations: ['Bangalore', 'Remote']
};

const COMPANIES = [
  { name: 'Wipro', website: 'https://www.wipro.com', careerPageUrl: 'https://careers.wipro.com', preferredRoles: ['Node.js Developer', 'Backend Developer', 'Software Developer'], location: 'Bengaluru / Remote' },
  { name: 'Infosys', website: 'https://www.infosys.com', careerPageUrl: 'https://careers.infosys.com', preferredRoles: ['Backend Developer', 'Full Stack Developer'], location: 'Bengaluru / Pune' },
  { name: 'TCS', website: 'https://www.tcs.com', careerPageUrl: 'https://careers.tcs.com', preferredRoles: ['Software Engineer', 'Backend Developer'], location: 'Multiple Locations' },
  { name: 'TechNova Solutions', website: 'https://technova.example.com', careerPageUrl: 'https://technova.example.com/careers', preferredRoles: ['Backend Developer', 'Node.js Developer'], location: 'Bengaluru' },
  { name: 'FinScale', website: 'https://finscale.example.com', careerPageUrl: 'https://finscale.example.com/careers', preferredRoles: ['Node.js Developer', 'Software Engineer'], location: 'Remote' }
];

const JOB_TEMPLATES = [
  { companyName: 'Wipro', jobTitle: 'Node.js Backend Developer', location: 'Bengaluru', remote: false, employmentType: 'Full-time', experienceRequired: '3+ years', minExperienceYears: 3, maxExperienceYears: 6, source: 'Company Career Page', skills: ['Node.js', 'Express.js', 'MongoDB', 'REST API', 'Redis', 'Docker', 'Kubernetes'], status: 'new' },
  { companyName: 'Infosys', jobTitle: 'Backend Developer API', location: 'Pune', remote: false, employmentType: 'Full-time', experienceRequired: '2+ years', minExperienceYears: 2, maxExperienceYears: 5, source: 'Manual Entry', skills: ['Node.js', 'TypeScript', 'MySQL', 'Kafka', 'AWS'], status: 'new' },
  { companyName: 'TechNova Solutions', jobTitle: 'Backend Developer', location: 'Bengaluru', remote: false, employmentType: 'Full-time', experienceRequired: '2+ years', minExperienceYears: 2, maxExperienceYears: 4, source: 'Company Career Page', skills: ['Node.js', 'Express.js', 'MongoDB', 'Redis', 'JWT', 'Docker'], status: 'new' },
  { companyName: 'FinScale', jobTitle: 'Senior Node.js Developer', location: 'Remote', remote: true, employmentType: 'Full-time', experienceRequired: '4+ years', minExperienceYears: 4, maxExperienceYears: 7, source: 'RemoteOK API', salary: { min: 90000, max: 140000, currency: 'USD', period: 'yearly' }, skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker', 'CI/CD', 'AWS', 'Kubernetes'], status: 'new' },
  { companyName: 'TCS', jobTitle: 'Full Stack Developer', location: 'Chennai', remote: false, employmentType: 'Full-time', experienceRequired: '3+ years', minExperienceYears: 3, maxExperienceYears: 6, source: 'Company Career Page', skills: ['JavaScript', 'React.js', 'Node.js', 'MongoDB', 'GraphQL'], status: 'new' }
];

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job_dashboard';
  await mongoose.connect(uri);
  console.log(`[Seed] Connected to ${uri}`);

  // Clear existing dev data
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Job.deleteMany({}),
    Resume.deleteMany({}),
    Application.deleteMany({}),
    FollowUp.deleteMany({}),
    Interview.deleteMany({}),
    Email.deleteMany({}),
    Notification.deleteMany({}),
    JobMatch.deleteMany({})
  ]);

  // 1. User
  const user = await User.create({
    name: 'Demo Candidate',
    email: 'demo@jobdashboard.local',
    password: 'demo12345',
    title: 'Backend Developer',
    location: 'Bengaluru, India',
    phone: '+91 98765 43210',
    preferredRoles: ['Backend Developer', 'Node.js Developer', 'Software Developer'],
    preferredLocations: ['Bangalore', 'Remote'],
    experienceYears: 3
  });
  console.log('[Seed] User created:', user.email, '(password: demo12345)');

  // 2. Companies
  const companyDocs = [];
  for (const c of COMPANIES) {
    companyDocs.push(await Company.create({ ...c, userId: user._id, status: 'active', checkFrequencyHours: 24 }));
  }
  console.log('[Seed] Companies created:', companyDocs.length);

  // 3. Resume
  const resume = await Resume.create({
    userId: user._id,
    fileName: 'demo-resume.pdf',
    originalName: 'demo-resume.pdf',
    filePath: 'uploads/resumes/demo-resume.pdf',
    fileSize: 0,
    fileType: 'pdf',
    rawText: 'Backend Developer with 3+ years experience. Skills: Node.js, Express.js, MongoDB, Redis, JavaScript, TypeScript, REST API, JWT, Docker, Git.',
    parsedProfile: SAMPLE_PROFILE,
    isPrimary: true,
    analyzedAt: new Date()
  });
  console.log('[Seed] Resume created');

  // 4. Jobs
  const jobDocs = [];
  for (const tpl of JOB_TEMPLATES) {
    const uniqueHash = generateJobHash(tpl.companyName, tpl.jobTitle, `https://careers.example/${tpl.companyName}/${tpl.jobTitle.replace(/\s+/g, '-')}`);
    const description = `${tpl.jobTitle} required. Experience: ${tpl.experienceRequired}. Skills needed: ${tpl.skills.join(', ')}. ${tpl.location}${tpl.remote ? ' (Remote)' : ''}. Responsibilities include building scalable services, REST APIs, collaborating with cross-functional teams.`;
    const matchData = {
      matchScore: Math.min(100, 60 + Math.round(Math.random() * 35)),
      matchedSkills: tpl.skills.filter(s => SAMPLE_PROFILE.skills.includes(s)),
      missingSkills: tpl.skills.filter(s => !SAMPLE_PROFILE.skills.includes(s))
    };
    const job = await Job.create({
      ...tpl,
      jobDescription: description,
      jobUrl: `https://careers.example/jobs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      skills: tpl.skills,
      requiredSkills: tpl.skills,
      postedDate: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000),
      uniqueHash,
      ...matchData,
      matchBreakdown: { skills: matchData.matchScore, experience: 90, location: 100, role: 85, education: 75 },
      matchReason: 'Strong skill overlap with role requirements and relevant experience mix.'
    });
    jobDocs.push(job);
    await JobMatch.create({
      userId: user._id,
      jobId: job._id,
      resumeId: resume._id,
      overallMatch: matchData.matchScore,
      skillsMatch: matchData.matchScore,
      experienceMatch: 90,
      locationMatch: 100,
      roleMatch: 85,
      educationMatch: 75,
      matchedSkills: matchData.matchedSkills,
      missingSkills: matchData.missingSkills,
      whyItMatches: 'Strong skill overlap with role requirements and relevant experience mix.',
      isRecommended: matchData.matchScore >= 70
    });
  }
  console.log('[Seed] Jobs created:', jobDocs.length);

  // 5. Applications
  const app1 = await Application.create({
    userId: user._id, jobId: jobDocs[0]._id,
    company: jobDocs[0].companyName, role: jobDocs[0].jobTitle,
    applicationDate: new Date(Date.now() - 12 * 86400000),
    status: 'Interview Scheduled',
    applicationUrl: jobDocs[0].jobUrl,
    notes: 'Completed round 1, technical round scheduled.',
    nextFollowUpDate: new Date(Date.now() - 1 * 86400000),
    timeline: [{ status: 'Applied', date: new Date(Date.now() - 12 * 86400000), note: 'Application created' }, { status: 'Interview Scheduled', date: new Date(Date.now() - 3 * 86400000), note: 'Moved to interview stage' }]
  });
  const app2 = await Application.create({
    userId: user._id, jobId: jobDocs[1]._id,
    company: jobDocs[1].companyName, role: jobDocs[1].jobTitle,
    applicationDate: new Date(Date.now() - 8 * 86400000),
    status: 'Applied',
    applicationUrl: jobDocs[1].jobUrl,
    nextFollowUpDate: new Date(Date.now() + 1 * 86400000),
    timeline: [{ status: 'Applied', date: new Date(Date.now() - 8 * 86400000), note: 'Application created' }]
  });
  const app3 = await Application.create({
    userId: user._id, jobId: jobDocs[2]._id,
    company: jobDocs[2].companyName, role: jobDocs[2].jobTitle,
    applicationDate: new Date(Date.now() - 20 * 86400000),
    status: 'Shortlisted',
    applicationUrl: jobDocs[2].jobUrl,
    nextFollowUpDate: new Date(Date.now() + 3 * 86400000),
    timeline: [{ status: 'Applied', date: new Date(Date.now() - 20 * 86400000), note: 'Application created' }, { status: 'Shortlisted', date: new Date(Date.now() - 5 * 86400000), note: 'Shortlisted from email' }]
  });
  const app4 = await Application.create({
    userId: user._id, jobId: jobDocs[4]._id,
    company: jobDocs[4].companyName, role: jobDocs[4].jobTitle,
    applicationDate: new Date(Date.now() - 30 * 86400000),
    status: 'Rejected',
    applicationUrl: jobDocs[4].jobUrl,
    timeline: [{ status: 'Applied', date: new Date(Date.now() - 30 * 86400000), note: 'Application created' }, { status: 'Rejected', date: new Date(Date.now() - 15 * 86400000), note: 'Rejected' }]
  });
  console.log('[Seed] Applications created: 4');

  // 6. Follow-ups
  await FollowUp.create([
    { userId: user._id, applicationId: app1._id, company: app1.company, role: app1.role, dueDate: new Date(Date.now() - 1 * 86400000), status: 'overdue', recruiterName: 'Priya Sharma', notes: 'Waiting for final round schedule.', nextAction: 'Send follow-up email for interview status' },
    { userId: user._id, applicationId: app2._id, company: app2.company, role: app2.role, dueDate: new Date(Date.now() + 1 * 86400000), status: 'pending', recruiterName: 'Rahul Verma', notes: 'Follow up after 5 working days.', nextAction: 'Send polite status check email' },
    { userId: user._id, applicationId: app3._id, company: app3.company, role: app3.role, dueDate: new Date(Date.now() + 3 * 86400000), status: 'pending', notes: 'Shortlisted, awaiting HR call.', nextAction: 'Prepare for HR discussion' }
  ]);
  console.log('[Seed] Follow-ups created: 3');

  // 7. Interviews
  const interview = await Interview.create({
    userId: user._id, applicationId: app1._id,
    round: 'Round 2 - Technical',
    type: 'Technical Interview',
    scheduledDate: new Date(Date.now() + 2 * 86400000),
    durationMinutes: 60,
    interviewerName: 'Ankit Gupta',
    meetingLink: 'https://meet.example.com/technical-round',
    preparationNotes: 'Focus on Node.js internals, Redis, Kafka.',
    status: 'Scheduled'
  });
  app1.interviews.push(interview._id);
  await app1.save();
  console.log('[Seed] Interview created');

  // 8. Emails
  await Email.create([
    { userId: user._id, gmailMessageId: 'demo-email-1', subject: 'Congratulations! You are shortlisted for Backend Developer role', sender: 'Talent Acquisition <careers@technova.example.com>', senderEmail: 'careers@technova.example.com', recipient: user.email, bodySnippet: 'Congratulations! You have been shortlisted for the Backend Developer role. The recruiter will reach out soon.', receivedAt: new Date(Date.now() - 5 * 86400000), category: 'SHORTLIST', aiConfidence: 0.97, companyName: 'TechNova Solutions', jobRole: 'Backend Developer', applicationId: app3._id, status: 'linked', classificationReason: 'Shortlisted keywords detected' },
    { userId: user._id, gmailMessageId: 'demo-email-2', subject: 'Interview scheduled: Node.js Backend Developer at Wipro', sender: 'Wipro Careers <noc-reply@careers.wipro.com>', senderEmail: 'noc-reply@careers.wipro.com', recipient: user.email, bodySnippet: 'We are pleased to schedule your technical interview for the Node.js Backend Developer position.', receivedAt: new Date(Date.now() - 3 * 86400000), category: 'INTERVIEW', aiConfidence: 0.94, companyName: 'Wipro', jobRole: 'Node.js Backend Developer', applicationId: app1._id, status: 'linked', classificationReason: 'Interview keywords detected' },
    { userId: user._id, gmailMessageId: 'demo-email-3', subject: 'Status update regarding your application at Infosys', sender: 'Infosys Careers <careers@infosys.com>', senderEmail: 'careers@infosys.com', recipient: user.email, bodySnippet: 'Your application is under review. We will update you within 5 working days.', receivedAt: new Date(Date.now() - 2 * 86400000), category: 'FOLLOW_UP', aiConfidence: 0.81, companyName: 'Infosys', jobRole: 'Backend Developer API', applicationId: app2._id, status: 'linked', classificationReason: 'Follow-up / status update detected' },
    { userId: user._id, gmailMessageId: 'demo-email-4', subject: 'Weekly Developer Digest', sender: 'Dev Digest <newsletter@devdigest.example.com>', senderEmail: 'newsletter@devdigest.example.com', recipient: user.email, bodySnippet: 'Top Node.js articles and jobs this week.', receivedAt: new Date(Date.now() - 1 * 86400000), category: 'NEWSLETTER', aiConfidence: 1.0, status: 'unlinked', classificationReason: 'Newsletter sender detected' }
  ]);
  console.log('[Seed] Emails created: 4');

  // 9. Notifications
  await Notification.create([
    { userId: user._id, type: 'INTERVIEW_UPCOMING', title: 'Interview in 2 days', message: 'Technical Interview at Wipro scheduled for ' + interview.scheduledDate.toDateString(), link: '/interviews', read: false, metadata: { interviewId: interview._id } },
    { userId: user._id, type: 'FOLLOW_UP_DUE', title: 'Follow-up overdue', message: 'Wipro (Node.js Backend Developer) — send follow-up email', link: '/follow-ups', read: false },
    { userId: user._id, type: 'HIGH_MATCH_JOB', title: '92% match found', message: 'Senior Node.js Developer at FinScale (Remote)', link: `/jobs/${jobDocs[3]._id}`, read: false },
    { userId: user._id, type: 'GMAIL_SYNC_COMPLETE', title: 'Gmail sync complete', message: '4 job-related emails synced and classified', link: '/emails', read: true }
  ]);
  console.log('[Seed] Notifications created: 4');

  console.log('\n[Seed] ✅ Database seeded successfully!');
  console.log('Login with: demo@jobdashboard.local / demo12345\n');
  process.exit(0);
};

seed().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});