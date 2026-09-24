import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Globe, ExternalLink, Rss, Pencil, Trash2, ScanSearch, Loader2 } from 'lucide-react';
import { companyService, jobService } from '../services';
import { EmptyState, ErrorState } from '../components/common/Feedbacks.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { useForm } from '../hooks/useForm.js';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanningId, setScanningId] = useState(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await companyService.getAll();
      setCompanies(res.companies);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const scan = async () => {
    setScanning(true);
    try {
      const res = await jobService.scanCompanies();
      toast.success(res.message || 'Career pages scanned');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setScanning(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this company? Its discovered jobs will remain.')) return;
    try {
      await companyService.remove(id);
      toast.success('Company removed');
      fetchCompanies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const scanOne = async (id) => {
    setScanningId(id);
    try {
      const res = await companyService.scanOne(id);
      toast.success(res.message || 'Company scanned');
      fetchCompanies();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setScanningId(null);
    }
  };

  if (loading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}</div>;
  if (error) return <ErrorState message={error} onRetry={fetchCompanies} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Companies</h2>
          <p className="text-sm text-slate-500">{companies.length} tracked companies</p>
        </div>
        <div className="flex gap-2">
          <button onClick={scan} disabled={scanning} className="btn-secondary"><ScanSearch className="h-4 w-4" /> {scanning ? 'Scanning…' : 'Scan career pages'}</button>
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary"><Plus className="h-4 w-4" /> Add company</button>
        </div>
      </div>

      {companies.length === 0 ? (
        <EmptyState icon="🏢" title="No companies tracked" description="Add companies you're targeting. Their career pages can be scanned for new job listings." action={<button onClick={() => setShowModal(true)} className="btn-primary">Add company</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <div key={c._id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{c.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{c.industry || 'Industry unknown'} · {c.location || '—'}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => scanOne(c._id)} disabled={scanningId === c._id} className="btn-ghost h-8 w-8 p-0" title="Scan this company">
                    {scanningId === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { setEditing(c); setShowModal(true); }} className="btn-ghost h-8 w-8 p-0"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c._id)} className="btn-ghost h-8 w-8 p-0 text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              {c.careerPortalUsername && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400">Portal login saved</p>
              )}

              {c.website && (
                <a href={c.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
                  <Globe className="h-3.5 w-3.5" /> {c.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {c.careerPageUrl && (
                <a href={c.careerPageUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
                  <ExternalLink className="h-3.5 w-3.5" /> Career page
                </a>
              )}

              {c.notes && <p className="mt-3 line-clamp-3 text-xs text-slate-500">{c.notes}</p>}
              {c.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">{c.tags.map((t) => <span key={t} className="badge bg-slate-100 text-slate-600">{t}</span>)}</div>
              )}
              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Rss className="h-3.5 w-3.5" /> {c.activeJobsCount ?? 0} jobs</span>
                <span className="inline-flex items-center gap-1">{c.lastScanned ? `Scanned ${new Date(c.lastScanned).toLocaleDateString()}` : 'Never scanned'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CompanyModal open={showModal} onClose={() => setShowModal(false)} editing={editing} onSaved={() => { setShowModal(false); fetchCompanies(); }} />
    </div>
  );
}

const CompanyModal = ({ open, onClose, editing, onSaved }) => {
  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    {
      name: editing?.name || '',
      website: editing?.website || '',
      careerPageUrl: editing?.careerPageUrl || '',
      industry: editing?.industry || '',
      location: editing?.location || '',
      notes: editing?.notes || '',
      tags: (editing?.tags || []).join(', '),
      preferredRoles: (editing?.preferredRoles || []).join(', '),
      careerPortalUsername: editing?.careerPortalUsername || '',
      careerPortalPassword: '',
    },
    async (v) => {
      const payload = { ...v, tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean), preferredRoles: v.preferredRoles.split(',').map((t) => t.trim()).filter(Boolean) };
      if (!payload.careerPortalPassword) delete payload.careerPortalPassword;
      if (editing) await companyService.update(editing._id, payload);
      else await companyService.create(payload);
      toast.success(editing ? 'Company updated' : 'Company added');
      onSaved();
    }
  );

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit company' : 'Add company'}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><label className="label">Company name *</label><input name="name" className="input" value={values.name} onChange={handleChange} required /></div>
        <div><label className="label">Website</label><input name="website" type="url" className="input" value={values.website} onChange={handleChange} placeholder="https://…" /></div>
        <div><label className="label">Career page URL</label><input name="careerPageUrl" type="url" className="input" value={values.careerPageUrl} onChange={handleChange} placeholder="https://…/careers" /></div>
        <div><label className="label">Industry</label><input name="industry" className="input" value={values.industry} onChange={handleChange} /></div>
        <div><label className="label">Location</label><input name="location" className="input" value={values.location} onChange={handleChange} /></div>
        <div><label className="label">Tags (comma separated)</label><input name="tags" className="input" value={values.tags} onChange={handleChange} /></div>
        <div><label className="label">Preferred roles (comma separated)</label><input name="preferredRoles" className="input" value={values.preferredRoles} onChange={handleChange} placeholder="Node.js Developer, Backend Developer" /></div>
        <div><label className="label">Career portal username</label><input name="careerPortalUsername" className="input" value={values.careerPortalUsername} onChange={handleChange} autoComplete="off" /></div>
        <div><label className="label">Career portal password</label><input name="careerPortalPassword" type="password" className="input" value={values.careerPortalPassword} onChange={handleChange} placeholder="Leave blank to keep saved password" autoComplete="new-password" /></div>
        <div className="md:col-span-2"><label className="label">Notes</label><textarea name="notes" className="input" value={values.notes} onChange={handleChange} /></div>
      </div>
      {errors.submit && <p className="mt-3 text-sm text-red-600">{errors.submit}</p>}
    </Modal>
  );
};