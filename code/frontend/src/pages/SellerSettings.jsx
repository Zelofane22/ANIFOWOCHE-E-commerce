import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { fetchDeliveryZones } from "../api/delivery.js";
import { checkShopSlugAvailability, getSellerProfile, updateSellerProfile } from "../api/seller.js";
import { CheckIcon } from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20";

const toSlug = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default function SellerSettings() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [slugError, setSlugError] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugEditedRef = useRef(false);
  const slugRequestIdRef = useRef(0);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([getSellerProfile(), fetchDeliveryZones()])
      .then(([data, zonesData]) => {
        setDeliveryZones(zonesData.results ?? zonesData);
        setSeller(data);
        setForm({
          display_name: data.display_name,
          phone: data.phone,
          city: data.city || "",
          shop: {
            name: data.shop.name,
            slug: data.shop.slug,
            whatsapp_phone: data.shop.whatsapp_phone,
            city: data.shop.city || "",
            description: data.shop.description || "",
            delivery_zone_ids: (data.shop.delivery_zones || []).map((zone) => zone.id),
            is_published: data.shop.is_published,
          },
        });
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  const shopSlug = form?.shop?.slug ?? "";
  const savedSlug = seller?.shop?.slug ?? "";

  useEffect(() => {
    const requestId = ++slugRequestIdRef.current;
    if (!shopSlug || shopSlug === savedSlug) {
      return;
    }
    const timer = setTimeout(() => {
      setSlugChecking(true);
      checkShopSlugAvailability(shopSlug)
        .then((result) => {
          if (slugRequestIdRef.current !== requestId) return;
          setSlugError(result.available ? null : "Ce lien boutique est déjà utilisé.");
        })
        .catch(() => {
          if (slugRequestIdRef.current === requestId) setSlugError(null);
        })
        .finally(() => {
          if (slugRequestIdRef.current === requestId) setSlugChecking(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [shopSlug, savedSlug]);

  const updateShop = (patch) => setForm((current) => ({ ...current, shop: { ...current.shop, ...patch } }));

  const toggleDeliveryZone = (zoneId) => {
    const selected = form.shop.delivery_zone_ids || [];
    const next = selected.includes(zoneId) ? selected.filter((id) => id !== zoneId) : [...selected, zoneId];
    updateShop({ delivery_zone_ids: next });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const data = await updateSellerProfile(form);
      setSeller(data);
      setSlugError(null);
      setSlugChecking(false);
      setSuccess("Boutique mise à jour.");
    } catch (err) {
      const slugMessages = err?.response?.data?.shop?.slug;
      if (Array.isArray(slugMessages) && slugMessages.length > 0) {
        setSlugError(slugMessages[0]);
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !seller || !form) {
    return <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  return (
    <SellerShell title="Paramètres boutique" seller={seller}>
      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink">Profil vendeur</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nom vendeur">
              <input
                className={inputClass}
                required
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </Field>
            <Field label="Téléphone">
              <input
                className={inputClass}
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Ville vendeur">
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
          </div>

          <h2 className="mt-8 text-lg font-bold text-ink">Boutique publique</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nom de boutique">
              <input
                className={inputClass}
                required
                value={form.shop.name}
                onChange={(e) => {
                  const name = e.target.value;
                  if (!slugEditedRef.current) {
                    setSlugError(null);
                    setSlugChecking(false);
                    updateShop({ name, slug: toSlug(name) || "boutique" });
                  } else {
                    updateShop({ name });
                  }
                }}
              />
            </Field>
            <Field label="Slug (lien de la boutique)">
              <input
                className={`${inputClass} ${slugError ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                required
                value={form.shop.slug}
                onChange={(e) => {
                  slugEditedRef.current = true;
                  setSlugError(null);
                  setSlugChecking(false);
                  updateShop({ slug: toSlug(e.target.value) });
                }}
              />
              {slugError ? (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{slugError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  {slugChecking
                    ? "Vérification de la disponibilité..."
                    : `Lien public de votre boutique : /shop/${form.shop.slug || "..."}`}
                </p>
              )}
            </Field>
            <Field label="WhatsApp boutique">
              <input
                className={inputClass}
                required
                value={form.shop.whatsapp_phone}
                onChange={(e) => updateShop({ whatsapp_phone: e.target.value })}
              />
            </Field>
            <Field label="Ville boutique">
              <input className={inputClass} value={form.shop.city} onChange={(e) => updateShop({ city: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Description">
              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={form.shop.description}
                onChange={(e) => updateShop({ description: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-5 rounded-lg border border-black/10 bg-gray-50 p-4">
            <h3 className="text-sm font-bold text-ink">Zones de livraison couvertes</h3>
            <p className="mt-1 text-xs text-muted">Les clients verront ces zones sur votre vitrine.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {deliveryZones.map((zone) => (
                <label key={zone.id} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={(form.shop.delivery_zone_ids || []).includes(zone.id)} onChange={() => toggleDeliveryZone(zone.id)} className="h-4 w-4 accent-brand" />
                  <span>{zone.name}</span>
                </label>
              ))}
            </div>
            {deliveryZones.length === 0 && <p className="mt-2 text-xs text-muted">Aucune zone active configurée.</p>}
          </div>
        </section>

        <aside className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-base font-bold text-ink">Publication</h2>
          <label className="mt-4 flex items-center gap-3 rounded-lg border border-black/10 p-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.shop.is_published}
              onChange={(e) => updateShop({ is_published: e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            Boutique visible publiquement
          </label>
          <p className="mt-4 break-all rounded-lg bg-gray-50 px-3 py-2 text-sm text-muted">
            {seller.shop.public_url}
          </p>
          {success && (
            <p role="status" aria-live="polite" className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckIcon size={15} />
              {success}
            </p>
          )}
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting || Boolean(slugError)}
            className="mt-4 w-full rounded-lg bg-brand px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-medium disabled:opacity-60 sticky bottom-[calc(var(--tabbar-h)+var(--tabbar-safe)+1rem)] lg:static lg:shadow-none"
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </aside>
      </form>
    </SellerShell>
  );
}
