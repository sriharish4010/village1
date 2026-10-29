import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Eye, EyeOff, Loader2, UserCheck, Store, User, Sparkles } from 'lucide-react';

interface RegisterModalProps {
  onRegisterSuccess?: (user: any) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onRegisterSuccess }) => {
  const { isRegisterOpen, setRegisterOpen, setLoginOpen, register } = useAuth();

  const [role, setRole] = useState<'CUSTOMER' | 'SHOPKEEPER'>('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [village, setVillage] = useState('Alanganallur');
  const [district, setDistrict] = useState('Madurai');
  const [pinCode, setPinCode] = useState('625501');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ta'>('en');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isRegisterOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !phone || !password || !village || !district || !pinCode) {
      setError('Please fill in all required fields');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long with uppercase, lowercase, number, and special character');
      return;
    }

    try {
      setLoading(true);
      const registeredUser = await register({
        role,
        fullName,
        phone,
        email: email || undefined,
        password,
        village,
        district,
        pinCode,
        state: 'Tamil Nadu',
        preferredLanguage,
      });
      if (onRegisterSuccess) {
        onRegisterSuccess(registeredUser);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-brand-50 to-emerald-50 border-b border-brand-100/60 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              Join Village1
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">Connect with your local village shops or register your shop</p>
          </div>
          <button
            onClick={() => setRegisterOpen(false)}
            className="p-1.5 rounded-full text-slate-600 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'CUSTOMER'
                      ? 'border-brand-600 bg-brand-50/70 text-brand-900 ring-2 ring-brand-600/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${role === 'CUSTOMER' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Customer</p>
                    <p className="text-[10px] text-slate-600">Buy goods & book salon</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('SHOPKEEPER')}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'SHOPKEEPER'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-900 ring-2 ring-amber-600/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${role === 'SHOPKEEPER' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Shopkeeper</p>
                    <p className="text-[10px] text-slate-600">Manage multiple shops</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Selvam Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                required
              />
            </div>

            {/* Mobile & Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number * (10 Digits)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-600">+91</span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-sm pl-12 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password * (Min 8 chars, uppercase, lowercase, number, symbol)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="e.g. Village@2026"
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

            {/* Location row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Village *</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">District *</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Language</label>
              <div className="flex gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="lang"
                    checked={preferredLanguage === 'en'}
                    onChange={() => setPreferredLanguage('en')}
                    className="text-brand-600"
                  />
                  English
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="lang"
                    checked={preferredLanguage === 'ta'}
                    onChange={() => setPreferredLanguage('ta')}
                    className="text-brand-600"
                  />
                  தமிழ் (Tamil)
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 text-sm mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Complete Registration
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <button
                onClick={() => {
                  setRegisterOpen(false);
                  setLoginOpen(true);
                }}
                className="font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
