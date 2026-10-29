import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Activity,
  Shield,
  Clock,
  User,
  Store,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAuditLogs(page, 20);
      setLogs(res.logs);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVED')) {
      return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{action}</span>;
    }
    if (action.includes('REJECTED') || action.includes('SUSPENDED') || action.includes('DEACTIVATED')) {
      return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{action}</span>;
    }
    if (action.includes('REGISTERED')) {
      return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{action}</span>;
    }
    return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{action}</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Platform Security & Governance Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system audit logs recording administrator reviews, merchant approvals, and user status events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Retrieving audit history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">
            No audit records recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-semibold">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-sans font-medium text-slate-700">
                        {log.entity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="font-semibold text-slate-900 block">
                        {log.user?.customerProfile?.fullName || log.user?.email || log.user?.phone || 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.user?.role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-sans text-xs max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} audit events)
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

    </div>
  );
};
