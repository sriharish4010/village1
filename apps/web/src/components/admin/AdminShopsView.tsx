import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Filter,
  Loader2,
  X,
} from 'lucide-react';

export const AdminShopsView: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modals for reason
  const [suspendModalShop, setSuspendModalShop] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [rejectModalShop, setRejectModalShop] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getShops({
        status: statusFilter,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });
      setShops(res.shops);
      setPagination(res.pagination);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to fetch shops directory' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShops();
  };

  const handleApprove = async (shopId: string) => {
    try {
      setActionLoading(shopId);
      await api.admin.approveShop(shopId);
      setFeedback({ type: 'success', text: 'Shop approved successfully' });
      fetchShops();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Approval failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (shopId: string) => {
    try {
      setActionLoading(shopId);
      await api.admin.reactivateShop(shopId);
      setFeedback({ type: 'success', text: 'Shop reactivated and marked active' });
      fetchShops();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Reactivation failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendModalShop || !suspendReason.trim()) return;

    try {
      setActionLoading(suspendModalShop.id);
      await api.admin.suspendShop(suspendModalShop.id, suspendReason.trim());
      setFeedback({ type: 'success', text: `Shop '${suspendModalShop.name}' suspended` });
      setSuspendModalShop(null);
      setSuspendReason('');
      fetchShops();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Suspension failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalShop || !rejectReason.trim()) return;

    try {
      setActionLoading(rejectModalShop.id);
      await api.admin.rejectShop(rejectModalShop.id, rejectReason.trim());
      setFeedback({ type: 'success', text: `Shop '${rejectModalShop.name}' rejected` });
      setRejectModalShop(null);
      setRejectReason('');
      fetchShops();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    switch (status) {
      case 'APPROVED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">APPROVED & ACTIVE</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">PENDING REVIEW</span>;
      case 'SUSPENDED':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">SUSPENDED</span>;
      case 'REJECTED':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">REJECTED</span>;
      default:
        return <span className="text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Store className="w-5 h-5 text-brand-600" />
            Platform Shops & Branches Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage merchant verification, audit operating status, and govern public listing access.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by shop or village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 text-xs font-semibold">
        {['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
              statusFilter === st
                ? 'bg-brand-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading shops...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">
            No shops found matching the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Shop Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Village Location</th>
                  <th className="py-3.5 px-4">Owner / Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shops.map((s) => {
                  const owner = s.members?.[0]?.user;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {s.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {s.category?.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{s.village}</span>
                        <span className="text-[10px] text-slate-500 block">{s.district}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium">
                          {owner?.customerProfile?.fullName || 'Shopkeeper'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{s.phone}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(s.verificationStatus, s.isActive)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {s.verificationStatus === 'PENDING' && (
                          <>
                            <button
                              disabled={actionLoading === s.id}
                              onClick={() => handleApprove(s.id)}
                              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-[11px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoading === s.id}
                              onClick={() => {
                                setRejectModalShop(s);
                                setRejectReason('');
                              }}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-[11px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {s.verificationStatus === 'APPROVED' && (
                          <button
                            disabled={actionLoading === s.id}
                            onClick={() => {
                              setSuspendModalShop(s);
                              setSuspendReason('');
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold text-[11px] cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}

                        {(s.verificationStatus === 'SUSPENDED' || s.verificationStatus === 'REJECTED') && (
                          <button
                            disabled={actionLoading === s.id}
                            onClick={() => handleReactivate(s.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px] cursor-pointer flex items-center gap-1 inline-flex"
                          >
                            <RotateCcw className="w-3 h-3" /> Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total shops)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {suspendModalShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Suspend Shop: {suspendModalShop.name}
            </h3>
            <p className="text-xs text-slate-500">
              Suspended shops are immediately removed from public village listings and cannot receive customer orders.
            </p>
            <form onSubmit={handleConfirmSuspend} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Reason for suspension (minimum 3 characters)..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendModalShop(null)}
                  className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspendReason.trim().length < 3}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  Confirm Suspension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-red-900">
              Reject Shop Application: {rejectModalShop.name}
            </h3>
            <form onSubmit={handleConfirmReject} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalShop(null)}
                  className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectReason.trim().length < 3}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
