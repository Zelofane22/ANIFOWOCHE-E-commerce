import { getPayment } from "../api/payments.js";

const PAYMENT_POLL_INTERVAL_MS = 2000;
const PAYMENT_POLL_TIMEOUT_MS = 5 * 60 * 1000;
const PAYMENT_FAILURE_STATUSES = ["declined", "canceled", "failed"];

// Sonde le statut réel du paiement (mis à jour par le webhook FedaPay) pendant que
// le client complète le paiement dans la fenêtre ouverte, jusqu'à approbation,
// échec, fermeture manuelle de la fenêtre ou expiration du délai.
export function waitForPaymentApproval(paymentId, popup) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = window.setInterval(async () => {
      if (!popup || popup.closed) {
        window.clearInterval(timer);
        resolve("closed");
        return;
      }
      if (Date.now() - startedAt > PAYMENT_POLL_TIMEOUT_MS) {
        window.clearInterval(timer);
        resolve("timeout");
        return;
      }
      try {
        const payment = await getPayment(paymentId);
        if (payment.status === "approved") {
          window.clearInterval(timer);
          popup.close();
          resolve("approved");
        } else if (PAYMENT_FAILURE_STATUSES.includes(payment.status)) {
          window.clearInterval(timer);
          popup.close();
          resolve(payment.status);
        }
      } catch {
        // Erreur réseau transitoire : on continue de sonder jusqu'au prochain intervalle.
      }
    }, PAYMENT_POLL_INTERVAL_MS);
  });
}
