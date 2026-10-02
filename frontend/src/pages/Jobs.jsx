import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Download, X, Crown, Target, Sliders, ChevronDown, BarChart2 } from 'lucide-react';
import { jobService, resumeService } from '../services';
import { JobCard, JobCardSkeleton } from '../components/jobs/JobCard.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { FilterSelect, SearchBar } from '../components/common/Form.jsx';
import { useForm } from '../hooks/useForm.js';
import { sortJobs, toQueryString } from '../utils/format.js';

const getResumeName = (r) => r?.resumeName || r?.originalFileName || r?.originalName || 'My Resume';

export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [discovering, setDiscovering] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [sortBy, setSortBy] = useState('match');
  const [resumes, setResumes] = useState([]);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [jobStats, setJobStats] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  // Load resumes for filter dropdown
  const loadResumes = useCallback(async () => {
    try {
      const res = await resumeService.getAll();
      const allResumes = res.resumes || [];
      setResumes(allResumes);
      setPrimaryResume(allResumes.find(r => r.isPrimary) || allResumes[0] || null);
    } catch (_) { }
  }, []);

  const loadJobStats = useCallback(async () => {
    try {
      const res = await jobService.getStats();
      setJobStats(res.stats);
    } catch (_) { }
  }, []);

  useEffect(() => {
    loadResumes();
    loadJobStats();
  }, [loadResumes, loadJobStats]);

  const filters = useMemo(() => {
    return {
      status: params.get('status') || '',
      remote: params.get('remote') || '',
      source: params.get('source') || '',
      match: params.get('match') || '',
      role: params.get('role') || '',
      company: params.get('company') || '',
      location: params.get('location') || '',
      search: params.get('search') || '',
      recommended: params.get('recommended') === '1',
      resumeId: params.get('resumeId') || '',      // specific resume filter
      primaryOnly: params.get('primaryOnly') !== 'false',  // default: show primary resume jobs
      minAts: params.get('minAts') || '',
      minExp: params.get('minExp') || '',
    };
  }, [params]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value !== '' && value !== undefined && value !== null) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setParams(next);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Determine if we should use primary resume filter
      const usePrimaryFilter = filters.primaryOnly && !filters.resumeId && !filters.search;
      const useResumeFilter = !!filters.resumeId;

      const queryParams = {
        status: filters.status || undefined,
        remote: filters.remote || undefined,
        source: filters.source || undefined,
        role: filters.role || undefined,
        company: filters.company || undefined,
        location: filters.location || undefined,
        search: filters.search || undefined,
        page,
        limit: 12,
        minExp: filters.minExp || undefined,
      };

      if (useResumeFilter) {
        queryParams.resumeId = filters.resumeId;
        queryParams.minAts = filters.minAts || undefined;
      } else if (usePrimaryFilter) {
        queryParams.primaryOnly = 'true';
        queryParams.minAts = filters.minAts || undefined;
        if (filters.match) queryParams.minMatch = filters.match;
      } else {
        // Show all jobs
        if (filters.match) queryParams.minMatch = filters.match;
      }

      const res = await jobService.getAll(queryParams);
      let list = res.jobs || [];

      // When a specific resume or primary is selected, ensure we only show matched jobs if filtered
      if (filters.resumeId || filters.primaryOnly) {
        list = list.filter(j => j.matchedResumeName || j.matchScore > 0 || (j.matchedSkills && j.matchedSkills.length > 0));
      }

      if (filters.recommended) list = list.filter(j => (j.matchScore || 0) >= 70);

      setJobs(sortJobs(list, sortBy));
      setTotal(res.total || list.length);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, sortBy]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const runDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await jobService.discover({});
      toast.success(res.message);
      fetchJobs();
      loadJobStats();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDiscovering(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('Recalculate ATS scores for all jobs against all resumes? This may take a few minutes.')) return;
    setRecalculating(true);
    try {
      const res = await jobService.recalculateMatches({ limit: 200 });
      toast.success(res.message);
      fetchJobs();
      loadJobStats();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const resetFilters = () => {
    const p = new URLSearchParams();
    p.set('page', '1');
    setParams(p);
  };

  const setResumeFilter = (resumeId) => {
    const next = new URLSearchParams(params);
    if (resumeId === 'all') {
      next.delete('resumeId');
      next.set('primaryOnly', 'false');
    } else if (resumeId === 'primary') {
      next.delete('resumeId');
      next.delete('primaryOnly'); // default is true
    } else {
      next.set('resumeId', resumeId);
      next.delete('primaryOnly');
    }
    next.set('page', '1');
    setParams(next);
  };

  const currentResumeFilter = filters.resumeId
    ? filters.resumeId
    : (filters.primaryOnly ? 'primary' : 'all');

  const hasActiveFilters = filters.status || filters.remote || filters.source || filters.match ||
    filters.role || filters.company || filters.location || filters.search || filters.minAts ||
    !filters.primaryOnly || filters.resumeId;

  // Determine display context
  const showingForResume = filters.resumeId
    ? resumes.find(r => r._id === filters.resumeId)
    : (filters.primaryOnly ? primaryResume : null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Jobs
            {filters.recommended && <span className="text-sm font-medium text-emerald-600"> · Recommended</span>}
          </h2>
          <p className="text-sm text-slate-500">
            {showingForResume
              ? <>Showing jobs matching <strong>{getResumeName(showingForResume)}</strong> · {total} found</>
              : <>{total} jobs in your pool</>
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRecalculate} disabled={recalculating} className="btn-secondary" title="Recalculate ATS scores for all resume-job pairs">
            <BarChart2 className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Recalculating…' : 'Recalc ATS'}
          </button>
          <button onClick={runDiscovery} disabled={discovering} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${discovering ? 'animate-spin' : ''}`} /> {discovering ? 'Discovering…' : 'Discover jobs'}
          </button>
          <button onClick={() => setShowManual(true)} className="btn-primary"><Plus className="h-4 w-4" /> Add job</button>
        </div>
      </div>

      {/* Stats bar */}
      {jobStats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Total Jobs Found</p>
            <p className="text-2xl font-black text-slate-900">{jobStats.totalUniqueMatchedJobs || jobStats.totalJobs || 0}</p>
            <p className="text-xs text-slate-400">across all resumes</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-600 font-medium">Primary Resume Jobs</p>
            <p className="text-2xl font-black text-blue-700">{jobStats.primaryResumeJobCount || 0}</p>
            <p className="text-xs text-blue-500 truncate">{jobStats.primaryResume?.resumeName || '—'}</p>
          </div>
          {(jobStats.perResume || []).slice(0, 2).map(r => (
            <div key={r.resumeId} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-500 truncate">{r.resumeName}</p>
              <p className="text-2xl font-black text-slate-900">{r.jobCount}</p>
              <p className="text-xs text-slate-400">{r.profile || 'jobs matched'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Resume filter tabs */}
      {resumes.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-2">
            <Crown className="h-3.5 w-3.5" /> Filter by Resume:
          </p>
          <button
            onClick={() => setResumeFilter('primary')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${currentResumeFilter === 'primary'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <Crown className="h-3 w-3" />
            Primary Resume {primaryResume ? `(${getResumeName(primaryResume)})` : ''}
          </button>
          {resumes.map(r => (
            <button
              key={r._id}
              onClick={() => setResumeFilter(r._id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${currentResumeFilter === r._id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {getResumeName(r)}
              {r.isPrimary && ' ★'}
            </button>
          ))}
          <button
            onClick={() => setResumeFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${currentResumeFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            All Jobs
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <SearchBar value={filters.search} onChange={(v) => updateParam('search', v)} placeholder="Search title, company…" className="md:col-span-2" />
          <FilterSelect label="Status" value={filters.status} onChange={(v) => updateParam('status', v)} options={['new', 'saved', 'applied', 'rejected', 'archived']} />
          <FilterSelect label="Remote" value={filters.remote} onChange={(v) => updateParam('remote', v)} options={[{ value: 'true', label: 'Remote only' }]} allLabel="All types" />
          <FilterSelect
            label="Min ATS Score"
            value={filters.minAts}
            onChange={(v) => updateParam('minAts', v)}
            options={[
              { value: '90', label: '90%+' },
              { value: '80', label: '80%+' },
              { value: '70', label: '70%+' },
              { value: '60', label: '60%+' },
            ]}
            allLabel="Any score"
          />
          {/* Experience filter based on selected resume */}
          <FilterSelect
            label="Min Experience (years)"
            value={filters.minExp}
            onChange={(v) => updateParam('minExp', v)}
            options={[
              { value: '', label: 'Any' },
              { value: '2', label: '2+ years' },
              { value: '3', label: '3+ years' },
              { value: '5', label: '5+ years' },
              { value: '7', label: '7+ years' },
            ]}
            allLabel="Any"
          />
          <FilterSelect label="Source" value={filters.source} onChange={(v) => updateParam('source', v)} options={['Company Career Page', 'RemoteOK API', 'Arbeitnow API', 'Manual Entry']} />
          <input placeholder="Role (e.g. Accountant)" className="input" value={filters.role} onChange={(e) => updateParam('role', e.target.value)} />
          <input placeholder="Company" className="input" value={filters.company} onChange={(e) => updateParam('company', e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-500">Sort:</span>
          {[
            ['match', 'ATS Score'], ['posted', 'Posted date'], ['company', 'Company'], ['role', 'Role'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} className={`badge ${sortBy === key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>
          ))}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="badge bg-slate-100 text-red-600 hover:bg-red-50"><X className="mr-1 h-3 w-3" /> Clear filters</button>
          )}
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2"><JobCardSkeleton /><JobCardSkeleton /><JobCardSkeleton /><JobCardSkeleton /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchJobs} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="💼"
          title={
            currentResumeFilter === 'primary' && primaryResume
              ? `No jobs matching ${getResumeName(primaryResume)} yet`
              : "No jobs found"
          }
          description={
            currentResumeFilter === 'primary' && primaryResume
              ? `Run job discovery to find jobs matching your ${getResumeName(primaryResume)} skills: ${(primaryResume.parsedProfile?.skills || []).slice(0, 5).join(', ')}`
              : "Run job discovery from your configured sources or add a job manually."
          }
          action={
            <div className="flex gap-2">
              <button onClick={runDiscovery} disabled={discovering} className="btn-primary">
                {discovering ? 'Discovering…' : 'Discover jobs'}
              </button>
              {resumes.length === 0 && (
                <Link to="/resumes" className="btn-secondary">Upload Resume First</Link>
              )}
            </div>
          }
        />
      ) : (
        <>
          {/* Primary resume context hint */}
          {showingForResume && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2 text-xs text-blue-700">
              <Target className="h-3.5 w-3.5 shrink-0" />
              <span>
                ATS scores calculated using <strong>{getResumeName(showingForResume)}</strong> skills vs each job's complete description
              </span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => <JobCard key={job._id} job={job} />)}
          </div>
          <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
        </>
      )}

      <ManualJobModal open={showManual} onClose={() => setShowManual(false)} onSaved={() => { setShowManual(false); fetchJobs(); }} />
    </div>
  );
}

