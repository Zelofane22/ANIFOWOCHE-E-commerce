import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { fetchCategories } from "../api/products.js";
import {
  archiveSellerProduct,
  createSellerProduct,
  getSellerProducts,
  getSellerProfile,
  updateSellerProduct,
} from "../api/seller.js";
import {
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  PackageIcon,
  PlusIcon,
  TrashIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";
import { optimizedImage } from "../utils/imageUrl.js";

const emptyForm = {
  name: "",
  description: "",
  price_xof: "",
  stock: "",
  category_id: "",
  unit: "piece",
  size: "UNIQUE",
  is_active: true,
  imageFile: null,
  imagePreview: "",
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

function buildProductPayload(form) {
  const payload = new FormData();
  payload.append("name", form.name.trim());
  payload.append("description", form.description.trim());
  payload.append("price_xof", form.price_xof);
  payload.append("stock", form.stock);
  payload.append("category_id", form.category_id);
  payload.append("unit", form.unit);
  payload.append("size", form.unit === "metre" ? "UNIQUE" : form.size);
  payload.append("is_active", form.is_active ? "true" : "false");
  if (form.imageFile) payload.append("image", form.imageFile);
  return payload;
}

function ProductStatus({ product }) {
  if (!product.is_active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
        <EyeOffIcon size={13} />
        Archivé
      </span>
    );
  }
  if ((product.stock ?? 0) <= 0) {
    return <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">Rupture</span>;
  }
  if (product.stock <= 5) {
    return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Stock faible</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
      <EyeIcon size={13} />
      Publié
    </span>
  );
}

export default function SellerProducts() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/seller/login", { replace: true });
      return;
    }
    Promise.all([getSellerProfile(), getSellerProducts(), fetchCategories()])
      .then(([sellerData, productData, categoryData]) => {
        setSeller(sellerData);
        setProducts(productData.results ?? productData);
        const nextCategories = categoryData.results ?? categoryData;
        setCategories(nextCategories);
        if (nextCategories[0]) {
          setForm((current) => ({ ...current, category_id: String(nextCategories[0].id) }));
        }
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/seller/register" : "/seller/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  const activeProducts = useMemo(() => products.filter((product) => product.is_active), [products]);
  const archivedProducts = products.length - activeProducts.length;

  const resetForm = () => {
    setEditingSlug(null);
    setError(null);
    setSuccess(null);
    setForm({
      ...emptyForm,
      category_id: categories[0] ? String(categories[0].id) : "",
    });
  };

  const startEdit = (product) => {
    setEditingSlug(product.slug);
    setError(null);
    setSuccess(null);
    setForm({
      name: product.name,
      description: product.description || "",
      price_xof: String(product.price_xof ?? ""),
      stock: String(product.stock ?? ""),
      category_id: String(product.category?.id ?? ""),
      unit: product.unit || "piece",
      size: product.size || "UNIQUE",
      is_active: product.is_active,
      imageFile: null,
      imagePreview: product.image || "",
    });
    window.scrollTo({ top: 0 });
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
    try {
      const payload = buildProductPayload(form);
      const savedProduct = editingSlug
        ? await updateSellerProduct(editingSlug, payload)
        : await createSellerProduct(payload);
      setProducts((current) => {
        if (!editingSlug) return [savedProduct, ...current];
        return current.map((product) => (product.slug === editingSlug ? savedProduct : product));
      });
      setSuccess(editingSlug ? "Produit mis à jour." : "Produit créé.");
      setEditingSlug(savedProduct.slug);
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

  const handleArchive = async (product) => {
    setError(null);
    setSuccess(null);
    try {
      await archiveSellerProduct(product.slug);
      setProducts((current) =>
        current.map((item) => (item.slug === product.slug ? { ...item, is_active: false } : item))
      );
      if (editingSlug === product.slug) resetForm();
      setSuccess("Produit archivé.");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (loading || !seller) {
    return <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  return (
    <SellerShell title="Produits" seller={seller}>
      <section className="grid gap-5 lg:grid-cols-[390px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
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
                onClick={resetForm}
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
              <div className="flex items-center gap-3">
                <div className="flex aspect-square w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-brand-pale text-brand-dark">
                  {form.imagePreview ? (
                    <img
                      src={optimizedImage(form.imagePreview, 180)}
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
              <Field label="Stock">
                <input
                  className={inputClass}
                  required
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                />
              </Field>
              <Field label="Catégorie">
                <select
                  className={inputClass}
                  required
                  value={form.category_id}
                  onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
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
              {form.unit !== "metre" && (
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

          {success && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting || categories.length === 0}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-medium disabled:opacity-60"
          >
            {editingSlug ? <EditIcon size={16} /> : <PlusIcon size={16} />}
            {submitting ? "Enregistrement..." : editingSlug ? "Enregistrer" : "Créer le produit"}
          </button>
        </form>

        <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Catalogue vendeur</h2>
              <p className="mt-1 text-sm text-muted">
                {activeProducts.length} publié{activeProducts.length > 1 ? "s" : ""} · {archivedProducts} archivé
                {archivedProducts > 1 ? "s" : ""}
              </p>
            </div>
            <Link
              to={seller.shop.public_path}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
            >
              <EyeIcon size={15} />
              Voir la boutique
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center">
              <PackageIcon size={36} className="mx-auto text-muted" />
              <h3 className="mt-3 text-base font-bold text-ink">Aucun produit pour l'instant</h3>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
                Ajoutez vos premiers articles avec un prix, un stock et une catégorie pour rendre la boutique vendable.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {products.map((product) => (
                <article key={product.id} className="grid gap-4 py-4 sm:grid-cols-[82px_1fr_auto] sm:items-center">
                  <div className="aspect-square w-20 overflow-hidden rounded-lg bg-brand-pale">
                    {product.image ? (
                      <img
                        src={optimizedImage(product.image, 180)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-dark">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-ink">{product.name}</h3>
                      <ProductStatus product={product} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {product.category?.name ?? "Sans catégorie"} · {formatXof(product.price_xof)} · Stock {product.stock}
                    </p>
                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
                    >
                      <EditIcon size={15} />
                      Modifier
                    </button>
                    {product.is_active && (
                      <button
                        type="button"
                        onClick={() => handleArchive(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
                      >
                        <TrashIcon size={15} />
                        Archiver
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </SellerShell>
  );
}
