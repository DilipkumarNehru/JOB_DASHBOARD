import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_THEMES = {
  modern: {
    primary: '#1e40af', // royal/indigo blue
    secondary: '#1e293b',
    body: '#334155',
    accent: '#3b82f6',
    divider: '#93c5fd',
  },
  executive: {
    primary: '#0f172a', // deep navy slate
    secondary: '#1e293b',
    body: '#334155',
    accent: '#475569',
    divider: '#cbd5e1',
  },
  minimal: {
    primary: '#18181b', // pure crisp black/zinc
    secondary: '#27272a',
    body: '#3f3f46',
    accent: '#71717a',
    divider: '#e4e4e7',
  },
  creative: {
    primary: '#047857', // emerald green
    secondary: '#064e3b',
    body: '#334155',
    accent: '#10b981',
    divider: '#a7f3d0',
  },
  fresher: {
    primary: '#6d28d9', // vibrant violet
    secondary: '#4c1d95',
    body: '#334155',
    accent: '#8b5cf6',
    divider: '#ddd6fe',
  },
  datascience: {
    primary: '#0369a1', // rich sky-blue
    secondary: '#0c4a6e',
    body: '#334155',
    accent: '#0ea5e9',
    divider: '#7dd3fc',
  },
  sales: {
    primary: '#b45309', // warm amber-orange
    secondary: '#78350f',
    body: '#334155',
    accent: '#f59e0b',
    divider: '#fcd34d',
  },
  devops: {
    primary: '#0f766e', // deep teal
    secondary: '#134e4a',
    body: '#334155',
    accent: '#14b8a6',
    divider: '#99f6e4',
  },
  healthcare: {
    primary: '#be123c', // crimson rose
    secondary: '#881337',
    body: '#334155',
    accent: '#f43f5e',
    divider: '#fda4af',
  },
  accounting: {
    primary: '#1d4ed8', // classic corporate blue
    secondary: '#1e3a5f',
    body: '#334155',
    accent: '#3b82f6',
    divider: '#bfdbfe',
  },
  fresher_it: {
    primary: '#c2410c', // bold orange
    secondary: '#7c2d12',
    body: '#334155',
    accent: '#f97316',
    divider: '#fed7aa',
  },
  fresher_nonit: {
    primary: '#4338ca', // indigo
    secondary: '#312e81',
    body: '#334155',
    accent: '#6366f1',
    divider: '#c7d2fe',
  },
};

