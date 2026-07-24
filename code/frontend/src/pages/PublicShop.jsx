import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getPublicShop } from "../api/seller.js";
import { PackageIcon, StoreIcon } from "../components/icons.jsx";

export default function PublicShop() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getPublicShop(slug)
      .then(setShop)
      .catch(() => setNotFound(true));
  }, [slug]);

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
        <section className="mt-5 rounded-xl border border-dashed border-black/15 bg-white p-8 text-center">
          <PackageIcon size={36} className="mx-auto text-muted" />
          <h2 className="mt-3 text-base font-bold text-ink">Les produits arrivent bientôt</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-muted">
            Cette boutique est prête. Le catalogue sera publié pendant le Sprint 2.
          </p>
        </section>
      </main>
    </div>
  );
}
