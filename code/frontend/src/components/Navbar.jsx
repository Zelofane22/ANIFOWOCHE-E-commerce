import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <Link to="/" className="text-lg font-bold">
        ANIFOWOCHE
      </Link>
      <div className="flex gap-4 text-sm">
        <Link to="/catalogue">Catalogue</Link>
        <Link to="/commande">Panier</Link>
        <Link to="/compte">Compte</Link>
      </div>
    </nav>
  );
}
