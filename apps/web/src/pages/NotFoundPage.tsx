import React from 'react';
import { useNavigate } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { Compass, Home, Store, Shield, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30">
          <Compass className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-400">
            Error 404 • Page Not Found
          </span>
          <h1 className="text-2xl font-black text-white mt-1 font-serif">Lost in the Village?</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The page or route you are looking for doesn't exist or has moved. Explore village shops or head back to your dashboard.
          </p>
        </div>

        <div className="space-y-2 pt-2 text-xs font-bold">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-brand-600/30"
          >
            <Home className="w-4 h-4" /> Go to Village1 Storefront
          </button>

          {user?.role === 'SHOPKEEPER' && (
            <button
              onClick={() => navigate('/shopkeeper/dashboard')}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Store className="w-4 h-4" /> Go to Merchant Dashboard
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin/governance')}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" /> Go to Admin Governance Center
            </button>
          )}

          <button
            onClick={() => window.history.back()}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Previous Page
          </button>
        </div>
      </div>
    </div>
  );
};
