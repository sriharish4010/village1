import React, { useState } from 'react';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';

interface CheckoutViewProps {
  cart: {
    shop: any;
    items: { product: any; quantity: number }[];
    total: number;
  };
  onBack: () => void;
  onOrderSuccess: (order: any) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  onBack,
  onOrderSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_PICKUP' | 'UPI_QR'>('CASH_ON_PICKUP');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cart.items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);

  const handleConfirmOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        shopId: cart.shop.id,
        paymentMethod,
        notes: notes.trim() || undefined,
        items: cart.items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      };

      const res = await api.orders.create(payload);
      if (res?.order) {
        onOrderSuccess(res.order);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please review your cart.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-200">
      <div className="max-w-3xl mx-auto">
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Shop Catalog
        </button>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
          
          {/* Header */}
          <div className="bg-slate-900 text-white p-6">
            <h1 className="text-xl font-bold font-serif">Confirm Pickup Order</h1>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-brand-400" />
              Ordering from: <strong>{cart.shop.name}</strong> ({cart.shop.village})
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Error banner */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Itemized Bill / Summary */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">Order Items ({cart.items.length})</h2>
              <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100">
                {cart.items.map(({ product, quantity }) => (
                  <div key={product.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{product.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        ₹{product.price} × {quantity} {product.unit}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{product.price * quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pickup Packaging / Tax:</span>
                  <span className="text-emerald-700 font-semibold">Free (₹0)</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount Due:</span>
                  <span>₹{subtotal}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-2">Select Payment Method at Pickup</h2>
              <p className="text-xs text-slate-500 mb-3">
                No upfront advance required. You pay the merchant directly upon picking up your order.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setPaymentMethod('CASH_ON_PICKUP')}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'CASH_ON_PICKUP'
                      ? 'border-brand-600 bg-brand-50/40 text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Cash at Pickup Counter</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay cash to the shopkeeper when you collect your bagged order.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod('UPI_QR')}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'UPI_QR'
                      ? 'border-brand-600 bg-brand-50/40 text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">UPI / GPay / PhonePe at Shop</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Scan merchant QR code at the shop counter after verifying your items.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Special Instructions / Notes for Shopkeeper (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please pack cold pressed oil in a separate bag, or call when ready..."
                rows={2}
                maxLength={300}
                className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 p-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
              />
            </div>

            {/* Pickup Location Reminder */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <MapPin className="w-4 h-4 text-amber-600" />
                Pickup Location & Verification
              </p>
              <p>
                {cart.shop.address}, {cart.shop.village}, {cart.shop.district}
              </p>
              <p className="text-[11px] text-amber-800">
                After placing your order, you will receive a secure 6-digit pickup verification code to show the shopkeeper.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order with {cart.shop.name}...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Place Pickup Order (₹{subtotal})
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
