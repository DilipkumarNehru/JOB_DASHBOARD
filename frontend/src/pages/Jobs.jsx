import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Download, X } from 'lucide-react';
import { jobService } from '../services';
import { JobCard, JobCardSkeleton } from '../components/jobs/JobCard.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { FilterSelect, SearchBar } from '../components/common/Form.jsx';
import { useForm } from '../hooks/useForm.js';
import { sortJobs, toQueryString } from '../utils/format.js';

const DEFAULT = { status: '', remote: '', source: '', match: '', role: '', company: '', location: '', search: '' };

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

  const filters = useMemo(() => {
    const recommended = params.get('recommended') === '1';
    return {
      status: params.get('status') || '',
      remote: params.get('remote') || '',
      source: params.get('source') || '',
      match: params.get('match') || '',
      role: params.get('role') || '',
      company: params.get('company') || '',
      location: params.get('location') || '',
      search: params.get('search') || '',
      recommended,
    };
  }, [params]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setParams(next);
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobService.getAll({
        status: filters.status || undefined,
        remote: filters.remote || undefined,
        source: filters.source || undefined,
        minMatch: filters.match || undefined,
        role: filters.role || undefined,
        company: filters.company || undefined,
        search: filters.search || undefined,
        page,
        limit: 12,
      });
      let list = res.jobs;
      if (filters.recommended) list = list.filter((j) => j.matchScore >= 70);
      setJobs(sortJobs(list, sortBy));
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters, page, sortBy]);

  const runDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await jobService.discover({});
      toast.success(res.message);
      fetchJobs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDiscovering(false);
    }
  };

  const resetFilters = () => {
    const p = new URLSearchParams();
    p.set('page', '1');
    setParams(p);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Jobs {filters.recommended && <span className="text-sm font-medium text-emerald-600">· Recommended</span>}</h2>
          <p className="text-sm text-slate-500">{total} jobs in your pool</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runDiscovery} disabled={discovering} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${discovering ? 'animate-spin' : ''}`} /> {discovering ? 'Discovering…' : 'Discover jobs'}
          </button>
          <button onClick={() => setShowManual(true)} className="btn-primary"><Plus className="h-4 w-4" /> Add job</button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <SearchBar value={filters.search} onChange={(v) => updateParam('search', v)} placeholder="Search title, description…" className="md:col-span-2" />
          <FilterSelect label="Status" value={filters.status} onChange={(v) => updateParam('status', v)} options={['new', 'saved', 'applied', 'rejected', 'archived']} />
          <FilterSelect label="Remote" value={filters.remote} onChange={(v) => updateParam('remote', v)} options={[{ value: 'true', label: 'Remote only' }]} allLabel="All types" />
          <FilterSelect label="Minimum match" value={filters.match} onChange={(v) => updateParam('match', v)} options={['40', '50', '60', '70', '80', '90']} allLabel="Any score" />
          <FilterSelect label="Source" value={filters.source} onChange={(v) => updateParam('source', v)} options={['Company Career Page', 'RemoteOK API', 'Arbeitnow API', 'Manual Entry']} />
          <input placeholder="Role (e.g. Node.js Developer)" className="input" value={filters.role} onChange={(e) => updateParam('role', e.target.value)} />
          <input placeholder="Company" className="input" value={filters.company} onChange={(e) => updateParam('company', e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-500">Sort:</span>
          {[
            ['match', 'Match %'], ['posted', 'Posted date'], ['company', 'Company'], ['role', 'Role'], ['location', 'Location'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} className={`badge ${sortBy === key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>
          ))}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="badge bg-slate-100 text-red-600 hover:bg-red-50"><X className="mr-1 h-3 w-3" /> Clear filters</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2"><JobCardSkeleton /><JobCardSkeleton /><JobCardSkeleton /><JobCardSkeleton /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchJobs} />
      ) : jobs.length === 0 ? (
        <EmptyState icon="💼" title="No jobs found" description="Run job discovery from your configured sources or add a job manually." action={<button onClick={runDiscovery} disabled={discovering} className="btn-primary">Discover jobs</button>} />
      ) : (
        <>
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