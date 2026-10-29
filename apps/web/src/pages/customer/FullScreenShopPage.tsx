import React from 'react';
import { useParams, useNavigate } from '../../router/Router';
import { FullScreenShop } from '../../components/FullScreenShop';
import { useCart } from '../../context/CartContext';

export const FullScreenShopPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { setActiveCart } = useCart();

  if (!shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-600 font-medium mb-4">No shop specified</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700"
          >
            Back to Shops
          </button>
        </div>
      </div>
    );
  }

  return (
    <FullScreenShop
      shopId={shopId}
      onBack={() => navigate('/')}
      onProceedToCheckout={(cart) => {
        setActiveCart(cart);
        navigate('/checkout');
      }}
    />
  );
};
