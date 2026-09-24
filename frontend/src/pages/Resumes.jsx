import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, FileText, Sparkles, Download, Trash2 } from 'lucide-react';
import { resumeService } from '../services';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { formatDate, formatNumber } from '../utils/format.js';

export default function Resumes() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await resumeService.getAll();
      setResumes(res.resumes);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResumes(); }, []);

  const onFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      toast.error('Please choose a PDF, DOC or DOCX file');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await resumeService.upload(fd);
      toast.success('Resume uploaded & parsed');
      setResumes([res.resume, ...resumes.filter((r) => r._id !== res.resume._id)]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const analyze = async (id) => {
    setAnalyzingId(id);
    try {
      const res = await resumeService.analyze(id);
      toast.success('Resume re-analyzed');
      fetchResumes();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this resume? Associated customized versions will remain but be unattached.')) return;
    try {
      await resumeService.delete(id);
      toast.success('Resume deleted');
      fetchResumes();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="card h-36 animate-pulse" />)}</div>;
  if (error) return <ErrorState message={error} onRetry={fetchResumes} />;

  const primary = resumes.find((r) => r.isPrimary);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Resume</h2>
          <p className="text-sm text-slate-500">Upload, parse and manage your master resume</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
          <Upload className="h-4 w-4" /> {uploading ? 'Parsing…' : 'Upload resume'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      {resumes.length === 0 ? (
        <EmptyState icon="📄" title="No resume yet"
          description="Upload your resume (PDF, DOC, DOCX). It is parsed into a structured profile used for AI job matching and customization."
          action={<button onClick={() => fileRef.current?.click()} className="btn-primary"><Upload className="h-4 w-4" /> Upload resume</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resumes.map((r) => {
            const prof = r.parsedProfile || {};
            return (
              <div key={r._id} className={`card p-5 ${r.isPrimary ? 'ring-2 ring-brand-600' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-800">{r.originalName}</p>
                      {r.isPrimary && <Badge className="bg-brand-600 text-white">Primary</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {prof.name || 'Name unknown'} · {prof.email || 'no email'} · {prof.phone || 'no phone'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatNumber((prof.skills || []).length)} skills · {prof.experienceYears || 0} yrs exp · Uploaded {formatDate(r.createdAt)}
                    </p>
                  </div>
                </div>

                {(prof.skills || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(prof.skills || []).slice(0, 10).map((s) => <Badge key={s}>{s}</Badge>)}
                    {(prof.skills || []).length > 10 && <Badge className="bg-slate-100 text-slate-400">+{(prof.skills || []).length - 10} more</Badge>}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link to={`/resumes/${r._id}`} className="btn-secondary"><FileText className="h-4 w-4" /> View & edit</Link>
                  <button onClick={() => analyze(r._id)} disabled={analyzingId === r._id} className="btn-secondary">
                    <Sparkles className="h-4 w-4" /> {analyzingId === r._id ? 'Analyzing…' : `${r.analyzedAt ? 'Re-analyze' : 'Analyze with AI'}`}
                  </button>
                  <a href={resumeService.downloadPdf(r._id)} className="btn-secondary"><Download className="h-4 w-4" /> PDF</a>
                  {!r.isPrimary && (
                    <button onClick={() => remove(r._id)} className="btn-secondary text-red-600"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {primary && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-medium">How the AI uses your resume</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-brand-700">
            <li>Job details pages compute an AI match score against your {primary.originalName}.</li>
            <li>"Generate customized resume" creates a tailored version you review before using (never auto-sent).</li>
            <li>Inventory analytics surface skills employers request that are missing from your profile.</li>
          </ul>
        </div>
      )}
    </div>
  );
}