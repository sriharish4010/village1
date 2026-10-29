import React, { useState } from 'react';
import {
  ShoppingBag,
  Store,
  MapPin,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Star,
  Package,
  Scissors,
  UtensilsCrossed,
  Clock,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RoleSelectionScreenProps {
  onSelectRole: (role: 'CUSTOMER' | 'SHOPKEEPER') => void;
  onOpenAdminLogin: () => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onSelectRole,
  onOpenAdminLogin,
}) => {
  const [hoveredRole, setHoveredRole] = useState<'CUSTOMER' | 'SHOPKEEPER' | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-emerald-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Top nav bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-lg font-extrabold text-white font-serif">V1</span>
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Village<span className="text-brand-400">1</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase -mt-0.5">
              Local Village Commerce
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAdminLogin}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 transition-all cursor-pointer group shadow-xs"
          title="Super Admin Portal Login"
        >
          <Shield className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span>Admin Login</span>
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        {/* Hero text */}
        <div className="text-center mb-12 max-w-2xl">
          {/* Live pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <MapPin className="w-3 h-3" />
            Live in Tamil Nadu Villages
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-5">
            Your Village.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-300 to-emerald-400">
              Your Local Shops.
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Order groceries, book salon appointments with live queue tokens, and support your
            neighborhood businesses — all in one place.
          </p>
        </div>

        {/* Role selection cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          {/* Customer Card */}
          <button
            onClick={() => onSelectRole('CUSTOMER')}
            onMouseEnter={() => setHoveredRole('CUSTOMER')}
            onMouseLeave={() => setHoveredRole(null)}
            className={`relative group p-7 rounded-3xl border text-left transition-all duration-300 cursor-pointer overflow-hidden ${
              hoveredRole === 'CUSTOMER'
                ? 'border-brand-500/70 bg-brand-500/10 shadow-2xl shadow-brand-500/20 scale-[1.02]'
                : 'border-white/10 bg-white/5 hover:border-brand-500/40'
            }`}
          >
            {/* Subtle card glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent rounded-3xl transition-opacity duration-300 ${
                hoveredRole === 'CUSTOMER' ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <div className="relative z-10">
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
                  hoveredRole === 'CUSTOMER'
                    ? 'bg-brand-500 shadow-lg shadow-brand-500/40'
                    : 'bg-brand-500/20'
                }`}
              >
                <ShoppingBag
                  className={`w-7 h-7 transition-colors ${
                    hoveredRole === 'CUSTOMER' ? 'text-white' : 'text-brand-400'
                  }`}
                />
              </div>

              <h2 className="text-xl font-bold text-white mb-1.5">Continue as Customer</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Discover local shops, order provisions, and book salon appointments in your village.
              </p>

              {/* Feature list */}
              <ul className="space-y-2 mb-6">
                {[
                  { icon: Package, text: 'Order groceries & daily goods' },
                  { icon: Scissors, text: 'Book salon with queue token' },
                  { icon: UtensilsCrossed, text: 'Browse bakeries & sweet shops' },
                  { icon: MapPin, text: 'Shop by your village & PIN' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                  hoveredRole === 'CUSTOMER' ? 'text-brand-300' : 'text-brand-400'
                }`}
              >
                Get Started
                <ArrowRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    hoveredRole === 'CUSTOMER' ? 'translate-x-1' : ''
                  }`}
                />
              </div>
            </div>
          </button>

          {/* Shopkeeper Card */}
          <button
            onClick={() => onSelectRole('SHOPKEEPER')}
            onMouseEnter={() => setHoveredRole('SHOPKEEPER')}
            onMouseLeave={() => setHoveredRole(null)}
            className={`relative group p-7 rounded-3xl border text-left transition-all duration-300 cursor-pointer overflow-hidden ${
              hoveredRole === 'SHOPKEEPER'
                ? 'border-amber-500/70 bg-amber-500/10 shadow-2xl shadow-amber-500/20 scale-[1.02]'
                : 'border-white/10 bg-white/5 hover:border-amber-500/40'
            }`}
          >
            {/* Subtle card glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-3xl transition-opacity duration-300 ${
                hoveredRole === 'SHOPKEEPER' ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <div className="relative z-10">
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
                  hoveredRole === 'SHOPKEEPER'
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/40'
                    : 'bg-amber-500/20'
                }`}
              >
                <Store
                  className={`w-7 h-7 transition-colors ${
                    hoveredRole === 'SHOPKEEPER' ? 'text-white' : 'text-amber-400'
                  }`}
                />
              </div>

              <h2 className="text-xl font-bold text-white mb-1.5">Continue as Shopkeeper</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Register your shop, manage products, view orders, and track customer appointments.
              </p>

              {/* Feature list */}
              <ul className="space-y-2 mb-6">
                {[
                  { icon: Store, text: 'Manage multiple shops/branches' },
                  { icon: Clock, text: 'Live appointment queue system' },
                  { icon: Users, text: 'View and fulfill orders' },
                  { icon: Star, text: 'Build your village reputation' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>

              {/* Approval note */}
              <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <Sparkles className="w-3 h-3 shrink-0" />
                Shops verified by Village1 admin before going live
              </div>

              {/* CTA */}
              <div
                className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                  hoveredRole === 'SHOPKEEPER' ? 'text-amber-300' : 'text-amber-400'
                }`}
              >
                Register My Shop
                <ArrowRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    hoveredRole === 'SHOPKEEPER' ? 'translate-x-1' : ''
                  }`}
                />
              </div>
            </div>
          </button>
        </div>

        {/* Admin Portal Gateway Card */}
        <div className="mt-6 w-full max-w-2xl bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-purple-200">Village1 Platform Administration</h3>
              <p className="text-[11px] text-slate-400">Restricted portal for verifying shop registrations, audit logs, and village users.</p>
            </div>
          </div>
          <button
            onClick={onOpenAdminLogin}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5"
          >
            <span>Admin Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-600" />
            Admin-verified merchants
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            Live queue & order tracking
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-600" />
            Tamil Nadu villages
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-5 border-t border-white/5 text-xs text-slate-600">
        © 2026 Village1 · Connecting Local Commerce
      </footer>
    </div>
  );
};
