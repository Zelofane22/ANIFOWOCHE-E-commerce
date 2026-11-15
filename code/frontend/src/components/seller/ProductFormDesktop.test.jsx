import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import ProductFormDesktop, { ProductCardPreview } from "./ProductFormDesktop.jsx";

vi.mock("../../context/useAuth.js", () => ({
  useAuth: () => ({ logout: vi.fn(), user: null }),
}));

const baseForm = {
  name: "",
  description: "",
  price_xof: "",
  stock: "",
  category_id: "",
  category_l1_id: "",
  category_l2_id: "",
  unit: "piece",
  size: "UNIQUE",
  is_active: true,
  imageFile: null,
  imagePreview: "",
  colors: [],
};

function makeCtl(overrides = {}) {
  const form = { ...baseForm, ...(overrides.form ?? {}) };
  const infoValid = form.name.trim().length > 0 && !!form.category_id;
  const priceValid = form.price_xof !== "";
  return {
    product: null,
    isEditing: false,
    setForm: vi.fn(),
    submitting: false,
    error: null,
    published: false,
    savedProduct: null,
    pendingGalleryFiles: [],
    setPendingGalleryFiles: vi.fn(),
    maintenanceMode: false,
    productLimit: null,
    createLimitReached: false,
    categoryTree: [],
    selectedCategory: null,
    fieldConfig: { stock: true, unit: true, size: true, colors: true },
    infoValid,
    priceValid,
    isValid: infoValid && priceValid,
    handleCategoryCascadeChange: vi.fn(),
    handleImageChange: vi.fn(),
    handleSubmit: vi.fn(),
    ...overrides,
    form,
  };
}

const renderDesktop = (ctl) =>
  render(
    <MemoryRouter>
      <ProductFormDesktop ctl={ctl} seller={{ plan: "PRO" }} />
    </MemoryRouter>,
  );

describe("ProductCardPreview", () => {
  it("affiche le nom et le prix saisis", () => {
    render(<ProductCardPreview form={{ ...baseForm, name: "Pagne wax", price_xof: "12000" }} categoryName="Mode" />);
    const card = screen.getByTestId("product-card-preview");
    expect(within(card).getByText("Pagne wax")).toBeInTheDocument();
    expect(within(card).getByText("Mode")).toBeInTheDocument();
    expect(within(card).getByText(/12\s000 F/)).toBeInTheDocument();
  });

  it("applique la promotion en cours au prix saisi", () => {
    render(<ProductCardPreview form={{ ...baseForm, name: "Sac", price_xof: "10000" }} discountPercent={20} />);
    const card = screen.getByTestId("product-card-preview");
    expect(within(card).getByText("-20%")).toBeInTheDocument();
    expect(within(card).getByText(/8\s000 F/)).toBeInTheDocument();
    expect(within(card).getByText(/10\s000 F/)).toHaveClass("line-through");
  });

  it("indique un prix non défini et un produit masqué", () => {
    render(<ProductCardPreview form={{ ...baseForm, is_active: false }} />);
    expect(screen.getByText("Prix non défini")).toBeInTheDocument();
    expect(screen.getByText("Masqué")).toBeInTheDocument();
  });
});

describe("ProductFormDesktop", () => {
  it("désactive la publication et liste les champs requis manquants", () => {
    renderDesktop(makeCtl());
    expect(screen.getByRole("button", { name: /Publier/ })).toBeDisabled();
    expect(screen.getByText("nom, catégorie, prix")).toBeInTheDocument();
  });

  it("publie quand le formulaire est complet", () => {
    const ctl = makeCtl({ form: { name: "Pagne", category_id: "3", price_xof: "5000" } });
    renderDesktop(ctl);
    const button = screen.getByRole("button", { name: /Publier/ });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(ctl.handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("bloque l'enregistrement en mode maintenance", () => {
    renderDesktop(makeCtl({ maintenanceMode: true, form: { name: "Pagne", category_id: "3", price_xof: "5000" } }));
    expect(screen.getByRole("button", { name: /Publier/ })).toBeDisabled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("affiche l'en-tête de modification et masque le stock pour un produit sur commande", () => {
    renderDesktop(
      makeCtl({
        isEditing: true,
        product: { slug: "pagne", name: "Pagne wax", discount_percent: 0 },
        selectedCategory: { name: "Couture", is_made_to_order: true },
        fieldConfig: { stock: false, unit: false, size: false, colors: false },
        form: { name: "Pagne wax", category_id: "9", price_xof: "5000" },
      }),
    );
    expect(screen.getByRole("heading", { name: "Modifier le produit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enregistrer/ })).toBeEnabled();
    expect(screen.queryByLabelText("Stock")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voir la fiche/ })).toHaveAttribute("href", "/products/pagne");
  });
});
