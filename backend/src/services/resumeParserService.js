import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import { ALL_SKILLS } from '../utils/skillDictionary.js';
import { generateCompletion } from '../integrations/openai/llmClient.js';
import { logger } from '../utils/logger.js';

/**
 * Custom PDF pagerender that measures horizontal and vertical gaps between text
 * fragments to preserve spaces between words and newlines accurately.
 */
const customPagerender = function(pageData) {
  return pageData.getTextContent().then(function(textContent) {
    let text = '';
    let lastY = null;
    let lastX = null;
    let lastW = 0;

    const items = textContent.items.slice().sort((a, b) => {
      if (Math.abs(b.transform[5] - a.transform[5]) > 3) {
        return b.transform[5] - a.transform[5];
      }
      return a.transform[4] - b.transform[4];
    });

    for (const item of items) {
      const str = item.str;
      if (!str) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      const w = item.width || 0;

      if (lastY === null) {
        text += str;
      } else if (Math.abs(y - lastY) > 3) {
        text += '\n' + str;
      } else if (lastX !== null && (x - (lastX + lastW)) > 1.4) {
        text += ' ' + str;
      } else {
        text += str;
      }
      lastY = y;
      lastX = x;
      lastW = w;
    }
    return text;
  });
};

const extractText = async (filePath, fileType) => {
  try {
    if (fileType === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer, { pagerender: customPagerender });
      return data.text || '';
    }
    if (fileType === 'docx' || fileType === 'doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }
    const rawBuffer = fs.readFileSync(filePath);
    const text = rawBuffer.toString('utf8');
    return text.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ' ').trim();
  } catch (err) {
    logger.warn(`Text extraction failed for ${fileType}: ${err.message} — using fallback`);
    try {
      if (fileType === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text || '';
      }
    } catch (fallbackErr) {
      logger.error(`Fallback failed: ${fallbackErr.message}`);
    }
    return '';
  }
};

const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const extractEmail = (text) => {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
};

const extractPhone = (text) => {
  const match = text.match(/(\+?\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}|\+?91[-\s]?[6-9]\d{4}[-\s]?\d{5}|\b[6-9]\d{9}\b/);
  return match ? match[0].trim() : '';
};

const extractName = (text) => {
  const skipWords = new Set([
    'resume', 'curriculum', 'vitae', 'cv', 'profile', 'summary',
    'objective', 'contact', 'email', 'phone', 'address', 'linkedin',
    'github', 'portfolio', 'skills', 'experience', 'education', 'professional',
  ]);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  for (const line of lines.slice(0, 8)) {
    const cleanLine = line.replace(/^[•▸\-\s]+/, '').trim();
    const lower = cleanLine.toLowerCase();
    const wordCount = cleanLine.split(/\s+/).length;
    if (
      wordCount >= 1 && wordCount <= 5 &&
      cleanLine.length >= 3 && cleanLine.length <= 60 &&
      /^[A-Za-z\s.\-']+$/.test(cleanLine) &&
      !skipWords.has(lower) &&
      !skipWords.has(cleanLine.split(' ')[0].toLowerCase()) &&
      !/[0-9@#$%^&*()|]/.test(cleanLine)
    ) {
      if (cleanLine === cleanLine.toUpperCase() && cleanLine.length > 3) {
        return toTitleCase(cleanLine);
      }
      return cleanLine;
    }
  }
  return 'Unknown';
};

const extractLocation = (text) => {
  const locMatch = text.match(/([A-Za-z\s]+),\s*(India|USA|United States|UK|United Kingdom|Canada|Germany|Australia|Singapore)/i);
  if (locMatch) {
    const city = locMatch[1].trim().split('\n').pop().trim();
    if (city.length < 30) return `${city}, ${locMatch[2]}`;
  }
  const cities = ['Bangalore', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune',
    'Chennai', 'Noida', 'Gurgaon', 'Gurugram', 'Remote', 'Kolkata', 'Ahmedabad', 'Kochi'];
  for (const city of cities) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(text)) {
      return `${city}, India`;
    }
  }
  return '';
};

