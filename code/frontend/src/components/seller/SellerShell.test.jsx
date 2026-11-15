import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { SellerContextValue } from "../../context/sellerContextValue.js";
import SellerShell from "./SellerShell.jsx";

vi.mock("../../context/useAuth.js", () => ({
  useAuth: () => ({ logout: vi.fn(), user: null }),
}));

const sharedSeller = { display_name: "Afi", plan: "FREE", shop: { name: "Afi Wax" } };

function renderShell({ ctx = {}, seller } = {}) {
  const value = { seller: sharedSeller, pendingCount: 0, unreadCount: 0, refresh: vi.fn(), ...ctx };
  return render(
    <MemoryRouter initialEntries={["/settings"]}>
      <SellerContextValue.Provider value={value}>
        <SellerShell seller={seller}>contenu</SellerShell>
      </SellerContextValue.Provider>
    </MemoryRouter>,
  );
}

const sidebar = () => screen.getAllByRole("navigation", { name: "Navigation vendeur" })[0].closest("aside");

describe("SellerShell", () => {
  it("affiche la boutique et l'offre du profil partagé quand la page n'en passe pas", () => {
    renderShell();
    const aside = sidebar();
    expect(within(aside).getByText("Afi Wax")).toBeInTheDocument();
    expect(within(aside).getByText("Plan Gratuit")).toBeInTheDocument();
    expect(within(aside).getByText("Voir les offres")).toBeInTheDocument();
  });

  it("préfère le profil passé par la page (fraîchement modifié)", () => {
    renderShell({ seller: { ...sharedSeller, shop: { name: "Nouveau nom" } } });
    expect(within(sidebar()).getByText("Nouveau nom")).toBeInTheDocument();
  });

  it("affiche les badges commandes à traiter et notifications non lues du contexte", () => {
    renderShell({ ctx: { pendingCount: 3, unreadCount: 120 } });
    const aside = sidebar();
    expect(within(within(aside).getByRole("link", { name: /Commandes/ })).getByText("3")).toBeInTheDocument();
    expect(within(within(aside).getByRole("link", { name: /Notifications/ })).getByText("99+")).toBeInTheDocument();
  });

  it("n'affiche aucun badge à zéro", () => {
    renderShell();
    expect(within(sidebar()).getByRole("link", { name: "Commandes" })).toBeInTheDocument();
    expect(within(sidebar()).getByRole("link", { name: "Notifications" })).toBeInTheDocument();
  });
});
