import ProductImage from "../ProductImage.jsx";
import {
  AlertCircleIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  MapPinIcon,
  MessageSquareIcon,
  PackageIcon,
  PhoneIcon,
  RefreshCwIcon,
  SendIcon,
  StoreIcon,
  TruckIcon,
  XIcon,
} from "../icons.jsx";
import OrderStatusPill from "./OrderStatusPill.jsx";
import { formatXof } from "../../utils/format.js";
import { ORDER_STATUS, initialsOf, itemsCount, orderCustomerName } from "../../utils/sellerOrders.js";
import {
  FAILED_PAYMENT_STATUSES,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS,
  buildHistory,
  customerMessages,
  formatDateTime,
  isPickupOnly,
  itemsSubtotal,
  whatsappUrl,
} from "../../utils/sellerOrderDetail.js";

const card = "rounded-2xl border border-black/[0.07] bg-white";
const cardTitle = "flex items-center gap-2 text-[15px] font-bold text-ink";
const ghostButton =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-black/[0.08] bg-white px-3 py-2 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand-dark";

function Row({ label, children, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className={`min-w-0 text-right ${strong ? "font-bold text-ink" : "font-semibold text-ink"}`}>{children}</span>
    </div>
  );
}

function ItemsCard({ order }) {
  const items = order.items ?? [];
  const subtotal = itemsSubtotal(order);
  const discount = Number(order.discount_xof) || 0;
  const deliveryFee = Number(order.delivery_zone?.fee_xof) || 0;

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
        <h2 className={cardTitle}>
          <PackageIcon size={16} className="text-brand-dark" />
          Articles
        </h2>
        <span className="text-[13px] font-medium text-muted">
          {itemsCount(order)} article{itemsCount(order) > 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-muted">Aucun article dans cette commande.</p>
      ) : (
        <table className="w-full table-fixed text-left">
          <thead className="bg-[#F4F4F8] text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            <tr>
              <th className="py-2.5 pl-6 font-bold">Produit</th>
              <th className="w-28 py-2.5 text-right font-bold">Prix unit.</th>
              <th className="w-14 py-2.5 text-center font-bold">Qté</th>
              <th className="w-32 py-2.5 pr-6 text-right font-bold">Sous-total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {items.map((item) => {
              const options = (item.selected_options ?? [])
                .map((opt) => (opt?.group_name ? `${opt.group_name} : ${opt.option_name}` : opt?.option_name))
                .filter(Boolean);
              const lineTotal =
                Number(item.subtotal_xof) || (Number(item.unit_price_xof) || 0) * (Number(item.quantity) || 1);
              return (
                <tr key={item.id}>
                  <td className="py-3.5 pl-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#F3F4F6]">
                        {item.product_image ? (
                          <ProductImage src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                        ) : (
                          <PackageIcon size={18} className="text-[#9CA3AF]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink" title={item.product_name}>
                          {item.product_name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                          {item.color_name ? (
                            <span className="inline-flex items-center gap-1">
                              {item.color_hex ? (
                                <span
                                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                                  style={{ backgroundColor: item.color_hex }}
                                />
                              ) : null}
                              {item.color_name}
                            </span>
                          ) : null}
                          {options.map((label) => (
                            <span key={label}>{label}</span>
                          ))}
                          {item.delivery_method === "pickup" ? (
                            <span className="rounded-full bg-[#F4F4F8] px-1.5 py-px font-semibold">Retrait</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-right text-sm whitespace-nowrap text-muted">{formatXof(item.unit_price_xof)}</td>
                  <td className="py-3.5 text-center text-sm font-semibold text-ink">{item.quantity}</td>
                  <td className="py-3.5 pr-6 text-right text-sm font-bold whitespace-nowrap text-ink">{formatXof(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="space-y-2 border-t border-black/[0.06] bg-[#FAFAFC] px-6 py-4">
        <Row label="Sous-total articles">{formatXof(subtotal)}</Row>
        {discount > 0 ? (
          <Row label={order.coupon_code ? `Remise (${order.coupon_code})` : "Remise"}>
            <span className="text-emerald-700">− {formatXof(discount)}</span>
          </Row>
        ) : null}
        {order.delivery_zone ? (
          <Row label={`Livraison · ${order.delivery_zone.name}`}>{deliveryFee > 0 ? formatXof(deliveryFee) : "Offerte"}</Row>
        ) : null}
        <div className="flex items-center justify-between gap-4 border-t border-black/[0.06] pt-2">
          <span className="text-sm font-bold text-ink">Total</span>
          <span className="text-lg font-extrabold text-ink">{formatXof(order.total_xof)}</span>
        </div>
      </div>
    </section>
  );
}

const STEP_STYLE = {
  done: { dot: "border-emerald-500 bg-emerald-500 text-white", line: "bg-emerald-300", text: "text-ink" },
  current: { dot: "border-brand bg-brand text-white", line: "bg-black/[0.08]", text: "text-brand-dark" },
  cancelled: { dot: "border-red-600 bg-red-600 text-white", line: "bg-black/[0.08]", text: "text-red-700" },
  todo: { dot: "border-black/15 bg-white text-[#9CA3AF]", line: "bg-black/[0.08]", text: "text-[#9CA3AF]" },
};

function HistoryCard({ order }) {
  const steps = buildHistory(order);
  return (
    <section className={`${card} p-6`}>
      <h2 className={cardTitle}>
        <ClockIcon size={16} className="text-brand-dark" />
        Historique
      </h2>
      <ol className="mt-5">
        {steps.map((step, i) => {
          const style = STEP_STYLE[step.state];
          const isLast = i === steps.length - 1;
          return (
            <li key={step.key} className="flex gap-3.5" data-state={step.state}>
              <div className="flex flex-col items-center">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${style.dot}`}>
                  {step.state === "done" ? (
                    <CheckIcon size={13} />
                  ) : step.state === "cancelled" ? (
                    <XIcon size={13} />
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${step.state === "current" ? "bg-white" : "bg-black/10"}`} />
                  )}
                </span>
                {!isLast && <span className={`my-1 min-h-6 w-0.5 flex-1 ${style.line}`} />}
              </div>
              <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-5"}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className={`text-sm font-semibold ${style.text}`}>{step.label}</p>
                  {step.state === "current" ? (
                    <span className="rounded-full bg-brand-light px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">En cours</span>
                  ) : null}
                </div>
                {step.date ? <p className="mt-0.5 text-xs text-muted">{formatDateTime(step.date)}</p> : null}
                {step.note ? <p className="mt-0.5 text-xs text-muted">{step.note}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StatusActionsCard({
  order,
  statusSelection,
  onStatusSelectionChange,
  onSubmitStatus,
  saving,
  statusError,
  maintenanceMode,
}) {
  return (
    <section className={`${card} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={cardTitle}>
          <TruckIcon size={16} className="text-brand-dark" />
          Statut et actions
        </h2>
        <OrderStatusPill status={order.status} />
      </div>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="sr-only">Nouveau statut</span>
          <select
            value={statusSelection}
            disabled={maintenanceMode}
            onChange={(e) => onStatusSelectionChange(e.target.value)}
            className="min-h-10 w-full rounded-[10px] border border-black/[0.08] bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {Object.entries(ORDER_STATUS).map(([st, cfg]) => (
              <option key={st} value={st}>
                {cfg.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onSubmitStatus}
          disabled={saving || maintenanceMode || statusSelection === order.status}
          title={maintenanceMode ? "Boutique en maintenance" : undefined}
          className={`min-h-10 w-full rounded-[10px] px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
            statusSelection === "cancelled" && order.status !== "cancelled"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-ink hover:bg-black"
          }`}
        >
          {saving
            ? "Enregistrement…"
            : statusSelection === "cancelled" && order.status !== "cancelled"
              ? "Annuler la commande…"
              : "Mettre à jour le statut"}
        </button>
        {statusError ? (
          <p role="alert" className="text-sm text-red-600">
            {statusError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CustomerCard({ order }) {
  const name = orderCustomerName(order);
  const messages = customerMessages(order);
  const paymentStatus = order.payment_info?.status;
  return (
    <section className={`${card} p-5`}>
      <h2 className={cardTitle}>Client</h2>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
          {initialsOf(name) || "#"}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{name}</p>
          {order.phone ? <p className="truncate text-xs text-muted">{order.phone}</p> : null}
          {order.email ? <p className="truncate text-xs text-muted">{order.email}</p> : null}
        </div>
      </div>
      {order.phone ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={`tel:${order.phone}`} className={ghostButton}>
              <PhoneIcon size={14} />
              Appeler
            </a>
            <a
              href={whatsappUrl(order.phone, messages.contact)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-3 py-2 text-[13px] font-bold text-white transition hover:bg-brand-dark"
            >
              <MessageSquareIcon size={14} />
              WhatsApp
            </a>
          </div>
          <p className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Messages rapides</p>
          <div className="space-y-1.5">
            <a href={whatsappUrl(order.phone, messages.confirm)} target="_blank" rel="noopener noreferrer" className={ghostButton}>
              <SendIcon size={14} />
              Confirmer la commande
            </a>
            <a
              href={whatsappUrl(order.phone, paymentStatus === "pending" ? messages.paymentPending : messages.paymentFailed)}
              target="_blank"
              rel="noopener noreferrer"
              className={ghostButton}
            >
              <SendIcon size={14} />
              Relancer le paiement
            </a>
            <a href={whatsappUrl(order.phone, messages.outOfStock)} target="_blank" rel="noopener noreferrer" className={ghostButton}>
              <SendIcon size={14} />
              Rupture de stock
            </a>
          </div>
        </>
      ) : null}
    </section>
  );
}

function DeliveryCard({ order }) {
  const pickupOnly = isPickupOnly(order);
  const hasCoords = order.latitude != null && order.longitude != null && order.latitude !== "" && order.longitude !== "";
  const address = [order.address, order.city].filter(Boolean).join(", ");
  return (
    <section className={`${card} p-5`}>
      <h2 className={cardTitle}>
        {pickupOnly ? <StoreIcon size={16} className="text-brand-dark" /> : <MapPinIcon size={16} className="text-brand-dark" />}
        Livraison
      </h2>
      <div className="mt-4 space-y-2.5">
        <Row label="Mode">{pickupOnly ? "Retrait en boutique" : "Livraison à domicile"}</Row>
        {order.delivery_zone ? <Row label="Zone">{order.delivery_zone.name}</Row> : null}
        {order.delivery_zone ? (
          <Row label="Frais">{Number(order.delivery_zone.fee_xof) > 0 ? formatXof(order.delivery_zone.fee_xof) : "Offerts"}</Row>
        ) : null}
        {!pickupOnly ? (
          <div className="rounded-xl bg-[#F4F4F8] px-3 py-2.5 text-sm text-ink">
            <p className="text-xs font-semibold text-muted">Adresse</p>
            <p className="mt-0.5 break-words">{address || "Non renseignée"}</p>
            {hasCoords ? (
              <a
                href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-brand-dark hover:underline"
              >
                <ExternalLinkIcon size={12} />
                Voir sur la carte
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PaymentCard({
  order,
  maintenanceMode,
  confirming,
  confirmResult,
  onConfirmPayment,
  relaunching,
  relaunchResult,
  onRelaunchPayment,
}) {
  const payment = order.payment_info;
  return (
    <section className={`${card} p-5`}>
      <h2 className={cardTitle}>
        <CreditCardIcon size={16} className="text-brand-dark" />
        Paiement
      </h2>
      {!payment ? (
        <p className="mt-3 text-sm text-muted">Aucun paiement enregistré pour cette commande.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          <Row label="Statut">
            <span className={PAYMENT_STATUS[payment.status]?.tone ?? "text-ink"}>
              {PAYMENT_STATUS[payment.status]?.label ?? payment.status}
            </span>
          </Row>
          <Row label="Mode">{PAYMENT_METHOD_LABEL[payment.method] ?? payment.method}</Row>
          {payment.amount_xof != null ? <Row label="Montant">{formatXof(payment.amount_xof)}</Row> : null}

          {payment.status === "pending" ? (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onConfirmPayment}
                disabled={confirming || maintenanceMode}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckIcon size={14} />
                {confirming ? "Confirmation en cours…" : "Confirmer le paiement reçu"}
              </button>
              {confirmResult ? (
                confirmResult.success ? (
                  <p role="status" className="text-sm text-emerald-700">
                    Paiement confirmé.
                  </p>
                ) : (
                  <p role="alert" className="text-sm text-red-600">
                    {confirmResult.message || "Échec."}
                  </p>
                )
              ) : null}
            </div>
          ) : null}

          {FAILED_PAYMENT_STATUSES.includes(payment.status) ? (
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onRelaunchPayment}
                disabled={relaunching || maintenanceMode}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCwIcon size={14} />
                {relaunching ? "Relance en cours…" : "Relancer le paiement"}
              </button>
              {relaunchResult ? (
                relaunchResult.success && relaunchResult.payment_url ? (
                  <a
                    href={relaunchResult.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <ExternalLinkIcon size={14} />
                    Nouveau lien de paiement
                  </a>
                ) : (
                  <p role="alert" className="text-sm text-red-600">
                    {relaunchResult.message || "Échec."}
                  </p>
                )
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default function OrderDetailDesktop({
  order,
  maintenanceMode = false,
  pageError = "",
  statusSelection,
  onStatusSelectionChange,
  onSubmitStatus,
  saving = false,
  statusError = "",
  confirming = false,
  confirmResult = null,
  onConfirmPayment,
  relaunching = false,
  relaunchResult = null,
  onRelaunchPayment,
}) {
  return (
    <div className="space-y-5 px-8 pt-7 pb-8">
      {maintenanceMode ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
        >
          <AlertCircleIcon size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <span>
            Boutique en maintenance — les actions (changement de statut, confirmation et relance du paiement) sont
            suspendues.
          </span>
        </div>
      ) : null}

      {pageError ? (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircleIcon size={17} className="mt-0.5 shrink-0" />
          <span>{pageError}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <ItemsCard order={order} />
          <HistoryCard order={order} />
        </div>

        <div className="min-w-0 space-y-5">
          <StatusActionsCard
            order={order}
            statusSelection={statusSelection}
            onStatusSelectionChange={onStatusSelectionChange}
            onSubmitStatus={onSubmitStatus}
            saving={saving}
            statusError={statusError}
            maintenanceMode={maintenanceMode}
          />
          <CustomerCard order={order} />
          <DeliveryCard order={order} />
          <PaymentCard
            order={order}
            maintenanceMode={maintenanceMode}
            confirming={confirming}
            confirmResult={confirmResult}
            onConfirmPayment={onConfirmPayment}
            relaunching={relaunching}
            relaunchResult={relaunchResult}
            onRelaunchPayment={onRelaunchPayment}
          />
        </div>
      </div>
    </div>
  );
}
