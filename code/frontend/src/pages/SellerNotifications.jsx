import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getSellerProfile } from "../api/seller.js";
import {
  fetchSellerNotifications,
  markSellerNotificationRead,
  markAllSellerNotificationsRead,
} from "../api/notifications.js";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import {
  BellIcon,
  CheckIcon,
  MessageSquareIcon,
  PackageIcon,
  AlertCircleIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  SettingsIcon,
  InfoIcon,
} from "../components/icons.jsx";

const TYPE_CONFIG = {
  new_order: { label: "Nouvelle commande", Icon: ShoppingBagIcon, color: "#2563EB", bg: "#EFF6FF" },
  order_cancelled: { label: "Commande annulée", Icon: AlertCircleIcon, color: "#DC2626", bg: "#FEF2F2" },
  low_stock: { label: "Stock faible", Icon: PackageIcon, color: "#D97706", bg: "#FFFBEB" },
  plan_expiring: { label: "Abonnement", Icon: CreditCardIcon, color: "#7C3AED", bg: "#F5F3FF" },
  broadcast: { label: "ANIFOWOCHE", Icon: MessageSquareIcon, color: "#C99F08", bg: "#FEF9C3" },
  account: { label: "Compte", Icon: SettingsIcon, color: "#059669", bg: "#ECFDF5" },
  system: { label: "Système", Icon: InfoIcon, color: "#6B7280", bg: "#F3F4F6" },
};

function formatRelativeDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function NotificationCard({ notification, onRead }) {
  const cfg = TYPE_CONFIG[notification.notification_type] || TYPE_CONFIG.system;
  const Icon = cfg.Icon;

  const handleMarkRead = async () => {
    if (notification.is_read) return;
    try {
      await markSellerNotificationRead(notification.id);
      onRead(notification.id);
    } catch {
      /* silent */
    }
  };

  return (
    <div
      onClick={handleMarkRead}
      className={`relative rounded-2xl border p-4 shadow-sm transition cursor-pointer active:scale-[0.98] ${
        notification.is_read
          ? "border-black/[0.05] bg-white"
          : "border-[#C99F08]/20 bg-[#C99F08]/[0.03]"
      }`}
    >
      {!notification.is_read && (
        <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-[#C99F08]" />
      )}
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: cfg.bg }}
        >
          <Icon size={18} style={{ color: cfg.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-bold leading-snug ${notification.is_read ? "text-[#6B7280]" : "text-[#111827]"}`}>
              {notification.title}
            </p>
            <span className="shrink-0 text-[11px] text-[#9CA3AF]">
              {formatRelativeDate(notification.created_at)}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[#6B7280] line-clamp-2">
            {notification.message}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ color: cfg.color, backgroundColor: cfg.bg }}
            >
              <Icon size={9} />
              {cfg.label}
            </span>
            {!notification.is_read && (
              <span className="text-[10px] font-semibold text-[#C99F08]">Non lue</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellerNotifications() {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([getSellerProfile(), fetchSellerNotifications()])
      .then(([sellerData, notifData]) => {
        setSeller(sellerData);
        setNotifications(notifData.results ?? notifData);
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, authLoading, navigate]);

  const handleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllSellerNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch {
      /* silent */
    }
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  const filteredNotifications = notifications?.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  }) ?? [];

  if (authLoading || !seller) {
    return (
      <SellerShell>
        <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-[#9CA3AF]">
          Chargement...
        </div>
      </SellerShell>
    );
  }

  return (
    <SellerShell seller={seller} pendingCount={unreadCount}>
      <div className="mx-auto max-w-2xl">
        <div className="bg-[#111827] px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#C99F08] px-1.5 text-[11px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <CheckIcon size={14} />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
            {[
              { key: "all", label: "Toutes" },
              { key: "unread", label: "Non lues" },
              { key: "read", label: "Lues" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filter === f.key
                    ? "bg-[#C99F08] text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-4 space-y-3 pb-8">
          {notifications === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.05] bg-white p-10 text-center shadow-sm">
              <BellIcon size={32} className="mx-auto mb-3 text-[#9CA3AF]" />
              <p className="font-semibold text-[#111827]">
                {filter === "unread"
                  ? "Aucune notification non lue"
                  : filter === "read"
                    ? "Aucune notification lue"
                    : "Aucune notification"}
              </p>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                {filter === "all"
                  ? "Les notifications de vos commandes et alertes apparaitront ici."
                  : "Essayez de modifier votre filtre."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <NotificationCard key={n.id} notification={n} onRead={handleRead} />
            ))
          )}
        </div>
      </div>
    </SellerShell>
  );
}
