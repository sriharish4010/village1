import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Phone,
  Scissors,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  QrCode,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  PlusCircle,
  FileText,
  Building2,
  ShieldAlert,
  Sparkles,
  LayoutDashboard,
  Boxes,
  Plus,
  Receipt,
  History,
  BarChart3,
  Settings,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Printer,
  Trash2,
  Edit,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Save,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '../router/Router';

export type NavTab =
  | 'overview'
  | 'products'
  | 'add-item'
  | 'inventory'
  | 'orders'
  | 'pos'
  | 'sales-history'
  | 'reports'
  | 'settings';

export const shopkeeperTabToPath: Record<NavTab, string> = {
  overview: '/shopkeeper/dashboard',
  products: '/shopkeeper/shops',
  'add-item': '/shopkeeper/add-item',
  inventory: '/shopkeeper/inventory',
  orders: '/shopkeeper/orders',
  pos: '/shopkeeper/pos',
  'sales-history': '/shopkeeper/sales-history',
  reports: '/shopkeeper/reports',
  settings: '/shopkeeper/settings',
};

export interface ShopkeeperDashboardProps {
  onBack?: () => void;
  initialTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

export const ShopkeeperDashboard: React.FC<ShopkeeperDashboardProps> = ({
  onBack,
  initialTab = 'overview',
  onTabChange,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [managedShops, setManagedShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    } else {
      navigate(shopkeeperTabToPath[tab]);
    }
  };

  // Common status & error
  const [shopsLoading, setShopsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [pickupCodeInput, setPickupCodeInput] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Dedicated Packing Modal State
  const [packingOrder, setPackingOrder] = useState<any | null>(null);
  const [packingItemLoading, setPackingItemLoading] = useState<string | null>(null);
  const [confirmReadyOpen, setConfirmReadyOpen] = useState(false);

  // Items State
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('');
  const [itemAvailabilityFilter, setItemAvailabilityFilter] = useState('ALL');
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Add / Edit Item Form State
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    description: '',
    sku: '',
    price: '',
    mrp: '',
    stock: '10',
    unit: 'piece',
    imageUrl: '',
    isAvailable: true,
    lowStockThreshold: '5',
  });
  const [itemSubmitting, setItemSubmitting] = useState(false);

  // Inventory State
  const [inventoryOverview, setInventoryOverview] = useState<any | null>(null);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [adjustModalItem, setAdjustModalItem] = useState<any | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // POS / Billing Mode State ('WALKIN' vs 'ONLINE_ORDER')
  const [posMode, setPosMode] = useState<'WALKIN' | 'ONLINE_ORDER'>('WALKIN');
  const [selectedOnlineOrderForBilling, setSelectedOnlineOrderForBilling] = useState<any | null>(null);

  // Walk-in / POS Cart State
  const [posSearch, setPosSearch] = useState('');
  const [posCart, setPosCart] = useState<{ product: any; quantity: number }[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posCustomerAddress, setPosCustomerAddress] = useState('');
  const [posCustomerNotes, setPosCustomerNotes] = useState('');
  const [posDiscount, setPosDiscount] = useState('0');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [posPaymentReference, setPosPaymentReference] = useState('');
  const [posPaymentConfirmed, setPosPaymentConfirmed] = useState(false);
  const [posCashReceived, setPosCashReceived] = useState('');
  const [editingDraftBillId, setEditingDraftBillId] = useState<string | null>(null);
  const [posSubmitting, setPosSubmitting] = useState(false);
  const [completedBill, setCompletedBill] = useState<any | null>(null);
  const [confirmSaleModalOpen, setConfirmSaleModalOpen] = useState(false);
  const [posErrors, setPosErrors] = useState<{
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    cashReceived?: string;
    general?: string;
  }>({});
  const posSubmittingRef = useRef(false);

