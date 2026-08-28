import ProductImage from "../ProductImage.jsx";

export default function ProductGallery({ images, selectedColor, activeImageIndex, onImageChange }) {
  const galleryImages = [
    ...(images?.cover ? [{ id: "cover", image: images.cover, color_name: "" }] : []),
    ...(images?.gallery ?? []),
  ];

  const filteredGalleryImages = selectedColor
    ? galleryImages.filter((img) => !img.color_name || img.color_name === selectedColor)
    : galleryImages;

  const displayImages = filteredGalleryImages.length > 0 ? filteredGalleryImages : galleryImages;
  const hasGallery = displayImages.length > 1;
  const currentImage = displayImages[activeImageIndex] ?? displayImages[0];

  const showPreviousImage = () => {
    onImageChange((index) => (index - 1 + displayImages.length) % displayImages.length);
  };

  const showNextImage = () => {
    onImageChange((index) => (index + 1) % displayImages.length);
  };

  return (
    <div className="flex gap-3">
      <div className="no-scrollbar hidden max-h-[32rem] flex-col gap-2 overflow-y-auto sm:flex">
        {displayImages.length > 0 ? (
          displayImages.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onImageChange(index)}
              aria-label={"Afficher l'image " + (index + 1)}
              aria-current={index === activeImageIndex ? "true" : undefined}
              className={"h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 bg-brand-pale transition " + (index === activeImageIndex ? "border-brand" : "border-transparent hover:border-brand/50")}
            >
              <ProductImage src={img.image} alt="" className="h-full w-full object-cover" />
            </button>
          ))
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-brand bg-brand-pale text-[10px] font-bold text-brand-dark">
            ANI
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-pale">
          {currentImage ? (
            <ProductImage
              src={currentImage.image}
              alt={currentImage.alt_text || ""}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-brand-dark">
              ANIFOWOCHE
            </div>
          )}
          {hasGallery && (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                aria-label="Image précédente"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white"
                aria-label="Image suivante"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </div>
        {hasGallery && (
          <div className="mt-2 flex justify-center gap-1.5 sm:hidden">
            {displayImages.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onImageChange(index)}
                aria-label={`Aller à l'image ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  index === activeImageIndex ? "w-4 bg-brand" : "w-2 bg-black/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
