import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  createOption,
  createOptionGroup,
  createSellerProduct,
  createSellerProductImage,
  deleteOption,
  deleteOptionGroup,
  deleteSellerProductImage,
  getProductOptionGroups,
  getSellerProductImages,
  updateOption,
  updateOptionGroup,
  updateSellerProduct,
  updateSellerProductImage,
} from "../../api/seller.js";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EditIcon,
  ImageIcon,
  PlusIcon,
  TrashIcon,
} from "../icons.jsx";
import { extractErrorMessage } from "../../utils/apiError.js";
import ProductImage from "../ProductImage.jsx";
import CategoryCascadeSelect from "./CategoryCascadeSelect.jsx";
import { findCategoryPath } from "../../utils/categoryTree.js";

// Configuration des champs par type de catégorie.
// Les catégories de la branche Alimentation n'ont pas de stock/unit/taille/couleurs.
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

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20";

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
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

function AddColorForm({ onAdd }) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [stock, setStock] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !stock) return;
    onAdd({ name: name.trim(), hex, stock: parseInt(stock, 10) || 0 });
    setName("");
    setHex("#000000");
    setStock("");
  };

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="block text-xs font-medium text-ink">
        Couleur
        <input
          type="color"
          value={hex}
          onChange={(event) => setHex(event.target.value)}
          className="mt-1 h-8 w-8 cursor-pointer rounded border border-black/10 p-0"
        />
      </label>
      <label className="block text-xs font-medium text-ink">
        Nom
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Rouge, Bleu..."
          className="mt-1 w-28 rounded-lg border border-black/15 px-2 py-1.5 text-xs outline-none focus:border-brand"
        />
      </label>
      <label className="block text-xs font-medium text-ink">
        Stock
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          placeholder="0"
          className="mt-1 w-16 rounded-lg border border-black/15 px-2 py-1.5 text-xs outline-none focus:border-brand"
        />
      </label>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!name.trim() || !stock}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-light px-2.5 py-1.5 text-xs font-bold text-brand-dark transition hover:bg-brand/20 disabled:opacity-50"
      >
        <PlusIcon size={12} />
        Ajouter
      </button>
    </div>
  );
}

