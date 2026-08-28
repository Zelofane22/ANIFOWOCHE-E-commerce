import { formatXof } from "../../utils/format.js";

export default function ProductInfo({ product, badge, selectedColor, optionErrors, onColorChange, onOptionToggle, isOptionSelected, quantity, setQuantity, unit, isRestaurantProduct }) {
  const isFabric = unit === "metre";
  const displayUnit = isFabric ? "mètre" : unit;
  const displayBadge = isFabric ? "Meilleure vente" : badge;

  const selectedColorData = selectedColor
    ? product.colors?.find((c) => c.name === selectedColor)
    : null;
  const currentStock = selectedColorData ? (selectedColorData.stock ?? 0) : (product.stock ?? 0);
  const madeToOrder = Boolean(product.made_to_order);

  return (
    <div className="flex flex-col">
      {displayBadge && (
        <span className="mb-2 w-fit rounded-full border border-brand/30 bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
          {displayBadge}
        </span>
      )}
      <h1 className="text-xl font-bold leading-snug text-ink md:text-3xl lg:text-2xl">{product.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-black/10 pb-4">
        {product.review_count > 0 ? (
          <>
            <span className="text-sm tracking-[1px] text-brand" aria-hidden="true">★</span>
            <span className="text-sm font-semibold text-brand-dark">{Number(product.rating_average).toFixed(1)}</span>
            <span className="text-sm text-muted">{product.review_count} avis</span>
          </>
        ) : (
          <span className="text-sm text-muted">Aucun avis pour le moment</span>
        )}
      </div>

      {product.seller_name && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
          </svg>
          Vendu par <span className="font-medium text-ink">{product.seller_name}</span>
        </div>
      )}

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline gap-3">
          {product.discount_percent > 0 ? (
            <>
              <p className="text-3xl font-bold text-red-600">{formatXof(product.discounted_price_xof)}</p>
              <p className="text-lg text-muted line-through">{formatXof(product.price_xof)}</p>
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">-{product.discount_percent}%</span>
            </>
          ) : (
            <p className="text-3xl font-bold text-ink">{formatXof(product.price_xof)}</p>
          )}
          {displayUnit && <span className="text-sm text-muted">/ {displayUnit}</span>}
        </div>
        {product.size && product.size !== "UNIQUE" && (
          <p className="mt-2 text-sm text-ink">Taille : <span className="font-semibold">{product.size}</span></p>
        )}

        {product.colors && product.colors.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-sm font-semibold text-ink">
              Couleur{selectedColor ? ` : ${selectedColor}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => {
                const colorStock = color.stock ?? 0;
                const isSelected = selectedColor === color.name;
                const isOutOfStock = colorStock <= 0;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => onColorChange(isSelected ? null : color.name)}
                    disabled={isOutOfStock}
                    title={`${color.name}${isOutOfStock ? " (rupture)" : ` — ${colorStock} en stock`}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? "border-brand bg-brand-light text-brand-dark"
                        : "border-black/10 bg-white text-ink hover:border-black/25"
                    } ${isOutOfStock ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {product.option_groups && product.option_groups.length > 0 && (
          <div className="mt-5 space-y-4">
            {product.option_groups.map((group) => (
              <div key={group.id}>
                <p className="mb-2 text-sm font-semibold text-ink">
                  {group.name}
                  {group.is_required && !isRestaurantProduct && (
                    <span className="ml-1.5 text-[10px] font-normal text-red-500">Obligatoire</span>
                  )}
                  {group.max_selections > 1 && (
                    <span className="ml-1.5 text-[10px] font-normal text-muted">
                      ({group.min_selections || 0}-{group.max_selections || "∞"} choix)
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const selected = isOptionSelected(group.id, opt.id);
                    const isRadio = group.max_selections === 1;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onOptionToggle(group.id, opt.id, group.max_selections)}
                        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition ${
                          selected
                            ? "border-brand bg-brand-light text-brand-dark"
                            : "border-black/10 bg-white text-ink hover:border-black/25"
                        }`}
                      >
                        {isRadio ? (
                          <span
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                              selected ? "border-brand" : "border-black/20"
                            }`}
                          >
                            {selected && <span className="h-2 w-2 rounded-full bg-brand" />}
                          </span>
                        ) : (
                          <span
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                              selected ? "border-brand bg-brand" : "border-black/20"
                            }`}
                          >
                            {selected && (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                              </svg>
                            )}
                          </span>
                        )}
                        {opt.name}
                        {opt.price_xof > 0 && (
                          <span className="text-muted">+{formatXof(opt.price_xof)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {optionErrors[group.id] && (
                  <p className="mt-2 text-sm text-red-600" role="alert">{optionErrors[group.id]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {displayUnit && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-ink">Quantité ({displayUnit}s)</p>
            <input
              type="number"
              min="1"
              max={madeToOrder ? undefined : currentStock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border border-black/15 px-4 py-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/15 sm:w-auto"
              required
            />
          </div>
        )}

        <div className="mt-5 rounded-[10px] bg-surface p-4">
          <p className="text-sm font-semibold text-ink">Description</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {product.description || "Description"}
          </p>
        </div>

        {!displayUnit && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-ink">Quantité</p>
            <input
              type="number"
              min="1"
              max={madeToOrder ? undefined : currentStock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border border-black/15 px-4 py-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/15"
              required
            />
          </div>
        )}
      </div>
    </div>
  );
}
