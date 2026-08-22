import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getSellerOrder, getSellerProfile, relaunchSellerPayment, confirmSellerPayment, updateSellerOrderStatus } from "../api/seller.js";
import { formatDate, ORDER_STATUS } from "../components/account/orderHelpers.js";
import { AlertCircleIcon, CheckIcon, ChevronLeftIcon, ClockIcon, CreditCardIcon, ExternalLinkIcon, MapPinIcon, MessageSquareIcon, PackageIcon, PhoneIcon, RefreshCwIcon, SendIcon, TruckIcon } from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";

const STATUS_CONFIG = {
  received: { label: "Recue", color: "#7C3AED", bg: "#F5F3FF", Icon: ClockIcon },
  prepared: { label: "En preparation", color: "#2563EB", bg: "#EFF6FF", Icon: PackageIcon },
  delivered: { label: "Livree", color: "#059669", bg: "#ECFDF5", Icon: CheckIcon },
  cancelled: { label: "Annulee", color: "#DC2626", bg: "#FEF2F2", Icon: AlertCircleIcon },
};

const PAYMENT_STATUS_LABEL = { pending: "En attente", approved: "Approuve", declined: "Refuse", canceled: "Annule", failed: "Echec" };
const PAYMENT_METHOD_LABEL = { mtn: "MTN Mobile Money", moov: "Moov Money", card: "Carte bancaire", cash_on_delivery: "Paiement a la livraison" };
const TIMELINE_STEPS = ["Commande recue", "Paiement confirme", "Preparation", "Livree"];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#6B7280", bg: "#F3F4F6", Icon: ClockIcon };
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full" style={{ color: cfg.color, backgroundColor: cfg.bg }}><cfg.Icon size={11} />{cfg.label}</span>;
}

