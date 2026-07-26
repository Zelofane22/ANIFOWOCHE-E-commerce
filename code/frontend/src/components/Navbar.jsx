import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { fetchCategories } from "../api/products.js";
import { useAuth } from "../context/useAuth.js";
import { useCart } from "../context/useCart.js";
import { useSiteConfig } from "../context/useSiteConfig.js";
import { ADMIN_URL } from "../utils/adminUrl.js";
import { ChevronDownIcon, MenuIcon, UserIcon } from "./icons.jsx";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const { itemCount } = useCart();
  const { user } = useAuth();
  const { theme } = useSiteConfig();
  const navigate = useNavigate();

  // Logo et nom du site pilotables depuis la config, avec fallback en dur.
  const logoSrc = theme?.logo || "/anifowoche-logo.png";
  const siteName = theme?.site_name || "ANIFOWOCHE";

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories((data.results ?? data).slice(0, 4)))
      .catch(() => {});
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/catalogue?search=${encodeURIComponent(query)}` : "/catalogue");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-charcoal text-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="-ml-1 rounded-lg p-2 text-white transition hover:bg-white/10 md:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon size={24} />
          </button>
          <Link to="/" className="flex items-center justify-between gap-3 overflow-hidden transition">
            <img
              src={logoSrc}
              alt={siteName}
              className="h-11 w-36 object-cover object-center sm:w-40"
            />
            <span className="flex-shrink-0 text-lg font-bold tracking-tight text-white transition-colors hover:text-brand">
              {siteName}
            </span>
          </Link>
        </div>

        <form
          onSubmit={handleSearch}
          className="hidden flex-1 items-stretch overflow-hidden rounded-lg border-2 border-brand bg-white md:flex"
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un tissu, vêtement, accessoire..."
            className="min-w-0 flex-1 px-4 py-2 text-sm text-ink outline-none"
          />
          <button
            type="submit"
            aria-label="Rechercher"
            className="bg-brand px-4 text-white transition hover:bg-brand-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {user?.is_staff && (
            <a href={ADMIN_URL} className="hidden text-sm font-medium text-white/85 transition hover:text-brand md:block">
              Admin
            </a>
          )}

          {/* Compte : Bonjour, {nom} / Compte et listes */}
          <Link
            to="/compte"
            className="group hidden items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-white transition hover:border-brand hover:text-brand md:flex"
          >
            <UserIcon size={18} />
            <span className="text-left">
              <span className="block text-[10px] leading-none text-white/60 transition group-hover:text-brand/80">
                Bonjour, {user ? user.username : "identifiez-vous"}
              </span>
              <span className="mt-0.5 block text-xs font-semibold leading-none">Compte et listes</span>
            </span>
            <ChevronDownIcon size={12} />
          </Link>

          <Link
            to="/panier"
            aria-label="Panier"
            className="relative flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-white transition hover:border-brand hover:text-brand"
          >
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
          <Link
            to="/seller"
            className="flex items-center gap-1.5 rounded bg-brand px-4 py-1.5 font-semibold text-white transition hover:bg-brand-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Vendre
          </Link>
          <div className="mx-1 h-5 w-px bg-white/20" />
          <Link
            to="/catalogue"
            className="flex items-center gap-1.5 rounded px-3 py-1.5 font-medium text-white transition hover:bg-white/10 hover:text-brand"
          >
            <MenuIcon size={16} />
            Toutes les catégories
          </Link>
          <Link
            to="/commande/public"
            className="rounded px-3 py-1.5 font-medium text-white transition hover:bg-white/10 hover:text-brand"
          >
            Commander
          </Link>
          {categories.length > 0 && <div className="mx-1 h-5 w-px bg-white/20" />}
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/catalogue?category=${encodeURIComponent(category.slug)}`}
              className="rounded px-3 py-1.5 text-white/85 transition hover:bg-white/10 hover:text-brand"
            >
              {category.name}
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
            <Link
              to="/seller"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 border-b border-white/10 bg-brand px-3 py-3 font-bold text-white transition hover:bg-brand-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Vendre
            </Link>
            <Link
              to="/compte"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 border-b border-white/10 py-2.5 font-semibold text-white transition hover:text-brand"
            >
              <UserIcon size={15} />
              {user ? `Mon compte (${user.username})` : "Mon compte"}
            </Link>
            <Link
              to="/catalogue"
              onClick={() => setMenuOpen(false)}
              className="border-b border-white/10 py-2.5 text-white transition hover:text-brand"
            >
              Catalogue
            </Link>
            <Link
              to="/commande/public"
              onClick={() => setMenuOpen(false)}
              className="border-b border-white/10 py-2.5 text-white transition hover:text-brand"
            >
              Commander
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/catalogue?category=${encodeURIComponent(category.slug)}`}
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/10 py-2.5 text-white transition hover:text-brand"
              >
                {category.name}
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
