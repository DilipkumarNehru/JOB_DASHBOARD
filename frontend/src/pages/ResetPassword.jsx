import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { authService } from '../services';
import { useForm } from '../hooks/useForm.js';
import { AuthShellShared } from './Login.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { password: '', confirmPassword: '' },
    async (v) => {
      if (!token) throw new Error('Missing reset token');
      if (v.password !== v.confirmPassword) throw new Error('Passwords do not match');
      await authService.resetPassword({ token, password: v.password });
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    }
  );

  return (
    <AuthShellShared title="Reset password" subtitle="Choose a new password for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New password</label>
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
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthShellShared>
  );
}