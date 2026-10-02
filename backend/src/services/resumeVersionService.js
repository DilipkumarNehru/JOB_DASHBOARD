import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const buildPdfFromProfile = async (profile, targetCompany) => {
  const dir = path.resolve(__dirname, '../../generated');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${Date.now()}-${(targetCompany || 'resume').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 48, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(22).fillColor('#111827').text(profile.name || 'Candidate', { align: 'left' });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#374151')
        .text([profile.email, profile.phone, profile.location].filter(Boolean).join('  |  '));
      doc.moveDown(0.8);
      doc.moveTo(48, doc.y).lineTo(552, doc.y).lineWidth(1).strokeColor('#e5e7eb').stroke();
      doc.moveDown(0.8);

      if (profile.summary) {
        doc.fontSize(12).fillColor('#111827').text('PROFESSIONAL SUMMARY');
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#374151').text(profile.summary, { lineGap: 3 });
        doc.moveDown(0.6);
      }

      const skills = profile.skills || [];
      if (skills.length) {
        doc.fontSize(12).fillColor('#111827').text('SKILLS');
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#374151').text(skills.join('  •  '), { lineGap: 3 });
        doc.moveDown(0.6);
      }

      const companies = profile.companies || [];
      if (companies.length) {
        doc.fontSize(12).fillColor('#111827').text('EXPERIENCE');
        doc.moveDown(0.3);
        for (const c of companies) {
          doc.fontSize(10).fillColor('#111827').text(`${c.role || 'Role'} — ${c.name || c.company || ''}`, { lineGap: 2 });
          if (c.startDate || c.endDate) {
            doc.fontSize(9).fillColor('#6b7280').text([c.startDate, c.endDate].filter(Boolean).join('  to  '));
          }
          for (const h of (c.highlights || [])) {
            doc.fontSize(10).fillColor('#374151').text(`  •  ${h}`, { lineGap: 2 });
          }
          doc.moveDown(0.4);
        }
      }

      const projects = profile.projects || [];
      if (projects.length) {
        doc.fontSize(12).fillColor('#111827').text('PROJECTS');
        doc.moveDown(0.3);
        for (const p of projects) {
          doc.fontSize(10).fillColor('#111827').text(p.title || 'Project');
          for (const h of (p.highlights || [])) {
            doc.fontSize(10).fillColor('#374151').text(`  •  ${h}`, { lineGap: 2 });
          }
          if (p.technologies && p.technologies.length) {
            doc.fontSize(9).fillColor('#6b7280').text(`Tech: ${p.technologies.join(', ')}`);
          }
          doc.moveDown(0.4);
        }
      }

      const education = profile.education || [];
      if (education.length) {
        doc.fontSize(12).fillColor('#111827').text('EDUCATION');
        doc.moveDown(0.3);
        for (const e of education) {
          doc.fontSize(10).fillColor('#374151')
            .text(`${e.degree || ''}${e.institution ? ' — ' + e.institution : ''}${e.year ? ' (' + e.year + ')' : ''}`);
        }
      }

      const certifications = profile.certifications || [];
      if (certifications.length) {
        doc.moveDown(0.6);
        doc.fontSize(12).fillColor('#111827').text('CERTIFICATIONS');
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#374151').text(certifications.join('  •  '));
      }

      if (!profile.summary && !skills.length && !companies.length && rawText) {
        doc.moveDown(0.6);
        doc.fontSize(12).fillColor('#111827').text('RESUME CONTENT');
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#374151').text(rawText, { lineGap: 2 });
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
      spacing: { after: 100 },
    })
  );

  // Contact line
  const contactParts = [profile.email, profile.phone, profile.location].filter(Boolean);
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
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Technologies: ${p.technologies.join(', ')}`, italics: true, size: 19, color: '6B7280' })],
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
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${cert}`, size: 21, color: '374151' })],
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