const extractSkills = (text) => {
  const lowerText = text.toLowerCase();
  const matched = new Set();
  
  const skillsSecMatch = text.match(/(?:technical\s+skills|skills|core\s+competencies|technologies)[\s\S]*?(?=(?:work\s+experience|experience|projects|education|certifications|$))/i);
  const searchIn = (skillsSecMatch ? skillsSecMatch[0] + '\n' + lowerText : lowerText).toLowerCase();

  for (const skill of ALL_SKILLS) {
    const sLower = skill.toLowerCase();
    const escaped = sLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i');
    if (regex.test(searchIn)) {
      matched.add(skill);
    }
  }
  return Array.from(matched);
};

const SECTION_HEADERS = [
  'professional summary', 'summary', 'profile', 'about me', 'overview',
  'work experience', 'experience', 'employment history', 'employment',
  'career highlights', 'key highlights', 'highlights',
  'project highlights', 'projects', 'technical projects',
  'technical skills', 'skills', 'technologies', 'core competencies',
  'education', 'academic background', 'qualifications',
  'certifications', 'licenses & certifications', 'achievements',
  'awards', 'publications', 'languages'
];

const splitSections = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = {};
  let currentSection = 'header';
  sections[currentSection] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanHeader = line.toLowerCase().replace(/^[#*•▸\-\s]+/, '').replace(/[:\-_]+$/, '').trim();
    const isHeader = SECTION_HEADERS.includes(cleanHeader);

    if (isHeader) {
      currentSection = cleanHeader;
      if (!sections[currentSection]) sections[currentSection] = [];
    } else {
      sections[currentSection].push(line);
    }
  }
  return sections;
};

const extractSummary = (text, sections) => {
  const summaryKeys = ['professional summary', 'summary', 'profile', 'about me', 'overview'];
  for (const key of summaryKeys) {
    if (sections[key] && sections[key].length > 0) {
      const summaryText = sections[key].join(' ').trim();
      if (summaryText.length > 20) return summaryText;
    }
  }
  const match = text.match(/(?:professional\s+summary|summary|profile|about\s+me)\s*[\n\r]+([\s\S]{30,600}?)(?=\n\s*(?:career\s+highlights|highlights|work\s+experience|experience|technical\s+skills|skills|projects|education|$))/i);
  if (match) {
    return match[1].split('\n').map(l => l.trim()).filter(Boolean).join(' ').trim();
  }
  return '';
};

const monthMap = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const extractExperienceYears = (text, sections) => {
  // 1. Explicit statement in summary or top header (e.g. "4+ years", "3+ years of experience")
  const explicitMatch = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:software|web|backend|frontend|full[- ]stack|technical|professional|total|work))?\s*(?:development\s+)?(?:experience|exp|building|designing)/i);
  if (explicitMatch) {
    const val = parseFloat(explicitMatch[1]);
    if (val >= 0.5 && val <= 40) return val;
  }

  // 2. Work Experience section date summation (strictly ignore Education)
  const expLines = [
    ...(sections['work experience'] || []),
    ...(sections['experience'] || []),
    ...(sections['employment history'] || []),
    ...(sections['employment'] || [])
  ];
  const expText = expLines.join(' ');

  if (expText.length > 20) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const rangePattern = /(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*)?(20\d{2})\s*[-–—to\s]+\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*)?(present|current|till date|20\d{2})/gi;
    
    let totalMonths = 0;
    let match;
    while ((match = rangePattern.exec(expText)) !== null) {
      const startMonthName = (match[1] || '').toLowerCase();
      const startYear = parseInt(match[2]);
      const endMonthName = (match[3] || '').toLowerCase();
      const endRaw = match[4].toLowerCase();

      const startMonth = startMonthName && monthMap[startMonthName] !== undefined ? monthMap[startMonthName] : 0;
      let endYear, endMonth;

      if (/present|current|till date/.test(endRaw)) {
        endYear = currentYear;
        endMonth = currentMonth;
      } else {
        endYear = parseInt(endRaw);
        endMonth = endMonthName && monthMap[endMonthName] !== undefined ? monthMap[endMonthName] : 11;
      }

      if (endYear >= startYear && startYear >= 1995 && startYear <= currentYear) {
        const diffMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
        if (diffMonths > 0 && diffMonths <= 480) {
          totalMonths += diffMonths;
        }
      }
    }

    if (totalMonths > 0) {
      return Math.round((totalMonths / 12) * 10) / 10;
    }
  }

  // 3. Fallback explicit regex
  const fallbackMatch = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i);
  if (fallbackMatch) {
    const val = parseFloat(fallbackMatch[1]);
    if (val >= 1 && val <= 30) return val;
  }

  return 0;
};

