import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { getSellerProfile } from "../api/seller.js";
import { ArrowRightIcon, StoreIcon } from "../components/icons.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";

const emptyLoginForm = { username: "", password: "" };
const emptyRegisterForm = {
  username: "",
  email: "",
  password: "",
  password2: "",
  display_name: "",
  phone: "",
  city: "",
  shop_name: "",
  shop_slug: "",
  shop_description: "",
};

const toSlug = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function SellerAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout, registerSeller } = useAuth();
  const initialMode = location.pathname.endsWith("/register") ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const generatedSlug = useMemo(
    () => toSlug(registerForm.shop_slug || registerForm.shop_name || registerForm.display_name),
    [registerForm.display_name, registerForm.shop_name, registerForm.shop_slug],
  );

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(loginForm);
      await getSellerProfile();
      navigate("/seller/dashboard", { replace: true });
    } catch (err) {
      logout();
      setError(
        err?.response?.status === 404
          ? "Ce compte existe, mais il n'a pas encore d'espace vendeur."
          : extractErrorMessage(err),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerSeller({
        ...registerForm,
        shop_slug: generatedSlug,
        shop_name: registerForm.shop_name || registerForm.display_name,
      });
      navigate("/seller/dashboard", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    navigate(nextMode === "register" ? "/seller/register" : "/seller/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] px-4 py-8 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark">
            <StoreIcon size={18} />
            ANIF Seller
          </Link>
          <h1 className="mt-8 max-w-lg text-4xl font-bold leading-tight text-ink">
            Un espace simple pour transformer les commandes WhatsApp en boutique suivie.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted">
            Créez votre boutique, partagez un lien clair et gardez une base propre pour les prochains
            sprints : produits, commandes et messages WhatsApp.
          </p>
          <div className="mt-8 grid max-w-md gap-3 text-sm text-ink">
            <div className="rounded-lg border border-black/10 bg-white px-4 py-3">Profil vendeur prêt</div>
            <div className="rounded-lg border border-black/10 bg-white px-4 py-3">Slug boutique partageable</div>
            <div className="rounded-lg border border-black/10 bg-white px-4 py-3">Navigation SaaS dédiée</div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl rounded-xl border border-black/10 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-dark">ANIF Seller</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">
                {mode === "register" ? "Créer mon espace vendeur" : "Connexion vendeur"}
              </h2>
            </div>
            <StoreIcon size={28} className="text-brand-dark" />
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-md px-3 py-2 transition ${
                mode === "login" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-md px-3 py-2 transition ${
                mode === "register" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Inscription
            </button>
          </div>

          {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="grid gap-4">
              <Field label="Email, téléphone ou nom d'utilisateur">
                <input
                  className={inputClass}
                  required
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                />
              </Field>
              <Field label="Mot de passe">
                <input
                  className={inputClass}
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </Field>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-medium disabled:opacity-60"
              >
                {submitting ? "Connexion..." : "Entrer dans mon espace"}
                <ArrowRightIcon size={15} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom vendeur">
                  <input
                    className={inputClass}
                    required
                    value={registerForm.display_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, display_name: e.target.value })}
                  />
                </Field>
                <Field label="Téléphone WhatsApp">
                  <input
                    className={inputClass}
                    type="tel"
                    required
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom de boutique">
                  <input
                    className={inputClass}
                    required
                    value={registerForm.shop_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, shop_name: e.target.value })}
                  />
                </Field>
                <Field label="Ville">
                  <input
                    className={inputClass}
                    value={registerForm.city}
                    onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Lien boutique">
                <div className="flex overflow-hidden rounded-lg border border-black/15 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                  <span className="hidden shrink-0 bg-gray-50 px-3 py-2.5 text-sm text-muted sm:inline">
                    /shop/
                  </span>
                  <input
                    className="w-full bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-gray-500"
                    value={registerForm.shop_slug || generatedSlug}
                    onChange={(e) => setRegisterForm({ ...registerForm, shop_slug: toSlug(e.target.value) })}
                  />
                </div>
              </Field>
              <Field label="Description courte">
                <textarea
                  className={`${inputClass} min-h-20 resize-y`}
                  value={registerForm.shop_description}
                  onChange={(e) => setRegisterForm({ ...registerForm, shop_description: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom d'utilisateur">
                  <input
                    className={inputClass}
                    required
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <input
                    className={inputClass}
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mot de passe">
                  <input
                    className={inputClass}
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  />
                </Field>
                <Field label="Confirmation">
                  <input
                    className={inputClass}
                    type="password"
                    required
                    value={registerForm.password2}
                    onChange={(e) => setRegisterForm({ ...registerForm, password2: e.target.value })}
                  />
                </Field>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-medium disabled:opacity-60"
              >
                {submitting ? "Création..." : "Créer mon espace vendeur"}
                <ArrowRightIcon size={15} />
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
