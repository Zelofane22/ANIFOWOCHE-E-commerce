import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { confirmPasswordReset, requestPasswordReset } from "../api/auth.js";
import { getAddresses } from "../api/addresses.js";
import { fetchNotificationSettings } from "../api/notifications.js";
import { getOrders } from "../api/orders.js";
import { fetchWishlist } from "../api/wishlist.js";
import {
  ArrowRightIcon,
  HeartIcon,
  LockIcon,
  MapPinIcon,
  PackageIcon,
} from "../components/icons.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";
import Seo from "../components/Seo.jsx";
import StatCard from "../components/account/StatCard.jsx";
import OrderRow from "../components/account/OrderRow.jsx";
import AuthFormField from "../components/account/AuthFormField.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";

const emptyRegisterForm = {
  username: "",
  email: "",
  password: "",
  password2: "",
  phone: "",
  notification_channel: "email",
};
const emptyLoginForm = { username: "", password: "" };
const emptyResetForm = { password: "", password2: "" };

const NOTIFICATION_LABELS = { email: "Email", whatsapp: "WhatsApp", sms: "SMS" };

function AccountHub({ user, logout }) {
  const [orders, setOrders] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(null);
  const [addressCount, setAddressCount] = useState(null);

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(data.results ?? data))
      .catch(() => setOrders([]));
    fetchWishlist()
      .then((data) => setWishlistCount((data.results ?? data).length))
      .catch(() => setWishlistCount(0));
    getAddresses()
      .then((data) => setAddressCount((data.results ?? data).length))
      .catch(() => setAddressCount(0));
  }, []);

  const stats = [
    { label: "Commandes", value: orders ? orders.length : "…" },
    { label: "Favoris", value: wishlistCount ?? "…" },
    { label: "Adresses", value: addressCount ?? "…" },
  ];

  const sections = [
    {
      Icon: PackageIcon,
      title: "Vos commandes",
      desc: "Consultez, suivez et gérez toutes vos commandes passées et en cours.",
      cta: "Voir mes commandes",
      to: "/compte/commandes",
    },
    {
      Icon: MapPinIcon,
      title: "Vos adresses",
      desc: "Gérez vos adresses de livraison enregistrées pour commander plus vite.",
      cta: "Gérer les adresses",
      to: "/compte/adresses",
    },
    {
      Icon: HeartIcon,
      title: "Vos favoris",
      desc: "Retrouvez les articles que vous avez mis de côté pour plus tard.",
      cta: "Voir mes favoris",
      to: "/compte/favoris",
    },
  ];

  const recentOrders = (orders ?? []).slice(0, 2);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Accueil */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Bonjour,</p>
          <h1 className="text-2xl font-bold text-ink">{user.username}</h1>
          {user.email && <p className="mt-1 text-sm text-muted">{user.email}</p>}
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand-dark"
        >
          Se déconnecter
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      {/* Cartes de gestion */}
      <h2 className="mb-4 text-base font-bold text-ink">Gérer mon compte</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((sec) => (
          <div
            key={sec.title}
            className="flex flex-col rounded-xl border border-black/10 bg-white p-5 transition hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
              <sec.Icon size={24} />
            </div>
            <h3 className="mb-1 font-bold text-ink">{sec.title}</h3>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-muted">{sec.desc}</p>
            <Link
              to={sec.to}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-medium"
            >
              {sec.cta} <ArrowRightIcon size={13} />
            </Link>
          </div>
        ))}

        {/* Connexion et sécurité (informative) */}
        <div className="flex flex-col rounded-xl border border-black/10 bg-white p-5 transition hover:shadow-md sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
              <LockIcon size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-ink">Connexion et préférences</h3>
              <p className="mt-0.5 text-sm text-muted">
                Connecté en tant que <strong className="text-ink">{user.username}</strong>
                {user.phone ? ` · ${user.phone}` : ""} · Notifications par{" "}
                {NOTIFICATION_LABELS[user.notification_channel] ?? user.notification_channel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Commandes récentes */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Commandes récentes</h2>
          <Link
            to="/compte/commandes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
          >
            Tout voir <ArrowRightIcon size={13} />
          </Link>
        </div>

        {orders && orders.length === 0 && (
          <div className="rounded-xl border border-black/10 bg-white px-4 py-10 text-center text-muted">
            <PackageIcon size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-ink">Aucune commande pour le moment</p>
            <Link
              to="/catalogue"
              className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium"
            >
              Découvrir la collection
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {recentOrders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, loading, isAuthenticated, login, register, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const resetUid = searchParams.get("reset_uid");
  const resetToken = searchParams.get("reset_token");
  const redirectTo = typeof location.state?.from === "string" ? location.state.from : null;
  const authMessage = typeof location.state?.authMessage === "string" ? location.state.authMessage : null;
  const [mode, setMode] = useState(
    resetUid && resetToken ? "reset" : location.state?.authMode ?? (redirectTo ? "register" : "login"),
  );
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [resetEmail, setResetEmail] = useState("");
  const [resetForm, setResetForm] = useState(emptyResetForm);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    whatsapp_enabled: false,
    sms_enabled: false,
  });

  useEffect(() => {
    fetchNotificationSettings()
      .then(setNotificationSettings)
      .catch(() => {});
  }, []);

  if (loading) return <LoadingState message="Chargement…" className="px-4 py-10 text-center text-muted" />;

  if (isAuthenticated) return <AccountHub user={user} logout={logout} />;

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
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
    setSuccess(null);
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

  const handleForgotSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const data = await requestPasswordReset(resetEmail);
      setSuccess(data.detail);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await confirmPasswordReset({
        uid: resetUid,
        token: resetToken,
        password: resetForm.password,
        password2: resetForm.password2,
      });
      setResetForm(emptyResetForm);
      setSuccess("Votre mot de passe a été mis à jour. Vous pouvez vous connecter.");
      navigate("/compte", { replace: true });
      setMode("login");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Seo title="Mon compte" path="/compte" type="website" />
      <h1 className="mb-6 text-xl font-bold text-ink">Mon compte</h1>
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <div className="mb-6 flex gap-4 border-b border-gray-200 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccess(null);
            }}
            className={`-mb-px border-b-2 px-1 py-2 ${
              mode === "login" ? "border-brand-dark text-brand-dark" : "border-transparent text-muted"
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
              setSuccess(null);
            }}
            className={`-mb-px border-b-2 px-1 py-2 ${
              mode === "register" ? "border-brand-dark text-brand-dark" : "border-transparent text-muted"
            }`}
          >
            Inscription
          </button>
        </div>

        {authMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mb-4 rounded-md bg-brand-pale px-3 py-2 text-sm font-medium text-ink"
          >
            {authMessage}
          </p>
        )}

        {success && (
          <p role="status" aria-live="polite" className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}
        {error && (
          <ErrorState message={error} />
        )}

        {mode === "reset" ? (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-muted">Choisissez un nouveau mot de passe pour votre compte.</p>
            <AuthFormField
              label="Nouveau mot de passe"
              type="password"
              id="reset-password"
              placeholder="Nouveau mot de passe"
              autoComplete="new-password"
              required
              value={resetForm.password}
              onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
            />
            <AuthFormField
              label="Confirmer le nouveau mot de passe"
              type="password"
              id="reset-password2"
              placeholder="Confirmer le nouveau mot de passe"
              autoComplete="new-password"
              required
              value={resetForm.password2}
              onChange={(e) => setResetForm({ ...resetForm, password2: e.target.value })}
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium disabled:opacity-60"
            >
              {submitting ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </button>
          </form>
        ) : mode === "forgot" ? (
          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Entrez l'email de votre compte. Si un compte actif existe, vous recevrez un lien sécurisé.
            </p>
            <AuthFormField
              label="Email"
              type="email"
              id="reset-email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium disabled:opacity-60"
            >
              {submitting ? "Envoi…" : "Recevoir le lien"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className="text-sm font-medium text-brand-dark hover:underline"
            >
              Retour à la connexion
            </button>
          </form>
        ) : mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
            <AuthFormField
              label="Email ou numéro de téléphone"
              type="text"
              id="login-username"
              placeholder="vous@exemple.com ou +229 01 23 45 67"
              autoComplete="username"
              required
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            />
            <AuthFormField
              label="Mot de passe"
              type="password"
              id="login-password"
              placeholder="Mot de passe"
              autoComplete="current-password"
              required
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium disabled:opacity-60"
            >
              {submitting ? "Connexion…" : "Se connecter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setSuccess(null);
                setResetEmail(loginForm.username.includes("@") ? loginForm.username : "");
              }}
              className="self-start text-sm font-medium text-brand-dark hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
            <AuthFormField
              label="Nom d'utilisateur"
              type="text"
              id="register-username"
              placeholder="Nom d'utilisateur"
              autoComplete="username"
              required
              value={registerForm.username}
              onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
            />
            <AuthFormField
              label="Email"
              type="email"
              id="register-email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            />
            <AuthFormField
              label="Téléphone"
              type="tel"
              id="register-phone"
              placeholder="+229 01 XX XX XX XX"
              autoComplete="tel"
              value={registerForm.phone}
              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
            />
            <label htmlFor="register-channel" className="text-sm font-semibold text-ink">
              Recevoir mes notifications par
              <select
                id="register-channel"
                value={registerForm.notification_channel}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, notification_channel: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="email">Email</option>
                {notificationSettings.whatsapp_enabled && <option value="whatsapp">WhatsApp</option>}
                {notificationSettings.sms_enabled && <option value="sms">SMS</option>}
              </select>
            </label>
            <AuthFormField
              label="Mot de passe"
              type="password"
              id="register-password"
              placeholder="Mot de passe"
              autoComplete="new-password"
              required
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
            />
            <AuthFormField
              label="Confirmer le mot de passe"
              type="password"
              id="register-password2"
              placeholder="Confirmer le mot de passe"
              autoComplete="new-password"
              required
              value={registerForm.password2}
              onChange={(e) => setRegisterForm({ ...registerForm, password2: e.target.value })}
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-medium disabled:opacity-60"
            >
              {submitting ? "Création…" : "Créer mon compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
