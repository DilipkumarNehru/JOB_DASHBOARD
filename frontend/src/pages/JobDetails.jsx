import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Building2, Clock, Banknote, ExternalLink, Sparkles,
  CheckCircle2, XCircle, Save, Send, UserX, Flag, CalendarPlus, Download,
  Crown, BarChart3, Target, TrendingUp, GraduationCap, Briefcase
} from 'lucide-react';
import { jobService, applicationService, resumeService, followUpService } from '../services';
import { PageLoader, ErrorState } from '../components/common/Feedbacks.jsx';
import { Card } from '../components/common/Card.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Badge, MatchBar } from '../components/common/Badge.jsx';
import { useForm } from '../hooks/useForm.js';
import { relativeTime, formatSalary } from '../utils/format.js';

/* ─── ATS Score Ring ────────────────────────────────────────────── */
function AtsRing({ score, size = 100 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = score >= 80 ? '#22c55e' : score >= 65 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';
  const textColor = score >= 80 ? 'text-emerald-600' : score >= 65 ? 'text-blue-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-black ${textColor}`}>{score}%</span>
      </div>
    </div>
  );
}

/* ─── Score row component ───────────────────────────────────────── */
function ScoreRow({ icon: Icon, label, score, color = 'bg-brand-500' }) {
  if (score === undefined || score === null) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-36 items-center gap-1.5 shrink-0">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        <span className="text-xs text-slate-600">{label}</span>
      </div>
      <div className="flex-1">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(score, 100)}%` }} />
        </div>
      </div>
      <span className="text-xs font-bold text-slate-600 w-8 text-right">{Math.round(score)}%</span>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matching, setMatching] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [customizations, setCustomizations] = useState([]);
  const [matchDetails, setMatchDetails] = useState(null);
  const [allResumeMatches, setAllResumeMatches] = useState([]);
  const [loadingMatch, setLoadingMatch] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await jobService.get(id);
        setJob(res.job);
        await loadApplications(id);
        // Load match details for primary resume
        await loadMatchDetails(id);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    })();
  }, [id]);

  const loadMatchDetails = async (jobId, resumeId) => {
    setLoadingMatch(true);
    try {
      const res = await jobService.getMatchDetails(jobId, resumeId);
      setMatchDetails(res.match);
      setAllResumeMatches(res.allResumeMatches || []);
    } catch (_) {
      // Match details not available yet — that's fine
    } finally {
      setLoadingMatch(false);
    }
  };

  const loadApplications = async (jobId) => {
    const ares = await applicationService.getAll({ limit: 10 });
    const found = (ares.applications || []).find((a) => a.jobId?._id === jobId || a.jobId === jobId);
    if (found) setApp(found);
  };

  const runMatch = async () => {
    setMatching(true);
    try {
      const res = await jobService.match(id);
      // Update job state
      const best = res.bestMatch;
      if (best) {
        setJob((j) => ({
          ...j,
          matchScore: best.overallMatch,
          matchedSkills: best.matchedSkills,
          missingSkills: best.missingSkills,
          matchBreakdown: {
            skills: best.skillsMatch,
            experience: best.experienceMatch,
            location: best.locationMatch,
            role: best.roleMatch,
            education: best.educationMatch,
            responsibilities: best.responsibilitiesMatch,
          },
          matchReason: best.whyItMatches,
        }));
      }
      // Reload match details
      await loadMatchDetails(id);
      toast.success(`ATS analysis complete! Best match: ${best?.overallMatch || 0}%`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMatching(false);
    }
  };

  const saveJob = async (status) => {
    try {
      const updated = await jobService.update(id, { status });
      setJob(updated.job);
      toast.success(`Job marked as ${status}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const applyToJob = async () => {
    try {
      const res = await applicationService.create({ jobId: job._id });
      setApp(res.application);
      setShowApply(false);
      await saveJob('applied');
      toast.success('Application created');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const customize = async () => {
    setCustomizing(true);
    try {
      const resumes = await resumeService.getAll();
      const primary = resumes.resumes.find((r) => r.isPrimary) || resumes.resumes[0];
      if (!primary) {
        toast.error('Upload a resume first (Resume → My Resume)');
        return;
      }
      const res = await resumeService.customize(primary._id, { jobId: job._id });
      setCustomizations((c) => [res.version, ...c]);
      toast.success('Customized resume generated. Review in Resume section.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCustomizing(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} />;
  if (!job) return null;

  const breakdown = matchDetails || {};
  const matchScore = matchDetails?.overallMatch ?? job.matchScore ?? 0;
  const matchedSkills = matchDetails?.matchedSkills || job.matchedSkills || [];
  const missingSkills = matchDetails?.missingSkills || job.missingSkills || [];
  const matchReason = matchDetails?.whyItMatches || job.matchReason || '';

  const scoreColorClass = matchScore >= 80 ? 'text-emerald-600' : matchScore >= 65 ? 'text-blue-600' : matchScore >= 50 ? 'text-amber-600' : 'text-red-600';
  const scoreBgClass = matchScore >= 80 ? 'bg-emerald-50' : matchScore >= 65 ? 'bg-blue-50' : matchScore >= 50 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className="space-y-5">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      {/* Job header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{job.jobTitle}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{job.companyName}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.remote ? 'Remote' : job.location}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{relativeTime(job.postedDate)}</span>
              <span className="inline-flex items-center gap-1.5"><Banknote className="h-4 w-4" />{formatSalary(job.salary)}</span>
              <span className="inline-flex items-center gap-1.5">{job.employmentType}</span>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button onClick={saveJob.bind(null, 'saved')} className="btn-secondary"><Save className="h-4 w-4" /> Save</button>
            <button onClick={saveJob.bind(null, 'rejected')} className="btn-secondary"><UserX className="h-4 w-4" /> Reject</button>
            <button onClick={saveJob.bind(null, 'applied')} className="btn-secondary"><Flag className="h-4 w-4" /> Mark as applied</button>
            <button onClick={() => setShowApply(true)} className="btn-primary"><Send className="h-4 w-4" /> Apply</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills?.map((s) => <Badge key={s} className="bg-slate-100 text-slate-600">{s}</Badge>)}
        </div>
        {job.careerPageUrl && (
          <a href={job.careerPageUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            Open company career page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {app && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          <span>Application created — status: <b>{app.status}</b></span>
          <Link to={`/applications/${app._id}`} className="ml-auto font-medium text-emerald-700 hover:underline">View application →</Link>
        </div>
      )}

      {/* ATS Match Score Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-semibold text-slate-900">ATS Match Analysis</h3>
          </div>
          <div className="flex gap-2">
            {matchScore > 0 ? (
              <button onClick={runMatch} disabled={matching} className="btn-secondary text-xs">
                <Sparkles className="h-3.5 w-3.5" /> {matching ? 'Re-analyzing…' : 'Re-run ATS'}
              </button>
            ) : (
              <button onClick={runMatch} disabled={matching} className="btn-primary text-xs">
                <Sparkles className="h-3.5 w-3.5" /> {matching ? 'Analyzing…' : 'Calculate ATS Match'}
              </button>
            )}
          </div>
        </div>

        {loadingMatch ? (
          <div className="flex items-center gap-3 py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Loading match analysis…</p>
          </div>
        ) : matchScore > 0 ? (
          <div className="space-y-5">
            {/* Overall score + matched resume */}
            <div className={`flex flex-col sm:flex-row items-center gap-5 rounded-2xl p-5 ${scoreBgClass}`}>
              <AtsRing score={matchScore} size={110} />
              <div className="flex-1 text-center sm:text-left">
                <p className={`text-3xl font-black ${scoreColorClass}`}>{matchScore}%</p>
                <p className="text-sm text-slate-600 mt-0.5">Overall ATS Score</p>
                {(matchDetails?.resumeName || job.matchedResumeName) && (
                  <div className="mt-2 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Crown className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">
                      Matched Resume: {matchDetails?.resumeName || job.matchedResumeName}
                    </span>
                  </div>
                )}
                {matchReason && (
                  <p className="mt-2 text-xs text-slate-600 max-w-sm">{matchReason}</p>
                )}
              </div>
            </div>

            {/* Score breakdown */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Score Breakdown</p>
              <div className="space-y-2.5">
                <ScoreRow icon={Target} label="Skills Match" score={breakdown.skillsMatch} color="bg-brand-500" />
                <ScoreRow icon={Briefcase} label="Responsibilities" score={breakdown.responsibilitiesMatch} color="bg-violet-500" />
                <ScoreRow icon={TrendingUp} label="Experience" score={breakdown.experienceMatch} color="bg-emerald-500" />
                <ScoreRow icon={Crown} label="Role Alignment" score={breakdown.roleMatch} color="bg-blue-500" />
                <ScoreRow icon={GraduationCap} label="Education" score={breakdown.educationMatch} color="bg-amber-500" />
              </div>
            </div>

            {/* Skills */}
            {(matchedSkills.length > 0 || missingSkills.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {matchedSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-emerald-700 mb-2">✓ Matched Skills ({matchedSkills.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedSkills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {missingSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">✗ Missing Skills ({missingSkills.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSkills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <XCircle className="h-3 w-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All resume matches comparison */}
            {allResumeMatches.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">All Resume Matches</p>
                <div className="space-y-2">
                  {[...allResumeMatches].sort((a, b) => b.overallMatch - a.overallMatch).map(m => (
                    <div key={m.resumeId} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="flex-1 text-xs font-medium text-slate-700 truncate">{m.resumeName}</span>
                      <div className="w-24">
                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${m.overallMatch >= 70 ? 'bg-emerald-500' : m.overallMatch >= 50 ? 'bg-blue-500' : 'bg-slate-400'}`}
                            style={{ width: `${m.overallMatch}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${m.overallMatch >= 70 ? 'text-emerald-600' : m.overallMatch >= 50 ? 'text-blue-600' : 'text-slate-500'}`}>
                        {m.overallMatch}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-500 mb-3">This job hasn't been scored against your resume yet.</p>
            <button onClick={runMatch} disabled={matching} className="btn-primary">
              <Sparkles className="h-4 w-4" /> {matching ? 'Analyzing…' : 'Calculate ATS Match'}
            </button>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          <button onClick={customize} disabled={customizing} className="btn-secondary">
            <Sparkles className="h-4 w-4" /> {customizing ? 'Generating…' : 'Generate customized resume'}
          </button>
        </div>

        {customizations.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Generated versions</p>
            {customizations.map((v) => (
              <div key={v._id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                <span className="text-slate-700">{v.versionName}</span>
                <div className="flex gap-2">
                  <Link to={`/resumes/${v.originalResumeId}?version=${v._id}`} className="text-xs font-medium text-brand-600 hover:underline">Preview</Link>
                  <a href={resumeService.downloadVersionPdf(v._id)} className="text-xs font-medium text-brand-600 hover:underline"><Download className="mr-1 inline h-3 w-3" />PDF</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job description */}
      <Card title="Job description">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{job.jobDescription || 'No description available.'}</p>
        {job.requiredSkills?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Required skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{job.requiredSkills.map((s) => <Badge key={s}>{s}</Badge>)}</div>
          </div>
        )}
        {job.preferredSkills?.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-700">Preferred skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{job.preferredSkills.map((s) => <Badge key={s} className="bg-slate-100 text-slate-500">{s}</Badge>)}</div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-500">
          Next: track this in <b>Applications</b>, schedule a follow-up, or monitor Gmail for recruiter emails.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowFollowUp(true)} className="btn-secondary"><CalendarPlus className="h-4 w-4" /> Schedule follow-up</button>
          {app ? (
            <Link to={`/applications/${app._id}`} className="btn-primary">Open application</Link>
          ) : (
            <button onClick={() => setShowApply(true)} className="btn-primary">Apply now</button>
          )}
        </div>
      </div>

      <ApplyModal open={showApply} onClose={() => setShowApply(false)} job={job} onConfirm={applyToJob} />
      <FollowUpModal open={showFollowUp} onClose={() => setShowFollowUp(false)} job={job} appId={app?._id} onSaved={() => setShowFollowUp(false)} />
    </div>
  );
}

const ApplyModal = ({ open, onClose, job, onConfirm }) => (
  <Modal open={open} onClose={onClose} title="Apply to this job"
    footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={onConfirm}>Confirm application</button></>}>
    <p className="text-sm text-slate-600">
      You're about to create an application for <b>{job.jobTitle}</b> at <b>{job.companyName}</b>.
      The app will be tracked in your Applications module.
    </p>
    {job.jobUrl && (
      <a href={job.jobUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
        Open application URL <ExternalLink className="h-3.5 w-3.5" />
      </a>
    )}
  </Modal>
);

const FollowUpModal = ({ open, onClose, job, appId, onSaved }) => {
  const { values, errors, submitting, handleChange, handleSubmit } = useForm({
    applicationId: appId || '', company: job.companyName, role: job.jobTitle,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    recruiterName: '', recruiterEmail: '', notes: '', nextAction: 'Send polite status check email',
  }, async (v) => {
    if (!v.applicationId) throw new Error('Create an application first, then schedule a follow-up');
    await followUpService.create(v);
    onSaved();
  });

  return (
    <Modal open={open} onClose={onClose} title="Schedule follow-up"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Save follow-up'}</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className="label">Due date *</label><input type="date" name="dueDate" className="input" value={values.dueDate} onChange={handleChange} required /></div>
        <div><label className="label">Recruiter name</label><input name="recruiterName" className="input" value={values.recruiterName} onChange={handleChange} /></div>
        <div><label className="label">Recruiter email</label><input name="recruiterEmail" type="email" className="input" value={values.recruiterEmail} onChange={handleChange} /></div>
        <div><label className="label">Next action</label><input name="nextAction" className="input" value={values.nextAction} onChange={handleChange} /></div>
        <div className="md:col-span-2"><label className="label">Notes</label><textarea name="notes" className="input" value={values.notes} onChange={handleChange} /></div>
      </div>
      {!appId && (<p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-700">Create an application for this job first so the follow-up links correctly.</p>)}
      {errors.submit && <p className="mt-3 text-sm text-red-600">{errors.submit}</p>}
    </Modal>
  );
};