import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { extractErrorMessage } from "../utils/apiError.js";

const emptyRegisterForm = { username: "", email: "", password: "", password2: "" };
const emptyLoginForm = { username: "", password: "" };

export default function Account() {
  const { user, loading, isAuthenticated, login, register, logout } = useAuth();
  const [mode, setMode] = useState("login");
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
      </div>
    );
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(loginForm);
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
