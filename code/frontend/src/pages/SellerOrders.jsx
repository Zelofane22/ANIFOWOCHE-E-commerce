import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSellerOrders, getSellerProfile, updateSellerOrderStatus } from "../api/seller.js";
import { OrderStatusBadge } from "../components/account/common.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { formatDate, ORDER_STATUS } from "../components/account/orderHelpers.js";
import { formatXof } from "../utils/format.js";
import { AlertCircleIcon, MessageSquareIcon, PackageIcon, SearchIcon } from "../components/icons.jsx";

function whatsappUrl(phone, message) {
  const clean = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export default function SellerOrders() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [orders, setOrders] = useState(null);
  const [search, setSearch] = useState("");
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
        navigate(err?.response?.status === 404 ? "/register" : "/login", {
          replace: true,
        });
      });
  }, [isAuthenticated, loading, navigate]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => {
      return (
        order.full_name.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query) ||
        String(order.id).includes(query) ||
        order.items?.some((item) => item.product_name?.toLowerCase().includes(query))
      );
    });
  }, [orders, search]);

  const statusCounts = useMemo(() => {
    if (!orders) return {};
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const handleStatusChange = (orderId, status) => {
    setStatusSelection((prev) => ({ ...prev, [orderId]: status }));
    setStatusErrors((prev) => ({ ...prev, [orderId]: "" }));
  };

  const handleUpdateStatus = async (order, reason = "") => {
    const nextStatus = statusSelection[order.id] ?? order.status;
    if (nextStatus === order.status) return;

    setSavingOrderIds((prev) => [...prev, order.id]);
    setStatusErrors((prev) => ({ ...prev, [order.id]: "" }));

    try {
      const payload = { status: nextStatus };
      if (nextStatus === "cancelled" && reason) payload.cancellation_reason = reason;
      const updatedOrder = await updateSellerOrderStatus(order.id, payload);
      setOrders((prevOrders) =>
        prevOrders.map((existingOrder) =>
          existingOrder.id === order.id ? { ...existingOrder, ...updatedOrder } : existingOrder
        )
      );
      setStatusSelection((prev) => ({ ...prev, [order.id]: updatedOrder.status }));
    } catch (error) {
      setStatusErrors((prev) => ({
        ...prev,
        [order.id]:
          error?.response?.data?.status?.[0] ||
          error?.response?.data?.detail ||
          "Impossible de mettre à jour le statut.",
      }));
    } finally {
      setSavingOrderIds((prev) => prev.filter((id) => id !== order.id));
    }
  };

  const handleCancelClick = (order) => {
    setCancelModal({ order, reason: "" });
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    await handleUpdateStatus(cancelModal.order, cancelModal.reason);
    setCancelModal(null);
  };

  if (loading || !seller) {
    return <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  return (
    <SellerShell title="Commandes" seller={seller}>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Commandes reçues</h2>
              <p className="mt-1 text-sm text-muted">
                Suivez les commandes passées via votre boutique publique.
              </p>
            </div>
            <div className="relative rounded-lg border border-black/15 bg-white p-2">
              <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par client, produit ou n° commande"
                className="w-full rounded-lg border border-black/10 bg-white px-10 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          {orders === null ? (
            <div className="flex flex-col gap-4">
              {[0, 1].map((index) => (
                <div key={index} className="h-40 animate-pulse rounded-xl border border-black/10 bg-brand-pale" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-black/10 bg-white px-4 py-16 text-center text-muted">
              <PackageIcon size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-ink">
                {orders.length === 0 ? "Aucune commande reçue pour l'instant" : "Aucune commande trouvée"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-black/10 bg-[#fbfaf7] p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Commande</p>
                      <p className="mt-1 font-mono text-sm text-ink">ANW-{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Date</p>
                      <p className="mt-1 text-sm text-ink">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total</p>
                      <p className="mt-1 text-sm font-bold text-ink">{formatXof(order.total_xof)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-4">
                    <div className="flex flex-wrap gap-2 text-sm text-muted">
                      <span>{order.full_name}</span>
                      <span>·</span>
                      <span>{order.phone}</span>
                      <span>·</span>
                      <span>{order.city}</span>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label htmlFor={`order-status-${order.id}`} className="text-sm font-semibold text-muted">
                        Changer le statut
                      </label>
                      <select
                        id={`order-status-${order.id}`}
                        value={statusSelection[order.id] ?? order.status}
                        onChange={(event) => handleStatusChange(order.id, event.target.value)}
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                      >
                        {Object.entries(ORDER_STATUS).map(([status, cfg]) => (
                          <option key={status} value={status}>
                            {cfg.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={whatsappUrl(
                          order.phone,
                          `Bonjour ${order.full_name}, je vous confirme la bonne réception de votre commande. Je reviens vers vous rapidement.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-green-700 transition hover:border-green-400 hover:bg-green-50"
                        title="Contacter sur WhatsApp"
                      >
                        <MessageSquareIcon size={16} />
                      </a>
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
                      >
                        Voir le détail
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = statusSelection[order.id] ?? order.status;
                          if (nextStatus === "cancelled" && nextStatus !== order.status) {
                            handleCancelClick(order);
                          } else {
                            handleUpdateStatus(order);
                          }
                        }}
                        disabled={
                          savingOrderIds.includes(order.id) ||
                          (statusSelection[order.id] ?? order.status) === order.status
                        }
                        className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingOrderIds.includes(order.id) ? "Enregistrement..." : "Mettre à jour"}
                      </button>
                    </div>
                  </div>
                  {statusErrors[order.id] ? (
                    <p className="mt-2 text-sm text-red-600">{statusErrors[order.id]}</p>
                  ) : null}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="rounded-xl border border-black/10 bg-white p-3">
                        <p className="text-sm font-semibold text-ink">{item.product_name}</p>
                        <p className="mt-1 text-xs text-muted">
                          Qté {item.quantity} · {formatXof(item.unit_price_xof)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Résumé</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-brand-pale px-4 py-3 text-sm font-semibold text-brand-dark">
                <span>Total</span>
                <span>{orders?.length ?? 0}</span>
              </div>
              <div className="rounded-xl bg-white p-4 text-sm text-ink shadow-sm">
                <p className="font-semibold">Statuts</p>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  <li>Reçues : {statusCounts.received ?? 0}</li>
                  <li>En préparation : {statusCounts.prepared ?? 0}</li>
                  <li>Livrées : {statusCounts.delivered ?? 0}</li>
                  <li>Annulées : {statusCounts.cancelled ?? 0}</li>
                </ul>
              </div>
            </div>
          </section>
        </aside>
      </div>
      {cancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircleIcon size={22} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-ink">Annuler la commande</h3>
                <p className="mt-2 text-sm text-muted">
                  Êtes-vous sûr de vouloir annuler la commande <strong>ANW-{cancelModal.order.id}</strong> de {cancelModal.order.full_name}&nbsp;?
                </p>
                <p className="mt-1 text-xs text-muted">Cette action remettra les produits en stock et ne peut pas être annulée.</p>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="cancel-reason" className="block text-sm font-semibold text-ink">
                Motif de l'annulation <span className="font-normal text-muted">(optionnel)</span>
              </label>
              <textarea
                id="cancel-reason"
                value={cancelModal.reason}
                onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Exemple : Rupture de stock, client annule, etc."
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                rows={3}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50"
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
