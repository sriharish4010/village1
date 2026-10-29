import React from 'react';
import { useNavigate } from '../../router/Router';
import { AdminLoginPage as AdminLoginComponent } from '../../components/AdminLoginPage';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AdminLoginComponent
      onBack={() => navigate('/auth')}
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
