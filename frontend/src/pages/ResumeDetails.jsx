import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Download, Sparkles, Trash2, Star,
  Building2, Plus, X, ChevronRight, BarChart3, GraduationCap,
  Briefcase, FolderGit2, Award, CheckCircle
} from 'lucide-react';
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
  const [atsData, setAtsData] = useState(null);
  const [showAts, setShowAts] = useState(false);
  const [loadingAts, setLoadingAts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rRes, vRes] = await Promise.all([
          resumeService.get(id),
          resumeService.versions(id).catch(() => ({ versions: [] }))
        ]);
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

  const loadAts = async () => {
    setShowAts(true);
    if (!atsData) {
      setLoadingAts(true);
      try {
        const res = await resumeService.atsScore(id);
        setAtsData(res);
      } catch (err) {
        toast.error(err.message || 'Failed to load ATS score');
      } finally {
        setLoadingAts(false);
      }
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await resumeService.update(id, profile);
      setResume(res.resume);
      toast.success('Resume profile saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ── Company management ──────────────────────────────────────────
  const addCompany = () => {
    const list = [...(profile.companies || [])];
    list.unshift({
      name: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      highlights: ['']
    });
    setField('companies', list);
  };

  const updateCompany = (idx, key, val) => {
    const list = [...(profile.companies || [])];
    list[idx] = { ...list[idx], [key]: val };
    setField('companies', list);
  };

  const removeCompany = (idx) => {
    const list = (profile.companies || []).filter((_, i) => i !== idx);
    setField('companies', list);
  };

  const addHighlight = (compIdx) => {
    const list = [...(profile.companies || [])];
    list[compIdx] = {
      ...list[compIdx],
      highlights: [...(list[compIdx].highlights || []), '']
    };
    setField('companies', list);
  };

  const updateHighlight = (compIdx, hlIdx, val) => {
    const list = [...(profile.companies || [])];
    const hls = [...(list[compIdx].highlights || [])];
    hls[hlIdx] = val;
    list[compIdx] = { ...list[compIdx], highlights: hls };
    setField('companies', list);
  };

  const removeHighlight = (compIdx, hlIdx) => {
    const list = [...(profile.companies || [])];
    const hls = (list[compIdx].highlights || []).filter((_, i) => i !== hlIdx);
    list[compIdx] = { ...list[compIdx], highlights: hls };
    setField('companies', list);
  };

  // ── Education management ────────────────────────────────────────
  const addEducation = () => {
    const list = [...(profile.education || [])];
    list.push({ degree: '', institution: '', year: '' });
    setField('education', list);
  };

  const updateEducation = (idx, key, val) => {
    const list = [...(profile.education || [])];
    list[idx] = { ...list[idx], [key]: val };
    setField('education', list);
  };

  const removeEducation = (idx) => {
    const list = (profile.education || []).filter((_, i) => i !== idx);
    setField('education', list);
  };

  // ── Projects management ─────────────────────────────────────────
  const addProject = () => {
    const list = [...(profile.projects || [])];
    list.push({ title: '', description: '', technologies: [], highlights: [''] });
    setField('projects', list);
  };

  const updateProject = (idx, key, val) => {
    const list = [...(profile.projects || [])];
    list[idx] = { ...list[idx], [key]: val };
    setField('projects', list);
  };

  const removeProject = (idx) => {
    const list = (profile.projects || []).filter((_, i) => i !== idx);
    setField('projects', list);
  };

  // ── Version management ──────────────────────────────────────────
  const setPrimary = async (versionId) => {
    try {
      await resumeService.setVersionPrimary(versionId);
      toast.success('Version set as primary application resume');
      const vRes = await resumeService.versions(id);
      setVersions(vRes.versions || []);
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
  if (!resume || !profile) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/resumes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Back to resumes
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={loadAts} className="btn-secondary flex items-center gap-1.5 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100">
            <Sparkles className="h-4 w-4 text-violet-600" /> ATS &amp; AI Recommendations
          </button>
          <a href={resumeService.downloadPdf(id)} className="btn-secondary flex items-center gap-1.5">
            <Download className="h-4 w-4" /> Download PDF
          </a>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{profile.name || 'Candidate Profile'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {resume.originalName} · Uploaded {formatDate(resume.createdAt)} · {profile.experienceYears || 0} years experience
            </p>
          </div>
          {resume.atsScore !== null && resume.atsScore !== undefined && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-emerald-700 border border-emerald-200">
              <BarChart3 className="h-5 w-5" />
              <div>
                <p className="text-xs font-semibold">ATS Score</p>
                <p className="text-lg font-black">{resume.atsScore} / 100</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI & ATS Recommendations Modal / Section */}
      {showAts && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/70 to-blue-50/70 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-violet-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-bold text-slate-900">ATS Score &amp; AI Recommendations</h2>
            </div>
            <button onClick={() => setShowAts(false)} className="rounded-lg p-1 text-slate-400 hover:bg-violet-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          {loadingAts ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
              <p className="text-sm font-medium text-slate-600">Generating AI Recommendations…</p>
            </div>
          ) : atsData ? (
            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-xl bg-white px-5 py-3 border border-violet-100 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase">Calculated Score</span>
                  <p className="text-2xl font-black text-violet-700">{atsData.atsScore} / 100</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">AI Improvement Tips</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(atsData.aiRecommendations || []).map((tip, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border border-white/80 bg-white/90 p-3.5 shadow-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {i + 1}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Main Form Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Basic Details & Summary */}
        <div className="space-y-6 lg:col-span-1">
          <Card title="Basic Details">
            <div className="space-y-3.5">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={profile.name || ''} onChange={(e) => setField('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" value={profile.email || ''} onChange={(e) => setField('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" value={profile.phone || ''} onChange={(e) => setField('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Location (City, Country)</label>
                <input className="input" value={profile.location || ''} onChange={(e) => setField('location', e.target.value)} />
              </div>
              <div>
                <label className="label">Years of Experience</label>
                <input type="number" step="0.5" className="input" value={profile.experienceYears ?? ''} onChange={(e) => setField('experienceYears', Number(e.target.value) || 0)} />
              </div>
            </div>
          </Card>

          <Card title="Professional Summary" subtitle="Compelling overview highlighting your core strengths">
            <textarea
              className="input min-h-[160px] text-sm leading-relaxed"
              value={profile.summary || ''}
              onChange={(e) => setField('summary', e.target.value)}
              placeholder="Paste or write your professional summary here…"
            />
          </Card>

          <Card title="Preferred Roles &amp; Locations">
            <div className="space-y-3">
              <div>
                <label className="label">Target Job Titles</label>
                <TagInput value={profile.preferredRoles || []} onChange={(v) => setField('preferredRoles', v)} placeholder="e.g. Backend Engineer, Full Stack Lead" />
              </div>
              <div>
                <label className="label">Target Locations</label>
                <TagInput value={profile.preferredLocations || []} onChange={(v) => setField('preferredLocations', v)} placeholder="e.g. Bengaluru, Remote" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Experience, Skills, Education, Projects */}
        <div className="space-y-6 lg:col-span-2">
          {/* Skills */}
          <Card title="Skills" subtitle="Used for AI job matching, resume tailoring & ATS parsing">
            <TagInput
              value={profile.skills || []}
              onChange={(v) => setField('skills', v)}
              placeholder="Type skill name and press Enter (e.g. Node.js, React, MongoDB, Docker)"
            />
          </Card>

          {/* Work Experience */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Work Experience</h2>
                <Badge className="bg-blue-50 text-blue-700">{(profile.companies || []).length} roles</Badge>
              </div>
              <button onClick={addCompany} className="btn-secondary flex items-center gap-1 text-xs text-blue-600">
                <Plus className="h-3.5 w-3.5" /> Add Role
              </button>
            </div>

            {(profile.companies || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No work experience entries yet. Click &quot;Add Role&quot; above.</p>
            ) : (
              <div className="space-y-4">
                {(profile.companies || []).map((comp, cIdx) => (
                  <div key={cIdx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid flex-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Role / Title</label>
                          <input
                            className="input bg-white text-sm"
                            value={comp.role || ''}
                            placeholder="e.g. Backend Engineer"
                            onChange={(e) => updateCompany(cIdx, 'role', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Company Name</label>
                          <input
                            className="input bg-white text-sm"
                            value={comp.name || ''}
                            placeholder="e.g. Acme Corp"
                            onChange={(e) => updateCompany(cIdx, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">Start Date</label>
                          <input
                            className="input bg-white text-xs"
                            value={comp.startDate || ''}
                            placeholder="e.g. Jun 2023"
                            onChange={(e) => updateCompany(cIdx, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">End Date</label>
                          <input
                            className="input bg-white text-xs"
                            value={comp.endDate || ''}
                            placeholder="e.g. Present or Sep 2024"
                            onChange={(e) => updateCompany(cIdx, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <button onClick={() => removeCompany(cIdx)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">Key Highlights / Achievements</label>
                        <button onClick={() => addHighlight(cIdx)} className="text-[11px] font-semibold text-blue-600 hover:underline">
                          + Add bullet
                        </button>
                      </div>
                      {(comp.highlights || []).map((hl, hlIdx) => (
                        <div key={hlIdx} className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs">•</span>
                          <input
                            className="input bg-white text-xs flex-1"
                            value={hl || ''}
                            placeholder="Describe your achievement with impact/metrics…"
                            onChange={(e) => updateHighlight(cIdx, hlIdx, e.target.value)}
                          />
                          <button onClick={() => removeHighlight(cIdx, hlIdx)} className="text-slate-300 hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Education</h2>
                <Badge className="bg-emerald-50 text-emerald-700">{(profile.education || []).length} degrees</Badge>
              </div>
              <button onClick={addEducation} className="btn-secondary flex items-center gap-1 text-xs text-emerald-600">
                <Plus className="h-3.5 w-3.5" /> Add Degree
              </button>
            </div>

            {(profile.education || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No education records yet.</p>
            ) : (
              <div className="space-y-3">
                {(profile.education || []).map((edu, eIdx) => (
                  <div key={eIdx} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <div className="grid flex-1 gap-2.5 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Degree</label>
                        <input
                          className="input bg-white text-xs"
                          value={typeof edu === 'string' ? edu : (edu.degree || '')}
                          placeholder="e.g. B.E. Computer Science"
                          onChange={(e) => updateEducation(eIdx, 'degree', e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Institution</label>
                        <input
                          className="input bg-white text-xs"
                          value={typeof edu === 'object' ? (edu.institution || '') : ''}
                          placeholder="e.g. Anna University"
                          onChange={(e) => updateEducation(eIdx, 'institution', e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                        <input
                          className="input bg-white text-xs"
                          value={typeof edu === 'object' ? (edu.year || '') : ''}
                          placeholder="e.g. 2020"
                          onChange={(e) => updateEducation(eIdx, 'year', e.target.value)}
                        />
                      </div>
                    </div>
                    <button onClick={() => removeEducation(eIdx)} className="rounded-lg p-1 text-slate-400 hover:text-red-500 mt-4">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Projects</h2>
                <Badge className="bg-indigo-50 text-indigo-700">{(profile.projects || []).length} projects</Badge>
              </div>
              <button onClick={addProject} className="btn-secondary flex items-center gap-1 text-xs text-indigo-600">
                <Plus className="h-3.5 w-3.5" /> Add Project
              </button>
            </div>

            {(profile.projects || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No projects listed yet.</p>
            ) : (
              <div className="space-y-3">
                {(profile.projects || []).map((proj, pIdx) => (
                  <div key={pIdx} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Project Title</label>
                          <input
                            className="input bg-white text-xs"
                            value={typeof proj === 'string' ? proj : (proj.title || '')}
                            placeholder="e.g. CRM Platform"
                            onChange={(e) => updateProject(pIdx, 'title', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Description / Scope</label>
                          <input
                            className="input bg-white text-xs"
                            value={typeof proj === 'object' ? (proj.description || '') : ''}
                            placeholder="e.g. Healthcare Enterprise Platform"
                            onChange={(e) => updateProject(pIdx, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                      <button onClick={() => removeProject(pIdx)} className="rounded-lg p-1 text-slate-400 hover:text-red-500 mt-3">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          <Card title="Certifications &amp; Licenses">
            <TagInput
              value={profile.certifications || []}
              onChange={(v) => setField('certifications', v)}
              placeholder="e.g. AWS Certified Solutions Architect, Selenium Automation"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}