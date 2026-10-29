import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminOverviewView } from './AdminOverviewView';
import { AdminApprovalQueueView } from './AdminApprovalQueueView';
import { AdminShopsView } from './AdminShopsView';
import { AdminUsersView } from './AdminUsersView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import {
  LayoutDashboard,
  Clock,
  Store,
  Users,
  Activity,
  ArrowLeft,
  Shield,
  LogOut,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from '../../router/Router';

export type AdminTab = 'overview' | 'approvals' | 'shops' | 'users' | 'audit';

export const adminTabToPath: Record<AdminTab, string> = {
  overview: '/admin/governance',
  approvals: '/admin/approvals',
  shops: '/admin/shops',
  users: '/admin/users',
  audit: '/admin/audit',
};

interface AdminLayoutProps {
  onBackToStore?: () => void;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onBackToStore,
  activeTab: activeTabProp = 'overview',
  onTabChange,
}) => {
  const { user, logout, setLoginOpen } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>(activeTabProp);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeTabProp && activeTabProp !== activeTab) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    } else {
      navigate(adminTabToPath[tab]);
    }
  };

  // Strict client-side check complementing server-side RBAC
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-serif">Administrator Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You must be authenticated as a verified Platform Administrator (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">admin@village1.in</code>) to access the Super Admin control center.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setLoginOpen(true)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Log in as Administrator
            </button>
            <button
              onClick={onBackToStore}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approval Queue', icon: Clock },
    { id: 'shops', label: 'All Shops', icon: Store },
    { id: 'users', label: 'Users Governance', icon: Users },
    { id: 'audit', label: 'Security Audit Logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
            V1
          </div>
          <span className="font-bold text-sm">Village1 Super Admin</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/20">
              V1
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">
                Village<span className="text-brand-500">1</span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Super Admin Center
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabChange(item.id as AdminTab);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* Back to store */}
          <button
            onClick={() => (onBackToStore ? onBackToStore() : navigate('/'))}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </button>

          {/* Admin User Badge */}
          <div className="p-2.5 bg-slate-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                A
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">
                  {user.customerProfile?.fullName || 'Platform Admin'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user.email || user.phone}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        {activeTab === 'overview' && <AdminOverviewView onNavigateTab={(tab) => handleTabChange(tab as AdminTab)} />}
        {activeTab === 'approvals' && <AdminApprovalQueueView />}
        {activeTab === 'shops' && <AdminShopsView />}
        {activeTab === 'users' && <AdminUsersView />}
        {activeTab === 'audit' && <AdminAuditLogsView />}
      </main>

    </div>
  );
};