const extractCompaniesAndJobs = (sections) => {
  const expLines = [
    ...(sections['work experience'] || []),
    ...(sections['experience'] || []),
    ...(sections['employment history'] || [])
  ];

  const companies = [];
  const jobTitles = new Set();
  let currentCompany = null;

  for (let i = 0; i < expLines.length; i++) {
    let line = expLines[i].trim();
    if (!line) continue;

    // Check if next line completes a date range or title
    let combinedLine = line;
    if (i + 1 < expLines.length && /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*)?20\d{2}/i.test(expLines[i + 1])) {
      combinedLine = `${line} ${expLines[i + 1]}`;
    }

    const dateMatch = combinedLine.match(/(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*)?(?:20\d{2})\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*)?(?:present|current|till date|20\d{2})/i);
    const hasRoleWord = /(?:engineer|developer|lead|manager|analyst|tester|specialist|architect|consultant)/i.test(combinedLine);
    const hasDelimiter = combinedLine.includes('|') || combinedLine.includes('—') || combinedLine.includes('–');

    if (dateMatch && (hasRoleWord || hasDelimiter)) {
      if (currentCompany) companies.push(currentCompany);

      const datesStr = dateMatch[0].trim();
      const cleanLine = combinedLine.replace(datesStr, '').trim();

      let parts = [];
      if (cleanLine.includes('|')) {
        parts = cleanLine.split('|').map(p => p.trim()).filter(Boolean);
      } else if (cleanLine.includes('—')) {
        parts = cleanLine.split('—').map(p => p.trim()).filter(Boolean);
      } else if (cleanLine.includes(' – ')) {
        parts = cleanLine.split(' – ').map(p => p.trim()).filter(Boolean);
      } else {
        parts = [cleanLine];
      }

      let role = '';
      let compName = '';
      let location = '';

      if (parts.length >= 3) {
        role = parts[0];
        compName = parts[1];
        location = parts[2];
      } else if (parts.length === 2) {
        if (/engineer|developer|lead|manager|analyst|tester|specialist/i.test(parts[0])) {
          role = parts[0];
          compName = parts[1];
        } else {
          compName = parts[0];
          role = parts[1];
        }
      } else if (parts.length === 1) {
        role = parts[0];
      }

      if (role) {
        jobTitles.add(role.replace(/[–—\-].*$/, '').trim());
        jobTitles.add(role);
      }

      const splitDate = datesStr.split(/[-–—to]+/);
      const startDate = (splitDate[0] || '').trim();
      const endDate = (splitDate[1] || '').trim();

      currentCompany = {
        name: compName || 'Company',
        role: role || 'Software Professional',
        location: location || '',
        startDate,
        endDate,
        highlights: []
      };

      // Skip next line if it was merged
      if (combinedLine !== line) i++;
    } else if (currentCompany) {
      if (/^[▸•●\-\*]/.test(line) || line.length > 20) {
        const cleanHighlight = line.replace(/^[▸•●\-\*\s]+/, '').trim();
        if (cleanHighlight) currentCompany.highlights.push(cleanHighlight);
      }
    }
  }

  if (currentCompany) {
    companies.push(currentCompany);
  }

  return {
    companies,
    jobTitles: Array.from(jobTitles).filter(j => j.length > 2 && j.length < 50)
  };
};

const extractEducation = (sections) => {
  const eduLines = [
    ...(sections['education'] || []),
    ...(sections['academic background'] || []),
    ...(sections['qualifications'] || [])
  ];

  const education = [];
  let currentEdu = null;

  for (const line of eduLines) {
    if (!line) continue;
    if (/(?:bachelor|master|b\.e|b\.tech|m\.tech|bca|mca|b\.sc|m\.sc|diploma|phd|associate|degree|high school)/i.test(line)) {
      if (currentEdu) education.push(currentEdu);
      
      const yearMatch = line.match(/(?:20\d{2}(?:\s*[-–—]\s*20\d{2})?|Graduation:\s*20\d{2})/i);
      const year = yearMatch ? yearMatch[0].replace(/Graduation:\s*/i, '').trim() : '';

      const cleanLine = line.replace(yearMatch ? yearMatch[0] : '', '').replace(/Graduation:?/i, '').trim();
      const parts = cleanLine.split(/[|—–]/).map(p => p.trim()).filter(Boolean);

      let degree = parts[0] || cleanLine;
      let inst = parts[1] || '';

      currentEdu = {
        degree,
        institution: inst,
        year
      };
    } else if (currentEdu && !currentEdu.institution) {
      currentEdu.institution = line.replace(/^[•▸\-\s]+/, '').trim();
    }
  }
  if (currentEdu) education.push(currentEdu);
  return education;
};

