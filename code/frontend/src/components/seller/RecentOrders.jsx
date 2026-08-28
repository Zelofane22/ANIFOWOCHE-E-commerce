import { Link } from "react-router";
import { formatXof } from "../../utils/format.js";

const STATUS_CONFIG = {
  received: { label: "Recue", color: "bg-blue-500" },
  prepared: { label: "Preparee", color: "bg-amber-500" },
  delivered: { label: "Livree", color: "bg-emerald-500" },
  cancelled: { label: "Annulee", color: "bg-red-500" },
};

export default function RecentOrders({ recentOrders }) {
  if (recentOrders.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Aucune commande pour le moment.
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {recentOrders.map((order) => {
        const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
        return (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="flex items-center justify-between py-3 transition first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <span className={`h-2 w-2 shrink-0 rounded-full ${status.color}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {order.full_name || order.customer_name || `Commande #${order.id}`}
                </p>
                <p className="text-xs text-gray-400">{status.label}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatXof(order.total_xof ?? order.total)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
