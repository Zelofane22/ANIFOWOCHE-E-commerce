import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/useAuth.js";
import { useCart } from "../context/useCart.js";
import { ADMIN_URL } from "../utils/adminUrl.js";

const NAV_LINKS = [
  { to: "/catalogue", label: "Catalogue" },
  { to: "/compte", label: "Compte" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/catalogue?search=${encodeURIComponent(query)}` : "/catalogue");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-charcoal text-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="-ml-1 rounded-lg p-2 text-white transition hover:bg-white/10 md:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="block overflow-hidden rounded-md transition hover:ring-2 hover:ring-brand/70">
            <img
              src="/anifowoche-logo.png"
              alt="ANIFOWOCHE"
              className="h-11 w-36 object-cover object-center sm:w-40"
            />
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden flex-1 items-stretch overflow-hidden rounded-lg border-2 border-brand bg-white md:flex">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un tissu, vêtement, accessoire..."
            className="min-w-0 flex-1 px-4 py-2 text-sm text-ink outline-none"
          />
          <button type="submit" aria-label="Rechercher" className="bg-brand px-4 text-white transition hover:bg-brand-medium">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </form>

        <div className="hidden items-center gap-5 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-white/85 transition hover:text-brand">
              {link.label}
            </Link>
          ))}
          {user?.is_staff && (
            <a href={ADMIN_URL} className="text-white/85 transition hover:text-brand">
              Admin
            </a>
          )}
        </div>

        <div className="ml-auto flex items-center">
          <Link to="/panier" aria-label="Panier" className="relative flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-white transition hover:border-brand hover:text-brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h8.2a2 2 0 0 0 2-1.6L21 8H6" />
              <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <span className="hidden text-sm font-semibold sm:inline">Panier</span>
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      <div className="hidden bg-coal px-4 md:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-1 text-sm">
          {["Tissus", "Vêtements", "Accessoires"].map((label) => (
            <Link
              key={label}
              to="/catalogue"
              className="rounded px-3 py-1.5 text-white/85 transition hover:bg-white/10 hover:text-brand"
            >
              {label}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-white/70">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3zM14 11h4l3 3v3h-7z" />
              <circle cx="7" cy="19" r="1.5" />
              <circle cx="18" cy="19" r="1.5" />
            </svg>
            Livraison Cotonou
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-charcoal px-4 py-4 md:hidden">
          <form onSubmit={handleSearch} className="mb-4 flex overflow-hidden rounded-lg border-2 border-brand bg-white">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher..."
              className="min-w-0 flex-1 px-4 py-2.5 text-sm text-ink outline-none"
            />
            <button type="submit" aria-label="Rechercher" className="bg-brand px-4 text-white">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>
          <div className="flex flex-col gap-1 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="border-b border-white/10 py-2.5 text-white transition hover:text-brand">
                {link.label}
              </Link>
            ))}
            {user?.is_staff && (
              <a href={ADMIN_URL} className="border-b border-white/10 py-2.5 text-white transition hover:text-brand">
                Admin
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
