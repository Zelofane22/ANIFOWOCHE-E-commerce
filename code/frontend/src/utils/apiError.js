export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Une erreur est survenue.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const value = data[firstKey];
  return Array.isArray(value) ? value[0] : String(value);
}
