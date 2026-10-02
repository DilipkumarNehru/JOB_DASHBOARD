import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import {
  Upload, FileText, Sparkles, Download, Trash2,
  Star, Eye, ChevronRight, RefreshCw,
  Info, Pencil, BarChart3, X, FileCheck, Clock, Crown, Edit3, Check, FileType
} from 'lucide-react';
import { resumeService } from '../services';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { formatDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── helpers ──────────────────────────────────────────────────── */
const scoreColor = (s) => {
  if (s >= 80) return { ring: '#22c55e', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent' };
  if (s >= 60) return { ring: '#3b82f6', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Good' };
  if (s >= 40) return { ring: '#f59e0b', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Fair' };
  return { ring: '#ef4444', text: 'text-red-600', bg: 'bg-red-50', label: 'Weak' };
};
const catColor = (score, max) => {
  const pct = score / max;
  if (pct >= 0.8) return 'bg-emerald-500';
  if (pct >= 0.5) return 'bg-blue-500';
  if (pct >= 0.25) return 'bg-amber-500';
  return 'bg-red-400';
};
const fileExt = (name = '') => (name.split('.').pop() || '?').toUpperCase();
const extFromMime = (mimeType = '') => {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('wordprocessingml') || mimeType.includes('docx')) return 'docx';
  if (mimeType.includes('msword')) return 'doc';
  if (mimeType.includes('text/plain')) return 'txt';
  if (mimeType.includes('rtf')) return 'rtf';
  return '';
};
const extColor = (ext) => {
  const e = (ext || '').toLowerCase();
  if (e === 'pdf') return 'bg-red-100 text-red-700';
  if (e === 'docx' || e === 'doc') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
};

/* ─── ATS Score Gauge (SVG circle) ─────────────────────────────── */
function ScoreGauge({ score }) {
  const c = scoreColor(score);
  const r = 54, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <div className="relative flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.ring} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 64 64)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-black ${c.text}`}>{score}</span>
        <span className="text-xs font-semibold text-slate-400">/100</span>
      </div>
    </div>
  );
}

function AtsPanel({ resume, onClose, onScoreUpdated }) {
  const [ats, setAts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  useEffect(() => {
    resumeService.atsScore(resume._id)
      .then(r => {
        setAts(r);
        if (r && r.atsScore !== undefined && onScoreUpdated) {
          onScoreUpdated(resume._id, r.atsScore);
        }
      })
      .catch(e => toast.error(e.message || 'Failed to load ATS score'))
      .finally(() => setLoading(false));
  }, [resume._id]);
  const c = ats ? scoreColor(ats.atsScore) : null;
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="font-bold text-slate-900">ATS Score Report</p>
            <p className="text-xs text-slate-500 truncate max-w-xs">{resume.resumeName || resume.originalFileName || resume.originalName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Analyzing resume…</p>
          </div>
        ) : ats ? (
          <div className="flex-1 space-y-5 p-5">
            <div className={`flex flex-col items-center gap-2 rounded-2xl p-6 ${c.bg}`}>
              <ScoreGauge score={ats.atsScore} />
              <span className={`text-sm font-bold ${c.text}`}>{c.label} Resume Quality</span>
              <p className="text-center text-xs text-slate-500">Resume completeness score: <strong>{ats.atsScore}/100</strong></p>
              <p className="text-center text-xs text-slate-400">Job-specific ATS scores are shown on each job card</p>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Score Breakdown</p>
              <div className="space-y-3">
                {(ats.categories || []).map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{cat.label}</span>
                      <span className="text-slate-500">{cat.score}/{cat.max}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${catColor(cat.score, cat.max)} transition-all duration-700`}
                        style={{ width: `${(cat.score / cat.max) * 100}%` }} />
                    </div>
                    {cat.score < cat.max && <p className="mt-0.5 text-xs text-slate-400">{cat.tip}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <button onClick={() => setAiOpen(!aiOpen)}
                className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-semibold text-violet-800">AI Recommendations</span>
                  <Badge className="bg-violet-600 text-white">{(ats.aiRecommendations || []).length}</Badge>
                </div>
                <ChevronRight className={`h-4 w-4 text-violet-500 transition-transform ${aiOpen ? 'rotate-90' : ''}`} />
              </button>
              {aiOpen && (
                <div className="mt-2 space-y-2">
                  {(ats.aiRecommendations || []).map((rec, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{i + 1}</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link to={`/resumes/${resume._id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors">
              <Pencil className="h-4 w-4" /> Edit Resume Profile
            </Link>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">Could not load ATS data.</div>
        )}
      </div>
    </div>
  );
}

/* ─── Preview Modal ─────────────────────────────────────────────── */
function PreviewModal({ resume, onClose }) {
  const fileType = extFromMime(resume.mimeType) || fileExt(resume.originalFileName || resume.originalName).toLowerCase();
  const isPdf = fileType === 'pdf';
  const token = localStorage.getItem('jd_token');
  const fileUrl = `${resumeService.fileUrl(resume._id)}?token=${token}`;
  const displayName = resume.resumeName || resume.originalFileName || resume.originalName || 'Resume';
  const baseName = (displayName || 'resume').replace(/\.[^/.]+$/, '');

  const [viewMode, setViewMode] = useState(isPdf ? 'pdf' : 'doc');
  const [htmlContent, setHtmlContent] = useState('');
  const [loadingHtml, setLoadingHtml] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingHtml(true);
    resumeService.previewHtml(resume._id)
      .then(res => {
        if (mounted && res && res.html) {
          setHtmlContent(res.html);
        }
      })
      .catch(e => console.warn('Preview html fetch error:', e.message))
      .finally(() => {
        if (mounted) setLoadingHtml(false);
      });
    return () => { mounted = false; };
  }, [resume._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-5 py-3 gap-2">
          <div className="flex items-center gap-3">
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${extColor(fileType)}`}>
              {fileType || 'DOC'}
            </span>
            <div>
              <p className="font-semibold text-slate-800 truncate max-w-xs">{displayName}</p>
              <p className="text-xs text-slate-400">
                {resume.fileSize ? `${(resume.fileSize / 1024).toFixed(0)} KB` : ''} · {isPdf ? 'PDF Document' : 'Word / Formatted Document'}
              </p>
            </div>
          </div>

          {/* View mode toggle tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {isPdf && (
              <button
                onClick={() => setViewMode('pdf')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === 'pdf' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PDF View
              </button>
            )}
            <button
              onClick={() => setViewMode('doc')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'doc' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Preview
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isPdf && (
              <a href={fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                <Eye className="h-3.5 w-3.5" /> Open tab
              </a>
            )}
            <a href={resumeService.downloadDocx(resume._id)}
              download={`${baseName}.docx`}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm">
              <Download className="h-3.5 w-3.5" /> Word (.docx)
            </a>
            <a href={resumeService.downloadPdf(resume._id)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm">
              <Download className="h-3.5 w-3.5" /> PDF
            </a>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          {viewMode === 'pdf' && isPdf ? (
            <iframe src={fileUrl} className="h-full w-full border-0 bg-white" title={`Preview: ${displayName}`} />
          ) : (
            <div className="h-full w-full overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-200/70">
              {loadingHtml ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-600">Rendering document preview…</p>
                </div>
              ) : htmlContent ? (
                <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl p-8 md:p-12 border border-slate-300 min-h-[600px] text-slate-800">
                  <div
                    className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="h-16 w-16 text-slate-400 mb-2" />
                  <p className="font-bold text-slate-700">Preview could not be rendered</p>
                  <p className="text-xs text-slate-500 mt-1">You can download the file directly in Word (.docx) or PDF format.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Word / PDF Conversion & In-App Edit Modal ─────────────────── */
function WordConvertModal({ resume, onClose, onResumeSaved }) {
  const prof = resume.parsedProfile || {};
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' | 'raw'
  const [format, setFormat] = useState('docx'); // 'docx' | 'pdf'
  const [saveOption, setSaveOption] = useState('existing'); // 'existing' | 'new'

  const currentDisplayName = resume.resumeName || resume.originalFileName || resume.originalName || 'Resume';
  const baseName = currentDisplayName.replace(/\.[^/.]+$/, '');
  const [newName, setNewName] = useState(`${baseName}_edited.docx`);

  // Editable fields
  const [name, setName] = useState(prof.name || '');
  const [email, setEmail] = useState(prof.email || '');
  const [phone, setPhone] = useState(prof.phone || '');
  const [location, setLocation] = useState(prof.location || '');
  const [summary, setSummary] = useState(prof.summary || '');
  const [skills, setSkills] = useState((prof.skills || []).join(', '));
  const [experienceYears, setExperienceYears] = useState(prof.experienceYears || 0);
  const [rawText, setRawText] = useState(resume.rawText || '');

  const [saving, setSaving] = useState(false);

  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    setNewName((prev) => {
      const stripped = prev.replace(/\.[^/.]+$/, '');
      return `${stripped}.${newFormat}`;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const isNew = saveOption === 'new';
      const targetName = isNew ? newName.trim() : (format === 'pdf' && !currentDisplayName.toLowerCase().endsWith('.pdf') ? `${baseName}.pdf` : currentDisplayName);

      const payload = {
        format,
        saveAsNew: isNew,
        resumeName: targetName,
        newResumeName: targetName,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        summary: summary.trim(),
        skills: skillsArray,
        experienceYears: Number(experienceYears) || 0,
        rawText,
        companies: prof.companies || [],
        education: prof.education || [],
        projects: prof.projects || [],
        certifications: prof.certifications || [],
      };

      const res = await resumeService.convertAndSave(resume._id, payload);
      toast.success(res.message || `Saved successfully as ${format.toUpperCase()}!`);
      if (onResumeSaved) {
        onResumeSaved(res.resume, isNew);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to convert and save resume');
    } finally {
      setSaving(false);
    }
  };

  const downloadDocxUrl = resumeService.downloadDocx(resume._id);
  const downloadPdfUrl = resumeService.downloadPdf(resume._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative flex flex-col w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden my-8 max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/60 to-purple-50/70">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-black text-xs shadow ${format === 'pdf' ? 'bg-rose-600' : 'bg-blue-600'}`}>
              {format.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Edit &amp; Convert Resume</p>
              <p className="text-xs text-slate-500">
                Source: <span className="font-semibold text-slate-700">{currentDisplayName}</span> ({fileExt(resume.originalFileName || resume.originalName)})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadDocxUrl}
              download={`${baseName}.docx`}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Word (.docx)
            </a>
            <a
              href={downloadPdfUrl}
              className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </a>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-2 bg-slate-50/60">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('fields')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'fields'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Structured Sections
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'raw'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Raw Document Text
            </button>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Choose format (PDF or Word) below after editing
          </span>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'fields' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Full Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / City</label>
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. New York, NY (or Remote)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Professional Summary</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Summary of experience, technical background, and achievements..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Skills (comma-separated)</label>
                  <span className="text-[11px] text-slate-400">Used for ATS scoring and job matching</span>
                </div>
                <textarea
                  rows={2}
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="Node.js, React, TypeScript, Docker, PostgreSQL, REST APIs..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={e => setExperienceYears(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Raw Document Content</label>
              <p className="text-xs text-slate-500 mb-2">Edit or paste the full resume text below. This text is compiled into the selected document format.</p>
              <textarea
                rows={12}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste or type full resume text here..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Format selection section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Select Target Format</p>
              <p className="text-xs text-slate-500 mt-0.5">Which format would you like to save this edited resume as?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleFormatChange('docx')}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  format === 'docx'
                    ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs">
                  DOCX
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">Word Document (.docx)</p>
                  <p className="text-[11px] text-slate-500">Editable Microsoft Word formatted file</p>
                </div>
                <input
                  type="radio"
                  name="editFormat"
                  checked={format === 'docx'}
                  onChange={() => handleFormatChange('docx')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </div>

              <div
                onClick={() => handleFormatChange('pdf')}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  format === 'pdf'
                    ? 'border-rose-500 bg-rose-50/70 shadow-sm ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-xs">
                  PDF
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">PDF Document (.pdf)</p>
                  <p className="text-[11px] text-slate-500">Universal, ATS-compliant PDF document</p>
                </div>
                <input
                  type="radio"
                  name="editFormat"
                  checked={format === 'pdf'}
                  onChange={() => handleFormatChange('pdf')}
                  className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Save destination options */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-900">2. Saving Options</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="saveOption"
                  checked={saveOption === 'existing'}
                  onChange={() => setSaveOption('existing')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800">Save with current name (Update existing resume)</span>
                  <p className="text-xs text-slate-500">Overwrites <span className="font-semibold">{currentDisplayName}</span> with the converted {format.toUpperCase()} document and re-scores matches.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="saveOption"
                  checked={saveOption === 'new'}
                  onChange={() => setSaveOption('new')}
                  className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-800">Save as New Resume</span>
                  <p className="text-xs text-slate-500 mb-2">Creates an additional {format.toUpperCase()} resume entry with a new name, leaving the original intact.</p>
                  {saveOption === 'new' && (
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder={`e.g. My_Edited_Resume.${format}`}
                      className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-semibold text-blue-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition-colors shadow-md disabled:opacity-50 ${
                format === 'pdf' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving &amp; Converting…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {saveOption === 'new' ? `Save as New Resume (.${format})` : `Save Changes (.${format})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dedicated PDF Conversion Modal ────────────────────────────── */
function PdfConvertModal({ resume, onClose, onResumeConverted }) {
  const currentDisplayName = resume.resumeName || resume.originalFileName || resume.originalName || 'Resume';
  const baseName = currentDisplayName.replace(/\.[^/.]+$/, '');
  const [saveOption, setSaveOption] = useState('new'); // 'new' | 'replace'
  const [pdfName, setPdfName] = useState(`${baseName}.pdf`);
  const [converting, setConverting] = useState(false);

  const handleConvert = async () => {
    setConverting(true);
    try {
      const isNew = saveOption === 'new';
      const targetName = isNew ? pdfName.trim() : `${baseName}.pdf`;
      const res = await resumeService.convertAndSavePdf(resume._id, {
        saveAsNew: isNew,
        resumeName: targetName,
        newResumeName: targetName,
      });
      toast.success(res.message || 'Successfully converted to PDF!');
      if (onResumeConverted) {
        onResumeConverted(res.resume, isNew);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to convert to PDF');
    } finally {
      setConverting(false);
    }
  };

  const downloadPdfUrl = resumeService.downloadPdf(resume._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative flex flex-col w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-rose-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-sm shadow">
              PDF
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Convert to PDF</p>
              <p className="text-xs text-slate-500">
                Source: <span className="font-semibold text-slate-700">{currentDisplayName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Convert your Word/DOCX resume to a clean, ATS-compliant PDF.</p>
            <p className="text-slate-500">Candidate skills, experience, summary, and contact information are compiled into standard PDF format with updated job match scoring.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Select Conversion Action</label>

            {/* Option 1: Save as New PDF */}
            <div
              onClick={() => setSaveOption('new')}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                saveOption === 'new'
                  ? 'border-rose-400 bg-rose-50/50 shadow-sm ring-1 ring-rose-400'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="pdfSaveOption"
                  checked={saveOption === 'new'}
                  onChange={() => setSaveOption('new')}
                  className="h-4 w-4 mt-1 text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-900">Create New PDF Resume (Recommended)</span>
                  <p className="text-xs text-slate-500 mt-0.5">Keeps your existing Word resume intact and adds a new PDF resume entry to your dashboard.</p>
                  {saveOption === 'new' && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">New PDF File Name</label>
                      <input
                        value={pdfName}
                        onChange={e => setPdfName(e.target.value)}
                        placeholder="e.g. My_Resume.pdf"
                        className="w-full rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Option 2: Replace Existing */}
            <div
              onClick={() => setSaveOption('replace')}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                saveOption === 'replace'
                  ? 'border-rose-400 bg-rose-50/50 shadow-sm ring-1 ring-rose-400'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="pdfSaveOption"
                  checked={saveOption === 'replace'}
                  onChange={() => setSaveOption('replace')}
                  className="h-4 w-4 mt-1 text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-900">Replace Current Resume with PDF</span>
                  <p className="text-xs text-slate-500 mt-0.5">Directly converts this resume into PDF format and updates the existing resume entry.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <a
              href={downloadPdfUrl}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Download PDF Only
            </a>
            <button
              onClick={handleConvert}
              disabled={converting}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-700 transition-colors shadow-md disabled:opacity-50"
            >
              {converting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Converting to PDF…
                </>
              ) : (
                <>
                  <FileType className="h-4 w-4" />
                  {saveOption === 'new' ? 'Convert & Save as New PDF' : 'Convert & Replace with PDF'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Resume Name Edit inline ───────────────────────────────────── */
function ResumeNameEdit({ resume, onNameUpdated }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(resume.resumeName || resume.originalFileName);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await resumeService.updateName(resume._id, name.trim());
      onNameUpdated(resume._id, name.trim());
      setEditing(false);
      toast.success('Resume name updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="border border-blue-300 rounded px-2 py-0.5 text-sm font-bold text-slate-900 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        />
        <button onClick={save} disabled={saving} className="p-1 text-emerald-600 hover:text-emerald-700">
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group/name">
      <p className="truncate font-bold text-slate-900">{resume.resumeName || resume.originalName || resume.originalFileName}</p>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover/name:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 transition-opacity"
        title="Rename resume"
      >
        <Edit3 className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ─── Single resume card ────────────────────────────────────────── */
function ResumeCard({ resume, onDelete, onAnalyze, analyzingId, onAts, onPreview, onSetPrimary, settingPrimaryId, onNameUpdated, onWordEdit, onPdfConvert }) {
  const prof = resume.parsedProfile || {};
  const score = resume.atsScore;
  return (
    <div className={`group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-lg
      ${resume.isPrimary ? 'border-blue-300 ring-2 ring-blue-500/20 bg-gradient-to-br from-blue-50/30 to-white' : 'border-slate-200'}`}>

      {/* Primary badge */}
      {resume.isPrimary && (
        <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-0.5 text-xs font-bold text-white shadow">
          <Crown className="h-3 w-3 fill-white" /> PRIMARY
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${resume.isPrimary ? 'bg-blue-100' : 'bg-slate-100'}`}>
          <FileText className={`h-6 w-6 ${resume.isPrimary ? 'text-blue-600' : 'text-slate-500'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ResumeNameEdit resume={resume} onNameUpdated={onNameUpdated} />
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${extColor(resume.fileType)}`}>
              {fileExt(resume.originalName)} </span>
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${extColor(extFromMime(resume.mimeType))}`}>
              {fileExt(resume.originalFileName)}
            </span>
          </div>
          {/* Profile domain tag */}
          {prof.profile && (
            <span className="mt-0.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              {prof.profile}
            </span>
          )}
          <p className="mt-0.5 text-xs text-slate-500">{prof.name || 'Unknown'} · {prof.email || '—'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(resume.createdAt)}</span>
            {(prof.skills || []).length > 0 && <span>· {prof.skills.length} skills</span>}
            {prof.experienceYears > 0 && <span>· {prof.experienceYears} yrs exp</span>}
          </div>
        </div>
        {score !== null && score !== undefined ? (
          <div className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-1.5 ${scoreColor(score).bg}`}>
            <span className={`text-xl font-black ${scoreColor(score).text}`}>{score}</span>
            <span className={`text-[9px] font-semibold uppercase ${scoreColor(score).text}`}>Quality</span>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col items-center rounded-xl bg-slate-100 px-3 py-1.5">
            <span className="text-xl font-black text-slate-400">—</span>
            <span className="text-[9px] font-semibold uppercase text-slate-400">Quality</span>
          </div>
        )}
      </div>

      {(prof.skills || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prof.skills.slice(0, 8).map((s) => (
            <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{s}</span>
          ))}
          {prof.skills.length > 8 && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">+{prof.skills.length - 8} more</span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {/* Set as Primary button — only on non-primary */}
        {!resume.isPrimary && (
          <button
            onClick={() => onSetPrimary(resume._id)}
            disabled={settingPrimaryId === resume._id}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {settingPrimaryId === resume._id
              ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Setting…</>
              : <><Star className="h-3.5 w-3.5" /> Set as Primary</>}
          </button>
        )}
        {resume.isPrimary && (
          <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <Crown className="h-3.5 w-3.5" /> Primary Resume
          </div>
        )}

        <button onClick={() => onPreview(resume)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        <button onClick={() => onAts(resume)}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
          <BarChart3 className="h-3.5 w-3.5" /> Quality Score
        </button>
        <Link to={`/resumes/${resume._id}`}
          className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Link>
        <button onClick={() => onAnalyze(resume._id)} disabled={analyzingId === resume._id}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50">
          {analyzingId === resume._id
            ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analyzing…</>
            : <><Sparkles className="h-3.5 w-3.5" /> {resume.analyzedAt ? 'Re-analyze' : 'Analyze AI'}</>}
        </button>
        <button onClick={() => onWordEdit && onWordEdit(resume)}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
          title="Edit resume and choose format (PDF or DOCX)">
          <Edit3 className="h-3.5 w-3.5 text-indigo-600" /> Edit &amp; Convert
        </button>
        <button onClick={() => onPdfConvert && onPdfConvert(resume)}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm"
          title="Convert this resume to PDF format">
          <FileType className="h-3.5 w-3.5 text-rose-600" /> Convert to PDF
        </button>
        <a href={resumeService.downloadPdf(resume._id)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
        <button onClick={() => onDelete(resume._id)}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Drag-and-drop upload zone ─────────────────────────────────── */
function UploadZone({ onFile, uploading }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };
  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)} onDrop={handleDrop}
      onClick={() => !uploading && fileRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all
        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'}`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${dragging ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <Upload className={`h-6 w-6 ${dragging ? 'text-white' : 'text-slate-500'}`} />
      </div>
      {uploading ? (
        <p className="text-sm font-medium text-blue-600 animate-pulse">Uploading & parsing resume…</p>
      ) : (
        <div>
          <p className="text-sm font-semibold text-slate-800">Drop your resume here, or <span className="text-blue-600">browse</span></p>
          <p className="mt-1 text-xs text-slate-500">PDF, DOC, DOCX, TXT, RTF — up to 10 MB</p>
          <p className="mt-0.5 text-xs text-slate-400">After uploading, rename it (e.g. "Developer Resume") and set it as Primary</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function Resumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);
  const [atsResume, setAtsResume] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [wordModalResume, setWordModalResume] = useState(null);
  const [pdfModalResume, setPdfModalResume] = useState(null);

  const handleResumeSaved = (savedResume, isNew) => {
    if (isNew) {
      setResumes((prev) => [savedResume, ...prev]);
    } else {
      setResumes((prev) => prev.map((r) => r._id === savedResume._id ? savedResume : r));
    }
    fetchResumes();
  };

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await resumeService.getAll();
      setResumes(res.resumes || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const onFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Max 10 MB.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await resumeService.upload(fd);
      toast.success('Resume uploaded & parsed!');
      setResumes((prev) => [res.resume, ...prev.filter((r) => r._id !== res.resume._id)]);
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const analyze = async (id) => {
    setAnalyzingId(id);
    try {
      await resumeService.analyze(id);
      toast.success('Resume re-analyzed with AI');
      fetchResumes();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  const setPrimary = async (id) => {
    setSettingPrimaryId(id);
    try {
      const res = await resumeService.setPrimary(id);
      toast.success(res.message || 'Primary resume updated!');
      // Update local state
      setResumes(prev => prev.map(r => ({ ...r, isPrimary: r._id === id })));
    } catch (err) {
      toast.error(err.message || 'Failed to set primary resume');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this resume? This will also remove its job match data.')) return;
    try {
      await resumeService.delete(id);
      toast.success('Resume deleted');
      setResumes((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleScoreUpdated = (id, newScore) => {
    setResumes((prev) => prev.map((r) => r._id === id ? { ...r, atsScore: newScore } : r));
  };

  const handleNameUpdated = (id, newName) => {
    setResumes((prev) => prev.map((r) => r._id === id ? { ...r, resumeName: newName } : r));
  };

  const primary = resumes.find((r) => r.isPrimary);
  const scored = resumes.filter((r) => r.atsScore !== null && r.atsScore !== undefined);
  const avgScore = scored.length ? Math.round(scored.reduce((a, r) => a + r.atsScore, 0) / scored.length) : null;

  if (loading) return (
    <div className="space-y-4">
      {[0, 1, 2].map(i => <div key={i} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />)}
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={fetchResumes} />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Resumes</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {resumes.length === 0
              ? 'Upload your first resume to get started'
              : `${resumes.length} resume${resumes.length > 1 ? 's' : ''} — Primary resume controls which jobs appear in your Jobs page`}
          </p>
        </div>
        {resumes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
              <FileCheck className="h-3.5 w-3.5 text-blue-500" />
              {resumes.length} resume{resumes.length > 1 ? 's' : ''}
            </div>
            {primary && (
              <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
                <Crown className="h-3.5 w-3.5" />
                Primary: {primary.resumeName || primary.originalFileName}
              </div>
            )}
            {avgScore !== null && (
              <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm ${scoreColor(avgScore).bg} ${scoreColor(avgScore).text}`}>
                <BarChart3 className="h-3.5 w-3.5" />
                Avg Quality: {avgScore}/100
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary resume info banner */}
      {primary && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900">Active Primary Resume: {primary.resumeName || primary.originalFileName}</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Your Jobs page shows jobs matching this resume's skills ({(primary.parsedProfile?.skills || []).slice(0, 5).join(', ')}{(primary.parsedProfile?.skills || []).length > 5 ? '...' : ''}).
                To switch job results, click "Set as Primary" on another resume.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <UploadZone onFile={onFile} uploading={uploading} />

      {/* Resume list */}
      {resumes.length === 0 ? (
        <EmptyState icon="📄" title="No resumes yet"
          description="Upload your resume in any format. It will be parsed by AI, skills extracted, and matched against jobs. You can upload multiple resumes for different career profiles."
          action={null} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              All Resumes ({resumes.length})
            </p>
            <div className="flex-1 border-t border-slate-200" />
            <p className="text-xs text-slate-400">Hover resume name to rename it</p>
          </div>

          {/* Primary first, then others */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Primary resume shown first */}
            {resumes.filter(r => r.isPrimary).map((r) => (
              <ResumeCard key={r._id} resume={r} analyzingId={analyzingId}
                settingPrimaryId={settingPrimaryId}
                onDelete={remove} onAnalyze={analyze}
                onSetPrimary={setPrimary}
                onAts={setAtsResume} onPreview={setPreviewResume}
                onNameUpdated={handleNameUpdated}
                onWordEdit={setWordModalResume}
                onPdfConvert={setPdfModalResume} />
            ))}
            {/* Then secondary resumes */}
            {resumes.filter(r => !r.isPrimary).map((r) => (
              <ResumeCard key={r._id} resume={r} analyzingId={analyzingId}
                settingPrimaryId={settingPrimaryId}
                onDelete={remove} onAnalyze={analyze}
                onSetPrimary={setPrimary}
                onAts={setAtsResume} onPreview={setPreviewResume}
                onNameUpdated={handleNameUpdated}
                onWordEdit={setWordModalResume}
                onPdfConvert={setPdfModalResume} />
            ))}
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-bold text-slate-700">How multi-resume matching works</p>
        </div>
        <ul className="space-y-1.5 text-xs text-slate-600 pl-5 list-disc">
          <li><strong>All resumes</strong> participate in job discovery — jobs matching any resume count toward "Total Jobs Found"</li>
          <li><strong>Primary resume</strong> controls which jobs appear in your Jobs page and dashboard</li>
          <li>Each job has a separate ATS score per resume (e.g. Developer Resume vs Accounts Resume)</li>
          <li>Changing the primary resume immediately updates your job recommendations</li>
          <li>Rename your resumes (e.g. "Developer Resume", "Accounts Resume") for clarity</li>
          <li>Convert and edit any resume in Word (.docx) or PDF format with instant formatting, previewing, and flexible saving options</li>
          <li>Use the dedicated <strong>Convert to PDF</strong> button on any Word/DOCX resume to generate clean ATS-compliant PDF resumes</li>
        </ul>
      </div>

      {/* Overlays */}
      {atsResume && <AtsPanel resume={atsResume} onClose={() => setAtsResume(null)} onScoreUpdated={handleScoreUpdated} />}
      {previewResume && <PreviewModal resume={previewResume} onClose={() => setPreviewResume(null)} />}
      {wordModalResume && <WordConvertModal resume={wordModalResume} onClose={() => setWordModalResume(null)} onResumeSaved={handleResumeSaved} />}
      {pdfModalResume && <PdfConvertModal resume={pdfModalResume} onClose={() => setPdfModalResume(null)} onResumeConverted={handleResumeSaved} />}
    </div>
  );
}