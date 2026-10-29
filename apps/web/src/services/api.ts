import { AuthResponse, User, UserAddress } from '../types/auth';

const API_BASE = '/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;

  constructor() {
    this.accessToken = localStorage.getItem('v1_access_token');
    this.refreshToken = localStorage.getItem('v1_refresh_token');
  }

  public setTokens(tokens: { accessToken: string; refreshToken: string } | null) {
    if (tokens) {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      localStorage.setItem('v1_access_token', tokens.accessToken);
      localStorage.setItem('v1_refresh_token', tokens.refreshToken);
    } else {
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('v1_access_token');
      localStorage.removeItem('v1_refresh_token');
    }
  }

  public getAccessToken() {
    return this.accessToken;
  }

  public getRefreshToken() {
    return this.refreshToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration & automatic refresh
    if (response.status === 401 && this.refreshToken && !this.isRefreshing && !endpoint.includes('/auth/login')) {
      this.isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        const refreshRawText = await refreshRes.text();
        let refreshData: ApiResponse<{ accessToken: string; refreshToken: string }> | null = null;
        if (refreshRawText && refreshRawText.trim().length > 0) {
          try {
            refreshData = JSON.parse(refreshRawText);
          } catch {
            refreshData = null;
          }
        }

        if (refreshData?.success && refreshData.data) {
          this.setTokens(refreshData.data);
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          this.setTokens(null);
        }
      } catch (err) {
        this.setTokens(null);
      } finally {
        this.isRefreshing = false;
      }
    }

    // Safely parse response body
    const rawText = await response.text();
    let data: ApiResponse<T> | null = null;
    if (rawText && rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText);
      } catch {
        // Response is empty or non-JSON (e.g. HTML gateway error or plain text)
        data = null;
      }
    }

    if (!response.ok) {
      let errorMsg = data?.error?.message;
      if (!errorMsg) {
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          errorMsg = 'Cannot connect to backend server. Please verify the server is running on port 5000.';
        } else if (response.status === 404) {
          errorMsg = 'Requested API endpoint was not found on the server.';
        } else if (response.status === 500 && !data?.error?.message) {
          errorMsg = 'Backend server temporarily unavailable or restarting (HTTP 500). Please retry in a moment.';
        } else {
          errorMsg = `Server error (HTTP ${response.status}: ${response.statusText || 'Error'})`;
        }
      } else if (data?.error?.details && Array.isArray(data.error.details) && data.error.details.length > 0) {
        const detailsStr = data.error.details
          .map((d: any) => (d.message ? `${d.field ? d.field + ': ' : ''}${d.message}` : null))
          .filter(Boolean)
          .join(', ');
        if (detailsStr) {
          errorMsg = `${errorMsg}: ${detailsStr}`;
        }
      }

      const errorObj = new Error(errorMsg) as any;
      errorObj.code = data?.error?.code || `HTTP_${response.status}`;
      errorObj.details = data?.error?.details;
      errorObj.status = response.status;
      throw errorObj;
    }

    if (!data) {
      // Handles 204 No Content or successful empty responses
      return undefined as unknown as T;
    }

    if (!data.success) {
      let errorMsg = data.error?.message || 'A network error occurred. Please try again.';
      if (data.error?.details && Array.isArray(data.error.details) && data.error.details.length > 0) {
        const detailsStr = data.error.details
          .map((d: any) => (d.message ? `${d.field ? d.field + ': ' : ''}${d.message}` : null))
          .filter(Boolean)
          .join(', ');
        if (detailsStr) {
          errorMsg = `${errorMsg}: ${detailsStr}`;
        }
      }
      const errorObj = new Error(errorMsg) as any;
      errorObj.code = data.error?.code || 'UNKNOWN_ERROR';
      errorObj.details = data.error?.details;
      errorObj.status = response.status;
      throw errorObj;
    }

    return data.data as T;
  }

  // Auth Endpoints
  public auth = {
    register: (payload: any) => this.request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (identifier: string, password: string) =>
      this.request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
    getMe: () => this.request<{ user: User }>('/auth/me'),
    updateProfile: (data: any) => this.request<{ profile: any }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    logout: async () => {
      try {
        if (this.refreshToken) {
          await this.request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: this.refreshToken }) });
        }
      } finally {
        this.setTokens(null);
      }
    },
  };

  // User Endpoints
  public users = {
    getAddresses: () => this.request<{ addresses: UserAddress[] }>('/users/addresses'),
    addAddress: (address: any) => this.request<{ address: UserAddress }>('/users/addresses', { method: 'POST', body: JSON.stringify(address) }),
    deleteAddress: (id: string) => this.request(`/users/addresses/${id}`, { method: 'DELETE' }),
  };

  // Shops Endpoints
  public shops = {
    getPublic: (query: { village?: string; categoryId?: string; search?: string; page?: number }) => {
      const params = new URLSearchParams();
      if (query.village) params.append('village', query.village);
      if (query.categoryId) params.append('categoryId', query.categoryId);
      if (query.search) params.append('search', query.search);
      if (query.page) params.append('page', query.page.toString());
      return this.request<{ shops: any[]; pagination: any }>(`/shops/public?${params.toString()}`);
    },
    getCategories: () => this.request<{ categories: any[] }>('/shops/categories'),
    getMyShops: () => this.request<{ shops: any[] }>('/shops/my-shops'),
    registerShop: (data: any) => this.request<{ shop: any }>('/shops', { method: 'POST', body: JSON.stringify(data) }),
    getShopById: (id: string) => this.request<{ shop: any }>(`/shops/${id}`),
    getProducts: (shopId: string, query?: { search?: string; sort?: string }) => {
      const params = new URLSearchParams();
      if (query?.search) params.append('search', query.search);
      if (query?.sort) params.append('sort', query.sort);
      const q = params.toString() ? `?${params.toString()}` : '';
      return this.request<{ shop: any; products: any[] }>(`/shops/${shopId}/products${q}`);
    },
  };

  // Orders Endpoints
  public orders = {
    create: (data: { shopId: string; paymentMethod: 'CASH_ON_PICKUP' | 'UPI_QR'; notes?: string; items: { productId: string; quantity: number }[] }) =>
      this.request<{ order: any }>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    getMyOrders: (status?: string) => {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      return this.request<{ orders: any[] }>(`/orders/my-orders${q}`);
    },
    getOrderById: (orderId: string) => this.request<{ order: any }>(`/orders/${orderId}`),
    getShopOrders: (query?: { shopId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (query?.shopId) params.append('shopId', query.shopId);
      if (query?.status) params.append('status', query.status);
      const q = params.toString() ? `?${params.toString()}` : '';
      return this.request<{ orders: any[]; managedShopIds: string[] }>(`/orders/shop-orders${q}`);
    },
    updateStatus: (orderId: string, status: string, rejectionReason?: string) =>
      this.request<{ order: any }>(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejectionReason }),
      }),
    packItem: (orderId: string, itemId: string, isPacked: boolean) =>
      this.request<{
        item: any;
        orderId: string;
        orderStatus: string;
        packingProgress: { packedCount: number; totalCount: number; allPacked: boolean };
        items: any[];
      }>(`/orders/${orderId}/items/${itemId}/pack`, {
        method: 'PUT',
        body: JSON.stringify({ isPacked }),
      }),
    verifyPickup: (orderId: string, pickupCode: string) =>
      this.request<{ order: any; alreadyCollected: boolean }>(`/orders/${orderId}/verify-pickup`, {
        method: 'POST',
        body: JSON.stringify({ pickupCode }),
      }),
  };

  // Super Admin Endpoints
  public admin = {
    getStats: () => this.request<{ stats: any }>('/admin/stats'),
    getShops: (query: { status?: string; search?: string; village?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (query.status) params.append('status', query.status);
      if (query.search) params.append('search', query.search);
      if (query.village) params.append('village', query.village);
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      return this.request<{ shops: any[]; pagination: any }>(`/admin/shops?${params.toString()}`);
    },
    getShopDetails: (id: string) => this.request<{ shop: any }>(`/admin/shops/${id}`),
    approveShop: (id: string) => this.request<{ shop: any; message: string }>(`/admin/shops/${id}/approve`, { method: 'PUT' }),
    rejectShop: (id: string, reason: string) =>
      this.request<{ shop: any; message: string }>(`/admin/shops/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
    suspendShop: (id: string, reason: string) =>
      this.request<{ shop: any; message: string }>(`/admin/shops/${id}/suspend`, { method: 'PUT', body: JSON.stringify({ reason }) }),
    reactivateShop: (id: string) => this.request<{ shop: any; message: string }>(`/admin/shops/${id}/reactivate`, { method: 'PUT' }),
    getUsers: (query: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (query.role) params.append('role', query.role);
      if (query.status) params.append('status', query.status);
      if (query.search) params.append('search', query.search);
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      return this.request<{ users: any[]; pagination: any }>(`/admin/users?${params.toString()}`);
    },
    updateUserStatus: (id: string, isActive: boolean, reason: string) =>
      this.request<{ user: any; message: string }>(`/admin/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive, reason }),
      }),
    getAuditLogs: (page = 1, limit = 25) =>
      this.request<{ logs: any[]; pagination: any }>(`/admin/audit-logs?page=${page}&limit=${limit}`),
  };

  // Shopkeeper Management Endpoints
  public shopManagement = {
    // Items / Products
    getItems: (shopId: string, query?: { search?: string; category?: string; availability?: string; lowStockOnly?: string; includeArchived?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (query?.search) params.append('search', query.search);
      if (query?.category) params.append('category', query.category);
      if (query?.availability) params.append('availability', query.availability);
      if (query?.lowStockOnly) params.append('lowStockOnly', query.lowStockOnly);
      if (query?.includeArchived) params.append('includeArchived', query.includeArchived);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      const q = params.toString() ? `?${params.toString()}` : '';
      return this.request<{ items: any[]; pagination: any }>(`/shop-management/${shopId}/items${q}`);
    },
    createItem: (shopId: string, data: any) =>
      this.request<{ product: any; message: string }>(`/shop-management/${shopId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateItem: (shopId: string, productId: string, data: any) =>
      this.request<{ product: any; message: string }>(`/shop-management/${shopId}/items/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    adjustStock: (shopId: string, productId: string, data: { delta: number; reason: string }) =>
      this.request<{ product: any; log: any; message: string }>(`/shop-management/${shopId}/items/${productId}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Inventory
    getInventory: (shopId: string) =>
      this.request<{ shopName: string; metrics: any; items: any[] }>(`/shop-management/${shopId}/inventory`),
    getInventoryHistory: (shopId: string, query?: { productId?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (query?.productId) params.append('productId', query.productId);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      const q = params.toString() ? `?${params.toString()}` : '';
      return this.request<{ logs: any[]; pagination: any }>(`/shop-management/${shopId}/inventory/history${q}`);
    },

    // Billing / POS
    createPosBill: (
      shopId: string,
      data: {
        customerName?: string | null;
        customerPhone?: string | null;
        customerAddress?: string | null;
        discount?: number;
        paymentMethod: 'CASH' | 'UPI';
        paymentReference?: string | null;
        cashReceived?: number | null;
        isDraft?: boolean;
        paymentConfirmed?: boolean;
        notes?: string | null;
        items: { productId: string; quantity: number }[];
      }
    ) =>
      this.request<{ bill: any; message: string }>(`/shop-management/${shopId}/pos/bills`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updatePosDraftBill: (
      shopId: string,
      billId: string,
      data: {
        customerName?: string | null;
        customerPhone?: string | null;
        customerAddress?: string | null;
        discount?: number;
        paymentMethod: 'CASH' | 'UPI';
        paymentReference?: string | null;
        cashReceived?: number | null;
        notes?: string | null;
        items: { productId: string; quantity: number }[];
      }
    ) =>
      this.request<{ bill: any; message: string }>(`/shop-management/${shopId}/pos/bills/${billId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    finalizePosDraftBill: (
      shopId: string,
      billId: string,
      data: {
        customerName?: string | null;
        customerPhone?: string | null;
        customerAddress?: string | null;
        paymentMethod: 'CASH' | 'UPI';
        paymentReference?: string | null;
        paymentConfirmed?: boolean;
        cashReceived?: number | null;
      }
    ) =>
      this.request<{ bill: any; message: string }>(`/shop-management/${shopId}/pos/bills/${billId}/finalize`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    voidPosBill: (shopId: string, billId: string, reason: string) =>
      this.request<{ bill: any; message: string }>(`/shop-management/${shopId}/pos/bills/${billId}/void`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    // Sales History
    getSalesHistory: (
      shopId: string,
      query?: {
        startDate?: string;
        endDate?: string;
        search?: string;
        source?: 'ALL' | 'POS_WALKIN' | 'ONLINE_ORDER';
        paymentMethod?: string;
        paymentStatus?: string;
        page?: number;
        limit?: number;
      }
    ) => {
      const params = new URLSearchParams();
      if (query?.startDate) params.append('startDate', query.startDate);
      if (query?.endDate) params.append('endDate', query.endDate);
      if (query?.search) params.append('search', query.search);
      if (query?.source && query.source !== 'ALL') params.append('source', query.source);
      if (query?.paymentMethod && query.paymentMethod !== 'ALL') params.append('paymentMethod', query.paymentMethod);
      if (query?.paymentStatus && query.paymentStatus !== 'ALL') params.append('paymentStatus', query.paymentStatus);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      const q = params.toString() ? `?${params.toString()}` : '';
      return this.request<{ bills: any[]; pagination: any }>(`/shop-management/${shopId}/sales${q}`);
    },

    // Reports
    getReports: (shopId: string, query?: { startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams();
      if (query?.startDate) params.append('startDate', query.startDate);
      if (query?.endDate) params.append('endDate', query.endDate);
      const q = params.toString() ? `?${params.toString()}` : '';
      return this.request<{
        shopName: string;
        today: any;
        selectedRange: any;
        bestSellers: any[];
        lowStock: any;
      }>(`/shop-management/${shopId}/reports${q}`);
    },
  };
}

export const api = new ApiClient();
