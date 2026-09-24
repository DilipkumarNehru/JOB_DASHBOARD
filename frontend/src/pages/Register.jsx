import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm.js';
import { AuthShellShared } from './Login.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { name: '', email: '', password: '', confirmPassword: '', title: 'Backend Developer', location: 'Bengaluru, India' },
    async (v) => {
      if (v.password !== v.confirmPassword) throw new Error('Passwords do not match');
      const user = await register({ name: v.name, email: v.email, password: v.password, title: v.title, location: v.location });
      toast.success(`Account created for ${user.name}`);
      navigate('/dashboard');
    }
  );

  return (
    <AuthShellShared title="Create account" subtitle="Start tracking jobs, resumes and applications">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="name" required className="input pl-9" value={values.name} onChange={handleChange} placeholder="Your name" />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="email" type="email" required className="input pl-9" value={values.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Title</label>
            <input name="title" className="input" value={values.title} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Location</label>
            <input name="location" className="input" value={values.location} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="password" type="password" required minLength={6} className="input pl-9" value={values.password} onChange={handleChange} placeholder="At least 6 characters" />
          </div>
        </div>
        <div>
          <label className="label">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="confirmPassword" type="password" required className="input pl-9" value={values.confirmPassword} onChange={handleChange} placeholder="Repeat password" />
          </div>
        </div>
        {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
        </p>
      </form>
    </AuthShellShared>
  );
}