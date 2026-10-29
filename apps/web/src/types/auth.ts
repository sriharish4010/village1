export type UserRole = 'CUSTOMER' | 'SHOPKEEPER' | 'ADMIN';

export interface CustomerProfile {
  id: string;
  fullName: string;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  preferredLanguage: string;
}

export interface UserAddress {
  id: string;
  addressLine: string;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface ShopMembership {
  membershipId: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  permissions: string[];
  shop: {
    id: string;
    name: string;
    slug: string;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    isActive: boolean;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  customerProfile: CustomerProfile | null;
  addresses?: UserAddress[];
  shops?: ShopMembership[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
