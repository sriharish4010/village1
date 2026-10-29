import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';
import { api } from '../services/api';

export type PendingRole = 'CUSTOMER' | 'SHOPKEEPER' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  pendingRole: PendingRole;
  setPendingRole: (role: PendingRole) => void;
  activeVillage: {
    name: string;
    district: string;
    pinCode: string;
  };
  setActiveVillage: (village: { name: string; district: string; pinCode: string }) => void;
  isLoginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  isRegisterOpen: boolean;
  setRegisterOpen: (open: boolean) => void;
  isVillageModalOpen: boolean;
  setVillageModalOpen: (open: boolean) => void;
  login: (identifier: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const defaultVillage = {
  name: 'Alanganallur',
  district: 'Madurai',
  pinCode: '625501',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingRole, setPendingRole] = useState<PendingRole>(null);
  const [activeVillage, setActiveVillageState] = useState(defaultVillage);

  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  const [isVillageModalOpen, setVillageModalOpen] = useState(false);

  // Load saved village preference
  useEffect(() => {
    const savedVillage = localStorage.getItem('v1_selected_village');
    if (savedVillage) {
      try {
        setActiveVillageState(JSON.parse(savedVillage));
      } catch (e) {
        // use default
      }
    }
  }, []);

  const setActiveVillage = (village: { name: string; district: string; pinCode: string }) => {
    setActiveVillageState(village);
    localStorage.setItem('v1_selected_village', JSON.stringify(village));
  };

  // Sync user profile on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = api.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        setUser(res.user);
        if (res.user.customerProfile?.village) {
          setActiveVillage({
            name: res.user.customerProfile.village,
            district: res.user.customerProfile.district,
            pinCode: res.user.customerProfile.pinCode,
          });
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        api.setTokens(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<User> => {
    const res = await api.auth.login(identifier, password);
    api.setTokens(res.tokens);
    setUser(res.user);
    setPendingRole(null); // Clear pending role after successful login
    if (res.user.customerProfile?.village) {
      setActiveVillage({
        name: res.user.customerProfile.village,
        district: res.user.customerProfile.district,
        pinCode: res.user.customerProfile.pinCode,
      });
    }
    setLoginOpen(false);
    return res.user;
  };

  const register = async (payload: any): Promise<User> => {
    const res = await api.auth.register(payload);
    api.setTokens(res.tokens);
    setUser(res.user);
    setPendingRole(null); // Clear pending role after successful registration
    if (res.user.customerProfile?.village) {
      setActiveVillage({
        name: res.user.customerProfile.village,
        district: res.user.customerProfile.district,
        pinCode: res.user.customerProfile.pinCode,
      });
    }
    setRegisterOpen(false);
    return res.user;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    setPendingRole(null);
  };

  const refreshUserProfile = async () => {
    if (api.getAccessToken()) {
      const res = await api.auth.getMe();
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingRole,
        setPendingRole,
        activeVillage,
        setActiveVillage,
        isLoginOpen,
        setLoginOpen,
        isRegisterOpen,
        setRegisterOpen,
        isVillageModalOpen,
        setVillageModalOpen,
        login,
        register,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
