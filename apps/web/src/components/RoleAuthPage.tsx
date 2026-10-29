import React, { useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserCheck,
  Store,
  User as UserIcon,
  Shield,
  ShoppingBag,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register';

interface RoleAuthPageProps {
  role: 'CUSTOMER' | 'SHOPKEEPER';
  onBack: () => void;
  onLoginSuccess?: (user: any) => void;
  onOpenAdminLogin?: () => void;
}

export const RoleAuthPage: React.FC<RoleAuthPageProps> = ({ role, onBack, onLoginSuccess, onOpenAdminLogin }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  // Shared state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register-only fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState('Alanganallur');
  const [district, setDistrict] = useState('Madurai');
  const [pinCode, setPinCode] = useState('625501');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ta'>('en');

  const isCustomer = role === 'CUSTOMER';
  const accentColor = isCustomer ? 'brand' : 'amber';

  const fillDemo = () => {
    if (mode === 'login') {
      const email = isCustomer ? 'customer@village1.in' : 'shopkeeper@village1.in';
      const pass = isCustomer ? 'Customer@123' : 'Shopkeeper@123';
      setIdentifier(email);
      setPassword(pass);
      setError(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!identifier || !password) {
      setError('Please enter your mobile number or email and password.');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!fullName || !phone || !password || !village || !district || !pinCode) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and symbol.');
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
      if (onLoginSuccess) {
        onLoginSuccess(registeredUser);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      {/* Left panel – info / branding */}
      <div
        className={`hidden lg:flex flex-col justify-between w-[44%] p-12 border-r ${
          isCustomer ? 'border-brand-500/20 bg-brand-500/5' : 'border-amber-500/20 bg-amber-500/5'
        }`}
      >
        {/* Top: Brand */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-lg font-extrabold text-white font-serif">V1</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Village<span className="text-brand-400">1</span>
            </span>
          </div>

          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${
              isCustomer ? 'bg-brand-500/20' : 'bg-amber-500/20'
            }`}
          >
            {isCustomer ? (
              <ShoppingBag className={`w-8 h-8 text-brand-400`} />
            ) : (
              <Store className={`w-8 h-8 text-amber-400`} />
            )}
          </div>

          <h2 className="text-3xl font-black mb-3 leading-tight">
            {isCustomer ? 'Shop Local, Live Better.' : 'Grow Your Village Business.'}
          </h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            {isCustomer
              ? 'Order fresh groceries, book salon appointments with a live queue token, and support your village economy.'
              : 'Register your shop, manage multiple branches, track orders and appointments, and reach customers in your village.'}
          </p>

          {/* Features */}
          <ul className="space-y-3">
            {(isCustomer
              ? [
                  'Order provisions from verified local shops',
                  'Book salon appointments with queue number',
                  'Track order & collection status live',
                  'Write reviews for your favorite shops',
                ]
              : [
                  'Manage one or multiple shop branches',
                  'Accept and fulfill customer orders',
                  'Appointment booking with queue tokens',
                  'Pending admin verification before going live',
                ]
            ).map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${isCustomer ? 'text-brand-400' : 'text-amber-400'}`}
                />
                {feat}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Trust badge */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Shield className="w-3.5 h-3.5" />
          <span>Merchant verification by Village1 Admin</span>
          <span className="mx-1">·</span>
          <MapPin className="w-3.5 h-3.5" />
          <span>Tamil Nadu villages</span>
        </div>
      </div>

      {/* Right panel – auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Top Nav inside form */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to role selection
            </button>
            {onOpenAdminLogin && (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-950/40 hover:bg-purple-900/40 px-2.5 py-1 rounded-full border border-purple-500/30 transition-all cursor-pointer"
              >
                <Shield className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          {/* Role badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5 ${
              isCustomer
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isCustomer ? (
              <UserIcon className="w-3 h-3" />
            ) : (
              <Store className="w-3 h-3" />
            )}
            {isCustomer ? 'Customer Account' : 'Shopkeeper Account'}
          </div>

          <h1 className="text-2xl font-black mb-1.5">
            {mode === 'login'
              ? `Welcome back${isCustomer ? '' : ', Merchant'}`
              : `Join Village1 as ${isCustomer ? 'Customer' : 'Shopkeeper'}`}
          </h1>
          <p className="text-slate-400 text-sm mb-7">
            {mode === 'login'
              ? 'Sign in to your Village1 account'
              : 'Create your account to get started'}
          </p>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-7">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 font-medium">
              {error}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number or Email
                </label>
                <input
                  type="text"
                  placeholder="9876543210 or name@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-brand-500/20 pr-10"
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
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${
                  isCustomer
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In
                  </>
                )}
              </button>

              {/* Demo fill */}
              <button
                type="button"
                onClick={fillDemo}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill Demo {isCustomer ? 'Customer' : 'Shopkeeper'} Account
              </button>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Selvam Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              {/* Phone + Email row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile * (+91)</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email (optional)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password * <span className="text-slate-500 font-normal">(min 8 chars, uppercase, number, symbol)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="e.g. Village@2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all pr-10"
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

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location *</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Village"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-xs px-3 py-2 rounded-xl outline-none transition-all"
                    required
                  />
                  <input
                    type="text"
                    placeholder="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-xs px-3 py-2 rounded-xl outline-none transition-all"
                    required
                  />
                  <input
                    type="text"
                    placeholder="PIN Code"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    className="bg-white/5 border border-white/10 focus:border-brand-500 text-white placeholder-slate-500 text-xs px-3 py-2 rounded-xl outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Language</label>
                <div className="flex gap-4 text-xs text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="lang"
                      checked={preferredLanguage === 'en'}
                      onChange={() => setPreferredLanguage('en')}
                      className="accent-brand-500"
                    />
                    English
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="lang"
                      checked={preferredLanguage === 'ta'}
                      onChange={() => setPreferredLanguage('ta')}
                      className="accent-brand-500"
                    />
                    தமிழ் (Tamil)
                  </label>
                </div>
              </div>

              {/* Shopkeeper notice */}
              {!isCustomer && (
                <div className="px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    After registration, your shop will be reviewed by our admin team before it appears publicly.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${
                  isCustomer
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" /> Create Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch mode hint */}
          <p className="text-center text-xs text-slate-500 mt-6">
            {mode === 'login' ? (
              <>
                New to Village1?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`font-bold underline cursor-pointer ${isCustomer ? 'text-brand-400 hover:text-brand-300' : 'text-amber-400 hover:text-amber-300'}`}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`font-bold underline cursor-pointer ${isCustomer ? 'text-brand-400 hover:text-brand-300' : 'text-amber-400 hover:text-amber-300'}`}
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {/* Admin link in footer */}
          {onOpenAdminLogin && (
            <p className="text-center text-xs text-slate-600 mt-4 pt-4 border-t border-white/5">
              Platform verifier or administrator?{' '}
              <button
                onClick={onOpenAdminLogin}
                className="text-purple-400 hover:text-purple-300 font-semibold underline cursor-pointer"
              >
                Sign in to Admin Dashboard
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
