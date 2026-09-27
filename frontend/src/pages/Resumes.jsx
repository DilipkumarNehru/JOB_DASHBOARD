import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Sparkles, Download, Trash2,
  Star, Eye, ChevronRight, RefreshCw,
  Info, Pencil, BarChart3, X, FileCheck, Clock
} from 'lucide-react';
import { resumeService } from '../services';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { formatDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── helpers ──────────────────────────────────────────────────── */
const scoreColor = (s) => {
  if (s >= 80) return { ring: '#22c55e', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent' };
  if (s >= 60) return { ring: '#3b82f6', text: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Good' };
  if (s >= 40) return { ring: '#f59e0b', text: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Fair' };
  return           { ring: '#ef4444', text: 'text-red-600',      bg: 'bg-red-50',     label: 'Weak' };
};
const catColor = (score, max) => {
  const pct = score / max;
  if (pct >= 0.8) return 'bg-emerald-500';
  if (pct >= 0.5) return 'bg-blue-500';
  if (pct >= 0.25) return 'bg-amber-500';
  return 'bg-red-400';
};
const fileExt = (name = '') => (name.split('.').pop() || '?').toUpperCase();
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
            <p className="text-xs text-slate-500 truncate max-w-xs">{resume.originalName}</p>
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
              <span className={`text-sm font-bold ${c.text}`}>{c.label} ATS Match</span>
              <p className="text-center text-xs text-slate-500">Your resume passes <strong>{ats.atsScore}%</strong> of automated ATS checks.</p>
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
  const isPdf = (resume.fileType || '').toLowerCase() === 'pdf';
  // iframes cannot send Authorization headers, so we pass the JWT as a query param
  const token = localStorage.getItem('jd_token');
  const fileUrl = `${resumeService.fileUrl(resume._id)}?token=${token}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <p className="font-semibold text-slate-800 truncate max-w-xs">{resume.originalName}</p>
            <p className="text-xs text-slate-400">
              {resume.fileType?.toUpperCase()} · {resume.fileSize ? `${(resume.fileSize / 1024).toFixed(0)} KB` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {isPdf && (
              <a href={fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                <Eye className="h-3.5 w-3.5" /> Open in new tab
              </a>
            )}
            <a href={resumeService.downloadPdf(resume._id)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </a>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="h-full w-full border-0 bg-white"
              title={`Preview: ${resume.originalName}`}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <FileText className="h-20 w-20 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-700">Preview not available</p>
                <p className="mt-1 text-sm text-slate-500">
                  <strong>.{resume.fileType || 'This'}</strong> format cannot be displayed inline.
                </p>
              </div>
              <div className="flex gap-3">
                <a href={fileUrl} download={resume.originalName}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Download className="h-4 w-4" /> Download Original
                </a>
                <a href={resumeService.downloadPdf(resume._id)}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                  <Download className="h-4 w-4" /> Download as PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Single resume card ────────────────────────────────────────── */
function ResumeCard({ resume, onDelete, onAnalyze, analyzingId, onAts, onPreview }) {
  const prof = resume.parsedProfile || {};
  const score = resume.atsScore;
  return (
    <div className={`group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-lg
      ${resume.isPrimary ? 'border-blue-300 ring-2 ring-blue-500/20' : 'border-slate-200'}`}>
      {resume.isPrimary && (
        <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white shadow">
          <Star className="h-3 w-3 fill-white" /> Primary
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <FileText className="h-6 w-6 text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-slate-900">{resume.originalName}</p>
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${extColor(resume.fileType)}`}>
              {fileExt(resume.originalName)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{prof.name || 'Unknown'} · {prof.email || '—'} · {prof.phone || '—'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(resume.createdAt)}</span>
            {(prof.skills || []).length > 0 && <span>· {prof.skills.length} skills</span>}
            {prof.experienceYears > 0 && <span>· {prof.experienceYears} yrs exp</span>}
          </div>
        </div>
        {score !== null && score !== undefined ? (
          <div className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-1.5 ${scoreColor(score).bg}`}>
            <span className={`text-xl font-black ${scoreColor(score).text}`}>{score}</span>
            <span className={`text-[9px] font-semibold uppercase ${scoreColor(score).text}`}>ATS</span>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col items-center rounded-xl bg-slate-100 px-3 py-1.5">
            <span className="text-xl font-black text-slate-400">—</span>
            <span className="text-[9px] font-semibold uppercase text-slate-400">ATS</span>
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
        <button onClick={() => onPreview(resume)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        <button onClick={() => onAts(resume)}
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
          <BarChart3 className="h-3.5 w-3.5" /> ATS Score
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
        <a href={resumeService.downloadPdf(resume._id)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
        {!resume.isPrimary && (
          <button onClick={() => onDelete(resume._id)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
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
        <p className="text-sm font-medium text-blue-600 animate-pulse">Uploading &amp; saving to database…</p>
      ) : (
        <div>
          <p className="text-sm font-semibold text-slate-800">Drop your resume here, or <span className="text-blue-600">browse</span></p>
          <p className="mt-1 text-xs text-slate-500">Supports PDF, DOC, DOCX, TXT, RTF — up to 10 MB — saved to your database</p>
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
  const [atsResume, setAtsResume] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);

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
      toast.success('Resume uploaded & saved to database!');
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

  const remove = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
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

  const primary = resumes.find((r) => r.isPrimary);
  const scored  = resumes.filter((r) => r.atsScore !== null && r.atsScore !== undefined);
  const avgScore = scored.length ? Math.round(scored.reduce((a, r) => a + r.atsScore, 0) / scored.length) : null;

  if (loading) return (
    <div className="space-y-4">
      {[0,1,2].map(i => <div key={i} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />)}
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
              : `${resumes.length} resume${resumes.length > 1 ? 's' : ''} stored in your database`}
          </p>
        </div>
        {resumes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
              <FileCheck className="h-3.5 w-3.5 text-blue-500" />
              {resumes.length} resume{resumes.length > 1 ? 's' : ''} total
            </div>
            {avgScore !== null && (
              <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm ${scoreColor(avgScore).bg} ${scoreColor(avgScore).text}`}>
                <BarChart3 className="h-3.5 w-3.5" />
                Avg ATS: {avgScore}/100
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload zone */}
      <UploadZone onFile={onFile} uploading={uploading} />

      {/* Resume list */}
      {resumes.length === 0 ? (
        <EmptyState icon="📄" title="No resumes yet"
          description="Upload your resume in any format. It will be saved to the database, parsed by AI, and checked against ATS systems."
          action={null} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              All Resumes ({resumes.length})
            </p>
            <div className="flex-1 border-t border-slate-200" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {resumes.map((r) => (
              <ResumeCard key={r._id} resume={r} analyzingId={analyzingId}
                onDelete={remove} onAnalyze={analyze}
                onAts={setAtsResume} onPreview={setPreviewResume} />
            ))}
          </div>
        </div>
      )}

      {/* Info banner */}
      {primary && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-bold text-blue-800">How AI uses your resume</p>
          </div>
          <ul className="space-y-1 text-xs text-blue-700 pl-6 list-disc">
            <li>Job detail pages compute an AI match score against <strong>{primary.originalName}</strong>.</li>
            <li>&quot;Generate customized resume&quot; creates a tailored version you review before using.</li>
            <li>Analytics surfaces skills employers request that are missing from your profile.</li>
          </ul>
        </div>
      )}

      {/* Overlays */}
      {atsResume && <AtsPanel resume={atsResume} onClose={() => setAtsResume(null)} onScoreUpdated={handleScoreUpdated} />}
      {previewResume && <PreviewModal resume={previewResume} onClose={() => setPreviewResume(null)} />}
    </div>
  );
}