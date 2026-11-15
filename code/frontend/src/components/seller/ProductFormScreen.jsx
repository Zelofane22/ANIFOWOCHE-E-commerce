import useMediaQuery from "../../hooks/useMediaQuery.js";
import ProductFormDesktop from "./ProductFormDesktop.jsx";
import ProductFormMobile from "./ProductFormMobile.jsx";
import useProductForm from "./useProductForm.js";

// Breakpoint `lg` de Tailwind : vue desktop à partir de 1024 px.
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Formulaire produit vendeur (création / modification).
 * L'état est porté ici une seule fois puis passé à la vue mobile (assistant en étapes)
 * ou desktop (2 colonnes). Une seule vue est montée à la fois pour ne pas dupliquer
 * les champs de fichier ni le chargement de la galerie ; l'état survit au redimensionnement.
 */
export default function ProductFormScreen({ seller, categoryTree, product, activeProductCount = 0 }) {
  const ctl = useProductForm({ seller, categoryTree, product, activeProductCount });
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  return isDesktop ? (
    <ProductFormDesktop ctl={ctl} seller={seller} />
  ) : (
    <ProductFormMobile ctl={ctl} />
  );
}
