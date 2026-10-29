import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '../router/Router';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('CUSTOMER' | 'SHOPKEEPER' | 'ADMIN' | string)[];
  redirectUnauthenticatedTo?: string;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectUnauthenticatedTo,
  requireAuth = true,
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // 1. Loading state while checking token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/40 animate-pulse">
            <span className="text-2xl font-extrabold text-white font-serif">V1</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">Verifying authorization…</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated check
  if (!user) {
    if (!requireAuth) {
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <LogIn className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-serif">Authentication Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You must be logged in to access this page. Please sign in with your Village1 credentials.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate(redirectUnauthenticatedTo || '/auth')}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Sign In to Continue
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. If public route, authenticated users of any role are always allowed
  if (!requireAuth) {
    return <>{children}</>;
  }

  // 4. Role authorization check (normalized to uppercase to prevent case mismatches)
  const userRole = user.role?.toUpperCase();
  const normalizedAllowedRoles = allowedRoles?.map((r) => r.toUpperCase());

  if (normalizedAllowedRoles && normalizedAllowedRoles.length > 0 && (!userRole || !normalizedAllowedRoles.includes(userRole))) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-serif">Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account role (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-bold">{user.role}</code>) does not have authorization to view this section.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {userRole === 'SHOPKEEPER' && (
              <button
                onClick={() => navigate('/shopkeeper/dashboard')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Go to Merchant Dashboard
              </button>
            )}
            {userRole === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin/governance')}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Go to Admin Governance Center
              </button>
            )}
            {userRole === 'CUSTOMER' && (
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Go to Customer Storefront
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
