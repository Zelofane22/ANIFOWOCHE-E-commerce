import apiClient from "./axios.js";
import { getAnalyticsSessionKey } from "../utils/analyticsSession.js";

export const pingPageView = (path) =>
  apiClient
    .post("/analytics/pageview/", {
      path,
      referrer: document.referrer || "",
      session_key: getAnalyticsSessionKey(),
    })
    .catch(() => {
      // Le tracking ne doit jamais bloquer la navigation.
    });
