import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, ShoppingBag, Scissors, Cake, Sparkles, BookOpen, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeroBannerProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ selectedCategory, onSelectCategory }) => {
  const { activeVillage, setVillageModalOpen } = useAuth();

  const categories = [
    { id: 'all', name: 'All Shops', icon: '🏪', slug: null },
    { id: 'grocery', name: 'Groceries', icon: '🛒', slug: 'grocery-stores' },
    { id: 'salon', name: 'Salons & Barbers', icon: '✂️', slug: 'salons-barber-shops' },
    { id: 'bakery', name: 'Bakeries & Sweets', icon: '🍞', slug: 'bakeries-sweets' },
    { id: 'fancy', name: 'Fancy Stores', icon: '✨', slug: 'fancy-stores' },
    { id: 'stationery', name: 'Stationery & Xerox', icon: '📚', slug: 'stationery-shops' },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-emerald-50/30 to-slate-50 border-b border-brand-100/60 pt-8 pb-10">
      
      {/* Decorative background orbs */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-200/20 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          <div className="max-w-2xl">
            {/* Active Village Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-900 text-xs font-semibold mb-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <MapPin className="w-3.5 h-3.5 text-brand-700" />
              <span>Village Pilot: <strong>{activeVillage.name}</strong>, {activeVillage.district} ({activeVillage.pinCode})</span>
              <button
                onClick={() => setVillageModalOpen(true)}
                className="text-brand-700 underline hover:text-brand-900 ml-1 cursor-pointer font-bold"
              >
                Change
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight font-serif">
              Connecting You With Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-500">
                Local Village Shops
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Order fresh provisions from trusted neighborhood grocery shops, book salon appointments with live queue tracking, and collect with zero waiting time.
            </p>

            {/* Quick trust badges */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> Pay at Shop / Cash
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" /> Verified Merchants
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-600" /> Live Salon Queue Tokens
              </span>
            </div>
          </div>

          {/* Stat / Card highlight */}
          <div className="w-full lg:w-auto bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-xl shadow-brand-900/5 min-w-[280px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilot Coverage</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Phase 1 Active</span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Active Village</span>
                <span className="font-bold text-slate-800">{activeVillage.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">State & Region</span>
                <span className="font-semibold text-slate-800">Tamil Nadu, India</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Merchant Types</span>
                <span className="font-semibold text-slate-800">5 Categories</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Supported Languages</span>
                <span className="font-semibold text-slate-800">English & தமிழ்</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="mt-8 pt-6 border-t border-brand-100/60">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Browse by Shop Category:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isActive = (cat.slug === null && selectedCategory === null) || selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 scale-102'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
