import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  createSellerProductImage,
  deleteSellerProductImage,
  updateSellerProductImage,
  getSellerProductImages,
} from "../../api/seller.js";
import ProductImage from "../ProductImage.jsx";
import CategoryCascadeSelect from "./CategoryCascadeSelect.jsx";
import {
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

// Blocs de champs du formulaire produit, partagés par les vues mobile et desktop.
// Chaque bloc reçoit `ctl`, l'objet renvoyé par `useProductForm`.

export const inputClass =
  "w-full rounded-[12px] border border-black/12 bg-[#F3F4F6] px-3 py-2.5 text-sm outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/20";

export const labelClass = "block text-sm font-semibold text-[#111827]";

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
          aria-label="Ajouter la couleur"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#C99F08] text-white transition hover:bg-[#A67C06] disabled:opacity-40"
        >
          <PlusIcon size={18} />
        </button>
      </div>
    </div>
  );
}

function PhotoGallery({ slug, colors, maintenanceMode = false }) {
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
    if (maintenanceMode) return;
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const newImages = await Promise.all(
        files.map((file, index) => {
          const fd = new FormData();
          fd.append("image", file);
          fd.append("order", String(images.length + index));
          return createSellerProductImage(slug, fd);
        })
      );
      setImages((prev) => [...prev, ...newImages]);
    } catch {
      setError("Erreur lors de l’ajout des images.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (imageId) => {
    if (maintenanceMode) return;
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
      setError("Erreur lors de la mise à jour.");
    }
  };

  const handleReorder = async (imageId, direction) => {
    if (maintenanceMode) return;
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
        Ajoutez des photos supplémentaires.
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
                  aria-label="Monter l’image"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#111827] shadow transition hover:bg-white disabled:opacity-30"
                >
                  <ArrowUpIcon size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(img.id, "down")}
                  disabled={index === sorted.length - 1}
                  aria-label="Descendre l’image"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#111827] shadow transition hover:bg-white disabled:opacity-30"
                >
                  <ArrowDownIcon size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  aria-label="Supprimer l’image"
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

function PendingGallery({ files, setFiles }) {
  return (
    <div className="rounded-[16px] border border-black/[0.05] bg-white p-5">
      <h3 className="text-base font-bold" style={{ color: "#111827" }}>
        Images supplémentaires
      </h3>
      <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
        Ajoutez des photos supplémentaires. Elles seront envoyées après l&apos;enregistrement du produit.
      </p>
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group relative overflow-hidden rounded-[10px] border border-black/10 bg-[#F3F4F6]"
            >
              <div className="aspect-square">
                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                aria-label="Retirer l’image"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow transition hover:bg-white"
              >
                <TrashIcon size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#C99F08]/30 bg-[#FEF9E7] px-4 py-5 text-sm font-medium transition hover:border-[#C99F08] hover:bg-[#FEF9E7]/80">
        <UploadIcon size={16} style={{ color: "#C99F08" }} />
        <span style={{ color: "#C99F08" }}>Ajouter des images</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? []);
            if (picked.length === 0) return;
            setFiles((prev) => [...prev, ...picked]);
            event.target.value = "";
          }}
          className="sr-only"
        />
      </label>
    </div>
  );
}

/** Galerie : images enregistrées (produit existant) ou en attente d'envoi (création). */
export function GalleryField({ ctl }) {
  return ctl.savedProduct?.slug ? (
    <PhotoGallery
      slug={ctl.savedProduct.slug}
      colors={ctl.form.colors}
      maintenanceMode={ctl.maintenanceMode}
    />
  ) : (
    <PendingGallery files={ctl.pendingGalleryFiles} setFiles={ctl.setPendingGalleryFiles} />
  );
}

export function MainPhotoPicker({ ctl }) {
  const { form } = ctl;
  return (
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
            alt="Aperçu"
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
          onChange={ctl.handleImageChange}
          className="sr-only"
        />
      </label>
    </div>
  );
}

export function PhotoTip() {
  return (
    <div
      className="flex items-start gap-2.5 rounded-[12px] px-3 py-3"
      style={{ backgroundColor: "#FEF9E7" }}
    >
      <InfoIcon size={16} style={{ color: "#C99F08", marginTop: 1, flexShrink: 0 }} />
      <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
        Utilisez une photo claire et bien éclairée. Les produits avec de belles photos se
        vendent mieux !
      </p>
    </div>
  );
}

export function NameField({ ctl }) {
  const { form, setForm } = ctl;
  return (
    <div>
      <label className={labelClass} htmlFor="product-name">
        Nom du produit
      </label>
      <input
        id="product-name"
        type="text"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Pagne wax premium"
        className={`mt-1.5 ${inputClass}`}
      />
    </div>
  );
}

