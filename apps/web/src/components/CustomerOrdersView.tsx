import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  QrCode,
  Banknote,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';

interface CustomerOrdersViewProps {
  onBack: () => void;
  selectedOrderId?: string;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  onBack,
  selectedOrderId,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await api.orders.getMyOrders();
      if (res?.orders) {
        setOrders(res.orders);

        if (selectedOrderId) {
          const match = res.orders.find((o: any) => o.id === selectedOrderId);
          if (match) setActiveOrder(match);
        } else if (res.orders.length > 0 && !activeOrder) {
          setActiveOrder(res.orders[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Poll every 5 seconds for live status updates while tracking orders
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedOrderId]);

  // Keep activeOrder synced with latest fetched order
  useEffect(() => {
    if (activeOrder && orders.length > 0) {
      const updated = orders.find((o) => o.id === activeOrder.id);
      if (updated) setActiveOrder(updated);
    }
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Awaiting Shop Acceptance
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Order Accepted
          </span>
        );
      case 'PREPARING':
        return (
          <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Package className="w-3 h-3" /> Packing Items
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <Store className="w-3 h-3" /> Ready For Pickup!
          </span>
        );
      case 'COLLECTED':
      case 'COMPLETED':
        return (
          <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Successfully Picked Up
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Declined by Shop
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  const steps = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PREPARING', label: 'Packing' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
    { key: 'COLLECTED', label: 'Picked Up' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY_FOR_PICKUP':
        return 3;
      case 'COLLECTED':
      case 'COMPLETED':
        return 4;
      default:
        return -1;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-200">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Village Shops
          </button>

          <button
            onClick={() => fetchOrders(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Live Sync
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-black font-serif text-slate-900">My Pickup Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time packaging, pickup code, and order collection status
          </p>
        </div>

        {/* Empty state */}
        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Browse approved village shops to place your first pickup order!
            </p>
            <button
              onClick={onBack}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Browse Village Shops
            </button>
          </div>
        )}

        {/* Orders Layout */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Orders List (Left Column) */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Order History ({orders.length})
              </h2>

              <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
                {orders.map((ord) => {
                  const isSelected = activeOrder?.id === ord.id;
                  return (
                    <div
                      key={ord.id}
                      onClick={() => setActiveOrder(ord)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-brand-600 shadow-md ring-2 ring-brand-500/10'
                          : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{ord.shop.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ord.orderNumber} • {new Date(ord.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs font-black text-slate-900">
                          ₹{ord.totalAmount}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {getStatusBadge(ord.status)}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Order Details (Right 2 Columns) */}
            <div className="lg:col-span-2">
              {activeOrder ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md font-mono">
                          {activeOrder.orderNumber}
                        </span>
                        {getStatusBadge(activeOrder.status)}
                      </div>
                      <h2 className="text-xl font-bold font-serif mt-2">
                        {activeOrder.shop.name}
                      </h2>
                      <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-400" />
                        {activeOrder.shop.address}, {activeOrder.shop.village}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400">Total Amount</p>
                      <p className="text-2xl font-black text-white">₹{activeOrder.totalAmount}</p>
                      <p className="text-[11px] text-brand-300 font-semibold">
                        {activeOrder.paymentMethod === 'CASH_ON_PICKUP' ? 'Cash at Shop' : 'UPI QR at Shop'}
                      </p>
                    </div>
                  </div>

                  {/* Secure 6-Digit Pickup Code Banner */}
                  {activeOrder.status !== 'REJECTED' && activeOrder.pickupCode && (
                    <div
                      className={`p-6 border-b text-center ${
                        activeOrder.status === 'COLLECTED'
                          ? 'bg-slate-50 border-slate-100 text-slate-600'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-950'
                      }`}
                    >
                      <p className="text-xs uppercase font-bold tracking-wider text-slate-500">
                        {activeOrder.status === 'COLLECTED'
                          ? 'Pickup Verified & Completed'
                          : 'Secure Pickup Verification Code'}
                      </p>

                      <div className="inline-block bg-white px-6 py-2.5 rounded-2xl shadow-xs border border-emerald-200 mt-2">
                        <p className="text-3xl font-black font-mono tracking-widest text-brand-600">
                          {activeOrder.pickupCode}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 mt-2">
                        {activeOrder.status === 'COLLECTED'
                          ? 'Order successfully handed over and paid for at the shop counter.'
                          : 'Provide this 6-digit code to the merchant at the shop counter to verify and collect your order.'}
                      </p>
                    </div>
                  )}

                  {/* Rejection Notice if any */}
                  {activeOrder.status === 'REJECTED' && (
                    <div className="p-5 bg-red-50 border-b border-red-100 text-xs text-red-800 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-red-900">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Order Declined by Shopkeeper
                      </p>
                      <p>
                        Reason: <strong>{activeOrder.rejectionReason || 'Items out of stock or shop closed'}</strong>
                      </p>
                      <p className="text-[11px] text-red-600">
                        No amount has been collected. You may place an order with another nearby store.
                      </p>
                    </div>
                  )}

                  {/* Step-by-Step Chronological Timeline */}
                  {activeOrder.status !== 'REJECTED' && (
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Order Progress
                      </h3>

                      <div className="grid grid-cols-5 gap-1 relative text-center">
                        {steps.map((step, idx) => {
                          const currentIdx = getStepIndex(activeOrder.status);
                          const isDone = currentIdx >= idx;
                          const isCurrent = currentIdx === idx;

                          return (
                            <div key={step.key} className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                                  isDone
                                    ? 'bg-brand-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-400'
                                } ${isCurrent ? 'ring-4 ring-brand-500/20 scale-105' : ''}`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span
                                className={`text-[11px] leading-tight font-semibold ${
                                  isCurrent
                                    ? 'text-brand-600'
                                    : isDone
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Items Snapshot */}
                  <div className="p-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ordered Products ({activeOrder.items?.length || 0})
                    </h3>

                    <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100">
                      {activeOrder.items?.map((item: any) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            <p className="text-[11px] text-slate-500">
                              ₹{item.unitPrice} × {item.quantity}
                            </p>
                          </div>
                          <span className="font-bold text-slate-900">
                            ₹{item.totalPrice}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Detailed Event Audit Trail */}
                    {activeOrder.events && activeOrder.events.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Activity Log
                        </h4>
                        <div className="space-y-1.5">
                          {activeOrder.events.map((ev: any) => (
                            <div key={ev.id} className="text-[11px] text-slate-600 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                              <span>{ev.notes || `Status changed to ${ev.toStatus}`}</span>
                              <span className="text-slate-400 font-mono">
                                {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
                  Select an order on the left to view tracking timeline
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
