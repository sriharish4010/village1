import React from 'react';
import { useNavigate } from '../../router/Router';
import { CheckoutView } from '../../components/CheckoutView';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeCart, setActiveCart, setLatestOrderId } = useCart();

  if (!activeCart || activeCart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-slate-500 mb-6">
            You don't have any active items in your checkout session. Explore shops in your village to add items.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Village Shops
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutView
      cart={activeCart}
      onBack={() => {
        if (activeCart.shop?.id) {
          navigate(`/shop/${activeCart.shop.id}`);
        } else {
          navigate('/');
        }
      }}
      onOrderSuccess={(order) => {
        setLatestOrderId(order.id);
        setActiveCart(null);
        navigate('/customer/orders');
      }}
    />
  );
};
