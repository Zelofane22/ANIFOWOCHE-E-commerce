import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { fetchDeliveryZones } from "../api/delivery.js";
import { checkShopSlugAvailability, getSellerProfile, updateSellerProfile } from "../api/seller.js";
import {
  BarChartIcon,
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  GlobeIcon,
  InfoIcon,
  LogOutIcon,
  MessageCircleIcon,
  SettingsIcon,
  StoreIcon,
  TagIcon,
  UserIcon,
  ZapIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";

const inputClass =
  "w-full rounded-[12px] border border-black/[0.12] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/15";

const toSlug = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);

const getInitials = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "";

function SettingsRow({ icon: Icon, label, desc, onClick, gold, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-[#FAFAFA] transition-colors active:bg-[#F5F5F5]"
    >
      <div
        className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
          gold ? "bg-[#FEF9E7] text-[#C99F08]" : "bg-[#F3F4F6] text-[#374151]"
        }`}
      >
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${gold ? "text-[#C99F08]" : "text-[#111827]"}`}>{label}</p>
        {desc && <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{desc}</p>}
      </div>
      {badge ? (
        <span className="flex-shrink-0 text-[10px] font-bold bg-[#FEF9E7] text-[#8B6604] border border-[#C99F08]/25 px-2.5 py-1 rounded-full">
          {badge}
        </span>
      ) : (
        <ChevronRightIcon size={15} className="text-[#9CA3AF] flex-shrink-0" />
      )}
    </button>
  );
}

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C99F08]/30 focus:ring-offset-2 ${
        enabled ? "bg-[#C99F08]" : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function NotificationToggle({ label, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-[#111827]">{label}</span>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

export default function SellerSettings() {
  const navigate = useNavigate();
  const { logout, loading, isAuthenticated, user } = useAuth();
  const [seller, setSeller] = useState(null);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [slugError, setSlugError] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingShop, setEditingShop] = useState(false);
  const [notifications, setNotifications] = useState({
    new_orders: true,
    payments: true,
    low_stock: true,
    promotions: false,
  });
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
    if (!shopSlug || shopSlug === savedSlug) return;
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

  const handleProfileSave = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const data = await updateSellerProfile({
        display_name: form.display_name,
        phone: form.phone,
        city: form.city,
      });
      setSeller((prev) => ({ ...prev, ...data, shop: prev.shop }));
      setSuccess("Profil mis à jour.");
      setEditingProfile(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleShopSave = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const data = await updateSellerProfile(form);
      setSeller(data);
      setSlugError(null);
      setSlugChecking(false);
      setSuccess("Boutique mise à jour.");
      setEditingShop(false);
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

  const handleFullSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const data = await updateSellerProfile(form);
      setSeller(data);
      setSlugError(null);
      setSlugChecking(false);
      setSuccess("Paramètres sauvegardés.");
      setEditingProfile(false);
      setEditingShop(false);
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

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (loading || !seller || !form) {
    return (
      <div className="min-h-screen bg-[#F4F4F8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C99F08] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#9CA3AF]">Chargement...</p>
        </div>
      </div>
    );
  }

  const initials = getInitials(seller.display_name);
  const quotaReached = seller.limits?.orders_quota_reached;

  return (
    <SellerShell seller={seller} pendingCount={0}>
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-black/[0.05] sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[#111827]">Plus</h1>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-3 max-w-lg mx-auto">
        {/* ── Profile Card ── */}
        <button
          type="button"
          onClick={() => setEditingProfile(!editingProfile)}
          className="w-full bg-white rounded-[16px] shadow-sm border border-black/[0.05] p-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#C99F08]/15 flex items-center justify-center flex-shrink-0">
              {initials ? (
                <span className="font-bold text-[#C99F08] text-lg">{initials}</span>
              ) : (
                <UserIcon size={20} className="text-[#C99F08]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#111827] truncate">{seller.display_name}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{seller.shop?.name}</p>
              {user?.email && <p className="text-xs text-[#9CA3AF] truncate">{user.email}</p>}
            </div>
            <ChevronRightIcon size={16} className="text-[#9CA3AF] flex-shrink-0" />
          </div>
        </button>

        {/* ── Inline Profile Edit ── */}
        {editingProfile && (
          <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] p-4 space-y-3">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Profil vendeur</p>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">Nom vendeur</label>
              <input
                className={inputClass}
                required
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">Téléphone</label>
              <input
                className={inputClass}
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">Ville</label>
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            {success && (
              <p className="flex items-center gap-2 rounded-[12px] bg-green-50 px-3 py-2 text-xs text-green-700">
                <CheckIcon size={14} /> {success}
              </p>
            )}
            {error && <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setEditingProfile(false); setError(null); setSuccess(null); }}
                className="flex-1 rounded-[10px] border border-black/[0.12] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={submitting}
                className="flex-1 rounded-[10px] bg-[#C99F08] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#A67C06] disabled:opacity-60"
              >
                {submitting ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}

        {/* ── Ma Boutique ── */}
        <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] divide-y divide-black/[0.04]">
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Ma boutique</p>
          </div>
          <SettingsRow
            icon={StoreIcon}
            label="Paramètres boutique"
            desc={`${seller.shop?.name} · ${seller.shop?.slug}`}
            onClick={() => setEditingShop(!editingShop)}
          />
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-[10px] bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                <GlobeIcon size={17} className="text-[#374151]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#111827]">Boutique publique</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{form.shop.is_published ? "Visible" : "Masquée"}</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={form.shop.is_published}
              onChange={(val) => updateShop({ is_published: val })}
            />
          </div>
          <SettingsRow
            icon={ExternalLinkIcon}
            label="Voir ma boutique"
            desc={seller.shop?.public_url}
            onClick={() => window.open(seller.shop?.public_url, "_blank")}
          />
        </div>

        {/* ── Inline Shop Edit ── */}
        {editingShop && (
          <form onSubmit={handleFullSave} className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] p-4 space-y-3">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Paramètres boutique</p>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">Nom de boutique</label>
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
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">Lien boutique (slug)</label>
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
                <p className="mt-1.5 text-xs text-[#9CA3AF]">
                  {slugChecking
                    ? "Vérification de la disponibilité..."
                    : `/shop/${form.shop.slug || "..."}`}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">WhatsApp boutique</label>
              <input
                className={inputClass}
                required
                value={form.shop.whatsapp_phone}
                onChange={(e) => updateShop({ whatsapp_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">Ville boutique</label>
              <input
                className={inputClass}
                value={form.shop.city}
                onChange={(e) => updateShop({ city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">Description</label>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={form.shop.description}
                onChange={(e) => updateShop({ description: e.target.value })}
              />
            </div>
            {deliveryZones.length > 0 && (
              <div className="rounded-[12px] border border-black/[0.06] bg-[#F9FAFB] p-3">
                <p className="text-xs font-bold text-[#111827] mb-2">Zones de livraison</p>
                <div className="grid gap-1.5">
                  {deliveryZones.map((zone) => (
                    <label key={zone.id} className="flex items-center gap-2 text-sm text-[#374151] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form.shop.delivery_zone_ids || []).includes(zone.id)}
                        onChange={() => toggleDeliveryZone(zone.id)}
                        className="h-4 w-4 accent-[#C99F08] rounded"
                      />
                      <span>{zone.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {success && (
              <p className="flex items-center gap-2 rounded-[12px] bg-green-50 px-3 py-2 text-xs text-green-700">
                <CheckIcon size={14} /> {success}
              </p>
            )}
            {error && <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setEditingShop(false); setError(null); setSuccess(null); }}
                className="flex-1 rounded-[10px] border border-black/[0.12] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || Boolean(slugError)}
                className="flex-1 rounded-[10px] bg-[#C99F08] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#A67C06] disabled:opacity-60"
              >
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        )}

        {/* ── Mon Abonnement ── */}
        <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] divide-y divide-black/[0.04]">
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Abonnement</p>
          </div>
          <div className="px-4 py-3.5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-[10px] bg-[#FEF9E7] flex items-center justify-center flex-shrink-0">
              <ZapIcon size={17} className="text-[#C99F08]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#111827]">Plan actuel</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {seller.plan === "FREE"
                  ? "Offre gratuite — produits et commandes limités"
                  : `Offre ${seller.plan}`}
              </p>
            </div>
            <span className="flex-shrink-0 text-[10px] font-bold bg-[#FEF9E7] text-[#8B6604] border border-[#C99F08]/25 px-2.5 py-1 rounded-full">
              {seller.plan === "FREE" ? "GRATUIT" : seller.plan}
            </span>
          </div>
          <Link
            to="/plan"
            className="block px-4 py-3.5 text-left hover:bg-[#FAFAFA] transition-colors active:bg-[#F5F5F5]"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-[10px] bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                <SettingsIcon size={17} className="text-[#374151]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[#C99F08]">
                  {seller.plan === "FREE" ? "Passer au plan payant" : "Gérer mon abonnement"}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Produits illimités, commission réduite</p>
              </div>
              <ChevronRightIcon size={15} className="text-[#9CA3AF] flex-shrink-0" />
            </div>
          </Link>
          {quotaReached && (
            <div className="px-4 pb-3">
              <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">
                Quota mensuel de commandes atteint. Votre boutique est masquée jusqu'au mois prochain.
              </p>
            </div>
          )}
        </div>

        {/* ── Préférences ── */}
        <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] divide-y divide-black/[0.04]">
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Préférences</p>
          </div>
          <div className="px-4 divide-y divide-black/[0.04]">
            <NotificationToggle
              label="Nouvelles commandes"
              enabled={notifications.new_orders}
              onChange={(val) => setNotifications((n) => ({ ...n, new_orders: val }))}
            />
            <NotificationToggle
              label="Paiements reçus"
              enabled={notifications.payments}
              onChange={(val) => setNotifications((n) => ({ ...n, payments: val }))}
            />
            <NotificationToggle
              label="Alertes stock"
              enabled={notifications.low_stock}
              onChange={(val) => setNotifications((n) => ({ ...n, low_stock: val }))}
            />
            <NotificationToggle
              label="Promotions & offres"
              enabled={notifications.promotions}
              onChange={(val) => setNotifications((n) => ({ ...n, promotions: val }))}
            />
          </div>
        </div>

        {/* ── Aide & Support ── */}
        <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] divide-y divide-black/[0.04]">
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Aide & support</p>
          </div>
          <SettingsRow
            icon={MessageCircleIcon}
            label="Contacter le support"
            desc="Chat avec notre équipe"
            onClick={() => {}}
          />
          <SettingsRow
            icon={BarChartIcon}
            label="Statistiques avancées"
            desc="Analyse détaillée de vos ventes"
            onClick={() => {}}
          />
          <SettingsRow
            icon={TagIcon}
            label="Promotions"
            desc="Codes promo et réductions"
            onClick={() => {}}
          />
          <SettingsRow
            icon={InfoIcon}
            label="À propos"
            desc="ANIF Seller — v1.4.2"
            onClick={() => {}}
          />
        </div>

        {/* ── Compte ── */}
        <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-red-50 transition-colors active:bg-red-100 rounded-[16px]"
          >
            <div className="w-9 h-9 rounded-[10px] bg-red-50 flex items-center justify-center flex-shrink-0">
              <LogOutIcon size={17} className="text-red-500" />
            </div>
            <p className="font-semibold text-sm text-red-600">Se déconnecter</p>
          </button>
        </div>
      </div>
    </SellerShell>
  );
}
