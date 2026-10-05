import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, UserX, Shield, ShieldCheck, Key, Lock, Unlock,
  Clock, Activity, Wifi, WifiOff, LogOut, Eye, EyeOff, Search,
  Filter, RefreshCw, Trash2, Edit3, AlertTriangle, CheckCircle2,
  XCircle, Smartphone, Monitor, Globe, FileText, Sparkles, Copy,
  Check, X, ChevronLeft, ChevronRight, Crown, Laptop, Info,
  ExternalLink, Calendar, Building2, Briefcase, Mail, MapPin, DollarSign
} from 'lucide-react';
import { adminService } from '../services';
import { formatDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── Helper: Format date/time ───────────────────────────────────── */
const formatFullDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Never';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

/* ─── Modal: Admin Change Password ───────────────────────────────── */
function ChangePasswordModal({ user, onClose, onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateStrongPassword = () => {
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const res = await adminService.changePassword(user._id, newPassword);
      toast.success(res.message || `Password changed for ${user.name}`);
      if (onPasswordChanged) onPasswordChanged(user._id);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">Change User Password</p>
              <p className="text-xs text-slate-500">
                User: <span className="font-semibold text-slate-700">{user.name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Account: {user.email}</p>
            <p className="text-slate-500 mt-0.5">The new password will be immediately hashed using bcrypt. The user can log in with this new password right away.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">New Password</label>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700"
              >
                <Sparkles className="h-3 w-3" /> Auto-generate strong
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new secure password (min 6 chars)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <p className="text-[11px] text-slate-400 mt-1">
                Length: {newPassword.length} characters {newPassword.length >= 8 ? '✓' : '(Recommended: 8+)'}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newPassword || newPassword.length < 6}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700 transition-colors shadow-md disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Modal: Edit User Details ───────────────────────────────────── */
function EditUserModal({ user, onClose, onUserUpdated }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState(user.role || 'user');
  const [status, setStatus] = useState(user.status || 'active');
  const [title, setTitle] = useState(user.title || '');
  const [location, setLocation] = useState(user.location || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [experienceYears, setExperienceYears] = useState(user.experienceYears || 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminService.updateUser(user._id, {
        name,
        email,
        role,
        status,
        title,
        location,
        phone,
        experienceYears: Number(experienceYears) || 0,
      });
      toast.success(res.message || 'User details updated');
      if (onUserUpdated) onUserUpdated(res.user);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">Edit User Profile &amp; Role</p>
              <p className="text-xs text-slate-500">ID: {user._id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="user">Regular User (Job Seeker)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="active">Active (Access allowed)</option>
                <option value="suspended">Suspended (Access blocked)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru, India"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555-0123"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save User Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Modal: Detailed User Information & Dashboard Overview ──────── */
function UserInfoModal({ user: initialUser, onClose, onOpenChangePassword, onOpenEditUser, onUserUpdated }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [modalTab, setModalTab] = useState('overview'); // 'overview' | 'resumes' | 'matches' | 'applications' | 'logs'
  const [showPlainPassword, setShowPlainPassword] = useState(true);
  const [copiedPlainPassword, setCopiedPlainPassword] = useState(false);
  const [inlineNewPass, setInlineNewPass] = useState('');
  const [inlineSavingPass, setInlineSavingPass] = useState(false);
  const [showInlinePass, setShowInlinePass] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await adminService.getUser(initialUser._id);
        if (isMounted) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load user details');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [initialUser._id]);

  const copyPlainPassword = (pass) => {
    if (pass) {
      navigator.clipboard.writeText(pass);
      setCopiedPlainPassword(true);
      toast.success('Decrypted password copied to clipboard');
      setTimeout(() => setCopiedPlainPassword(false), 2000);
    }
  };

  const handleInlineSetPassword = async (e) => {
    e.preventDefault();
    if (!inlineNewPass || inlineNewPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setInlineSavingPass(true);
    try {
      const res = await adminService.changePassword(initialUser._id, inlineNewPass);
      toast.success(res.message || 'Password successfully updated');
      setData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          decryptedPassword: inlineNewPass,
          hasDecryptedPassword: true,
        }
      }));
      setInlineNewPass('');
      setShowInlinePass(false);
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setInlineSavingPass(false);
    }
  };

  const generateInlinePassword = () => {
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInlineNewPass(pass);
    setShowInlinePass(true);
  };

  const copyPasswordHash = () => {
    if (data?.user?.password) {
      navigator.clipboard.writeText(data.user.password);
      setCopiedHash(true);
      toast.success('Password hash copied to clipboard');
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const copyEmail = () => {
    const emailToCopy = data?.user?.email || initialUser?.email;
    if (emailToCopy) {
      navigator.clipboard.writeText(emailToCopy);
      setCopiedEmail(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const user = data?.user || initialUser;
  const dashboard = data?.dashboard || {};
  const metrics = dashboard.metrics || {};
  const resumes = data?.resumes || [];
  const applications = data?.applications || [];
  const recentLogs = data?.recentLogs || [];
  const topMatches = dashboard.topMatches || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative flex flex-col w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden my-6 max-h-[92vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-lg shadow-md">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-slate-900 text-lg">{user.name}</h2>
                {user.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                    <Crown className="h-3 w-3" /> ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    User
                  </span>
                )}
                {user.status === 'suspended' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                    <UserX className="h-3 w-3" /> Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <UserCheck className="h-3 w-3" /> Active
                  </span>
                )}
                {user.isOnline ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Online
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Offline</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500">{user.email}</p>
                <button onClick={copyEmail} className="text-slate-400 hover:text-slate-600" title="Copy email">
                  {copiedEmail ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
                {user.title && <span className="text-xs text-slate-400">· {user.title}</span>}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChangePassword(user)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 shadow-sm transition-colors"
            >
              <Key className="h-3.5 w-3.5 text-amber-600" />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => onOpenEditUser(user)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 shadow-sm transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5 text-blue-600" />
              <span>Edit Profile</span>
            </button>

            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-2 bg-slate-50/70 overflow-x-auto">
          <button
            onClick={() => setModalTab('overview')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'overview' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Overview &amp; Credentials
          </button>
          <button
            onClick={() => setModalTab('resumes')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'resumes' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resumes ({resumes.length})
          </button>
          <button
            onClick={() => setModalTab('matches')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'matches' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Matched Jobs ({metrics.totalJobMatches || 0})
          </button>
          <button
            onClick={() => setModalTab('applications')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'applications' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setModalTab('logs')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              modalTab === 'logs' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Login / Logout Logs ({recentLogs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
              <p className="font-semibold text-slate-600 text-sm">Loading complete user profile and dashboard data…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* SUB-TAB 1: Overview & Credentials */}
              {modalTab === 'overview' && (
                <div className="space-y-6">
                  {/* Credentials & Security Box */}
                  <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Credentials &amp; Security</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        Encrypted Storage
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Username / Email</span>
                        <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                          <span className="truncate">{user.email}</span>
                          <button onClick={copyEmail} className="text-slate-400 hover:text-slate-600 p-1">
                            {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* User ID */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">User ID (MongoDB ObjectId)</span>
                        <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 truncate">
                          {user._id}
                        </div>
                      </div>
                    </div>

                    {/* Decrypted Original Password Display */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-emerald-600" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                            Decrypted Original Password
                          </span>
                          {user.decryptedPassword ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Decrypted (AES-256)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              Legacy Hash Only
                            </span>
                          )}
                        </div>

                        {user.decryptedPassword && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowPlainPassword(!showPlainPassword)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-2xs transition-colors"
                            >
                              {showPlainPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              {showPlainPassword ? 'Mask' : 'Reveal'}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyPlainPassword(user.decryptedPassword)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
                            >
                              {copiedPlainPassword ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedPlainPassword ? 'Copied' : 'Copy Password'}
                            </button>
                          </div>
                        )}
                      </div>

                      {user.decryptedPassword ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 shadow-inner">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                              <Lock className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-mono uppercase">User's Original Password</p>
                              <p className="font-mono text-base font-bold text-emerald-400 tracking-wider">
                                {showPlainPassword ? user.decryptedPassword : '••••••••••••'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenChangePassword(user)}
                              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors shadow"
                            >
                              <Key className="h-3.5 w-3.5" />
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-amber-900">
                                Password Not Yet Captured (Legacy One-Way Hash Account)
                              </p>
                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                This user registered before reversible AES-256 encryption was enabled. You can set a password right now below, or it will be auto-decrypted the next time the user logs in:
                              </p>
                            </div>
                          </div>

                          <form onSubmit={handleInlineSetPassword} className="flex flex-wrap items-center gap-2 pt-1">
                            <div className="relative flex-1 min-w-[200px]">
                              <input
                                type={showInlinePass ? "text" : "password"}
                                value={inlineNewPass}
                                onChange={(e) => setInlineNewPass(e.target.value)}
                                placeholder="Enter new password to assign & decrypt…"
                                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 pr-8 text-xs font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowInlinePass(!showInlinePass)}
                                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                              >
                                {showInlinePass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={generateInlinePassword}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                            >
                              Generate
                            </button>
                            <button
                              type="submit"
                              disabled={inlineSavingPass}
                              className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50 shadow-sm"
                            >
                              {inlineSavingPass ? 'Saving…' : 'Set & Decrypt Now'}
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Secondary: Bcrypt hash if needed for audit */}
                      {user.password && (
                        <details className="text-[11px] text-slate-500">
                          <summary className="cursor-pointer hover:text-slate-700 font-semibold flex items-center gap-1 select-none">
                            <span>View Raw Bcrypt Hash String</span>
                            <span className="text-[10px] text-slate-400">({user.password.substring(0, 10)}...)</span>
                          </summary>
                          <div className="mt-1.5 flex items-center justify-between rounded-lg bg-slate-100 p-2 font-mono text-[10px] text-slate-600 break-all">
                            <span>{user.password}</span>
                            <button
                              type="button"
                              onClick={copyPasswordHash}
                              className="ml-2 shrink-0 text-slate-400 hover:text-slate-700"
                              title="Copy hash"
                            >
                              {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Connection & Auth Metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-amber-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered On</span>
                        <span className="font-semibold text-slate-700">{formatDate(user.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Login</span>
                        <span className="font-semibold text-slate-700">{formatTimeAgo(user.lastLoginAt)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Active Heartbeat</span>
                        <span className="font-semibold text-slate-700">{formatTimeAgo(user.lastActiveAt)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Login IP</span>
                        <span className="font-mono font-semibold text-slate-700">{user.lastLoginIp || '127.0.0.1'}</span>
                      </div>
                    </div>
                  </div>

                  {/* That Particular User's Complete Dashboard Metrics */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      User Dashboard Metrics Overview
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                        <span className="text-[11px] font-bold uppercase text-blue-900">Total Matched Jobs</span>
                        <p className="text-2xl font-black text-blue-700 mt-1">{metrics.totalJobMatches || 0}</p>
                        <p className="text-xs text-blue-600 mt-0.5">{metrics.highJobMatches || 0} high match jobs (&gt;80%)</p>
                      </div>

                      <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
                        <span className="text-[11px] font-bold uppercase text-violet-900">Resumes Uploaded</span>
                        <p className="text-2xl font-black text-violet-700 mt-1">{metrics.totalResumes || 0}</p>
                        <p className="text-xs text-violet-600 mt-0.5">
                          Avg ATS: {metrics.avgAtsScore ? `${metrics.avgAtsScore}/100` : '—'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                        <span className="text-[11px] font-bold uppercase text-emerald-900">Job Applications</span>
                        <p className="text-2xl font-black text-emerald-700 mt-1">{metrics.totalApplications || 0}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {metrics.applicationStatusCounts?.interviewing || 0} interviewing · {metrics.applicationStatusCounts?.offer || 0} offers
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="text-[11px] font-bold uppercase text-slate-700">Interviews &amp; Follow-ups</span>
                        <p className="text-2xl font-black text-slate-800 mt-1">{metrics.totalInterviews || 0}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{metrics.totalFollowUps || 0} follow-up reminders</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">User Profile &amp; Preferences</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Job Title</span>
                        <span className="font-semibold text-slate-800">{user.title || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Location</span>
                        <span className="font-semibold text-slate-800">{user.location || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Phone</span>
                        <span className="font-semibold text-slate-800">{user.phone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Experience</span>
                        <span className="font-semibold text-slate-800">{user.experienceYears || 0} years</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Gmail Sync Integration:</span>
                      <span className={`font-semibold ${user.gmailConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {user.gmailConnected ? `Connected (${user.gmailEmail})` : 'Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: User's Resumes */}
              {modalTab === 'resumes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Uploaded Resumes ({resumes.length})
                    </p>
                    {metrics.primaryResumeName && (
                      <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        Active Primary: {metrics.primaryResumeName}
                      </span>
                    )}
                  </div>

                  {resumes.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                      This user has not uploaded any resumes yet.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {resumes.map((r) => {
                        const prof = r.parsedProfile || {};
                        return (
                          <div
                            key={r._id}
                            className={`rounded-xl border p-4 transition-all ${
                              r.isPrimary ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-300' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 text-sm">{r.resumeName || r.originalFileName || 'Resume'}</p>
                                    {r.isPrimary && (
                                      <span className="rounded-full bg-blue-600 px-2 py-0.2 text-[9px] font-bold text-white uppercase">PRIMARY</span>
                                    )}
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                                      {r.fileType || 'DOC'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Uploaded {formatDate(r.createdAt)} · {prof.name || 'Candidate'} · {prof.email || ''}
                                  </p>
                                </div>
                              </div>

                              {r.atsScore !== null && r.atsScore !== undefined && (
                                <div className="flex flex-col items-center rounded-xl bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200">
                                  <span className="text-base font-black">{r.atsScore}</span>
                                  <span className="text-[9px] uppercase font-bold">Quality</span>
                                </div>
                              )}
                            </div>

                            {/* Skills badges */}
                            {(prof.skills || []).length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-2.5">
                                {prof.skills.slice(0, 10).map((skill, idx) => (
                                  <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                    {skill}
                                  </span>
                                ))}
                                {prof.skills.length > 10 && (
                                  <span className="text-[10px] text-slate-400">+{prof.skills.length - 10} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 3: Matched Jobs */}
              {modalTab === 'matches' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Top Matched Jobs for this Candidate ({metrics.totalJobMatches || 0} Total Matches)
                    </p>
                  </div>

                  {topMatches.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                      No matched jobs calculated for this user yet.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {topMatches.map((match) => {
                        const job = match.jobId || {};
                        const title = job.jobTitle || job.title || 'Job Title Unavailable';
                        const company = job.companyName || job.company || 'Company';
                        const applyUrl = job.careerPageUrl || job.jobUrl || job.url || job.companyWebsite;
                        const score = match.overallMatch ?? match.matchScore ?? 0;
                        const salaryText = job.salary?.min ? `₹${(job.salary.min / 100000).toFixed(1)}L - ₹${(job.salary.max / 100000).toFixed(1)}L` : (typeof job.salary === 'string' ? job.salary : '');
                        return (
                          <div key={match._id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-violet-300 transition-all">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                                <p className="text-xs text-slate-600 font-semibold mt-0.5">{company}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                  <span>{job.location || 'Location'}</span>
                                  {salaryText && <span>· {salaryText}</span>}
                                  {job.source && <span>· Source: {job.source}</span>}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className={`rounded-xl px-2.5 py-1 text-xs font-black shadow-xs ${
                                  score >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {score}% Match
                                </span>
                                {applyUrl && (
                                  <a
                                    href={applyUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800 hover:underline font-semibold"
                                  >
                                    Apply Now <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 4: Applications */}
              {modalTab === 'applications' && (
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tracked Applications ({applications.length})
                  </p>

                  {applications.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                      This user has not tracked any job applications yet.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Job Title</th>
                            <th className="px-4 py-2.5">Company</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5">Applied Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {applications.map((app) => (
                            <tr key={app._id} className="hover:bg-slate-50/60">
                              <td className="px-4 py-2.5 font-bold text-slate-800">{app.jobTitle || 'Role'}</td>
                              <td className="px-4 py-2.5 text-slate-600">{app.companyName || '—'}</td>
                              <td className="px-4 py-2.5">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                  {app.status || 'applied'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">{formatDate(app.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 5: Login & Auth Logs */}
              {modalTab === 'logs' && (
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    User Session &amp; Login History (Last {recentLogs.length} Events)
                  </p>

                  {recentLogs.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                      No authentication events logged for this user yet.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Timestamp</th>
                            <th className="px-4 py-2.5">Event Action</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5">IP Address</th>
                            <th className="px-4 py-2.5">Device &amp; Browser</th>
                            <th className="px-4 py-2.5">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {recentLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-50/60">
                              <td className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                                {formatFullDateTime(log.createdAt)}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                {log.status === 'success' ? (
                                  <span className="text-emerald-600 font-bold">Success</span>
                                ) : (
                                  <span className="text-red-600 font-bold">Failed</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-slate-600">{log.ipAddress || '127.0.0.1'}</td>
                              <td className="px-4 py-2.5 text-slate-600">
                                {log.device || 'Desktop'} · {log.browser || 'Browser'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">
                                {log.isLive ? (
                                  <span className="text-emerald-600 font-bold">Live Now</span>
                                ) : (
                                  `${log.sessionDurationMinutes || 0}m`
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50">
          <span className="text-xs text-slate-400">
            User ID: <span className="font-mono text-slate-600">{user._id}</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Dashboard Component ────────────────────────────── */
export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'users' | 'logs' | 'jobs'

  // Stats state
  const [stats, setStats] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userOnlineFilter, setUserOnlineFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [logLiveOnly, setLogLiveOnly] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logPagination, setLogPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // Admin Jobs state
  const [adminJobs, setAdminJobs] = useState([]);
  const [adminJobsLoading, setAdminJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [jobSourceFilter, setJobSourceFilter] = useState('all');
  const [jobSortBy, setJobSortBy] = useState('latest');
  const [adminJobPage, setAdminJobPage] = useState(1);
  const [adminJobPagination, setAdminJobPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Modals state
  const [infoModalUser, setInfoModalUser] = useState(null);
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [editModalUser, setEditModalUser] = useState(null);

  // Row password reveal state
  const [revealedRowPasswords, setRevealedRowPasswords] = useState({});
  const toggleRowPassword = (userId) => {
    setRevealedRowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };
  const copyTableRowPassword = (password) => {
    navigator.clipboard.writeText(password);
    toast.success('Decrypted password copied to clipboard');
  };

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimerRef = useRef(null);

  /* ─── Fetch Stats & Live Overview ──────────────────────────────── */
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getStats();
      setStats(res.stats);
      setLiveSessions(res.liveSessions || []);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /* ─── Fetch Users ──────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await adminService.getUsers({
        page: userPage,
        limit: 15,
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter,
        online: userOnlineFilter,
      });
      setUsers(res.users || []);
      setUserPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, userSearch, userRoleFilter, userStatusFilter, userOnlineFilter]);

  /* ─── Fetch Logs ───────────────────────────────────────────────── */
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await adminService.getLogs({
        page: logPage,
        limit: 25,
        search: logSearch,
        action: logActionFilter,
        status: logStatusFilter,
        isLive: logLiveOnly ? 'true' : 'all',
      });
      setLogs(res.logs || []);
      setLogPagination(res.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load auth logs');
    } finally {
      setLogsLoading(false);
    }
  }, [logPage, logSearch, logActionFilter, logStatusFilter, logLiveOnly]);

  /* ─── Fetch Admin Jobs ─────────────────────────────────────────── */
  const fetchAdminJobs = useCallback(async () => {
    setAdminJobsLoading(true);
    try {
      const res = await adminService.getJobs({
        page: adminJobPage,
        limit: 20,
        search: jobSearch,
        status: jobStatusFilter,
        source: jobSourceFilter,
        sortBy: jobSortBy,
      });
      setAdminJobs(res.jobs || []);
      setAdminJobPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load jobs');
    } finally {
      setAdminJobsLoading(false);
    }
  }, [adminJobPage, jobSearch, jobStatusFilter, jobSourceFilter, jobSortBy]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchLogs]);

  useEffect(() => {
    if (activeTab === 'jobs') fetchAdminJobs();
  }, [activeTab, fetchAdminJobs]);

  // Auto-refresh interval (every 12 seconds for stats and live monitor)
  useEffect(() => {
    if (!autoRefresh) return;
    refreshTimerRef.current = setInterval(() => {
      fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'logs') fetchLogs();
      if (activeTab === 'jobs') fetchAdminJobs();
    }, 12000);
    return () => clearInterval(refreshTimerRef.current);
  }, [autoRefresh, activeTab, fetchStats, fetchUsers, fetchLogs, fetchAdminJobs]);

  /* ─── Actions ──────────────────────────────────────────────────── */
  const handleForceLogout = async (userId, userName) => {
    if (!window.confirm(`Force log out user "${userName}"? Their session will be immediately invalidated.`)) return;
    try {
      const res = await adminService.forceLogout(userId);
      toast.success(res.message || 'User force logged out');
      fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'logs') fetchLogs();
    } catch (err) {
      toast.error(err.message || 'Failed to force log out');
    }
  };

  const handleDeleteUser = async (userId, userName, userEmail) => {
    if (!window.confirm(`Are you SURE you want to delete user "${userName}" (${userEmail})?\n\nThis will permanently remove their account, resumes, and job matches.`)) return;
    try {
      const res = await adminService.deleteUser(userId);
      toast.success(res.message || 'User deleted successfully');
      fetchStats();
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600/30 border border-rose-500/40 text-rose-400 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">Admin Operations Center</h1>
              <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-xs font-bold text-rose-300">
                Super Admin
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Live session tracking, user credential management, password changes &amp; audit logging
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
            title="Auto-refresh live metrics every 12 seconds"
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => {
              fetchStats();
              if (activeTab === 'users') fetchUsers();
              if (activeTab === 'logs') fetchLogs();
              if (activeTab === 'jobs') fetchAdminJobs();
              toast.success('Admin data refreshed');
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-300" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered Users</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.users?.total ?? '—'}</span>
            <span className="text-xs font-bold text-emerald-600">
              {stats?.users?.active ?? 0} active
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {stats?.users?.admins ?? 0} Admin · {stats?.users?.suspended ?? 0} Suspended
          </p>
        </div>

        {/* Card 2: Live Online Users */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Live Online Users</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{stats?.users?.live ?? 0}</span>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Online Now</span>
          </div>
          <p className="mt-1 text-xs text-emerald-700/80">
            {liveSessions.length} active sessions logged
          </p>
        </div>

        {/* Card 3: 24h Login Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Logins (Last 24h)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.activity?.logins24h ?? '—'}</span>
            <span className="text-xs text-slate-500">successful</span>
          </div>
          <p className="mt-1 text-xs text-rose-500 font-semibold">
            {stats?.activity?.failedLogins24h ?? 0} failed login attempts
          </p>
        </div>

        {/* Card 4: Platform Assets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total System Assets</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.entities?.resumes ?? '—'}</span>
            <span className="text-xs text-slate-500">resumes stored</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {stats?.entities?.jobs ?? 0} jobs · {stats?.entities?.applications ?? 0} applications
          </p>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl shadow-sm p-1.5 gap-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'monitor'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Live User Monitor</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
            activeTab === 'monitor' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {stats?.users?.live ?? 0} Online
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Management</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
            activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {stats?.users?.total ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Login / Logout Audit Logs</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
            activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {stats?.activity?.totalLogs ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'jobs'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Job Listings</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
            activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'
          }`}>
            {stats?.entities?.jobs ?? 0}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: Live User Monitor ─────────────────────────────────── */}
      {activeTab === 'monitor' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Active Live Sessions</h2>
              <p className="text-xs text-slate-500">
                Real-time active users currently connected to the Job Dashboard
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Monitoring active WebSocket / heartbeat sessions
            </span>
          </div>

          {liveSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <WifiOff className="h-7 w-7" />
              </div>
              <p className="font-bold text-slate-700">No active external user sessions right now</p>
              <p className="text-xs text-slate-400 mt-1">
                As soon as users log in or interact with the platform, their live status, IP, device, and duration will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveSessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE ONLINE
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Active for {s.minutesActive}m
                      </span>
                    </div>

                    {/* User profile */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm">
                        {s.name ? s.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 truncate text-sm">{s.name || 'Unknown User'}</p>
                          {s.role === 'admin' && (
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" title="Administrator" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{s.email}</p>
                      </div>
                    </div>

                    {/* Technical session details */}
                    <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">IP Address:</span>
                        <span className="font-mono font-semibold text-slate-800">{s.ipAddress || '127.0.0.1'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Device:</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          {s.device === 'Mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                          {s.device} · {s.os}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Browser:</span>
                        <span className="font-semibold text-slate-700">{s.browser}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Logged in:</span>
                        <span className="text-slate-600">{formatTimeAgo(s.loginAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Heartbeat: {formatTimeAgo(s.lastActiveAt)}
                    </span>
                    <button
                      onClick={() => handleForceLogout(s.user?._id || s.user?.id, s.name)}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                      title="Terminate this session immediately"
                    >
                      <LogOut className="h-3 w-3" />
                      Force Logout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: User Management ───────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                placeholder="Search users by name, email, or job title…"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="user">Regular Users</option>
              </select>

              {/* Status filter */}
              <select
                value={userStatusFilter}
                onChange={e => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>

              {/* Online filter */}
              <select
                value={userOnlineFilter}
                onChange={e => { setUserOnlineFilter(e.target.value); setUserPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Presence</option>
                <option value="online">Online Now</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Password (Decrypted)</th>
                    <th className="px-4 py-3.5">Live Presence</th>
                    <th className="px-4 py-3.5">Resumes</th>
                    <th className="px-4 py-3.5">Last Login</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                          <p className="font-semibold text-sm">Loading user directory…</p>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                        {/* User identity */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 truncate">{u.name}</p>
                                {u._id === currentUser?._id && (
                                  <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">YOU</span>
                                )}
                              </div>
                              <p className="text-slate-500 text-[11px] truncate">{u.email}</p>
                              {u.title && <p className="text-slate-400 text-[10px] truncate">{u.title}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              <Crown className="h-3 w-3" /> ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              User
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {u.status === 'suspended' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                              <UserX className="h-3 w-3" /> Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <UserCheck className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>

                        {/* Decrypted Password */}
                        <td className="px-4 py-3.5">
                          {u.decryptedPassword ? (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs shadow-2xs">
                              <span className="font-semibold text-slate-800">
                                {revealedRowPasswords[u._id] ? u.decryptedPassword : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRowPassword(u._id)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                                title={revealedRowPasswords[u._id] ? "Mask password" : "Show decrypted password"}
                              >
                                {revealedRowPasswords[u._id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyTableRowPassword(u.decryptedPassword)}
                                className="text-slate-400 hover:text-emerald-600 p-0.5 rounded transition-colors"
                                title="Copy decrypted password"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setInfoModalUser(u)}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                              title="Legacy account — click to view or set password"
                            >
                              <Lock className="h-2.5 w-2.5" /> Set Password
                            </button>
                          )}
                        </td>

                        {/* Live Presence */}
                        <td className="px-4 py-3.5">
                          {u.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                              Online
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Offline</span>
                          )}
                        </td>

                        {/* Resumes count */}
                        <td className="px-4 py-3.5">
                          <span className="rounded-lg bg-blue-50 px-2 py-1 font-bold text-blue-700 text-xs">
                            {u.resumesCount || 0}
                          </span>
                        </td>

                        {/* Last Login */}
                        <td className="px-4 py-3.5 text-slate-500">
                          {u.lastLoginAt ? (
                            <div>
                              <p className="font-semibold text-slate-700">{formatTimeAgo(u.lastLoginAt)}</p>
                              <p className="text-[10px] text-slate-400">{formatDate(u.lastLoginAt)}</p>
                            </div>
                          ) : (
                            'Never'
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* User Info & Dashboard Details Button */}
                            <button
                              onClick={() => setInfoModalUser(u)}
                              className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
                              title="View complete user profile, password hash, and dashboard data"
                            >
                              <Info className="h-3.5 w-3.5 text-purple-600" />
                              <span>Info</span>
                            </button>

                            {/* Change Password Button */}
                            <button
                              onClick={() => setPasswordModalUser(u)}
                              className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm"
                              title="Change user password"
                            >
                              <Key className="h-3.5 w-3.5" />
                              <span>Password</span>
                            </button>

                            {/* Edit Profile Button */}
                            <button
                              onClick={() => setEditModalUser(u)}
                              className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
                              title="Edit user details and role"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Force logout if online */}
                            {u.isOnline && (
                              <button
                                onClick={() => handleForceLogout(u._id, u.name)}
                                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                                title="Force log out this user"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Delete Button (disabled for self) */}
                            {u._id !== currentUser?._id && (
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name, u.email)}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userPagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50 text-xs">
                <p className="text-slate-500">
                  Showing page <span className="font-bold text-slate-800">{userPage}</span> of {userPagination.totalPages} ({userPagination.total} total users)
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={userPage <= 1}
                    onClick={() => setUserPage(p => p - 1)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={userPage >= userPagination.totalPages}
                    onClick={() => setUserPage(p => p + 1)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Login / Logout Audit Logs ─────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={e => { setLogSearch(e.target.value); setLogPage(1); }}
                placeholder="Search logs by email, user name, IP address, or browser…"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Action filter */}
              <select
                value={logActionFilter}
                onChange={e => { setLogActionFilter(e.target.value); setLogPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Events</option>
                <option value="login">Login Events</option>
                <option value="logout">Logout Events</option>
                <option value="failed_login">Failed Logins</option>
                <option value="password_change">Password Changes</option>
                <option value="force_logout">Force Logouts</option>
              </select>

              {/* Status filter */}
              <select
                value={logStatusFilter}
                onChange={e => { setLogStatusFilter(e.target.value); setLogPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>

              {/* Live only checkbox */}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={logLiveOnly}
                  onChange={e => { setLogLiveOnly(e.target.checked); setLogPage(1); }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Live Sessions Only
              </label>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Event Action</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">IP Address</th>
                    <th className="px-4 py-3.5">Device &amp; OS</th>
                    <th className="px-4 py-3.5">Browser</th>
                    <th className="px-4 py-3.5">Session Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 text-slate-900 animate-spin" />
                          <p className="font-semibold text-sm">Loading audit logs…</p>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No login or logout logs found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isLiveNow = log.isLive;
                      return (
                        <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Timestamp */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <p className="font-semibold text-slate-800">{formatTimeAgo(log.createdAt)}</p>
                            <p className="text-[10px] text-slate-400">{formatFullDateTime(log.createdAt)}</p>
                          </td>

                          {/* User */}
                          <td className="px-4 py-3.5">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate text-xs">{log.name || 'Anonymous'}</p>
                              <p className="text-slate-500 text-[11px] truncate">{log.email}</p>
                            </div>
                          </td>

                          {/* Event action */}
                          <td className="px-4 py-3.5">
                            {log.action === 'login' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                LOGIN
                              </span>
                            )}
                            {log.action === 'logout' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                                LOGOUT
                              </span>
                            )}
                            {log.action === 'failed_login' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                FAILED LOGIN
                              </span>
                            )}
                            {log.action === 'password_change' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                PASSWORD CHANGE
                              </span>
                            )}
                            {log.action === 'force_logout' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">
                                FORCE LOGOUT
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {log.status === 'success' ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Success
                              </span>
                            ) : (
                              <div>
                                <span className="flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                                  <XCircle className="h-3.5 w-3.5" /> Failed
                                </span>
                                {log.failureReason && (
                                  <p className="text-[10px] text-rose-500 mt-0.5 max-w-xs">{log.failureReason}</p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* IP */}
                          <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px]">
                            {log.ipAddress || '127.0.0.1'}
                          </td>

                          {/* Device & OS */}
                          <td className="px-4 py-3.5 text-slate-600">
                            <span className="font-semibold text-slate-700">{log.device || 'Desktop'}</span>
                            <span className="text-slate-400 text-[10px] block">{log.os}</span>
                          </td>

                          {/* Browser */}
                          <td className="px-4 py-3.5 text-slate-600 font-medium">
                            {log.browser || '—'}
                          </td>

                          {/* Duration / Live */}
                          <td className="px-4 py-3.5">
                            {isLiveNow ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                LIVE NOW
                              </span>
                            ) : log.sessionDurationMinutes > 0 ? (
                              <span className="text-slate-600 font-medium">{log.sessionDurationMinutes} mins</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logPagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50 text-xs">
                <p className="text-slate-500">
                  Showing page <span className="font-bold text-slate-800">{logPage}</span> of {logPagination.totalPages} ({logPagination.total} total log records)
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={logPage <= 1}
                    onClick={() => setLogPage(p => p - 1)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={logPage >= logPagination.totalPages}
                    onClick={() => setLogPage(p => p + 1)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Job Listings ──────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Header + Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">All Job Listings</h2>
              <p className="text-xs text-slate-500">
                {adminJobPagination.total} jobs in the system — manage, search and delete entries
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search company, title, location…"
                value={jobSearch}
                onChange={(e) => { setJobSearch(e.target.value); setAdminJobPage(1); }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            {/* Source filter */}
            <select
              value={jobSourceFilter}
              onChange={(e) => { setJobSourceFilter(e.target.value); setAdminJobPage(1); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="all">All Sources (603 jobs)</option>
              <option value="Company Career Page">🏢 India IT Majors (51 jobs)</option>
              <option value="Arbeitnow API">Arbeitnow API (527 jobs)</option>
              <option value="RemoteOK API">RemoteOK API (25 jobs)</option>
            </select>
            {/* Sort filter */}
            <select
              value={jobSortBy}
              onChange={(e) => { setJobSortBy(e.target.value); setAdminJobPage(1); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="latest">✨ Latest Added (India jobs first)</option>
              <option value="ats">🎯 Highest ATS Match Score</option>
              <option value="posted">📅 Most Recently Posted</option>
              <option value="company">🔤 Company Name (A-Z)</option>
            </select>
            {/* Status filter */}
            <select
              value={jobStatusFilter}
              onChange={(e) => { setJobStatusFilter(e.target.value); setAdminJobPage(1); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Table */}
          {adminJobsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm font-semibold">Loading jobs…</span>
            </div>
          ) : adminJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-400 mb-3">
                <Briefcase className="h-7 w-7" />
              </div>
              <p className="font-bold text-slate-700">No jobs found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting the search or filters</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">#</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Company</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Role / Title</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Location</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Salary (INR)</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">ATS Score</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Top Skills</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Apply</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminJobs.map((job, idx) => {
                      const score = job.matchScore || 0;
                      const scoreColor = score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : score > 0 ? 'text-rose-500' : 'text-slate-400';
                      const scoreBg = score >= 75 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : score > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200';
                      const scoreBarColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : score > 0 ? 'bg-rose-400' : 'bg-slate-300';
                      const topSkills = (job.matchedSkills && job.matchedSkills.length > 0 ? job.matchedSkills : job.skills || []).slice(0, 3);
                      const applyUrl = job.careerPageUrl || job.jobUrl || job.companyWebsite;
                      return (
                      <tr key={job._id} className="hover:bg-violet-50/40 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          {(adminJobPagination.page - 1) * adminJobPagination.limit + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-black text-xs">
                              {job.companyName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 truncate max-w-[140px]">{job.companyName}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{job.source}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 truncate max-w-[200px]">{job.jobTitle}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{job.experienceRequired}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate max-w-[130px]">{job.location}</span>
                          </div>
                          {job.remote && (
                            <span className="mt-0.5 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              Remote
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {job.salary?.min ? (
                            <span className="font-semibold text-slate-700">
                              ₹{(job.salary.min / 100000).toFixed(1)}L – ₹{(job.salary.max / 100000).toFixed(1)}L
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* ATS / Match Score */}
                        <td className="px-4 py-3">
                          <div className={`inline-flex flex-col items-center rounded-xl border px-3 py-1.5 min-w-[60px] ${scoreBg}`}>
                            <span className={`text-base font-black leading-none ${scoreColor}`}>
                              {score > 0 ? `${score}%` : '—'}
                            </span>
                            {score > 0 && (
                              <>
                                <div className="mt-1 h-1 w-10 rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${scoreBarColor}`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                                <span className={`mt-0.5 text-[9px] font-bold uppercase tracking-wider ${scoreColor}`}>
                                  {score >= 75 ? 'Strong' : score >= 50 ? 'Good' : 'Low'}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Top Skills */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {topSkills.length > 0 ? topSkills.map((skill, si) => (
                              <span
                                key={si}
                                className="inline-flex rounded-full bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                              >
                                {skill}
                              </span>
                            )) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                            {(job.skills || []).length > 3 && (
                              <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                +{(job.skills || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            job.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : job.status === 'saved' ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : job.status === 'applied' ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : job.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {job.status}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {job.postedDate ? new Date(job.postedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </p>
                        </td>

                        {/* Apply Link */}
                        <td className="px-4 py-3">
                          {applyUrl ? (
                            <a
                              href={applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:from-violet-700 hover:to-indigo-700 transition-all whitespace-nowrap"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Apply Now
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No link</span>
                          )}
                        </td>

                        {/* Delete */}
                        <td className="px-4 py-3">
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete "${job.jobTitle}" at ${job.companyName}?`)) return;
                              try {
                                const res = await adminService.deleteJob(job._id);
                                toast.success(res.message || 'Job deleted');
                                fetchAdminJobs();
                                fetchStats();
                              } catch (err) {
                                toast.error(err.message || 'Failed to delete job');
                              }
                            }}
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete job"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {adminJobPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <span className="text-xs text-slate-500">
                    Page {adminJobPagination.page} of {adminJobPagination.totalPages} · {adminJobPagination.total} total jobs
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAdminJobPage(p => Math.max(1, p - 1))}
                      disabled={adminJobPagination.page === 1}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Prev
                    </button>
                    <button
                      onClick={() => setAdminJobPage(p => Math.min(adminJobPagination.totalPages, p + 1))}
                      disabled={adminJobPagination.page === adminJobPagination.totalPages}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ──────────────────────────────────────────────────── */}
      {infoModalUser && (
        <UserInfoModal
          user={infoModalUser}
          onClose={() => setInfoModalUser(null)}
          onOpenChangePassword={(u) => {
            setInfoModalUser(null);
            setPasswordModalUser(u);
          }}
          onOpenEditUser={(u) => {
            setInfoModalUser(null);
            setEditModalUser(u);
          }}
          onUserUpdated={() => {
            fetchStats();
            fetchUsers();
          }}
        />
      )}

      {passwordModalUser && (
        <ChangePasswordModal
          user={passwordModalUser}
          onClose={() => setPasswordModalUser(null)}
          onPasswordChanged={() => {
            fetchStats();
            fetchUsers();
          }}
        />
      )}

      {editModalUser && (
        <EditUserModal
          user={editModalUser}
          onClose={() => setEditModalUser(null)}
          onUserUpdated={() => {
            fetchStats();
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
