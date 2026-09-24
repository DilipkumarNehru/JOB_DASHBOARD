import ResumeVersion from '../models/ResumeVersion.js';
import Resume from '../models/Resume.js';

export const getVersions = async (req, res, next) => {
  try {
    const filter = { userId: req.user.id };
    if (req.params.resumeId) filter.originalResumeId = req.params.resumeId;
    const versions = await ResumeVersion.find(filter)
      .populate('jobId', 'jobTitle companyName matchScore')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: versions.length, versions });
  } catch (err) { next(err); }
};

export const getVersion = async (req, res, next) => {
  try {
    const version = await ResumeVersion.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('jobId');
    if (!version) return res.status(404).json({ success: false, message: 'Resume version not found' });
    res.json({ success: true, version });
  } catch (err) { next(err); }
};

export const deleteVersion = async (req, res, next) => {
  try {
    await ResumeVersion.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Resume version deleted' });
  } catch (err) { next(err); }
};

export const downloadVersionPdf = async (req, res, next) => {
  try {
    const version = await ResumeVersion.findOne({ _id: req.params.id, userId: req.user.id });
    if (!version) return res.status(404).json({ success: false, message: 'Resume version not found' });
    if (!version.pdfPath) {
      const { buildPdfFromCustomized } = await import('../services/resumeVersionService.js');
      version.pdfPath = await buildPdfFromCustomized(version.tailoredContent);
      await version.save();
    }
    await ResumeVersion.findByIdAndUpdate(version._id, { $inc: { downloadCount: 1 } });
    const safe = `${version.targetCompany.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${version.targetRole.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    res.download(version.pdfPath, `${safe}-resume.pdf`);
  } catch (err) { next(err); }
};

export const setPrimary = async (req, res, next) => {
  try {
    const version = await ResumeVersion.findOne({ _id: req.params.id, userId: req.user.id });
    if (!version) return res.status(404).json({ success: false, message: 'Resume version not found' });
    await Resume.updateMany({ userId: req.user.id }, { isPrimary: false });
    await Resume.findByIdAndUpdate(version.originalResumeId, { isPrimary: true });
    res.json({ success: true, message: 'Resume version set as application resume' });
  } catch (err) { next(err); }
};