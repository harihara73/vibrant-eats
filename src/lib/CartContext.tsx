 "use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  discount: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalDiscount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i._id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i._id === id);
      if (item && item.quantity + delta < 1) {
        return prev.filter((i) => i._id !== id);
      }
      return prev.map((i) =>
        i._id === id ? { ...i, quantity: i.quantity + delta } : i
      );
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalDiscount = cart.reduce((sum, i) => sum + (i.price * (i.discount / 100)) * i.quantity, 0);
  const total = subtotal - totalDiscount;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalDiscount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
