import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { authService } from '../services';
import { useForm } from '../hooks/useForm.js';
import { AuthShellShared } from './Login.jsx';

export default function ForgotPassword() {
  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    { email: '' },
    async (v) => {
      const res = await authService.forgotPassword(v.email);
      toast.success('Reset link generated. Check the console/server for the token.');
      console.log('Reset token (dev):', res.resetToken);
    }
  );

  return (
    <AuthShellShared title="Forgot password" subtitle="We'll generate a reset link for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="email" type="email" required className="input pl-9" value={values.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
        </div>
        {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Remembered it? <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
        </p>
      </form>
    </AuthShellShared>
  );
}