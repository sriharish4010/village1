import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Eye, EyeOff, Loader2, LogIn, Sparkles, Store, Shield, User } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess?: (user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const { isLoginOpen, setLoginOpen, setRegisterOpen, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoginOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!identifier || !password) {
      setError('Please enter your email or phone number and password');
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
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-brand-50 to-emerald-50 border-b border-brand-100/60 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold">V1</span>
              Welcome back to Village1
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">Sign in to manage your orders, shops, or appointments</p>
          </div>
          <button
            onClick={() => setLoginOpen(false)}
            className="p-1.5 rounded-full text-slate-600 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number or Email
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210 or yourname@gmail.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-600 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick-fill Demo Accounts Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" /> One-Click Demo Logins:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('customer@village1.in', 'Customer@123')}
                className="p-2 text-center bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group"
              >
                <User className="w-4 h-4 mx-auto text-emerald-600 group-hover:scale-110 transition-transform mb-1" />
                <span className="block text-[11px] font-bold text-slate-800">Customer</span>
                <span className="block text-[9px] text-slate-600">Alanganallur</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('shopkeeper@village1.in', 'Shopkeeper@123')}
                className="p-2 text-center bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all cursor-pointer group"
              >
                <Store className="w-4 h-4 mx-auto text-amber-600 group-hover:scale-110 transition-transform mb-1" />
                <span className="block text-[11px] font-bold text-slate-800">Shopkeeper</span>
                <span className="block text-[9px] text-slate-600">2 Shops</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin@village1.in', 'AdminSecure@123')}
                className="p-2 text-center bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl transition-all cursor-pointer group"
              >
                <Shield className="w-4 h-4 mx-auto text-purple-600 group-hover:scale-110 transition-transform mb-1" />
                <span className="block text-[11px] font-bold text-slate-800">Platform Admin</span>
                <span className="block text-[9px] text-slate-600">Verifier</span>
              </button>
            </div>
          </div>

          {/* Switch to Register */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              New to Village1?{' '}
              <button
                onClick={() => {
                  setLoginOpen(false);
                  setRegisterOpen(true);
                }}
                className="font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
