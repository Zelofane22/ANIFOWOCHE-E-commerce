import { Link } from "react-router";

export default function Home() {
  return (
    <section className="text-center py-16">
      <h1 className="text-3xl font-bold">Tissus, vêtements & accessoires homme</h1>
      <p className="mt-2 text-gray-600">Livraison à domicile sur Cotonou.</p>
      <Link
        to="/catalogue"
        className="mt-6 inline-block rounded bg-gray-900 px-5 py-2 text-white"
      >
        Voir le catalogue
      </Link>
    </section>
  );
}
