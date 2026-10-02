import natural from 'natural';
import { normalizeSkill, extractSkillsFromText } from '../utils/skillDictionary.js';
import { generateCompletion } from '../integrations/openai/llmClient.js';
import { logger } from '../utils/logger.js';

const stemmer = natural.PorterStemmer;
const stemSkill = (skill) => stemmer.stem(skill.toLowerCase().trim());

/**
 * Normalize a skill string for comparison.
 * Handles: Node.js = NodeJS = Node JS, etc.
 */
const normalizeForCompare = (s) => {
  return s.toLowerCase()
    .replace(/[\s.\-_]/g, '')    // remove spaces, dots, dashes, underscores
    .replace(/\.?js$/, '')        // remove trailing .js / js
    .replace(/\s+/g, '');
};

/**
 * Check if two skills are equivalent (intelligent matching)
 */
const skillsMatch = (resumeSkill, jdSkill) => {
  const r = normalizeForCompare(resumeSkill);
  const j = normalizeForCompare(jdSkill);

  if (r === j) return true;

  // Check stem match
  const rStem = stemmer.stem(r);
  const jStem = stemmer.stem(j);
  if (rStem === jStem) return true;

  // Substring containment (for multi-word skills)
  if (r.length > 3 && j.includes(r)) return true;
  if (j.length > 3 && r.includes(j)) return true;

  return false;
};

/**
 * Calculate skills match between resume skills and JD skills.
 * Returns: score (0-100), matched skills, missing skills
 */
const calcSkillsMatch = (resumeSkills, jdRequiredSkills, jdPreferredSkills = []) => {
  if (!jdRequiredSkills.length && !jdPreferredSkills.length) return { score: 75, matched: [], missing: [] };

  const allJdSkills = [...new Set([...jdRequiredSkills, ...jdPreferredSkills])];
  const matched = [];
  const missing = [];

  for (const jdSkill of allJdSkills) {
    const found = resumeSkills.some(rs => skillsMatch(rs, jdSkill));
    if (found) {
      matched.push(normalizeSkill(jdSkill));
    } else {
      missing.push(normalizeSkill(jdSkill));
    }
  }

  // Weight required skills more heavily
  let score = 0;
  if (jdRequiredSkills.length > 0) {
    const reqMatched = jdRequiredSkills.filter(jdSkill =>
      resumeSkills.some(rs => skillsMatch(rs, jdSkill))
    ).length;
    const reqScore = Math.round((reqMatched / jdRequiredSkills.length) * 100);

    if (jdPreferredSkills.length > 0) {
      const prefMatched = jdPreferredSkills.filter(jdSkill =>
        resumeSkills.some(rs => skillsMatch(rs, jdSkill))
      ).length;
      const prefScore = Math.round((prefMatched / jdPreferredSkills.length) * 100);
      // Required = 70% weight, Preferred = 30% weight
      score = Math.round(reqScore * 0.7 + prefScore * 0.3);
    } else {
      score = reqScore;
    }
  } else {
    const prefMatched = jdPreferredSkills.filter(jdSkill =>
      resumeSkills.some(rs => skillsMatch(rs, jdSkill))
    ).length;
    score = Math.round((prefMatched / jdPreferredSkills.length) * 100);
  }

  return { score, matched, missing };
};

/**
 * Calculate experience match
 */
const calcExperienceMatch = (resumeYears, minExp, maxExp) => {
  if (!minExp && !maxExp) return 75;
  const min = minExp || 0;
  const max = maxExp || (min + 5);

  if (resumeYears >= min && resumeYears <= max) return 100;
  if (resumeYears >= min - 1 && resumeYears < min) return 80;    // slightly under
  if (resumeYears > max && resumeYears <= max + 3) return 85;    // slightly over (good thing)
  if (resumeYears > max + 3) return 70;                           // overqualified
  if (resumeYears < min - 1) return Math.max(20, Math.round(50 - (min - resumeYears) * 10));  // underqualified
  return 50;
};

/**
 * Calculate location match
 */
const calcLocationMatch = (resumeLocations, jobLocation, isRemote) => {
  if (isRemote) return 100;
  const jobLoc = (jobLocation || '').toLowerCase();
  if (jobLoc.includes('remote')) return 100;
  if (!jobLoc) return 70;
  for (const loc of resumeLocations) {
    const rLoc = (loc || '').toLowerCase();
    if (rLoc && (jobLoc.includes(rLoc) || rLoc.includes(jobLoc))) return 100;
  }
  return 60;
};

/**
 * Calculate role/title match
 */
