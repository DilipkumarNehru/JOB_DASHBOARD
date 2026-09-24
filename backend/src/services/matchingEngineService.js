import natural from 'natural';
import { normalizeSkill } from '../utils/skillDictionary.js';
import { generateCompletion } from '../integrations/openai/llmClient.js';
import { logger } from '../utils/logger.js';

const stemmer = natural.PorterStemmer;

const stemSkill = (skill) => stemmer.stem(skill.toLowerCase().trim());

const calcSkillsMatch = (resumeSkills, jobSkills) => {
  if (!jobSkills.length) return 80;
  const resumeStems = resumeSkills.map(stemSkill);
  const matched = jobSkills.filter(js => resumeStems.some(rs => rs === stemSkill(js) || rs.includes(stemSkill(js)) || stemSkill(js).includes(rs)));
  const missing = jobSkills.filter(js => !resumeStems.some(rs => rs === stemSkill(js) || rs.includes(stemSkill(js)) || stemSkill(js).includes(rs)));
  return {
    score: Math.round((matched.length / jobSkills.length) * 100),
    matched: matched.map(normalizeSkill),
    missing: missing.map(normalizeSkill)
  };
};

const calcExperienceMatch = (resumeYears, minExp, maxExp) => {
  if (!minExp && !maxExp) return 75;
  if (resumeYears >= minExp && resumeYears <= (maxExp || minExp + 5)) return 100;
  if (resumeYears >= minExp - 1) return 80;
  if (resumeYears > maxExp) return 85;
  return 50;
};

const calcLocationMatch = (resumeLocations, jobLocation, isRemote) => {
  if (isRemote) return 100;
  const jobLoc = (jobLocation || '').toLowerCase();
  if (jobLoc.includes('remote')) return 100;
  for (const loc of resumeLocations) {
    if (jobLoc.includes(loc.toLowerCase()) || loc.toLowerCase().includes(jobLoc)) return 100;
  }
  return 60;
};

const calcRoleMatch = (preferredRoles, jobTitle) => {
  const jobLower = (jobTitle || '').toLowerCase();
  for (const role of preferredRoles) {
    const roleLower = role.toLowerCase();
    if (jobLower.includes(roleLower) || roleLower.includes(jobLower)) return 100;
    const jobWords = jobLower.split(/\s+/);
    const roleWords = roleLower.split(/\s+/);
    const common = jobWords.filter(w => roleWords.includes(w) && w.length > 3);
    if (common.length > 0) return 75;
  }
  return 40;
};

export const calculateMatch = async (resume, job) => {
  const profile = resume.parsedProfile;
  const resumeSkills = profile.skills || [];
  const jobSkills = [...(job.requiredSkills || []), ...(job.skills || [])];

  const skillResult = calcSkillsMatch(resumeSkills, jobSkills);
  const expMatch = calcExperienceMatch(profile.experienceYears || 0, job.minExperienceYears || 0, job.maxExperienceYears || 5);
  const locMatch = calcLocationMatch(
    [...(profile.preferredLocations || []), profile.location || ''],
    job.location || '',
    job.remote
  );
  const roleMatch = calcRoleMatch(profile.preferredRoles || [], job.jobTitle || '');

  const overall = Math.round(
    skillResult.score * 0.45 +
    expMatch * 0.25 +
    roleMatch * 0.20 +
    locMatch * 0.10
  );

  let whyItMatches = '';

  const aiResult = await generateCompletion({
    systemPrompt: 'You are a career counselor. In 2-3 sentences, explain why this candidate is a good or poor fit for this job. Be specific about skills and experience. Be honest.',
    userPrompt: `Candidate skills: ${resumeSkills.join(', ')}
Candidate experience: ${profile.experienceYears} years
Preferred roles: ${(profile.preferredRoles || []).join(', ')}
Job: ${job.jobTitle} at ${job.companyName}
Required skills: ${jobSkills.join(', ')}
Match score: ${overall}%`,
    temperature: 0.5,
    responseFormat: 'text'
  });

  if (aiResult) whyItMatches = aiResult;
  else whyItMatches = overall >= 70 
    ? `Strong match on ${skillResult.matched.slice(0,3).join(', ')} with relevant experience.`
    : `Partial match — candidate has ${skillResult.matched.length} of ${jobSkills.length} required skills.`;

  return {
    overallMatch: Math.min(overall, 100),
    skillsMatch: skillResult.score,
    experienceMatch: expMatch,
    locationMatch: locMatch,
    roleMatch,
    educationMatch: 75,
    matchedSkills: skillResult.matched,
    missingSkills: skillResult.missing,
    whyItMatches,
    isRecommended: overall >= 70
  };
};
