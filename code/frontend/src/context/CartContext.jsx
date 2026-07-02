import { useEffect, useMemo, useState } from "react";
import { CartContextValue } from "./cartContextValue.js";
const STORAGE_KEY = "anifowoche_cart";

function readInitialCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readInitialCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.slug === product.slug);
      if (existing) {
        return current.map((item) =>
          item.slug === product.slug
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...current,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price_xof: product.price_xof,
          unit: product.unit,
          size: product.size,
          image: product.image,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (slug, quantity) => {
    if (quantity < 1) return;
    setItems((current) =>
      current.map((item) => (item.slug === slug ? { ...item, quantity } : item))
    );
  };

  const removeItem = (slug) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  };

  const clearCart = () => setItems([]);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price_xof * item.quantity, 0),
    [items]
  );

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
  };

  return <CartContextValue.Provider value={value}>{children}</CartContextValue.Provider>;
}
