import React from 'react';
import { useNavigate } from '../../router/Router';
import { RoleSelectionScreen } from '../../components/RoleSelectionScreen';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <RoleSelectionScreen
      onSelectRole={(role) => {
        if (role === 'CUSTOMER') {
          navigate('/auth/customer');
        } else {
          navigate('/auth/shopkeeper');
        }
      }}
      onOpenAdminLogin={() => navigate('/admin/login')}
    />
  );
};
