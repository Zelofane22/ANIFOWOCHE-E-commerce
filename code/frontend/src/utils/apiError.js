function firstLeafMessage(obj) {
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj) && obj.length > 0) {
    const item = obj[0];
    if (typeof item === "string") return item;
    return firstLeafMessage(item);
  }
  if (obj && typeof obj === "object") {
    const key = Object.keys(obj)[0];
    if (key) return firstLeafMessage(obj[key]);
  }
  return String(obj);
}

export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Une erreur est survenue.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  return firstLeafMessage(data);
}
