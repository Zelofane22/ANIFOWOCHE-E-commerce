import ProductCard from "../ProductCard.jsx";

export default function RelatedProducts({ products }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-10 border-t border-black/10 pt-8">
      <h2 className="text-lg font-bold text-ink mb-6">Produits similaires</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
