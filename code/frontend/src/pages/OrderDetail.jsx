import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { getOrder } from "../api/orders.js";
import { getPayments } from "../api/payments.js";
import { createReturnRequest, fetchReturnRequests } from "../api/returns.js";
import {
  AccountBreadcrumb,
  OrderStatusBadge,
  RequireAccount,
  ReturnStatusBadge,
} from "../components/account/common.jsx";
import { formatDate, orderRef } from "../components/account/orderHelpers.js";
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleIcon,
  CreditCardIcon,
  FileTextIcon,
  MapPinIcon,
  PackageIcon,
  RotateCcwIcon,
  TruckIcon,
} from "../components/icons.jsx";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";
import { optimizedImage } from "../utils/imageUrl.js";

const TIMELINE_STEPS = [
  { status: "received", label: "Commande reçue" },
  { status: "prepared", label: "En préparation" },
  { status: "delivered", label: "Livrée" },
];

const RETURN_REASONS = [
  "Article ne correspond pas à la description",
  "Mauvaise taille / dimensions incorrectes",
  "Défaut de fabrication ou article endommagé",
  "Article reçu en mauvais état (emballage)",
  "J'ai changé d'avis",
  "Article reçu en double",
  "Autre raison",
];

const PAYMENT_METHOD_LABELS = {
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  card: "Carte bancaire",
};

const PAYMENT_STATUS_LABELS = {
  pending: "En attente",
  approved: "Confirmé",
  declined: "Refusé",
  canceled: "Annulé",
  failed: "Non finalisé",
};

