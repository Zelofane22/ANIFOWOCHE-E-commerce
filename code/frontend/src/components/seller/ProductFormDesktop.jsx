import { Link } from "react-router";
import ProductImage from "../ProductImage.jsx";
import { CheckIcon, ChevronLeftIcon, EyeIcon, EyeOffIcon, ImageIcon, InfoIcon } from "../icons.jsx";
import { formatXof } from "../../utils/format.js";
import SellerShell from "./SellerShell.jsx";
import {
  CategoryField,
  ColorsField,
  DescriptionField,
  GalleryField,
  LimitNotice,
  MainPhotoPicker,
  MaintenanceAlert,
  NameField,
  PhotoTip,
  PriceField,
  SizeField,
  StockField,
  UnitField,
  VisibilityToggle,
} from "./ProductFormFields.jsx";

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-6">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-[#9CA3AF]">{description}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** Aperçu simplifié de la carte produit telle qu'affichée dans la boutique. */
export function ProductCardPreview({ form, categoryName, discountPercent = 0 }) {
  const price = form.price_xof === "" ? null : parseInt(form.price_xof, 10) || 0;
  const discounted =
    price != null && discountPercent > 0 ? Math.round((price * (100 - discountPercent)) / 100) : null;

  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <h2 className="text-base font-bold text-ink">Aperçu dans la boutique</h2>
      <p className="mt-0.5 text-[13px] text-[#9CA3AF]">Carte produit vue par vos clients.</p>

      <div
        className="mx-auto mt-4 max-w-[240px] overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm"
        data-testid="product-card-preview"
      >
        <div className="relative aspect-square bg-[#F3F4F6]">
          {form.imagePreview ? (
            <ProductImage
              key={form.imagePreview}
              src={form.imagePreview}
              alt={form.name || "Aperçu du produit"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9CA3AF]">
              <ImageIcon size={28} />
              <span className="text-xs font-medium">Aucune photo</span>
            </div>
          )}
          {categoryName && (
            <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-dark shadow-sm">
              {categoryName}
            </span>
          )}
          {!form.is_active && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#111827]/80 px-2.5 py-1 text-xs font-bold text-white">
              <EyeOffIcon size={12} />
              Masqué
            </span>
          )}
          {discounted != null && (
            <span className="absolute bottom-2 left-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 min-h-10 break-words text-sm font-semibold leading-5 text-ink">
            {form.name.trim() || <span className="text-[#9CA3AF]">Nom du produit</span>}
          </h3>
          <div className="mt-3">
            {price == null ? (
              <p className="text-sm font-medium text-[#9CA3AF]">Prix non défini</p>
            ) : discounted != null ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-base font-bold text-red-600">{formatXof(discounted)}</p>
                <p className="text-xs text-muted line-through">{formatXof(price)}</p>
              </div>
            ) : (
              <p className="text-base font-bold text-ink">{formatXof(price)}</p>
            )}
          </div>
        </div>
      </div>
      {discounted != null && (
        <p className="mt-3 text-center text-xs text-[#9CA3AF]">
          Promotion en cours appliquée au prix saisi.
        </p>
      )}
    </section>
  );
}

const missingFields = (form) =>
  [
    !form.name.trim() && "nom",
    !form.category_id && "catégorie",
    form.price_xof === "" && "prix",
  ].filter(Boolean);

/**
 * Vue desktop (≥ lg) du formulaire produit : formulaire à gauche, photos et aperçu
 * à droite, barre d'actions fixée en bas. La logique vient de `useProductForm` (`ctl`).
 */