  // Voiding Bill State
  const [voidingBill, setVoidingBill] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);

  // Sales History State
  const [salesBills, setSalesBills] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesSourceFilter, setSalesSourceFilter] = useState<'ALL' | 'POS_WALKIN' | 'ONLINE_ORDER'>('ALL');
  const [salesPaymentMethodFilter, setSalesPaymentMethodFilter] = useState('ALL');
  const [salesPaymentStatusFilter, setSalesPaymentStatusFilter] = useState('ALL');
  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');
  const [viewingBillModal, setViewingBillModal] = useState<any | null>(null);

  // Reports State
  const [reportData, setReportData] = useState<any | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Register New Shop Modal State
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [newShopName, setNewShopName] = useState('');
  const [newShopCategoryId, setNewShopCategoryId] = useState('');
  const [newShopDescription, setNewShopDescription] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopVillage, setNewShopVillage] = useState(user?.customerProfile?.village || 'Alanganallur');
  const [newShopDistrict, setNewShopDistrict] = useState(user?.customerProfile?.district || 'Madurai');
  const [newShopPinCode, setNewShopPinCode] = useState(user?.customerProfile?.pinCode || '625501');
  const [newShopPhone, setNewShopPhone] = useState(user?.phone || '');
  const [newShopOpeningHours, setNewShopOpeningHours] = useState('08:00');
  const [newShopClosingHours, setNewShopClosingHours] = useState('21:00');
  const [newShopWeeklyHoliday, setNewShopWeeklyHoliday] = useState('None');
  const [newShopPickupInstructions, setNewShopPickupInstructions] = useState(
    'Collect from store counter with 6-digit pickup code.'
  );

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // 1. Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.shops.getCategories();
      if (res?.categories) {
        setCategories(res.categories);
        if (res.categories.length > 0 && !newShopCategoryId) {
          setNewShopCategoryId(res.categories[0].id);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  // 2. Fetch Managed Shops
  const fetchMyShops = async () => {
    try {
      setShopsLoading(true);
      setError(null);
      const res = await api.shops.getMyShops();
      if (res?.shops && res.shops.length > 0) {
        setManagedShops(res.shops);
        if (!selectedShopId || !res.shops.some((m) => m.shop.id === selectedShopId)) {
          const approved = res.shops.find((m) => m.shop.verificationStatus === 'APPROVED');
          setSelectedShopId(approved ? approved.shop.id : res.shops[0].shop.id);
        }
      } else {
        setManagedShops([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch authorized shops');
    } finally {
      setShopsLoading(false);
    }
  };

  // Active shop object
  const activeShopObj = managedShops.find((m) => m.shop.id === selectedShopId)?.shop;
  const isShopApproved = activeShopObj?.verificationStatus === 'APPROVED';

  // Category identification helpers
  const activeCategorySlug = activeShopObj?.category?.slug || '';
  const activeCategoryName = activeShopObj?.category?.name || 'Local Store';
  const isSalonShop =
    activeCategorySlug === 'salons-barber-shops' ||
    activeShopObj?.name?.toLowerCase().includes('hair') ||
    activeShopObj?.name?.toLowerCase().includes('salon') ||
    activeShopObj?.name?.toLowerCase().includes('barber');

  // Handle switching active shop safely: clears any existing form inputs so items cannot be accidentally created under the previous shop
  const handleSelectShop = (newShopId: string) => {
    if (newShopId === selectedShopId) return;
    setSelectedShopId(newShopId);
    setEditingItem(null);
    setItemError(null);
    setItemForm({
      name: '',
      category: '',
      description: '',
      sku: '',
      price: '',
      mrp: '',
      stock: '10',
      unit: 'piece',
      imageUrl: '',
      isAvailable: true,
      lowStockThreshold: '5',
    });
    setPosCart([]);
  };

  // 3. Fetch Orders
  const fetchOrders = async (silent = false) => {
    if (!selectedShopId || !isShopApproved) return;
    try {
      if (!silent) setOrdersLoading(true);
      const res = await api.orders.getShopOrders({
        shopId: selectedShopId,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      if (res?.orders) {
        setOrders(res.orders);
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load shop orders');
    } finally {
      if (!silent) setOrdersLoading(false);
    }
  };

  // 4. Fetch Items
  const fetchItems = async () => {
    if (!selectedShopId || !isShopApproved) return;
    try {
      setItemsLoading(true);
      const res = await api.shopManagement.getItems(selectedShopId, {
        search: itemSearch || undefined,
        category: itemCategoryFilter || undefined,
        availability: itemAvailabilityFilter,
      });
      if (res?.items) {
        setItems(res.items);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
    } finally {
      setItemsLoading(false);
    }
  };

  // 5. Fetch Inventory Overview & Logs
  const fetchInventory = async () => {
    if (!selectedShopId || !isShopApproved) return;
    try {
      setInventoryLoading(true);
      const [invRes, logsRes] = await Promise.all([
        api.shopManagement.getInventory(selectedShopId),
        api.shopManagement.getInventoryHistory(selectedShopId, { limit: 30 }),
      ]);
      if (invRes) setInventoryOverview(invRes);
      if (logsRes?.logs) setInventoryLogs(logsRes.logs);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
  };

  // 6. Fetch Sales History
  const fetchSales = async () => {
    if (!selectedShopId || !isShopApproved) return;
    try {
      setSalesLoading(true);
      const res = await api.shopManagement.getSalesHistory(selectedShopId, {
        startDate: salesStartDate || undefined,
        endDate: salesEndDate || undefined,
        search: salesSearch || undefined,
        source: salesSourceFilter,
        paymentMethod: salesPaymentMethodFilter !== 'ALL' ? salesPaymentMethodFilter : undefined,
        paymentStatus: salesPaymentStatusFilter !== 'ALL' ? salesPaymentStatusFilter : undefined,
      });
      if (res?.bills) {
        setSalesBills(res.bills);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sales history');
    } finally {
      setSalesLoading(false);
    }
  };

  // 7. Fetch Reports
  const fetchReports = async () => {
    if (!selectedShopId || !isShopApproved) return;
    try {
      setReportsLoading(true);
      const res = await api.shopManagement.getReports(selectedShopId, {
        startDate: reportStartDate || undefined,
        endDate: reportEndDate || undefined,
      });
      if (res) {
        setReportData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyShops();
    fetchCategories();
  }, []);

  // Immediately reset shop data when selectedShopId changes to prevent stale data flashing
  useEffect(() => {
    setItems([]);
    setOrders([]);
    setInventoryOverview(null);
    setSalesBills([]);
    setReportData(null);
  }, [selectedShopId]);

  useEffect(() => {
    if (!selectedShopId || !isShopApproved) return;

    if (activeTab === 'orders' || activeTab === 'overview') {
      fetchOrders();
    }
    if (activeTab === 'products' || activeTab === 'overview' || activeTab === 'pos') {
      fetchItems();
    }
    if (activeTab === 'inventory' || activeTab === 'overview') {
      fetchInventory();
    }
    if (activeTab === 'sales-history') {
      fetchSales();
    }
    if (activeTab === 'reports' || activeTab === 'overview') {
      fetchReports();
    }
  }, [selectedShopId, isShopApproved, activeTab, statusFilter]);

  // Periodic polling for orders
  useEffect(() => {
    if (selectedShopId && isShopApproved && (activeTab === 'orders' || activeTab === 'overview')) {
      const interval = setInterval(() => fetchOrders(true), 6000);
      return () => clearInterval(interval);
    }
  }, [selectedShopId, isShopApproved, activeTab, statusFilter]);

  // Handle Order Status Transitions
  const handleUpdateStatus = async (orderId: string, status: string, reason?: string) => {
    try {
      setActionLoading(orderId);
      setError(null);
      await api.orders.updateStatus(orderId, status, reason);
      await fetchOrders(true);
      setRejectingOrderId(null);
      setRejectionReason('');
      showNotification(`Order status updated to ${status}`);
    } catch (err: any) {
      setError(err.message || `Failed to update order status`);
    } finally {
      setActionLoading(null);
    }
  };

  // Open Dedicated Packing View
  const handleOpenPacking = (order: any) => {
    setPackingOrder(order);
    setConfirmReadyOpen(false);
  };

  // Toggle Item Packed Status
  const handleTogglePackItem = async (orderId: string, itemId: string, currentPacked: boolean) => {
    try {
      setPackingItemLoading(itemId);
      setError(null);
      const res = await api.orders.packItem(orderId, itemId, !currentPacked);
      if (res?.items) {
        // Update current packingOrder state
        setPackingOrder((prev: any) => {
          if (!prev || prev.id !== orderId) return prev;
          return {
            ...prev,
            status: res.orderStatus,
            items: res.items,
          };
        });
        // Update main orders list
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: res.orderStatus, items: res.items } : o
          )
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update item packing status');
    } finally {
      setPackingItemLoading(null);
    }
  };

  // Confirm Mark Ready for Collection
  const handleConfirmMarkReady = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      setError(null);
      await api.orders.updateStatus(orderId, 'READY_FOR_PICKUP');
      await fetchOrders(true);
      setConfirmReadyOpen(false);
      setPackingOrder(null);
      showNotification('Order marked READY FOR COLLECTION! Customer can now pick up with code.');
    } catch (err: any) {
      setError(err.message || 'Failed to mark order ready for collection');
    } finally {
      setActionLoading(null);
    }
  };

  // Verify Pickup Code
  const handleVerifyPickup = async (orderId: string) => {
    if (!pickupCodeInput || pickupCodeInput.trim().length !== 6) {
      setVerificationError('Please enter the 6-digit code shown on customer screen.');
      return;
    }
    try {
      setActionLoading(orderId);
      setVerificationError(null);
      await api.orders.verifyPickup(orderId, pickupCodeInput.trim());
      setVerifyingOrderId(null);
      setPickupCodeInput('');
      await fetchOrders(true);
      showNotification('Pickup code verified! Order marked as collected & paid.');
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed. Incorrect code.');
    } finally {
      setActionLoading(null);
    }
  };

  // Add / Edit Item specific error/success state
  const [itemError, setItemError] = useState<string | null>(null);

  // Handle Item Form Submit (Add / Edit)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setItemError(null);

    if (!selectedShopId) {
      const msg = 'No shop selected. Please select an approved shop first.';
      setError(msg);
      setItemError(msg);
      return;
    }

    if (!isShopApproved) {
      const msg = 'This shop is not yet approved by the administrator. Operations are restricted until approval.';
      setError(msg);
      setItemError(msg);
      return;
    }

    const price = parseFloat(itemForm.price);
    const mrp = itemForm.mrp && itemForm.mrp.trim() !== '' ? parseFloat(itemForm.mrp) : undefined;
    const stock = parseInt(itemForm.stock, 10);
    const threshold = parseInt(itemForm.lowStockThreshold, 10);

    if (!itemForm.name || itemForm.name.trim().length < 2) {
      const msg = 'Item name must be at least 2 characters long.';
      setError(msg);
      setItemError(msg);
      return;
    }

    if (isNaN(price) || price <= 0) {
      const msg = 'Selling price must be greater than zero.';
      setError(msg);
      setItemError(msg);
      return;
    }
    if (mrp !== undefined && (isNaN(mrp) || mrp <= 0)) {
      const msg = 'Optional MRP must be greater than zero when provided.';
      setError(msg);
      setItemError(msg);
      return;
    }
    if (isNaN(stock) || stock < 0) {
      const msg = 'Stock quantity cannot be negative.';
      setError(msg);
      setItemError(msg);
      return;
    }

    try {
      setItemSubmitting(true);
      const payload: any = {
        name: itemForm.name.trim(),
        category: itemForm.category.trim() || undefined,
        description: itemForm.description.trim() || undefined,
        sku: itemForm.sku.trim() || undefined,
        price,
        mrp: mrp !== undefined ? mrp : null,
        stock,
        unit: itemForm.unit.trim() || 'piece',
        imageUrl: itemForm.imageUrl.trim() || null,
        isAvailable: itemForm.isAvailable,
        lowStockThreshold: isNaN(threshold) ? 5 : threshold,
      };

      console.log('[ShopkeeperDashboard] Submitting item to shop:', selectedShopId, payload);

      if (editingItem) {
        await api.shopManagement.updateItem(selectedShopId, editingItem.id, payload);
        showNotification(`"${payload.name}" updated successfully.`);
      } else {
        await api.shopManagement.createItem(selectedShopId, payload);
        showNotification(`"${payload.name}" added to catalog.`);
      }

      // Reset form
      setItemForm({
        name: '',
        category: '',
        description: '',
        sku: '',
        price: '',
        mrp: '',
        stock: '10',
        unit: 'piece',
        imageUrl: '',
        isAvailable: true,
        lowStockThreshold: '5',
      });
      setEditingItem(null);
      setItemError(null);
      handleTabChange('products');
      fetchItems();
    } catch (err: any) {
      console.error('[ShopkeeperDashboard] Failed to save product:', err);
      const errorMsg = err.message || err.error?.message || 'Failed to save product';
      setError(errorMsg);
      setItemError(errorMsg);
    } finally {
      setItemSubmitting(false);
    }
  };

  // Stock Adjustment Submit
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;
    const delta = parseInt(adjustDelta, 10);
    if (isNaN(delta) || delta === 0) {
      setError('Adjustment quantity cannot be 0.');
      return;
    }
    if (!adjustReason.trim()) {
      setError('Please provide a recorded reason for adjusting stock.');
      return;
    }

    try {
      setAdjustSubmitting(true);
      setError(null);
      await api.shopManagement.adjustStock(selectedShopId, adjustModalItem.id, {
        delta,
        reason: adjustReason.trim(),
      });
      showNotification(`Stock adjusted for "${adjustModalItem.name}".`);
      setAdjustModalItem(null);
      setAdjustDelta('');
      setAdjustReason('');
      fetchInventory();
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // POS: Add to Cart
  const handlePosAddToCart = (prod: any) => {
    if (prod.stock <= 0) return;
    setPosCart((prev) => {
      const existing = prev.find((item) => item.product.id === prod.id);
      if (existing) {
        if (existing.quantity >= prod.stock) {
          setError(`Cannot add more than available stock (${prod.stock}).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handlePosUpdateQty = (productId: string, qty: number, maxStock: number) => {
    if (qty <= 0) {
      setPosCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    if (qty > maxStock) {
      setError(`Quantity exceeds available stock (${maxStock}).`);
      return;
    }
    setPosCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  };

  // POS Calculation
  const posSubtotal = posCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const parsedDiscount = Math.min(posSubtotal, Math.max(0, parseFloat(posDiscount) || 0));
  const posTotal = Math.max(0, Math.round((posSubtotal - parsedDiscount) * 100) / 100);

  // POS Actions: Reset draft/cart form
  const handleResetPosForm = () => {
    setPosCart([]);
    setPosCustomerName('');
    setPosCustomerPhone('');
    setPosCustomerAddress('');
    setPosCustomerNotes('');
    setPosDiscount('0');
    setPosPaymentMethod('CASH');
    setPosPaymentReference('');
    setPosPaymentConfirmed(false);
    setPosCashReceived('');
    setEditingDraftBillId(null);
    setConfirmSaleModalOpen(false);
    setPosErrors({});
  };

  // 1. Save Draft POS Bill
  const handleSaveDraftPosBill = async () => {
    if (posCart.length === 0) {
      setError('Please add at least one item before saving a draft.');
      return;
    }
    if (posCustomerPhone.trim() && !/^[6-9]\d{9}$/.test(posCustomerPhone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number (or leave blank).');
      return;
    }

    try {
      setPosSubmitting(true);
      setError(null);

      const payload = {
        customerName: posCustomerName.trim() || undefined,
        customerPhone: posCustomerPhone.trim() || undefined,
        customerAddress: posCustomerAddress.trim() || undefined,
        notes: posCustomerNotes.trim() || undefined,
        discount: parsedDiscount,
        paymentMethod: posPaymentMethod,
        paymentReference: posPaymentMethod === 'UPI' ? posPaymentReference.trim() || undefined : undefined,
        cashReceived:
          posPaymentMethod === 'CASH' && posCashReceived.trim() ? parseFloat(posCashReceived) : undefined,
        isDraft: true,
        items: posCart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      };

      if (editingDraftBillId) {
        const res = await api.shopManagement.updatePosDraftBill(selectedShopId, editingDraftBillId, payload);
        showNotification(`Draft Bill #${res.bill.invoiceNumber} updated.`);
      } else {
        const res = await api.shopManagement.createPosBill(selectedShopId, payload);
        showNotification(`Draft Bill #${res.bill.invoiceNumber} saved.`);
      }

      handleResetPosForm();
      fetchSales();
    } catch (err: any) {
      setError(err.message || 'Failed to save draft bill');
    } finally {
      setPosSubmitting(false);
    }
  };

  // 2. Validate Walk-in POS form fields with granular errors
  const validatePosForm = (): boolean => {
    const errors: {
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string;
      cashReceived?: string;
      general?: string;
    } = {};

    if (posCart.length === 0) {
      errors.general = 'Please add at least one item to the bill.';
    }

    if (!posCustomerName.trim() || posCustomerName.trim().length < 2) {
      errors.customerName = 'Customer name is required for walk-in billing (min 2 characters).';
    }

    const cleanPhone = posCustomerPhone.trim();
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.customerPhone = 'A valid 10-digit Indian mobile number starting with 6-9 is required.';
    }

    if (!posCustomerAddress.trim() || posCustomerAddress.trim().length < 2) {
      errors.customerAddress = 'Customer place / area is required (min 2 characters).';
    }

    if (posPaymentMethod === 'CASH') {
      if (!posCashReceived.trim()) {
        errors.cashReceived = `Cash received amount is required (min ₹${posTotal.toFixed(2)}).`;
      } else {
        const received = parseFloat(posCashReceived);
        if (isNaN(received) || received < posTotal) {
          errors.cashReceived = `Cash received (₹${posCashReceived}) is less than total payable amount (₹${posTotal.toFixed(2)}).`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setPosErrors(errors);
      setError(
        errors.general ||
        errors.customerName ||
        errors.customerPhone ||
        errors.customerAddress ||
        errors.cashReceived ||
        'Please correct the highlighted errors before closing the bill.'
      );
      return false;
    }

    setPosErrors({});
    setError(null);
    return true;
  };

  // 2b. Execute Final Sale Transaction
  const executeFinalizeSale = async () => {
    if (posSubmitting || posSubmittingRef.current) return;

    if (!validatePosForm()) {
      return;
    }

    try {
      posSubmittingRef.current = true;
      setPosSubmitting(true);
      setError(null);
      setPosErrors({});

      let finalizedBill: any = null;

      if (editingDraftBillId) {
        // First update items/details on the draft, then finalize
        await api.shopManagement.updatePosDraftBill(selectedShopId, editingDraftBillId, {
          customerName: posCustomerName.trim(),
          customerPhone: posCustomerPhone.trim(),
          customerAddress: posCustomerAddress.trim(),
          notes: posCustomerNotes.trim() || undefined,
          discount: parsedDiscount,
          paymentMethod: posPaymentMethod,
          paymentReference: posPaymentMethod === 'UPI' ? posPaymentReference.trim() || undefined : undefined,
          cashReceived:
            posPaymentMethod === 'CASH' && posCashReceived.trim() ? parseFloat(posCashReceived) : undefined,
          items: posCart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        });

        const res = await api.shopManagement.finalizePosDraftBill(selectedShopId, editingDraftBillId, {
          customerName: posCustomerName.trim(),
          customerPhone: posCustomerPhone.trim(),
          customerAddress: posCustomerAddress.trim(),
          paymentMethod: posPaymentMethod,
          paymentReference: posPaymentMethod === 'UPI' ? posPaymentReference.trim() || undefined : undefined,
          paymentConfirmed: posPaymentMethod === 'UPI' ? posPaymentConfirmed : true,
          cashReceived:
            posPaymentMethod === 'CASH' && posCashReceived.trim() ? parseFloat(posCashReceived) : undefined,
        });
        finalizedBill = res.bill;
      } else {
        const res = await api.shopManagement.createPosBill(selectedShopId, {
          customerName: posCustomerName.trim(),
          customerPhone: posCustomerPhone.trim(),
          customerAddress: posCustomerAddress.trim(),
          notes: posCustomerNotes.trim() || undefined,
          discount: parsedDiscount,
          paymentMethod: posPaymentMethod,
          paymentReference: posPaymentMethod === 'UPI' ? posPaymentReference.trim() || undefined : undefined,
          paymentConfirmed: posPaymentMethod === 'UPI' ? posPaymentConfirmed : true,
          cashReceived:
            posPaymentMethod === 'CASH' && posCashReceived.trim() ? parseFloat(posCashReceived) : undefined,
          isDraft: false,
          items: posCart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        });
        finalizedBill = res.bill;
      }

      if (finalizedBill) {
        setConfirmSaleModalOpen(false);
        setCompletedBill(finalizedBill);
        handleResetPosForm();
        showNotification(`Bill #${finalizedBill.invoiceNumber} closed and completed successfully!`);
        fetchItems();
        fetchInventory();
        fetchSales();
        fetchReports();
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to complete bill sale';
      setError(msg);
      setPosErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      posSubmittingRef.current = false;
      setPosSubmitting(false);
    }
  };

  // 3. Edit Draft from Sales History or Draft List
  const handleEditDraft = (bill: any) => {
    if (bill.status !== 'DRAFT') {
      setError('Only draft bills can be loaded into POS editor.');
      return;
    }
    setEditingDraftBillId(bill.id);
    setPosCustomerName(bill.customerName || '');
    setPosCustomerPhone(bill.customerPhone || '');
    setPosCustomerAddress(bill.customerAddress || '');
    setPosCustomerNotes(bill.notes || '');
    setPosDiscount(bill.discount ? bill.discount.toString() : '0');
    setPosPaymentMethod(bill.paymentMethod || 'CASH');
    setPosPaymentReference(bill.paymentReference || '');
    setPosCashReceived(bill.cashReceived ? bill.cashReceived.toString() : '');

    // Reconstruct cart
    const reconstructedCart = bill.items.map((bi: any) => {
      const match = items.find((p) => p.id === bi.productId) || {
        id: bi.productId,
        name: bi.productName,
        price: bi.unitPrice,
        sku: bi.sku,
        stock: 999,
        unit: 'piece',
      };
      return { product: match, quantity: bi.quantity };
    });
    setPosCart(reconstructedCart);
    handleTabChange('pos');
    setPosMode('WALKIN');
    showNotification(`Draft #${bill.invoiceNumber} loaded for editing.`);
  };

  // 4. Void Finalized Bill
  const handleConfirmVoid = async () => {
    if (!voidingBill) return;
    if (!voidReason.trim()) {
      setError('A recorded reason is required to void a bill.');
      return;
    }
    try {
      setVoidSubmitting(true);
      setError(null);
      await api.shopManagement.voidPosBill(selectedShopId, voidingBill.id, voidReason.trim());
      showNotification(`Bill #${voidingBill.invoiceNumber} voided and stock restored.`);
      setVoidingBill(null);
      setVoidReason('');
      fetchSales();
      fetchInventory();
      fetchItems();
      fetchReports();
    } catch (err: any) {
      setError(err.message || 'Failed to void bill');
    } finally {
      setVoidSubmitting(false);
    }
  };

  // Register New Shop
  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    if (
      !newShopName.trim() ||
      !newShopCategoryId ||
      !newShopAddress.trim() ||
      !newShopVillage.trim() ||
      !newShopDistrict.trim()
    ) {
      setRegisterError('Please fill in all required shop details.');
      return;
    }
    if (!/^\d{6}$/.test(newShopPinCode.trim())) {
      setRegisterError('PIN Code must be exactly 6 digits.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(newShopPhone.trim())) {
      setRegisterError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setRegisterLoading(true);
      await api.shops.registerShop({
        name: newShopName.trim(),
        categoryId: newShopCategoryId,
        description: newShopDescription.trim() || undefined,
        address: newShopAddress.trim(),
        village: newShopVillage.trim(),
        district: newShopDistrict.trim(),
        state: 'Tamil Nadu',
        pinCode: newShopPinCode.trim(),
        phone: newShopPhone.trim(),
        openingHours: newShopOpeningHours,
        closingHours: newShopClosingHours,
        weeklyHoliday: newShopWeeklyHoliday || 'None',
        pickupInstructions: newShopPickupInstructions.trim() || undefined,
      });

      setRegisterSuccess('Shop submitted successfully! It is now pending administrator review.');
      await fetchMyShops();
      setTimeout(() => {
        setRegisterModalOpen(false);
        setRegisterSuccess(null);
        setNewShopName('');
        setNewShopDescription('');
        setNewShopAddress('');
      }, 1500);
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register shop. Please check details.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const countPending = orders.filter((o) => o.status === 'PENDING').length;
  const countLowStock = items.filter((i) => i.isLowStock).length;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar with Return Navigation & Shop Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => (onBack ? onBack() : navigate('/'))}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Storefront
            </button>
            <button
              onClick={() => {
                setRegisterModalOpen(true);
                fetchCategories();
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Register Another Shop
            </button>
          </div>

          {/* Shop Switcher Dropdown */}
          {managedShops.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Current Shop:</span>
              <select
                value={selectedShopId}
                onChange={(e) => handleSelectShop(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-500 cursor-pointer shadow-xs"
              >
                {managedShops.map((m) => (
                  <option key={m.shop.id} value={m.shop.id}>
                    {m.shop.name} ({m.shop.village}) — [{m.shop.verificationStatus}]
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dedicated Onboarding for 0 Shops */}
        {!shopsLoading && managedShops.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200/60 text-amber-600">
              <Store className="w-8 h-8" />
            </div>
            <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">
              Shopkeeper Portal Onboarding
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-serif mt-3">
              Welcome to Village1 Merchant Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
              You are signed in as a registered <strong>Shopkeeper</strong>. To start accepting customer pickup orders, managing items, and POS walk-in billing, register your village shop below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button
                onClick={() => {
                  setRegisterModalOpen(true);
                  fetchCategories();
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Register Your Shop Now
              </button>
              <button
                onClick={fetchMyShops}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> View Application Status
              </button>
            </div>
          </div>
        )}

        {/* Main Dashboard Layout (Sidebar + Content) */}
        {managedShops.length > 0 && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" /> Merchant Portal
                  </span>

                  {activeShopObj?.verificationStatus === 'APPROVED' && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Approved & Active
                    </span>
                  )}
                  {activeShopObj?.verificationStatus === 'PENDING' && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Admin Review
                    </span>
                  )}
                  {activeShopObj?.verificationStatus === 'REJECTED' && (
                    <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-red-400" /> Application Rejected
                    </span>
                  )}
                  {activeShopObj?.verificationStatus === 'SUSPENDED' && (
                    <span className="bg-slate-700 text-slate-300 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" /> Suspended
                    </span>
                  )}

                  {countPending > 0 && isShopApproved && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-bounce">
                      {countPending} New Order{countPending > 1 ? 's' : ''}!
                    </span>
                  )}
                  {countLowStock > 0 && isShopApproved && (
                    <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {countLowStock} Low Stock Alert
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black font-serif mt-2">
                  {activeShopObj?.name || 'Village Shop'}
                </h1>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  {activeShopObj?.address}, {activeShopObj?.village} • {activeShopObj?.district}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    fetchOrders(false);
                    fetchItems();
                    fetchInventory();
                    showNotification('Refreshed latest data');
                  }}
                  disabled={!isShopApproved}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync Data
                </button>
              </div>
            </div>

            {/* Unapproved Warning */}
            {!isShopApproved && (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Shop Status: {activeShopObj?.verificationStatus}
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      {activeShopObj?.verificationStatus === 'PENDING'
                        ? 'Your shop registration has been submitted and is currently awaiting verification by a Village1 Platform Administrator. For security and trust, items, inventory, and online ordering unlock automatically upon approval.'
                        : 'Your shop application is currently not active. Please contact the administrator for assistance.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchMyShops}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Check Approval Status
                </button>
              </div>
            )}

            {/* 9-Tab Navigation Bar / Sidebar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
              <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                {[
                  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { key: 'products', label: 'Products / Items', icon: Boxes },
                  { key: 'add-item', label: 'Add New Item', icon: Plus },
                  { key: 'inventory', label: 'Inventory / Stock', icon: Package },
                  {
                    key: 'orders',
                    label: `Orders ${countPending > 0 ? `(${countPending})` : ''}`,
                    icon: ShoppingCart,
                  },
                  { key: 'pos', label: 'Billing / POS', icon: Receipt },
                  { key: 'sales-history', label: 'Sales History', icon: History },
                  { key: 'reports', label: 'Reports', icon: BarChart3 },
                  { key: 'settings', label: 'Shop Settings', icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key as NavTab)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* TAB CONTENTS */}

            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-bold">Today's Net Sales</span>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-serif">
                      ₹{reportData?.today?.netSales ?? 0}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {reportData?.today?.billsCount ?? 0} bills completed today
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-bold">Pending Pickup Orders</span>
                      <ShoppingCart className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-serif">
                      {orders.filter((o) => o.status === 'PENDING').length}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {orders.length} total active orders
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-bold">Total Products</span>
                      <Boxes className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-serif">
                      {inventoryOverview?.metrics?.totalProducts ?? items.length}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {inventoryOverview?.metrics?.totalStockUnits ?? 0} total units in stock
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-bold">Low-Stock Warnings</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-serif">
                      {inventoryOverview?.metrics?.lowStockItemsCount ?? countLowStock}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Items at or below threshold</p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleTabChange('pos')}
                    className="p-5 bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-amber-300" /> New Walk-in Bill
                      </h3>
                      <p className="text-xs text-brand-100 mt-1">Quick POS cashier checkout</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      setItemForm({
                        name: '',
                        category: '',
                        description: '',
                        sku: '',
                        price: '',
                        mrp: '',
                        stock: '10',
                        unit: 'piece',
                        imageUrl: '',
                        isAvailable: true,
                        lowStockThreshold: '5',
                      });
                      setEditingItem(null);
                      handleTabChange('add-item');
                    }}
                    className="p-5 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-amber-200" /> Add Product
                      </h3>
                      <p className="text-xs text-amber-100 mt-1">Add new item to village catalog</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleTabChange('inventory')}
                    className="p-5 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl text-left shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-200" /> Inventory Movements
                      </h3>
                      <p className="text-xs text-purple-100 mt-1">Audit stock additions and reductions</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. PRODUCTS / ITEMS TAB */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 font-serif">Products & Items</h2>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {activeShopObj?.name} ({activeCategoryName})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Manage shopkeeper catalog, pricing, availability, and low-stock limits for <strong>{activeShopObj?.name}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setItemForm({
                        name: '',
                        category: '',
                        description: '',
                        sku: '',
                        price: '',
                        mrp: '',
                        stock: '10',
                        unit: 'piece',
                        imageUrl: '',
                        isAvailable: true,
                        lowStockThreshold: '5',
                      });
                      setEditingItem(null);
                      handleTabChange('add-item');
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Add New Item
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search items by name, SKU..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 font-medium"
                    />
                  </div>
                  <div>
                    <select
                      value={itemAvailabilityFilter}
                      onChange={(e) => setItemAvailabilityFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 font-medium cursor-pointer"
                    >
                      <option value="ALL">All Availability</option>
                      <option value="AVAILABLE">Active & In Stock</option>
                      <option value="UNAVAILABLE">Unavailable / Hidden</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchItems}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Filter className="w-3.5 h-3.5" /> Apply Filter
                  </button>
                </div>

                {/* Table */}
                {itemsLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No items found matching filter criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-3">Item / SKU</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Selling Price</th>
                          <th className="py-3 px-3">Current Stock</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {items.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{prod.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {prod.sku || 'SKU: Auto'}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-600">{prod.category || 'General'}</td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900">₹{prod.price}</span>
                              {prod.mrp && (
                                <span className="text-[10px] text-slate-400 line-through ml-1.5">
                                  ₹{prod.mrp}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`font-bold ${
                                  prod.isLowStock ? 'text-amber-600' : 'text-slate-800'
                                }`}
                              >
                                {prod.stock} {prod.unit}
                              </span>
                              {prod.isLowStock && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                                  Low Stock
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {prod.isAvailable ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                  Available
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                                  Hidden
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setAdjustModalItem(prod);
                                  setAdjustDelta('');
                                  setAdjustReason('');
                                }}
                                className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Adjust Stock
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItem(prod);
                                  setItemForm({
                                    name: prod.name,
                                    category: prod.category || '',
                                    description: prod.description || '',
                                    sku: prod.sku || '',
                                    price: prod.price.toString(),
                                    mrp: prod.mrp ? prod.mrp.toString() : '',
                                    stock: prod.stock.toString(),
                                    unit: prod.unit || 'piece',
                                    imageUrl: prod.imageUrl || '',
                                    isAvailable: prod.isAvailable,
                                    lowStockThreshold: (prod.lowStockThreshold ?? 5).toString(),
                                  });
                                  handleTabChange('add-item');
                                }}
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. ADD / EDIT ITEM TAB */}
            {activeTab === 'add-item' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-serif">
                    {editingItem ? 'Edit Product Details' : 'Add New Item to Shop'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Item details will be saved directly to the database for this shop.
                  </p>
                </div>

                {/* Active Shop Context Banner */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSalonShop
                    ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSalonShop ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isSalonShop ? <Scissors className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">Adding product to:</span>
                        <strong className="text-xs font-black">{activeShopObj?.name || 'Selected Shop'}</strong>
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Category: <strong>{activeCategoryName}</strong> • Village: {activeShopObj?.village || 'Local'}
                      </p>
                    </div>
                  </div>
                  {isSalonShop && (
                    <span className="text-[10px] font-bold bg-purple-200/80 text-purple-800 px-2.5 py-1 rounded-full shrink-0">
                      ✂️ Salon / Service Store
                    </span>
                  )}
                </div>

                {/* Salon Service Prioritization Advisory */}
                {isSalonShop && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Salon Services & Live Queue Available</p>
                      <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                        For appointments and haircut/styling queue tokens, customer bookings are handled via Services. You can also sell salon retail products (hair gels, beard oils, styling waxes, shampoos) here.
                      </p>
                    </div>
                  </div>
                )}

                {/* Category-Mismatch Warning for Salon Retail (e.g. Rice, Dal, Provisions in a Salon) */}
                {isSalonShop && (() => {
                  const groceryKeywords = ['rice', 'dal', 'oil', 'wheat', 'atta', 'flour', 'sugar', 'salt', 'provisions', 'grocery', 'pulse', 'grain', 'soap', 'masala', 'chilli'];
                  const lowerName = itemForm.name.toLowerCase();
                  const lowerCat = itemForm.category.toLowerCase();
                  const isGroceryDetected = groceryKeywords.some((k) => lowerName.includes(k) || lowerCat.includes(k));
                  if (!isGroceryDetected) return null;
                  return (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Category Mismatch Notice</p>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          You are currently adding "<strong>{itemForm.name}</strong>" under <strong>{activeShopObj?.name}</strong> ({activeCategoryName}). If this is a grocery item intended for a provision or grocery store, please switch to that shop in the top dropdown before saving.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isSalonShop ? 'e.g. Herbal Beard Oil (50ml), Styling Gel' : 'e.g. Ponni Boiled Rice (25kg)'}
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        placeholder={isSalonShop ? 'e.g. Grooming, Hair Care' : 'e.g. Grains, Dairy, Snacks'}
                        value={itemForm.category}
                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SKU / Code</label>
                      <input
                        type="text"
                        placeholder={isSalonShop ? 'e.g. GEL-100' : 'e.g. RICE-25'}
                        value={itemForm.sku}
                        onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Selling Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0.01"
                        placeholder="1450.00"
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Optional MRP (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1600.00"
                        value={itemForm.mrp}
                        onChange={(e) => setItemForm({ ...itemForm, mrp: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Initial Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="10"
                        value={itemForm.stock}
                        onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Unit of Measurement</label>
                      <input
                        type="text"
                        placeholder="piece, kg, bag, litre"
                        value={itemForm.unit}
                        onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Low-Stock Alert Level</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="5"
                        value={itemForm.lowStockThreshold}
                        onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                    <textarea
                      rows={2}
                      placeholder="Brief details about quality, packaging, or brand."
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Product Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={itemForm.imageUrl}
                      onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={itemForm.isAvailable}
                      onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <label htmlFor="isAvailable" className="font-bold text-slate-700 cursor-pointer">
                      Available for customer sale (uncheck to hide from village customers)
                    </label>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        handleTabChange('products');
                      }}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={itemSubmitting}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {itemSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : editingItem ? (
                        'Save Changes'
                      ) : (
                        'Add Item to Inventory'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 4. INVENTORY / STOCK TAB */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Inventory Valuation Header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-500">Total Stock Value</span>
                    <div className="text-2xl font-black text-slate-900 font-serif mt-1">
                      ₹{inventoryOverview?.metrics?.totalInventoryValue ?? 0}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Based on current selling prices</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-500">Total Inventory Items</span>
                    <div className="text-2xl font-black text-slate-900 font-serif mt-1">
                      {inventoryOverview?.metrics?.totalProducts ?? 0}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Active items tracked in stock</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-bold text-slate-500">Low-Stock Warnings</span>
                    <div className="text-2xl font-black text-amber-600 font-serif mt-1">
                      {inventoryOverview?.metrics?.lowStockItemsCount ?? 0}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Require urgent supplier restock</p>
                  </div>
                </div>

                {/* Stock Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 font-serif">Stock List</h3>
                      <p className="text-xs text-slate-500">
                        Configured low-stock alert thresholds and current valuation.
                      </p>
                    </div>
                    <button
                      onClick={fetchInventory}
                      className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {inventoryLoading ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-3">Item / SKU</th>
                            <th className="py-3 px-3">Current Stock</th>
                            <th className="py-3 px-3">Selling Price</th>
                            <th className="py-3 px-3">Stock Value</th>
                            <th className="py-3 px-3">Low-Stock Limit</th>
                            <th className="py-3 px-3">Last Updated</th>
                            <th className="py-3 px-3 text-right">Stock Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {inventoryOverview?.items?.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900">{item.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`font-bold ${
                                    item.isLowStock ? 'text-amber-600' : 'text-slate-800'
                                  }`}
                                >
                                  {item.stock} {item.unit}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-700">₹{item.price}</td>
                              <td className="py-3 px-3 font-bold text-slate-900">₹{item.stockValue}</td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px]">
                                  ≤ {item.lowStockThreshold} {item.unit}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-400 text-[11px]">
                                {new Date(item.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setAdjustModalItem(item);
                                    setAdjustDelta('');
                                    setAdjustReason('');
                                  }}
                                  className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Adjust Stock
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Inventory Movement History Log */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-serif">
                      Inventory Movement History
                    </h3>
                    <p className="text-xs text-slate-500">
                      Audit trail of additions, POS walk-ins, online pickups, and manual adjustments.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Date & Time</th>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Delta</th>
                          <th className="py-2.5 px-3">Stock Before → After</th>
                          <th className="py-2.5 px-3">Recorded Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {inventoryLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400">
                              No inventory movements recorded yet.
                            </td>
                          </tr>
                        ) : (
                          inventoryLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                                {new Date(log.createdAt).toLocaleString([], {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                {log.product?.name || 'Item'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {log.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`font-black ${
                                    log.quantityDelta > 0 ? 'text-emerald-600' : 'text-red-600'
                                  }`}
                                >
                                  {log.quantityDelta > 0 ? `+${log.quantityDelta}` : log.quantityDelta}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                {log.previousStock} → {log.newStock}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{log.reason || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ORDERS TAB (Preserved Pickup & Ready Verification Workflow) */}
            {activeTab === 'orders' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Status Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {[
                    { key: 'ALL', label: 'All Orders' },
                    { key: 'PENDING', label: 'New / Pending' },
                    { key: 'ACCEPTED', label: 'Accepted' },
                    { key: 'PREPARING', label: 'Packing' },
                    { key: 'READY_FOR_PICKUP', label: 'Ready for Collection' },
                    { key: 'COLLECTED', label: 'Completed' },
                    { key: 'REJECTED', label: 'Declined' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                        statusFilter === tab.key
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {ordersLoading && (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                  </div>
                )}

                {!ordersLoading && orders.length === 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-6 shadow-xs">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">No Orders</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      No customer pickup orders match status: {statusFilter}.
                    </p>
                  </div>
                )}

                {!ordersLoading && orders.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((ord) => {
                      const isPending = ord.status === 'PENDING';
                      const isAccepted = ord.status === 'ACCEPTED';
                      const isPreparing = ord.status === 'PREPARING';
                      const isReady = ord.status === 'READY_FOR_PICKUP';
                      const isCollected = ord.status === 'COLLECTED' || ord.status === 'COMPLETED';
                      const isRejected = ord.status === 'REJECTED';
                      const isBusy = actionLoading === ord.id;

                      return (
                        <div
                          key={ord.id}
                          className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                            isPending
                              ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                              : isReady
                              ? 'border-emerald-400 shadow-md'
                              : 'border-slate-200/80'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                              <div>
                                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                  {ord.orderNumber}
                                </span>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {new Date(ord.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  • {new Date(ord.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-base font-black text-slate-900">
                                  ₹{ord.totalAmount}
                                </span>
                                <p className="text-[10px] font-semibold text-brand-700">
                                  {ord.paymentMethod === 'CASH_ON_PICKUP' ? 'Cash at Shop' : 'UPI QR'}
                                </p>
                              </div>
                            </div>

                            <div className="py-3 border-b border-slate-100 text-xs">
                              <p className="font-bold text-slate-800">
                                {ord.customer?.customerProfile?.fullName || 'Village Customer'}
                              </p>
                              {ord.customer?.phone && (
                                <p className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <Phone className="w-3.5 h-3.5 text-brand-600" />
                                  <span>{ord.customer.phone}</span>
                                </p>
                              )}
                              {ord.notes && (
                                <div className="mt-2 p-2 bg-amber-50 rounded-xl text-[11px] text-amber-900">
                                  <strong>Customer Note:</strong> {ord.notes}
                                </div>
                              )}
                            </div>

                            <div className="py-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Items ({ord.items?.length})
                                </p>
                                {(isAccepted || isPreparing) && (
                                  <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                                    {ord.items?.filter((i: any) => i.isPacked).length}/{ord.items?.length} packed
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {ord.items?.map((item: any) => (
                                  <div key={item.id} className="flex justify-between items-center text-xs py-1 px-2 rounded-lg bg-slate-50/80">
                                    <div className="flex items-center gap-2">
                                      {item.isPacked ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                                      )}
                                      <span className={item.isPacked ? 'text-slate-500 line-through' : 'text-slate-800 font-medium'}>
                                        {item.productName} — {item.quantity} {item.product?.unit || 'quantity'}
                                      </span>
                                    </div>
                                    <span className="font-semibold text-slate-900 shrink-0 ml-2">₹{item.totalPrice}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100">
                            {isPending && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleUpdateStatus(ord.id, 'ACCEPTED')}
                                  disabled={isBusy}
                                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs disabled:opacity-60"
                                >
                                  {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Accept'}
                                </button>
                                <button
                                  onClick={() => setRejectingOrderId(ord.id)}
                                  disabled={isBusy}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
                                >
                                  Decline
                                </button>
                              </div>
                            )}

                            {(isAccepted || isPreparing) && (
                              <button
                                onClick={() => handleOpenPacking(ord)}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60"
                              >
                                <Package className="w-4 h-4" />
                                {isAccepted
                                  ? 'Start Packing Items'
                                  : `Packing Items (${ord.items?.filter((i: any) => i.isPacked).length}/${ord.items?.length})`}
                              </button>
                            )}

                            {isReady && (
                              <button
                                onClick={() => {
                                  setVerifyingOrderId(ord.id);
                                  setPickupCodeInput('');
                                  setVerificationError(null);
                                }}
                                disabled={isBusy}
                                className="w-full bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <KeyRound className="w-4 h-4 text-emerald-400" />
                                Verify 6-Digit Pickup Code
                              </button>
                            )}

                            {isCollected && (
                              <div className="bg-emerald-50 text-emerald-800 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Handed Over & Paid
                              </div>
                            )}

                            {isRejected && (
                              <div className="bg-red-50 text-red-800 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5">
                                <XCircle className="w-4 h-4 text-red-600" /> Order Declined
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 6. BILLING / POINT OF SALE (POS) TAB */}
            {activeTab === 'pos' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Mode Selector: Walk-in vs Online Order & Prominent New Walk-in Bill Button */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleResetPosForm();
                        setPosMode('WALKIN');
                        setSelectedOnlineOrderForBilling(null);
                        showNotification('New clean Walk-in Customer Bill initialized.');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-emerald-600/30 active:scale-95"
                    >
                      <PlusCircle className="w-4 h-4" />
                      + New Walk-in Bill
                    </button>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mode:</span>
                      <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setPosMode('WALKIN');
                            setSelectedOnlineOrderForBilling(null);
                          }}
                          className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                            posMode === 'WALKIN'
                              ? 'bg-brand-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Walk-in POS
                        </button>
                        <button
                          type="button"
                          onClick={() => setPosMode('ONLINE_ORDER')}
                          className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                            posMode === 'ONLINE_ORDER'
                              ? 'bg-brand-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Online Orders
                        </button>
                      </div>
                    </div>
                  </div>

                  {editingDraftBillId && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl font-bold border border-amber-200">
                        Editing Draft Bill
                      </span>
                      <button
                        type="button"
                        onClick={handleResetPosForm}
                        className="text-slate-500 hover:text-red-600 font-bold underline cursor-pointer"
                      >
                        Cancel Editing
                      </button>
                    </div>
                  )}
                </div>

                {/* MODE 1: ONLINE ORDER BILLING */}
                {posMode === 'ONLINE_ORDER' && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                    <div>
                      <h2 className="text-base font-black text-slate-900 font-serif">
                        Online Customer Orders Billing
                      </h2>
                      <p className="text-xs text-slate-500">
                        View customer order details, verify pickup code, process payment, and print customer tax receipts.
                      </p>
                    </div>

                    {orders.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No online customer orders found for this shop.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                              selectedOnlineOrderForBilling?.id === ord.id
                                ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                  {ord.orderNumber}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    ord.status === 'COLLECTED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ord.status === 'READY_FOR_PICKUP'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                              </div>

                              <div className="text-xs text-slate-700">
                                <strong>Customer:</strong> {ord.customer?.customerProfile?.fullName || 'Online Customer'}
                                {ord.customer?.phone && (
                                  <div className="text-slate-500 text-[11px]">{ord.customer.phone}</div>
                                )}
                              </div>

                              <div className="text-xs text-slate-500 space-y-1 py-1 border-t border-slate-100">
                                {ord.items?.slice(0, 3).map((item: any) => (
                                  <div key={item.id} className="flex justify-between text-[11px]">
                                    <span>{item.quantity}× {item.productName}</span>
                                    <span>₹{item.totalPrice}</span>
                                  </div>
                                ))}
                                {ord.items?.length > 3 && (
                                  <div className="text-[10px] text-slate-400">
                                    +{ord.items.length - 3} more items
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                              <div className="text-xs">
                                <span className="text-slate-400 block text-[10px]">Total Amount</span>
                                <span className="font-black text-slate-900 text-sm">₹{ord.totalAmount}</span>
                              </div>
                              <div className="flex gap-1.5">
                                {ord.status === 'READY_FOR_PICKUP' && (
                                  <button
                                    onClick={() => {
                                      setVerifyingOrderId(ord.id);
                                      setPickupCodeInput('');
                                      setVerificationError(null);
                                    }}
                                    className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                                  >
                                    Verify Code
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    // Generate a printable receipt modal for online order
                                    setViewingBillModal({
                                      id: ord.id,
                                      invoiceNumber: ord.orderNumber,
                                      customerName: ord.customer?.customerProfile?.fullName || 'Online Customer',
                                      customerPhone: ord.customer?.phone,
                                      customerAddress: ord.customer?.customerProfile
                                        ? `${ord.customer.customerProfile.village}, ${ord.customer.customerProfile.district}`
                                        : undefined,
                                      subtotal: ord.subtotalAmount || ord.totalAmount,
                                      discount: 0,
                                      totalAmount: ord.totalAmount,
                                      paymentMethod: ord.paymentMethod === 'CASH_ON_PICKUP' ? 'CASH' : ord.paymentMethod,
                                      paymentStatus: ord.paymentStatus,
                                      createdAt: ord.createdAt,
                                      items: ord.items?.map((i: any) => ({
                                        id: i.id,
                                        productName: i.productName,
                                        quantity: i.quantity,
                                        totalPrice: i.totalPrice,
                                        unitPrice: i.unitPrice,
                                      })),
                                      shop: ord.shop || activeShopObj,
                                    });
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Receipt
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: WALK-IN CUSTOMER BILLING */}
                {posMode === 'WALKIN' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Product Selector */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-black text-slate-900 font-serif">
                            Walk-in Customer Product Catalog
                          </h2>
                          <p className="text-xs text-slate-500">
                            Search inventory and click items to add directly to invoice. Stock is validated before closing bill.
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Search product name or SKU..."
                          value={posSearch}
                          onChange={(e) => setPosSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 font-medium"
                        />
                      </div>

                      {/* Product Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                        {items
                          .filter(
                            (p) =>
                              !p.isArchived &&
                              (p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                                (p.sku && p.sku.toLowerCase().includes(posSearch.toLowerCase())))
                          )
                          .map((prod) => {
                            const inCart = posCart.find((c) => c.product.id === prod.id)?.quantity || 0;
                            const available = prod.stock - inCart;

                            return (
                              <div
                                key={prod.id}
                                onClick={() => available > 0 && handlePosAddToCart(prod)}
                                className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                                  available <= 0
                                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                    : 'bg-white border-slate-200 hover:border-brand-500 hover:shadow-xs'
                                }`}
                              >
                                <div>
                                  <div className="font-bold text-xs text-slate-900 truncate">
                                    {prod.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {prod.sku || 'SKU'}
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="font-black text-slate-900 text-xs">₹{prod.price}</span>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      available <= 0
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {available} {prod.unit}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Right: Cart & Walk-in Bill Summary */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-brand-600" />
                            {editingDraftBillId ? 'Editing Draft Bill' : 'New Walk-in Bill'}
                          </h3>
                          {posCart.length > 0 && (
                            <button
                              onClick={handleResetPosForm}
                              className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        {/* Customer Information Section */}
                        <div className="space-y-2 text-xs">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Customer Information</span>
                            <span className="text-[10px] text-slate-400 font-normal">* Required for finalizing</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <input
                                type="text"
                                placeholder="Customer Name *"
                                value={posCustomerName}
                                onChange={(e) => {
                                  setPosCustomerName(e.target.value);
                                  if (posErrors.customerName) setPosErrors((prev) => ({ ...prev, customerName: undefined }));
                                }}
                                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-medium transition-colors ${
                                  posErrors.customerName
                                    ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                                    : 'border-slate-200 focus:border-brand-500'
                                }`}
                              />
                              {posErrors.customerName && (
                                <p className="mt-1 text-[10px] text-red-600 font-medium">{posErrors.customerName}</p>
                              )}
                            </div>
                            <div>
                              <input
                                type="tel"
                                maxLength={10}
                                placeholder="Mobile (10 digits) *"
                                value={posCustomerPhone}
                                onChange={(e) => {
                                  setPosCustomerPhone(e.target.value.replace(/\D/g, ''));
                                  if (posErrors.customerPhone) setPosErrors((prev) => ({ ...prev, customerPhone: undefined }));
                                }}
                                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-medium transition-colors ${
                                  posErrors.customerPhone
                                    ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                                    : 'border-slate-200 focus:border-brand-500'
                                }`}
                              />
                              {posErrors.customerPhone && (
                                <p className="mt-1 text-[10px] text-red-600 font-medium">{posErrors.customerPhone}</p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <input
                                type="text"
                                placeholder="Place / Area *"
                                value={posCustomerAddress}
                                onChange={(e) => {
                                  setPosCustomerAddress(e.target.value);
                                  if (posErrors.customerAddress) setPosErrors((prev) => ({ ...prev, customerAddress: undefined }));
                                }}
                                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none transition-colors ${
                                  posErrors.customerAddress
                                    ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                                    : 'border-slate-200 focus:border-brand-500'
                                }`}
                              />
                              {posErrors.customerAddress && (
                                <p className="mt-1 text-[10px] text-red-600 font-medium">{posErrors.customerAddress}</p>
                              )}
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Notes (optional)"
                                value={posCustomerNotes}
                                onChange={(e) => setPosCustomerNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {posCart.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs">
                              No items added yet. Click on catalog products to add.
                            </div>
                          ) : (
                            posCart.map((item) => (
                              <div
                                key={item.product.id}
                                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
                              >
                                <div className="flex-1 pr-2">
                                  <div className="font-bold text-slate-800 truncate">
                                    {item.product.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    ₹{item.product.price} × {item.quantity} = ₹
                                    {Math.round(item.product.price * item.quantity * 100) / 100}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() =>
                                      handlePosUpdateQty(
                                        item.product.id,
                                        item.quantity - 1,
                                        item.product.stock
                                      )
                                    }
                                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                                  <button
                                    onClick={() =>
                                      handlePosUpdateQty(
                                        item.product.id,
                                        item.quantity + 1,
                                        item.product.stock
                                      )
                                    }
                                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={() =>
                                      setPosCart((prev) =>
                                        prev.filter((i) => i.product.id !== item.product.id)
                                      )
                                    }
                                    className="ml-1 text-slate-400 hover:text-red-600 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Discount & Totals */}
                        {posCart.length > 0 && (
                          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                            <div className="flex justify-between text-slate-600">
                              <span>Subtotal</span>
                              <span className="font-bold">₹{posSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                              <span>Bill Discount (₹)</span>
                              <input
                                type="number"
                                min="0"
                                max={posSubtotal}
                                value={posDiscount}
                                onChange={(e) => setPosDiscount(e.target.value)}
                                className="w-24 text-right px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"
                              />
                            </div>
                            <div className="flex justify-between text-slate-900 font-black text-base pt-2 border-t border-slate-200">
                              <span>Payable Total</span>
                              <span className="text-emerald-700">₹{posTotal.toFixed(2)}</span>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="pt-2 space-y-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Payment Method
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPosPaymentMethod('CASH')}
                                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                    posPaymentMethod === 'CASH'
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  Cash
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPosPaymentMethod('UPI')}
                                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                    posPaymentMethod === 'UPI'
                                      ? 'bg-purple-700 text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  GPay / UPI QR
                                </button>
                              </div>

                              {/* Cash Amount Received & Change Calculator */}
                              {posPaymentMethod === 'CASH' && (
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-600">Cash Received (₹):</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPosCashReceived(posTotal.toFixed(2));
                                          if (posErrors.cashReceived) setPosErrors((prev) => ({ ...prev, cashReceived: undefined }));
                                        }}
                                        className="text-[10px] text-brand-600 hover:text-brand-700 underline font-bold cursor-pointer"
                                      >
                                        Exact (₹{posTotal.toFixed(2)})
                                      </button>
                                    </div>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder={`e.g. ${posTotal.toFixed(2)}`}
                                      value={posCashReceived}
                                      onChange={(e) => {
                                        setPosCashReceived(e.target.value);
                                        if (posErrors.cashReceived) setPosErrors((prev) => ({ ...prev, cashReceived: undefined }));
                                      }}
                                      className={`w-28 text-right px-2 py-1 bg-white border rounded-lg outline-none font-bold ${
                                        posErrors.cashReceived
                                          ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                                          : 'border-slate-200 focus:border-brand-500'
                                      }`}
                                    />
                                  </div>
                                  {posErrors.cashReceived && (
                                    <p className="text-[10px] text-red-600 font-medium text-right">{posErrors.cashReceived}</p>
                                  )}
                                  {posCashReceived && !isNaN(parseFloat(posCashReceived)) && parseFloat(posCashReceived) >= posTotal && (
                                    <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                                      <span>Change to Return:</span>
                                      <span>₹{(parseFloat(posCashReceived) - posTotal).toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* UPI Reference & Truthful Pending Verification Status */}
                              {posPaymentMethod === 'UPI' && (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="UPI / Transaction Ref ID (optional)"
                                    value={posPaymentReference}
                                    onChange={(e) => setPosPaymentReference(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 font-mono"
                                  />
                                  
                                  <label className="flex items-start gap-2 p-2.5 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer text-[11px] text-purple-900">
                                    <input
                                      type="checkbox"
                                      checked={posPaymentConfirmed}
                                      onChange={(e) => setPosPaymentConfirmed(e.target.checked)}
                                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>
                                      <strong>Payment Received in Bank:</strong> I confirm money has been credited to shop's bank account / QR terminal.
                                    </span>
                                  </label>

                                  {!posPaymentConfirmed && (
                                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                                      <strong>Status:</strong> Payment will be marked <em>PENDING_VERIFICATION</em> until verified.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* POS Error Alert */}
                      {posErrors.general && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{posErrors.general}</span>
                        </div>
                      )}

                      {/* Action Buttons: Save Draft, Close Bill */}
                      <div className="pt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleSaveDraftPosBill}
                          disabled={posSubmitting || posCart.length === 0}
                          className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4 text-slate-600" />
                          Save Draft
                        </button>

                        <button
                          type="button"
                          onClick={executeFinalizeSale}
                          disabled={posSubmitting || posCart.length === 0}
                          className="py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-brand-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                          {posSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Receipt className="w-4 h-4" />
                          )}
                          {editingDraftBillId ? 'Finalize & Close Bill' : 'Close Bill / Complete Sale'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. SALES HISTORY TAB */}
            {activeTab === 'sales-history' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 font-serif">Sales History & Invoices</h2>
                    <p className="text-xs text-slate-500">
                      Unified sales from both Walk-in POS Bills and Online Customer Orders without double counting.
                    </p>
                  </div>
                  <button
                    onClick={fetchSales}
                    className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer self-start sm:self-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters: Source, Payment, Date & Search */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Source / Mode</label>
                    <select
                      value={salesSourceFilter}
                      onChange={(e) => setSalesSourceFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="ALL">All Sources</option>
                      <option value="POS_WALKIN">Walk-in POS</option>
                      <option value="ONLINE_ORDER">Online Order</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Payment Method</label>
                    <select
                      value={salesPaymentMethodFilter}
                      onChange={(e) => setSalesPaymentMethodFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="ALL">All Methods</option>
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / GPay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Start Date</label>
                    <input
                      type="date"
                      value={salesStartDate}
                      onChange={(e) => setSalesStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                    </input>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">End Date</label>
                    <input
                      type="date"
                      value={salesEndDate}
                      onChange={(e) => setSalesEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                    </input>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Invoice #, customer, phone..."
                      value={salesSearch}
                      onChange={(e) => setSalesSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={fetchSales}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Filter Records
                    </button>
                  </div>
                </div>

                {salesLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                  </div>
                ) : salesBills.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No sales invoices or orders found matching the filter criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-3">Type</th>
                          <th className="py-3 px-3">Invoice / Order #</th>
                          <th className="py-3 px-3">Date & Time</th>
                          <th className="py-3 px-3">Customer & Location</th>
                          <th className="py-3 px-3">Subtotal</th>
                          <th className="py-3 px-3">Discount</th>
                          <th className="py-3 px-3">Total</th>
                          <th className="py-3 px-3">Payment</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {salesBills.map((sale) => {
                          const isWalkin = sale.source === 'POS_WALKIN';
                          const isDraft = sale.status === 'DRAFT';
                          const isVoided = sale.status === 'VOIDED';

                          return (
                            <tr key={sale.id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isWalkin
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {isWalkin ? 'Walk-in POS' : 'Online Order'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">
                                {sale.invoiceNumber}
                              </td>
                              <td className="py-3 px-3 text-slate-500 text-[11px]">
                                {new Date(sale.createdAt).toLocaleString([], {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </td>
                              <td className="py-3 px-3 text-slate-700">
                                {sale.customerName || 'Walk-in Customer'}
                                {sale.customerPhone && (
                                  <div className="text-[10px] text-slate-400">{sale.customerPhone}</div>
                                )}
                                {sale.customerAddress && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                    {sale.customerAddress}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-500">₹{sale.subtotal.toFixed(2)}</td>
                              <td className="py-3 px-3 text-amber-600">
                                {sale.discount > 0 ? `₹${sale.discount.toFixed(2)}` : '—'}
                              </td>
                              <td className="py-3 px-3 font-black text-slate-900">
                                ₹{sale.totalAmount.toFixed(2)}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    sale.paymentMethod === 'UPI'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {sale.paymentMethod}
                                </span>
                                {sale.paymentReference && (
                                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                                    Ref: {sale.paymentReference}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isVoided
                                      ? 'bg-red-100 text-red-800'
                                      : isDraft
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {sale.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isDraft && isWalkin && (
                                    <button
                                      onClick={() => handleEditDraft(sale)}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg cursor-pointer"
                                      title="Edit Draft"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {!isDraft && !isVoided && isWalkin && (
                                    <button
                                      onClick={() => {
                                        setVoidingBill(sale);
                                        setVoidReason('');
                                      }}
                                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg cursor-pointer"
                                      title="Void and Restore Stock"
                                    >
                                      Void
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setViewingBillModal(sale)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                                    title="View / Print Receipt"
                                  >
                                    <Printer className="w-3.5 h-3.5" /> Receipt
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 8. REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Date Range Selector */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div>
                    <h2 className="text-base font-black text-slate-900 font-serif">
                      Sales & Inventory Analytics
                    </h2>
                    <p className="text-slate-500">
                      Truthful gross sales, discounts, net sales, and best-selling items breakdown.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                    <button
                      onClick={fetchReports}
                      className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {reportsLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                  </div>
                ) : (
                  <>
                    {/* Sales Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <span className="text-xs font-bold text-slate-500">Gross Sales (Period)</span>
                        <div className="text-2xl font-black text-slate-900 font-serif mt-1">
                          ₹{reportData?.selectedRange?.grossSales ?? 0}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {reportData?.selectedRange?.billsCount ?? 0} invoices in selected range
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <span className="text-xs font-bold text-slate-500">Total Discounts Granted</span>
                        <div className="text-2xl font-black text-amber-600 font-serif mt-1">
                          ₹{reportData?.selectedRange?.totalDiscounts ?? 0}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Shopkeeper customer markdowns</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <span className="text-xs font-bold text-slate-500">Net Sales (Actual Revenue)</span>
                        <div className="text-2xl font-black text-emerald-600 font-serif mt-1">
                          ₹{reportData?.selectedRange?.netSales ?? 0}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Gross sales minus discounts</p>
                      </div>
                    </div>

                    {/* Best Selling Items & Low Stock Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Best Sellers */}
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                        <h3 className="font-black text-slate-900 font-serif text-sm">
                          Best-Selling Items (By Quantity Sold)
                        </h3>
                        {reportData?.bestSellers?.length === 0 ? (
                          <p className="text-xs text-slate-400 py-4">No sales in this range.</p>
                        ) : (
                          <div className="divide-y divide-slate-100 text-xs">
                            {reportData?.bestSellers?.map((item: any, idx: number) => (
                              <div key={idx} className="py-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-slate-800">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-black text-slate-900">{item.quantity} sold</span>
                                  <span className="text-slate-400 text-[11px] ml-2">₹{item.revenue}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Low Stock Items Requiring Attention */}
                      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                        <h3 className="font-black text-slate-900 font-serif text-sm flex items-center gap-2 text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Low-Stock Alert List ({reportData?.lowStock?.count ?? 0})
                        </h3>
                        {reportData?.lowStock?.items?.length === 0 ? (
                          <p className="text-xs text-emerald-600 py-4 font-semibold">
                            All items are currently above their configured alert thresholds.
                          </p>
                        ) : (
                          <div className="divide-y divide-slate-100 text-xs max-h-72 overflow-y-auto pr-1">
                            {reportData?.lowStock?.items?.map((item: any) => (
                              <div key={item.id} className="py-2 flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-slate-800">{item.name}</div>
                                  <div className="text-[10px] text-slate-400">
                                    Alert threshold: {item.lowStockThreshold} {item.unit}
                                  </div>
                                </div>
                                <span className="font-black text-amber-600 px-2 py-0.5 bg-amber-50 rounded">
                                  {item.stock} {item.unit} remaining
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 9. SHOP SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-serif">Shop Settings & Details</h2>
                  <p className="text-xs text-slate-500">
                    Review shop location, operating schedule, and approval status.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shop Name:</span>
                      <span className="font-bold text-slate-900">{activeShopObj?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category:</span>
                      <span className="font-bold text-slate-900">
                        {activeShopObj?.category?.name || 'Local Store'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address:</span>
                      <span className="font-bold text-slate-900">{activeShopObj?.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Village:</span>
                      <span className="font-bold text-slate-900">{activeShopObj?.village}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">District:</span>
                      <span className="font-bold text-slate-900">{activeShopObj?.district}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PIN Code:</span>
                      <span className="font-bold text-slate-900">{activeShopObj?.pinCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact Phone:</span>
                      <span className="font-bold text-slate-900">{activeShopObj?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Operating Hours:</span>
                      <span className="font-bold text-slate-900">
                        {activeShopObj?.openingHours} - {activeShopObj?.closingHours}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Weekly Holiday:</span>
                      <span className="font-bold text-slate-900">
                        {activeShopObj?.weeklyHoliday || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verification Status:</span>
                      <span className="font-black text-amber-700">
                        {activeShopObj?.verificationStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Stock Adjustment with Mandatory Reason */}
        {adjustModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-serif">Adjust Item Stock</h3>
                <button
                  onClick={() => setAdjustModalItem(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                <div>
                  Item: <strong>{adjustModalItem.name}</strong>
                </div>
                <div>
                  Current Stock: <strong>{adjustModalItem.stock}</strong> {adjustModalItem.unit}
                </div>
              </div>

              <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quantity Delta (+ to restock, - to reduce)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. +20 or -2"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recorded Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supplier delivery, Spoilage, Customer Return"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustModalItem(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustSubmitting}
                    className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {adjustSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Printable Bill Receipt (Completed or from History) */}
        {(completedBill || viewingBillModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            {(() => {
              const bill = completedBill || viewingBillModal;

              const handlePrintReceipt = () => {
                const printWindow = window.open('', '_blank', 'width=600,height=700');
                if (!printWindow) {
                  window.print();
                  return;
                }
                const shopName = bill.shop?.name || activeShopObj?.name || 'Village1 Merchant';
                const shopAddress = `${bill.shop?.address || activeShopObj?.address || ''}, ${bill.shop?.village || activeShopObj?.village || ''}`;
                const shopPhone = bill.shop?.phone || activeShopObj?.phone || '';

                const itemsHtml = (bill.items || [])
                  .map(
                    (i: any) => `
                    <tr>
                      <td style="padding: 4px 0; border-bottom: 1px dashed #e2e8f0;">${i.quantity}× ${i.productName}</td>
                      <td style="padding: 4px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; font-family: monospace;">₹${Number(i.totalPrice).toFixed(2)}</td>
                    </tr>`
                  )
                  .join('');

                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Receipt - ${bill.invoiceNumber}</title>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: 12px; line-height: 1.4; color: #1e293b; padding: 20px; max-width: 360px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 12px; margin-bottom: 12px; }
                        .title { font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0; }
                        .subtitle { font-size: 11px; color: #64748b; margin: 2px 0; }
                        .details { margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; font-size: 11px; }
                        .details div { margin-bottom: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                        .totals { border-top: 1px dashed #94a3b8; padding-top: 8px; }
                        .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                        .grand-total { font-size: 14px; font-weight: 800; border-top: 1px solid #1e293b; padding-top: 6px; margin-top: 4px; }
                        .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #64748b; }
                        @media print { body { padding: 0; } }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="title">${shopName}</div>
                        <div class="subtitle">${shopAddress}</div>
                        <div class="subtitle">Ph: ${shopPhone}</div>
                        <div style="margin-top: 4px; font-size: 10px; font-weight: bold; background: #f1f5f9; padding: 2px 6px; display: inline-block; border-radius: 4px;">Village1 Local Commerce POS</div>
                      </div>
                      <div class="details">
                        <div><strong>Invoice:</strong> ${bill.invoiceNumber}</div>
                        <div><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleString()}</div>
                        <div><strong>Customer:</strong> ${bill.customerName || 'Walk-in Counter'}</div>
                        ${bill.customerPhone ? `<div><strong>Phone:</strong> ${bill.customerPhone}</div>` : ''}
                        ${bill.customerAddress ? `<div><strong>Place:</strong> ${bill.customerAddress}</div>` : ''}
                        <div><strong>Payment:</strong> ${bill.paymentMethod} (${bill.paymentStatus})</div>
                        ${bill.paymentReference ? `<div><strong>Ref ID:</strong> ${bill.paymentReference}</div>` : ''}
                      </div>
                      <table>
                        <thead>
                          <tr style="border-bottom: 1px solid #94a3b8; text-align: left; font-size: 10px; color: #64748b;">
                            <th>ITEM</th>
                            <th style="text-align: right;">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>
                      <div class="totals">
                        <div class="total-row"><span>Subtotal:</span><span style="font-family: monospace;">₹${Number(bill.subtotal).toFixed(2)}</span></div>
                        ${bill.discount > 0 ? `<div class="total-row" style="color: #b45309;"><span>Discount:</span><span style="font-family: monospace;">-₹${Number(bill.discount).toFixed(2)}</span></div>` : ''}
                        <div class="total-row grand-total"><span>TOTAL:</span><span style="font-family: monospace;">₹${Number(bill.totalAmount).toFixed(2)}</span></div>
                        ${bill.cashReceived ? `<div class="total-row" style="font-size: 11px; margin-top: 4px;"><span>Cash Tendered:</span><span style="font-family: monospace;">₹${Number(bill.cashReceived).toFixed(2)}</span></div>` : ''}
                        ${bill.cashReceived && bill.cashReceived >= bill.totalAmount ? `<div class="total-row" style="font-size: 11px; color: #047857;"><span>Change Returned:</span><span style="font-family: monospace;">₹${(Number(bill.cashReceived) - Number(bill.totalAmount)).toFixed(2)}</span></div>` : ''}
                      </div>
                      <div class="footer">
                        Thank you for visiting and supporting our village shop!<br/>
                        Powered by Village1 Hyperlocal
                      </div>
                      <script>
                        window.onload = function() {
                          window.print();
                        };
                      </script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              };

              return (
                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 uppercase">
                        {bill.shop?.name || activeShopObj?.name}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {bill.shop?.address || activeShopObj?.address},{' '}
                        {bill.shop?.village || activeShopObj?.village}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Ph: {bill.shop?.phone || activeShopObj?.phone}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCompletedBill(null);
                        setViewingBillModal(null);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-200">
                    <div>
                      <strong>Invoice / Bill:</strong> {bill.invoiceNumber}
                    </div>
                    <div>
                      <strong>Date:</strong> {new Date(bill.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <strong>Customer:</strong> {bill.customerName || 'Counter Sale'}
                    </div>
                    {bill.customerPhone && (
                      <div>
                        <strong>Mobile:</strong> {bill.customerPhone}
                      </div>
                    )}
                    {bill.customerAddress && (
                      <div>
                        <strong>Place / Address:</strong> {bill.customerAddress}
                      </div>
                    )}
                    <div>
                      <strong>Payment:</strong> {bill.paymentMethod} ({bill.paymentStatus})
                    </div>
                    {bill.paymentReference && (
                      <div>
                        <strong>UPI Ref:</strong> {bill.paymentReference}
                      </div>
                    )}
                    {bill.cashReceived && (
                      <div>
                        <strong>Cash Tendered:</strong> ₹{bill.cashReceived.toFixed(2)} (Change: ₹
                        {(bill.cashReceived - bill.totalAmount).toFixed(2)})
                      </div>
                    )}
                    {bill.notes && (
                      <div>
                        <strong>Notes:</strong> {bill.notes}
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-1 py-1 max-h-48 overflow-y-auto">
                    {bill.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-[11px]">
                        <span>
                          {item.quantity}× {item.productName}
                        </span>
                        <span>₹{item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{bill.subtotal.toFixed(2)}</span>
                    </div>
                    {bill.discount > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Discount:</span>
                        <span>-₹{bill.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                      <span>TOTAL PAYABLE:</span>
                      <span>₹{bill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 pt-2">
                    Thank you for shopping local with Village1!
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handlePrintReceipt}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Printer className="w-4 h-4" /> Print Receipt
                    </button>
                    <button
                      onClick={() => {
                        setCompletedBill(null);
                        setViewingBillModal(null);
                      }}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Modal: Final Bill Confirmation Before Closing Sale */}
        {confirmSaleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Confirm & Complete Walk-in Bill
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Review customer, items, and payment status before recording sale.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmSaleModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Customer summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Name: </span>
                    <strong className="text-slate-900">{posCustomerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Mobile: </span>
                    <strong className="text-slate-900">{posCustomerPhone}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Place / Area: </span>
                    <strong className="text-slate-900">{posCustomerAddress}</strong>
                  </div>
                  {posCustomerNotes && (
                    <div className="col-span-2 text-slate-500 italic">
                      Notes: {posCustomerNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Itemized Cart ({posCart.length} items)
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-2xl">
                  {posCart.map((i) => (
                    <div key={i.product.id} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{i.product.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {i.quantity} {i.product.unit} × ₹{i.product.price}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900">
                        ₹{(i.product.price * i.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Payment Summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{posSubtotal.toFixed(2)}</span>
                </div>
                {parsedDiscount > 0 && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{parsedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="font-mono text-emerald-700">₹{posTotal.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Payment Method</span>
                    <span className="font-bold text-slate-800">
                      {posPaymentMethod === 'CASH' ? 'Cash at Counter' : 'GPay / UPI QR'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Recorded Status</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        posPaymentMethod === 'CASH' || posPaymentConfirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {posPaymentMethod === 'CASH'
                        ? 'PAID_CASH'
                        : posPaymentConfirmed
                        ? 'PAID_UPI'
                        : 'PENDING_VERIFICATION'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Error Alert */}
              {posErrors.general && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{posErrors.general}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmSaleModalOpen(false)}
                  disabled={posSubmitting}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Back / Edit
                </button>
                <button
                  type="button"
                  onClick={executeFinalizeSale}
                  disabled={posSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30 active:scale-95"
                >
                  {posSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirm & Complete Sale
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Void Finalized Bill Confirmation */}
        {voidingBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-serif text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Void POS Bill #{voidingBill.invoiceNumber}
                </h3>
                <button
                  onClick={() => {
                    setVoidingBill(null);
                    setVoidReason('');
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                <p>
                  <strong>Warning:</strong> Voiding this bill will restore the sold item quantities back into the shop inventory and log an audit reversal.
                </p>
                <p>Total amount: <strong>₹{voidingBill.totalAmount}</strong></p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Recorded Reason for Voiding <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer cancelled sale, Incorrect billing entry"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVoidingBill(null);
                    setVoidReason('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVoid}
                  disabled={voidSubmitting || !voidReason.trim()}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {voidSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Void'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Dedicated Item-by-Item Packing View */}
        {packingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <Package className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-serif">
                        Order Packing Checklist
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {packingOrder.orderNumber}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPackingOrder(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Order & Customer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Customer Name</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {packingOrder.customer?.customerProfile?.fullName || 'Village Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Contact Number</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-600" />
                    {packingOrder.customer?.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Order Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    packingOrder.status === 'PREPARING'
                      ? 'bg-purple-100 text-purple-700'
                      : packingOrder.status === 'ACCEPTED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {packingOrder.status === 'PREPARING' ? 'PACKING IN PROGRESS' : packingOrder.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Payment Method</span>
                  <span className="font-bold text-slate-800">
                    {packingOrder.paymentMethod === 'CASH_ON_PICKUP' ? 'Cash on Collection' : 'UPI QR'} (₹{packingOrder.totalAmount})
                  </span>
                </div>
                {packingOrder.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 text-amber-900 bg-amber-50/60 p-2.5 rounded-xl">
                    <strong>Customer Instructions:</strong> {packingOrder.notes}
                  </div>
                )}
              </div>

              {/* Packing Progress Bar */}
              {(() => {
                const totalItems = packingOrder.items?.length || 0;
                const packedItems = packingOrder.items?.filter((i: any) => i.isPacked).length || 0;
                const percent = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
                const allPacked = totalItems > 0 && packedItems === totalItems;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-purple-600" />
                        Packing Progress:
                      </span>
                      <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                        {packedItems} / {totalItems} items packed ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          allPacked ? 'bg-emerald-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Checklist Table / Rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ordered Items Checklist ({packingOrder.items?.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Tap checkbox or row to mark item packed
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                  {packingOrder.items?.map((item: any) => {
                    const isBusy = packingItemLoading === item.id;
                    const isItemPacked = !!item.isPacked;

                    return (
                      <div
                        key={item.id}
                        onClick={() => !isBusy && handleTogglePackItem(packingOrder.id, item.id, isItemPacked)}
                        className={`p-4 flex items-center justify-between gap-4 transition-colors cursor-pointer select-none ${
                          isItemPacked
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePackItem(packingOrder.id, item.id, isItemPacked);
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              isItemPacked
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'border-2 border-slate-300 hover:border-purple-500 bg-white'
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isItemPacked ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : null}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-bold ${
                                  isItemPacked ? 'text-slate-500 line-through' : 'text-slate-900'
                                }`}
                              >
                                {item.productName}
                              </span>
                              {item.product?.category && (
                                <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-100 rounded">
                                  {item.product.category}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Quantity: <strong>{item.quantity}</strong>{' '}
                              <span className="text-slate-600 font-medium">
                                {item.product?.unit || 'quantity'}
                              </span>
                              {isItemPacked && item.packedAt && (
                                <span className="text-emerald-700 ml-2 font-medium">
                                  • Packed {new Date(item.packedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 text-sm">
                            ₹{item.totalPrice}
                          </span>
                          <span
                            className={`block text-[11px] font-bold mt-0.5 ${
                              isItemPacked ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {isItemPacked ? 'Packed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              {(() => {
                const totalItems = packingOrder.items?.length || 0;
                const packedItems = packingOrder.items?.filter((i: any) => i.isPacked).length || 0;
                const allPacked = totalItems > 0 && packedItems === totalItems;
                const isBusy = actionLoading === packingOrder.id;

                return (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setPackingOrder(null)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Close & Return to Orders
                    </button>

                    <div className="w-full sm:w-auto flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!allPacked || isBusy}
                        onClick={() => setConfirmReadyOpen(true)}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                          allPacked
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-none'
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Store className="w-4 h-4" />
                        )}
                        Mark Ready for Collection
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Confirmation Dialog to Mark Ready for Collection */}
              {confirmReadyOpen && (
                <div className="absolute inset-0 z-20 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 rounded-3xl animate-in fade-in">
                  <div className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-xl space-y-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 font-serif">
                        Mark Order Ready for Collection?
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        All items have been marked packed. Once marked ready, the customer will be notified that their order is waiting at the counter.
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setConfirmReadyOpen(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Back to Checklist
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === packingOrder.id}
                        onClick={() => handleConfirmMarkReady(packingOrder.id)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {actionLoading === packingOrder.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Confirm & Notify'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Pickup 6-digit Code Verification */}
        {verifyingOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-brand-600" />
                  Verify Customer Pickup Code
                </h3>
                <button
                  onClick={() => setVerifyingOrderId(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Ask the customer at the counter for their 6-digit pickup verification code displayed on their phone screen.
              </p>

              {verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {verificationError}
                </div>
              )}

              <input
                type="text"
                placeholder="e.g. 123456"
                maxLength={6}
                value={pickupCodeInput}
                onChange={(e) => setPickupCodeInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-widest font-mono text-2xl font-black p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                autoFocus
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setVerifyingOrderId(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerifyPickup(verifyingOrderId)}
                  disabled={actionLoading === verifyingOrderId}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-brand-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading === verifyingOrderId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify & Handover'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Decline Order */}
        {rejectingOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-red-600 font-serif flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> Decline Order
                </h3>
                <button
                  onClick={() => setRejectingOrderId(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Please provide a reason to inform the customer why this pickup order could not be fulfilled. Stock will be restored.
              </p>

              <textarea
                rows={3}
                placeholder="e.g. Out of stock, Store closing early today..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setRejectingOrderId(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleUpdateStatus(
                      rejectingOrderId,
                      'REJECTED',
                      rejectionReason.trim() || 'Item unavailable at counter'
                    )
                  }
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/30"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Register Shop */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-serif">
                      Register Your Village Shop
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Submit your shop profile for village customer discovery.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRegisterModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {registerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {registerError}
                </div>
              )}

              {registerSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegisterShop} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Murugan Maligai Store"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Shop Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newShopCategoryId}
                    onChange={(e) => setNewShopCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium cursor-pointer"
                  >
                    {categories.length === 0 && <option value="">Loading categories...</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Street / Bazaar Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 14 South Car Street"
                      value={newShopAddress}
                      onChange={(e) => setNewShopAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Village / Town <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alanganallur"
                      value={newShopVillage}
                      onChange={(e) => setNewShopVillage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Madurai"
                      value={newShopDistrict}
                      onChange={(e) => setNewShopDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 625501"
                      value={newShopPinCode}
                      onChange={(e) => setNewShopPinCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Shop Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={newShopPhone}
                      onChange={(e) => setNewShopPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Opens</label>
                    <input
                      type="text"
                      value={newShopOpeningHours}
                      onChange={(e) => setNewShopOpeningHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Closes</label>
                    <input
                      type="text"
                      value={newShopClosingHours}
                      onChange={(e) => setNewShopClosingHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {registerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