const calcRoleMatch = (preferredRoles, jobTitles, jobTitle) => {
  const allResumeTitles = [...preferredRoles, ...jobTitles];
  const jobLower = (jobTitle || '').toLowerCase();

  for (const role of allResumeTitles) {
    const roleLower = (role || '').toLowerCase();
    if (!roleLower) continue;
    if (jobLower === roleLower) return 100;
    if (jobLower.includes(roleLower) || roleLower.includes(jobLower)) return 95;

    // Word-level overlap
    const jobWords = jobLower.split(/\s+/).filter(w => w.length > 3);
    const roleWords = roleLower.split(/\s+/).filter(w => w.length > 3);
    const commonWords = jobWords.filter(w => roleWords.includes(w));
    if (commonWords.length >= 2) return 75;
    if (commonWords.length === 1) return 55;
  }
  return 30;
};

/**
 * Calculate education match by checking if JD education requirements are met
 */
const calcEducationMatch = (resumeEducation, jobDescriptionText) => {
  const jdLower = (jobDescriptionText || '').toLowerCase();

  // If no education requirements in JD
  const hasEduReq = /\b(bachelor|master|degree|b\.tech|m\.tech|bca|mca|b\.e|m\.e|phd|graduate|diploma)\b/i.test(jdLower);
  if (!hasEduReq) return 85;

  if (!resumeEducation || resumeEducation.length === 0) return 50;

  const resumeDegreesText = resumeEducation.map(e => `${e.degree} ${e.institution}`.toLowerCase()).join(' ');

  // Check degree levels
  const hasMasters = /master|m\.tech|mca|m\.e|mba|pg\b|post.?grad/i.test(resumeDegreesText);
  const hasBachelors = /bachelor|b\.tech|bca|b\.e|b\.sc|be\b|engineering|graduate|degree/i.test(resumeDegreesText);
  const hasDiploma = /diploma/i.test(resumeDegreesText);

  // JD requires Masters?
  if (/master|post.?grad|mba|m\.tech/i.test(jdLower) && hasMasters) return 100;
  if (/master|post.?grad/i.test(jdLower) && hasBachelors) return 70;

  // JD requires Bachelor/Engineering degree?
  if (/bachelor|b\.tech|engineering|degree|graduate/i.test(jdLower)) {
    if (hasMasters) return 100;
    if (hasBachelors) return 100;
    if (hasDiploma) return 60;
    return 40;
  }

  return 80; // Default
};

/**
 * Extract required/preferred skills from JD text
 */
const extractSkillsFromJD = (jobDescription, existingRequired = [], existingPreferred = []) => {
  // Use existing extracted skills first
  const reqSkills = [...existingRequired];
  const prefSkills = [...existingPreferred];

  // Extract additional skills from the full JD text
  const jdExtracted = extractSkillsFromText(jobDescription);

  // Merge: skills mentioned near "required/must have" go to required
  const jdLower = (jobDescription || '').toLowerCase();
  const requiredSection = jdLower.match(/(?:required|must.have|mandatory|essential)[\s\S]{0,500}/i)?.[0] || '';
  const preferredSection = jdLower.match(/(?:preferred|nice.to.have|good.to.have|bonus|desirable)[\s\S]{0,500}/i)?.[0] || '';

  for (const skill of jdExtracted) {
    const sLower = skill.toLowerCase();
    const alreadyReq = reqSkills.some(r => r.toLowerCase() === sLower);
    const alreadyPref = prefSkills.some(r => r.toLowerCase() === sLower);

    if (!alreadyReq && !alreadyPref) {
      if (requiredSection.includes(sLower)) {
        reqSkills.push(skill);
      } else if (preferredSection.includes(sLower)) {
        prefSkills.push(skill);
      } else {
        // Default: add to required if appears in main text
        reqSkills.push(skill);
      }
    }
  }

  return { required: reqSkills, preferred: prefSkills };
};

/**
 * Calculate keyword / responsibilities match using text overlap
 */
const calcKeywordsMatch = (resumeText, jobDescription) => {
  if (!jobDescription || !resumeText) return 50;

  // Extract meaningful keywords from JD (nouns, verbs, technical terms)
  const stopWords = new Set([
    'the', 'and', 'or', 'for', 'with', 'you', 'are', 'will', 'have', 'has', 'had',
    'our', 'your', 'this', 'that', 'they', 'them', 'from', 'about', 'what', 'who',
    'which', 'where', 'when', 'how', 'can', 'all', 'any', 'not', 'but', 'also',
    'be', 'to', 'of', 'in', 'on', 'at', 'by', 'as', 'is', 'it', 'its', 'an', 'a',
    'we', 'us', 'their', 'own', 'out', 'up', 'more', 'well', 'good', 'great', 'work',
    'across', 'into', 'such', 'both', 'do', 'using', 'use', 'should', 'must', 'very'
  ]);

  const extractKeywords = (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
  };

  const jdKeywords = new Set(extractKeywords(jobDescription));
  const resumeWords = new Set(extractKeywords(resumeText));

  if (jdKeywords.size === 0) return 60;

  let matchCount = 0;
  for (const word of jdKeywords) {
    if (resumeWords.has(word)) matchCount++;
  }

  const ratio = matchCount / Math.min(jdKeywords.size, 100); // cap at 100 keywords
  return Math.round(Math.min(ratio * 200, 100)); // scale up since not all will match
};

