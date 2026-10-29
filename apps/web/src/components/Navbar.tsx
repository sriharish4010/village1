import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Search,
  User as UserIcon,
  Store,
  Shield,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useNavigate } from '../router/Router';

interface NavbarProps {
  onOpenAdmin?: () => void;
  onOpenOrders?: () => void;
  onOpenShopkeeper?: () => void;
  onOpenStorefront?: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdmin,
  onOpenOrders,
  onOpenShopkeeper,
  onOpenStorefront,
  onOpenProfile,
}) => {
  const navigate = useNavigate();
  const { user, activeVillage, setLoginOpen, setRegisterOpen, setVillageModalOpen, logout } = useAuth();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>;
      case 'SHOPKEEPER':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Store className="w-3 h-3" /> Shopkeeper</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">Customer</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (user?.role === 'ADMIN' && onOpenAdmin) {
                  onOpenAdmin();
                } else if (user?.role === 'SHOPKEEPER' && onOpenShopkeeper) {
                  onOpenShopkeeper();
                } else if (onOpenStorefront) {
                  onOpenStorefront();
                } else {
                  navigate('/');
                }
              }}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl font-bold font-serif">V1</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  Village<span className="text-brand-600">1</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-600 -mt-1">
                  Local Village Commerce
                </span>
              </div>
            </button>

            {/* Village Selector Pill */}
            <button
              onClick={() => setVillageModalOpen(true)}
              className="hidden md:flex items-center gap-2 text-left bg-slate-100 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-full py-1.5 px-3.5 transition-all text-xs font-medium text-slate-700 group cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-600 group-hover:animate-bounce" />
              <span>
                <strong className="text-slate-900">{activeVillage.name}</strong>, {activeVillage.district}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-600" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search rice, bakery sweets, haircut, groceries..."
                className="w-full bg-slate-100 focus:bg-white text-sm text-slate-800 placeholder-slate-600 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* User Auth CTAs */}
          <div className="flex items-center gap-3">
            {/* Village pill for mobile */}
            <button
              onClick={() => setVillageModalOpen(true)}
              className="md:hidden flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-700"
              title="Change Village"
            >
              <MapPin className="w-4 h-4 text-brand-600" />
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors cursor-pointer"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                      {user.customerProfile?.fullName || user.email || user.phone}
                    </span>
                    <div className="flex justify-end">{getRoleBadge(user.role)}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {(user.customerProfile?.fullName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 mr-1" />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-600">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {user.customerProfile?.fullName || 'Village1 Member'}
                      </p>
                      <p className="text-xs text-slate-600 truncate">{user.email || user.phone}</p>
                    </div>

                    {user.role === 'SHOPKEEPER' && (
                      <div className="px-4 py-2 border-b border-slate-100 bg-amber-50/50">
                        <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-amber-600" /> Shopkeeper Portal
                          </span>
                          <span className="bg-amber-200/60 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">
                            {user.shops?.length || 1} Shop(s)
                          </span>
                        </div>
                        {onOpenShopkeeper && (
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onOpenShopkeeper();
                            }}
                            className="w-full py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center block"
                          >
                            Manage Shop Orders →
                          </button>
                        )}
                      </div>
                    )}

                    {user.role === 'ADMIN' && (
                      <div className="px-4 py-2 border-b border-slate-100 bg-purple-50/70">
                        <div className="flex items-center justify-between text-xs font-semibold text-purple-900 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-purple-600" /> Platform Admin
                          </span>
                        </div>
                        {onOpenAdmin && (
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onOpenAdmin();
                            }}
                            className="w-full py-1.5 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center block"
                          >
                            Open Admin Dashboard →
                          </button>
                        )}
                      </div>
                    )}

                    <div className="py-1">
                      {onOpenOrders && (
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onOpenOrders();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 flex items-center gap-2 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-brand-600" /> My Pickup Orders
                        </button>
                      )}

                      {onOpenStorefront && (user.role === 'SHOPKEEPER' || user.role === 'ADMIN') && (
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onOpenStorefront();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" /> Switch to Customer Store
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          if (onOpenProfile) {
                            onOpenProfile();
                          } else {
                            navigate('/customer/profile');
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-600" /> Account Profile
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="text-xs font-semibold text-slate-700 hover:text-brand-600 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setRegisterOpen(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs shadow-brand-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Register
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drop */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-3">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search shops, provisions, haircuts..."
                className="w-full bg-slate-100 text-sm text-slate-800 placeholder-slate-600 pl-10 pr-4 py-2 rounded-xl outline-none"
              />
              <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
            </div>

            <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-100">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-900">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>
                  Active Village: <strong>{activeVillage.name}</strong>, {activeVillage.district}
                </span>
              </div>
              <button
                onClick={() => {
                  setVillageModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-bold text-brand-700 underline"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
