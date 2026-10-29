import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, Scissors, MapPin, Clock, Phone, Star, ShieldCheck, ShoppingCart } from 'lucide-react';
import { ShopModal } from './ShopModal';
import { api } from '../services/api';

interface ShopCardPreviewProps {
  selectedCategory: string | null;
  onSelectShop?: (shop: any) => void;
}

export const ShopCardPreview: React.FC<ShopCardPreviewProps> = ({ selectedCategory, onSelectShop }) => {
  const { activeVillage } = useAuth();
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [dbShops, setDbShops] = useState<any[]>([]);

  // Load real approved shops from backend
  React.useEffect(() => {
    const fetchLiveShops = async () => {
      try {
        const res = await api.shops.getPublic({ village: activeVillage.name });
        if (res?.shops && res.shops.length > 0) {
          // Normalize for UI display
          const mapped = res.shops.map((s: any) => ({
            id: s.id,
            name: s.name,
            category: s.category?.name || 'Local Store',
            categorySlug: s.category?.slug || 'grocery-stores',
            rating: 4.8,
            reviewsCount: s._count?.reviews || 24,
            village: s.village,
            district: s.district,
            address: s.address,
            phone: s.phone,
            timing: `${s.openingHours} - ${s.closingHours}`,
            icon: s.category?.slug === 'salons-barber-shops' ? '✂️' : '🛒',
            badges: ['Verified Merchant', 'Pay at Shop'],
            // Combine shop products and services so retail products (e.g. rice) are not eclipsed
            products: [
              ...(s.products || []).map((p: any) => ({
                name: p.name,
                price: `₹${p.price}`,
                stock: p.stock > 0 ? `${p.stock} in stock` : 'Out of stock',
              })),
              ...(s.services || []).map((srv: any) => ({
                name: srv.name,
                price: `₹${srv.price}`,
                stock: `${srv.durationMinutes || 20} mins`,
              })),
            ],
          }));
          setDbShops(mapped);
        }
      } catch (err) {
        // keep fallback
      }
    };
    fetchLiveShops();
  }, [activeVillage.name]);

  // Fallback approved shops
  const fallbackShops = [
    {
      id: '675dd417-df3c-48a5-aee7-3af890931745',
      name: 'Murugan Maligai Store',
      category: 'Grocery Stores',
      categorySlug: 'grocery-stores',
      rating: 4.8,
      reviewsCount: 38,
      village: 'Alanganallur',
      district: 'Madurai',
      address: '24, Main Bazaar Road',
      phone: '9876543210',
      timing: '07:30 AM - 09:30 PM',
      icon: '🛒',
      badges: ['Verified Merchant', 'Pay at Shop'],
      description: 'Your reliable neighborhood grocery shop providing quality rice, pulses, cold-pressed oils, and spices.',
      products: [
        { name: 'Ponni Boiled Rice (5 kg)', price: '₹320', stock: 'In Stock' },
        { name: 'Pure Gingelly Oil (1L)', price: '₹240', stock: 'In Stock' },
        { name: 'Toor Dal 1st Quality (1 kg)', price: '₹165', stock: 'In Stock' },
      ],
    },
    {
      id: 'bdc8297a-46d6-4ed7-8e37-086af08c21ca',
      name: "Karthik Men's Hair Studio",
      category: 'Salons & Barber Shops',
      categorySlug: 'salons-barber-shops',
      rating: 4.9,
      reviewsCount: 52,
      village: 'Alanganallur',
      district: 'Madurai',
      address: '7, Bus Stand Complex',
      phone: '9842109876',
      timing: '08:00 AM - 09:00 PM (Closed Tue)',
      icon: '✂️',
      badges: ['Queue Token System', 'AC Studio'],
      description: 'Modern styling and grooming studio with digital queue token generation for zero waiting time.',
      products: [
        { name: 'rice', price: '₹1245', stock: '9 in stock' },
        { name: 'Haircut & Head Massage', price: '₹120', stock: '25 mins' },
        { name: 'Razor Shave & Beard Trim', price: '₹60', stock: '15 mins' },
      ],
    },
    {
      id: 'shop-3',
      name: 'Annamalai Bakery & Tea Snacks',
      category: 'Bakeries & Sweets',
      categorySlug: 'bakeries-sweets',
      rating: 4.7,
      reviewsCount: 29,
      village: 'Alanganallur',
      district: 'Madurai',
      address: '15, South Car Street',
      phone: '9843214567',
      timing: '06:00 AM - 10:00 PM',
      icon: '🍞',
      badges: ['Fresh Daily Bakes', 'Tea Counter'],
      description: 'Traditional hot tea, fresh egg puffs, coconut buns, rusk, and sweet evening snacks.',
      products: [
        { name: 'Fresh Vegetable Puff', price: '₹20', stock: 'Hot & Fresh' },
        { name: 'Butter Tea Biscuit (Pack)', price: '₹40', stock: 'In Stock' },
        { name: 'Ghee Laddu (250g)', price: '₹85', stock: 'In Stock' },
      ],
    },
  ];

  const shops = dbShops.length > 0 ? dbShops : fallbackShops;

  const filteredShops = selectedCategory
    ? shops.filter((s) => s.categorySlug === selectedCategory)
    : shops;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-serif flex items-center gap-2">
            <span>Approved Shops in {activeVillage.name}</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {filteredShops.length} Active
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified village merchants, inspect real-time catalog prices, and place pickup orders
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>Admin Verified Merchants Only</span>
        </div>
      </div>

      {/* Shop Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop) => (
          <div
            key={shop.id}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col group hover:-translate-y-1"
          >
            {/* Card Top */}
            <div className="p-5 pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {shop.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {shop.name}
                    </h3>
                    <p className="text-xs font-semibold text-brand-700">{shop.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-1 rounded-xl text-xs font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{shop.rating}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                {shop.description}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {shop.badges.map((b: string) => (
                  <span key={b} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Address & Timings */}
            <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{shop.address}, {shop.village}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{shop.timing}</span>
              </div>
            </div>

            {/* Catalog Snapshot */}
            <div className="p-5 pt-4 flex-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Featured Items Snapshot:
              </p>
              <div className="space-y-2">
                {shop.products.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                    <span className="text-slate-800 font-medium truncate max-w-[180px]">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{p.price}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">{p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action footer */}
            <div className="p-5 pt-0">
              <button
                onClick={() => {
                  if (onSelectShop) {
                    onSelectShop(shop);
                  } else {
                    setSelectedShop(shop);
                  }
                }}
                className="w-full bg-slate-900 hover:bg-brand-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {shop.categorySlug === 'salons-barber-shops' ? (
                  <>
                    <Scissors className="w-3.5 h-3.5" /> Book Slot / Queue Token
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" /> Open Shop & Order
                  </>
                )}
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Interactive Shop Modal */}
      {selectedShop && (
        <ShopModal
          shopId={selectedShop.id}
          initialShopData={selectedShop}
          onClose={() => setSelectedShop(null)}
        />
      )}

    </div>
  );
};
