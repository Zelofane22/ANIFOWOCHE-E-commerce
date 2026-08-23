import { useEffect, useRef } from "react";

export default function SubscriptionSuccessModal({ open, onClose, planName }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Paiement réussi">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm animate-fade-in cursor-default"
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-sm rounded-[24px] bg-white p-8 text-center shadow-2xl animate-[scale-up_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)] outline-none"
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="animate-[scale-up_0.4s_0.15s_cubic-bezier(0.175,0.885,0.32,1.275)_both]">
            <circle cx="22" cy="22" r="22" fill="#22c55e" opacity="0.15" />
            <circle cx="22" cy="22" r="16" fill="#22c55e" opacity="0.25" />
            <path
              d="M15 22.5L20 27.5L29 17.5"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[draw-check_0.4s_0.3s_ease-out_both]"
              style={{ strokeDasharray: 30, strokeDashoffset: 30 }}
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900">Félicitations !</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Votre abonnement au plan <span className="font-semibold text-[#C99F08]">{planName}</span> est maintenant actif.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          Profitez dès maintenant de toutes vos nouvelles fonctionnalités.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#C99F08] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A67C06] active:bg-[#8B6604] focus:outline-none focus:ring-2 focus:ring-[#C99F08] focus:ring-offset-2"
        >
          Découvrir mon plan
        </button>
      </div>
    </div>
  );
}
