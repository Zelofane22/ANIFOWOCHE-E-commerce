import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getOrders } from "../api/orders.js";
import { fetchReturnRequests } from "../api/returns.js";
import {
  AccountBreadcrumb,
  formatDate,
  orderRef,
  OrderStatusBadge,
  RequireAccount,
  ReturnStatusBadge,
} from "../components/account/common.jsx";
import {
  ChevronRightIcon,
  PackageIcon,
  RotateCcwIcon,
  SearchIcon,
} from "../components/icons.jsx";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";

const PERIODS = [
  { id: "30j", label: "30 jours", days: 30 },
  { id: "6m", label: "6 mois", days: 183 },
  { id: "1a", label: "1 an", days: 365 },
  { id: "tout", label: "Tout", days: null },
];

function OrdersList() {
  const [orders, setOrders] = useState(null);
  const [returnsByOrder, setReturnsByOrder] = useState({});
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  // cutoff calculé au clic (event handler) pour garder le rendu pur
  const [periodFilter, setPeriodFilter] = useState({ id: "tout", cutoff: null });

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(data.results ?? data))
      .catch((err) => {
        setError(extractErrorMessage(err));
        setOrders([]);
      });
    fetchReturnRequests()
      .then((data) => {
        const map = {};
        for (const request of data.results ?? data) map[request.order] = request;
        setReturnsByOrder(map);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const { cutoff } = periodFilter;
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (cutoff && new Date(order.created_at).getTime() < cutoff) return false;
      if (!query) return true;
      return (
        orderRef(order.id).toLowerCase().includes(query) ||
        order.items?.some((item) => item.product_name?.toLowerCase().includes(query))
      );
    });
  }, [orders, search, periodFilter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <AccountBreadcrumb />

      <h1 className="mb-1 text-2xl font-bold text-ink">Vos commandes</h1>
      <p className="mb-6 text-sm text-muted">
        Consultez, suivez et gérez vos commandes passées et en cours.
      </p>

      {/* Recherche + période */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Rechercher une commande ou un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-black/15 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-black/15 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                setPeriodFilter({
                  id: p.id,
                  cutoff: p.days ? Date.now() - p.days * 24 * 60 * 60 * 1000 : null,
                })
              }
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                periodFilter.id === p.id ? "bg-brand text-white" : "text-muted hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {orders === null && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-black/10 bg-brand-pale" />
          ))}
        </div>
      )}

      {orders !== null && filtered.length === 0 && (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-16 text-center text-muted">
          <PackageIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-ink">
            {orders.length === 0 ? "Aucune commande pour le moment" : "Aucune commande trouvée"}
          </p>
          {orders.length === 0 && (
            <Link
              to="/catalogue"
              className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
            >
              Découvrir la collection
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((order) => {
          const returnRequest = returnsByOrder[order.id];
          return (
            <div key={order.id} className="rounded-xl border border-black/10 bg-white">
              {/* En-tête de commande */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-black/5 bg-gray-50 p-4">
                <div className="flex flex-wrap gap-6 text-xs text-muted">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink">Commande</p>
                    <p className="mt-0.5 font-mono">{orderRef(order.id)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink">Date</p>
                    <p className="mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink">Total</p>
                    <p className="mt-0.5 font-bold text-ink">{formatXof(order.total_xof)}</p>
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Articles */}
              <div className="flex flex-col gap-3 p-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-pale">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/produits/${item.product_slug}`}
                        className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-dark"
                      >
                        {item.product_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        Qté : {item.quantity} · {formatXof(item.unit_price_xof)} / unité
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink">{formatXof(item.subtotal_xof)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
                <Link
                  to={`/compte/commandes/${order.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
                >
                  Détails et suivi <ChevronRightIcon size={13} />
                </Link>
                {order.status === "delivered" && !returnRequest && (
                  <Link
                    to={`/compte/commandes/${order.id}#retour`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand-pale px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-light"
                  >
                    <RotateCcwIcon size={13} /> Retourner un article
                  </Link>
                )}
                {returnRequest && <ReturnStatusBadge status={returnRequest.status} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Orders() {
  return (
    <RequireAccount>
      <OrdersList />
    </RequireAccount>
  );
}
