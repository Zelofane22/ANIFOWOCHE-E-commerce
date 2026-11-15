import { useState } from "react";
import { useNavigate } from "react-router";
import ProductImage from "../ProductImage.jsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  CheckIcon,
} from "../icons.jsx";
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

const STEPS = ["Photo", "Infos", "Prix & Stock", "Publication"];

/**
 * Vue mobile du formulaire produit : assistant en 4 étapes.
 * Toute la logique (état, validation, envoi) vient de `useProductForm` via `ctl`.
 */
export default function ProductFormMobile({ ctl }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const {
    form,
    isEditing,
    submitting,
    error,
    published,
    maintenanceMode,
    createLimitReached,
    selectedCategory,
    fieldConfig,
    handleSubmit,
  } = ctl;

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) return ctl.infoValid;
    if (step === 2) return ctl.priceValid;
    return true;
  };

  const renderStepPhoto = () => (
    <div className="flex flex-col gap-4">
      <MainPhotoPicker ctl={ctl} />
      <PhotoTip />
      <GalleryField ctl={ctl} />
    </div>
  );

  const renderStepInfos = () => (
    <div className="flex flex-col gap-4">
      <NameField ctl={ctl} />
      <CategoryField ctl={ctl} />
      <DescriptionField ctl={ctl} />
    </div>
  );

  const renderStepPriceStock = () => (
    <div className="flex flex-col gap-4">
      <PriceField ctl={ctl} />
      <StockField ctl={ctl} />
      <UnitField ctl={ctl} />
      <SizeField ctl={ctl} />
      <ColorsField ctl={ctl} />
      <VisibilityToggle ctl={ctl} />
    </div>
  );

  const renderStepPublication = () => {
    if (published) {
      return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "#DCFCE7" }}
          >
            <CheckIcon size={32} style={{ color: "#16A34A" }} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: "#111827" }}>
            {isEditing ? "Produit mis à jour !" : "Produit publié !"}
          </h3>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Votre produit est maintenant {form.is_active ? "visible" : "masqué"} dans votre
            boutique.
          </p>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mt-2 rounded-[10px] bg-[#C99F08] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#A67C06]"
          >
            Voir mes produits
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold" style={{ color: "#111827" }}>
          Récapitulatif
        </h3>

        <div
          className="flex items-center gap-4 rounded-[16px] border border-black/[0.05] bg-white p-4"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-[#F3F4F6]">
            {form.imagePreview ? (
              <ProductImage
                src={form.imagePreview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon size={20} style={{ color: "#9CA3AF" }} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" style={{ color: "#111827" }}>
              {form.name || "Sans nom"}
            </p>
            <p className="mt-0.5 text-sm font-semibold" style={{ color: "#C99F08" }}>
              {form.price_xof ? `${parseInt(form.price_xof, 10).toLocaleString("fr-FR")} XOF` : " Prix non défini"}
            </p>
            <div className="mt-1">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: form.is_active ? "#DCFCE7" : "#F3F4F6",
                  color: form.is_active ? "#16A34A" : "#9CA3AF",
                }}
              >
                {form.is_active ? "Actif" : "Masqué"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-[16px] border border-black/[0.05] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#6B7280" }}>
              Catégorie
            </span>
            <span className="text-sm font-medium" style={{ color: "#111827" }}>
              {selectedCategory?.name || "Non sélectionnée"}
            </span>
          </div>
          {fieldConfig.stock && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#6B7280" }}>
                Stock
              </span>
              <span className="text-sm font-medium" style={{ color: "#111827" }}>
                {form.stock || "0"}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#6B7280" }}>
              Visibilité
            </span>
            <span className="text-sm font-medium" style={{ color: form.is_active ? "#16A34A" : "#9CA3AF" }}>
              {form.is_active ? "Visible" : "Masqué"}
            </span>
          </div>
          {form.colors.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#6B7280" }}>
                Couleurs
              </span>
              <span className="text-sm font-medium" style={{ color: "#111827" }}>
                {form.colors.length}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <LimitNotice ctl={ctl} />
      </div>
    );
  };

  const stepContent = [renderStepPhoto, renderStepInfos, renderStepPriceStock, renderStepPublication];

  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#F4F4F8" }}>
      {maintenanceMode && <MaintenanceAlert className="mx-4 mt-3" />}

      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b px-4 py-3"
        style={{ backgroundColor: "white", borderColor: "rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-3">
          {step > 0 && !published && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              aria-label="Étape précédente"
              className="flex h-8 w-8 items-center justify-center rounded-full transition"
              style={{ color: "#111827" }}
            >
              <ChevronLeftIcon size={20} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-base font-bold" style={{ color: "#111827" }}>
              {isEditing ? "Modifier le produit" : "Nouveau produit"}
            </h1>
          </div>
          {step > 0 && !published && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#FEF9E7", color: "#C99F08" }}
            >
              {step + 1}/{STEPS.length}
            </span>
          )}
        </div>
      </div>

      {/* Step indicator dots */}
      {!published && (
        <div className="flex items-center justify-center gap-2 px-4 pt-4 pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition"
                style={{
                  backgroundColor: i <= step ? "#C99F08" : "#E5E7EB",
                  color: i <= step ? "white" : "#9CA3AF",
                }}
              >
                {i < step ? <CheckIcon size={12} /> : i + 1}
              </div>
              <span
                className="text-[11px] font-medium"
                style={{
                  color: i === step ? "#111827" : "#9CA3AF",
                  display: "none",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Step title */}
      {!published && (
        <div className="px-4 pt-2 pb-3">
          <h2 className="text-lg font-bold" style={{ color: "#111827" }}>
            {STEPS[step]}
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
            {step === 0 && "Photo principale du produit"}
            {step === 1 && "Décrivez votre produit"}
            {step === 2 && "Définissez le prix et la disponibilité"}
            {step === 3 && "Vérifiez et publiez"}
          </p>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {stepContent[step]()}
      </div>

      {/* Sticky bottom CTA */}
      {!published && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3"
          style={{ backgroundColor: "white", borderColor: "rgba(0,0,0,0.06)" }}
        >
          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center justify-center gap-1.5 rounded-[10px] border px-4 py-3 text-sm font-semibold transition"
                style={{
                  borderColor: "rgba(0,0,0,0.12)",
                  color: "#111827",
                }}
              >
                <ChevronLeftIcon size={16} />
                Retour
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (step < STEPS.length - 1) {
                  setStep((s) => s + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={
                submitting ||
                maintenanceMode ||
                !canContinue() ||
                (step === STEPS.length - 1 && createLimitReached)
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-[10px] py-3 text-sm font-bold text-white transition disabled:opacity-60"
              style={{
                backgroundColor: submitting ? "#A67C06" : "#C99F08",
              }}
            >
              {step < STEPS.length - 1 ? (
                <>
                  Continuer
                  <ChevronRightIcon size={16} />
                </>
              ) : submitting ? (
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
      )}
    </div>
  );
}
