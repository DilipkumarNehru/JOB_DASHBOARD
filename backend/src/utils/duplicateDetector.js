import crypto from 'crypto';

export const generateJobHash = (companyName, jobTitle, jobUrl) => {
  const normCompany = (companyName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normTitle = (jobTitle || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normUrl = (jobUrl || '').toLowerCase().trim().split('?')[0]; // strip query params
  
  return crypto
    .createHash('sha256')
    .update(`${normCompany}|${normTitle}|${normUrl}`)
    .digest('hex');
};

export const generateEmailHash = (gmailMessageId) => {
  return (gmailMessageId || '').trim();
};
