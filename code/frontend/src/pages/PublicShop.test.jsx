import { render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicShop } from "../api/seller.js";
import PublicShop from "./PublicShop.jsx";

vi.mock("../api/seller.js", () => ({
  getPublicShop: vi.fn(),
}));

const shop = {
  id: 1,
  slug: "atelier-fofo",
  name: "Atelier Fofo",
  description: "Tissus wax et broderies à Cotonou",
  city: "Cotonou",
  delivery_zones: [],
  products: [],
};

function renderShop() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/atelier-fofo"]}>
        <Routes>
          <Route path="/:slug" element={<PublicShop />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("PublicShop — meta tags SEO", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.head.innerHTML = "";
  });

  it("rend <Seo> avec le nom de la boutique une fois la boutique chargée", async () => {
    getPublicShop.mockResolvedValue(shop);
    renderShop();

    await screen.findByRole("heading", { level: 1, name: shop.name });

    await waitFor(() => {
      expect(document.title).toBe(`${shop.name} — ANIFOWOCHE`);
    });
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      "content",
      `${shop.name} — ANIFOWOCHE`
    );
    expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute(
      "content",
      shop.description
    );
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `https://anifowoche.com/${shop.slug}`
    );
  });

  it("n'injecte pas les meta de la boutique tant qu'elle n'est pas chargée", () => {
    getPublicShop.mockReturnValue(new Promise(() => {}));
    renderShop();

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
    expect(document.title).not.toBe(`${shop.name} — ANIFOWOCHE`);
  });
});