const extractCertifications = (sections) => {
  const certLines = [
    ...(sections['certifications'] || []),
    ...(sections['licenses & certifications'] || [])
  ];
  const certs = [];
  for (const line of certLines) {
    const clean = line.replace(/^[▸•●\-\*\s]+/, '').trim();
    if (clean && clean.length > 3 && !/certifications/i.test(clean)) {
      certs.push(clean);
    }
  }
  return certs;
};

const extractProjects = (sections) => {
  const projLines = [
    ...(sections['project highlights'] || []),
    ...(sections['projects'] || []),
    ...(sections['technical projects'] || [])
  ];

  const projects = [];
  let currentProj = null;

  for (const line of projLines) {
    if (!line) continue;
    const isBullet = /^[▸•●\-\*]/.test(line);

    if (!isBullet && line.length < 100 && (line.includes('—') || line.includes('–') || line.includes(':') || (currentProj === null && line.length > 5))) {
      if (currentProj) projects.push(currentProj);
      const parts = line.split(/[—–:]/).map(p => p.trim());
      currentProj = {
        title: parts[0] || line,
        description: parts[1] || '',
        technologies: [],
        highlights: []
      };
    } else if (currentProj) {
      const clean = line.replace(/^[▸•●\-\*\s]+/, '').trim();
      if (clean) currentProj.highlights.push(clean);
    }
  }
  if (currentProj) projects.push(currentProj);
  return projects;
};

const algorithmicParse = (rawText) => {
  const sections = splitSections(rawText);
  const name = extractName(rawText);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const location = extractLocation(rawText);
  const skills = extractSkills(rawText);
  const summary = extractSummary(rawText, sections);
  const experienceYears = extractExperienceYears(rawText, sections);
  const { companies, jobTitles } = extractCompaniesAndJobs(sections);
  const education = extractEducation(sections);
  const certifications = extractCertifications(sections);
  const projects = extractProjects(sections);

  return {
    name,
    email,
    phone,
    summary,
    skills,
    experienceYears,
    companies,
    jobTitles,
    education,
    certifications,
    projects,
    location,
    preferredRoles: jobTitles.slice(0, 3),
    preferredLocations: location ? [location] : [],
  };
};

export const parseResume = async (filePath, fileType) => {
  const rawText = await extractText(filePath, fileType);

  // ── Try AI parsing first (if OPENAI_API_KEY is configured) ──────────────
  const aiResult = await generateCompletion({
    systemPrompt: `You are an expert resume parsing engine. Read the resume text thoroughly from top to bottom.
STRICT RULES:
- Extract all parameters accurately: name, email, phone, summary, skills, experienceYears, companies, jobTitles, education, certifications, projects, location.
- For experienceYears: Extract the candidate's actual years of work experience (e.g. 4 or 3.5). Sum work experience date ranges or use explicit professional experience years. DO NOT count graduation/diploma years as work experience.
- For summary: Extract the full Professional Summary / Profile section.
- For companies: Extract all work experience entries with company name, role, location, start date, end date, and highlights.
Return ONLY valid JSON matching this schema:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "summary": "string",
  "skills": ["string"],
  "experienceYears": number,
  "companies": [{"name":"string","role":"string","location":"string","startDate":"string","endDate":"string","highlights":["string"]}],
  "jobTitles": ["string"],
  "education": [{"degree":"string","institution":"string","year":"string"}],
  "certifications": ["string"],
  "projects": [{"title":"string","description":"string","technologies":["string"],"highlights":["string"]}],
  "location": "string",
  "preferredRoles": ["string"],
  "preferredLocations": ["string"]
}`,
    userPrompt: `Parse this complete resume text:\n\n${rawText.slice(0, 10000)}`,
    temperature: 0.0,
    responseFormat: 'json_object'
  });

  if (aiResult && aiResult.name) {
    logger.success('Resume parsed using AI');
    return { rawText, parsedProfile: aiResult };
  }

  // ── High precision algorithmic parser ──────────────────────────
  logger.info('Resume parsed using high-precision algorithmic engine');
  const parsedProfile = algorithmicParse(rawText);
  return { rawText, parsedProfile };
};
