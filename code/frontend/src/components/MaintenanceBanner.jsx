import { useStoreStatus } from "../context/useStoreStatus.js";

export default function MaintenanceBanner() {
  const { maintenanceMode, loading } = useStoreStatus();

  if (loading || !maintenanceMode) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.3 3.3 10.3a2 2 0 0 0 0 2.8l7 7a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8l-7-7a2 2 0 0 0-2.8 0Z" />
      </svg>
      <span>Boutique temporairement en maintenance — les commandes sont suspendues. Merci de revenir plus tard.</span>
    </div>
  );
}
