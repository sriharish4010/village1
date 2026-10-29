import React from 'react';
import { Router, Routes, Route } from './router/Router';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Customer Pages
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { CustomerOrdersPage } from './pages/customer/CustomerOrdersPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { FullScreenShopPage } from './pages/customer/FullScreenShopPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';

// Shopkeeper Pages
import { ShopkeeperDashboardPage } from './pages/shopkeeper/ShopkeeperDashboardPage';
import { ShopkeeperShopsPage } from './pages/shopkeeper/ShopkeeperShopsPage';
import { ShopkeeperAddItemPage } from './pages/shopkeeper/ShopkeeperAddItemPage';
import { ShopkeeperInventoryPage } from './pages/shopkeeper/ShopkeeperInventoryPage';
import { ShopkeeperPosPage } from './pages/shopkeeper/ShopkeeperPosPage';
import { ShopkeeperOrdersPage } from './pages/shopkeeper/ShopkeeperOrdersPage';
import { ShopkeeperSalesHistoryPage } from './pages/shopkeeper/ShopkeeperSalesHistoryPage';
import { ShopkeeperReportsPage } from './pages/shopkeeper/ShopkeeperReportsPage';
import { ShopkeeperSettingsPage } from './pages/shopkeeper/ShopkeeperSettingsPage';

// Admin Pages
import { AdminGovernancePage } from './pages/admin/AdminGovernancePage';
import { AdminApprovalsPage } from './pages/admin/AdminApprovalsPage';
import { AdminShopsPage } from './pages/admin/AdminShopsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Auth Pages
import { RoleSelectionPage } from './pages/auth/RoleSelectionPage';
import { CustomerAuthPage } from './pages/auth/CustomerAuthPage';
import { ShopkeeperAuthPage } from './pages/auth/ShopkeeperAuthPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';

// 404 Fallback
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <Router>
      <CartProvider>
        <Routes>
          {/* ── Public / Storefront Routes ── */}
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={false}>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute requireAuth={false}>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop/:shopId"
            element={
              <ProtectedRoute requireAuth={false}>
                <FullScreenShopPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'SHOPKEEPER', 'ADMIN']} redirectUnauthenticatedTo="/auth/customer">
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'SHOPKEEPER', 'ADMIN']} redirectUnauthenticatedTo="/auth/customer">
                <CustomerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'SHOPKEEPER', 'ADMIN']} redirectUnauthenticatedTo="/auth/customer">
                <CustomerProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ── Shopkeeper Dedicated Routes ── */}
          <Route
            path="/shopkeeper"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/shops"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperShopsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/products"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperShopsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/add-item"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperAddItemPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/inventory"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/pos"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperPosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/orders"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/sales-history"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperSalesHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/reports"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/settings"
            element={
              <ProtectedRoute allowedRoles={['SHOPKEEPER']} redirectUnauthenticatedTo="/auth/shopkeeper">
                <ShopkeeperSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* ── Super Admin Dedicated Routes ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauthenticatedTo="/admin/login">
                <AdminGovernancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/governance"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauthenticatedTo="/admin/login">
                <AdminGovernancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauthenticatedTo="/admin/login">
                <AdminApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shops"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauthenticatedTo="/admin/login">
                <AdminShopsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauthenticatedTo="/admin/login">
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauthenticatedTo="/admin/login">
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* ── Auth Routes ── */}
          <Route path="/auth" element={<RoleSelectionPage />} />
          <Route path="/auth/customer" element={<CustomerAuthPage />} />
          <Route path="/auth/shopkeeper" element={<ShopkeeperAuthPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ── 404 Fallback Route ── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CartProvider>
    </Router>
  );
};
export default App;
