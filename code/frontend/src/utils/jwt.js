function decodePayload(token) {
  try {
    const encoded = token.split(".")[1];
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function getAccessTokenExpiry(token) {
  const payload = decodePayload(token);
  const exp = payload?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}
