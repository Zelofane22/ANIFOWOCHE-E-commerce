import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  createSellerProduct,
  createSellerProductImage,
  deleteSellerProductImage,
  updateSellerProduct,
  updateSellerProductImage,
  getSellerProductImages,
} from "../../api/seller.js";
import { extractErrorMessage } from "../../utils/apiError.js";
import ProductImage from "../ProductImage.jsx";
import CategoryCascadeSelect from "./CategoryCascadeSelect.jsx";
import { findCategoryPath } from "../../utils/categoryTree.js";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  InfoIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  UploadIcon,
  EyeOffIcon,
} from "../icons.jsx";

const STEPS = ["Photo", "Infos", "Prix & Stock", "Publication"];

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

const inputClass =
  "w-full rounded-[12px] border border-black/12 bg-[#F3F4F6] px-3 py-2.5 text-sm outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/20";

const labelClass = "block text-sm font-semibold text-[#111827]";

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
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "#6B7280" }}>
            Couleur
          </span>
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-[10px] border border-black/10 p-0"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "#6B7280" }}>
            Nom
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rouge, Bleu..."
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "#6B7280" }}>
            Stock
          </span>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="0"
            className={`w-20 ${inputClass}`}
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim() || !stock}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#C99F08] text-white transition hover:bg-[#A67C06] disabled:opacity-40"
        >
          <PlusIcon size={18} />
        </button>
      </div>
    </div>
  );
}

