import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Building2, Clock, Banknote, ExternalLink, Sparkles,
  CheckCircle2, XCircle, Save, Send, UserX, Flag, CalendarPlus, Download
} from 'lucide-react';
import { jobService, applicationService, resumeService, followUpService } from '../services';
import { PageLoader, ErrorState } from '../components/common/Feedbacks.jsx';
import { Card } from '../components/common/Card.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Badge, MatchBar } from '../components/common/Badge.jsx';
import { useForm } from '../hooks/useForm.js';
import { relativeTime, formatSalary } from '../utils/format.js';

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
  const [discovery, setDiscovery] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await jobService.get(id);
        setJob(res.job);
        await loadApplications(id);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    })();
  }, [id]);

  const loadApplications = async (jobId) => {
    const ares = await applicationService.getAll({ limit: 10 });
    const found = (ares.applications || []).find((a) => a.jobId?._id === jobId || a.jobId === jobId);
    if (found) setApp(found);
  };

  const runMatch = async () => {
    setMatching(true);
    try {
      const res = await jobService.match(id);
      setJob((j) => ({
        ...j,
        matchScore: res.match.overallMatch,
        matchedSkills: res.match.matchedSkills,
        missingSkills: res.match.missingSkills,
        matchBreakdown: { skills: res.match.skillsMatch, experience: res.match.experienceMatch, location: res.match.locationMatch, role: res.match.roleMatch, education: res.match.educationMatch },
        matchReason: res.match.whyItMatches,
      }));
      setDiscovery(true);
      toast.success(`Match computed: ${res.match.overallMatch}%`);
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

  const breakdown = job.matchBreakdown || {};

  return (
    <div className="space-y-5">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

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

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-semibold text-slate-900">AI Match Score</h3>
          </div>
          {discovery && <span className="badge bg-emerald-100 text-emerald-700">Analyzed</span>}
        </div>

        {job.matchScore > 0 ? (
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-5">
              <p className="text-5xl font-black text-brand-700">{job.matchScore}%</p>
              <p className="mt-1 text-sm text-slate-500">Overall match</p>
              {job.matchReason && <p className="mt-3 text-center text-xs text-slate-600">{job.matchReason}</p>}
            </div>
            <div className="lg:col-span-2 space-y-3">
              {[
                ['Skills match', breakdown.skills],
                ['Experience match', breakdown.experience],
                ['Role match', breakdown.role],
                ['Location match', breakdown.location],
                ['Education match', breakdown.education],
              ].filter(([, v]) => v !== undefined).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="w-36 text-sm text-slate-600">{label}</span>
                  <MatchBar score={val} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">This job has not been scored against your resume yet.</p>
        )}

        {(job.matchedSkills?.length > 0 || job.missingSkills?.length > 0) && (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-emerald-700">✓ Matched skills ({job.matchedSkills.length})</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.matchedSkills.map((s) => <Badge key={s} className="bg-emerald-100 text-emerald-700">{s}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">✗ Missing skills ({job.missingSkills.length})</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.missingSkills.map((s) => <Badge key={s} className="bg-red-100 text-red-700">{s}</Badge>)}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {job.matchScore === 0 ? (
            <button onClick={runMatch} disabled={matching} className="btn-primary"><Sparkles className="h-4 w-4" /> {matching ? 'Analyzing…' : 'Calculate AI match'}</button>
          ) : (
            <button onClick={runMatch} disabled={matching} className="btn-secondary"><Sparkles className="h-4 w-4" /> {matching ? 'Re-analyzing…' : 'Re-run AI match'}</button>
          )}
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
      The app will be tracked in your Applications module. You'll open the company's application page yourself to submit — the dashboard never auto-submits on your behalf.
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

  useEffect(() => {
    if (open) reset({
      applicationId: appId || '',
      company: job.companyName,
      role: job.jobTitle,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      recruiterName: '',
      recruiterEmail: '',
      notes: '',
      nextAction: 'Send polite status check email',
    });
  }, [open, appId, job]);

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