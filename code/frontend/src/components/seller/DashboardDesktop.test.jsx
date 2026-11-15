import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import DashboardDesktop from "./DashboardDesktop.jsx";

function renderDashboard(overrides = {}) {
  const props = {
    period: "30j",
    onPeriodChange: vi.fn(),
    hideBalance: false,
    onToggleBalance: vi.fn(),
    revenue: 0,
    revenueChangePct: 0,
    ordersCount: 0,
    ordersChangePct: 0,
    pendingCount: 0,
    productsCount: 4,
    chartData: [],
    recentOrders: [],
    lowStock: [
      { id: 1, slug: "pagne-wax", name: "Pagne wax", stock: 2 },
      { id: 2, slug: "sac-raphia", name: "Sac raphia", stock: 0 },
    ],
    plan: "FREE",
    limits: null,
    planMeta: { name: "Gratuit" },
    ...overrides,
  };
  render(
    <MemoryRouter>
      <DashboardDesktop {...props} />
    </MemoryRouter>,
  );
  return props;
}

describe("DashboardDesktop", () => {
  it("affiche un lien Modifier vers chaque produit en stock faible", () => {
    renderDashboard();
    expect(screen.getByRole("link", { name: "Modifier Pagne wax" })).toHaveAttribute("href", "/products/pagne-wax/edit");
    expect(screen.getByRole("link", { name: "Modifier Sac raphia" })).toHaveAttribute("href", "/products/sac-raphia/edit");
    expect(screen.getByRole("link", { name: "Pagne wax" })).toHaveAttribute("href", "/products/pagne-wax");
  });

  it("propose la période 12 mois à la place de 3 mois", () => {
    const props = renderDashboard();
    expect(screen.queryByRole("button", { name: "3 mois" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "12 mois" }));
    expect(props.onPeriodChange).toHaveBeenCalledWith("12m");
  });

  it("libelle l'indicateur produits comme produits actifs", () => {
    renderDashboard();
    expect(screen.getByText("Produits actifs")).toBeInTheDocument();
  });
});
