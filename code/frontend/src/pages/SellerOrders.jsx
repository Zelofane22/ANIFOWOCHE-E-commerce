import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSellerOrders, getSellerProfile, updateSellerOrderStatus } from "../api/seller.js";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { formatXof } from "../utils/format.js";
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  PackageIcon,
  SearchIcon,
} from "../components/icons.jsx";

const STATUS_CONFIG = {
  received: { label: "Recue", color: "#7C3AED", bg: "#F5F3FF", Icon: ClockIcon },
  prepared: { label: "En preparation", color: "#2563EB", bg: "#EFF6FF", Icon: PackageIcon },
  delivered: { label: "Livree", color: "#059669", bg: "#ECFDF5", Icon: CheckIcon },
  cancelled: { label: "Annulee", color: "#DC2626", bg: "#FEF2F2", Icon: AlertCircleIcon },
};

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "A traiter" },
  { key: "active", label: "En cours" },
  { key: "done", label: "Terminees" },
  { key: "cancelled", label: "Annulees" },
];

const FILTER_MAP = {
  pending: ["received"],
  active: ["prepared"],
  done: ["delivered"],
  cancelled: ["cancelled"],
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#6B7280", bg: "#F3F4F6", Icon: ClockIcon };
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
        active ? "bg-[#C99F08] text-white" : "bg-white text-[#6B7280] border border-black/10 hover:border-[#C99F08]/50"
      }`}
    >
      {label}
    </button>
  );
}

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

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}


export default function SellerOrders() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [orders, setOrders] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [statusSelection, setStatusSelection] = useState({});
  const [savingOrderIds, setSavingOrderIds] = useState([]);
  const [statusErrors, setStatusErrors] = useState({});
  const [cancelModal, setCancelModal] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([getSellerProfile(), getSellerOrders()])
      .then(([sellerData, ordersData]) => {
        setSeller(sellerData);
        setOrders(ordersData.results ?? ordersData);
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const allowed = FILTER_MAP[activeFilter];
      if (allowed && !allowed.includes(order.status)) return false;
      if (!query) return true;
      return (
        order.full_name?.toLowerCase().includes(query) ||
        order.phone?.toLowerCase().includes(query) ||
        String(order.id).includes(query) ||
        order.items?.some((item) => item.product_name?.toLowerCase().includes(query))
      );
    });
  }, [orders, search, activeFilter]);

  const statusCounts = useMemo(() => {
    if (!orders) return {};
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const pendingCount = (statusCounts.received ?? 0) + (statusCounts.prepared ?? 0);


  const handleUpdateStatus = async (order, reason = "") => {
    const nextStatus = statusSelection[order.id] ?? order.status;
    if (nextStatus === order.status) return;
    setSavingOrderIds((prev) => [...prev, order.id]);
    setStatusErrors((prev) => ({ ...prev, [order.id]: "" }));
    try {
      const payload = { status: nextStatus };
      if (nextStatus === "cancelled" && reason) payload.cancellation_reason = reason;
      const updatedOrder = await updateSellerOrderStatus(order.id, payload);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...updatedOrder } : o))
      );
      setStatusSelection((prev) => ({ ...prev, [order.id]: updatedOrder.status }));
    } catch (error) {
      setStatusErrors((prev) => ({
        ...prev,
        [order.id]:
          error?.response?.data?.status?.[0] ||
          error?.response?.data?.detail ||
          "Impossible de mettre a jour le statut.",
      }));
    } finally {
      setSavingOrderIds((prev) => prev.filter((id) => id !== order.id));
    }
  };


  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    await handleUpdateStatus(cancelModal.order, cancelModal.reason);
    setCancelModal(null);
  };

  if (loading || !seller) {
    return (
      <SellerShell>
        <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-[#9CA3AF]">
          Chargement...
        </div>
      </SellerShell>
    );
  }

  return (
    <SellerShell pendingCount={pendingCount} seller={seller}>
      <div className="mx-auto max-w-2xl">
        <div className="bg-[#111827] px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Commandes</h1>
            <span className="text-xs font-medium text-gray-400">
              {orders ? `${orders.length} au total` : ""}
            </span>
          </div>

          <div className="relative mb-4">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Client, numero de commande..."
              className="w-full rounded-xl bg-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#C99F08]/40"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => {
              const count =
                f.key === "all"
                  ? orders?.length ?? 0
                  : statusCounts[FILTER_MAP[f.key]?.[0] ?? ""] ?? 0;
              return (
                <FilterChip
                  key={f.key}
                  label={`${f.label} (${count})`}
                  active={activeFilter === f.key}
                  onClick={() => setActiveFilter(f.key)}
                />
              );
            })}
          </div>
        </div>

        <div className="px-4 pt-4 space-y-3 pb-8">
          {orders === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.05] bg-white p-10 text-center shadow-sm">
              <PackageIcon size={32} className="mx-auto mb-3 text-[#9CA3AF]" />
              <p className="font-semibold text-[#111827]">
                {orders.length === 0 ? "Aucune commande recue" : "Aucune commande trouvee"}
              </p>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                {orders.length === 0
                  ? "Les nouvelles commandes apparaitront ici."
                  : "Essayez de modifier vos filtres."}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm transition active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#111827]">#{order.id}</p>
                    <p className="text-sm text-[#6B7280] mt-0.5">{order.full_name}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {formatRelativeDate(order.created_at)} a {formatTime(order.created_at)} - {(order.items?.length ?? 0)} art.
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
                  <p className={`font-bold text-xl ${order.status === "cancelled" ? "text-[#9CA3AF] line-through" : "text-[#111827]"}`}>
                    {formatXof(order.total_xof)}
                  </p>
                  <ChevronRightIcon size={18} className="text-[#9CA3AF]" />
                </div>

                {statusErrors[order.id] ? (
                  <p role="alert" className="mt-2 text-xs text-red-600">{statusErrors[order.id]}</p>
                ) : null}
              </Link>
            ))
          )}
        </div>
      </div>

      {cancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircleIcon size={22} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Annuler la commande</h3>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Etes-vous sur de vouloir annuler la commande <strong>#{cancelModal.order.id}</strong> de {cancelModal.order.full_name} ?
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">Cette action remettra les produits en stock et ne peut pas etre annulee.</p>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="cancel-reason" className="block text-sm font-semibold text-[#111827]">
                Motif de l'annulation <span className="font-normal text-[#9CA3AF]">(optionnel)</span>
              </label>
              <textarea
                id="cancel-reason"
                value={cancelModal.reason}
                onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Exemple : Rupture de stock, client annule, etc."
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                rows={3}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={savingOrderIds.includes(cancelModal.order.id)}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingOrderIds.includes(cancelModal.order.id) ? "Annulation..." : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SellerShell>
  );
}
