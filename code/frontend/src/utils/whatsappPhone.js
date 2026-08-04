/**
 * Normalise un numéro WhatsApp pour wa.me en s'assurant qu'il contient
 * l'indicatif pays (229 par défaut pour le Bénin).
 * @param {string} phone
 * @returns {string}
 */
export function formatWhatsappPhone(phone) {
  if (!phone) return "";
  // Ne garde que les chiffres.
  let digits = phone.replace(/\D/g, "");

  // Si le numéro commence par 00 (format international sans +), on retire les 00.
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Déjà au format international avec indicatif 229.
  if (digits.startsWith("229") && digits.length >= 11) {
    return digits;
  }

  // Numéro local béninois 10 chiffres commençant par 0 : 01 XX XX XX XX.
  if (digits.length === 10 && digits.startsWith("0")) {
    return `229${digits.slice(1)}`;
  }

  // Numéro court sans indicatif : on ajoute 229.
  if (digits.length <= 9) {
    return `229${digits}`;
  }

  // Numéro sans indicatif mais avec plus de 9 chiffres : on ajoute 229 par défaut.
  return `229${digits}`;
}

/**
 * Construit l'URL wa.me complète avec un message pré-rempli.
 * @param {string} phone
 * @param {string} message
 * @returns {string}
 */
export function buildWhatsappUrl(phone, message) {
  const cleanPhone = formatWhatsappPhone(phone);
  if (!cleanPhone) return "";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
