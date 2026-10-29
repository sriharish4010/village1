import React from 'react';
import { useNavigate } from '../../router/Router';
import { RoleAuthPage } from '../../components/RoleAuthPage';

export const ShopkeeperAuthPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <RoleAuthPage
      role="SHOPKEEPER"
      onBack={() => navigate('/auth')}
      onOpenAdminLogin={() => navigate('/admin/login')}
      onLoginSuccess={(loggedInUser) => {
        if (loggedInUser.role === 'ADMIN') {
          navigate('/admin/governance');
        } else if (loggedInUser.role === 'SHOPKEEPER') {
          navigate('/shopkeeper/dashboard');
        } else {
          navigate('/');
        }
      }}
    />
  );
};
