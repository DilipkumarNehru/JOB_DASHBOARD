import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, KeyRound, Save, Trash2, Shield } from 'lucide-react';
import { authService, emailService } from '../services';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { useForm } from '../hooks/useForm.js';

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { name: user?.name || '', email: user?.email || '', location: user?.location || '', phone: user?.phone || '', linkedin: user?.linkedinUrl || '' },
    async (v) => {
      await authService.updateProfile(v);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    }
  );

  const clearEmails = async () => {
    setDeleting(true);
    try {
      const res = await emailService.deleteAll();
      toast.success(res.message);
      setShowDanger(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const resetPassword = async () => {
    try {
      const res = await authService.forgotPassword(values.email || user?.email);
      toast.success(res.message || 'Password reset email sent');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Your profile and account preferences.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Profile" actions={saved && <span className="text-xs font-medium text-emerald-600">Saved ✓</span>}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"><User className="h-6 w-6" /></div>
              <p className="text-sm text-slate-500">{values.email}</p>
            </div>
            <div><label className="label">Name</label><input name="name" className="input" value={values.name} onChange={handleChange} /></div>
            <div><label className="label">Display email</label><input name="email" type="email" className="input" value={values.email} onChange={handleChange} /></div>
            <div><label className="label">Phone</label><input name="phone" className="input" value={values.phone} onChange={handleChange} /></div>
            <div><label className="label">Location</label><input name="location" className="input" value={values.location} onChange={handleChange} /></div>
            <div><label className="label">LinkedIn</label><input name="linkedin" className="input" value={values.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/…" /></div>
            <div className="pt-1"><button onClick={handleSubmit} disabled={submitting} className="btn-primary"><Save className="h-4 w-4" /> {submitting ? 'Saving…' : 'Save profile'}</button></div>
            {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Password" subtitle="Reset link is emailed to you">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><KeyRound className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">Send a password reset email to <b>{values.email || user?.email}</b>.</p>
                <button onClick={resetPassword} className="btn-secondary mt-3"><KeyRound className="h-4 w-4" /> Send reset link</button>
              </div>
            </div>
          </Card>

          <Card title="Gmail" subtitle="Manage your email connection">
            <p className="text-sm text-slate-600">
              Gmail is managed in <Link to="/integrations" className="font-medium text-brand-600 hover:underline">Integrations</Link>. Only job-search-related emails are scanned — never auto-sent.
            </p>
          </Card>

          <Card title="Danger zone">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {!showDanger ? (
                <button onClick={() => setShowDanger(true)} className="btn-secondary text-red-600"><Shield className="h-4 w-4" /> Clear synced emails…</button>
              ) : (
                <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">Delete all locally synced emails? Your Gmail account is <b>not</b> affected.</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={clearEmails} disabled={deleting} className="btn-primary bg-red-600 hover:bg-red-700"><Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete emails'}</button>
                    <button onClick={() => setShowDanger(false)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
        Don't want manual entry? Set up <b>n8n</b> automation — see <Link to="/integrations" className="font-medium text-brand-600 hover:underline">Integrations</Link>.
      </div>
    </div>
  );
}