// Optimisation des images Cloudinary : format moderne (f_auto → WebP/AVIF),
// compression adaptée (q_auto) et largeur plafonnée (c_limit) pour ne jamais
// transférer plus de pixels que nécessaire à l'affichage.
// Les URLs non-Cloudinary (ex. /media/ en dev local) sont renvoyées telles quelles.
const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

export function optimizedImage(url, width) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return url;
  }
  const transformations = width ? `f_auto,q_auto,w_${width},c_limit` : "f_auto,q_auto";
  return url.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${transformations}/`);
}
