import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  Scissors,
  MapPin,
  Clock,
  Phone,
  Star,
  ShieldCheck,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  Package,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface ShopModalProps {
  shopId: string | null;
  initialShopData?: any;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ shopId, initialShopData, onClose }) => {
  const { user, activeVillage } = useAuth();
  const [shop, setShop] = useState<any>(initialShopData || null);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [tokenGenerated, setTokenGenerated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');

  useEffect(() => {
    if (!shopId) return;

    // Reset previous shop's cart and tokens
    setCart({});
    setOrderPlaced(false);
    setSelectedService(null);
    setTokenGenerated(null);

    // If initialShopData was passed and belongs to this shop, use it initially
    if (initialShopData && initialShopData.id === shopId) {
      setShop(initialShopData);
      if (initialShopData.categorySlug === 'salons-barber-shops') {
        setActiveTab('services');
      } else {
        setActiveTab('products');
      }
    } else {
      setShop(null);
    }

    // Attempt to fetch full shop details from backend
    const fetchShop = async () => {
      try {
        setLoading(true);
        const res = await api.shops.getShopById(shopId);
        if (res && res.shop) {
          setShop(res.shop);
          if (res.shop.services && res.shop.services.length > 0) {
            setActiveTab('services');
          } else {
            setActiveTab('products');
          }
        }
      } catch (err) {
        // If not found in DB or error (e.g. mock preview shop-1), fallback to initialShopData
        if (initialShopData && initialShopData.id === shopId) {
          setShop(initialShopData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [shopId, initialShopData]);

  if (!shopId) return null;

  const isSalon =
    shop?.categorySlug === 'salons-barber-shops' ||
    shop?.category?.slug === 'salons-barber-shops' ||
    shop?.name?.toLowerCase().includes('hair') ||
    shop?.name?.toLowerCase().includes('salon');

  const hasServices = (shop?.services && shop.services.length > 0);
  const hasProducts = (shop?.products && shop.products.length > 0);

  // Handle Grocery Cart
  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const calculateSubtotal = () => {
    if (!shop?.products) return 0;
    return shop.products.reduce((acc: number, p: any, idx: number) => {
      const id = p.id || `p-${idx}`;
      const qty = cart[id] || 0;
      const numericPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price.replace(/[^\d.]/g, '')) || 0;
      return acc + numericPrice * qty;
    }, 0);
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  const handleBookToken = (service: any) => {
    setSelectedService(service);
    const tokenNo = `T-${Math.floor(10 + Math.random() * 90)}`;
    setTokenGenerated(tokenNo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shrink-0">
              {shop?.icon || (isSalon ? '✂️' : '🛒')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold font-serif">{shop?.name}</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Shop
                </span>
              </div>
              <p className="text-xs text-brand-300 font-medium mt-0.5">
                {shop?.category?.name || shop?.category || 'Local Village Store'}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  {shop?.address || 'Main Bazaar'}, {shop?.village || activeVillage.name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  {shop?.timing || `${shop?.openingHours || '08:00'} - ${shop?.closingHours || '21:00'}`}
                </span>
                {shop?.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-brand-400" />
                      {shop.phone}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
            </div>
          )}

          {/* Description */}
          {shop?.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {shop.description}
            </p>
          )}

          {/* If shop offers both services and products, show tab toggle (Services first for salons) */}
          {hasServices && (hasProducts || isSalon) && (
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'services'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                Services ({shop?.services?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Retail Products ({shop?.products?.length || 0})
              </button>
            </div>
          )}

          {/* Salon Queue Tokens & Services */}
          {activeTab === 'services' && hasServices ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-brand-600" />
                  Available Salon Services & Live Queue
                </h4>
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                  ⚡ Live Queue: ~2 Ahead
                </span>
              </div>

              {tokenGenerated ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-black">
                    <Check className="w-6 h-6" />
                  </div>
                  <h5 className="text-base font-bold text-emerald-950">Queue Token Confirmed!</h5>
                  <div className="inline-block bg-white px-6 py-2 rounded-2xl shadow-xs border border-emerald-200">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Your Token Number</p>
                    <p className="text-3xl font-black text-brand-600 mt-1">{tokenGenerated}</p>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Service: <strong>{selectedService?.name}</strong> • Approx. wait time: <strong>15 mins</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Please show this token number at the salon desk in {shop?.address}.
                  </p>
                  <button
                    onClick={() => setTokenGenerated(null)}
                    className="text-xs font-bold text-brand-600 hover:underline pt-2 cursor-pointer"
                  >
                    ← Book another service
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(shop?.services?.length ? shop.services : shop?.products || []).map((s: any, idx: number) => {
                    const price = typeof s.price === 'number' ? `₹${s.price}` : s.price;
                    const duration = s.durationMinutes ? `${s.durationMinutes} mins` : s.stock || '20 mins';
                    return (
                      <div
                        key={s.id || idx}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-500 hover:shadow-xs transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Duration: {duration} {s.description ? `• ${s.description}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-900">{price}</span>
                          <button
                            onClick={() => handleBookToken(s)}
                            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                          >
                            Get Token
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Grocery / Provisions Store Catalog */
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-brand-600" />
                  Available Grocery Items & Provisions
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  Fresh stock updated daily
                </span>
              </div>

              {orderPlaced ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-black">
                    <Check className="w-6 h-6" />
                  </div>
                  <h5 className="text-base font-bold text-emerald-950">Pickup Order Placed Successfully!</h5>
                  <p className="text-xs text-emerald-800">
                    Your order with <strong>{cartItemsCount} items (Total: ₹{calculateSubtotal()})</strong> has been sent to <strong>{shop?.name}</strong>.
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Pickup Location:</p>
                    <p>{shop?.address}, {shop?.village}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Payment Method: Cash on Pickup / UPI QR at counter</p>
                  </div>
                  <button
                    onClick={() => {
                      setCart({});
                      setOrderPlaced(false);
                      onClose();
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Done & Return
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(shop?.products || []).map((p: any, idx: number) => {
                    const itemId = p.id || `p-${idx}`;
                    const qty = cart[itemId] || 0;
                    const price = typeof p.price === 'number' ? `₹${p.price}` : p.price;
                    const unit = p.unit ? `per ${p.unit}` : p.stock;

                    return (
                      <div
                        key={itemId}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all"
                      >
                        <div className="flex-1 pr-3">
                          <p className="text-xs font-bold text-slate-900">{p.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {unit} {p.description ? `• ${p.description}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-900">{price}</span>
                          
                          {qty === 0 ? (
                            <button
                              onClick={() => updateQuantity(itemId, 1)}
                              className="bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-xl px-1.5 py-1">
                              <button
                                onClick={() => updateQuantity(itemId, -1)}
                                className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-brand-600 hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-brand-900 w-5 text-center">{qty}</span>
                              <button
                                onClick={() => updateQuantity(itemId, 1)}
                                className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-brand-600 hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
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

        </div>

        {/* Footer: Order Summary bar */}
        {!orderPlaced && cartItemsCount > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
            <div>
              <p className="text-xs text-slate-500">
                <span>{cartItemsCount} item(s) selected</span>
              </p>
              <p className="text-base font-black text-slate-900">
                Total: ₹{calculateSubtotal()}
              </p>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/20"
            >
              <ShoppingBag className="w-4 h-4" /> Place Pickup Order
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
