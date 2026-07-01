import { useEffect, useState } from "react";
import { fetchDeliveries, updateDelivery } from "../api/delivery.js";
import { fetchOrders, updateOrderStatus } from "../api/orders.js";
import { fetchPayments } from "../api/payments.js";
import { useAuth } from "../context/AuthContext.jsx";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";

const TABS = [
  { key: "orders", label: "Commandes" },
  { key: "payments", label: "Paiements" },
  { key: "deliveries", label: "Livraisons" },
];

const ORDER_STATUSES = [
  { value: "received", label: "Reçue" },
  { value: "prepared", label: "Préparée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

const DELIVERY_STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "assigned", label: "Affectée" },
  { value: "in_transit", label: "En route" },
  { value: "delivered", label: "Livrée" },
];

function unwrap(data) {
  return data.results ?? data;
}

function OrdersTable({ orders, onStatusChange }) {
  return (
    <table className="mt-4 w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-muted">
          <th className="py-2 pr-2">#</th>
          <th className="py-2 pr-2">Client</th>
          <th className="py-2 pr-2">Téléphone</th>
          <th className="py-2 pr-2">Total</th>
          <th className="py-2 pr-2">Statut</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-b border-gray-100">
            <td className="py-2 pr-2 text-ink">ANW-{order.id}</td>
            <td className="py-2 pr-2 text-ink">{order.full_name}</td>
            <td className="py-2 pr-2 text-ink">{order.phone}</td>
            <td className="py-2 pr-2 text-ink">{formatXof(order.total_xof)}</td>
            <td className="py-2 pr-2">
              <select
                value={order.status}
                onChange={(event) => onStatusChange(order.id, event.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                {ORDER_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PaymentsTable({ payments }) {
  return (
    <table className="mt-4 w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-muted">
          <th className="py-2 pr-2">#</th>
          <th className="py-2 pr-2">Commande</th>
          <th className="py-2 pr-2">Méthode</th>
          <th className="py-2 pr-2">Montant</th>
          <th className="py-2 pr-2">Statut</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((payment) => (
          <tr key={payment.id} className="border-b border-gray-100">
            <td className="py-2 pr-2 text-ink">{payment.id}</td>
            <td className="py-2 pr-2 text-ink">ANW-{payment.order}</td>
            <td className="py-2 pr-2 text-ink">{payment.method}</td>
            <td className="py-2 pr-2 text-ink">{formatXof(payment.amount_xof)}</td>
            <td className="py-2 pr-2 text-ink">{payment.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DeliveriesTable({ deliveries, onChange }) {
  return (
    <table className="mt-4 w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-muted">
          <th className="py-2 pr-2">#</th>
          <th className="py-2 pr-2">Zone</th>
          <th className="py-2 pr-2">Créneau</th>
          <th className="py-2 pr-2">Livreur</th>
          <th className="py-2 pr-2">Statut</th>
        </tr>
      </thead>
      <tbody>
        {deliveries.map((delivery) => (
          <tr key={delivery.id} className="border-b border-gray-100">
            <td className="py-2 pr-2 text-ink">{delivery.id}</td>
            <td className="py-2 pr-2 text-ink">{delivery.zone.name}</td>
            <td className="py-2 pr-2 text-ink">{delivery.slot.label}</td>
            <td className="py-2 pr-2">
              <input
                type="text"
                defaultValue={delivery.courier_name}
                placeholder="Nom du livreur"
                onBlur={(event) => onChange(delivery.id, { courier_name: event.target.value })}
                className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
            </td>
            <td className="py-2 pr-2">
              <select
                value={delivery.status}
                onChange={(event) => onChange(delivery.id, { status: event.target.value })}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                {DELIVERY_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = Boolean(user?.is_staff);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([fetchOrders(), fetchPayments(), fetchDeliveries()])
      .then(([ordersData, paymentsData, deliveriesData]) => {
        setOrders(unwrap(ordersData));
        setPayments(unwrap(paymentsData));
        setDeliveries(unwrap(deliveriesData));
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (authLoading) return <p className="py-10 text-center text-muted">Chargement…</p>;

  if (!isAdmin) {
    return <p className="py-10 text-center text-ink">Accès réservé à l'administrateur.</p>;
  }

  if (loading) return <p className="py-10 text-center text-muted">Chargement…</p>;

  const handleOrderStatusChange = async (orderId, status) => {
    const previous = orders;
    setOrders((current) => current.map((o) => (o.id === orderId ? { ...o, status } : o)));
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      setOrders(previous);
      setError(extractErrorMessage(err));
    }
  };

  const handleDeliveryChange = async (deliveryId, patch) => {
    const previous = deliveries;
    setDeliveries((current) => current.map((d) => (d.id === deliveryId ? { ...d, ...patch } : d)));
    try {
      await updateDelivery(deliveryId, patch);
    } catch (err) {
      setDeliveries(previous);
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Dashboard admin</h1>

      <div className="mt-4 flex gap-4 border-b border-gray-200 text-sm font-medium">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-1 py-2 ${
              activeTab === tab.key ? "border-brand-dark text-brand-dark" : "border-transparent text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {activeTab === "orders" && <OrdersTable orders={orders} onStatusChange={handleOrderStatusChange} />}
      {activeTab === "payments" && <PaymentsTable payments={payments} />}
      {activeTab === "deliveries" && (
        <DeliveriesTable deliveries={deliveries} onChange={handleDeliveryChange} />
      )}
    </div>
  );
}
