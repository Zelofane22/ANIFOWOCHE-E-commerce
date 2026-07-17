export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://anifowoche.com").replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
