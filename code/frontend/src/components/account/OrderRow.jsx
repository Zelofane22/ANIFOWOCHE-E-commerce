import { Link } from "react-router";
import { ChevronRightIcon } from "../../components/icons.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import { formatDate, orderRef } from "./orderHelpers.js";
import { OrderStatusBadge } from "./common.jsx";
import { formatXof } from "../../utils/format.js";

export default function OrderRow({ order, to }) {
  const firstItem = order.items?.[0];
  return (
    <Link
      to={to ?? `/compte/commandes/${order.id}`}
      className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-4 transition hover:shadow-md"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-brand-pale">
        {firstItem?.product_image && (
          <ProductImage
            src={firstItem.product_image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">
          {orderRef(order.id)} · {formatDate(order.created_at)}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink">
          {firstItem?.product_name ?? "—"}
          {order.items?.length > 1 ? ` +${order.items.length - 1}` : ""}
        </p>
        <div className="mt-1">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-ink">{formatXof(order.total_xof)}</p>
        <ChevronRightIcon size={16} className="ml-auto mt-1 text-muted" />
      </div>
    </Link>
  );
}
