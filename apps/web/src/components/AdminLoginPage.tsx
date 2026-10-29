import React, { useState } from 'react';
import { Shield, ArrowLeft, Eye, EyeOff, Loader2, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginPageProps {
  onBack: () => void;
  onLoginSuccess?: (user: any) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBack, onLoginSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!identifier || !password) {
      setError('Please enter your admin credentials.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const loggedInUser = await login(identifier, password);
      if (onLoginSuccess) {
        onLoginSuccess(loggedInUser);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-lg font-extrabold text-white font-serif">V1</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Village<span className="text-brand-400">1</span>
          </span>
        </div>

        {/* Admin badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5 bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <Shield className="w-3 h-3" />
          Super Admin Portal
        </div>

        <h1 className="text-2xl font-black text-white mb-1.5">Admin Sign In</h1>
        <p className="text-slate-400 text-sm mb-7">
          Restricted access — Village1 administrators only.
        </p>

        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Email
            </label>
            <input
              type="text"
              placeholder="admin@village1.in"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-purple-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-purple-500/20 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In as Admin
              </>
            )}
          </button>

          {/* Demo fill */}
          <button
            type="button"
            onClick={() => {
              setIdentifier('admin@village1.in');
              setPassword('AdminSecure@123');
              setError(null);
            }}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Fill Demo Admin Credentials
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-8">
          Not an admin?{' '}
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white underline cursor-pointer"
          >
            Go back
          </button>
        </p>
      </div>
    </div>
  );
};
