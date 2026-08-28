export function formatXof(amount) {
  if (amount == null) return "0 F";
  return `${new Intl.NumberFormat("fr-FR").format(amount)} F`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function formatNumber(num) {
  if (num == null) return "0";
  return new Intl.NumberFormat("fr-FR").format(num);
}
