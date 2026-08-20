import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAddresses } from "../api/addresses.js";
import { createDelivery, fetchDeliverySlots, fetchDeliveryZones } from "../api/delivery.js";
import { createOrder } from "../api/orders.js";
import { initiatePayment } from "../api/payments.js";
import { validateCoupon } from "../api/promotions.js";
import { fetchStoreStatus } from "../api/store.js";
import { AuthContextValue } from "../context/authContextValue.js";
import { CartContextValue } from "../context/cartContextValue.js";
import { openFedapayCheckout } from "../utils/fedapay.js";
import Checkout from "./Checkout.jsx";

vi.mock("../api/orders.js", () => ({
  createOrder: vi.fn(),
}));

vi.mock("../api/payments.js", () => ({
  initiatePayment: vi.fn(),
}));

vi.mock("../api/delivery.js", () => ({
  fetchDeliveryZones: vi.fn(),
  fetchDeliverySlots: vi.fn(),
  createDelivery: vi.fn(),
  geolocateZone: vi.fn(),
}));

vi.mock("../api/store.js", () => ({
  fetchStoreStatus: vi.fn(),
}));

vi.mock("../api/addresses.js", () => ({
  getAddresses: vi.fn(),
}));

vi.mock("../api/promotions.js", () => ({
  validateCoupon: vi.fn(),
}));

vi.mock("../utils/fedapay.js", () => ({
  openFedapayCheckout: vi.fn(),
}));

vi.mock("../components/Seo.jsx", () => ({
  default: () => null,
}));

vi.mock("../components/ProductImage.jsx", () => ({
  default: ({ src, alt }) => <img src={src} alt={alt} />,
}));

const cartValue = {
  items: [
    {
      id: 1,
      slug: "robe-wax",
      name: "Robe Wax",
      price_xof: 15000,
      unit: "pièce",
      size: "M",
      image: null,
      colorName: "Rouge",
      colorHex: "#ff0000",
      selectedOptions: [],
      quantity: 1,
    },
  ],
  subtotal: 15000,
  itemCount: 1,
  addItem: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  reconcileCart: vi.fn(),
};

const authValue = {
  user: null,
  loading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

function ConfirmationStub() {
  return <p>Confirmation affichée</p>;
}

function renderCheckout() {
  return render(
    <AuthContextValue.Provider value={authValue}>
      <CartContextValue.Provider value={cartValue}>
        <MemoryRouter initialEntries={["/commande"]}>
          <Routes>
            <Route path="/commande" element={<Checkout />} />
            <Route path="/commande/confirmation" element={<ConfirmationStub />} />
          </Routes>
        </MemoryRouter>
      </CartContextValue.Provider>
    </AuthContextValue.Provider>
  );
}

async function fillDeliveryForm() {
  await screen.findByRole("combobox", { name: /Quartier/ });
  fireEvent.change(screen.getByLabelText("Nom complet"), { target: { value: "Fofo" } });
  fireEvent.change(screen.getByLabelText(/Téléphone/), { target: { value: "+229 01 00 00 00" } });
}

async function goToPaymentStep() {
  await fillDeliveryForm();
  fireEvent.click(screen.getByRole("button", { name: "Continuer vers le paiement" }));
}

async function submitOrder() {
  const buttons = screen.getAllByRole("button", { name: /Commander/ });
  fireEvent.click(buttons[0]);
}

describe("Checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDeliveryZones.mockResolvedValue({ results: [{ id: 1, name: "Cotonou", fee_xof: 1000 }] });
    fetchDeliverySlots.mockResolvedValue({ results: [{ id: 1, label: "Matin", start_time: "08:00:00", end_time: "12:00:00" }] });
    fetchStoreStatus.mockResolvedValue({
      online_payment_enabled: true,
      payment_methods: { mtn: true, moov: true, card: true, cash_on_delivery: true },
    });
    getAddresses.mockResolvedValue({ results: [] });
    createOrder.mockResolvedValue({ id: 42, total_xof: 15000 });
    createDelivery.mockResolvedValue({ id: 7 });
    initiatePayment.mockResolvedValue({ id: 99, status: "cash_on_delivery", payment_url: null });
    openFedapayCheckout.mockResolvedValue("approved");
  });

  it("affiche le formulaire de livraison et les items du panier au rendu initial", async () => {
    renderCheckout();

    expect(screen.getByRole("heading", { name: "Adresse de livraison" })).toBeInTheDocument();
    expect(screen.getByText("Votre commande")).toBeInTheDocument();
    expect(screen.getByText("Robe Wax")).toBeInTheDocument();
    expect(screen.getByText("Sous-total")).toBeInTheDocument();

    await screen.findByRole("combobox", { name: /Quartier/ });
    expect(screen.getByRole("option", { name: /Cotonou/ })).toBeInTheDocument();
  });

  it("soumet la commande avec le bon payload (items) et redirige vers la confirmation", async () => {
    renderCheckout();
    await goToPaymentStep();
    await submitOrder();

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    expect(createOrder).toHaveBeenCalledWith({
      full_name: "Fofo",
      phone: "+229 01 00 00 00",
      email: "",
      address: "Cotonou — créneau : Matin",
      city: "Cotonou",
      coupon_code: "",
      items: [{ product_id: 1, quantity: 1, color_name: "Rouge", color_hex: "#ff0000", selected_options: [] }],
    });

    expect(createDelivery).toHaveBeenCalledWith({ order_id: 42, zone_id: 1, slot_id: 1 });
    expect(initiatePayment).toHaveBeenCalledWith({ order_id: 42, method: "cash_on_delivery" });
    expect(cartValue.clearCart).toHaveBeenCalled();

    expect(await screen.findByText("Confirmation affichée")).toBeInTheDocument();
  });

  it("inclut coupon_code dans le payload quand un coupon est appliqué", async () => {
    renderCheckout();
    await fillDeliveryForm();

    fireEvent.click(screen.getByRole("button", { name: "Vous avez un code promo ?" }));
    validateCoupon.mockResolvedValue({ code: "PROMO10", discount_percent: 10 });
    fireEvent.change(screen.getByPlaceholderText("Code coupon"), { target: { value: "PROMO10" } });
    fireEvent.click(screen.getByRole("button", { name: "Appliquer" }));

    await waitFor(() => expect(validateCoupon).toHaveBeenCalledWith("PROMO10"));

    fireEvent.click(screen.getByRole("button", { name: "Continuer vers le paiement" }));
    await submitOrder();

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ coupon_code: "PROMO10" })
    );
  });

  it("affiche une erreur quand la soumission de la commande échoue", async () => {
    createOrder.mockRejectedValue({ response: { data: { detail: "Stock insuffisant pour la robe" } } });

    renderCheckout();
    await goToPaymentStep();
    await submitOrder();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Stock insuffisant pour la robe");
    expect(screen.queryByText("Confirmation affichée")).not.toBeInTheDocument();
  });
});
