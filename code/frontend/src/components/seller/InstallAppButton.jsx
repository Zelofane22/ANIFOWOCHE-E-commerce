import { useEffect, useState } from "react";
import { DownloadIcon, XIcon } from "../icons.jsx";

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [iosVisible, setIosVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const onAppInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (dismissed) return null;
  if (isStandalone()) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setIosVisible(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <div className="relative mb-4 rounded-xl border border-brand/20 bg-brand/5 p-4 lg:hidden">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-full p-1 text-muted transition hover:bg-black/5"
        aria-label="Fermer"
      >
        <XIcon size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
          <DownloadIcon size={20} />
        </div>
        <div className="flex-1 pr-6">
          <p className="text-sm font-bold text-ink">Installer l'espace vendeur</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            Ajoutez ANIFOWOCHE à votre écran d'accueil pour gérer votre boutique plus rapidement.
          </p>
        </div>
      </div>

      {deferredPrompt || isIos() ? (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-medium"
        >
          <DownloadIcon size={15} />
          {isIos() && !deferredPrompt ? "Comment installer" : "Installer maintenant"}
        </button>
      ) : null}

      {iosVisible && (
        <div className="mt-3 rounded-lg bg-white p-3 text-xs leading-5 text-muted">
          Dans Safari, touchez le bouton <span className="font-semibold text-ink">Partager</span>{" "}
          (carré avec une flèche) puis sélectionnez{" "}
          <span className="font-semibold text-ink">« Sur l'écran d'accueil »</span>.
        </div>
      )}
    </div>
  );
}
