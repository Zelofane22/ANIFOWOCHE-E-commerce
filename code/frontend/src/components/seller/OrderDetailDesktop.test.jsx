import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import OrderDetailDesktop from "./OrderDetailDesktop.jsx";

const baseOrder = {
  id: 42,
  full_name: "Awa Dossou",
  phone: "+229 01 02 03 04",
  email: "awa@example.com",
  address: "Rue 12",
  city: "Cotonou",
  status: "received",
  discount_xof: 500,
  coupon_code: "BIENVENUE",
  delivery_zone: { id: 1, name: "Cotonou centre", fee_xof: 1000 },
  total_xof: 10500,
  created_at: "2026-11-10T10:00:00Z",
  updated_at: "2026-11-10T10:00:00Z",
  items: [
    { id: 1, product_name: "Pagne wax", quantity: 2, unit_price_xof: 3000, subtotal_xof: 6000, color_name: "Rouge", color_hex: "#f00", selected_options: [], delivery_method: "delivery" },
    { id: 2, product_name: "Sac tressé", quantity: 1, unit_price_xof: 4000, subtotal_xof: 4000, selected_options: [{ group_name: "Taille", option_name: "M" }], delivery_method: "delivery" },
  ],
  payment_info: { status: "pending", method: "mtn", amount_xof: 10500, updated_at: "2026-11-10T10:05:00Z" },
};

function renderDetail(props = {}) {
  const handlers = {
    onStatusSelectionChange: vi.fn(),
    onSubmitStatus: vi.fn(),
    onConfirmPayment: vi.fn(),
    onRelaunchPayment: vi.fn(),
  };
  render(
    <MemoryRouter>
      <OrderDetailDesktop order={baseOrder} statusSelection={baseOrder.status} {...handlers} {...props} />
    </MemoryRouter>,
  );
  return handlers;
}

describe("OrderDetailDesktop", () => {
  it("affiche les articles et le récapitulatif des montants", () => {
    renderDetail();
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Pagne wax")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Taille : M")).toBeInTheDocument();
    expect(screen.getByText("Remise (BIENVENUE)")).toBeInTheDocument();
    expect(screen.getByText("Livraison · Cotonou centre")).toBeInTheDocument();
    expect(screen.getByText("Sous-total articles").nextSibling).toHaveTextContent(/10\s000 F/);
  });

  it("affiche l'historique avec l'annulation et son motif", () => {
    renderDetail({
      order: { ...baseOrder, status: "cancelled", cancelled_at: "2026-11-11T09:00:00Z", cancellation_reason: "Rupture" },
      statusSelection: "cancelled",
    });
    expect(screen.getByText("Commande annulée")).toBeInTheDocument();
    expect(screen.getByText("Motif : Rupture")).toBeInTheDocument();
    expect(screen.queryByText("Livrée", { selector: "li p" })).not.toBeInTheDocument();
  });

  it("remonte le changement de statut et le bouton de mise à jour", () => {
    const { onStatusSelectionChange, onSubmitStatus } = renderDetail({ statusSelection: "prepared" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "delivered" } });
    expect(onStatusSelectionChange).toHaveBeenCalledWith("delivered");
    fireEvent.click(screen.getByRole("button", { name: "Mettre à jour le statut" }));
    expect(onSubmitStatus).toHaveBeenCalled();
  });

  it("propose l'annulation quand « Annulée » est choisi", () => {
    renderDetail({ statusSelection: "cancelled" });
    expect(screen.getByRole("button", { name: "Annuler la commande…" })).toBeEnabled();
  });

  it("désactive les actions en maintenance", () => {
    renderDetail({ maintenanceMode: true, statusSelection: "prepared" });
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mettre à jour le statut" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Confirmer le paiement reçu/ })).toBeDisabled();
  });

  it("confirme un paiement en attente", () => {
    const { onConfirmPayment } = renderDetail();
    fireEvent.click(screen.getByRole("button", { name: /Confirmer le paiement reçu/ }));
    expect(onConfirmPayment).toHaveBeenCalled();
  });

  it("relance un paiement échoué et affiche le nouveau lien", () => {
    const { onRelaunchPayment } = renderDetail({
      order: { ...baseOrder, payment_info: { ...baseOrder.payment_info, status: "failed" } },
      relaunchResult: { success: true, payment_url: "https://pay.example/x" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Relancer le paiement$/ }));
    expect(onRelaunchPayment).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Nouveau lien de paiement/ })).toHaveAttribute("href", "https://pay.example/x");
  });

  it("affiche le client, l'adresse et les liens de contact", () => {
    renderDetail();
    expect(screen.getByText("awa@example.com")).toBeInTheDocument();
    expect(screen.getByText("Rue 12, Cotonou")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Appeler/ })).toHaveAttribute("href", "tel:+229 01 02 03 04");
    expect(screen.getByRole("link", { name: /^WhatsApp$/ }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/22901020304\?text=/);
  });
});
