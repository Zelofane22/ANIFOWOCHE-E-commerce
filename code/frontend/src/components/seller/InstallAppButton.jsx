import { useState } from "react";
import { DownloadIcon, XIcon } from "../icons.jsx";
import { useInstallPrompt } from "../../context/useInstallPrompt.js";

// Popup d'installation PWA de l'espace vendeur. Rejoint le comportement du
// site principal : un clic sur « Installer » déclenche le dialog natif du
// navigateur via deferredPrompt.prompt(). Fallback texte conservé pour
// Safari iOS, qui ne supporte jamais beforeinstallprompt.
export default function InstallAppButton() {
  const { canInstall, promptInstall, isIos } = useInstallPrompt();
  const [iosVisible, setIosVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!canInstall && !isIos)) return null;

  const handleInstall = async () => {
    if (!canInstall) {
      setIosVisible(true);
      return;
    }
    await promptInstall();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Installer l'espace vendeur"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
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

        <button
          type="button"
          onClick={handleInstall}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-medium"
        >
          <DownloadIcon size={15} />
          {isIos && !canInstall ? "Comment installer" : "Installer"}
        </button>

        {iosVisible && (
          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-muted">
            Dans Safari, touchez le bouton <span className="font-semibold text-ink">Partager</span>{" "}
            (carré avec une flèche) puis sélectionnez{" "}
            <span className="font-semibold text-ink">« Sur l'écran d'accueil »</span>.
          </div>
        )}
      </div>
    </div>
  );
}
