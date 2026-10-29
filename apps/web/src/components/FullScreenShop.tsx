import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
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
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FullScreenShopProps {
  shopId: string;
  onBack: () => void;
  onProceedToCheckout: (cart: {
    shop: any;
    items: { product: any; quantity: number }[];
    total: number;
  }) => void;
}

export const FullScreenShop: React.FC<FullScreenShopProps> = ({
  shopId,
  onBack,
  onProceedToCheckout,
}) => {
  const { user } = useAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCatalogTab, setActiveCatalogTab] = useState<'products' | 'services'>('products');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'name_asc' | 'price_asc' | 'price_desc'>('name_asc');

  // Cart scoped to this shop: { [productId]: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});

  // Salon queue state
  const [tokenGenerated, setTokenGenerated] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  // Reset state when shopId changes to avoid showing stale data from another shop
  useEffect(() => {
    setShop(null);
    setProducts([]);
    setCart({});
    setError(null);
    setSearchQuery('');
    setTokenGenerated(null);
    setSelectedService(null);
  }, [shopId]);

  // Fetch shop details and products
  const fetchProducts = async (query = searchQuery, sort = sortOption) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch shop details
      const shopRes = await api.shops.getShopById(shopId);
      if (shopRes?.shop) {
        setShop(shopRes.shop);
        // Default tab selection based on what the shop primarily offers
        const hasServices = (shopRes.shop.services && shopRes.shop.services.length > 0);
        const isSalonCat =
          shopRes.shop.category?.slug === 'salons-barber-shops' ||
          shopRes.shop.categorySlug === 'salons-barber-shops' ||
          shopRes.shop.name?.toLowerCase().includes('hair') ||
          shopRes.shop.name?.toLowerCase().includes('salon');

        if (isSalonCat && hasServices) {
          setActiveCatalogTab('services');
        } else {
          setActiveCatalogTab('products');
        }
      }

      // Fetch products with search & sort
      const prodRes = await api.shops.getProducts(shopId, { search: query, sort });
      if (prodRes?.products) {
        setProducts(prodRes.products);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shop details and catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    fetchProducts(val, sortOption);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchProducts('', sortOption);
  };

  const handleSortChange = (newSort: 'name_asc' | 'price_asc' | 'price_desc') => {
    setSortOption(newSort);
    fetchProducts(searchQuery, newSort);
  };

  const isSalon =
    shop?.category?.slug === 'salons-barber-shops' ||
    shop?.categorySlug === 'salons-barber-shops' ||
    shop?.name?.toLowerCase().includes('hair') ||
    shop?.name?.toLowerCase().includes('salon');

  const hasServices = (shop?.services && shop.services.length > 0);
  const hasProducts = products.length > 0 || (shop?.products && shop.products.length > 0);

  // Cart operations
  const updateQuantity = (product: any, delta: number) => {
    setCart((prev) => {
      const current = prev[product.id] || 0;
      const next = current + delta;

      if (next > product.stock) {
        return prev; // Prevent adding beyond stock
      }

      if (next <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }

      return { ...prev, [product.id]: next };
    });
  };

  const totalItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const calculateSubtotal = () => {
    return products.reduce((acc, p) => {
      const qty = cart[p.id] || 0;
      return acc + p.price * qty;
    }, 0);
  };

  const handleCheckoutClick = () => {
    const items = products
      .filter((p) => cart[p.id] > 0)
      .map((p) => ({
        product: p,
        quantity: cart[p.id],
      }));

    if (items.length === 0) return;

    onProceedToCheckout({
      shop,
      items,
      total: calculateSubtotal(),
    });
  };

  const handleBookToken = (service: any) => {
    setSelectedService(service);
    const tokenNo = `T-${Math.floor(10 + Math.random() * 90)}`;
    setTokenGenerated(tokenNo);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Shop Banner / Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Village Shops
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-3xl shadow-lg shadow-brand-500/20 shrink-0">
                {shop?.icon || (isSalon ? '✂️' : '🛒')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-white">
                    {shop?.name || 'Village Store'}
                  </h1>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin Verified
                  </span>
                </div>
                <p className="text-xs text-brand-300 font-semibold mt-1">
                  {shop?.category?.name || 'Local Grocery & Provisions'}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-400" />
                    {shop?.address}, {shop?.village}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    {shop?.openingHours || '07:30'} - {shop?.closingHours || '21:30'}
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

            {/* Cart Quick Summary (Desktop) */}
            {totalItemsCount > 0 && (
              <div className="bg-white/10 border border-white/20 p-3 sm:p-4 rounded-2xl flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-300 font-medium">{totalItemsCount} items in cart</p>
                  <p className="text-lg font-black text-white">₹{calculateSubtotal()}</p>
                </div>
                <button
                  onClick={handleCheckoutClick}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" /> Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* If shop offers both services & products, show tab switcher */}
        {(hasServices && (products.length > 0 || isSalon)) && (
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveCatalogTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCatalogTab === 'products'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              Products & Items ({products.length})
            </button>
            <button
              onClick={() => setActiveCatalogTab('services')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCatalogTab === 'services'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Scissors className="w-4 h-4" />
              Services & Queue Tokens ({shop?.services?.length || 0})
            </button>
          </div>
        )}

        {/* Tab 1: Services */}
        {activeCatalogTab === 'services' && hasServices ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-brand-600" />
                  Grooming Services & Digital Queue Token
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Book a token online, avoid waiting at the shop, and get served on time
                </p>
              </div>
              <div className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                Live Queue: ~2 Ahead
              </div>
            </div>

            {tokenGenerated ? (
              <div className="bg-white border border-emerald-200 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-lg animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">Queue Token Generated!</h3>
                <div className="bg-emerald-50 border border-emerald-200 py-4 px-6 rounded-2xl inline-block">
                  <p className="text-xs uppercase font-bold text-emerald-800 tracking-wider">Your Token Number</p>
                  <p className="text-4xl font-black text-brand-600 mt-1">{tokenGenerated}</p>
                </div>
                <p className="text-sm text-slate-700">
                  Service: <strong>{selectedService?.name}</strong> • Approx. wait: <strong>15 mins</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Please arrive at {shop?.name}, {shop?.address} when your token is called.
                </p>
                <button
                  onClick={() => setTokenGenerated(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Book Another Service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(shop?.services || []).map((service: any) => (
                  <div
                    key={service.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-brand-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{service.name}</h3>
                        <span className="text-base font-black text-slate-900">₹{service.price}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{service.description}</p>
                      <p className="text-[11px] font-semibold text-brand-700 mt-2">
                        Duration: ~{service.durationMinutes} mins
                      </p>
                    </div>
                    <button
                      onClick={() => handleBookToken(service)}
                      className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                    >
                      Generate Queue Token
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Products Catalog */
          <div>
            {/* Search and Sort Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Product Search */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search products in this shop..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="name_asc">Name: A to Z</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

            </div>

            {/* Error state */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2 mb-6">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-medium">Loading store catalog...</p>
              </div>
            )}

            {/* Empty Search State */}
            {!loading && products.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-6">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No products found</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  {searchQuery
                    ? `No items match "${searchQuery}" in this shop.`
                    : 'This shop currently has no active products listed.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                  const qtyInCart = cart[product.id] || 0;
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Placeholder / Image preview */}
                        <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl mb-4">
                          🛒
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{product.name}</h3>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {product.description || 'Quality provision for daily home use'}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            per {product.unit}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                              isOutOfStock
                                ? 'bg-red-50 text-red-700'
                                : product.stock < 10
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-base font-black text-slate-900">
                          ₹{product.price}
                        </span>

                        {isOutOfStock ? (
                          <span className="text-xs font-semibold text-slate-400">Unavailable</span>
                        ) : qtyInCart === 0 ? (
                          <button
                            onClick={() => updateQuantity(product, 1)}
                            className="bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-brand-50 border border-brand-200 rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(product, -1)}
                              className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-brand-600 hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-brand-900 w-6 text-center">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => updateQuantity(product, 1)}
                              disabled={qtyInCart >= product.stock}
                              className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-brand-600 hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
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
      </main>

      {/* Floating Bottom Checkout Bar for Mobile / Tablet */}
      {totalItemsCount > 0 && (
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-900">{totalItemsCount}</span> items selected
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900">
                Total: ₹{calculateSubtotal()}
              </p>
            </div>
            <button
              onClick={handleCheckoutClick}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all shadow-md shadow-brand-600/30 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> Place Pickup Order →
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
