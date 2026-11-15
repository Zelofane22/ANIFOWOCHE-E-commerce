import { ORDER_STATUS } from "../../utils/sellerOrders.js";

export default function OrderStatusPill({ status }) {
  const meta = ORDER_STATUS[status] || ORDER_STATUS.received;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
