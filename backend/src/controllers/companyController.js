import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import { scanCompanyForJobs } from '../services/careerDiscoveryService.js';
import { encryptSecret } from '../utils/encryptionUtil.js';

export const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({ userId: req.user.id }).sort({ createdAt: -1 });
    companies.forEach(c => { c.careerPortalPasswordEncrypted = undefined; });
    res.json({ success: true, count: companies.length, companies });
  } catch (err) { next(err); }
};

export const createCompany = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.careerPortalPassword) {
      body.careerPortalPasswordEncrypted = encryptSecret(body.careerPortalPassword);
      delete body.careerPortalPassword;
    }
    const company = await Company.create({ ...body, userId: req.user.id });
    company.careerPortalPasswordEncrypted = undefined;
    res.status(201).json({ success: true, company });
  } catch (err) { next(err); }
};

export const updateCompany = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.careerPortalPassword) {
      body.careerPortalPasswordEncrypted = encryptSecret(body.careerPortalPassword);
      delete body.careerPortalPassword;
    }
    delete body.careerPortalPasswordEncrypted;
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, body, { new: true }
    );
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    company.careerPortalPasswordEncrypted = undefined;
    res.json({ success: true, company });
  } catch (err) { next(err); }
};

export const deleteCompany = async (req, res, next) => {
  try {
    await Company.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Company removed' });
  } catch (err) { next(err); }
};

export const scanCompanyJobs = async (req, res, next) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, userId: req.user.id });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    const resume = await Resume.findOne({ userId: req.user.id, isPrimary: true });
    const result = await scanCompanyForJobs({ userId: req.user.id, company, resume });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getCompanyJobs = async (req, res, next) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, userId: req.user.id });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    const jobs = await Job.find({ companyName: company.name }).sort({ postedDate: -1 }).limit(50);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) { next(err); }
};