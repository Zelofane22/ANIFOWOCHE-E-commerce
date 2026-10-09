import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getPublicShops } from "../api/seller.js";
import Seo from "../components/Seo.jsx";
import { StoreIcon } from "../components/icons.jsx";

export default function SellersDirectory() {
  const [shops, setShops] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPublicShops()
      .then((data) => setShops(data.results ?? data))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo title="Nos vendeurs" description="Découvrez les boutiques et vendeurs ANIFOWOCHE." path="/sellers" type="website" />

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">Nos vendeurs</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Parcourez les boutiques de nos vendeurs et retrouvez leurs articles directement sur ANIFOWOCHE.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          Impossible de charger les vendeurs pour le moment.
        </p>
      )}

      {!error && shops === null && (
        <p className="py-10 text-center text-muted">Chargement…</p>
      )}

      {shops?.length === 0 && (
        <div className="rounded-xl border border-dashed border-black/15 bg-white p-10 text-center">
          <StoreIcon size={36} className="mx-auto text-muted" />
          <p className="mt-3 font-semibold text-ink">Aucun vendeur disponible pour le moment</p>
        </div>
      )}

      {shops?.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              to={`/sellers/${shop.slug}`}
              className="group flex flex-col rounded-xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-brand-light text-brand-dark">
                {shop.image ? (
                  <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <StoreIcon size={24} />
                )}
              </div>
              <h2 className="font-bold text-ink group-hover:text-brand-dark">{shop.name}</h2>
              {shop.city && <p className="mt-0.5 text-xs text-muted">{shop.city}</p>}
              {shop.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{shop.description}</p>
              )}
              <p className="mt-auto pt-3 text-xs font-semibold text-brand-dark">
                {shop.product_count ?? 0} article{(shop.product_count ?? 0) > 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
