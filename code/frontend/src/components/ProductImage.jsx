import { useState } from "react";
import { optimizedImage } from "../utils/imageUrl.js";

export const PLACEHOLDER_IMAGE = "/assets/images/placeholder.svg";

// Image produit avec repli progressif : URL Cloudinary optimisée → URL d'origine
// → placeholder. Couvre les 404 (asset supprimé, transformation non supportée)
// qui renvoient une page HTML et déclenchent un blocage ERR_BLOCKED_BY_ORB.
export default function ProductImage({ src, alt = "", width, className = "", ...rest }) {
  const candidates = [];
  if (src) {
    const optimized = optimizedImage(src, width);
    candidates.push(optimized);
    if (optimized !== src) candidates.push(src);
  }
  candidates.push(PLACEHOLDER_IMAGE);

  const [stage, setStage] = useState(0);
  const current = candidates[Math.min(stage, candidates.length - 1)];

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setStage((s) => s + 1)}
      {...rest}
    />
  );
}
