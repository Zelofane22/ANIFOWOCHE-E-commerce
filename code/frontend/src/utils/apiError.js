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

export function decodeUnicodeEscapes(value) {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 16)),
  );
}

export function decodeUnicodeEscapesDeep(value) {
  if (typeof value === "string") return decodeUnicodeEscapes(value);
  if (Array.isArray(value)) return value.map(decodeUnicodeEscapesDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, decodeUnicodeEscapesDeep(item)]),
    );
  }
  return value;
}

export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Une erreur est survenue.";
  if (typeof data === "string") return decodeUnicodeEscapes(data);
  if (data.detail) return decodeUnicodeEscapes(String(data.detail));
  return decodeUnicodeEscapes(firstLeafMessage(data));
}
