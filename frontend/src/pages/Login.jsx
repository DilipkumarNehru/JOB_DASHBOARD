import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BriefcaseBusiness, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm.js';

const AuthShell = ({ title, subtitle, children }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 px-4 py-10">
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
          <BriefcaseBusiness className="h-6 w-6 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">Job Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">AI-powered job search &amp; application tracking</p>
      </div>
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-5">{children}</div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        Demo account: demo@jobdashboard.local / demo12345
      </p>
    </div>
  </div>
);

export const AuthShellShared = AuthShell;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { email: '', password: '' },
    async (v) => {
      const user = await login(v.email, v.password);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/dashboard');
    }
  );

  return (
    <AuthShell title="Sign in" subtitle="Enter your credentials to access your workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="email" type="email" required className="input pl-9" value={values.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="password" type={showPw ? 'text' : 'password'} required className="input pl-9 pr-10" value={values.password} onChange={handleChange} placeholder="••••••••" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPw((s) => !s)}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">Forgot password?</Link>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-center text-sm text-slate-500">
          No account? <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">Create one</Link>
        </p>
      </form>
    </AuthShell>
  );
}