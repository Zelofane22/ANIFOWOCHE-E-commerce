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

  const itemKey = (item) => {
    const color = item.colorName || "";
    const opts = item.selectedOptions ? JSON.stringify(item.selectedOptions.map((o) => o.option_id)) : "";
    return `${item.slug}|${color}|${opts}`;
  };

  const addItem = (product, quantity = 1) => {
    setItems((current) => {
      const newItem = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price_xof: product.price_xof,
        unit: product.unit,
        size: product.size,
        image: product.image,
        colorName: product.selectedColor ? product.selectedColor.name : "",
        colorHex: product.selectedColor?.hex || "",
        selectedOptions: product.selectedOptions || [],
        quantity,
      };
      const key = itemKey(newItem);
      const existing = current.find((item) => itemKey(item) === key);
      if (existing) {
        return current.map((item) =>
          itemKey(item) === key ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...current, newItem];
    });
  };

  const updateQuantity = (slug, quantity, colorName = "", selectedOptions = []) => {
    if (quantity < 1) return;
    setItems((current) =>
      current.map((item) => {
        const opts = selectedOptions ? JSON.stringify(selectedOptions.map((o) => o.option_id)) : "";
        const key = `${slug}|${colorName || ""}|${opts}`;
        return itemKey(item) === key ? { ...item, quantity } : item;
      })
    );
  };

  const removeItem = (slug, colorName = "", selectedOptions = []) => {
    setItems((current) =>
      current.filter((item) => {
        const opts = selectedOptions ? JSON.stringify(selectedOptions.map((o) => o.option_id)) : "";
        const key = `${slug}|${colorName || ""}|${opts}`;
        return itemKey(item) !== key;
      })
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const optionsExtra = (item.selectedOptions || []).reduce((sum, opt) => sum + (opt.price_xof || 0), 0);
        return total + (item.price_xof + optionsExtra) * item.quantity;
      }, 0),
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
