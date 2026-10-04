import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product } from './types';

export type { Product };

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, count?: number) => void;
  removeFromCart: (productId: number) => void;
  setCartQuantity: (product: Product, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && typeof item === 'object' && item.id && Number(item.quantity) > 0);
      }
      localStorage.removeItem('cart');
      return [];
    } catch {
      try { localStorage.removeItem('cart'); } catch {}
      return [];
    }
  });

  const safeCart = Array.isArray(cart) ? cart : [];

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(safeCart));
    } catch {}
  }, [safeCart]);

  const addToCart = (product: Product, count = 1) => {
    if (!product || !product.id) return;
    const qtyToAdd = Math.max(1, count);
    setCart((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const existing = list.find((item) => item && item.id === product.id);
      if (existing) {
        return list.map((item) =>
          item.id === product.id ? { ...item, quantity: (Number(item.quantity) || 0) + qtyToAdd } : item
        );
      }
      return [...list, { ...product, quantity: qtyToAdd }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const existing = list.find((item) => item && item.id === productId);
      if (existing && Number(existing.quantity) > 1) {
        return list.map((item) =>
          item.id === productId ? { ...item, quantity: Number(item.quantity) - 1 } : item
        );
      }
      return list.filter((item) => item && item.id !== productId);
    });
  };

  const setCartQuantity = (product: Product, quantity: number) => {
    if (!product || !product.id) return;
    const qty = Math.max(0, quantity);
    setCart((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (qty === 0) {
        return list.filter((item) => item && item.id !== product.id);
      }
      const existing = list.find((item) => item && item.id === product.id);
      if (existing) {
        return list.map((item) =>
          item.id === product.id ? { ...item, quantity: qty } : item
        );
      }
      return [...list, { ...product, quantity: qty }];
    });
  };

  const clearCart = () => setCart([]);

  const totalAmount = safeCart.reduce((sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 1), 0);
  const totalItems = safeCart.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cart: safeCart,
        addToCart,
        removeFromCart,
        setCartQuantity,
        clearCart,
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
