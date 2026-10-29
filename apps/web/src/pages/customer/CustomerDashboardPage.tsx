import React, { useState } from 'react';
import { useNavigate } from '../../router/Router';
import { CustomerLayout } from './CustomerLayout';
import { HeroBanner } from '../../components/HeroBanner';
import { ShopCardPreview } from '../../components/ShopCardPreview';

export const CustomerDashboardPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Hero Section with Category Filter */}
        <HeroBanner
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Public Village Shops Explorer */}
        <ShopCardPreview
          selectedCategory={selectedCategory}
          onSelectShop={(shop) => {
            navigate(`/shop/${shop.id}`);
          }}
        />
      </div>
    </CustomerLayout>
  );
};
