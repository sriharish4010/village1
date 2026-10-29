import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Shield,
  Store,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Status update modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<boolean>(false);
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getUsers({
        role: roleFilter,
        status: statusFilter,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenStatusModal = (user: any, newStatus: boolean) => {
    setSelectedUser(user);
    setTargetStatus(newStatus);
    setStatusReason('');
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !statusReason.trim()) return;

    try {
      setActionLoading(true);
      await api.admin.updateUserStatus(selectedUser.id, targetStatus, statusReason.trim());
      setFeedback({
        type: 'success',
        text: `Account for '${selectedUser.customerProfile?.fullName || selectedUser.email || selectedUser.phone}' has been ${targetStatus ? 'activated' : 'deactivated'}.`,
      });
      setSelectedUser(null);
      setStatusReason('');
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update user status' });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" /> ADMIN</span>;
      case 'SHOPKEEPER':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Store className="w-3 h-3" /> SHOPKEEPER</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><User className="w-3 h-3" /> CUSTOMER</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Registered Platform Users Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit user profiles, verify roles, and govern account activation states with logged audit reasons.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search name, phone, email..."
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1 text-[11px] uppercase">Role:</span>
          {['ALL', 'CUSTOMER', 'SHOPKEEPER', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRoleFilter(r);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                roleFilter === r ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1 text-[11px] uppercase">Status:</span>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                statusFilter === st ? 'bg-brand-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
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

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">
            No users found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Village Profile</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrentSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {u.customerProfile?.fullName || 'User'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {u.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 block">{u.phone || 'No phone'}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[140px] block">{u.email || 'No email'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium">
                          {u.customerProfile?.village || 'Alanganallur'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {u.customerProfile?.district || 'Madurai'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> DEACTIVATED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isCurrentSelf ? (
                          <span className="text-[11px] text-slate-400 italic">Self Account</span>
                        ) : u.isActive ? (
                          <button
                            onClick={() => handleOpenStatusModal(u, false)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-[11px] cursor-pointer"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenStatusModal(u, true)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px] cursor-pointer"
                          >
                            Reactivate
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
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

      {/* Account Status Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${targetStatus ? 'text-emerald-600' : 'text-red-600'}`} />
              {targetStatus ? 'Reactivate' : 'Deactivate'} User Account: {selectedUser.customerProfile?.fullName || selectedUser.email}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {targetStatus
                ? 'Reactivating this user will restore their ability to log in and manage their shops or place orders.'
                : 'Deactivating this user will immediately revoke all active sessions and refresh tokens, blocking platform access.'}
            </p>
            <form onSubmit={handleConfirmStatusChange} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Justification Reason * (Recorded in Security Audit Log)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the administrative reason for this status change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-3.5 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || statusReason.trim().length < 3}
                  className={`px-4 py-1.5 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-1.5 ${
                    targetStatus ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirm {targetStatus ? 'Activation' : 'Deactivation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
