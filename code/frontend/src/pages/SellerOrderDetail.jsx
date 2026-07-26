import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getSellerOrder, getSellerProfile, relaunchSellerPayment, updateSellerOrderStatus } from "../api/seller.js";
import { OrderStatusBadge } from "../components/account/common.jsx";
import { formatDate, ORDER_STATUS, orderRef } from "../components/account/orderHelpers.js";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MapPinIcon,
  MessageSquareIcon,
  PackageIcon,
  RefreshCwIcon,
  SendIcon,
  TruckIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";

const PAYMENT_STATUS_LABEL = {
  pending: "En attente",
  approved: "Approuvé",
  declined: "Refusé",
  canceled: "Annulé",
  failed: "Échec",
};

const PAYMENT_METHOD_LABEL = {
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  card: "Carte bancaire",
  cash_on_delivery: "Paiement à la livraison",
};

function whatsappUrl(phone, message) {
  const clean = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export default function SellerOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [order, setOrder] = useState(null);
  const [statusSelection, setStatusSelection] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [relaunching, setRelaunching] = useState(false);
  const [relaunchResult, setRelaunchResult] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/seller/login", { replace: true });
      return;
    }

    Promise.all([getSellerProfile(), getSellerOrder(id)])
      .then(([sellerData, orderData]) => {
        setSeller(sellerData);
        setOrder(orderData);
        setStatusSelection(orderData.status);
      })
      .catch((error) => {
        if (error?.response?.status === 404) {
          navigate("/seller/orders", { replace: true });
          return;
        }
        setPageError(extractErrorMessage(error));
      })
      .finally(() => setPageLoading(false));
  }, [id, isAuthenticated, loading, navigate]);

  const handleUpdateStatus = async (reason = "") => {
    if (!order || (statusSelection === order.status && !reason)) return;

    setSaving(true);
    setStatusError("");

    try {
      const payload = { status: statusSelection };
      if (statusSelection === "cancelled" && reason) payload.cancellation_reason = reason;
      const updatedOrder = await updateSellerOrderStatus(order.id, payload);
      setOrder((prevOrder) =>
        prevOrder ? { ...prevOrder, ...updatedOrder, updated_at: updatedOrder.updated_at ?? prevOrder.updated_at } : prevOrder
      );
      setStatusSelection(updatedOrder.status);
    } catch (error) {
      setStatusError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConfirm = async () => {
    setShowCancelModal(false);
    await handleUpdateStatus(cancelReason);
    setCancelReason("");
  };

  const handleRelaunchPayment = async () => {
    setRelaunching(true);
    setRelaunchResult(null);
    try {
      const result = await relaunchSellerPayment(order.id);
      setRelaunchResult({ success: true, payment_url: result.payment_url });
    } catch (error) {
      setRelaunchResult({ success: false, message: extractErrorMessage(error) });
    } finally {
      setRelaunching(false);
    }
  };

  if (loading || pageLoading || !seller || !order) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center text-muted">Chargement...</div>
    );
  }

  return (
    <SellerShell title="Détail de la commande" seller={seller}>
      <div className="space-y-4">
        <Link
          to="/seller/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark transition hover:text-brand-medium"
        >
          <ChevronLeftIcon size={15} />
          Retour aux commandes
        </Link>

        {pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircleIcon size={17} className="mt-0.5 shrink-0" />
              <span>{pageError}</span>
            </div>
          </div>
        ) : null}

        <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Commande</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">{orderRef(order.id)}</h2>
              <p className="mt-2 text-sm text-muted">
                Reçue le {formatDate(order.created_at)} · Dernière mise à jour {formatDate(order.updated_at)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/10 bg-[#fbfaf7] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <FileTextIcon size={15} className="text-brand-dark" />
                  Résumé commande
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-black/10 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total</p>
                    <p className="mt-1 text-lg font-bold text-ink">{formatXof(order.total_xof)}</p>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Réduction</p>
                    <p className="mt-1 text-lg font-bold text-ink">{formatXof(order.discount_xof)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <PackageIcon size={15} className="text-brand-dark" />
                  Articles à préparer
                </div>
                <div className="mt-4 space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="rounded-xl border border-black/10 bg-[#fbfaf7] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{item.product_name}</p>
                          <p className="mt-1 text-sm text-muted">
                            Qté {item.quantity} · Prix unitaire {formatXof(item.unit_price_xof)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-ink">{formatXof(item.subtotal_xof)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <TruckIcon size={15} className="text-brand-dark" />
                  Statut et suivi
                </div>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-semibold text-ink" htmlFor="seller-order-status">
                    Changer le statut
                    <select
                      id="seller-order-status"
                      value={statusSelection}
                      onChange={(event) => setStatusSelection(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      {Object.entries(ORDER_STATUS).map(([status, cfg]) => (
                        <option key={status} value={status}>
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (statusSelection === "cancelled" && statusSelection !== order.status) {
                        setShowCancelModal(true);
                      } else {
                        handleUpdateStatus();
                      }
                    }}
                    disabled={saving || statusSelection === order.status}
                    className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Enregistrement..." : "Mettre à jour"}
                  </button>
                  {statusError ? <p className="text-sm text-red-600">{statusError}</p> : null}
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <MapPinIcon size={15} className="text-brand-dark" />
                  Coordonnées client
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted">
                  <p className="font-semibold text-ink">{order.full_name}</p>
                  <p>{order.phone}</p>
                  {order.email ? <p>{order.email}</p> : null}
                  <p>{order.address}</p>
                  <p>{order.city}</p>
                </div>
              </div>

              {order.payment_info ? (
                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <CreditCardIcon size={15} className="text-brand-dark" />
                    Paiement
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-xl bg-[#fbfaf7] px-3 py-2">
                      <span className="text-muted">Statut</span>
                      <span className={`font-semibold ${order.payment_info.status === "approved" ? "text-green-700" : order.payment_info.status === "failed" || order.payment_info.status === "declined" || order.payment_info.status === "canceled" ? "text-red-600" : ""}`}>
                        {PAYMENT_STATUS_LABEL[order.payment_info.status] ?? order.payment_info.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[#fbfaf7] px-3 py-2">
                      <span className="text-muted">Mode</span>
                      <span className="font-semibold text-ink">{PAYMENT_METHOD_LABEL[order.payment_info.method] ?? order.payment_info.method}</span>
                    </div>
                    {order.payment_info.status === "failed" || order.payment_info.status === "declined" || order.payment_info.status === "canceled" ? (
                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={handleRelaunchPayment}
                          disabled={relaunching}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RefreshCwIcon size={15} />
                          {relaunching ? "Relance en cours..." : "Relancer le paiement"}
                        </button>
                        {relaunchResult ? (
                          relaunchResult.success && relaunchResult.payment_url ? (
                            <a
                              href={relaunchResult.payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                            >
                              <ExternalLinkIcon size={15} />
                              Nouveau lien de paiement
                            </a>
                          ) : (
                            <p className="text-sm text-red-600">{relaunchResult.message || "Échec de la relance."}</p>
                          )
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <MessageSquareIcon size={15} className="text-brand-dark" />
                  Contacter le client
                </div>
                <div className="mt-4 space-y-3">
                  <a
                    href={whatsappUrl(
                      order.phone,
                      `Bonjour ${order.full_name}, je confirme la réception de votre commande ANIFOWOCHE #${order.id}. Je vous tiens au courant dès qu'elle sera prête.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
                  >
                    <SendIcon size={15} />
                    Confirmer la commande
                  </a>
                  {order.payment_info && order.payment_info.status !== "approved" ? (
                    <a
                      href={whatsappUrl(
                        order.phone,
                        `Bonjour ${order.full_name}, le paiement de votre commande ANIFOWOCHE #${order.id} (${formatXof(order.total_xof)}) n'a pas encore abouti. Pourrez-vous finaliser le paiement ? Merci !`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
                    >
                      <SendIcon size={15} />
                      Relancer le paiement (WhatsApp)
                    </a>
                  ) : null}
                  <a
                    href={whatsappUrl(
                      order.phone,
                      `Bonjour ${order.full_name}, concernant votre commande ANIFOWOCHE #${order.id}, un article est malheureusement en rupture de stock. Je vous contacte rapidement pour trouver une solution.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
                  >
                    <SendIcon size={15} />
                    Rupture de stock
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showCancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircleIcon size={22} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-ink">Annuler la commande</h3>
                <p className="mt-2 text-sm text-muted">
                  Êtes-vous sûr de vouloir annuler cette commande de {order.full_name}&nbsp;?
                </p>
                <p className="mt-1 text-xs text-muted">Cette action remettra les produits en stock et ne peut pas être annulée.</p>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="detail-cancel-reason" className="block text-sm font-semibold text-ink">
                Motif de l'annulation <span className="font-normal text-muted">(optionnel)</span>
              </label>
              <textarea
                id="detail-cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Exemple : Rupture de stock, client annule, etc."
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                rows={3}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Annulation..." : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SellerShell>
  );
}
