import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Store, Shield, MapPin, Phone, Mail, LogOut, CheckCircle, Clock } from 'lucide-react';

interface UserProfileCardProps {
  onOpenOrders?: () => void;
  onOpenShopkeeper?: () => void;
  onOpenAdmin?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ onOpenOrders, onOpenShopkeeper, onOpenAdmin }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div id="dashboard-section" className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 max-w-5xl mx-auto my-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-brand-500/20">
            {(user.customerProfile?.fullName?.[0] || user.email?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {user.customerProfile?.fullName || 'Village1 Member'}
              </h2>
              {user.role === 'ADMIN' && (
                <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Platform Administrator
                </span>
              )}
              {user.role === 'SHOPKEEPER' && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Store className="w-3 h-3" /> Shopkeeper
                </span>
              )}
              {user.role === 'CUSTOMER' && (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <User className="w-3 h-3" /> Customer
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Member ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{user.id.slice(0, 8)}</code></span>
              <span>•</span>
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      {/* Profile Info Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        
        {/* Contact Info */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contact Details</p>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{user.phone || 'No phone registered'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="truncate">{user.email || 'No email registered'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{user.customerProfile?.village || 'Alanganallur'}, {user.customerProfile?.district || 'Madurai'}</span>
            </div>
          </div>
        </div>

        {/* Location / Village Details */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Village Profile</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Village:</span>
              <span className="font-semibold text-slate-800">{user.customerProfile?.village || 'Alanganallur'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">District:</span>
              <span className="font-semibold text-slate-800">{user.customerProfile?.district || 'Madurai'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PIN Code:</span>
              <span className="font-semibold text-slate-800">{user.customerProfile?.pinCode || '625501'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Language:</span>
              <span className="font-semibold text-slate-800">{user.customerProfile?.preferredLanguage === 'ta' ? 'தமிழ் (Tamil)' : 'English'}</span>
            </div>
          </div>
        </div>

        {/* Role Specific Insight */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            {user.role === 'SHOPKEEPER' ? 'Shopkeeper Authority' : user.role === 'ADMIN' ? 'Platform Governance' : 'Customer Privileges'}
          </p>
          <div className="space-y-2 text-xs">
            {user.role === 'SHOPKEEPER' ? (
              <>
                <p className="text-slate-600 leading-relaxed">
                  You are authorized to manage multiple village branches, update stock, accept orders, and generate queue tokens.
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between font-medium">
                  <span className="text-slate-600">Managed Shops:</span>
                  <span className="font-bold text-amber-700">{user.shops?.length || 1} Registered</span>
                </div>
                {onOpenShopkeeper && (
                  <button
                    onClick={onOpenShopkeeper}
                    className="w-full mt-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Manage Village Shop Orders →
                  </button>
                )}
              </>
            ) : user.role === 'ADMIN' ? (
              <>
                <p className="text-slate-600 leading-relaxed">
                  Full administrative permissions to verify shop submissions, audit logs, and manage categories.
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between font-medium">
                  <span className="text-slate-600">Admin Level:</span>
                  <span className="font-bold text-purple-700">Root Verifier</span>
                </div>
                {onOpenAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="w-full mt-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Open Platform Admin Dashboard →
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-slate-600 leading-relaxed">
                  You can browse local village stores, place pickup orders, book salon appointments, and rate local shops.
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between font-medium">
                  <span className="text-slate-600">Saved Addresses:</span>
                  <span className="font-bold text-emerald-700">{user.addresses?.length || 1} Address</span>
                </div>
                {onOpenOrders && (
                  <button
                    onClick={onOpenOrders}
                    className="w-full mt-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    View My Pickup Orders →
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* If Shopkeeper: My Authorized Shops Preview */}
      {user.role === 'SHOPKEEPER' && user.shops && user.shops.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              My Authorized Shops & Branches (Multi-Shop Support)
            </h4>
            {onOpenShopkeeper && (
              <button
                onClick={onOpenShopkeeper}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Open Merchant Order Dashboard →
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.shops.map((membership) => (
              <div key={membership.membershipId} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{membership.shop.name}</h5>
                  <p className="text-[11px] text-slate-500">
                    Role: <span className="font-semibold text-slate-700">{membership.role}</span> • Permissions: {membership.permissions.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> {membership.shop.verificationStatus}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
