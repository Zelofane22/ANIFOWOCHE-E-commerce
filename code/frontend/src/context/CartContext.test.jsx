import { act, render } from "@testing-library/react";
import { useContext, useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateCart } from "../api/products.js";
import { CartProvider } from "./CartContext.jsx";
import { CartContextValue } from "./cartContextValue.js";

const STORAGE_KEY = "anifowoche_cart";

vi.mock("../api/products.js", () => ({
  validateCart: vi.fn(),
}));

const baseProduct = {
  id: 1,
  slug: "robe-wax",
  name: "Robe Wax",
  price_xof: 15000,
  unit: "pièce",
  size: "M",
  image: null,
};

const makeProduct = (overrides = {}) => ({ ...baseProduct, ...overrides });

const red = { name: "Rouge", hex: "#ff0000" };
const blue = { name: "Bleu", hex: "#0000ff" };

const option = (option_id, price_xof = 1000) => ({
  option_id,
  option_name: "Grand",
  group_name: "Taille",
  price_xof,
});

const cartRef = { current: null };
function CartProbe() {
  const value = useContext(CartContextValue);
  useEffect(() => {
    cartRef.current = value;
  }, [value]);
  return null;
}

function renderCart() {
  return render(
    <CartProvider>
      <CartProbe />
    </CartProvider>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    validateCart.mockResolvedValue({ valid_items: [] });
  });

  it("addItem ajoute un produit et incrémente itemCount", () => {
    renderCart();

    act(() => cartRef.current.addItem(makeProduct()));

    expect(cartRef.current.items).toHaveLength(1);
    expect(cartRef.current.items[0]).toMatchObject({ slug: "robe-wax", quantity: 1 });
    expect(cartRef.current.itemCount).toBe(1);
  });

  it("addItem sur le même produit incrémente la quantité existante au lieu de dupliquer", () => {
    renderCart();
    const product = makeProduct({ selectedColor: red });

    act(() => {
      cartRef.current.addItem(product);
      cartRef.current.addItem(product);
    });

    expect(cartRef.current.items).toHaveLength(1);
    expect(cartRef.current.items[0].quantity).toBe(2);
    expect(cartRef.current.itemCount).toBe(2);
  });

  it("addItem avec un colorName différent crée une ligne séparée", () => {
    renderCart();

    act(() => {
      cartRef.current.addItem(makeProduct({ selectedColor: red }));
      cartRef.current.addItem(makeProduct({ selectedColor: blue }));
    });

    expect(cartRef.current.items).toHaveLength(2);
    expect(cartRef.current.items.map((item) => item.colorName)).toEqual(["Rouge", "Bleu"]);
    expect(cartRef.current.itemCount).toBe(2);
  });

  it("addItem avec des selectedOptions différents crée une ligne séparée", () => {
    renderCart();

    act(() => {
      cartRef.current.addItem(makeProduct({ selectedOptions: [option(1)] }));
      cartRef.current.addItem(makeProduct({ selectedOptions: [option(2)] }));
    });

    expect(cartRef.current.items).toHaveLength(2);
    expect(cartRef.current.itemCount).toBe(2);
  });

  it("updateQuantity modifie la quantité d'un item existant", () => {
    renderCart();
    act(() => cartRef.current.addItem(makeProduct({ selectedColor: red })));

    act(() => cartRef.current.updateQuantity("robe-wax", 4, "Rouge"));

    expect(cartRef.current.items[0].quantity).toBe(4);
    expect(cartRef.current.itemCount).toBe(4);
  });

  it("updateQuantity ignore les quantités inférieures à 1", () => {
    renderCart();
    act(() => cartRef.current.addItem(makeProduct({ selectedColor: red })));

    act(() => cartRef.current.updateQuantity("robe-wax", 0, "Rouge"));

    expect(cartRef.current.items[0].quantity).toBe(1);
  });

  it("removeItem retire l'item correspondant à slug + colorName + selectedOptions", () => {
    renderCart();
    act(() => {
      cartRef.current.addItem(makeProduct({ selectedColor: red }));
      cartRef.current.addItem(
        makeProduct({
          id: 2,
          slug: "chemise-coton",
          name: "Chemise Coton",
          selectedColor: blue,
        })
      );
    });

    act(() => cartRef.current.removeItem("robe-wax", "Rouge"));

    expect(cartRef.current.items).toHaveLength(1);
    expect(cartRef.current.items[0].slug).toBe("chemise-coton");
  });

  it("removeItem retire l'item avec selectedOptions grâce à la clé slug + colorName + selectedOptions", () => {
    renderCart();
    const selected = [option(3)];
    act(() => {
      cartRef.current.addItem(makeProduct({ selectedOptions: selected }));
      cartRef.current.addItem(makeProduct({ id: 2, slug: "chemise-coton", name: "Chemise Coton" }));
    });

    act(() => cartRef.current.removeItem("robe-wax", "", selected));

    expect(cartRef.current.items).toHaveLength(1);
    expect(cartRef.current.items[0].slug).toBe("chemise-coton");
  });

  it("clearCart vide les items", () => {
    renderCart();
    act(() => cartRef.current.addItem(makeProduct()));

    act(() => cartRef.current.clearCart());

    expect(cartRef.current.items).toEqual([]);
    expect(cartRef.current.itemCount).toBe(0);
  });

  it("subtotal calcule price_xof * quantity plus les selectedOptions, sommé sur tous les items", () => {
    renderCart();

    act(() => {
      cartRef.current.addItem(makeProduct({ price_xof: 1000, selectedColor: red }));
      cartRef.current.addItem(
        makeProduct({
          id: 2,
          slug: "sac-cuir",
          name: "Sac Cuir",
          price_xof: 500,
          selectedColor: blue,
          selectedOptions: [option(1, 200)],
        })
      );
      cartRef.current.addItem(
        makeProduct({
          id: 2,
          slug: "sac-cuir",
          name: "Sac Cuir",
          price_xof: 500,
          selectedColor: blue,
          selectedOptions: [option(1, 200)],
        })
      );
    });

    expect(cartRef.current.subtotal).toBe(1000 + (500 + 200) * 2);
  });

  it("persiste le panier dans localStorage sous la clé anifowoche_cart après chaque mutation", () => {
    renderCart();

    act(() => cartRef.current.addItem(makeProduct()));

    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved).toHaveLength(1);
    expect(saved[0].slug).toBe("robe-wax");

    act(() => cartRef.current.updateQuantity("robe-wax", 3));

    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved[0].quantity).toBe(3);

    act(() => cartRef.current.removeItem("robe-wax"));

    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved).toEqual([]);
  });
});
