import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Store,
  Clock,
  ShoppingBag,
  Calendar,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getStats();
      setStats(res.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading genuine platform metrics from database...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="text-sm font-bold text-red-900">Failed to Retrieve Metrics</h3>
        <p className="text-xs text-red-700">{error || 'Server error'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Pending Approval Alert Banner */}
      {stats.shops.pending > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {stats.shops.pending} Shop Application(s) Pending Review
              </h4>
              <p className="text-xs text-amber-700">
                Shopkeepers have registered village shops waiting for administrator verification before going live.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('approvals')}
            className="self-start sm:self-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            Review Queue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Users</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-serif">{stats.users.total}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>{stats.users.customers} Customers</span>
            <span>•</span>
            <span>{stats.users.shopkeepers} Merchants</span>
            <span>•</span>
            <span>{stats.users.admins} Admins</span>
          </div>
        </div>

        {/* Total Shops */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Shops</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-serif">{stats.shops.total}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold">{stats.shops.approved} Approved</span>
            <span className="text-amber-700 font-semibold">{stats.shops.pending} Pending</span>
            <span className="text-red-700 font-semibold">{stats.shops.suspended} Suspended</span>
          </div>
        </div>

        {/* Orders & Bookings Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orders & Salon Slots</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-serif">
            {stats.orders.total} <span className="text-xs font-normal text-slate-500">orders</span> / {stats.appointments.total} <span className="text-xs font-normal text-slate-500">slots</span>
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
            <span>Database status: {stats.orders.status === 'ACTIVE' ? 'Active Volume' : 'Ready (No orders placed yet)'}</span>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {stats.revenue.amount !== null ? (
              <p className="text-2xl font-black text-slate-900 font-serif">₹{stats.revenue.amount}</p>
            ) : (
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded">
                Pilot Phase (₹0 Fee)
              </span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 leading-tight">
            {stats.revenue.description}
          </div>
        </div>

      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Verification Queue Summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" /> Merchant Verification Queue
            </h3>
            <button
              onClick={() => onNavigateTab('approvals')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
            >
              View Queue ({stats.shops.pending})
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Village1 enforces strict server-side verification. Only shops reviewed and approved by platform administrators can accept customer orders or appear in public village listings.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigateTab('approvals')}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Open Approval Queue
            </button>
            <button
              onClick={() => onNavigateTab('shops')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Browse All Shops
            </button>
          </div>
        </div>

        {/* Recent Platform Audit Activity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" /> Recent Security Audit Trail
            </h3>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              Full Log
            </button>
          </div>

          <div className="space-y-2.5">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 4).map((log: any) => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <p className="text-[10px] text-slate-500">
                      by {log.user?.email || log.user?.phone || 'System'} • {new Date(log.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {log.entity}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">No recent activity logs found.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
