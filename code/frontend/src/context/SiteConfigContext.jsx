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

// Applique/restaure les couleurs sur :root. On mémorise les valeurs précédentes
// afin de les restaurer au démontage (utile pour la prévisualisation US-54 qui
// monte un provider imbriqué avec la config brouillon).
function applyColors(colors) {
  const root = document.documentElement;
  const previous = {};
  Object.entries(COLOR_VAR_MAP).forEach(([key, cssVar]) => {
    const value = colors?.[key];
    if (value) {
      previous[cssVar] = root.style.getPropertyValue(cssVar);
      root.style.setProperty(cssVar, value);
    }
  });
  return () => {
    Object.entries(previous).forEach(([cssVar, value]) => {
      if (value) root.style.setProperty(cssVar, value);
      else root.style.removeProperty(cssVar);
    });
  };
}

export function SiteConfigProvider({ children, config: configOverride }) {
  const [config, setConfig] = useState(configOverride ?? null);
  const [loaded, setLoaded] = useState(Boolean(configOverride));

  // Un seul fetch au montage (sobriété numérique). Si une config est fournie
  // (prévisualisation US-54), on ne fetch pas et on se contente de ce snapshot.
  useEffect(() => {
    if (configOverride) return;
    fetchSiteConfig()
      .then((data) => setConfig(data))
      .catch(() => setConfig(null))
      .finally(() => setLoaded(true));
  }, [configOverride]);

  const colors = config?.theme?.colors;

  // Applique le thème couleur en surchargeant les variables CSS sur :root.
  useEffect(() => {
    if (!colors) return undefined;
    return applyColors(colors);
  }, [colors]);

  const theme = config?.theme ?? null;
  const sections = config?.sections ?? null;

  const value = useMemo(() => {
    const menu_items = config?.menu_items ?? [];
    const footer_blocks = config?.footer_blocks ?? [];

    // Sécurise le tri même si l'API l'a déjà fait.
    const orderedSections = sections
      ? sections.slice().sort((a, b) => a.order - b.order)
      : null;

    // Fallback : si sections indispo (API pas chargée / en échec), tout est affiché.
    const isSectionEnabled = (type) => {
      if (!sections) return true;
      return sections.some((section) => section.type === type && section.enabled);
    };

    return { config, loaded, theme, sections, orderedSections, isSectionEnabled, menu_items, footer_blocks };
  }, [config, loaded, theme, sections]);

  return (
    <SiteConfigContextValue.Provider value={value}>{children}</SiteConfigContextValue.Provider>
  );
}