export const buildPdfFromProfile = async (profile = {}, targetCompany = 'resume', rawText = '', templateId = 'modern') => {
  const dir = path.resolve(__dirname, '../../generated');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${Date.now()}-${(targetCompany || 'resume').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);

  const tid = profile.templateId || templateId || 'modern';
  const theme = TEMPLATE_THEMES[tid] || TEMPLATE_THEMES.modern;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 44, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Name & Title
      doc.fontSize(22).fillColor(theme.primary).text(profile.name || 'Candidate', { align: 'left' });
      if (profile.title) {
        doc.moveDown(0.2);
        doc.fontSize(11).fillColor(theme.accent).text(profile.title, { align: 'left' });
      }

      // Contact Info
      doc.moveDown(0.3);
      const contactItems = [
        profile.email,
        profile.phone,
        profile.location,
        profile.linkedin,
        profile.github,
        profile.website
      ].filter(Boolean);
      doc.fontSize(9).fillColor(theme.body).text(contactItems.join('   |   '));

      // Divider Line
      doc.moveDown(0.6);
      doc.moveTo(44, doc.y).lineTo(550, doc.y).lineWidth(1.5).strokeColor(theme.divider).stroke();
      doc.moveDown(0.8);

      // Professional Summary
      if (profile.summary) {
        doc.fontSize(12).fillColor(theme.primary).text('PROFESSIONAL SUMMARY');
        doc.moveDown(0.25);
        doc.fontSize(9.5).fillColor(theme.body).text(profile.summary, { lineGap: 3 });
        doc.moveDown(0.7);
      }

      // Skills
      const skills = profile.skills || [];
      if (skills.length) {
        doc.fontSize(12).fillColor(theme.primary).text('SKILLS');
        doc.moveDown(0.25);
        doc.fontSize(9.5).fillColor(theme.body).text(skills.join('   •   '), { lineGap: 3 });
        doc.moveDown(0.7);
      }

      // Experience
      const companies = profile.companies || [];
      if (companies.length) {
        doc.fontSize(12).fillColor(theme.primary).text('WORK EXPERIENCE');
        doc.moveDown(0.3);
        for (const c of companies) {
          const roleTitle = c.role || 'Position';
          const companyName = c.name || c.company || '';
          doc.fontSize(10.5).fillColor(theme.secondary).text(`${roleTitle}${companyName ? ` — ${companyName}` : ''}`, { lineGap: 2 });
          
          const dateLocation = [
            [c.startDate, c.endDate || (c.current ? 'Present' : '')].filter(Boolean).join(' - '),
            c.location
          ].filter(Boolean).join('   |   ');

          if (dateLocation) {
            doc.fontSize(8.5).fillColor('#64748b').text(dateLocation);
          }
          for (const h of (c.highlights || [])) {
            doc.fontSize(9.5).fillColor(theme.body).text(`  •  ${h}`, { lineGap: 2 });
          }
          doc.moveDown(0.5);
        }
      }

      // Projects
      const projects = profile.projects || [];
      if (projects.length) {
        doc.fontSize(12).fillColor(theme.primary).text('PROJECTS');
        doc.moveDown(0.3);
        for (const p of projects) {
          doc.fontSize(10.5).fillColor(theme.secondary).text(p.title || 'Project');
          if (p.technologies && p.technologies.length) {
            doc.fontSize(8.5).fillColor('#64748b').text(`Technologies: ${Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies}`);
          }
          for (const h of (p.highlights || [])) {
            doc.fontSize(9.5).fillColor(theme.body).text(`  •  ${h}`, { lineGap: 2 });
          }
          doc.moveDown(0.5);
        }
      }

      // Education
      const education = profile.education || [];
      if (education.length) {
        doc.fontSize(12).fillColor(theme.primary).text('EDUCATION');
        doc.moveDown(0.3);
        for (const e of education) {
          const deg = e.degree || '';
          const inst = e.institution ? ` — ${e.institution}` : '';
          const yr = e.year ? ` (${e.year})` : '';
          doc.fontSize(9.5).fillColor(theme.body).text(`${deg}${inst}${yr}`);
          if (e.details) {
            doc.fontSize(8.5).fillColor('#64748b').text(`  ${e.details}`);
          }
        }
        doc.moveDown(0.7);
      }

      // Certifications
      const certifications = profile.certifications || [];
      if (certifications.length) {
        doc.fontSize(12).fillColor(theme.primary).text('CERTIFICATIONS');
        doc.moveDown(0.3);
        doc.fontSize(9.5).fillColor(theme.body).text(
          certifications.map(c => typeof c === 'string' ? c : (c.name || '')).filter(Boolean).join('   •   ')
        );
      }

      // RawText fallback
      if (!profile.summary && !skills.length && !companies.length && rawText) {
        doc.moveDown(0.6);
        doc.fontSize(12).fillColor(theme.primary).text('RESUME CONTENT');
        doc.moveDown(0.3);
        doc.fontSize(9.5).fillColor(theme.body).text(rawText, { lineGap: 2 });
      }

      doc.end();
      stream.on('finish', () => {
        try {
          const buffer = fs.readFileSync(filePath);
          resolve({ filePath, buffer });
        } catch (_) {
          resolve({ filePath, buffer: null });
        }
      });
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

export const buildPdfFromCustomized = async (customizedProfile) => {
  const dir = path.resolve(__dirname, '../../generated');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${Date.now()}-customized-resume.pdf`);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 48, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(14).fillColor('#111827').text('CUSTOMIZED RESUME DRAFT');
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor('#374151').text(customizedProfile.summary || '', { lineGap: 3 });
      doc.moveDown(0.3);

      if (customizedProfile.reorderedSkills && customizedProfile.reorderedSkills.length) {
        doc.fontSize(11).fillColor('#111827').text('SKILLS (reordered for relevance)');
        doc.fontSize(10).fillColor('#374151').text(customizedProfile.reorderedSkills.join('  •  '));
      }

      if (customizedProfile.tailoredHighlights && customizedProfile.tailoredHighlights.length) {
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('#111827').text('EXPERIENCE');
        for (const h of customizedProfile.tailoredHighlights) {
          doc.fontSize(10).fillColor('#374151').text(`${h.role} — ${h.company}`);
          for (const b of (h.bullets || [])) doc.fontSize(10).text(`  •  ${b}`);
          doc.moveDown(0.2);
        }
      }

      if (customizedProfile.tailoredProjects && customizedProfile.tailoredProjects.length) {
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('#111827').text('PROJECTS');
        for (const p of customizedProfile.tailoredProjects) {
          doc.fontSize(10).fillColor('#374151').text(p.title || 'Project');
          for (const hd of (p.highlights || [])) doc.fontSize(10).text(`  •  ${hd}`);
          doc.moveDown(0.2);
        }
      }

      doc.moveDown(0.6);
      doc.fontSize(8).fillColor('#9ca3af').text('Generated as a draft by Job Dashboard AI. Review before use.');

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

export const buildDocxFromProfile = async (profile = {}, rawText = '', targetName = 'resume') => {
  const dir = path.resolve(__dirname, '../../generated');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safeName = (targetName || 'resume').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const filePath = path.join(dir, `${Date.now()}-${safeName}.docx`);

  const children = [];

  // Name
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: profile.name || 'Candidate Resume',
          bold: true,
          size: 32,
          color: '111827',
        }),
      ],
      spacing: { after: 60 },
    })
  );

  // Title if present
  if (profile.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: profile.title,
            bold: true,
            size: 22,
            color: '2563EB',
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // Contact line
  const contactParts = [
    profile.email,
    profile.phone,
    profile.location,
    profile.linkedin,
    profile.github,
    profile.website
  ].filter(Boolean);
  if (contactParts.length) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 20,
            color: '4B5563',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Summary
  if (profile.summary) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 24, color: '1F2937' })],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: profile.summary, size: 21, color: '374151' })],
        spacing: { after: 200 },
      })
    );
  }

  // Skills
  const skills = profile.skills || [];
  if (skills.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'SKILLS', bold: true, size: 24, color: '1F2937' })],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: skills.join('  •  '), size: 21, color: '374151' })],
        spacing: { after: 200 },
      })
    );
  }

  // Experience
  const companies = profile.companies || [];
  if (companies.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'PROFESSIONAL EXPERIENCE', bold: true, size: 24, color: '1F2937' })],
        spacing: { before: 200, after: 100 },
      })
    );
    for (const c of companies) {
      const titleLine = [c.role, c.name || c.company].filter(Boolean).join(' — ');
      children.push(
        new Paragraph({
          children: [new TextRun({ text: titleLine || 'Role', bold: true, size: 22, color: '111827' })],
          spacing: { before: 100, after: 50 },
        })
      );
      if (c.startDate || c.endDate) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: [c.startDate, c.endDate].filter(Boolean).join(' to '), italics: true, size: 19, color: '6B7280' })],
            spacing: { after: 50 },
          })
        );
      }
      for (const h of (c.highlights || [])) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${h}`, size: 20, color: '374151' })],
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  // Projects
  const projects = profile.projects || [];
  if (projects.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'PROJECTS', bold: true, size: 24, color: '1F2937' })],
        spacing: { before: 200, after: 100 },
      })
    );
    for (const p of projects) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: p.title || 'Project', bold: true, size: 22, color: '111827' })],
          spacing: { before: 80, after: 40 },
        })
      );
      if (p.technologies && p.technologies.length) {
        const techStr = Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies;
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Technologies: ${techStr}`, italics: true, size: 19, color: '6B7280' })],
            spacing: { after: 40 },
          })
        );
      }
      for (const h of (p.highlights || [])) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${h}`, size: 20, color: '374151' })],
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  // Education
  const education = profile.education || [];
  if (education.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'EDUCATION', bold: true, size: 24, color: '1F2937' })],
        spacing: { before: 200, after: 100 },
      })
    );
    for (const e of education) {
      const eduText = [e.degree, e.institution].filter(Boolean).join(' — ') + (e.year ? ` (${e.year})` : '');
      children.push(
        new Paragraph({
          children: [new TextRun({ text: eduText, size: 21, color: '374151' })],
          spacing: { after: 60 },
        })
      );
    }
  }

  // Certifications
  const certifications = profile.certifications || [];
  if (certifications.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 24, color: '1F2937' })],
        spacing: { before: 200, after: 100 },
      })
    );
    for (const cert of certifications) {
      const certText = typeof cert === 'string' ? cert : (cert.name || '');
      if (!certText) continue;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${certText}`, size: 21, color: '374151' })],
          spacing: { after: 40 },
        })
      );
    }
  }

  // Fallback if structured sections are empty but rawText exists
  if (!profile.summary && !skills.length && !companies.length && rawText) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'RESUME CONTENT', bold: true, size: 24, color: '1F2937' })],
        spacing: { before: 200, after: 100 },
      })
    );
    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 21, color: '374151' })],
          spacing: { after: 50 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  return { filePath, buffer };
};