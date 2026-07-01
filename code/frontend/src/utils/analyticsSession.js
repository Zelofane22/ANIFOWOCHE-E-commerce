const SESSION_KEY = "anifowoche_analytics_session";

export function getAnalyticsSessionKey() {
  let key = sessionStorage.getItem(SESSION_KEY);
  if (!key) {
    key = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, key);
  }
  return key;
}
