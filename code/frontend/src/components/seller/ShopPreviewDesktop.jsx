import { EyeIcon, EyeOffIcon, MapPinIcon, MessageSquareIcon, PackageIcon, StoreIcon } from "../icons.jsx";
import { formatXof } from "../../utils/format.js";

/**
 * Aperçu desktop de la boutique publique, reflétant en direct les valeurs du
 * formulaire « Paramètres boutique ». Purement présentationnel (aucun appel API),
 * visuellement aligné sur `pages/PublicShop.jsx`.
 */
export default function ShopPreviewDesktop({
  name,
  city,
  description,
  image,
  imageLoading = false,
  whatsappPhone,
  publicUrl,
  isPublished,
  deliveryZones = [],
}) {
  const displayName = name?.trim() || "Ma boutique";

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Aperçu en direct</p>
          <p className="mt-0.5 text-xs text-[#6B7280]">Ce que vos clients verront</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isPublished ? "bg-green-50 text-green-700" : "bg-[#F3F4F6] text-[#6B7280]"
          }`}
        >
          {isPublished ? <EyeIcon size={12} /> : <EyeOffIcon size={12} />}
          {isPublished ? "Visible" : "Masquée"}
        </span>
      </div>

      <div className="p-4">
        {/* Cadre « navigateur » */}
        <div className="overflow-hidden rounded-xl border border-black/10 bg-surface-muted">
          <div className="flex items-center gap-2 border-b border-black/10 bg-white px-3 py-2">
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-[#F87171]" />
              <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
              <span className="h-2 w-2 rounded-full bg-[#34D399]" />
            </span>
            <p className="min-w-0 flex-1 truncate rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] text-[#6B7280]" title={publicUrl}>
              {publicUrl}
            </p>
          </div>

          {/* En-tête de la boutique publique */}
          <div className="flex items-center gap-3 border-b border-black/10 bg-white px-4 py-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-light text-brand-dark">
              {image ? (
                <img src={image} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <StoreIcon size={22} />
              )}
              {imageLoading && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-ink">{displayName}</p>
              {city?.trim() && (
                <p className="flex items-center gap-1 truncate text-xs text-muted">
                  <MapPinIcon size={11} />
                  {city}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 p-3">
            <section className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-xs font-semibold text-brand-dark">Boutique publique</p>
              <h3 className="mt-1 break-words text-lg font-bold text-ink">{displayName}</h3>
              {description?.trim() ? (
                <p className="mt-2 line-clamp-5 whitespace-pre-line break-words text-xs leading-5 text-muted">{description}</p>
              ) : (
                <p className="mt-2 text-xs italic text-[#9CA3AF]">Ajoutez une description pour présenter votre boutique.</p>
              )}
              {whatsappPhone?.trim() && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                  <MessageSquareIcon size={12} />
                  {whatsappPhone}
                </p>
              )}
              {deliveryZones.length > 0 && (
                <div className="mt-3 border-t border-black/10 pt-3">
                  <p className="text-xs font-bold text-ink">Zones de livraison couvertes</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {deliveryZones.map((zone) => (
                      <span key={zone.id} className="rounded-full bg-brand-pale px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                        {zone.name}
                        {zone.fee_xof != null ? ` · ${formatXof(zone.fee_xof)}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section>
              <p className="text-sm font-bold text-ink">Produits disponibles</p>
              <div className="mt-2 grid grid-cols-3 gap-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="overflow-hidden rounded-lg border border-black/10 bg-white">
                    <div className="flex aspect-square items-center justify-center bg-brand-pale text-brand-dark/40">
                      <PackageIcon size={18} />
                    </div>
                    <div className="space-y-1 p-2">
                      <span className="block h-1.5 w-3/4 rounded bg-[#E5E7EB]" />
                      <span className="block h-1.5 w-1/2 rounded bg-[#E5E7EB]" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#9CA3AF]">Vos produits publiés apparaîtront ici.</p>
            </section>
          </div>
        </div>

        {!isPublished && (
          <p className="mt-3 rounded-[10px] bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Boutique masquée : vos clients ne la voient pas tant qu'elle n'est pas rendue publique.
          </p>
        )}
      </div>
    </div>
  );
}
