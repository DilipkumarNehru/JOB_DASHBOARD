import axios from 'axios';
import { logger } from '../../utils/logger.js';

export const checkCompanyCareerPage = async (company) => {
  logger.info(`Checking career page for company: ${company.name} (${company.careerPageUrl})`);
  
  // Compliant check: verifies career page availability and returns metadata
  try {
    const response = await axios.head(company.careerPageUrl, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Compatible JobDashboard/1.0)' }
    });
    return {
      success: true,
      status: response.status,
      timestamp: new Date()
    };
  } catch (error) {
    logger.warn(`Career page check for ${company.name} yielded: ${error.message}`);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};
