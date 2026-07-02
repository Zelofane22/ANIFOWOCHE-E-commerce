import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        const products = data.results ?? data;
        setTopProducts(products.slice(0, 8));
      })
      .catch(() => setTopProducts([]));
  }, []);

  return (
    <div>
      <section className="relative min-h-[430px] overflow-hidden bg-charcoal">
        <img
          src="https://images.unsplash.com/photo-1768212565426-58b089b6386d?w=1600&h=900&fit=crop&auto=format"
          alt="Tissus africains colorés"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-center px-4 py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">Collection Cotonou</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-6xl">
              Tissus, vêtements & accessoires homme
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              Des pièces sélectionnées pour le quotidien, les cérémonies et les sorties, avec paiement mobile money et livraison à domicile sur Cotonou.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-medium"
              >
                Voir le catalogue
              </Link>
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center rounded-lg border border-white/25 px-6 py-3 font-semibold text-white transition hover:border-brand hover:text-brand"
              >
                Nouveautés
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-3 border-b border-black/10 py-4 text-sm font-medium text-ink sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Livraison sous 48h",
            "Paiement MTN, Moov, Visa",
            "Produits vérifiés",
            "Support WhatsApp",
          ].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-brand-dark">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                </svg>
              </span>
              {label}
            </div>
          ))}
        </div>

        <section className="py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink">Acheter par catégorie</h2>
              <div className="mt-1 h-0.5 w-12 rounded-full bg-brand" />
            </div>
            <Link to="/catalogue" className="text-sm font-semibold text-brand-dark hover:underline">
              Tout voir
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Tissus",
                desc: "Wax, bazin, googluck",
                image: "https://images.unsplash.com/photo-1552710307-537199cd41c0?w=700&h=520&fit=crop&auto=format",
              },
              {
                title: "Vêtements",
                desc: "Chemises, pantalons, dessous",
                image: "https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=700&h=520&fit=crop&auto=format",
              },
              {
                title: "Accessoires",
                desc: "Montres, ceintures, chaussures",
                image: "https://images.unsplash.com/photo-1534413340928-7bd74b65196f?w=700&h=520&fit=crop&auto=format",
              },
            ].map((category) => (
              <Link
                key={category.title}
                to="/catalogue"
                className="group relative min-h-56 overflow-hidden rounded-lg bg-charcoal"
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-xl font-bold text-white">{category.title}</h3>
                  <p className="mt-1 text-sm text-white/75">{category.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {topProducts.length > 0 && (
          <section className="py-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">Top produits</h2>
                <div className="mt-1 h-0.5 w-12 rounded-full bg-brand" />
              </div>
              <Link to="/catalogue" className="text-sm font-semibold text-brand-dark hover:underline">
                Tout voir
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {topProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