function ProductGallery({ slug, colors }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchImages = useCallback(() => {
    if (!slug) return;
    getSellerProductImages(slug)
      .then((data) => setImages(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("order", String(images.length));
        await createSellerProductImage(slug, fd);
      }
      fetchImages();
    } catch {
      setError("Erreur lors de l'ajout des images.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (imageId) => {
    setError(null);
    try {
      await deleteSellerProductImage(slug, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Erreur lors de la suppression.");
    }
  };

  const handleColorChange = async (imageId, colorName) => {
    const fd = new FormData();
    fd.append("color_name", colorName);
    try {
      await updateSellerProductImage(slug, imageId, fd);
      setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, color_name: colorName } : img)));
    } catch {
      setError("Erreur lors de la mise à jour.");
    }
  };

  const handleReorder = async (imageId, direction) => {
    const sorted = [...images].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((img) => img.id === imageId);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[targetIndex];
    try {
      const fdA = new FormData();
      fdA.append("order", String(b.order));
      const fdB = new FormData();
      fdB.append("order", String(a.order));
      await Promise.all([
        updateSellerProductImage(slug, a.id, fdA),
        updateSellerProductImage(slug, b.id, fdB),
      ]);
      setImages((prev) =>
        prev.map((img) => {
          if (img.id === a.id) return { ...img, order: b.order };
          if (img.id === b.id) return { ...img, order: a.order };
          return img;
        })
      );
    } catch {
      setError("Erreur lors du réordonnancement.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <p className="text-sm text-muted">Chargement des images...</p>
      </div>
    );
  }

  const sorted = [...images].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
      <h3 className="text-base font-bold text-ink">Images du produit</h3>
      <p className="mt-1 text-sm text-muted">
        Ajoutez des photos supplémentaires pour votre galerie produit.
      </p>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {sorted.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((img, index) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-black/10 bg-brand-pale">
              <div className="aspect-square">
                <ProductImage
                  src={img.image}
                  alt={img.alt_text || ""}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleReorder(img.id, "up")}
                  disabled={index === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white disabled:opacity-30"
                  title="Déplacer vers le haut"
                >
                  <ArrowUpIcon size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(img.id, "down")}
                  disabled={index === sorted.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white disabled:opacity-30"
                  title="Déplacer vers le bas"
                >
                  <ArrowDownIcon size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 shadow transition hover:bg-white"
                  title="Supprimer"
                >
                  <TrashIcon size={13} />
                </button>
              </div>
              {colors.length > 0 && (
                <select
                  value={img.color_name || ""}
                  onChange={(event) => handleColorChange(img.id, event.target.value)}
                  className="absolute inset-x-0 top-0 w-full bg-white/90 px-1 py-0.5 text-[10px] font-medium text-ink opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <option value="">Toutes les couleurs</option>
                  {colors.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black/15 bg-surface-raised px-4 py-6 text-sm font-medium text-muted transition hover:border-brand hover:text-brand-dark">
        <PlusIcon size={16} />
        {uploading ? "Ajout en cours..." : "Ajouter des images"}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="sr-only"
        />
      </label>
    </div>
  );
}

function ProductOptionManager({ slug }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroups = useCallback(() => {
    if (!slug) return;
    getProductOptionGroups(slug)
      .then((data) => setGroups(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleAddGroup = async () => {
    setError(null);
    try {
      const group = await createOptionGroup(slug, {
        name: "Nouveau groupe",
        is_required: false,
        min_selections: 1,
        max_selections: 1,
        order: groups.length,
        options: [],
      });
      setGroups((prev) => [...prev, group]);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleUpdateGroup = async (groupId, data) => {
    setError(null);
    try {
      const updated = await updateOptionGroup(slug, groupId, data);
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleDeleteGroup = async (groupId) => {
    setError(null);
    try {
      await deleteOptionGroup(slug, groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleAddOption = async (groupId) => {
    setError(null);
    try {
      const opt = await createOption(slug, groupId, {
        name: "Nouvelle option",
        price_xof: 0,
        is_default: false,
        order: 0,
      });
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, options: [...(g.options || []), opt] } : g))
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleUpdateOption = async (groupId, optionId, data) => {
    setError(null);
    try {
      const updated = await updateOption(slug, groupId, optionId, data);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, options: g.options.map((o) => (o.id === optionId ? updated : o)) }
            : g
        )
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleDeleteOption = async (groupId, optionId) => {
    setError(null);
    try {
      await deleteOption(slug, groupId, optionId);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g
        )
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <p className="text-sm text-muted">Chargement des options...</p>
      </div>
    );
  }

  const groupInput = "w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs outline-none transition focus:border-brand";

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink">Options du plat</h3>
          <p className="mt-1 text-sm text-muted">
            Accompagnements, boissons, niveau de cuisson, suppléments...
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddGroup}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-light px-3 py-2 text-xs font-bold text-brand-dark transition hover:bg-brand/20"
        >
          <PlusIcon size={14} />
          Ajouter un groupe
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {groups.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          Aucune option configurée. Les clients verront uniquement le prix de base.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="rounded-lg border border-black/10 bg-surface-raised p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  type="text"
                  maxLength={100}
                  value={group.name}
                  onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                  className={groupInput}
                  placeholder="Nom du groupe"
                />
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={group.is_required}
                    onChange={(e) => handleUpdateGroup(group.id, { is_required: e.target.checked })}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  Obligatoire
                </label>
                <label className="flex items-center gap-1 text-[11px] font-medium text-ink">
                  Min
                  <input
                    type="number"
                    min="0"
                    value={group.min_selections}
                    onChange={(e) => handleUpdateGroup(group.id, { min_selections: parseInt(e.target.value, 10) || 0 })}
                    className="w-12 rounded border border-black/15 px-1.5 py-0.5 text-xs outline-none"
                  />
                </label>
                <label className="flex items-center gap-1 text-[11px] font-medium text-ink">
                  Max
                  <input
                    type="number"
                    min="0"
                    value={group.max_selections}
                    onChange={(e) => handleUpdateGroup(group.id, { max_selections: parseInt(e.target.value, 10) || 0 })}
                    className="w-12 rounded border border-black/15 px-1.5 py-0.5 text-xs outline-none"
                  />
                  <span className="text-muted">(0=illimité)</span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteGroup(group.id)}
                className="shrink-0 text-red-500 transition hover:text-red-700"
                title="Supprimer le groupe"
              >
                <TrashIcon size={14} />
              </button>
            </div>

            {group.options && group.options.length > 0 && (
              <div className="mt-3 space-y-2">
                {group.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5">
                    <input
                      type="text"
                      maxLength={100}
                      value={opt.name}
                      onChange={(e) => handleUpdateOption(group.id, opt.id, { name: e.target.value })}
                      className="min-w-0 flex-1 rounded border border-black/15 px-2 py-1 text-xs outline-none focus:border-brand"
                      placeholder="Nom de l'option"
                    />
                    <label className="flex items-center gap-1 text-[11px] font-medium text-ink whitespace-nowrap">
                      +<input
                        type="number"
                        min="0"
                        value={opt.price_xof}
                        onChange={(e) => handleUpdateOption(group.id, opt.id, { price_xof: parseInt(e.target.value, 10) || 0 })}
                        className="w-16 rounded border border-black/15 px-1.5 py-0.5 text-xs outline-none"
                      /> CFA
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(group.id, opt.id)}
                      className="shrink-0 text-red-500 transition hover:text-red-700"
                      title="Supprimer l'option"
                    >
                      <TrashIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleAddOption(group.id)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-dark transition hover:text-brand"
            >
              <PlusIcon size={11} />
              Ajouter une option
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductForm({ seller, categoryTree, product, activeProductCount = 0 }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => (product ? formFromProduct(product, categoryTree) : emptyForm));
  const [activeProduct, setActiveProduct] = useState(product ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const editingSlug = activeProduct?.slug ?? null;

  // Limites du plan (null = illimité) exposées par le profil vendeur.
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

  const handleCategoryCascadeChange = (level, value) => {
    setForm((current) => {
      if (level === "l1") {
        return { ...current, category_l1_id: value, category_l2_id: "", category_id: value || "" };
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    if (!form.category_id) {
      setError("Veuillez sélectionner une catégorie.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = buildProductPayload(form, fieldConfig);
      const savedProduct = editingSlug
        ? await updateSellerProduct(editingSlug, payload)
        : await createSellerProduct(payload);
      setActiveProduct(savedProduct);
      setSuccess(editingSlug ? "Produit mis à jour." : "Produit créé.");
      setForm((current) => ({
        ...current,
        imageFile: null,
        imagePreview: savedProduct.image || current.imagePreview,
      }));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {editingSlug ? "Modifier le produit" : "Nouveau produit"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Publiez les articles que les clients verront dans votre boutique.
            </p>
          </div>
          {editingSlug && (
            <button
              type="button"
              onClick={() => navigate("/products/new")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
            >
              <PlusIcon size={15} />
              Créer
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Nom du produit">
            <input
              className={inputClass}
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Pagne wax premium"
            />
          </Field>
          <Field label="Image principale">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex aspect-square w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-brand-pale text-brand-dark">
                {form.imagePreview ? (
                  <ProductImage
                    src={form.imagePreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={24} />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-sm file:font-bold file:text-brand-dark"
              />
            </div>
          </Field>
          <Field label="Description">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Coupe, matière, usage, disponibilité..."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prix XOF">
              <input
                className={inputClass}
                required
                type="number"
                min="0"
                value={form.price_xof}
                onChange={(event) => setForm({ ...form, price_xof: event.target.value })}
              />
            </Field>
            {fieldConfig.stock && (
              <Field label="Stock">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                />
              </Field>
            )}
            <CategoryCascadeSelect
              tree={categoryTree}
              l1Id={form.category_l1_id}
              l2Id={form.category_l2_id}
              l3Id={form.category_id}
              onChange={handleCategoryCascadeChange}
              disabled={submitting}
              inputClass={inputClass}
              className="sm:col-span-2"
            />
            {fieldConfig.unit && (
              <Field label="Unité">
                <select
                  className={inputClass}
                  value={form.unit}
                  onChange={(event) => setForm({ ...form, unit: event.target.value })}
                >
                  <option value="piece">Pièce</option>
                  <option value="metre">Mètre</option>
                </select>
              </Field>
            )}
            {fieldConfig.size && form.unit !== "metre" && (
              <Field label="Taille">
                <select
                  className={inputClass}
                  value={form.size}
                  onChange={(event) => setForm({ ...form, size: event.target.value })}
                >
                  <option value="UNIQUE">Taille unique</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </Field>
            )}
          </div>
          {fieldConfig.colors && (
          <div className="rounded-lg border border-black/10 p-3">
            <p className="text-sm font-semibold text-ink">Couleurs disponibles</p>
            <p className="mt-1 text-xs text-muted">
              Ajoutez les couleurs si votre produit en propose (ex : vêtements, tissus).
            </p>
            {form.colors.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-2">
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">{color.name}</span>
                    <span className="text-xs text-muted">{color.stock} en stock</span>
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({
                        ...current,
                        colors: current.colors.filter((_, i) => i !== index),
                      }))}
                      className="shrink-0 text-red-500 transition hover:text-red-700"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <AddColorForm
              onAdd={(newColor) => setForm((current) => ({
                ...current,
                colors: [...current.colors, newColor],
              }))}
            />
          </div>
          )}
          <label className="flex items-center gap-3 rounded-lg border border-black/10 p-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            Produit visible dans la boutique publique
          </label>
        </div>

        {success && <p role="status" aria-live="polite" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {createLimitReached && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Plan gratuit : maximum {productLimit} produits actifs atteint. Archivez un produit pour en
            publier un nouveau.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || categoryTree.length === 0 || !form.category_id || createLimitReached}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-medium disabled:opacity-60"
        >
          {editingSlug ? <EditIcon size={16} /> : <PlusIcon size={16} />}
          {submitting ? "Enregistrement..." : editingSlug ? "Enregistrer" : "Créer le produit"}
        </button>
      </form>

      {activeProduct && (
        <ProductGallery
          slug={activeProduct.slug}
          colors={form.colors}
        />
      )}
      {activeProduct && (
        <ProductOptionManager slug={activeProduct.slug} />
      )}
    </div>
  );
}
