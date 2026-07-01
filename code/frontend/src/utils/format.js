export function formatXof(amount) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} F`;
}
