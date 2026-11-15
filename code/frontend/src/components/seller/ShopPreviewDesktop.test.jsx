import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ShopPreviewDesktop from "./ShopPreviewDesktop.jsx";

describe("ShopPreviewDesktop", () => {
  it("affiche les valeurs saisies (nom, ville, description, zones, lien)", () => {
    render(
      <ShopPreviewDesktop
        name="Atelier Awa"
        city="Cotonou"
        description="Pagnes et accessoires faits main."
        whatsappPhone="+229 01 00 00 00"
        publicUrl="https://anifowoche.com/sellers/atelier-awa"
        isPublished
        deliveryZones={[{ id: 1, name: "Cotonou centre", fee_xof: 1000 }]}
      />,
    );
    expect(screen.getAllByText("Atelier Awa").length).toBeGreaterThan(0);
    expect(screen.getByText("Cotonou")).toBeTruthy();
    expect(screen.getByText("Pagnes et accessoires faits main.")).toBeTruthy();
    expect(screen.getByText(/Cotonou centre/)).toBeTruthy();
    expect(screen.getByText("https://anifowoche.com/sellers/atelier-awa")).toBeTruthy();
    expect(screen.getByText("Visible")).toBeTruthy();
  });

  it("utilise des valeurs par défaut et signale une boutique masquée", () => {
    render(<ShopPreviewDesktop name="  " description="" publicUrl="/sellers/..." isPublished={false} />);
    expect(screen.getAllByText("Ma boutique").length).toBeGreaterThan(0);
    expect(screen.getByText(/Ajoutez une description/)).toBeTruthy();
    expect(screen.getByText("Masquée")).toBeTruthy();
    expect(screen.getByText(/Boutique masquée/)).toBeTruthy();
  });
});
