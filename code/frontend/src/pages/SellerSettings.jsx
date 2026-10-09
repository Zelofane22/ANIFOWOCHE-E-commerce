import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSellerProfile, updateSellerProfile } from "../api/seller.js";
import {
  BarChartIcon,
  CheckIcon,
  ChevronRightIcon,
  FileTextIcon,
  InfoIcon,
  LogOutIcon,
  MessageCircleIcon,
  SettingsIcon,
  UserIcon,
  ZapIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";

const inputClass =
  "w-full rounded-[12px] border border-black/[0.12] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/15";


const getInitials = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "";

function SettingsRow({ icon: Icon, label, desc, onClick, gold = false, badge = null }) {
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
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [notifications, setNotifications] = useState({
    new_orders: true,
    payments: true,
    low_stock: true,
    promotions: false,
  });
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    getSellerProfile()
      .then((data) => {
        setSeller(data);
        setForm({
          display_name: data.display_name,
          phone: data.phone,
          city: data.city || "",
        });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);


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
                <p className="text-xs text-[#9CA3AF] mt-0.5">Produits illimités, sans commission sur vos ventes</p>
              </div>
              <ChevronRightIcon size={15} className="text-[#9CA3AF] flex-shrink-0" />
            </div>
          </Link>
          {quotaReached && (
            <div className="px-4 pb-3">
              <p className="rounded-[12px] bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">
                Quota mensuel de commandes atteint. Votre boutique est masquée jusqu'au mois prochain.
              </p>
              {seller.plan === "FREE" && (
                <Link to="/plan" className="mt-2 inline-flex px-3 text-xs font-bold text-[#8B6604] hover:underline">
                  Passer à Starter pour continuer à vendre
                </Link>
              )}
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
            label="Statistiques"
            desc="Analyse détaillée de vos ventes"
            onClick={() => navigate("/stats")}
          />
          <SettingsRow
            icon={FileTextIcon}
            label="Rapports & exports"
            desc="Générer et exporter vos rapports de vente"
            onClick={() => navigate("/reports")}
          />
          <SettingsRow
            icon={ZapIcon}
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
