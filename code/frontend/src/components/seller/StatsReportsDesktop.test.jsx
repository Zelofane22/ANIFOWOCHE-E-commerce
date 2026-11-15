import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import ReportsDesktop from "./ReportsDesktop.jsx";
import StatsDesktop from "./StatsDesktop.jsx";

beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

const products = [
  { id: 1, name: "Pagne wax", revenue: 30000, quantity: 3 },
  { id: 2, name: "Sac en cuir", revenue: 12000, quantity: 1 },
];
const categories = [
  { name: "Mode", total: 30000 },
  { name: "Accessoires", total: 10000 },
];

function renderStats(props = {}) {
  render(
    <MemoryRouter>
      <StatsDesktop
        monthLabel="Novembre 2026"
        revenue={42000}
        averageRevenue={21000}
        orders={4}
        validationRate={75}
        validOrders={3}
        cancelledOrders={1}
        conversionRate="2.5"
        chartData={[{ label: "01", value: 30000 }, { label: "02", value: 12000 }]}
        statusData={[{ name: "Livrées", value: 3, color: "#059669" }]}
        totalStatusOrders={3}
        weekdayData={[]}
        hourData={[]}
        hasActivity={false}
        peakLabel=""
        productData={products}
        categoryData={categories}
        hasAdvancedStats
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("StatsDesktop", () => {
  it("affiche les indicateurs, le top produits et les catégories", () => {
    renderStats();
    expect(screen.getByText("Revenus du mois")).toBeInTheDocument();
    expect(screen.getByText("3 validées · 1 annulée")).toBeInTheDocument();
    expect(screen.getByText("Pagne wax")).toBeInTheDocument();
    expect(screen.getByText("Accessoires")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Passer à Pro" })).not.toBeInTheDocument();
  });

  it("verrouille les statistiques avancées sur l'offre gratuite", () => {
    renderStats({ hasAdvancedStats: false });
    const ctas = screen.getAllByRole("link", { name: "Passer à Pro" });
    expect(ctas).toHaveLength(1);
    expect(ctas[0]).toHaveAttribute("href", "/plan");
    expect(screen.getAllByText("Offre Pro").length).toBeGreaterThan(0);
  });
});

describe("ReportsDesktop", () => {
  function renderReports(props = {}) {
    const handlers = { onDateFromChange: vi.fn(), onDateToChange: vi.fn(), onResetDates: vi.fn() };
    render(
      <MemoryRouter>
        <ReportsDesktop
          periodLabel="30 derniers jours"
          kpi={{ revenue: 42000, orders: 4, conversion_rate: 75, avg_order_value: 10500 }}
          metrics={{ products: 12, pending_orders: 2 }}
          chartData={[]}
          topProducts={products}
          categories={categories}
          dateFrom=""
          dateTo=""
          error={null}
          {...handlers}
          {...props}
        />
      </MemoryRouter>,
    );
    return handlers;
  }

  it("affiche les indicateurs et un état vide pour le graphique", () => {
    renderReports();
    expect(screen.getByText("Panier moyen")).toBeInTheDocument();
    expect(screen.getByText("2 commandes en attente")).toBeInTheDocument();
    expect(screen.getByText("Aucune vente sur cette période.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Réinitialiser" })).not.toBeInTheDocument();
  });

  it("transmet la période personnalisée et sa réinitialisation", () => {
    const handlers = renderReports({ dateFrom: "2026-11-01" });
    fireEvent.change(screen.getByLabelText("Au"), { target: { value: "2026-11-15" } });
    expect(handlers.onDateToChange).toHaveBeenCalledWith("2026-11-15");
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(handlers.onResetDates).toHaveBeenCalled();
  });

  it("affiche l'erreur transmise par la page", () => {
    renderReports({ error: "Export impossible pour le moment." });
    expect(screen.getByRole("alert")).toHaveTextContent("Export impossible pour le moment.");
  });
});
