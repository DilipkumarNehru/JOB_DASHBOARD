import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User, KeyRound, Save, Trash2, Shield, Eye, EyeOff, Database,
  Sparkles, Mail, Webhook, CheckCircle2, ShieldCheck, RefreshCw
} from 'lucide-react';
import { authService, emailService } from '../services';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { useForm } from '../hooks/useForm.js';

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [savingKeys, setSavingKeys] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Visibility toggles for sensitive fields
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showN8nSecret, setShowN8nSecret] = useState(false);

  // API Keys state (stored in MongoDB per user)
  const [apiKeys, setApiKeys] = useState({
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    googleClientId: '',
    googleClientSecret: '',
    googleRedirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/gmail/callback` : 'http://localhost:5000/api/gmail/callback',
    n8nBaseUrl: 'http://localhost:5678',
    n8nWebhookSecret: '',
    source: 'database',
    isConfiguredInDb: true,
  });

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { name: user?.name || '', email: user?.email || '', location: user?.location || '', phone: user?.phone || '', linkedin: user?.linkedinUrl || '' },
    async (v) => {
      await authService.updateProfile(v);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      toast.success('Profile updated successfully');
    }
  );

  // Fetch user API keys from database
  useEffect(() => {
    loadUserApiKeys();
  }, []);

  const loadUserApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await authService.getApiKeys();
      if (res.success && res.apiKeys) {
        setApiKeys({
          openaiApiKey: res.apiKeys.openaiApiKey || '',
          openaiModel: res.apiKeys.openaiModel || 'gpt-4o-mini',
          googleClientId: res.apiKeys.googleClientId || '',
          googleClientSecret: res.apiKeys.googleClientSecret || '',
          googleRedirectUri: res.apiKeys.googleRedirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/api/gmail/callback` : 'http://localhost:5000/api/gmail/callback'),
          n8nBaseUrl: res.apiKeys.n8nBaseUrl || 'http://localhost:5678',
          n8nWebhookSecret: res.apiKeys.n8nWebhookSecret || '',
          source: res.apiKeys.source || 'database',
          isConfiguredInDb: res.apiKeys.isConfiguredInDb ?? true,
        });
      }
    } catch (err) {
      toast.error('Could not load API keys: ' + err.message);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleApiKeyChange = (field, val) => {
    setApiKeys(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveApiKeys = async (e) => {
    e.preventDefault();
    setSavingKeys(true);
    try {
      const res = await authService.updateApiKeys(apiKeys);
      if (res.success) {
        toast.success(res.message || 'API keys saved to your database profile!');
        setKeysSaved(true);
        setTimeout(() => setKeysSaved(false), 4000);
        if (res.apiKeys) {
          setApiKeys(prev => ({
            ...prev,
            ...res.apiKeys,
          }));
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save API keys');
    } finally {
      setSavingKeys(false);
    }
  };

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Account & Integration Settings</h2>
          <p className="text-sm text-slate-500">
            Manage your personal profile and dedicated API keys stored securely in the database for your account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            Database-backed Credentials Active
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card title="Profile" actions={saved && <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>}>
          <div className="space-y-3.5">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 font-bold text-lg shadow-sm">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{values.email}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 uppercase tracking-wide">
                  Role: {user?.role || 'user'}
                </span>
              </div>
            </div>
            <div><label className="label">Full Name</label><input name="name" className="input" value={values.name} onChange={handleChange} /></div>
            <div><label className="label">Display Email</label><input name="email" type="email" className="input" value={values.email} onChange={handleChange} /></div>
            <div><label className="label">Phone</label><input name="phone" className="input" value={values.phone} onChange={handleChange} /></div>
            <div><label className="label">Location</label><input name="location" className="input" value={values.location} onChange={handleChange} /></div>
            <div><label className="label">LinkedIn</label><input name="linkedin" className="input" value={values.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/…" /></div>
            <div className="pt-2">
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                <Save className="h-4 w-4 mr-1.5" /> {submitting ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
            {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
          </div>
        </Card>

        {/* Security & Danger Zone Column */}
        <div className="space-y-6">
          <Card title="Password Security" subtitle="Reset password link">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  Send a password reset verification link to <b>{values.email || user?.email}</b>.
                </p>
                <button onClick={resetPassword} className="btn-secondary mt-3">
                  <KeyRound className="h-4 w-4 mr-1.5" /> Send Reset Link
                </button>
              </div>
            </div>
          </Card>

          <Card title="Gmail Integration" subtitle="Ingestion connection status">
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Gmail authorization and inbox scanning is managed in{' '}
                <Link to="/integrations" className="font-semibold text-brand-600 hover:underline">
                  Integrations
                </Link>
                . Your Google credentials below are loaded directly from your database user data.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Read-only OAuth scope is used. The app never auto-sends emails without confirmation.
              </div>
            </div>
          </Card>

          <Card title="Danger Zone">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {!showDanger ? (
                <button onClick={() => setShowDanger(true)} className="btn-secondary text-red-600 hover:bg-red-50">
                  <Shield className="h-4 w-4 mr-1.5" /> Clear Synced Emails…
                </button>
              ) : (
                <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">
                    Delete all locally synced emails from the database?
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Your real Gmail mailbox is completely unaffected.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={clearEmails} disabled={deleting} className="btn-primary bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-4 w-4 mr-1.5" /> {deleting ? 'Deleting…' : 'Confirm Delete Emails'}
                    </button>
                    <button onClick={() => setShowDanger(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* FULL-WIDTH DATABASE API KEYS & SECRETS CARD */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-brand-600" />
            <span>API Keys & Secrets (Stored in Database per User)</span>
          </div>
        }
        subtitle="These credentials are saved directly to your MongoDB record and used for all AI completions, Google OAuth, and n8n webhooks."
        actions={
          keysSaved ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Saved in Database ✓
            </span>
          ) : (
            <button
              onClick={loadUserApiKeys}
              disabled={loadingKeys}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              title="Reload from DB"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingKeys ? 'animate-spin' : ''}`} /> Reload
            </button>
          )
        }
      >
        <form onSubmit={handleSaveApiKeys} className="space-y-6">
          {/* OpenAI Configuration Section */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">AI Provider (OpenAI)</h4>
                  <p className="text-xs text-slate-500">Power resume parsing, JD matching analysis, and mock interviews</p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Active in DB
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="label flex items-center justify-between">
                  <span>OpenAI API Key</span>
                  <button
                    type="button"
                    onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    {showOpenAiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showOpenAiKey ? 'Hide' : 'Reveal'}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showOpenAiKey ? 'text' : 'password'}
                    className="input font-mono text-xs pr-10"
                    placeholder="sk-proj-..."
                    value={apiKeys.openaiApiKey}
                    onChange={(e) => handleApiKeyChange('openaiApiKey', e.target.value)}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Stored securely with AES-256 encryption in your database record.
                </p>
              </div>

              <div>
                <label className="label">OpenAI Model</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder="gpt-4o-mini"
                  value={apiKeys.openaiModel}
                  onChange={(e) => handleApiKeyChange('openaiModel', e.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Recommended: <code>gpt-4o-mini</code> or <code>gpt-4o</code>
                </p>
              </div>
            </div>
          </div>

          {/* Google OAuth & Gmail Configuration Section */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Google OAuth 2.0 (Gmail Integration)</h4>
                  <p className="text-xs text-slate-500">Credentials created in Google Cloud Console for reading recruiter emails</p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Active in DB
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Google Client ID</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder="...apps.googleusercontent.com"
                  value={apiKeys.googleClientId}
                  onChange={(e) => handleApiKeyChange('googleClientId', e.target.value)}
                />
              </div>

              <div>
                <label className="label flex items-center justify-between">
                  <span>Google Client Secret</span>
                  <button
                    type="button"
                    onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    {showGoogleSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showGoogleSecret ? 'Hide' : 'Reveal'}
                  </button>
                </label>
                <input
                  type={showGoogleSecret ? 'text' : 'password'}
                  className="input font-mono text-xs"
                  placeholder="GOCSPX-..."
                  value={apiKeys.googleClientSecret}
                  onChange={(e) => handleApiKeyChange('googleClientSecret', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Authorized Redirect URI</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder={typeof window !== 'undefined' ? `${window.location.origin}/api/gmail/callback` : 'https://your-domain.com/api/gmail/callback'}
                  value={apiKeys.googleRedirectUri}
                  onChange={(e) => handleApiKeyChange('googleRedirectUri', e.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Must match the Authorized redirect URI in Google Cloud Console.
                </p>
              </div>
            </div>
          </div>

          {/* n8n Automation Orchestrator Section */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                  <Webhook className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">n8n Automation Orchestrator</h4>
                  <p className="text-xs text-slate-500">Webhook authentication settings for scheduled workflows</p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Active in DB
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">n8n Base URL</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder="http://localhost:5678"
                  value={apiKeys.n8nBaseUrl}
                  onChange={(e) => handleApiKeyChange('n8nBaseUrl', e.target.value)}
                />
              </div>

              <div>
                <label className="label flex items-center justify-between">
                  <span>n8n Webhook Secret Token</span>
                  <button
                    type="button"
                    onClick={() => setShowN8nSecret(!showN8nSecret)}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    {showN8nSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showN8nSecret ? 'Hide' : 'Reveal'}
                  </button>
                </label>
                <input
                  type={showN8nSecret ? 'text' : 'password'}
                  className="input font-mono text-xs"
                  placeholder="job_dashboard_n8n_secret_token_2026"
                  value={apiKeys.n8nWebhookSecret}
                  onChange={(e) => handleApiKeyChange('n8nWebhookSecret', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Keys are saved encrypted in your user document in MongoDB. The backend uses these values directly.</span>
            </div>
            <button
              type="submit"
              disabled={savingKeys}
              className="btn-primary w-full sm:w-auto px-6 py-2.5 shadow-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingKeys ? 'Saving to Database…' : 'Save Keys to Database'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}