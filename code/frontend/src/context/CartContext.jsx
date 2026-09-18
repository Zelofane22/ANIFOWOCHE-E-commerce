import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUTH_LOGIN_EVENT } from "../api/axios.js";
import { validateCart } from "../api/products.js";
import { syncAbandonedCart as syncAbandonedCartApi } from "../api/orders.js";
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
    const delivery = item.deliveryMethod || "delivery";
    return `${item.slug}|${color}|${opts}|${delivery}`;
  };

  const addItem = (product, quantity = 1, deliveryMethod = "delivery") => {
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
        deliveryMethod,
        sellerAddress: product.sellerAddress || "",
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

  const updateQuantity = (slug, quantity, colorName = "", selectedOptions = [], deliveryMethod = "delivery") => {
    if (quantity < 1) return;
    setItems((current) =>
      current.map((item) => {
        const opts = selectedOptions ? JSON.stringify(selectedOptions.map((o) => o.option_id)) : "";
        const delivery = deliveryMethod || "delivery";
        const key = `${slug}|${colorName || ""}|${opts}|${delivery}`;
        return itemKey(item) === key ? { ...item, quantity } : item;
      })
    );
  };

  const removeItem = (slug, colorName = "", selectedOptions = [], deliveryMethod = "delivery") => {
    setItems((current) =>
      current.filter((item) => {
        const opts = selectedOptions ? JSON.stringify(selectedOptions.map((o) => o.option_id)) : "";
        const delivery = deliveryMethod || "delivery";
        const key = `${slug}|${colorName || ""}|${opts}|${delivery}`;
        return itemKey(item) !== key;
      })
    );
  };

  const updateDeliveryMethod = (slug, colorName, selectedOptions, oldDeliveryMethod, newDeliveryMethod) => {
    setItems((current) => {
      const opts = selectedOptions ? JSON.stringify(selectedOptions.map((o) => o.option_id)) : "";
      const oldKey = `${slug}|${colorName || ""}|${opts}|${oldDeliveryMethod}`;
      const itemIndex = current.findIndex((item) => itemKey(item) === oldKey);
      if (itemIndex === -1) return current;
      const item = current[itemIndex];
      // Create new item with updated deliveryMethod (which changes its key)
      const newItem = { ...item, deliveryMethod: newDeliveryMethod };
      // Remove old item and add new one
      return [...current.slice(0, itemIndex), ...current.slice(itemIndex + 1), newItem];
    });
  };

  const clearCart = () => setItems([]);

  // Réconcilie le panier localStorage avec le catalogue live via
  // POST /products/validate-cart/ (un appel léger, pas le catalogue complet).
  // Retry unique après 2 s si le premier appel échoue — évite le 400
  // « Clé primaire … non valide » à la commande (issue JAVASCRIPT-REACT-S).
  const reconcileCart = useCallback(async () => {
    const snapshot = itemsRef.current;
    if (!snapshot || snapshot.length === 0) return;
    const buildPayload = (list) =>
      list.map((item) => ({
        id: item.id,
        slug: item.slug,
        quantity: item.quantity,
        color_name: item.colorName || "",
        color_hex: item.colorHex || "",
        selected_options: item.selectedOptions || [],
        delivery_method: item.deliveryMethod || "delivery",
      }));
    const applyResult = (data) => {
      const validItems = data.valid_items ?? [];
      setItems((current) => {
        const next = validItems.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          price_xof: item.price_xof,
          unit: item.unit,
          size: item.size,
          image: item.image,
          colorName: item.color_name || "",
          colorHex: item.color_hex || "",
          selectedOptions: item.selected_options || [],
          quantity: item.quantity,
          deliveryMethod: item.delivery_method || "delivery",
        }));
        return cartsEqual(next, current) ? current : next;
      });
    };
    try {
      const data = await validateCart(buildPayload(snapshot));
      applyResult(data);
    } catch {
      // 1er échec → retry après 2 s (API temporairement injoignable).
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const data = await validateCart(buildPayload(snapshot));
        applyResult(data);
      } catch {
        // 2 échecs consécutifs : on conserve le panier tel quel.
      }
    }
  }, []);

  // Synchronise le panier vers le backend dès qu'un email est connu, afin de
  // pouvoir relancer le client par email s'il n'a pas finalisé sa commande.
  // Pour les visiteurs anonymes sans email, aucune donnée n'est envoyée.
  const syncAbandonedCart = useCallback(async (email) => {
    const snapshot = itemsRef.current;
    if (!email || !snapshot || snapshot.length === 0) return;
    try {
      await syncAbandonedCartApi({
        email,
        items: snapshot.map((item) => ({
          id: item.id,
          slug: item.slug,
          quantity: item.quantity,
          color_name: item.colorName || "",
          color_hex: item.colorHex || "",
          selected_options: item.selectedOptions || [],
          delivery_method: item.deliveryMethod || "delivery",
        })),
      });
    } catch {
      // La synchronisation est silencieuse : elle ne doit jamais casser l'UX panier.
    }
  }, []);

  // Réconciliation au montage (app reload) et à chaque login/inscription.
  useEffect(() => {
    reconcileCart();
  }, [reconcileCart]);

  useEffect(() => {
    window.addEventListener(AUTH_LOGIN_EVENT, reconcileCart);
    return () => window.removeEventListener(AUTH_LOGIN_EVENT, reconcileCart);
  }, [reconcileCart]);

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
    updateDeliveryMethod,
    clearCart,
    reconcileCart,
    syncAbandonedCart,
    itemCount,
    subtotal,
  };

  return <CartContextValue.Provider value={value}>{children}</CartContextValue.Provider>;
}
