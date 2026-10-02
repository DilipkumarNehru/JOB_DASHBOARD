import express from 'express';
import {
  uploadResume, getResumes, getPrimaryResume, getResume, updateResumeProfile,
  deleteResume, analyzeResume, customizeResumeForJob, downloadResumePdf,
  getAtsScore, serveResumeFile, setPrimaryResume, updateResumeName,
  downloadResumeDocx, convertAndSaveDocx, convertAndSavePdf, convertAndSaveResume,
  previewResumeHtml
} from '../controllers/resumeController.js';
import { getVersions, getVersion, deleteVersion, downloadVersionPdf, setPrimary } from '../controllers/resumeVersionController.js';
import { protect } from '../middleware/auth.js';
import { uploadResume as upload } from '../middleware/upload.js';

const router = express.Router();
router.use(protect);

// Resume CRUD
router.post('/', upload.single('resume'), uploadResume);
router.get('/', getResumes);
router.get('/primary', getPrimaryResume);

// Specific resume
router.get('/:id/ats-score', getAtsScore);
router.get('/:id/file', serveResumeFile);
router.get('/:id/preview-html', previewResumeHtml);
router.get('/:id/download.pdf', downloadResumePdf);
router.get('/:id/download.docx', downloadResumeDocx);
router.post('/:id/convert-word', convertAndSaveDocx);
router.post('/:id/convert-pdf', convertAndSavePdf);
router.post('/:id/convert', convertAndSaveResume);
router.post('/:id/analyze', analyzeResume);
router.post('/:id/customize', customizeResumeForJob);
router.put('/:id/set-primary', setPrimaryResume);
router.put('/:id/name', updateResumeName);
router.get('/:id/versions', getVersions);
router.get('/:id', getResume);
router.put('/:id', updateResumeProfile);
router.delete('/:id', deleteResume);

// Resume versions
router.get('/versions/:versionId', getVersion);
router.put('/versions/:versionId/primary', setPrimary);
router.delete('/versions/:versionId', deleteVersion);
router.get('/versions/:versionId/download.pdf', downloadVersionPdf);

export default router;
