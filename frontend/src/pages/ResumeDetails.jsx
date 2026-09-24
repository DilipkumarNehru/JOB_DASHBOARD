import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Download, Sparkles, Trash2, Star, Building2 } from 'lucide-react';
import { resumeService } from '../services';
import { PageLoader, ErrorState, EmptyState } from '../components/common/Feedbacks.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { TagInput } from '../components/common/Picklists.jsx';
import { formatDate } from '../utils/format.js';

export default function ResumeDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [resume, setResume] = useState(null);
  const [profile, setProfile] = useState(null);
  const [versions, setVersions] = useState([]);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rRes, vRes] = await Promise.all([resumeService.get(id), resumeService.versions(id)]);
        const r = rRes.resume;
        setResume(r);
        setProfile(r.parsedProfile || {});
        setVersions(vRes.versions || []);
        const vid = params.get('version');
        if (vid && vRes.versions?.some((v) => v._id === vid)) {
          const pv = await resumeService.getVersion(vid);
          setPreviewVersion(pv.version);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    })();
  }, [id]);

  const setField = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await resumeService.update(id, profile);
      setResume(res.resume);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setPrimary = async (versionId) => {
    try {
      await resumeService.setVersionPrimary(versionId);
      toast.success('Version set as application resume');
      const vRes = await resumeService.versions(id);
      setVersions(vRes.versions);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeVersion = async (versionId) => {
    if (!window.confirm('Delete this customized version?')) return;
    try {
      await resumeService.deleteVersion(versionId);
      toast.success('Version deleted');
      setVersions((vs) => vs.filter((v) => v._id !== versionId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;
  if (!resume) return null;

  return (
    <div className="space-y-5">
      <Link to="/resumes" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to resumes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{profile.name || 'Unnamed profile'}</h2>
          <p className="text-sm text-slate-500">{resume.originalName} · {formatDate(resume.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="btn-primary"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save profile'}</button>
          <a href={resumeService.downloadPdf(id)} className="btn-secondary"><Download className="h-4 w-4" /> PDF</a>
        </div>
      </div>

      {previewVersion && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
          <div className="flex items-center justify-between">
            <p className="font-medium"><Sparkles className="mr-1 inline h-4 w-4" />Previewing customized version: <b>{previewVersion.versionName}</b></p>
            <button onClick={() => setPreviewVersion(null)} className="text-xs font-medium hover:underline">Close preview</button>
          </div>
          <p className="mt-1 text-xs">Target: {previewVersion.targetCompany} · {previewVersion.targetRole} · {formatDate(previewVersion.createdAt)}</p>
          {previewVersion.changesMade?.length > 0 && (
            <div className="mt-2"><p className="text-xs font-semibold">Changes made</p>
              <ul className="mt-1 list-disc pl-5 text-xs">{previewVersion.changesMade.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card title="Basic details">
            <div className="space-y-3">
              <div><label className="label">Full name</label><input className="input" value={profile.name || ''} onChange={(e) => setField('name', e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input" value={profile.email || ''} onChange={(e) => setField('email', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={profile.phone || ''} onChange={(e) => setField('phone', e.target.value)} /></div>
              <div><label className="label">Location</label><input className="input" value={profile.location || ''} onChange={(e) => setField('location', e.target.value)} /></div>
              <div><label className="label">Years of experience</label><input type="number" className="input" value={profile.experienceYears ?? ''} onChange={(e) => setField('experienceYears', Number(e.target.value) || 0)} /></div>
            </div>
          </Card>

          <Card title="Professional summary">
            <textarea className="input min-h-[120px]" value={profile.summary || ''} onChange={(e) => setField('summary', e.target.value)} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Skills" subtitle="Used for AI job matching & ATS keyword analysis">
            <TagInput value={profile.skills || []} onChange={(v) => setField('skills', v)} />
          </Card>

          <Card title="Preferred roles">
            <TagInput value={profile.preferredRoles || []} onChange={(v) => setField('preferredRoles', v)} />
          </Card>

          <Card title="Preferred locations">
            <TagInput value={profile.preferredLocations || []} onChange={(v) => setField('preferredLocations', v)} />
          </Card>

          <Card title="Experience">
            <div className="space-y-2">
              <div><label className="label">Companies</label><TagInput value={profile.companies || []} onChange={(v) => setField('companies', v)} /></div>
              <div><label className="label">Job titles</label><TagInput value={profile.jobTitles || []} onChange={(v) => setField('jobTitles', v)} /></div>
            </div>
          </Card>

          <Card title="Certifications">
            <TagInput value={profile.certifications || []} onChange={(v) => setField('certifications', v)} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Education">
            {(profile.education || []).length === 0 ? (
              <TagInput value={[]} onChange={(v) => setField('education', v)} placeholder="Type degree and press Enter" />
            ) : (
              <TagInput value={profile.education.map((e) => (typeof e === 'string' ? e : `${e.degree || ''}${e.institution ? ` — ${e.institution}` : ''}`))} onChange={(v) => setField('education', v)} />
            )}
          </Card>

          <Card title="Projects">
            {(profile.projects || []).length === 0 ? (
              <TagInput value={[]} onChange={(v) => setField('projects', v)} placeholder="Type project and press Enter" />
            ) : (
              <TagInput value={profile.projects.map((p) => (typeof p === 'string' ? p : p.name || p.title || JSON.stringify(p)))} onChange={(v) => setField('projects', v)} />
            )}
          </Card>
        </div>
      </div>

      <Card
        title="Customized versions"
        subtitle={`${versions.length} tailored resumes ready for review`}
        actions={<Link to={`/jobs?recommended=1`} className="text-xs font-medium text-brand-600 hover:underline">Match jobs to customize →</Link>}
      >
        {versions.length === 0 ? (
          <EmptyState icon="✨" title="No customized versions yet"
            description="Open any job and use 'Generate customized resume' to create a tailored version for that role."
            action={<Link to="/jobs" className="btn-primary">Browse jobs</Link>} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {versions.map((v) => (
              <div key={v._id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">{v.versionName}</p>
                    <Badge className="bg-violet-100 text-violet-700"><Building2 className="mr-1 inline h-3 w-3" />{v.jobId?.companyName || v.targetCompany}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Target: {v.targetRole} · Created {formatDate(v.createdAt)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(v.changesMade || []).slice(0, 3).map((c, i) => <Badge key={i} className="bg-emerald-100 text-emerald-700">{c}</Badge>)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button onClick={() => setPreviewVersion(v)} className="btn-secondary px-2.5 py-1 text-xs"><Sparkles className="h-3 w-3" /> Preview</button>
                  <a href={resumeService.downloadVersionPdf(v._id)} className="btn-secondary px-2.5 py-1 text-xs"><Download className="h-3 w-3" /> PDF</a>
                  <button onClick={() => setPrimary(v._id)} className="btn-secondary px-2.5 py-1 text-xs"><Star className="h-3 w-3" /> Use as application</button>
                  <button onClick={() => removeVersion(v._id)} className="btn-secondary px-2.5 py-1 text-xs text-red-600"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}