function Timeline({ currentStep }) {
  return <div>{TIMELINE_STEPS.map((label, i) => {
    const done = i < currentStep; const active = i === currentStep; const isLast = i === TIMELINE_STEPS.length - 1;
    return <div key={i} className="flex gap-3"><div className="flex flex-col items-center">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${done ? "bg-green-500 border-green-500" : active ? "bg-[#C99F08] border-[#C99F08]" : "bg-white border-black/15"}`}>
        {done ? <CheckIcon size={13} className="text-white" /> : active ? <div className="w-2 h-2 rounded-full bg-white" /> : <div className="w-2 h-2 rounded-full bg-black/10" />}
      </div>
      {!isLast && <div className={`w-0.5 flex-1 min-h-[28px] my-1 ${done ? "bg-green-300" : "bg-black/8"}`} />}
    </div><div className="pb-5 flex-1">
      <p className={`text-sm font-semibold ${done ? "text-[#111827]" : active ? "text-[#C99F08]" : "text-[#9CA3AF]"}`}>{label}</p>
      {active && <span className="text-[10px] font-bold text-[#C99F08] bg-[#FEF9E7] px-1.5 py-0.5 rounded-full mt-1 inline-block">En cours</span>}
    </div></div>;
  })}</div>;
}

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
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { navigate("/login", { replace: true }); return; }
    Promise.all([getSellerProfile(), getSellerOrder(id)])
      .then(([sellerData, orderData]) => {
        setSeller(sellerData); setOrder(orderData); setStatusSelection(orderData.status);
      })
      .catch((error) => {
        if (error?.response?.status === 404) { navigate("/orders", { replace: true }); return; }
        setPageError(extractErrorMessage(error));
      })
      .finally(() => setPageLoading(false));
  }, [id, isAuthenticated, loading, navigate]);

  const handleUpdateStatus = async (reason = "") => {
    if (!order || (statusSelection === order.status && !reason)) return;
    setSaving(true); setStatusError("");
    try {
      const payload = { status: statusSelection };
      if (statusSelection === "cancelled" && reason) payload.cancellation_reason = reason;
      const updatedOrder = await updateSellerOrderStatus(order.id, payload);
      setOrder((prev) => prev ? { ...prev, ...updatedOrder, updated_at: updatedOrder.updated_at ?? prev.updated_at } : prev);
      setStatusSelection(updatedOrder.status);
    } catch (error) { setStatusError(extractErrorMessage(error)); } finally { setSaving(false); }
  };

  const handleCancelConfirm = async () => { setShowCancelModal(false); await handleUpdateStatus(cancelReason); setCancelReason(""); };

  const handleRelaunchPayment = async () => {
    setRelaunching(true); setRelaunchResult(null);
    try { const result = await relaunchSellerPayment(order.id); setRelaunchResult({ success: true, payment_url: result.payment_url }); }
    catch (error) { setRelaunchResult({ success: false, message: extractErrorMessage(error) }); }
    finally { setRelaunching(false); }
  };

  const handleConfirmPayment = async () => {
    setConfirming(true); setConfirmResult(null);
    try { const result = await confirmSellerPayment(order.id); setConfirmResult({ success: true });
      setOrder((prev) => prev ? { ...prev, payment_info: result, status: "prepared" } : prev); setStatusSelection("prepared"); }
    catch (error) { setConfirmResult({ success: false, message: extractErrorMessage(error) }); }
    finally { setConfirming(false); }
  };

  const stepMap = { received: 0, prepared: 2, delivered: 3, cancelled: 0 };
  const currentStep = stepMap[order?.status] ?? 0;

  if (loading || pageLoading || !seller || !order) {
    return <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-[#9CA3AF]">Chargement...</div>;
  }

  return (
    <SellerShell seller={seller}>
      <div className="mx-auto max-w-2xl pb-8">
        <div className="bg-white px-5 pt-6 pb-0 border-b border-black/5">
          <div className="flex items-center gap-3 mb-5">
            <Link to="/orders" className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center">
              <ChevronLeftIcon size={18} className="text-[#374151]" />
            </Link>
            <h1 className="font-bold text-[#111827] text-lg">Commande #{order.id}</h1>
          </div>
          <div className="bg-[#111827] rounded-[18px] p-5 mb-5">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Montant total</p>
            <p className="text-white font-bold text-4xl tracking-tight mb-3">{formatXof(order.total_xof)}</p>
            <div className="flex items-center justify-between">
              <StatusBadge status={order.status} />
              <p className="text-white/40 text-xs">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </div>

        {pageError ? <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><div className="flex items-start gap-2"><AlertCircleIcon size={17} className="mt-0.5 shrink-0" /><span>{pageError}</span></div></div> : null}

        <div className="px-4 pt-4 space-y-4">
          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2"><TruckIcon size={15} className="text-[#C99F08]" />Suivi de la commande</p>
            <Timeline currentStep={currentStep} />
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#111827] mb-3">Client</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-[#C99F08]/15 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-[#C99F08]">{order.full_name?.split(" ").map((n) => n[0]).join("")}</span>
              </div>
              <div>
                <p className="font-semibold text-[#111827]">{order.full_name}</p>
                <p className="text-xs text-[#9CA3AF]">{order.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${order.phone}`} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 px-3 py-2.5 text-sm font-bold text-[#111827] transition hover:border-[#C99F08] hover:text-[#C99F08]"><PhoneIcon size={14} />Appeler</a>
              <a href={whatsappUrl(order.phone, "Bonjour " + order.full_name + ", concernant votre commande ANIFOWOCHE #" + order.id)} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#C99F08] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#b38a00]"><MessageSquareIcon size={14} />WhatsApp</a>
            </div>
            {order.address ? <div className="flex items-start gap-2 mt-3 text-xs text-[#9CA3AF]"><MapPinIcon size={13} className="mt-0.5 flex-shrink-0" />{order.address}{order.city ? ", " + order.city : ""}</div> : null}
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#111827] mb-3">Articles ({order.items?.length ?? 0})</p>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#F3F4F6] flex-shrink-0 flex items-center justify-center">
                    <PackageIcon size={20} className="text-[#9CA3AF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#111827] leading-snug">{item.product_name}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Qte : {item.quantity}</p>
                    <p className="font-bold text-[#111827] mt-1">{formatXof(item.unit_price_xof)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2"><TruckIcon size={15} className="text-[#C99F08]" />Statut et actions</p>
            <div className="space-y-3">
              <select value={statusSelection} onChange={(e) => setStatusSelection(e.target.value)} className="min-h-11 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/20">
                {Object.entries(ORDER_STATUS).map(([st, cfg]) => <option key={st} value={st}>{cfg.label}</option>)}
              </select>
              <button type="button" onClick={() => { if (statusSelection === "cancelled" && statusSelection !== order.status) { setShowCancelModal(true); } else { handleUpdateStatus(); } }} disabled={saving || statusSelection === order.status} className="min-h-11 w-full rounded-lg bg-[#C99F08] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b38a00] disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "Enregistrement..." : "Mettre a jour"}
              </button>
              {statusError ? <p role="alert" className="text-sm text-red-600">{statusError}</p> : null}
            </div>
          </div>

          {order.payment_info ? (
            <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2"><CreditCardIcon size={15} className="text-[#C99F08]" />Paiement</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-[#F3F4F6] px-3 py-2"><span className="text-[#6B7280]">Statut</span><span className={`font-semibold ${order.payment_info.status === "approved" ? "text-green-700" : order.payment_info.status === "failed" || order.payment_info.status === "declined" || order.payment_info.status === "canceled" ? "text-red-600" : ""}`}>{PAYMENT_STATUS_LABEL[order.payment_info.status] ?? order.payment_info.status}</span></div>
                <div className="flex items-center justify-between rounded-xl bg-[#F3F4F6] px-3 py-2"><span className="text-[#6B7280]">Mode</span><span className="font-semibold text-[#111827]">{PAYMENT_METHOD_LABEL[order.payment_info.method] ?? order.payment_info.method}</span></div>
                {order.payment_info.status === "pending" ? (
                  <div className="mt-3 space-y-2">
                    <button type="button" onClick={handleConfirmPayment} disabled={confirming} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {confirming ? "Confirmation en cours..." : "Confirmer le paiement recu"}
                    </button>
                    {confirmResult ? (confirmResult.success ? <p role="status" className="text-sm text-green-700">Paiement confirme.</p> : <p role="alert" className="text-sm text-red-600">{confirmResult.message || "Echec."}</p>) : null}
                    <a href={whatsappUrl(order.phone, "Bonjour " + order.full_name + ", le paiement de votre commande ANIFOWOCHE #" + order.id + " n a pas ete confirme. Pouvez-vous finaliser ?")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:border-[#C99F08] hover:text-[#C99F08]"><SendIcon size={15} />Relancer le paiement (WhatsApp)</a>
                  </div>
                ) : null}
                {(order.payment_info.status === "failed" || order.payment_info.status === "declined" || order.payment_info.status === "canceled") ? (
                  <div className="mt-3 space-y-2">
                    <button type="button" onClick={handleRelaunchPayment} disabled={relaunching} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50">
                      <RefreshCwIcon size={15} />{relaunching ? "Relance en cours..." : "Relancer le paiement"}
                    </button>
                    {relaunchResult ? (relaunchResult.success && relaunchResult.payment_url ? <a href={relaunchResult.payment_url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"><ExternalLinkIcon size={15} />Nouveau lien de paiement</a> : <p role="alert" className="text-sm text-red-600">{relaunchResult.message || "Echec."}</p>) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2"><MessageSquareIcon size={15} className="text-[#C99F08]" />Contacter le client</p>
            <div className="space-y-2">
              <a href={whatsappUrl(order.phone, "Bonjour " + order.full_name + ", je confirme la reception de votre commande ANIFOWOCHE #" + order.id + ". Je vous tiens au courant.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:border-[#C99F08] hover:text-[#C99F08]"><SendIcon size={15} />Confirmer la commande</a>
              <a href={whatsappUrl(order.phone, "Bonjour " + order.full_name + ", le paiement de votre commande ANIFOWOCHE #" + order.id + " n a pas abouti. Pourrez-vous finaliser ?")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:border-[#C99F08] hover:text-[#C99F08]"><SendIcon size={15} />Relancer le paiement</a>
              <a href={whatsappUrl(order.phone, "Bonjour " + order.full_name + ", un article de votre commande ANIFOWOCHE #" + order.id + " est en rupture de stock. Je vous contacte pour trouver une solution.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:border-[#C99F08] hover:text-[#C99F08]"><SendIcon size={15} />Rupture de stock</a>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircleIcon size={22} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-[#111827]">Annuler la commande</h3>
                <p className="mt-2 text-sm text-[#6B7280]">Etes-vous sur de vouloir annuler cette commande de {order.full_name} ?</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">Cette action remettra les produits en stock et ne peut pas etre annulee.</p>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="detail-cancel-reason" className="block text-sm font-semibold text-[#111827]">Motif <span className="font-normal text-[#9CA3AF]">(optionnel)</span></label>
              <textarea id="detail-cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ex: Rupture de stock..." className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20" rows={3} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowCancelModal(false); setCancelReason(""); }} className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-gray-50">Retour</button>
              <button type="button" onClick={handleCancelConfirm} disabled={saving} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "Annulation..." : "Confirmer l annulation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SellerShell>
  );
}
