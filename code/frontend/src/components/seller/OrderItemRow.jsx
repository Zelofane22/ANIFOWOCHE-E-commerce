import { formatXof } from "../../utils/format.js";
import ProductImage from "../../components/ProductImage.jsx";
import { PackageIcon } from "../../components/icons.jsx";

export default function OrderItemRow({ item }) {
  return (
    <div className="flex gap-3">
      <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#F3F4F6] flex-shrink-0 flex items-center justify-center">
        {item.product_image ? (
          <ProductImage src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
        ) : (
          <PackageIcon size={20} className="text-[#9CA3AF]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#111827] leading-snug">{item.product_name}</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">Qte : {item.quantity}</p>
        <p className="font-bold text-[#111827] mt-1">{formatXof(item.unit_price_xof)}</p>
      </div>
    </div>
  );
}
