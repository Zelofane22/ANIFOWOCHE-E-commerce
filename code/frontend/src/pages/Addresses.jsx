import { useEffect, useState } from "react";
import { createAddress, deleteAddress, getAddresses } from "../api/addresses.js";
import { fetchDeliveryZones } from "../api/delivery.js";
import { AccountBreadcrumb, RequireAccount } from "../components/account/common.jsx";
import { MapPinIcon, TrashIcon } from "../components/icons.jsx";
import { extractErrorMessage } from "../utils/apiError.js";

const emptyAddressForm = { label: "", full_name: "", phone: "", zone: "", notes: "" };

function AddressesContent() {
  const [addresses, setAddresses] = useState(null);
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(emptyAddressForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAddresses = () => getAddresses().then((data) => setAddresses(data.results ?? data));

  useEffect(() => {
    loadAddresses().catch((err) => {
      setError(extractErrorMessage(err));
      setAddresses([]);
    });
    fetchDeliveryZones()
      .then((data) => setZones(data.results ?? data))
      .catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses((current) => current.filter((address) => address.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createAddress(form);
      setForm(emptyAddressForm);
      await loadAddresses();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <AccountBreadcrumb />

      <h1 className="mb-1 text-2xl font-bold text-ink">Vos adresses</h1>
      <p className="mb-6 text-sm text-muted">
        Gérez vos adresses de livraison pour commander plus rapidement.
      </p>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {addresses === null && (
        <div className="mb-6 h-24 animate-pulse rounded-xl border border-black/10 bg-brand-pale" />
      )}

      {addresses !== null && addresses.length === 0 && (
        <div className="mb-6 rounded-xl border border-black/10 bg-white px-4 py-10 text-center text-muted">
          <MapPinIcon size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold text-ink">Aucune adresse enregistrée</p>
          <p className="mt-1 text-sm">Ajoutez votre première adresse ci-dessous.</p>
        </div>
      )}

      {addresses !== null && addresses.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-xl border border-black/10 bg-white p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="font-bold text-ink">{address.label || address.zone_name}</p>
                {address.is_default && (
                  <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase text-brand-dark">
                    Par défaut
                  </span>
                )}
              </div>
              <p className="text-sm text-ink">{address.full_name}</p>
              <p className="mt-0.5 text-sm text-muted">{address.phone}</p>
              <p className="mt-0.5 text-sm text-muted">
                {address.zone_name}
                {address.notes ? ` — ${address.notes}` : ""}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 transition hover:underline"
              >
                <TrashIcon size={13} /> Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="mb-4 font-bold text-ink">Ajouter une adresse</h2>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Libellé (ex. Maison)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="rounded-lg border border-black/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
          <input
            type="text"
            placeholder="Nom complet"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="rounded-lg border border-black/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Téléphone"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-lg border border-black/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
          <select
            required
            value={form.zone}
            onChange={(e) => setForm({ ...form, zone: e.target.value })}
            className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Quartier (Cotonou)</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Indications complémentaires (ex. près de la pharmacie)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-lg border border-black/15 px-3 py-2.5 text-sm focus:border-brand focus:outline-none sm:col-span-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium disabled:opacity-60 sm:col-span-2"
          >
            {submitting ? "Enregistrement…" : "Ajouter cette adresse"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Addresses() {
  return (
    <RequireAccount>
      <AddressesContent />
    </RequireAccount>
  );
}
