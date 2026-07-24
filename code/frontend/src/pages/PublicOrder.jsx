import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { createOrder } from "../api/orders.js";
import { fetchProducts } from "../api/products.js";
import Seo from "../components/Seo.jsx";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";
import { optimizedImage } from "../utils/imageUrl.js";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  email: "",
  city: "Cotonou",
  address: "",
  notes: "",
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/15 px-4 py-3 text-sm text-ink placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

export default function PublicOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts({ stock__gt: 0, ordering: "-created_at" })
      .then((data) => setProducts((data.results ?? data).slice(0, 24)))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const selectedItems = useMemo(
    () =>
      products
        .map((product) => ({ product, quantity: quantities[product.id] ?? 0 }))
        .filter((item) => item.quantity > 0),
    [products, quantities]
  );

  const total = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + item.product.price_xof * item.quantity,
        0
      ),
    [selectedItems]
  );

  const canSubmit = Boolean(
    selectedItems.length > 0 &&
      form.fullName.trim() &&
      form.phone.trim() &&
      form.address.trim() &&
      !submitting
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateQuantity = (productId, nextQuantity) => {
    setQuantities((current) => {
      const product = products.find((item) => item.id === productId);
      const maxQuantity = product?.stock ?? Number.MAX_SAFE_INTEGER;
      const quantity = Math.min(maxQuantity, Math.max(0, Number(nextQuantity) || 0));
      if (quantity === 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: quantity };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    const addressParts = [
      form.address.trim(),
      form.notes.trim() ? `Indications : ${form.notes.trim()}` : "",
    ].filter(Boolean);

    try {
      const order = await createOrder({
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim() || "Cotonou",
        address: addressParts.join(" — "),
        items: selectedItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });

      navigate("/commande/confirmation", {
        state: {
          orderId: order.id,
          total: order.total_xof,
          paymentStatus: "cash_on_delivery",
          method: "cash_on_delivery",
        },
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <Seo
        title="Commander"
        description="Passez une commande ANIFOWOCHE sans créer de compte, avec livraison à Cotonou."
        path="/commande/public"
      />

      <section className="border-b border-black/10 bg-brand-pale">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">
                Commande rapide
              </p>
              <h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">
                Formulaire de commande public
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Sélectionnez les articles, laissez vos coordonnées, puis l'équipe confirme la
                disponibilité et la livraison.
              </p>
            </div>
            <Link
              to="/catalogue"
              className="inline-flex items-center justify-center rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">Articles</h2>
                <p className="mt-1 text-sm text-muted">Ajoutez au moins un produit à la commande.</p>
              </div>
              <p className="text-sm font-semibold text-ink">
                {loading ? "…" : `${products.length} disponible${products.length > 1 ? "s" : ""}`}
              </p>
            </div>

            {loading ? (
              <div className="mt-5 rounded-lg border border-black/10 px-4 py-10 text-center text-sm text-muted">
                Chargement des produits…
              </div>
            ) : products.length === 0 ? (
              <div className="mt-5 rounded-lg border border-black/10 px-4 py-10 text-center text-sm text-muted">
                Aucun produit en stock pour le moment.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {products.map((product) => {
                  const quantity = quantities[product.id] ?? 0;
                  return (
                    <article
                      key={product.id}
                      className={`flex gap-3 rounded-lg border p-3 transition ${
                        quantity > 0 ? "border-brand bg-brand-pale" : "border-black/10 bg-white"
                      }`}
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-brand-pale">
                        {product.image ? (
                          <img
                            src={optimizedImage(product.image, 180)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-semibold text-brand-dark">
                            ANIF
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-ink">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-sm font-bold text-ink">{formatXof(product.price_xof)}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/15 text-lg font-semibold text-ink transition hover:border-brand disabled:text-gray-400"
                            disabled={quantity === 0}
                            aria-label={`Retirer ${product.name}`}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={product.stock}
                            value={quantity}
                            onChange={(event) => updateQuantity(product.id, event.target.value)}
                            className="h-9 w-16 rounded-lg border border-black/15 text-center text-sm font-semibold text-ink focus:border-brand focus:outline-none"
                            aria-label={`Quantité ${product.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-lg font-semibold text-white transition hover:bg-brand-medium"
                            aria-label={`Ajouter ${product.name}`}
                          >
                            +
                          </button>
                          <span className="text-xs text-muted">Stock {product.stock}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">Coordonnées</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-ink">
                Nom complet
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateForm("fullName", event.target.value)}
                  required
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Téléphone WhatsApp
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  required
                  placeholder="+229 01 XX XX XX XX"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="optionnel"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Ville
                <input
                  type="text"
                  value={form.city}
                  onChange={(event) => updateForm("city", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-semibold text-ink md:col-span-2">
                Adresse de livraison
                <input
                  type="text"
                  value={form.address}
                  onChange={(event) => updateForm("address", event.target.value)}
                  required
                  placeholder="Quartier, rue, repère proche"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-semibold text-ink md:col-span-2">
                Indications complémentaires
                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  rows={3}
                  placeholder="Créneau souhaité, taille à vérifier, consigne de livraison..."
                  className={`${inputClass} resize-none`}
                />
              </label>
            </div>
          </section>
        </div>

        <aside>
          <div className="sticky top-24 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-ink">Récapitulatif</h2>
            {selectedItems.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-muted">
                Les articles sélectionnés apparaîtront ici avant l'envoi.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {selectedItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0 text-muted">
                      {quantity} x <span className="text-ink">{product.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-ink">
                      {formatXof(product.price_xof * quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 border-t border-black/10 pt-4">
              <div className="flex justify-between text-base font-bold text-ink">
                <span>Total produits</span>
                <span>{formatXof(total)}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                Les frais de livraison et le paiement sont confirmés par l'équipe avant expédition.
              </p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-5 w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-medium disabled:bg-gray-200 disabled:text-gray-500"
            >
              {submitting ? "Enregistrement…" : "Envoyer la commande"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
