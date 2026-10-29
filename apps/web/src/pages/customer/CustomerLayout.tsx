import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from '../../router/Router';
import { Navbar } from '../../components/Navbar';
import { VillageSelectorModal } from '../../components/VillageSelectorModal';
import { LoginModal } from '../../components/LoginModal';
import { RegisterModal } from '../../components/RegisterModal';
import { Store, ShoppingBag, Shield } from 'lucide-react';

export const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium">
              <strong>Village1:</strong> Shop local, track pickup orders & book salon queue tokens
            </span>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === 'SHOPKEEPER' && (
              <button
                onClick={() => navigate('/shopkeeper/dashboard')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Store className="w-3.5 h-3.5" /> Merchant Dashboard
              </button>
            )}

            {user && (
              <button
                onClick={() => navigate('/customer/orders')}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> My Orders
              </button>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin/governance')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" /> Admin Portal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navbar
        onOpenAdmin={() => navigate('/admin/governance')}
        onOpenOrders={() => navigate('/customer/orders')}
        onOpenShopkeeper={() => navigate('/shopkeeper/dashboard')}
        onOpenStorefront={() => navigate('/')}
      />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Shared Modals */}
      <VillageSelectorModal />
      <LoginModal
        onLoginSuccess={(loggedInUser) => {
          if (loggedInUser.role === 'ADMIN') {
            navigate('/admin/governance');
          } else if (loggedInUser.role === 'SHOPKEEPER') {
            navigate('/shopkeeper/dashboard');
          } else {
            navigate('/');
          }
        }}
      />
      <RegisterModal
        onRegisterSuccess={(registeredUser) => {
          if (registeredUser.role === 'SHOPKEEPER') {
            navigate('/shopkeeper/dashboard');
          } else {
            navigate('/');
          }
        }}
      />
    </div>
  );
};
