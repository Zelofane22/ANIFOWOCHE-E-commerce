import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getSellerProfile } from "../api/seller.js";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
  Share2Icon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";

export default function SellerShopPage() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    getSellerProfile()
      .then(setSeller)
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  if (loading || !seller) {
    return <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  const shopUrl = seller.shop?.public_url || "";
  const shopName = seller.shop?.name || "Ma boutique";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(`Découvrez ma boutique ${shopName} ! ${shopUrl}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <SellerShell title="Boutique" seller={seller}>
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

          {/* Browser preview */}
          <div className="rounded-2xl bg-white border border-black/[0.05] overflow-hidden shadow-sm">
            <div className="bg-[#1C1C1C] px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white/10 rounded-full px-3 py-1 text-[10px] text-white/50 truncate">
                {shopUrl}
              </div>
            </div>
            <div className="bg-white p-4">
              <p className="font-bold text-[#111827] text-sm mb-3">ANIFOWOCHE</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-[6px] overflow-hidden aspect-square bg-[#F3F4F6]" />
                ))}
              </div>
            </div>
          </div>

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
