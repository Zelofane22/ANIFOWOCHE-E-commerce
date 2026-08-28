import { geolocateZone } from "../../api/delivery.js";
import { extractErrorMessage } from "../../utils/apiError.js";
import { formatXof } from "../../utils/format.js";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/15 px-4 py-3 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15";

export default function ShippingForm({
  isAuthenticated,
  zones,
  slots,
  loadingDeliveryOptions,
  savedAddresses,
  zoneId,
  setZoneId,
  slotId,
  setSlotId,
  coordinates,
  setCoordinates,
  locating,
  setLocating,
  locationError,
  setLocationError,
  fullName,
  setFullName,
  phone,
  setPhone,
  addressLine,
  setAddressLine,
  notes,
  setNotes,
  applySavedAddress,
  canContinueToPayment,
  onContinue,
  hasDeliveryItems = true,
}) {
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La geolocalisation n est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: position }) => {
        const nextCoordinates = { latitude: parseFloat(position.latitude.toFixed(6)), longitude: parseFloat(position.longitude.toFixed(6)) };
        setCoordinates(nextCoordinates);
        try {
          const result = await geolocateZone(nextCoordinates);
          if (result.zone) setZoneId(result.zone.id);
          else setLocationError("Aucune zone ne couvre cette position. Selectionnez une zone manuellement.");
        } catch (err) {
          setLocationError(extractErrorMessage(err));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocationError("Position inaccessible. Autorisez la geolocalisation ou selectionnez une zone manuellement.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <>
      <h1 className="text-xl font-bold text-ink">{hasDeliveryItems ? "Adresse de livraison" : "Informations de commande"}</h1>
      {!isAuthenticated && (
        <p className="mt-2 text-sm text-muted">Commandez sans créer de compte. Le paiement se fera à la livraison.</p>
      )}

      <div className="mt-5 space-y-4">
        <label className="block text-sm font-semibold text-ink">
          Nom complet
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className={inputClass}
          />
        </label>

        {savedAddresses.length > 0 && hasDeliveryItems && (
          <label className="block text-sm font-semibold text-ink">
            Utiliser une adresse enregistrée
            <select
              defaultValue=""
              onChange={(event) => applySavedAddress(event.target.value)}
              className={inputClass}
            >
              <option value="">Sélectionner une adresse</option>
              {savedAddresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label || address.zone_name}
                </option>
              ))}
            </select>
          </label>
        )}

        {hasDeliveryItems && (
          <>
            <label className="block text-sm font-semibold text-ink">
              Quartier / Zone à Cotonou *
              {loadingDeliveryOptions ? (
                <p className="mt-2 rounded-lg border border-black/10 px-4 py-3 text-sm font-normal text-muted">
                  Chargement des zones de livraison…
                </p>
              ) : (
                <select
                  value={zoneId ?? ""}
                  onChange={(event) => setZoneId(Number(event.target.value))}
                  required
                  className={inputClass}
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                      {zone.fee_xof > 0 ? ` (+${formatXof(zone.fee_xof)})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="block text-sm font-semibold text-ink">
              Adresse ou repère *
              <input type="text" value={addressLine} onChange={(event) => setAddressLine(event.target.value)} placeholder="Rue, maison, repère proche..." className={inputClass} required />
            </label>

            <div className="rounded-lg border border-brand/20 bg-brand-pale px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Localiser l'adresse</p>
                  <p className="mt-1 text-xs text-muted">La position servira à confirmer la zone de livraison.</p>
                </div>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white transition hover:bg-brand-medium disabled:opacity-60"
                >
                  {locating ? "Localisation..." : "Utiliser ma position"}
                </button>
              </div>
              {coordinates && (
                <p aria-live="polite" className="mt-2 text-xs text-green-700">
                  Position enregistrée : {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
                </p>
              )}
              {locationError && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  {locationError}
                </p>
              )}
            </div>
          </>
        )}

        <label className="block text-sm font-semibold text-ink">
          Indications complémentaires
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Bâtiment, étage, repère proche..."
            className={`${inputClass} resize-none`}
          />
        </label>

        <label className="block text-sm font-semibold text-ink">
          Téléphone (SMS + WhatsApp) *
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            placeholder="+229 01 XX XX XX XX"
            className={inputClass}
          />
          <span className="mt-1.5 block text-xs font-normal text-muted">
            Vous recevrez un SMS de confirmation sous 1h.
          </span>
        </label>
      </div>

      {hasDeliveryItems && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">Créneau de livraison</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSlotId(slot.id)}
                className={`rounded-[10px] border-2 px-3 py-4 text-center transition ${
                  slotId === slot.id
                    ? "border-brand bg-brand-light"
                    : "border-black/10 bg-white hover:border-black/25"
                }`}
              >
                <span className="block text-sm font-semibold text-ink">{slot.label}</span>
                <span className="mt-1 block text-xs text-muted">
                  {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canContinueToPayment}
        onClick={onContinue}
        className="mt-6 w-full rounded-lg bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-medium disabled:bg-gray-200 disabled:text-gray-400"
      >
        Continuer vers le paiement
      </button>
    </>
  );
}
