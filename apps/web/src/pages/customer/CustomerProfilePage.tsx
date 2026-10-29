import React from 'react';
import { CustomerLayout } from './CustomerLayout';
import { UserProfileCard } from '../../components/UserProfileCard';
import { useNavigate } from '../../router/Router';

export const CustomerProfilePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-black text-slate-900 font-serif">Customer Account Profile</h1>
          <p className="text-xs text-slate-500">
            View your personal contact details, registered village profile, and account credentials.
          </p>
        </div>

        <UserProfileCard
          onOpenOrders={() => navigate('/customer/orders')}
          onOpenShopkeeper={() => navigate('/shopkeeper/dashboard')}
          onOpenAdmin={() => navigate('/admin/governance')}
        />
      </div>
    </CustomerLayout>
  );
};
