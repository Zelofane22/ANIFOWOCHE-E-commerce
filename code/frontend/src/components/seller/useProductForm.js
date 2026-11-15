import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  createSellerProduct,
  createSellerProductImage,
  updateSellerProduct,
} from "../../api/seller.js";
import { useStoreStatus } from "../../context/useStoreStatus.js";
import { extractErrorMessage } from "../../utils/apiError.js";
import { findCategoryPath } from "../../utils/categoryTree.js";

const ELECTRONIC_TYPE_SLUGS = [
  "smartphones",
  "phone-cases",
  "chargers",
  "earphones",
  "speakers",
  "computers",
  "pc-accessories",
  "small-appliances",
  "large-appliances",
];

const MADE_TO_ORDER_FIELD_CONFIG = { stock: false, unit: false, size: false, colors: false };

const CATEGORY_FIELD_CONFIG = {
  ...Object.fromEntries(
    ELECTRONIC_TYPE_SLUGS.map((slug) => [
      slug,
      { stock: true, unit: false, size: false, colors: true },
    ])
  ),
};

const DEFAULT_FIELD_CONFIG = { stock: true, unit: true, size: true, colors: true };

const emptyForm = {
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

function formFromProduct(product, categoryTree) {
  const path = findCategoryPath(categoryTree, product.category?.id);
  return {
    name: product.name,
    description: product.description || "",
    price_xof: String(product.price_xof ?? ""),
    stock: String(product.stock ?? ""),
    category_id: String(product.category?.id ?? ""),
    category_l1_id: path?.l1 ? String(path.l1.id) : "",
    category_l2_id: path?.l2 ? String(path.l2.id) : "",
    unit: product.unit || "piece",
    size: product.size || "UNIQUE",
    is_active: product.is_active,
    imageFile: null,
    imagePreview: product.image || "",
    colors: product.colors || [],
  };
}

function buildProductPayload(form, fieldConfig) {
  const payload = new FormData();
  payload.append("name", form.name.trim());
  payload.append("description", form.description.trim());
  payload.append("price_xof", form.price_xof);
  if (fieldConfig.stock) payload.append("stock", form.stock === "" ? "0" : form.stock);
  payload.append("category_id", form.category_id);
  if (fieldConfig.unit) payload.append("unit", form.unit);
  if (fieldConfig.size) payload.append("size", form.unit === "metre" ? "UNIQUE" : form.size);
  payload.append("is_active", form.is_active ? "true" : "false");
  if (form.colors.length > 0) {
    payload.append("colors", JSON.stringify(form.colors));
  }
  if (form.imageFile) payload.append("image", form.imageFile);
  return payload;
}

/**
 * Logique unique du formulaire produit vendeur (création / modification),
 * partagée par la vue mobile (assistant en étapes) et la vue desktop (2 colonnes).
 */
export default function useProductForm({ seller, categoryTree, product, activeProductCount = 0 }) {
  const navigate = useNavigate();
  const isEditing = !!product;
  const [form, setForm] = useState(() =>
    product ? formFromProduct(product, categoryTree) : emptyForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [published, setPublished] = useState(false);
  const [savedProduct, setSavedProduct] = useState(product ?? null);
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState([]);

  const editingSlug = savedProduct?.slug ?? null;
  const { maintenanceMode } = useStoreStatus();

  const productLimit = seller?.limits?.max_products ?? null;
  const createLimitReached =
    productLimit != null && !editingSlug && activeProductCount >= productLimit;

  const selectedCategory = useMemo(() => {
    if (!form.category_id) return null;
    const path = findCategoryPath(categoryTree, form.category_id);
    return (path && (path.l3 ?? path.l2 ?? path.l1)) || null;
  }, [categoryTree, form.category_id]);

  const fieldConfig = selectedCategory?.is_made_to_order
    ? MADE_TO_ORDER_FIELD_CONFIG
    : CATEGORY_FIELD_CONFIG[selectedCategory?.slug] ?? DEFAULT_FIELD_CONFIG;

  const infoValid = form.name.trim().length > 0 && !!form.category_id;
  const priceValid = form.price_xof !== "";

  const handleCategoryCascadeChange = (level, value) => {
    setForm((current) => {
      if (level === "l1") {
        return {
          ...current,
          category_l1_id: value,
          category_l2_id: "",
          category_id: value || "",
        };
      }
      if (level === "l2") {
        return { ...current, category_l2_id: value, category_id: value || "" };
      }
      return { ...current, category_id: value || "" };
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setForm((current) => ({
      ...current,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : current.imagePreview,
    }));
  };

  const handleSubmit = async () => {
    if (maintenanceMode) return;
    setSubmitting(true);
    setError(null);
    if (!form.category_id) {
      setError("Veuillez sélectionner une catégorie.");
      setSubmitting(false);
      return;
    }
    try {
      const payload = buildProductPayload(form, fieldConfig);
      const saved = editingSlug
        ? await updateSellerProduct(editingSlug, payload)
        : await createSellerProduct(payload);
      if (pendingGalleryFiles.length > 0) {
        try {
          await Promise.all(
            pendingGalleryFiles.map((file, index) => {
              const fd = new FormData();
              fd.append("image", file);
              fd.append("order", String(index));
              return createSellerProductImage(saved.slug, fd);
            })
          );
        } catch (uploadErr) {
          setError(extractErrorMessage(uploadErr) || "Erreur lors de l'ajout des images.");
        }
        setPendingGalleryFiles([]);
      }
      setSavedProduct(saved);
      setPublished(true);
      setForm((current) => ({
        ...current,
        imageFile: null,
        imagePreview: saved.image || current.imagePreview,
      }));
      navigate("/products", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    product,
    isEditing,
    form,
    setForm,
    submitting,
    error,
    published,
    savedProduct,
    pendingGalleryFiles,
    setPendingGalleryFiles,
    maintenanceMode,
    productLimit,
    createLimitReached,
    categoryTree,
    selectedCategory,
    fieldConfig,
    infoValid,
    priceValid,
    isValid: infoValid && priceValid,
    handleCategoryCascadeChange,
    handleImageChange,
    handleSubmit,
  };
}
