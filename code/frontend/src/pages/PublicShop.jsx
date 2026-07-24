import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { getPublicShop } from "../api/seller.js";
import { PackageIcon, StoreIcon } from "../components/icons.jsx";
import { formatXof } from "../utils/format.js";
import { optimizedImage } from "../utils/imageUrl.js";

export default function PublicShop() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    getPublicShop(slug)
      .then(setShop)
      .catch(() => setNotFound(true));
  }, [slug]);

  const products = shop?.products ?? [];
  const categories = useMemo(() => {
    const bySlug = new Map();
    products.forEach((product) => {
      if (product.category?.slug) bySlug.set(product.category.slug, product.category);
    });
    return Array.from(bySlug.values());
  }, [products]);
  const visibleProducts =
    activeCategory === "all"
      ? products
      : products.filter((product) => product.category?.slug === activeCategory);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center">
        <StoreIcon size={34} className="mx-auto text-muted" />
        <h1 className="mt-4 text-xl font-bold text-ink">Boutique introuvable</h1>
        <Link to="/seller/register" className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white">
          Créer une boutique
        </Link>
      </div>
    );
  }

  if (!shop) return <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center text-muted">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-ink">
      <header className="border-b border-black/10 bg-white px-4 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
              <StoreIcon size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink">{shop.name}</h1>
              {shop.city && <p className="text-sm text-muted">{shop.city}</p>}
            </div>
          </div>
          <a
            href={`https://wa.me/${shop.whatsapp_phone.replace("+", "")}`}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-medium"
          >
            WhatsApp
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="rounded-xl border border-black/10 bg-white p-6">
          <p className="text-sm font-semibold text-brand-dark">Boutique publique</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">{shop.name}</h2>
          {shop.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{shop.description}</p>}
        </section>
        <section className="mt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Produits disponibles</h2>
              <p className="mt-1 text-sm text-muted">
                {products.length} article{products.length > 1 ? "s" : ""} publié{products.length > 1 ? "s" : ""}
              </p>
            </div>
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
                    activeCategory === "all"
                      ? "border-brand bg-brand text-white"
                      : "border-black/15 bg-white text-ink hover:border-brand hover:text-brand-dark"
                  }`}
                >
                  Tout
                </button>
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => setActiveCategory(category.slug)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
                      activeCategory === category.slug
                        ? "border-brand bg-brand text-white"
                        : "border-black/15 bg-white text-ink hover:border-brand hover:text-brand-dark"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-black/15 bg-white p-8 text-center">
              <PackageIcon size={36} className="mx-auto text-muted" />
              <h2 className="mt-3 text-base font-bold text-ink">Aucun produit publié</h2>
              <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-muted">
                La boutique est en ligne. Les produits apparaîtront ici dès leur publication.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/produits/${product.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-square bg-brand-pale">
                    {product.image ? (
                      <img
                        src={optimizedImage(product.image, 360)}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-dark">
                        {shop.name}
                      </div>
                    )}
                    {product.stock <= 0 && (
                      <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                        Rupture
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-xs font-semibold text-brand-dark">{product.category?.name}</p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-ink">
                      {product.name}
                    </h3>
                    <p className="mt-auto pt-3 text-base font-bold text-ink">{formatXof(product.price_xof)}</p>
                    <span className="mt-3 inline-flex items-center justify-center rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white transition group-hover:bg-brand-medium">
                      Voir le produit
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