/**
 * Detect the career domain of a resume from its skills and job titles
 */
export const detectResumeDomain = (parsedProfile) => {
  const skills = (parsedProfile.skills || []).map(s => s.toLowerCase());
  const titles = (parsedProfile.jobTitles || []).map(t => t.toLowerCase());
  const allText = [...skills, ...titles].join(' ');

  const domainScores = {
    'Software Development': 0,
    'Accounting/Finance': 0,
    'Sales/Business Development': 0,
    'Data Analytics': 0,
    'HR/Recruitment': 0,
    'Marketing': 0,
    'Operations': 0,
  };

  // Software
  const techKeywords = ['node', 'react', 'python', 'java', 'developer', 'engineer', 'backend', 'frontend', 'software', 'programming', 'coding', 'mongodb', 'api', 'typescript', 'javascript', 'nestjs', 'express', 'aws', 'docker'];
  // Accounting
  const accountKeywords = ['accounting', 'tally', 'gst', 'accounts payable', 'accounts receivable', 'bookkeeping', 'ledger', 'audit', 'taxation', 'finance', 'accountant', 'financial', 'tds', 'gstr'];
  // Sales
  const salesKeywords = ['sales', 'business development', 'lead generation', 'crm', 'negotiation', 'customer', 'revenue', 'closing', 'b2b', 'b2c', 'selling', 'cold calling', 'prospecting'];
  // Data
  const dataKeywords = ['data analysis', 'analytics', 'tableau', 'power bi', 'machine learning', 'sql', 'pandas', 'python', 'statistics', 'visualization', 'data science'];
  // HR
  const hrKeywords = ['recruitment', 'talent acquisition', 'hiring', 'onboarding', 'hr', 'human resources', 'payroll', 'employee relations'];
  // Marketing
  const marketingKeywords = ['marketing', 'digital marketing', 'seo', 'sem', 'social media', 'content', 'brand', 'campaign', 'email marketing'];

  const score = (keywords) => keywords.filter(k => allText.includes(k)).length;

  domainScores['Software Development'] = score(techKeywords);
  domainScores['Accounting/Finance'] = score(accountKeywords);
  domainScores['Sales/Business Development'] = score(salesKeywords);
  domainScores['Data Analytics'] = score(dataKeywords);
  domainScores['HR/Recruitment'] = score(hrKeywords);
  domainScores['Marketing'] = score(marketingKeywords);

  const topDomain = Object.entries(domainScores).sort((a, b) => b[1] - a[1])[0];
  return topDomain[1] > 0 ? topDomain[0] : 'General';
};

/**
 * Main ATS match calculation function.
 *
 * Score Weights:
 * - Skills Match: 40%
 * - Responsibilities/Keywords: 20%
 * - Experience Match: 15%
 * - Role/Title Match: 10%
 * - Education Match: 5%
 * - Tools/Technologies: 5%
 * - Semantic Keywords: 5%
 *
 * @param {Object} resume - Resume document with parsedProfile
 * @param {Object} job - Job document
 * @returns {Object} match result with scores and skill lists
 */
