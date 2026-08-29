import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { getSellerProfile, updateSellerProfile } from "../api/seller.js";
import { fetchDeliveryZones } from "../api/delivery.js";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  MessageSquareIcon,
  Share2Icon,
  StoreIcon,
  GlobeIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { useStoreStatus } from "../context/useStoreStatus.js";
import { extractErrorMessage } from "../utils/apiError.js";

const inputClass =
  "w-full rounded-[12px] border border-black/[0.12] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/15";


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
function ToggleSwitch({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => { if (disabled) return; onChange(!enabled); }}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C99F08]/30 focus:ring-offset-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
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

export default function SellerShopPage() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editingShop, setEditingShop] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [slugError, setSlugError] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugEditedRef = useRef(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { maintenanceMode } = useStoreStatus();

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

  if (loading || !seller) {
    return <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  const shopUrl = seller.shop?.public_url || "";
  const shopName = seller.shop?.name || "Ma boutique";
  const updateShop = (patch) => setForm((current) => ({ ...current, shop: { ...current.shop, ...patch } }));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };
  
  const handleFullSave = async (e) => {
    if (maintenanceMode) return;
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

  const toggleDeliveryZone = (zoneId) => {
    const selected = form.shop.delivery_zone_ids || [];
    const next = selected.includes(zoneId) ? selected.filter((id) => id !== zoneId) : [...selected, zoneId];
    updateShop({ delivery_zone_ids: next });
  };

  const toSlug = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
  

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(`Découvrez ma boutique ${shopName} ! ${shopUrl}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <SellerShell title="Boutique" seller={seller}>
      {maintenanceMode && (
        <div role="alert" className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-amber-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.3 3.3 10.3a2 2 0 0 0 0 2.8l7 7a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8l-7-7a2 2 0 0 0-2.8 0Z" />
          </svg>
          <span>Boutique en maintenance — les modifications de la boutique sont suspendues.</span>
        </div>
      )}
      {/* Dark header */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-[#111827] px-5 pt-8 pb-6 -mx-4 sm:mx-0 sm:rounded-2xl">
          <h1 className="text-xl font-bold text-white mb-1">Votre boutique</h1>
          <p className="text-white/50 text-sm">Partagez et augmentez vos ventes</p>
          <div className="mt-5 bg-green-500/15 border border-green-400/20 rounded-[14px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <CheckIcon size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Boutique en ligne et active</p>
              <p className="text-white/50 text-xs mt-0.5">Accessible 24h/24 à vos clients</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* URL card */}
          <div className="rounded-2xl bg-white border border-black/[0.05] p-4 shadow-sm">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Lien de votre boutique</p>
            <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-[10px] px-3 py-2.5 mb-3">
              <ExternalLinkIcon size={13} className="text-brand shrink-0" />
              <p className="text-sm text-[#374151] font-medium truncate flex-1">{shopUrl}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 rounded-[10px] bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
              >
                {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                {copied ? "Copié !" : "Copier"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: shopName, url: shopUrl });
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-[10px] bg-white border border-black/10 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-gray-50"
              >
                <Share2Icon size={13} />
                Partager
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-1.5 rounded-[10px] bg-white border border-black/10 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-gray-50"
              >
                <MessageSquareIcon size={13} />
                WhatsApp
              </button>
            </div>
          </div>

          {/* ── Ma Boutique ── */}
          <div className="bg-white rounded-[16px] shadow-sm border border-black/[0.05] divide-y divide-black/[0.04]">
            <div className="px-4 pt-3 pb-2">
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Ma boutique</p>
            </div>
            <SettingsRow
              icon={StoreIcon}
              label="Paramètres boutique"
              desc={`${seller.shop?.name} · ${seller.shop?.slug}`}
              onClick={() => { if (maintenanceMode) return; setEditingShop(!editingShop); }}
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
                disabled={maintenanceMode}
                onChange={(val) => { if (maintenanceMode) return; updateShop({ is_published: val }); }}
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
                  disabled={submitting || maintenanceMode || Boolean(slugError)}
                  className="flex-1 rounded-[10px] bg-[#C99F08] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#A67C06] disabled:opacity-60"
                >
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          )}
          
          {/* Social share */}
          <div className="rounded-2xl bg-white border border-black/[0.05] p-4 shadow-sm">
            <p className="font-bold text-[#111827] text-sm mb-3">Partager sur</p>
            <div className="flex gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 bg-green-500 rounded-[10px] py-3 flex flex-col items-center gap-1"
              >
                <MessageSquareIcon size={16} className="text-white" />
                <span className="text-[10px] text-white font-bold">WhatsApp</span>
              </button>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shopUrl)}`, "_blank")}
                className="flex-1 bg-blue-600 rounded-[10px] py-3 flex flex-col items-center gap-1"
              >
                <span className="text-white text-xs font-bold">f</span>
                <span className="text-[10px] text-white font-bold">Facebook</span>
              </button>
              <button
                onClick={() => window.open(`https://www.instagram.com/`, "_blank")}
                className="flex-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[10px] py-3 flex flex-col items-center gap-1"
              >
                <span className="text-white text-xs font-bold">ig</span>
                <span className="text-[10px] text-white font-bold">Instagram</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SellerShell>
  );
}
