import { getPayment } from "../api/payments.js";

// Ouvre la modale de paiement FedaPay Checkout.js et retourne une Promise résolue
// une fois le client avoir finalisé (ou fermé) le widget. Le statut retourné est
// compatible avec les valeurs attendues par OrderConfirmation.jsx.
export function openFedapayCheckout(payment) {
  return new Promise((resolve) => {
    window.FedaPay.init(payment.payment_url, {
      onComplete(resp) {
        // resp.reason contient la raison de fermeture du widget FedaPay :
        // - CHECKOUT_COMPLETE   → paiement réussi
        // - CHECKOUT_TRANSFERED → paiement transféré (succès)
        // - CHECKOUT_DECLINED   → paiement refusé
        const reason = resp?.reason;
        if (reason === "CHECKOUT_COMPLETE" || reason === "CHECKOUT_TRANSFERED") {
          resolve("approved");
        } else if (reason === "CHECKOUT_DECLINED") {
          resolve("declined");
        } else {
          // Fermeture manuelle du widget ou raison inconnue
          resolve("closed");
        }
      },
    });
  });
}
