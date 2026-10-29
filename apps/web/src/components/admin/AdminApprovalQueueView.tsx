import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Clock,
  CheckCircle,
  XCircle,
  Store,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Loader2,
  Eye,
  X,
} from 'lucide-react';

export const AdminApprovalQueueView: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Review modal
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  
  // Rejection dialog
  const [rejectShopId, setRejectShopId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPendingShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getShops({ status: 'PENDING' });
      setShops(res.shops);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending shops queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingShops();
  }, []);

  const handleApprove = async (shopId: string) => {
    try {
      setActionLoading(shopId);
      setFeedbackMsg(null);
      await api.admin.approveShop(shopId);
      setFeedbackMsg({ type: 'success', text: 'Shop application approved successfully. Shop is now active!' });
      // Remove from pending list
      setShops(shops.filter((s) => s.id !== shopId));
      if (selectedShop?.id === shopId) setSelectedShop(null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to approve shop' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectShopId || !rejectionReason.trim()) return;

    try {
      setActionLoading(rejectShopId);
      setFeedbackMsg(null);
      await api.admin.rejectShop(rejectShopId, rejectionReason.trim());
      setFeedbackMsg({ type: 'success', text: 'Shop application rejected with reason recorded.' });
      setShops(shops.filter((s) => s.id !== rejectShopId));
      setRejectShopId(null);
      setRejectionReason('');
      if (selectedShop?.id === rejectShopId) setSelectedShop(null);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to reject shop' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading pending verification queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Shop Application Verification Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review submitted merchant details before authorizing public commerce and order placement.
          </p>
        </div>

        <button
          onClick={fetchPendingShops}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Refresh Queue ({shops.length})
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Queue List */}
      {shops.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Verification Queue is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All submitted village shop applications have been reviewed. When new merchants register their branches, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shops.map((shop) => {
            const owner = shop.members?.[0]?.user;
            return (
              <div
                key={shop.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
                      🏪
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{shop.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{shop.category?.name}</p>
                    </div>
                  </div>

                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> PENDING
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{shop.address}, {shop.village}, {shop.district} ({shop.pinCode})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Contact: {shop.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Owner: {owner?.customerProfile?.fullName || owner?.email || owner?.phone || 'Shopkeeper'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedShop(shop)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>

                  <button
                    disabled={actionLoading === shop.id}
                    onClick={() => handleApprove(shop.id)}
                    className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {actionLoading === shop.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    Approve
                  </button>

                  <button
                    disabled={actionLoading === shop.id}
                    onClick={() => {
                      setRejectShopId(shop.id);
                      setRejectionReason('');
                    }}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Details Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedShop.name}</h3>
                <p className="text-xs text-slate-500">{selectedShop.category?.name} • Registered on {new Date(selectedShop.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedShop(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Description</p>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedShop.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-500 text-[10px] uppercase">Location</p>
                  <p className="text-slate-800 font-semibold mt-1">{selectedShop.village}, {selectedShop.district}</p>
                  <p className="text-slate-500">{selectedShop.address} ({selectedShop.pinCode})</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-500 text-[10px] uppercase">Operating Hours</p>
                  <p className="text-slate-800 font-semibold mt-1">{selectedShop.openingHours} to {selectedShop.closingHours}</p>
                  <p className="text-slate-500">Holiday: {selectedShop.weeklyHoliday || 'None'}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-500 text-[10px] uppercase">Contact & Owner</p>
                <p className="text-slate-800 font-semibold mt-1">Phone: {selectedShop.phone} {selectedShop.email ? `• ${selectedShop.email}` : ''}</p>
                <p className="text-slate-500 mt-0.5">
                  Owner: {selectedShop.members?.[0]?.user?.customerProfile?.fullName || 'Shopkeeper'}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedShop(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                disabled={actionLoading === selectedShop.id}
                onClick={() => handleApprove(selectedShop.id)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      {rejectShopId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Reject Shop Application
              </h3>
              <button onClick={() => setRejectShopId(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection * (Visible to merchant)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Incomplete village address or invalid contact number provided."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectShopId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === rejectShopId || rejectionReason.trim().length < 3}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {actionLoading === rejectShopId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
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
