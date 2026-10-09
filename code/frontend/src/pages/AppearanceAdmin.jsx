import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  fetchDraft,
  fetchHistory,
  publishDraft,
  restoreVersion,
  saveDraft,
} from "../api/siteConfig.js";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import Seo from "../components/Seo.jsx";
import { EyeIcon, RefreshCwIcon } from "../components/icons.jsx";
import { useAuth } from "../context/useAuth.js";
import { extractErrorMessage } from "../utils/apiError.js";

const COLOR_FIELDS = [
  { key: "brand", label: "Marque" },
  { key: "brand_dark", label: "Marque foncée" },
  { key: "brand_medium", label: "Marque intermédiaire" },
  { key: "brand_light", label: "Marque claire" },
  { key: "brand_pale", label: "Marque très pâle" },
];

const SECTION_LABELS = {
  trust: "Arguments de confiance",
  categories: "Catégories",
  featured: "Produits mis en avant",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR");
}

export default function AppearanceAdmin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(null);
  const [sections, setSections] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([fetchDraft(), fetchHistory()])
      .then(([draftData, historyData]) => {
        setTheme(draftData.theme);
        setSections(draftData.sections);
        setHistory(historyData);
        setError(null);
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });

  useEffect(() => {
    load();
  }, []);

  const publishedVersions = useMemo(
    () => history.filter((v) => v.status === "published"),
    [history]
  );
  const latestPublished = publishedVersions[0] ?? null;

  const sortedHistory = useMemo(
    () =>
      [...history].sort((a, b) => {
        const ap = a.published_at || "";
        const bp = b.published_at || "";
        if (ap && bp) return bp.localeCompare(ap);
        if (ap) return -1;
        if (bp) return 1;
        return (b.id ?? 0) - (a.id ?? 0);
      }),
    [history]
  );

  if (authLoading) return <LoadingState message="Chargement…" />;
  if (!user) return <ErrorState message="Veuillez vous connecter." />;
  if (!user.is_superuser) return <ErrorState message="Accès réservé aux superadmins." />;
  if (loading) return <LoadingState message="Chargement de l'apparence…" />;
  if (error && !theme) return <ErrorState message={error} onRetry={load} />;

  const updateTheme = (patch) => setTheme((t) => ({ ...t, ...patch }));
  const updateColor = (key, value) =>
    setTheme((t) => ({ ...t, colors: { ...(t.colors || {}), [key]: value } }));

  const updateSection = (type, patch) =>
    setSections((list) => list.map((s) => (s.type === type ? { ...s, ...patch } : s)));

  const trustText = (theme?.trust_arguments || []).join("\n");

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await saveDraft({ theme, sections });
      setNotice("Brouillon enregistré.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await saveDraft({ theme, sections });
      navigate(`/admin/apparence/preview/${data.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await saveDraft({ theme, sections });
      await publishDraft();
      await load();
      setNotice("Configuration publiée.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Restaurer cette version ? Une nouvelle version publiée sera créée.")) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await restoreVersion(id);
      await load();
      setNotice("Version restaurée et publiée.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Seo title="Apparence" path="/admin/apparence" type="website" />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Apparence du site</h1>
          <p className="mt-1 text-sm text-muted">
            Modifiez le brouillon, prévisualisez puis publiez pour rendre la configuration visible.
          </p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm">
          <span className="text-muted">Publié : </span>
          {latestPublished ? (
            <span className="font-semibold text-ink">
              version #{latestPublished.id} · {formatDate(latestPublished.published_at)}
            </span>
          ) : (
            <span className="font-semibold text-brand-dark">aucune version publiée</span>
          )}
        </div>
      </div>

      {notice && (
        <p role="status" aria-live="polite" className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </p>
      )}
      {error && (
        <div className="mb-4">
          <ErrorState message={error} className="rounded-md bg-red-50 px-3 py-2 text-sm" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Formulaire brouillon */}
        <div className="space-y-6">
          <section className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
              Brouillon
              <span className="rounded-full bg-brand-pale px-2 py-0.5 text-xs font-semibold text-brand-dark">
                non publié
              </span>
            </h2>

            <label className="block text-sm font-semibold text-ink" htmlFor="site-name">
              Nom du site
              <input
                id="site-name"
                type="text"
                value={theme?.site_name ?? ""}
                onChange={(e) => updateTheme({ site_name: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <div className="mt-4">
              <p className="text-sm font-semibold text-ink">Couleurs de la marque</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {COLOR_FIELDS.map((field) => (
                  <label key={field.key} className="flex items-center gap-3 text-sm">
                    <input
                      type="color"
                      value={theme?.colors?.[field.key] || "#000000"}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-gray-300"
                    />
                    <span className="flex-1 text-muted">{field.label}</span>
                    <span className="font-mono text-xs text-ink">{theme?.colors?.[field.key]}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="trust-args">
              Arguments de confiance (un par ligne)
              <textarea
                id="trust-args"
                rows={4}
                value={trustText}
                onChange={(e) =>
                  updateTheme({
                    trust_arguments: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>
          </section>

          <section className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-ink">Sections de la page d'accueil</h2>
            <div className="flex flex-col gap-2">
              {sections.map((section) => (
                <div key={section.type} className="flex items-center gap-3 rounded-lg border border-black/5 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(section.enabled)}
                    onChange={(e) => updateSection(section.type, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="flex-1 text-sm font-medium text-ink">
                    {SECTION_LABELS[section.type] ?? section.type}
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    Ordre
                    <input
                      type="number"
                      min="0"
                      value={section.order}
                      onChange={(e) =>
                        updateSection(section.type, { order: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Actions + historique */}
        <div className="space-y-6">
          <section className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-ink">Actions</h2>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand-dark disabled:opacity-60"
              >
                {busy ? "Enregistrement…" : "Enregistrer le brouillon"}
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand-dark disabled:opacity-60"
              >
                <EyeIcon size={15} /> Prévisualiser
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={busy}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-medium disabled:opacity-60"
              >
                {busy ? "Publication…" : "Publier"}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="mb-3 text-base font-bold text-ink">Historique</h2>
            {sortedHistory.length === 0 ? (
              <p className="text-sm text-muted">Aucune version pour le moment.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {sortedHistory.map((version) => {
                  const isPublished = version.status === "published";
                  const isLatest = latestPublished && version.id === latestPublished.id;
                  return (
                    <li
                      key={version.id}
                      className="flex items-center gap-2 rounded-lg border border-black/5 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">
                          Version #{version.id}
                          {isLatest && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              publiée
                            </span>
                          )}
                          {isPublished && !isLatest && (
                            <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-muted">
                              publiée
                            </span>
                          )}
                          {!isPublished && (
                            <span className="ml-2 rounded-full bg-brand-pale px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
                              brouillon
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted">{formatDate(version.published_at)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/apparence/preview/${version.id}`)}
                        className="rounded-md border border-black/10 p-1.5 text-muted transition hover:text-brand-dark"
                        aria-label={`Prévisualiser la version ${version.id}`}
                      >
                        <EyeIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestore(version.id)}
                        disabled={busy || isLatest}
                        className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                        title={isLatest ? "Version déjà publiée" : "Restaurer cette version"}
                      >
                        <RefreshCwIcon size={12} /> Restaurer
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
