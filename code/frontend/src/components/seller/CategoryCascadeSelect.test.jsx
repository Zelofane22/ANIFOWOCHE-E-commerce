import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import CategoryCascadeSelect from "./CategoryCascadeSelect.jsx";
import { findCategoryPath } from "../../utils/categoryTree.js";

const tree = [
  {
    id: 1,
    name: "Femmes",
    slug: "women",
    children: [
      {
        id: 11,
        name: "Vêtements",
        slug: "clothing",
        children: [
          { id: 111, name: "Robes", slug: "dresses" },
          { id: 112, name: "Hauts", slug: "tops" },
        ],
      },
      {
        id: 12,
        name: "Chaussures",
        slug: "shoes",
        children: [{ id: 121, name: "Sandales", slug: "sandals" }],
      },
    ],
  },
  {
    id: 2,
    name: "Hommes",
    slug: "men",
    children: [
      {
        id: 21,
        name: "Vêtements",
        slug: "clothing",
        children: [{ id: 211, name: "Chemises", slug: "shirts" }],
      },
    ],
  },
];

function StatefulSelect() {
  const [ids, setIds] = useState({ l1: "", l2: "", l3: "" });

  const handleChange = (level, value) => {
    setIds((current) => {
      if (level === "l1") {
        return { l1: value, l2: "", l3: "" };
      }
      if (level === "l2") {
        return { ...current, l2: value, l3: "" };
      }
      return { ...current, l3: value };
    });
  };

  return (
    <CategoryCascadeSelect
      tree={tree}
      l1Id={ids.l1}
      l2Id={ids.l2}
      l3Id={ids.l3}
      onChange={handleChange}
      disabled={false}
      inputClass="input"
    />
  );
}

describe("CategoryCascadeSelect", () => {
  it("affiche les 3 niveaux de sélection", () => {
    render(<StatefulSelect />);
    expect(screen.getByLabelText("Catégorie")).toBeInTheDocument();
    expect(screen.getByLabelText("Sous-catégorie")).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
  });

  it("peuple la sous-catégorie et le type au fur et à mesure", () => {
    render(<StatefulSelect />);

    fireEvent.change(screen.getByLabelText("Catégorie"), {
      target: { value: "1" },
    });
    expect(screen.getByLabelText("Sous-catégorie")).toHaveValue("");
    expect(screen.getByText("Vêtements")).toBeInTheDocument();
    expect(screen.getByText("Chaussures")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Sous-catégorie"), {
      target: { value: "11" },
    });
    expect(screen.getByText("Robes")).toBeInTheDocument();
    expect(screen.getByText("Hauts")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "112" },
    });
    expect(screen.getByLabelText("Type")).toHaveValue("112");
  });

  it("réinitialise les niveaux enfants quand le parent change", () => {
    render(<StatefulSelect />);

    fireEvent.change(screen.getByLabelText("Catégorie"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Sous-catégorie"), {
      target: { value: "11" },
    });
    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "112" },
    });

    fireEvent.change(screen.getByLabelText("Catégorie"), {
      target: { value: "2" },
    });

    expect(screen.getByLabelText("Sous-catégorie")).toHaveValue("");
    expect(screen.getByLabelText("Type")).toHaveValue("");
    expect(screen.queryByText("Robes")).not.toBeInTheDocument();
    expect(screen.getByText("Vêtements")).toBeInTheDocument();
  });

  it("appelle onChange avec le niveau et la valeur", () => {
    const onChange = vi.fn();
    render(
      <CategoryCascadeSelect
        tree={tree}
        l1Id=""
        l2Id=""
        l3Id=""
        onChange={onChange}
        disabled={false}
        inputClass="input"
      />
    );

    fireEvent.change(screen.getByLabelText("Catégorie"), {
      target: { value: "1" },
    });
    expect(onChange).toHaveBeenCalledWith("l1", "1");
  });
});

describe("findCategoryPath", () => {
  it("retourne le chemin complet d'une feuille", () => {
    const path = findCategoryPath(tree, 112);
    expect(path.l1.name).toBe("Femmes");
    expect(path.l2.name).toBe("Vêtements");
    expect(path.l3.name).toBe("Hauts");
  });

  it("retourne null si aucun id", () => {
    expect(findCategoryPath(tree, "")).toBeNull();
    expect(findCategoryPath(tree, null)).toBeNull();
  });
});
