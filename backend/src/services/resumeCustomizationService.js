import { generateCompletion } from '../integrations/openai/llmClient.js';
import { logger } from '../utils/logger.js';

export const customizeResume = async (originalProfile, job) => {
  const systemPrompt = `You are a professional resume writer.
Your task is to tailor the candidate's resume for a specific job.
CRITICAL RULES:
- Do NOT invent any new experience, certifications, skills, companies, or projects
- Only rewrite/rephrase what already exists in the resume
- Reorder skills to highlight the most relevant ones first
- Improve wording of existing bullet points to align with job requirements
- Customize the professional summary based on the job description
- Return ONLY valid JSON`;

  const userPrompt = `Candidate Profile:
${JSON.stringify(originalProfile, null, 2)}

Target Job:
Company: ${job.companyName}
Role: ${job.jobTitle}
Required Skills: ${(job.requiredSkills || job.skills || []).join(', ')}
Job Description: ${(job.jobDescription || '').slice(0, 3000)}

Return JSON:
{
  "summary": "customized professional summary",
  "reorderedSkills": ["most relevant skills first"],
  "tailoredHighlights": [{"company":"string","role":"string","bullets":["reworded bullets"]}],
  "tailoredProjects": [{"title":"string","highlights":["reworded highlights"],"technologies":["tech"]}],
  "changesMade": ["description of each change made"]
}`;

  const aiResult = await generateCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.4,
    responseFormat: 'json_object'
  });

  if (aiResult) return aiResult;

  // Algorithmic fallback
  logger.info('Resume customization using algorithmic fallback');
  const jobSkills = [...(job.requiredSkills || []), ...(job.skills || [])];
  const sorted = [...(originalProfile.skills || [])].sort((a, b) => {
    const aMatch = jobSkills.some(js => js.toLowerCase().includes(a.toLowerCase()));
    const bMatch = jobSkills.some(js => js.toLowerCase().includes(b.toLowerCase()));
    return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
  });
  return {
    summary: `Experienced ${(originalProfile.preferredRoles || ['Developer'])[0]} with ${originalProfile.experienceYears || 'several'} years of experience, seeking the ${job.jobTitle} role at ${job.companyName}.`,
    reorderedSkills: sorted,
    tailoredHighlights: (originalProfile.companies || []).map(c => ({
      company: c.name,
      role: c.role,
      bullets: c.highlights || []
    })),
    tailoredProjects: (originalProfile.projects || []).map(p => ({
      title: p.title,
      highlights: p.highlights || [],
      technologies: p.technologies || []
    })),
    changesMade: ['Reordered skills for job relevance', 'Customized professional summary']
  };
};
