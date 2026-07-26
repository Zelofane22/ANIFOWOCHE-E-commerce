import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getSellerOrders, getSellerProfile } from "../api/seller.js";
import { OrderStatusBadge } from "../components/account/common.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { formatDate } from "../components/account/orderHelpers.js";
import { formatXof } from "../utils/format.js";
import { PackageIcon, SearchIcon } from "../components/icons.jsx";

export default function SellerOrders() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [orders, setOrders] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/seller/login", { replace: true });
      return;
    }

    Promise.all([getSellerProfile(), getSellerOrders()])
      .then(([sellerData, ordersData]) => {
        setSeller(sellerData);
        setOrders(ordersData.results ?? ordersData);
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/seller/register" : "/seller/login", {
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
    </SellerShell>
  );
}
