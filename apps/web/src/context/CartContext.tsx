import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  product: any;
  quantity: number;
}

export interface ActiveCart {
  shop: any;
  items: CartItem[];
  total: number;
}

interface CartContextType {
  activeCart: ActiveCart | null;
  setActiveCart: (cart: ActiveCart | null) => void;
  latestOrderId: string | undefined;
  setLatestOrderId: (id: string | undefined) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCart, setActiveCart] = useState<ActiveCart | null>(null);
  const [latestOrderId, setLatestOrderId] = useState<string | undefined>(undefined);

  return (
    <CartContext.Provider value={{ activeCart, setActiveCart, latestOrderId, setLatestOrderId }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
