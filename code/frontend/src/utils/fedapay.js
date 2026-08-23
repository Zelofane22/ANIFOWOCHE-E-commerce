import { getPayment } from "../api/payments.js";

// Ouvre la modale de paiement FedaPay Checkout.js et retourne une Promise résolue
// une fois le client avoir finalisé (ou fermé) le widget.
//
// Après CHECKOUT_COMPLETED on interroge une seule fois getPayment() pour récupérer
// le statut réel confirmé par le webhook backend ("approved" ou "pending" si le
// webhook n'a pas encore été traité).
//
// Les statuts retournés sont compatibles avec PAYMENT_CONTENT dans
// OrderConfirmation.jsx : "approved" | "pending" | "declined" | "canceled" |
// "closed" | "failed".
export function openFedapayCheckout(payment) {
  return new Promise((resolve) => {
    window.FedaPay.init({
      public_key: import.meta.env.VITE_FEDAPAY_PUBLIC_KEY,
      transaction: { id: payment.fedapay_transaction_id },
      onComplete(resp) {
        const reason = resp?.reason;

        if (reason === window.FedaPay.CHECKOUT_COMPLETED) {
          getPayment(payment.id)
            .then((data) => {
              resolve(data?.status ?? "pending");
            })
            .catch(() => {
              const txStatus = resp?.transaction?.status;
              if (txStatus === "approved" || txStatus === "transferred") {
                resolve("approved");
              } else {
                resolve("pending");
              }
            });
        } else if (reason === window.FedaPay.DIALOG_DISMISSED) {
          resolve("closed");
        } else if (resp?.transaction?.status === "declined") {
          resolve("declined");
        } else if (resp?.transaction?.status === "canceled") {
          resolve("canceled");
        } else {
          resolve("failed");
        }
      },
    }).open();
  });
}

// Ouvre le checkout FedaPay pour un abonnement vendeur (pipeline E9).
// Le statut de l'abonnement est confirmé côté backend par le webhook, on ne fait
// donc aucune interprétation locale : on attend simplement la clôture du widget.
// Retourne "completed" | "closed" | "failed".
export function openFedapaySubscriptionCheckout(subscription) {
  return new Promise((resolve) => {
    window.FedaPay.init({
      public_key: import.meta.env.VITE_FEDAPAY_PUBLIC_KEY,
      transaction: { id: subscription.fedapay_transaction_id },
      onComplete(resp) {
        const reason = resp?.reason;
        if (reason === window.FedaPay.CHECKOUT_COMPLETED) {
          resolve("completed");
        } else if (reason === window.FedaPay.DIALOG_DISMISSED) {
          resolve("closed");
        } else if (
          resp?.transaction?.status === "declined" ||
          resp?.transaction?.status === "canceled"
        ) {
          resolve(resp.transaction.status);
        } else {
          resolve("failed");
        }
      },
    }).open();
  });
}