export default function ProductFormDesktop({ ctl, seller }) {
  const {
    form,
    product,
    isEditing,
    submitting,
    error,
    maintenanceMode,
    createLimitReached,
    selectedCategory,
    fieldConfig,
    isValid,
    handleSubmit,
  } = ctl;

  const missing = missingFields(form);
  const submitDisabled = submitting || maintenanceMode || !isValid || createLimitReached;

  const header = {
    title: isEditing ? "Modifier le produit" : "Nouveau produit",
    subtitle: isEditing ? product.name : "Ajoutez un article à votre catalogue",
    actions: (
      <div className="flex shrink-0 items-center gap-2">
        {isEditing && (
          <Link
            to={`/products/${product.slug}`}
            className="inline-flex items-center gap-2 rounded-[10px] border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
          >
            <EyeIcon size={16} />
            Voir la fiche
          </Link>
        )}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-[10px] border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-dark"
        >
          <ChevronLeftIcon size={16} />
          Retour aux produits
        </Link>
      </div>
    ),
  };

  return (
    <SellerShell seller={seller} pendingCount={0} header={header}>
      <div className="px-8 pt-6 pb-32">
        {maintenanceMode && <MaintenanceAlert className="mb-6" />}
        {createLimitReached && (
          <div className="mb-6">
            <LimitNotice ctl={ctl} />
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Colonne gauche : formulaire */}
          <div className="flex min-w-0 flex-col gap-6">
            <Section title="Informations" description="Nom, catégorie et description du produit.">
              <NameField ctl={ctl} />
              <CategoryField ctl={ctl} />
              <DescriptionField ctl={ctl} />
            </Section>

            <Section title="Prix et stock" description="Prix de vente et disponibilité.">
              <div className="grid grid-cols-2 gap-4">
                <PriceField ctl={ctl} />
                <StockField ctl={ctl} />
              </div>
              {selectedCategory?.is_made_to_order && (
                <p className="flex items-start gap-2 rounded-[12px] bg-[#FEF9E7] px-3 py-2.5 text-xs leading-relaxed text-muted">
                  <InfoIcon size={14} className="mt-0.5 shrink-0 text-brand" />
                  Produit fabriqué sur commande : pas de stock, d&apos;unité ni de taille à renseigner.
                </p>
              )}
              {(fieldConfig.unit || fieldConfig.size) && (
                <div className="grid grid-cols-2 gap-4">
                  <UnitField ctl={ctl} />
                  <SizeField ctl={ctl} />
                </div>
              )}
            </Section>

            {fieldConfig.colors && (
              <Section title="Couleurs" description="Variantes de couleur et stock par couleur.">
                <ColorsField ctl={ctl} showLabel={false} />
              </Section>
            )}

            <Section title="Visibilité" description="Un produit masqué reste dans votre catalogue sans être visible des clients.">
              <VisibilityToggle ctl={ctl} />
            </Section>
          </div>

          {/* Colonne droite : aperçu + images */}
          <aside className="flex min-w-0 flex-col gap-6">
            <ProductCardPreview
              form={form}
              categoryName={selectedCategory?.name}
              discountPercent={product?.discount_percent ?? 0}
            />
            <section className="rounded-2xl border border-black/[0.07] bg-white p-5">
              <h2 className="text-base font-bold text-ink">Photo principale</h2>
              <p className="mt-0.5 text-[13px] text-[#9CA3AF]">Première image affichée aux clients.</p>
              <div className="mt-4 flex flex-col gap-3">
                <MainPhotoPicker ctl={ctl} />
                <PhotoTip />
              </div>
            </section>
            <GalleryField ctl={ctl} />
          </aside>
        </div>
      </div>

      {/* Barre d'actions fixée en bas */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-8 py-3.5">
          <div className="min-w-0 flex-1 text-[13px]" aria-live="polite">
            {error ? (
              <p className="line-clamp-2 font-medium text-red-700" role="alert">{error}</p>
            ) : maintenanceMode ? (
              <p className="font-medium text-amber-800">Boutique en maintenance : enregistrement suspendu.</p>
            ) : missing.length > 0 ? (
              <p className="text-muted">
                Champs requis : <span className="font-semibold text-ink">{missing.join(", ")}</span>.
              </p>
            ) : (
              <p className="text-muted">
                {form.is_active ? "Le produit sera visible dans votre boutique." : "Le produit restera masqué."}
              </p>
            )}
          </div>
          <Link
            to="/products"
            className="inline-flex shrink-0 items-center justify-center rounded-[10px] border border-black/12 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gray-50"
          >
            Annuler
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#A67C06] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              isEditing ? "Enregistrement..." : "Publication..."
            ) : (
              <>
                <CheckIcon size={16} />
                {isEditing ? "Enregistrer" : "Publier"}
              </>
            )}
          </button>
        </div>
      </div>
    </SellerShell>
  );
}
