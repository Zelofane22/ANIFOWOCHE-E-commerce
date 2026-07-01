import { Link } from "react-router";

export default function Home() {
  return (
    <div>
      <div className="rounded-xl bg-brand-light px-4 py-2 text-center text-sm font-medium text-brand-dark">
        Livraison rapide sur tout Cotonou 🚚
      </div>

      <section className="py-16 text-center">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">
          Tissus, vêtements & accessoires homme
        </h1>
        <p className="mt-3 text-muted">Livraison à domicile sur Cotonou.</p>
        <Link
          to="/catalogue"
          className="mt-8 inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-ink transition hover:bg-brand-dark"
        >
          Voir le catalogue
        </Link>
      </section>
    </div>
  );
}
