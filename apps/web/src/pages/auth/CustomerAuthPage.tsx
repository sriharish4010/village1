import React from 'react';
import { useNavigate } from '../../router/Router';
import { RoleAuthPage } from '../../components/RoleAuthPage';

export const CustomerAuthPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <RoleAuthPage
      role="CUSTOMER"
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
