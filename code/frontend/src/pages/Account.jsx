import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { createAddress, deleteAddress, getAddresses } from "../api/addresses.js";
import { fetchDeliveryZones } from "../api/delivery.js";
import { getOrders } from "../api/orders.js";
import { createReturnRequest, fetchReturnRequests } from "../api/returns.js";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";
import { formatXof } from "../utils/format.js";

const emptyRegisterForm = { username: "", email: "", password: "", password2: "" };
const emptyLoginForm = { username: "", password: "" };
const emptyAddressForm = { label: "", full_name: "", phone: "", zone: "", notes: "" };

const STATUS_LABELS = {
  received: "Reçue",
  prepared: "Préparée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [returnRequests, setReturnRequests] = useState([]);
  const [openReturnOrderId, setOpenReturnOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState(null);

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(data.results ?? data))
      .catch((err) => setError(extractErrorMessage(err)));
    fetchReturnRequests()
      .then((data) => setReturnRequests(data.results ?? data))
      .catch(() => {});
  }, []);

  const returnedOrderIds = new Set(returnRequests.map((request) => request.order));

  const handleRequestReturn = async (event, orderId) => {
    event.preventDefault();
    setReturnError(null);
    setSubmittingReturn(true);
    try {
      const created = await createReturnRequest({ order_id: orderId, reason: returnReason.trim() });
      setReturnRequests((current) => [...current, created]);
      setOpenReturnOrderId(null);
      setReturnReason("");
    } catch (err) {
      setReturnError(extractErrorMessage(err));
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-ink">Historique des commandes</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!error && orders.length === 0 && (
        <p className="mt-2 text-sm text-muted">Aucune commande pour le moment.</p>
      )}
      <ul className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
        {orders.map((order) => (
          <li key={order.id} className="px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">ANW-{order.id}</p>
                <p className="text-muted">
                  {new Date(order.created_at).toLocaleDateString("fr-FR")} ·{" "}
                  {STATUS_LABELS[order.status] ?? order.status}
                </p>
              </div>
              <span className="font-medium text-ink">{formatXof(order.total_xof)}</span>
            </div>

            {order.status === "delivered" && (
              <div className="mt-2">
                {returnedOrderIds.has(order.id) ? (
                  <p className="text-xs font-medium text-muted">Retour déjà demandé pour cette commande.</p>
                ) : openReturnOrderId === order.id ? (
                  <form
                    onSubmit={(event) => handleRequestReturn(event, order.id)}
                    className="mt-2 flex flex-col gap-2"
                  >
                    <textarea
                      value={returnReason}
                      onChange={(event) => setReturnReason(event.target.value)}
                      placeholder="Motif du retour"
                      required
                      rows={2}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    />
                    {returnError && <p className="text-xs text-red-600">{returnError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingReturn}
                        className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {submittingReturn ? "Envoi…" : "Envoyer la demande"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenReturnOrderId(null);
                          setReturnReason("");
                          setReturnError(null);
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-ink"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenReturnOrderId(order.id)}
                    className="text-xs font-medium text-brand-dark hover:underline"
                  >
                    Demander un retour
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(emptyAddressForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAddresses = () => getAddresses().then((data) => setAddresses(data.results ?? data));

  useEffect(() => {
    loadAddresses().catch((err) => setError(extractErrorMessage(err)));
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
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-ink">Adresses enregistrées</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {addresses.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
          {addresses.map((address) => (
            <li key={address.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-ink">{address.label || address.zone_name}</p>
                <p className="text-muted">
                  {address.full_name} · {address.phone} · {address.zone_name}
                  {address.notes ? ` — ${address.notes}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(address.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Libellé (ex. Maison)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Nom complet"
          required
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="tel"
          placeholder="Téléphone"
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          required
          value={form.zone}
          onChange={(e) => setForm({ ...form, zone: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
          placeholder="Indications complémentaires"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Enregistrement…" : "Ajouter cette adresse"}
        </button>
      </form>
    </section>
  );
}

export default function Account() {
  const { user, loading, isAuthenticated, login, register, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = typeof location.state?.from === "string" ? location.state.from : null;
  const authMessage = typeof location.state?.authMessage === "string" ? location.state.authMessage : null;
  const [mode, setMode] = useState(redirectTo ? "register" : "login");
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p className="px-4 py-10 text-center text-muted">Chargement…</p>;

  if (isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-xl font-bold text-ink">Mon compte</h1>
        <p className="mt-4 text-sm text-ink">
          Connecté en tant que <strong>{user.username}</strong>
          {user.email ? ` (${user.email})` : ""}
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-6 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          Se déconnecter
        </button>

        <OrderHistory />
        <AddressBook />
      </div>
    );
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(loginForm);
      if (redirectTo) navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(registerForm);
      if (redirectTo) navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex gap-4 border-b border-gray-200 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`-mb-px border-b-2 px-1 py-2 ${
            mode === "login" ? "border-brand-dark text-brand-dark" : "border-transparent text-muted"
          }`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`-mb-px border-b-2 px-1 py-2 ${
            mode === "register" ? "border-brand-dark text-brand-dark" : "border-transparent text-muted"
          }`}
        >
          Inscription
        </button>
      </div>

      {authMessage && (
        <p className="mb-4 rounded-md bg-brand-pale px-3 py-2 text-sm font-medium text-ink">
          {authMessage}
        </p>
      )}

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {mode === "login" ? (
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            required
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            required
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            required
            value={registerForm.username}
            onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            required
            value={registerForm.password}
            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            required
            value={registerForm.password2}
            onChange={(e) => setRegisterForm({ ...registerForm, password2: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Création…" : "Créer mon compte"}
          </button>
        </form>
      )}
    </div>
  );
}