const ManualJobModal = ({ open, onClose, onSaved }) => {
  const { values, errors, submitting, handleChange, setValue, handleSubmit } = useForm({
    companyName: '', jobTitle: '', jobDescription: '', jobUrl: '', location: 'Remote', remote: false,
    employmentType: 'Full-time', experienceRequired: '', skills: '', source: 'Manual Entry',
  }, async (v) => {
    const skills = v.skills.split(',').map((s) => s.trim()).filter(Boolean);
    await jobService.create({ ...v, skills });
    onSaved();
  });

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Add job manually" size="lg"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Save job'}</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className="label">Company name *</label><input name="companyName" className="input" value={values.companyName} onChange={handleChange} required /></div>
        <div><label className="label">Job title *</label><input name="jobTitle" className="input" value={values.jobTitle} onChange={handleChange} required /></div>
        <div><label className="label">Location</label><input name="location" className="input" value={values.location} onChange={handleChange} /></div>
        <div><label className="label">Employment type</label>
          <select name="employmentType" className="input" value={values.employmentType} onChange={handleChange}>
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Other'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div><label className="label">Job URL *</label><input name="jobUrl" type="url" className="input" value={values.jobUrl} onChange={handleChange} required /></div>
        <div><label className="label">Experience required</label><input name="experienceRequired" placeholder="e.g. 2+ years" className="input" value={values.experienceRequired} onChange={handleChange} /></div>
        <div><label className="label">Skills (comma separated)</label><input name="skills" className="input" value={values.skills} onChange={handleChange} /></div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="remote" checked={values.remote} onChange={handleChange} /> Remote</label>
        </div>
        <div className="md:col-span-2"><label className="label">Job description</label><textarea name="jobDescription" className="input min-h-[110px]" value={values.jobDescription} onChange={handleChange} /></div>
      </div>
      {errors.submit && <p className="mt-3 text-sm text-red-600">{errors.submit}</p>}
    </Modal>
  );
};