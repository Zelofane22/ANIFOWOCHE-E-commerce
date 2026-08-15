import { getPayment } from "../api/payments.js";

// Ouvre la modale de paiement FedaPay Checkout.js et retourne une Promise résolue
// une fois le client avoir finalisé (ou fermé) le widget.
//
// Après CHECKOUT COMPLETE on interroge une seule fois getPayment() pour récupérer
// le statut réel confirmé par le webhook backend ("approved" ou "pending" si le
// webhook n'a pas encore été traité).
//
// Les statuts retournés sont compatibles avec PAYMENT_CONTENT dans
// OrderConfirmation.jsx : "approved" | "pending" | "declined" | "canceled" |
// "closed" | "failed".
export function openFedapayCheckout(payment) {
  return new Promise((resolve) => {
    window.FedaPay.init(payment.payment_url, {
      onComplete(resp) {
        // resp.reason — constantes du SDK Checkout.js (espaces, pas underscores) :
        //   "CHECKOUT COMPLETE"  → le client a finalisé le paiement
        //   "DIALOG DISMISSED"   → le client a fermé la modale sans finaliser
        // resp.transaction — objet FedaPay { id, status, ... }
        const reason = resp?.reason;

        if (reason === "CHECKOUT COMPLETE") {
          // Le paiement a été finalisé côté client. On interroge le backend
          // une seule fois pour récupérer le statut réel (le webhook FedaPay
          // peut ne pas encore avoir été traité, auquel cas on obtient "pending").
          getPayment(payment.id)
            .then((data) => {
              resolve(data?.status ?? "pending");
            })
            .catch(() => {
              // En cas d'échec de l'appel backend, on fait confiance au
              // statut fourni directement par le SDK FedaPay.
              const txStatus = resp?.transaction?.status;
              if (txStatus === "approved" || txStatus === "transferred") {
                resolve("approved");
              } else {
                resolve("pending");
              }
            });
        } else if (reason === "DIALOG DISMISSED") {
          // Le client a fermé la modale sans finaliser le paiement
          resolve("closed");
        } else if (resp?.transaction?.status === "declined") {
          resolve("declined");
        } else if (resp?.transaction?.status === "canceled") {
          resolve("canceled");
        } else {
          // Raison inconnue ou cas non prévu
          resolve("failed");
        }
      },
    });
  });
}
