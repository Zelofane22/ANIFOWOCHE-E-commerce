import {
  AlertCircleIcon,
  CheckIcon,
  ClockIcon,
  PackageIcon,
} from "../icons.jsx";
import { formatDate as formatDateUtil } from "../../utils/format.js";

export const orderRef = (id) => `ANW-${id}`;

export const formatDate = formatDateUtil;

export const ORDER_STATUS = {
  received: { label: "Commande reçue", classes: "bg-gray-100 text-gray-600", Icon: ClockIcon },
  prepared: { label: "En préparation", classes: "bg-blue-50 text-blue-700", Icon: PackageIcon },
  delivered: { label: "Livrée", classes: "bg-green-50 text-green-700", Icon: CheckIcon },
  cancelled: { label: "Annulée", classes: "bg-red-50 text-red-700", Icon: AlertCircleIcon },
};

export const RETURN_STATUS = {
  requested: { label: "Retour demandé", classes: "bg-amber-50 text-amber-700" },
  approved: { label: "Retour approuvé", classes: "bg-blue-50 text-blue-700" },
  rejected: { label: "Retour refusé", classes: "bg-red-50 text-red-700" },
  refunded: { label: "Remboursé", classes: "bg-green-50 text-green-700" },
};
