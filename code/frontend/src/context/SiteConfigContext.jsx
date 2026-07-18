import { createContext, useEffect, useMemo, useState } from "react";
import { fetchSiteConfig } from "../api/siteConfig.js";

// eslint-disable-next-line react-refresh/only-export-components
export const SiteConfigContextValue = createContext(null);

// Mapping couleur (clé snake_case renvoyée par l'API) -> variable CSS Tailwind.
// Surcharger ces variables sur :root suffit à re-thémer (cf. @theme dans index.css).
const COLOR_VAR_MAP = {
  brand: "--color-brand",
  brand_dark: "--color-brand-dark",
  brand_medium: "--color-brand-medium",
  brand_light: "--color-brand-light",
  brand_pale: "--color-brand-pale",
};

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Un seul fetch au montage (sobriété numérique). En cas d'échec on laisse
  // config à null : le site retombe sur ses valeurs par défaut en dur.
  useEffect(() => {
    fetchSiteConfig()
      .then((data) => setConfig(data))
      .catch(() => setConfig(null))
      .finally(() => setLoaded(true));
  }, []);

  const colors = config?.theme?.colors;

  // Applique le thème couleur en surchargeant les variables CSS sur :root.
  useEffect(() => {
    if (!colors) return;
    const root = document.documentElement;
    Object.entries(COLOR_VAR_MAP).forEach(([key, cssVar]) => {
      const value = colors[key];
      if (value) root.style.setProperty(cssVar, value);
    });
  }, [colors]);

  const theme = config?.theme ?? null;
  const sections = config?.sections ?? null;

  const value = useMemo(() => {
    // Sécurise le tri même si l'API l'a déjà fait.
    const orderedSections = sections
      ? sections.slice().sort((a, b) => a.order - b.order)
      : null;

    // Fallback : si sections indispo (API pas chargée / en échec), tout est affiché.
    const isSectionEnabled = (type) => {
      if (!sections) return true;
      return sections.some((section) => section.type === type && section.enabled);
    };

    return { config, loaded, theme, sections, orderedSections, isSectionEnabled };
  }, [config, loaded, theme, sections]);

  return (
    <SiteConfigContextValue.Provider value={value}>{children}</SiteConfigContextValue.Provider>
  );
}