export function CategoryField({ ctl }) {
  const { form } = ctl;
  return (
    <div>
      <label className={labelClass}>
        Catégorie
      </label>
      <div className="mt-1.5">
        <CategoryCascadeSelect
          tree={ctl.categoryTree}
          l1Id={form.category_l1_id}
          l2Id={form.category_l2_id}
          l3Id={form.category_id}
          onChange={ctl.handleCategoryCascadeChange}
          disabled={ctl.submitting}
          inputClass={inputClass}
        />
      </div>
    </div>
  );
}

export function DescriptionField({ ctl }) {
  const { form, setForm } = ctl;
  return (
    <div>
      <label className={labelClass} htmlFor="product-description">
        Description
      </label>
      <textarea
        id="product-description"
        rows={4}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Coupe, matière, usage, disponibilité..."
        className={`mt-1.5 ${inputClass} min-h-[100px] resize-y`}
      />
    </div>
  );
}

export function PriceField({ ctl }) {
  const { form, setForm } = ctl;
  return (
    <div>
      <label className={labelClass} htmlFor="product-price">
        Prix (XOF)
      </label>
      <input
        id="product-price"
        type="number"
        min="0"
        required
        value={form.price_xof}
        onChange={(e) => setForm({ ...form, price_xof: e.target.value })}
        placeholder="0"
        className={`mt-1.5 ${inputClass}`}
      />
    </div>
  );
}

export function StockField({ ctl }) {
  const { form, setForm, fieldConfig } = ctl;
  if (!fieldConfig.stock) return null;
  return (
    <div>
      <label className={labelClass} htmlFor="product-stock">
        Stock
      </label>
      <input
        id="product-stock"
        type="number"
        min="0"
        value={form.stock}
        onChange={(e) => setForm({ ...form, stock: e.target.value })}
        placeholder="0"
        className={`mt-1.5 ${inputClass}`}
      />
    </div>
  );
}

export function UnitField({ ctl }) {
  const { form, setForm, fieldConfig } = ctl;
  if (!fieldConfig.unit) return null;
  return (
    <div>
      <label className={labelClass}>
        Unité
      </label>
      <div className="mt-1.5 flex gap-2">
        {["piece", "metre"].map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setForm({ ...form, unit: u })}
            aria-pressed={form.unit === u}
            className="flex-1 rounded-[10px] border px-4 py-2.5 text-sm font-medium transition"
            style={{
              borderColor: form.unit === u ? "#C99F08" : "rgba(0,0,0,0.1)",
              backgroundColor: form.unit === u ? "#FEF9E7" : "#F3F4F6",
              color: form.unit === u ? "#C99F08" : "#6B7280",
            }}
          >
            {u === "piece" ? "Pièce" : "Mètre"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SizeField({ ctl }) {
  const { form, setForm, fieldConfig } = ctl;
  if (!fieldConfig.size || form.unit === "metre") return null;
  return (
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
            aria-pressed={form.size === s}
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
  );
}

export function ColorsField({ ctl, showLabel = true }) {
  const { form, setForm, fieldConfig } = ctl;
  if (!fieldConfig.colors) return null;
  return (
    <div>
      {showLabel && (
        <label className={labelClass}>
          Couleurs
        </label>
      )}
      <p className={showLabel ? "mt-1 text-xs" : "text-xs"} style={{ color: "#9CA3AF" }}>
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
                aria-label={`Retirer la couleur ${color.name}`}
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
  );
}

export function VisibilityToggle({ ctl }) {
  const { form, setForm } = ctl;
  return (
    <div
      className="flex items-center gap-3 rounded-[12px] border border-black/[0.05] bg-white px-4 py-3"
      style={{ cursor: "pointer" }}
      role="switch"
      aria-checked={form.is_active}
      tabIndex={0}
      onClick={() => setForm({ ...form, is_active: !form.is_active })}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setForm({ ...form, is_active: !form.is_active });
        }
      }}
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
              Masqué
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function LimitNotice({ ctl }) {
  if (!ctl.createLimitReached) return null;
  return (
    <div className="rounded-[10px] bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <p>Vous avez atteint la limite de {ctl.productLimit} produits de votre offre Gratuit.</p>
      <Link to="/plan" className="mt-1 inline-flex font-bold text-[#8B6604] hover:underline">
        Passer à Starter pour gérer jusqu&apos;à 100 produits
      </Link>
    </div>
  );
}

export function MaintenanceAlert({ className = "" }) {
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-amber-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.3 3.3 10.3a2 2 0 0 0 0 2.8l7 7a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8l-7-7a2 2 0 0 0-2.8 0Z" />
      </svg>
      <span>Boutique en maintenance — la création et la modification de produits sont suspendues.</span>
    </div>
  );
}
