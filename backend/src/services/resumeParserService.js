import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import natural from 'natural';
import { ALL_SKILLS, normalizeSkill } from '../utils/skillDictionary.js';
import { generateCompletion } from '../integrations/openai/llmClient.js';
import { logger } from '../utils/logger.js';

const tokenizer = new natural.WordTokenizer();

const extractText = async (filePath, fileType) => {
  if (fileType === 'pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } else if (fileType === 'docx' || fileType === 'doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new Error('Unsupported file type');
};

const extractEmail = (text) => {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
};

const extractPhone = (text) => {
  const match = text.match(/(\+91[\-\s]?)?[6-9]\d{9}/);
  return match ? match[0] : '';
};

const extractName = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 50 && /^[A-Za-z\s]+$/.test(line) && !line.toLowerCase().includes('resume')) {
      return line;
    }
  }
  return 'Unknown';
};

const extractSkills = (text) => {
  const lowerText = text.toLowerCase();
  return ALL_SKILLS.filter(skill => {
    const norm = skill.toLowerCase();
    return lowerText.includes(norm);
  });
};

const extractExperienceYears = (text) => {
  const match = text.match(/(\d+)\+?\s*(?:year|yr)s?\s*(?:of)?\s*(?:experience|exp)/i);
  if (match) return parseInt(match[1]);
  const yearMatches = text.match(/20\d{2}/g);
  if (yearMatches && yearMatches.length >= 2) {
    const years = yearMatches.map(Number).sort();
    return new Date().getFullYear() - years[0];
  }
  return 0;
};

const extractLocation = (text) => {
  const cities = ['Bangalore','Bengaluru','Mumbai','Delhi','Hyderabad','Pune','Chennai','Noida','Gurgaon','Remote','Kolkata'];
  for (const city of cities) {
    if (text.toLowerCase().includes(city.toLowerCase())) return city;
  }
  return '';
};

const algorithmicParse = (rawText) => {
  return {
    name: extractName(rawText),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    summary: rawText.slice(0, 500),
    skills: extractSkills(rawText),
    experienceYears: extractExperienceYears(rawText),
    companies: [],
    jobTitles: [],
    education: [],
    certifications: [],
    projects: [],
    location: extractLocation(rawText),
    preferredRoles: ['Software Engineer', 'Backend Developer'],
    preferredLocations: ['Bangalore', 'Remote'],
  };
};

export const parseResume = async (filePath, fileType) => {
  const rawText = await extractText(filePath, fileType);

  const aiResult = await generateCompletion({
    systemPrompt: `You are a professional resume parser. Extract structured data from the resume text provided. 
Return ONLY valid JSON matching this exact schema - do NOT invent data. If a field has no data, use empty string or empty array:
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
    userPrompt: `Parse this resume:\n\n${rawText.slice(0, 6000)}`,
    temperature: 0.1,
    responseFormat: 'json_object'
  });

  if (aiResult) {
    logger.success('Resume parsed using AI');
    return { rawText, parsedProfile: aiResult };
  }

  logger.info('Resume parsed using algorithmic fallback');
  return { rawText, parsedProfile: algorithmicParse(rawText) };
};
