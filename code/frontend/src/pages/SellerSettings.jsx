import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getSellerProfile, updateSellerProfile } from "../api/seller.js";
import { CheckIcon } from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";

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

export default function SellerSettings() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/seller/login", { replace: true });
      return;
    }
    getSellerProfile()
      .then((data) => {
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
            is_published: data.shop.is_published,
          },
        });
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/seller/register" : "/seller/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  const updateShop = (patch) => setForm((current) => ({ ...current, shop: { ...current.shop, ...patch } }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const data = await updateSellerProfile(form);
      setSeller(data);
      setSuccess("Boutique mise à jour.");
    } catch (err) {
      setError(extractErrorMessage(err));
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
              <input className={inputClass} required value={form.shop.name} onChange={(e) => updateShop({ name: e.target.value })} />
            </Field>
            <Field label="Slug">
              <input className={inputClass} required value={form.shop.slug} onChange={(e) => updateShop({ slug: e.target.value })} />
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
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckIcon size={15} />
              {success}
            </p>
          )}
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-medium disabled:opacity-60"
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </aside>
      </form>
    </SellerShell>
  );
}
