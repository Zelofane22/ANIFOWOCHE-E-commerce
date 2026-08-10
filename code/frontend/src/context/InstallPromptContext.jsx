import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InstallPromptContextValue } from "./installPromptContextValue.js";

// Safari iOS ne supporte jamais beforeinstallprompt : fallback texte géré côté UI.
const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

// Capture beforeinstallprompt dès le montage (racine de l'app, avant tout
// rendu conditionnel/lazy) : l'événement est one-shot et part tôt au
// chargement ; un composant monté tardivement (page lazy + auth + fetch)
// le raterait définitivement sur Android.
export function InstallPromptProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const deferredRef = useRef(null);

  const clearPrompt = useCallback(() => {
    deferredRef.current = null;
    setDeferredPrompt(null);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredRef.current = event;
      setDeferredPrompt(event);
    };
    const onAppInstalled = () => clearPrompt();

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [clearPrompt]);

  // Ouvre le dialog natif du navigateur (le même que sur le site principal).
  // À appeler depuis un geste utilisateur (clic).
  const promptInstall = useCallback(async () => {
    const event = deferredRef.current;
    if (!event) return;
    event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") clearPrompt();
  }, [clearPrompt]);

  const value = useMemo(
    () => ({
      canInstall: Boolean(deferredPrompt),
      promptInstall,
      isIos: isIos(),
      isStandalone: isStandalone(),
    }),
    [deferredPrompt, promptInstall]
  );

  return <InstallPromptContextValue.Provider value={value}>{children}</InstallPromptContextValue.Provider>;
}