export const calculateMatch = async (resume, job) => {
  const profile = resume.parsedProfile || {};
  const resumeSkills = profile.skills || [];
  const rawText = resume.rawText || '';
  const jobDescription = job.jobDescription || '';

  // Extract skills from JD (combine stored skills + extract from full JD text)
  const { required: jdRequired, preferred: jdPreferred } = extractSkillsFromJD(
    jobDescription,
    job.requiredSkills || [],
    job.preferredSkills || []
  );

  // If no extracted JD skills, use generic skills array
  const jdSkillsFallback = job.skills || [];
  const effectiveRequired = jdRequired.length > 0 ? jdRequired : jdSkillsFallback;
  const effectivePreferred = jdPreferred;

  // 1. Skills match (40% weight)
  const skillResult = calcSkillsMatch(resumeSkills, effectiveRequired, effectivePreferred);

  // 2. Experience match (15% weight)
  const expMatch = calcExperienceMatch(
    profile.experienceYears || 0,
    job.minExperienceYears || 0,
    job.maxExperienceYears || 5
  );

  // 3. Location match (not in final score per spec, but included in breakdown)
  const locMatch = calcLocationMatch(
    [...(profile.preferredLocations || []), profile.location || ''],
    job.location || '',
    job.remote
  );

  // 4. Role match (10% weight)
  const roleMatchScore = calcRoleMatch(
    profile.preferredRoles || [],
    profile.jobTitles || [],
    job.jobTitle || ''
  );

  // 5. Education match (5% weight)
  const eduMatch = calcEducationMatch(profile.education || [], jobDescription);

  // 6. Responsibilities / keywords match (20% weight)
  // Combine resume raw text + skills + job titles
  const resumeFullText = rawText || [
    profile.summary || '',
    (resumeSkills).join(' '),
    (profile.jobTitles || []).join(' '),
    (profile.companies || []).map(c => c.highlights?.join(' ') || '').join(' '),
  ].join(' ');
  const responsibilitiesScore = calcKeywordsMatch(resumeFullText, jobDescription);

  // 7. Tools/Technologies match (5% weight)
  const toolsSkills = [...(profile.tools || []), ...(profile.technologies || [])];
  const allResumeSkills = [...new Set([...resumeSkills, ...toolsSkills])];
  const toolsFromJD = extractSkillsFromText(jobDescription);
  const toolsMatchResult = calcSkillsMatch(allResumeSkills, toolsFromJD, []);

  // 8. Semantic keywords match (5% weight)
  const keywordsScore = calcKeywordsMatch(resumeFullText, jobDescription);

  // ── Final weighted ATS Score ──────────────────────────────────────────────
  // Skills: 40%, Responsibilities: 20%, Experience: 15%, Role: 10%, Education: 5%, Tools: 5%, Keywords: 5%
  const overall = Math.round(
    skillResult.score * 0.40 +
    responsibilitiesScore * 0.20 +
    expMatch * 0.15 +
    roleMatchScore * 0.10 +
    eduMatch * 0.05 +
    toolsMatchResult.score * 0.05 +
    keywordsScore * 0.05
  );

  // ── AI explanation ────────────────────────────────────────────────────────
  let whyItMatches = '';
  try {
    const aiResult = await generateCompletion({
      systemPrompt: 'You are a career counselor. In 2-3 sentences, explain why this candidate is a good or poor fit for this job based on their ATS score. Be specific about skills, experience, and role alignment. Be honest.',
      userPrompt: `Candidate profile:
Skills: ${resumeSkills.slice(0, 15).join(', ')}
Experience: ${profile.experienceYears} years
Job titles: ${(profile.preferredRoles || []).slice(0, 3).join(', ')}

Job: ${job.jobTitle} at ${job.companyName}
Required skills: ${effectiveRequired.slice(0, 10).join(', ')}
ATS Score: ${Math.min(overall, 100)}%
Matched skills: ${skillResult.matched.slice(0, 8).join(', ')}
Missing skills: ${skillResult.missing.slice(0, 5).join(', ')}`,
      temperature: 0.4,
      responseFormat: 'text'
    });
    if (aiResult) whyItMatches = aiResult;
  } catch (err) {
    logger.warn('AI explanation skipped:', err.message);
  }

  if (!whyItMatches) {
    const matchedCount = skillResult.matched.length;
    const totalCount = effectiveRequired.length + effectivePreferred.length;
    if (overall >= 80) {
      whyItMatches = `Strong match — ${matchedCount} of ${totalCount} required skills aligned with ${profile.experienceYears || 0} years of relevant experience.`;
    } else if (overall >= 60) {
      whyItMatches = `Good match on ${skillResult.matched.slice(0, 3).join(', ')}. Consider gaining: ${skillResult.missing.slice(0, 2).join(', ')}.`;
    } else {
      whyItMatches = `Partial match — ${matchedCount} of ${totalCount} required skills present. Missing: ${skillResult.missing.slice(0, 3).join(', ')}.`;
    }
  }

  return {
    overallMatch: Math.min(overall, 100),
    skillsMatch: skillResult.score,
    experienceMatch: expMatch,
    locationMatch: locMatch,
    roleMatch: roleMatchScore,
    educationMatch: eduMatch,
    responsibilitiesMatch: responsibilitiesScore,
    keywordsMatch: keywordsScore,
    toolsMatch: toolsMatchResult.score,
    matchedSkills: skillResult.matched,
    missingSkills: skillResult.missing,
    whyItMatches,
    isRecommended: overall >= 65,
  };
};
