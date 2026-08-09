import { Link, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  PackageIcon,
  SettingsIcon,
  StoreIcon,
  TruckIcon,
} from "../icons.jsx";
import { useAuth } from "../../context/useAuth.js";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", Icon: LayoutDashboardIcon },
  { to: "/orders", label: "Commandes", Icon: TruckIcon },
  { to: "/products", label: "Produits", Icon: PackageIcon },
  { to: "/settings", label: "Paramètres", Icon: SettingsIcon },
];

function SellerMobileTabBar() {
  return (
    <nav
      aria-label="Navigation vendeur"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white lg:hidden"
      style={{ paddingBottom: "var(--tabbar-safe)" }}
    >
      <div className="mx-auto flex h-[var(--tabbar-h)] max-w-lg items-stretch">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold text-muted transition active:scale-95"
            style={({ isActive }) => (isActive ? { color: "var(--color-brand)" } : undefined)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function SellerShell({ children, title, seller }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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
              onClick={handleLogout}
              aria-label="Se déconnecter"
              className="rounded-lg p-2 text-muted transition hover:bg-gray-100 hover:text-ink"
            >
              <LogOutIcon size={19} />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(var(--tabbar-h)+var(--tabbar-safe)+1.5rem)] lg:pb-6 sm:px-6">{children}</main>
      </div>

      <SellerMobileTabBar />
    </div>
  );
}
