import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, ImageIcon } from "../icons.jsx";
import ProductImage from "../ProductImage.jsx";
import { formatXof } from "../../utils/format.js";

const UNIT_LABELS = { piece: "Pièce", metre: "Mètre" };
const SIZE_LABELS = { UNIQUE: "Taille unique" };

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

function Card({ title, aside, children }) {
  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-6">
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

function Kpi({ label, value, sub, tone = "text-ink" }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F4F4F8] px-4 py-3">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`mt-1 truncate text-lg font-extrabold ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs font-medium text-[#9CA3AF]">{sub}</p>}
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] py-2.5 last:border-b-0">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

/**
 * Vue desktop (≥ lg) de la fiche produit vendeur.
 * Purement présentationnelle : les données et actions viennent de SellerProductManage.
 */
export default function ProductManageDesktop({ product, performance, StatusBadge }) {
  const gallery = useMemo(() => {
    const images = (product.images ?? [])
      .filter((img) => img.image && img.is_active !== false)
      .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || (a.order ?? 0) - (b.order ?? 0))
      .map((img) => ({ key: `img-${img.id}`, src: img.image, alt: img.alt_text || product.name, color: img.color_name }));
    if (images.length === 0 && product.image) {
      images.push({ key: "main", src: product.image, alt: product.name });
    }
    return images;
  }, [product]);

  const [selectedKey, setSelectedKey] = useState(null);
  const selected = gallery.find((img) => img.key === selectedKey) ?? gallery[0] ?? null;

  const stock = product.stock ?? 0;
  const stockTone = product.made_to_order ? "text-blue-700" : stock <= 0 ? "text-red-700" : stock <= 5 ? "text-amber-700" : "text-ink";
  const hasDiscount = product.discounted_price_xof != null && product.discount_percent;
  const colors = Array.isArray(product.colors) ? product.colors.filter((c) => c?.name) : [];
  const optionGroups = product.option_groups ?? [];

  return (
    <div className="space-y-5 px-8 pt-6 pb-8">
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <ChevronLeftIcon size={16} />
        Retour aux produits
      </Link>

      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-5">
        {/* Colonne gauche : images + description */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-black/[0.07] bg-white p-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F3F4F6]">
              {selected ? (
                <ProductImage key={selected.src} src={selected.src} alt={selected.alt} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                  <ImageIcon size={48} className="text-[#D1D5DB]" />
                  <span className="text-sm font-medium">Aucune image</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <StatusBadge product={product} />
              </div>
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {gallery.map((img) => (
                  <button
                    key={img.key}
                    type="button"
                    onClick={() => setSelectedKey(img.key)}
                    aria-label={`Afficher l’image ${img.alt}`}
                    aria-pressed={selected?.key === img.key}
                    className={`aspect-square overflow-hidden rounded-lg bg-[#F3F4F6] ring-2 transition ${
                      selected?.key === img.key ? "ring-brand" : "ring-transparent hover:ring-black/10"
                    }`}
                  >
                    <ProductImage src={img.src} alt="" width={160} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <Card title="Description">
            {product.description ? (
              <p className="text-sm leading-6 whitespace-pre-line text-muted">{product.description}</p>
            ) : (
              <p className="text-sm text-[#9CA3AF]">Aucune description.</p>
            )}
          </Card>
        </div>

        {/* Colonne droite : prix, stock, infos, options, performance */}
        <div className="space-y-5">
          <Card title="Vue d’ensemble">
            <div className="grid grid-cols-3 gap-3">
              <Kpi
                label="Prix"
                value={formatXof(hasDiscount ? product.discounted_price_xof : product.price_xof)}
                sub={hasDiscount ? `au lieu de ${formatXof(product.price_xof)} (−${product.discount_percent} %)` : UNIT_LABELS[product.unit] ? `par ${UNIT_LABELS[product.unit].toLowerCase()}` : null}
              />
              <Kpi
                label="Stock"
                value={product.made_to_order ? "Sur commande" : stock}
                sub={product.made_to_order ? "fabriqué à la commande" : stock <= 0 ? "rupture" : stock <= 5 ? "stock faible" : "disponible"}
                tone={stockTone}
              />
              <Kpi label="Ventes" value={performance?.orders ?? 0} sub="commandes" />
            </div>
          </Card>

          <Card title="Informations">
            <dl>
              <InfoRow label="Catégorie">{product.category_path || product.category?.name || "—"}</InfoRow>
              <InfoRow label="Unité de vente">{UNIT_LABELS[product.unit] ?? product.unit ?? "—"}</InfoRow>
              <InfoRow label="Taille">{SIZE_LABELS[product.size] ?? product.size ?? "—"}</InfoRow>
              {colors.length > 0 && (
                <InfoRow label="Couleurs">
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {colors.map((c) => (
                      <span
                        key={c.name}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F8] px-2.5 py-1 text-xs font-semibold text-ink"
                      >
                        {c.hex && <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />}
                        {c.name}
                        {c.stock != null && <span className="font-medium text-[#9CA3AF]">· {c.stock}</span>}
                      </span>
                    ))}
                  </span>
                </InfoRow>
              )}
              {product.rating_average != null && (
                <InfoRow label="Note">
                  {product.rating_average} / 5 · {product.review_count ?? 0} avis
                </InfoRow>
              )}
              <InfoRow label="Créé le">{formatDate(product.created_at)}</InfoRow>
              <InfoRow label="Modifié le">{formatDate(product.updated_at)}</InfoRow>
            </dl>
          </Card>

          {optionGroups.length > 0 && (
            <Card title="Options de vente">
              <div className="space-y-4">
                {optionGroups.map((group) => (
                  <div key={group.id ?? group.name}>
                    <p className="text-sm font-bold text-ink">
                      {group.name}
                      {group.is_required && <span className="ml-2 text-xs font-semibold text-[#9CA3AF]">obligatoire</span>}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {(group.options ?? []).map((opt) => (
                        <li
                          key={opt.id ?? opt.name}
                          className="rounded-full bg-[#F4F4F8] px-2.5 py-1 text-xs font-semibold text-ink"
                        >
                          {opt.name}
                          {opt.price_xof ? <span className="font-medium text-muted"> +{formatXof(opt.price_xof)}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {performance && (
            <Card
              title="Performance"
              aside={
                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#9CA3AF]">7 jours</span>
              }
            >
              <div className="grid grid-cols-3 gap-3">
                <Kpi label="Vues" value={performance.views} />
                <Kpi label="Commandes" value={performance.orders} />
                <Kpi label="Revenu" value={formatXof(performance.revenue)} />
                <Kpi label="Conversion" value={performance.conversion} />
                <Kpi label="Favoris" value={performance.favorites} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