function TrackingTimeline({ order }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <AlertCircleIcon size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Commande annulée</p>
          <p className="mt-0.5 text-red-600">
            Annulée le {formatDate(order.updated_at)}. Contactez-nous sur WhatsApp pour toute
            question.
          </p>
        </div>
      </div>
    );
  }

  const doneIndex = TIMELINE_STEPS.findIndex((step) => step.status === order.status);

  return (
    <div>
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= doneIndex;
        const isActive = i === doneIndex;
        const isLast = i === TIMELINE_STEPS.length - 1;
        const date =
          i === 0 ? formatDate(order.created_at) : isActive ? formatDate(order.updated_at) : "—";
        return (
          <div key={step.status} className="flex gap-4">
            <div className="flex shrink-0 flex-col items-center">
              <div
                className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  done
                    ? isActive
                      ? "border-brand bg-brand"
                      : "border-green-500 bg-green-500"
                    : "border-black/20 bg-white"
                }`}
              >
                {done ? (
                  <CheckIcon size={14} className="text-white" />
                ) : (
                  <CircleIcon size={10} className="text-black/20" />
                )}
              </div>
              {!isLast && (
                <div className={`my-1 min-h-7 w-0.5 flex-1 ${done && i < doneIndex ? "bg-green-300" : "bg-black/10"}`} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p
                className={`text-sm font-semibold ${
                  done ? (isActive ? "text-brand-dark" : "text-ink") : "text-black/30"
                }`}
              >
                {step.label}
                {isActive && !isLast && (
                  <span className="ml-2 rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-dark">
                    En cours
                  </span>
                )}
              </p>
              <p className={`mt-0.5 text-xs ${done ? "text-muted" : "text-black/25"}`}>{date}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReturnSection({ order, returnRequest, onCreated }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (returnRequest) {
    return (
      <div id="retour" className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
          <RotateCcwIcon size={15} className="text-brand-dark" />
          Retour
        </h2>
        <div className="mb-3">
          <ReturnStatusBadge status={returnRequest.status} />
        </div>
        <p className="text-sm text-muted">
          Demandé le {formatDate(returnRequest.created_at)} — « {returnRequest.reason} »
        </p>
        {returnRequest.status === "refunded" && returnRequest.refund_amount_xof > 0 && (
          <p className="mt-2 text-sm font-semibold text-green-700">
            Remboursement : {formatXof(returnRequest.refund_amount_xof)}
          </p>
        )}
        {returnRequest.status === "requested" && (
          <p className="mt-2 text-xs text-muted">
            Notre équipe examine votre demande — vous serez contacté sous 48h.
          </p>
        )}
      </div>
    );
  }

  if (order.status !== "delivered") {
    if (order.status === "cancelled") return null;
    return (
      <div id="retour" className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="mb-2 flex items-center gap-2 font-bold text-ink">
          <RotateCcwIcon size={15} className="text-brand-dark" />
          Retour
        </h2>
        <p className="text-sm text-muted">
          Le retour d'articles est possible une fois la commande livrée.
        </p>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fullReason = comment.trim() ? `${reason} — ${comment.trim()}` : reason;
      const created = await createReturnRequest({ order_id: order.id, reason: fullReason });
      onCreated(created);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="retour" className="rounded-xl border border-black/10 bg-white p-5">
      <h2 className="mb-2 flex items-center gap-2 font-bold text-ink">
        <RotateCcwIcon size={15} className="text-brand-dark" />
        Retourner un article
      </h2>
      {!open ? (
        <>
          <p className="mb-4 text-sm text-muted">
            Un problème avec votre commande ? Vous pouvez demander un retour sous 7 jours après la
            livraison.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full rounded-lg border border-brand/40 bg-brand-pale px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-light"
          >
            Demander un retour
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-ink">
            Motif du retour *
            <select
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm font-normal focus:border-brand focus:outline-none"
            >
              <option value="">Sélectionnez un motif…</option>
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-ink">
            Commentaire <span className="font-normal text-muted">(optionnel)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Décrivez le problème en détail si nécessaire…"
              className="mt-1 block w-full resize-none rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm font-normal focus:border-brand focus:outline-none"
            />
          </label>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !reason}
              className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-medium disabled:bg-gray-200 disabled:text-gray-400"
            >
              {submitting ? "Envoi…" : "Envoyer la demande"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function OrderDetailContent() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [returnRequest, setReturnRequest] = useState(null);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch((err) => setError(extractErrorMessage(err)));
    fetchReturnRequests()
      .then((data) => {
        const found = (data.results ?? data).find((request) => request.order === Number(id));
        if (found) setReturnRequest(found);
      })
      .catch(() => {});
    getPayments()
      .then((data) => {
        const found = (data.results ?? data).find((p) => p.order === Number(id));
        if (found) setPayment(found);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (order && location.hash === "#retour") {
      document.getElementById("retour")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [order, location.hash]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <AccountBreadcrumb to="/compte/commandes" label="Vos commandes" />
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <AccountBreadcrumb to="/compte/commandes" label="Vos commandes" />
        <div className="h-64 animate-pulse rounded-xl border border-black/10 bg-brand-pale" />
      </div>
    );
  }

  const summary = [
    { label: "N° commande", value: orderRef(order.id), mono: true },
    { label: "Date", value: formatDate(order.created_at) },
    { label: "Total", value: formatXof(order.total_xof), bold: true },
    {
      label: "Paiement",
      value: payment
        ? PAYMENT_METHOD_LABELS[payment.method] ?? payment.method
        : "À la livraison",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex items-center gap-2 text-sm text-muted">
        <Link
          to="/compte/commandes"
          className="inline-flex items-center gap-1 font-medium transition hover:text-brand-dark"
        >
          Vos commandes
        </Link>
        <ChevronRightIcon size={12} />
        <span className="font-mono text-ink">{orderRef(order.id)}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Détails de la commande</h1>
          <p className="mt-1 text-sm text-muted">Passée le {formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          {/* Résumé */}
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
              <FileTextIcon size={16} className="text-brand-dark" />
              Résumé de la commande
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {summary.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {item.label}
                  </p>
                  <p
                    className={`mt-1 text-ink ${item.mono ? "font-mono" : ""} ${
                      item.bold ? "font-bold" : ""
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            {order.discount_xof > 0 && (
              <p className="mt-3 text-xs font-medium text-green-700">
                Remise appliquée ({order.coupon_code}) : −{formatXof(order.discount_xof)}
              </p>
            )}
          </div>

          {/* Suivi */}
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-5 flex items-center gap-2 font-bold text-ink">
              <TruckIcon size={16} className="text-brand-dark" />
              Suivi de la commande
            </h2>
            <TrackingTimeline order={order} />
          </div>

          {/* Articles */}
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
              <PackageIcon size={16} className="text-brand-dark" />
              Articles commandés
            </h2>
            <div className="flex flex-col gap-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-pale">
                    {item.product_image && (
                      <img
                        src={optimizedImage(item.product_image, 200)}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <Link
                      to={`/produits/${item.product_slug}`}
                      className="text-sm font-semibold leading-snug text-ink hover:text-brand-dark"
                    >
                      {item.product_name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      Qté : {item.quantity} · {formatXof(item.unit_price_xof)} / unité
                    </p>
                    <p className="mt-1 font-bold text-ink">{formatXof(item.subtotal_xof)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
              <MapPinIcon size={15} className="text-brand-dark" />
              Adresse de livraison
            </h2>
            <p className="text-sm font-semibold text-ink">{order.full_name}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {order.address}, {order.city}
            </p>
            <p className="mt-1 text-sm text-muted">{order.phone}</p>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
              <CreditCardIcon size={15} className="text-brand-dark" />
              Paiement
            </h2>
            {payment ? (
              <>
                <p className="text-sm text-muted">
                  {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method} ·{" "}
                  {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                </p>
                <p className="mt-1 text-sm font-bold text-ink">{formatXof(payment.amount_xof)}</p>
              </>
            ) : (
              <p className="text-sm text-muted">
                Aucun paiement en ligne enregistré pour cette commande.
              </p>
            )}
          </div>

          <ReturnSection order={order} returnRequest={returnRequest} onCreated={setReturnRequest} />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  return (
    <RequireAccount>
      <OrderDetailContent />
    </RequireAccount>
  );
}
