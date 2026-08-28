import { validateCoupon } from "../../api/promotions.js";
import { extractErrorMessage } from "../../utils/apiError.js";
import { formatXof } from "../../utils/format.js";
import ProductImage from "../ProductImage.jsx";

function ItemRow({ item }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-brand-pale">
        {item.image && <ProductImage src={item.image} alt={item.name} className="h-full w-full object-cover" />}
        <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-charcoal px-1 text-[10px] font-bold text-white">
          {item.quantity}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{item.name}</p>
        {item.size && item.size !== "UNIQUE" && <p className="text-xs text-muted">Taille {item.size}</p>}
        {item.colorName && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border border-black/10"
              style={{ backgroundColor: item.colorHex }}
            />
            {item.colorName}
          </p>
        )}
        {item.selectedOptions && item.selectedOptions.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {item.selectedOptions.map((opt) => (
              <p key={opt.option_id} className="text-[10px] text-muted">
                {opt.group_name} : {opt.option_name}
                {opt.price_xof > 0 && <span className="text-muted"> +{formatXof(opt.price_xof)}</span>}
              </p>
            ))}
          </div>
        )}
      </div>
      <span className="shrink-0 text-sm font-semibold text-ink">
        {formatXof(item.price_xof * item.quantity)}
      </span>
    </div>
  );
}

export default function CheckoutSummary({
  items,
  subtotal,
  appliedCoupon,
  setAppliedCoupon,
  couponCode,
  setCouponCode,
  couponError,
  setCouponError,
  validatingCoupon,
  setValidatingCoupon,
  showCouponField,
  setShowCouponField,
  deliveryFee,
  discountAmount,
  total,
  hasDeliveryItems = true,
  deliveryItems,
  pickupItems,
}) {
  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponError(null);
    setValidatingCoupon(true);
    try {
      const result = await validateCoupon(code);
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(extractErrorMessage(err));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  const useGrouped = deliveryItems && pickupItems;

  return (
    <aside>
      <div className="sticky top-24 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-ink">Votre commande</h2>

        {useGrouped ? (
          <>
            {deliveryItems.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-brand-dark flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  </svg>
                  À livrer ({deliveryItems.length})
                </h3>
                {deliveryItems.map((item) => (
                  <ItemRow key={`${item.slug}-${item.colorName || ""}-delivery`} item={item} />
                ))}
              </div>
            )}
            {pickupItems.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  À retirer chez le vendeur ({pickupItems.length})
                </h3>
                {pickupItems.map((item) => (
                  <ItemRow key={`${item.slug}-${item.colorName || ""}-pickup`} item={item} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <ItemRow key={item.slug} item={item} />
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-black/10 pt-4">
          {appliedCoupon ? (
            <div className="flex items-center justify-between gap-2">
              <p aria-live="polite" className="text-xs font-medium text-green-700">
                Code « {appliedCoupon.code} » appliqué (-{appliedCoupon.discount_percent}%)
              </p>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="shrink-0 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold text-ink transition hover:border-red-300 hover:text-red-600"
              >
                Retirer
              </button>
            </div>
          ) : showCouponField ? (
            <>
              <label className="block text-xs font-semibold text-ink">Code promo</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Code coupon"
                  className="min-w-0 flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm uppercase placeholder:text-gray-400 placeholder:normal-case focus:border-brand"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || validatingCoupon}
                  className="shrink-0 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
                >
                  {validatingCoupon ? "…" : "Appliquer"}
                </button>
              </div>
              {couponError && (
                <p role="alert" className="mt-1.5 text-xs text-red-600">
                  {couponError}
                </p>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowCouponField(true)}
              className="text-xs font-semibold text-brand-dark hover:underline"
            >
              Vous avez un code promo ?
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Sous-total</span>
            <span className="text-ink">{formatXof(subtotal)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-green-700">
              <span>Réduction ({appliedCoupon.discount_percent}%)</span>
              <span>-{formatXof(discountAmount)}</span>
            </div>
          )}
          {hasDeliveryItems && (
            <div className="flex justify-between text-muted">
              <span>Livraison</span>
              {deliveryFee > 0 ? (
                <span className="text-ink">{formatXof(deliveryFee)}</span>
              ) : (
                <span className="font-medium text-green-700">Gratuite</span>
              )}
            </div>
          )}
          <div className="flex justify-between border-t border-black/10 pt-3 text-base font-bold text-ink">
            <span>Total</span>
            <span>{formatXof(total)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
