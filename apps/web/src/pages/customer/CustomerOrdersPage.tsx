import React from 'react';
import { CustomerLayout } from './CustomerLayout';
import { CustomerOrdersView } from '../../components/CustomerOrdersView';
import { useNavigate } from '../../router/Router';
import { useCart } from '../../context/CartContext';

export const CustomerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { latestOrderId } = useCart();

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CustomerOrdersView
          onBack={() => navigate('/')}
          selectedOrderId={latestOrderId}
        />
      </div>
    </CustomerLayout>
  );
};

