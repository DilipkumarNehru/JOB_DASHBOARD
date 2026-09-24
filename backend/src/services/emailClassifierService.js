import { generateCompletion } from '../integrations/openai/llmClient.js';
import { logger } from '../utils/logger.js';

const EMAIL_CATEGORIES = [
  'JOB_APPLICATION','INTERVIEW','SHORTLIST','REJECTION','ASSESSMENT',
  'RECRUITER_CONTACT','JOB_OPENING','FOLLOW_UP','OFFER','ONBOARDING',
  'COURSE','CERTIFICATION','PROMOTION','SOCIAL','NEWSLETTER','OTHER'
];

const KEYWORDS = {
  INTERVIEW: ['interview','scheduled','meeting','call','zoom','teams','google meet','panel'],
  SHORTLIST: ['shortlisted','shortlist','selected','moved forward','next round','congratulation'],
  REJECTION: ['regret','unfortunately','not moving','not selected','rejected','other candidate','not proceed'],
  OFFER: ['offer letter','job offer','pleased to offer','compensation','ctc','salary offer'],
  ASSESSMENT: ['test','assessment','assignment','coding challenge','hackerrank','task'],
  RECRUITER_CONTACT: ['recruiter','hr team','talent acquisition','sourcer','reach out','opportunity'],
  JOB_OPENING: ['opening','vacancy','hiring','position','role','job'],
  FOLLOW_UP: ['follow up','following up','status update','any update','checking in'],
  JOB_APPLICATION: ['applied','application received','thank you for applying','application confirmed']
};

const algorithmicClassify = (subject, body) => {
  const text = (subject + ' ' + body).toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        return { category, confidence: 0.72 };
      }
    }
  }
  return { category: 'OTHER', confidence: 0.5 };
};

export const classifyEmail = async (email) => {
  const { subject, bodySnippet, sender } = email;

  const aiResult = await generateCompletion({
    systemPrompt: `You are an email classifier for a job search app.
Classify the email into one of these categories: ${EMAIL_CATEGORIES.join(', ')}.
Also extract: companyName, jobRole, confidence (0.0-1.0), classificationReason.
Return ONLY valid JSON:
{"category":"string","companyName":"string","jobRole":"string","confidence":number,"classificationReason":"string"}`,
    userPrompt: `Sender: ${sender}
Subject: ${subject}
Body snippet: ${(bodySnippet || '').slice(0, 1000)}`,
    temperature: 0.2,
    responseFormat: 'json_object'
  });

  if (aiResult && aiResult.category && EMAIL_CATEGORIES.includes(aiResult.category)) {
    return aiResult;
  }

  const fallback = algorithmicClassify(subject, bodySnippet || '');
  logger.info(`Email classified algorithmically as: ${fallback.category}`);
  return {
    ...fallback,
    companyName: '',
    jobRole: '',
    classificationReason: 'Classified using keyword matching'
  };
};
