import { useEffect } from "react";

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 h-full w-full animate-fade-in cursor-default bg-black/45"
      />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] w-full max-w-3xl animate-sheet-up overflow-y-auto rounded-t-2xl bg-white shadow-2xl"
        style={{ paddingBottom: "var(--tabbar-safe)" }}
      >
        <div className="sticky top-0 z-10 border-b border-black/10 bg-white px-5 py-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-black/15" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-black/5 hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
