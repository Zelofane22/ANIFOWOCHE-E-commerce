import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import OrdersTableDesktop from "./OrdersTableDesktop.jsx";

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "À traiter" },
];

const orders = [
  { id: 1, full_name: "Awa Dossou", phone: "+22901", status: "received", total_xof: 5000, created_at: "2026-11-10T10:00:00Z", items: [{ quantity: 2 }] },
  { id: 2, full_name: "Koffi Ahou", phone: "+22902", status: "prepared", total_xof: 9000, created_at: "2026-11-12T10:00:00Z", items: [] },
  { id: 3, full_name: "Bio Sanni", status: "delivered", total_xof: 7000, created_at: "2026-11-11T10:00:00Z", items: [] },
  { id: 4, full_name: "Ines Agbo", status: "cancelled", total_xof: 3000, created_at: "2026-11-09T10:00:00Z", items: [] },
];

function renderTable(props = {}) {
  const handlers = { onAdvance: vi.fn(), onCancel: vi.fn(), onFilterChange: vi.fn(), onSearchChange: vi.fn() };
  render(
    <MemoryRouter>
      <OrdersTableDesktop
        orders={orders}
        totalCount={orders.length}
        filters={FILTERS}
        counts={{ all: 4, pending: 1 }}
        filter="all"
        search=""
        {...handlers}
        {...props}
      />
    </MemoryRouter>,
  );
  return handlers;
}

const rowOf = (name) => screen.getByText(name).closest("tr");

describe("OrdersTableDesktop", () => {
  it("affiche une ligne par commande, triée par date décroissante", () => {
    renderTable();
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((r) => within(r).getByText(/^#\d+$/).textContent)).toEqual(["#2", "#3", "#1", "#4"]);
  });

  it("affiche les compteurs de filtres et remonte le filtre choisi", () => {
    const { onFilterChange } = renderTable();
    const tab = screen.getByRole("tab", { name: /À traiter/ });
    expect(tab).toHaveTextContent("1");
    fireEvent.click(tab);
    expect(onFilterChange).toHaveBeenCalledWith("pending");
  });

  it("remonte la recherche saisie", () => {
    const { onSearchChange } = renderTable();
    fireEvent.change(screen.getByPlaceholderText(/Client, téléphone/), { target: { value: "awa" } });
    expect(onSearchChange).toHaveBeenCalledWith("awa");
  });

  it("propose l'étape suivante selon le statut", () => {
    const { onAdvance } = renderTable();
    fireEvent.click(within(rowOf("Awa Dossou")).getByRole("button", { name: /Préparer/ }));
    expect(onAdvance).toHaveBeenCalledWith(orders[0], "prepared");
    fireEvent.click(within(rowOf("Koffi Ahou")).getByRole("button", { name: /Marquer livrée/ }));
    expect(onAdvance).toHaveBeenCalledWith(orders[1], "delivered");
  });

  it("n'autorise l'annulation que pour les commandes reçues ou préparées", () => {
    const { onCancel } = renderTable();
    fireEvent.click(within(rowOf("Awa Dossou")).getByRole("button", { name: "Annuler la commande #1" }));
    expect(onCancel).toHaveBeenCalledWith(orders[0]);
    expect(within(rowOf("Bio Sanni")).queryAllByRole("button")).toHaveLength(0);
    expect(within(rowOf("Ines Agbo")).queryAllByRole("button")).toHaveLength(0);
  });

  it("désactive les actions en maintenance", () => {
    renderTable({ maintenanceMode: true });
    within(rowOf("Awa Dossou"))
      .getAllByRole("button")
      .forEach((button) => expect(button).toBeDisabled());
  });

  it("affiche l'erreur de mise à jour sur la ligne", () => {
    renderTable({ statusErrors: { 2: "Impossible de mettre à jour le statut." } });
    expect(within(rowOf("Koffi Ahou")).getByRole("alert")).toHaveTextContent("Impossible");
  });

  it("affiche un état vide", () => {
    renderTable({ orders: [], totalCount: 0 });
    expect(screen.getByText("Aucune commande reçue")).toBeInTheDocument();
  });
});
