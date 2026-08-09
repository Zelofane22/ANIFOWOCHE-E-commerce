import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchProducts } from "../api/products.js";
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

// Vrai si deux paniers sont identiques (on évite les re-render inutiles).
function cartsEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((item, i) => JSON.stringify(item) === JSON.stringify(b[i]));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readInitialCart);
  // Ref miroir des items pour lire la valeur courante dans reconcileCart
  // sans dépendance au tableau items (callback stable au montage).
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
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

  // Réconcilie le panier localStorage avec le catalogue live : met à jour
  // id/prix/image des produits existants et retire ceux qui ne sont plus au
  // catalogue (produit supprimé/désactivé). Évite le 400 « Clé primaire … non
  // valide » à la commande (issue JAVASCRIPT-REACT-S). Sans effet si le panier
  // est vide ou si l'API est injoignable (on garde le panier tel quel).
  const reconcileCart = useCallback(async () => {
    const snapshot = itemsRef.current;
    if (!snapshot || snapshot.length === 0) return;
    try {
      const data = await fetchProducts({ page_size: 200 });
      const results = Array.isArray(data) ? data : data?.results ?? [];
      const bySlug = new Map(results.map((p) => [p.slug, p]));
      setItems((current) => {
        const next = [];
        for (const item of current) {
          const live = bySlug.get(item.slug);
          if (!live) continue;
          next.push({
            ...item,
            id: live.id,
            name: live.name,
            price_xof: live.price_xof,
            unit: live.unit,
            size: live.size,
            image: live.image,
          });
        }
        return cartsEqual(next, current) ? current : next;
      });
    } catch {
      // Catalogue injoignable : on conserve le panier en l'état.
    }
  }, []);

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
    reconcileCart,
    itemCount,
    subtotal,
  };

  return <CartContextValue.Provider value={value}>{children}</CartContextValue.Provider>;
}
