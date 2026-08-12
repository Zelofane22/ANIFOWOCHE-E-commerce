import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  PackageIcon,
  PlusIcon,
  SettingsIcon,
  StoreIcon,
  TruckIcon,
  UserIcon,
} from "../icons.jsx";
import { useAuth } from "../../context/useAuth.js";
import BottomSheet from "../BottomSheet.jsx";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", Icon: LayoutDashboardIcon },
  { to: "/orders", label: "Commandes", Icon: TruckIcon },
  { to: "/products", label: "Produits", Icon: PackageIcon },
  { to: "/settings", label: "Paramètres", Icon: SettingsIcon },
];

const mobileNavItems = [
  navItems[0],
  navItems[1],
  { to: "/products", label: "Ajouter", Icon: PlusIcon, centered: true },
  navItems[2],
  navItems[3],
];

function SellerMobileTabBar() {
  return (
    <nav
      aria-label="Navigation vendeur"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white lg:hidden"
      style={{ paddingBottom: "var(--tabbar-safe)" }}
    >
      <div className="mx-auto flex h-[var(--tabbar-h)] max-w-lg items-stretch">
        {mobileNavItems.map(({ to, label, Icon, centered }) =>
          centered ? (
            <Link
              key={`${to}-${label}`}
              to={to}
              aria-label="Ajouter un produit"
              className="relative flex min-w-0 flex-1 items-center justify-center"
            >
              <span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-medium active:scale-95">
                <PlusIcon size={24} />
              </span>
            </Link>
          ) : (
            <NavLink
              key={to}
              to={to}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold text-muted transition active:scale-95"
              style={({ isActive }) => (isActive ? { color: "var(--color-brand)" } : undefined)}
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}

const getInitials = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "";

export default function SellerShell({ children, title, seller }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = getInitials(seller?.display_name);

  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-black/10 bg-white px-4 py-5 lg:block">
        <Link to="/dashboard" className="flex items-center gap-2 text-base font-bold text-ink">
          <StoreIcon size={21} className="text-brand-dark" />
          ANIF Seller
        </Link>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-brand-light text-brand-dark" : "text-muted hover:bg-gray-100 hover:text-ink"
                }`
              }
            >
              <item.Icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="absolute bottom-5 left-4 right-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-100 hover:text-ink"
        >
          <LogOutIcon size={17} />
          Se déconnecter
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted">{seller?.shop?.name ?? "Boutique vendeur"}</p>
              <h1 className="text-xl font-bold text-ink">{title}</h1>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Ouvrir mon profil"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark transition hover:bg-brand/20"
            >
              {initials || <UserIcon size={18} />}
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(var(--tabbar-h)+var(--tabbar-safe)+1.5rem)] lg:pb-6 sm:px-6">{children}</main>
      </div>

      <SellerMobileTabBar />

      <BottomSheet open={profileOpen} onClose={() => setProfileOpen(false)} title="Mon profil">
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-base font-bold text-brand-dark">
              {initials || <UserIcon size={20} />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{seller?.display_name ?? "Vendeur"}</p>
              <p className="truncate text-xs text-muted">{seller?.shop?.name ?? ""}</p>
            </div>
          </div>
          <dl className="mt-1 grid gap-1.5 text-sm">
            {seller?.phone && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Téléphone</dt>
                <dd className="font-semibold text-ink">{seller.phone}</dd>
              </div>
            )}
            {user?.email && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Email</dt>
                <dd className="min-w-0 truncate font-semibold text-ink">{user.email}</dd>
              </div>
            )}
            {seller?.city && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Ville</dt>
                <dd className="font-semibold text-ink">{seller.city}</dd>
              </div>
            )}
          </dl>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              navigate("/settings");
            }}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
          >
            <SettingsIcon size={15} />
            Paramètres boutique
          </button>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              handleLogout();
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
          >
            <LogOutIcon size={15} />
            Se déconnecter
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