function PhotoGallery({ slug, colors }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    getSellerProductImages(slug)
      .then((data) => setImages(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

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
      const data = await getSellerProductImages(slug);
      setImages(data.results ?? data);
    } catch {
      setError("Erreur lors de l\u2019ajout des images.");
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
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, color_name: colorName } : img
        )
      );
    } catch {
      setError("Erreur lors de la mise \u00e0 jour.");
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
      setError("Erreur lors du r\u00e9ordonnancement.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-[16px] border border-black/[0.05] bg-white p-5">
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          Chargement des images...
        </p>
      </div>
    );
  }

  const sorted = [...images].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-[16px] border border-black/[0.05] bg-white p-5">
      <h3 className="text-base font-bold" style={{ color: "#111827" }}>
        Images du produit
      </h3>
      <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
        Ajoutez des photos suppl\u00e9mentaires.
      </p>

      {error && (
        <p className="mt-3 rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {sorted.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {sorted.map((img, index) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-[10px] border border-black/10 bg-[#F3F4F6]"
            >
              <div className="aspect-square">
                <ProductImage
                  src={img.image}
                  alt={img.alt_text || ""}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/50 to-transparent p-1.5">
                <button
                  type="button"
                  onClick={() => handleReorder(img.id, "up")}
                  disabled={index === 0}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#111827] shadow transition hover:bg-white disabled:opacity-30"
                >
                  <ArrowUpIcon size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(img.id, "down")}
                  disabled={index === sorted.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#111827] shadow transition hover:bg-white disabled:opacity-30"
                >
                  <ArrowDownIcon size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow transition hover:bg-white"
                >
                  <TrashIcon size={12} />
                </button>
              </div>
              {colors.length > 0 && (
                <select
                  value={img.color_name || ""}
                  onChange={(e) => handleColorChange(img.id, e.target.value)}
                  className="absolute inset-x-0 top-0 w-full bg-white/90 px-1 py-0.5 text-[10px] font-medium text-[#111827]"
                >
                  <option value="">Toutes</option>
                  {colors.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#C99F08]/30 bg-[#FEF9E7] px-4 py-5 text-sm font-medium transition hover:border-[#C99F08] hover:bg-[#FEF9E7]/80">
        <UploadIcon size={16} style={{ color: "#C99F08" }} />
        <span style={{ color: "#C99F08" }}>
          {uploading ? "Ajout en cours..." : "Ajouter des images"}
        </span>
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

export default function ProductFormMobile({
  seller,
  categoryTree,
  product,
  activeProductCount = 0,
}) {
  const navigate = useNavigate();
  const isEditing = !!product;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() =>
    product ? formFromProduct(product, categoryTree) : emptyForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [published, setPublished] = useState(isEditing);
  const [savedProduct, setSavedProduct] = useState(product ?? null);

  const editingSlug = savedProduct?.slug ?? null;

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

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) return form.name.trim().length > 0 && !!form.category_id;
    if (step === 2) return form.price_xof !== "";
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    if (!form.category_id) {
      setError("Veuillez s\u00e9lectionner une cat\u00e9gorie.");
      setSubmitting(false);
      return;
    }
    try {
      const payload = buildProductPayload(form, fieldConfig);
      const saved = editingSlug
        ? await updateSellerProduct(editingSlug, payload)
        : await createSellerProduct(payload);
      setSavedProduct(saved);
      setPublished(true);
      setForm((current) => ({
        ...current,
        imageFile: null,
        imagePreview: saved.image || current.imagePreview,
      }));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepPhoto = () => (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-[16px] border-2 border-dashed p-6 text-center transition"
        style={{
          borderColor: form.imagePreview ? "#C99F08" : "#C99F08/30",
          backgroundColor: form.imagePreview ? "transparent" : "#FEF9E7",
        }}
      >
        {form.imagePreview ? (
          <div className="mx-auto overflow-hidden rounded-[12px]" style={{ maxWidth: 200 }}>
            <ProductImage
              src={form.imagePreview}
              alt="Aper\u00e7u"
              className="aspect-square w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#FEF9E7" }}
            >
              <ImageIcon size={28} style={{ color: "#C99F08" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "#111827" }}>
              Ajoutez une photo
            </p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              Photo principale visible par les clients
            </p>
          </div>
        )}
        <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#A67C06]">
          <UploadIcon size={16} />
          {form.imagePreview ? "Changer la photo" : "Choisir une photo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="sr-only"
          />
        </label>
      </div>

      <div
        className="flex items-start gap-2.5 rounded-[12px] px-3 py-3"
        style={{ backgroundColor: "#FEF9E7" }}
      >
        <InfoIcon size={16} style={{ color: "#C99F08", marginTop: 1, flexShrink: 0 }} />
        <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
          Utilisez une photo claire et bien \u00e9clair\u00e9e. Les produits avec de belles photos se
          vendent mieux !
        </p>
      </div>

      {isEditing && savedProduct && (
        <PhotoGallery slug={savedProduct.slug} colors={form.colors} />
      )}
    </div>
  );

  const renderStepInfos = () => (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>
          Nom du produit
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Pagne wax premium"
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass}>
          Cat\u00e9gorie
        </label>
        <div className="mt-1.5">
          <CategoryCascadeSelect
            tree={categoryTree}
            l1Id={form.category_l1_id}
            l2Id={form.category_l2_id}
            l3Id={form.category_id}
            onChange={handleCategoryCascadeChange}
            disabled={submitting}
            inputClass={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Description
        </label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Coupe, mati\u00e8re, usage, disponibilit\u00e9..."
          className={`mt-1.5 ${inputClass} min-h-[100px] resize-y`}
        />
      </div>
    </div>
  );

  const renderStepPriceStock = () => {
    const price = parseFloat(form.price_xof) || 0;
    const commission = Math.round(price * 0.02);
    const netRevenue = price - commission;

    return (
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>
            Prix (XOF)
          </label>
          <input
            type="number"
            min="0"
            required
            value={form.price_xof}
            onChange={(e) => setForm({ ...form, price_xof: e.target.value })}
            placeholder="0"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        {fieldConfig.stock && (
          <div>
            <label className={labelClass}>
              Stock
            </label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="0"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        )}

        {fieldConfig.unit && (
          <div>
            <label className={labelClass}>
              Unit\u00e9
            </label>
            <div className="mt-1.5 flex gap-2">
              {["piece", "metre"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm({ ...form, unit: u })}
                  className="flex-1 rounded-[10px] border px-4 py-2.5 text-sm font-medium transition"
                  style={{
                    borderColor: form.unit === u ? "#C99F08" : "rgba(0,0,0,0.1)",
                    backgroundColor: form.unit === u ? "#FEF9E7" : "#F3F4F6",
                    color: form.unit === u ? "#C99F08" : "#6B7280",
                  }}
                >
                  {u === "piece" ? "Pi\u00e8ce" : "M\u00e8tre"}
                </button>
              ))}
            </div>
          </div>
        )}

        {fieldConfig.size && form.unit !== "metre" && (
          <div>
            <label className={labelClass}>
              Taille
            </label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {["UNIQUE", "S", "M", "L", "XL"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, size: s })}
                  className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
                  style={{
                    borderColor: form.size === s ? "#C99F08" : "rgba(0,0,0,0.1)",
                    backgroundColor: form.size === s ? "#FEF9E7" : "#F3F4F6",
                    color: form.size === s ? "#C99F08" : "#6B7280",
                  }}
                >
                  {s === "UNIQUE" ? "Unique" : s}
                </button>
              ))}
            </div>
          </div>
        )}

        {fieldConfig.colors && (
          <div>
            <label className={labelClass}>
              Couleurs
            </label>
            <p className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>
              Ajoutez les couleurs si votre produit en propose.
            </p>
            {form.colors.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {form.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-[10px] border border-black/[0.05] bg-white px-3 py-2.5"
                  >
                    <span
                      className="h-6 w-6 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium" style={{ color: "#111827" }}>
                      {color.name}
                    </span>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>
                      {color.stock} en stock
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          colors: current.colors.filter((_, i) => i !== index),
                        }))
                      }
                      className="shrink-0 text-red-500 transition hover:text-red-700"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <AddColorForm
                onAdd={(newColor) =>
                  setForm((current) => ({
                    ...current,
                    colors: [...current.colors, newColor],
                  }))
                }
              />
            </div>
          </div>
        )}

        <div
          className="flex items-center gap-3 rounded-[12px] border border-black/[0.05] bg-white px-4 py-3"
          style={{ cursor: "pointer" }}
          onClick={() => setForm({ ...form, is_active: !form.is_active })}
        >
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition"
            style={{
              borderColor: form.is_active ? "#C99F08" : "rgba(0,0,0,0.2)",
              backgroundColor: form.is_active ? "#C99F08" : "transparent",
            }}
          >
            {form.is_active && <CheckIcon size={12} style={{ color: "white" }} />}
          </div>
          <div className="flex items-center gap-1.5">
            {form.is_active ? (
              <span className="text-sm font-medium" style={{ color: "#111827" }}>
                Visible dans la boutique
              </span>
            ) : (
              <>
                <EyeOffIcon size={14} style={{ color: "#9CA3AF" }} />
                <span className="text-sm font-medium" style={{ color: "#9CA3AF" }}>
                  Masqu\u00e9
                </span>
              </>
            )}
          </div>
        </div>

        {price > 0 && (
          <div
            className="rounded-[16px] border border-black/[0.05] bg-white p-4"
          >
            <h4 className="text-sm font-bold" style={{ color: "#111827" }}>
              Aper\u00e7u financier
            </h4>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#6B7280" }}>
                  Prix de vente
                </span>
                <span className="text-sm font-bold" style={{ color: "#111827" }}>
                  {price.toLocaleString("fr-FR")} XOF
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#6B7280" }}>
                  Commission ANIF (2%)
                </span>
                <span className="text-sm font-semibold" style={{ color: "#EF4444" }}>
                  -{commission.toLocaleString("fr-FR")} XOF
                </span>
              </div>
              <div
                className="my-1 border-t"
                style={{ borderColor: "rgba(0,0,0,0.06)" }}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "#111827" }}>
                  Revenu net
                </span>
                <span className="text-sm font-bold" style={{ color: "#16A34A" }}>
                  {netRevenue.toLocaleString("fr-FR")} XOF
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStepPublication = () => {
    if (published) {
      return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "#DCFCE7" }}
          >
            <CheckIcon size={32} style={{ color: "#16A34A" }} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: "#111827" }}>
            {isEditing ? "Produit mis \u00e0 jour !" : "Produit publi\u00e9 !"}
          </h3>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Votre produit est maintenant {form.is_active ? "visible" : "masqu\u00e9"} dans votre
            boutique.
          </p>
          <button
            type="button"
            onClick={() => navigate("/seller/products")}
            className="mt-2 rounded-[10px] bg-[#C99F08] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#A67C06]"
          >
            Voir mes produits
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold" style={{ color: "#111827" }}>
          R\u00e9capitulatif
        </h3>

        <div
          className="flex items-center gap-4 rounded-[16px] border border-black/[0.05] bg-white p-4"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-[#F3F4F6]">
            {form.imagePreview ? (
              <ProductImage
                src={form.imagePreview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon size={20} style={{ color: "#9CA3AF" }} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" style={{ color: "#111827" }}>
              {form.name || "Sans nom"}
            </p>
            <p className="mt-0.5 text-sm font-semibold" style={{ color: "#C99F08" }}>
              {form.price_xof ? `${parseInt(form.price_xof, 10).toLocaleString("fr-FR")} XOF` : " Prix non d\u00e9fini"}
            </p>
            <div className="mt-1">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: form.is_active ? "#DCFCE7" : "#F3F4F6",
                  color: form.is_active ? "#16A34A" : "#9CA3AF",
                }}
              >
                {form.is_active ? "Actif" : "Masqu\u00e9"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-[16px] border border-black/[0.05] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#6B7280" }}>
              Cat\u00e9gorie
            </span>
            <span className="text-sm font-medium" style={{ color: "#111827" }}>
              {selectedCategory?.name || "Non s\u00e9lectionn\u00e9e"}
            </span>
          </div>
          {fieldConfig.stock && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#6B7280" }}>
                Stock
              </span>
              <span className="text-sm font-medium" style={{ color: "#111827" }}>
                {form.stock || "0"}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#6B7280" }}>
              Visibilit\u00e9
            </span>
            <span className="text-sm font-medium" style={{ color: form.is_active ? "#16A34A" : "#9CA3AF" }}>
              {form.is_active ? "Visible" : "Masqu\u00e9"}
            </span>
          </div>
          {form.colors.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#6B7280" }}>
                Couleurs
              </span>
              <span className="text-sm font-medium" style={{ color: "#111827" }}>
                {form.colors.length}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {createLimitReached && (
          <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Plan gratuit : maximum {productLimit} produits actifs atteint. Archivez un produit pour en
            publier un nouveau.
          </p>
        )}
      </div>
    );
  };

  const stepContent = [renderStepPhoto, renderStepInfos, renderStepPriceStock, renderStepPublication];

  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#F4F4F8" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b px-4 py-3"
        style={{ backgroundColor: "white", borderColor: "rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-3">
          {step > 0 && !published && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition"
              style={{ color: "#111827" }}
            >
              <ChevronLeftIcon size={20} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-base font-bold" style={{ color: "#111827" }}>
              {isEditing ? "Modifier le produit" : "Nouveau produit"}
            </h1>
          </div>
          {step > 0 && !published && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#FEF9E7", color: "#C99F08" }}
            >
              {step + 1}/{STEPS.length}
            </span>
          )}
        </div>
      </div>

      {/* Step indicator dots */}
      {!published && (
        <div className="flex items-center justify-center gap-2 px-4 pt-4 pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition"
                style={{
                  backgroundColor: i <= step ? "#C99F08" : "#E5E7EB",
                  color: i <= step ? "white" : "#9CA3AF",
                }}
              >
                {i < step ? <CheckIcon size={12} /> : i + 1}
              </div>
              <span
                className="text-[11px] font-medium"
                style={{
                  color: i === step ? "#111827" : "#9CA3AF",
                  display: "none",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Step title */}
      {!published && (
        <div className="px-4 pt-2 pb-3">
          <h2 className="text-lg font-bold" style={{ color: "#111827" }}>
            {STEPS[step]}
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
            {step === 0 && "Photo principale du produit"}
            {step === 1 && "D\u00e9crivez votre produit"}
            {step === 2 && "D\u00e9finissez le prix et la disponibilit\u00e9"}
            {step === 3 && "V\u00e9rifiez et publiez"}
          </p>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {stepContent[step]()}
      </div>

      {/* Sticky bottom CTA */}
      {!published && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3"
          style={{ backgroundColor: "white", borderColor: "rgba(0,0,0,0.06)" }}
        >
          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center justify-center gap-1.5 rounded-[10px] border px-4 py-3 text-sm font-semibold transition"
                style={{
                  borderColor: "rgba(0,0,0,0.12)",
                  color: "#111827",
                }}
              >
                <ChevronLeftIcon size={16} />
                Retour
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (step < STEPS.length - 1) {
                  setStep((s) => s + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={
                submitting ||
                !canContinue() ||
                (step === STEPS.length - 1 && createLimitReached)
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-[10px] py-3 text-sm font-bold text-white transition disabled:opacity-60"
              style={{
                backgroundColor: submitting ? "#A67C06" : "#C99F08",
              }}
            >
              {step < STEPS.length - 1 ? (
                <>
                  Continuer
                  <ChevronRightIcon size={16} />
                </>
              ) : submitting ? (
                "Publication..."
              ) : (
                <>
                  <CheckIcon size={16} />
                  Publier
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
