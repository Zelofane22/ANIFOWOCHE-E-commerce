import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { previewVersion } from "../api/siteConfig.js";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import { SiteConfigProvider } from "../context/SiteConfigContext.jsx";
import { extractErrorMessage } from "../utils/apiError.js";
import Home from "./Home.jsx";

// Prévisualisation d'une version d'apparence (US-54). Rend la page d'accueil
// avec les mêmes composants de vitrine que la version publique, mais nourris
// par le snapshot de la version ciblée — sans modifier /api/site-config/.
export default function AppearancePreview() {
  const { id } = useParams();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    previewVersion(id)
      .then((data) => {
        if (!ignore) setConfig(data);
      })
      .catch((err) => {
        if (!ignore) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <LoadingState message="Chargement de l'aperçu…" />;
  if (error || !config) return <ErrorState message={error || "Aperçu indisponible."} />;

  return (
    <SiteConfigProvider config={config}>
      <div className="min-h-screen bg-white text-ink">
        <div className="sticky top-0 z-40 bg-brand-dark px-4 py-2 text-center text-sm text-white">
          Aperçu — cette configuration n'est pas publiée.{" "}
          <Link to="/admin/apparence" className="font-semibold underline">
            Retour à l'éditeur
          </Link>
        </div>
        <main>
          <Home />
        </main>
      </div>
    </SiteConfigProvider>
  );
}
