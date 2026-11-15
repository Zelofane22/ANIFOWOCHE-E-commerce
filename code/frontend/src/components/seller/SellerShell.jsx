import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import {
  BarChartIcon,
  BellIcon,
  HomeIcon,
  LogOutIcon,
  ZapIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  StoreIcon,
  UserIcon,
  MoreHorizontalIcon,
} from "../icons.jsx";
import { useAuth } from "../../context/useAuth.js";
import BottomSheet from "../BottomSheet.jsx";

const navItems = [
  { to: "/dashboard", label: "Accueil", Icon: HomeIcon },
  { to: "/products", label: "Produits", Icon: PackageIcon },
  { to: "/orders", label: "Commandes", Icon: ShoppingBagIcon },
  { to: "/boutique", label: "Boutique", Icon: StoreIcon },
  { to: "/settings", label: "Plus", Icon: MoreHorizontalIcon },
];

// Navigation desktop : pas de menu "Plus", toutes les sections sont accessibles directement.
const desktopSections = [
  {
    title: "Menu",
    items: [
      { to: "/dashboard", label: "Tableau de bord", Icon: HomeIcon },
      { to: "/products", label: "Produits", Icon: PackageIcon },
      { to: "/orders", label: "Commandes", Icon: ShoppingBagIcon, badge: "pending" },
      { to: "/boutique", label: "Boutique", Icon: StoreIcon },
      { to: "/stats", label: "Statistiques", Icon: BarChartIcon },
    ],
  },
  {
    title: "Compte",
    items: [
      { to: "/notifications", label: "Notifications", Icon: BellIcon },
      { to: "/settings", label: "Paramètres", Icon: SettingsIcon },
    ],
  },
];

const PLAN_NAMES = { FREE: "Gratuit", STARTER: "Starter", PRO: "Pro", BUSINESS: "Business" };

function BottomNav({ pendingCount = 0 }) {
  return (
    <nav
      aria-label="Navigation vendeur"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white lg:hidden"
      style={{ paddingBottom: "var(--tabbar-safe)" }}
    >
      <div className="mx-auto flex h-[var(--tabbar-h)] max-w-lg items-stretch">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? "text-brand" : "text-[#9CA3AF]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon size={22} />
                  {label === "Commandes" && pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-semibold leading-none">{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
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

export default function SellerShell({ children, seller, pendingCount = 0, header = null }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = getInitials(seller?.display_name);
  const shopName = seller?.shop?.name ?? seller?.display_name ?? "";
  const plan = seller?.plan;
  const planName = plan ? PLAN_NAMES[plan] ?? plan : "";

  return (
    <div className="min-h-screen bg-[#F4F4F8] text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-black/[0.08] bg-white px-4 pt-5 pb-4 lg:flex">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-3 text-[17px] font-extrabold text-ink">
          <StoreIcon size={20} className="text-brand-dark" />
          ANIF Seller
        </Link>

        <Link
          to="/boutique"
          className="mt-5 flex items-center gap-2.5 rounded-xl bg-[#F4F4F8] p-2.5 transition hover:bg-gray-100"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand text-[13px] font-extrabold text-white">
            {getInitials(shopName) || <StoreIcon size={16} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold text-ink">{shopName || "Ma boutique"}</span>
            {planName && <span className="block text-[11px] font-semibold text-[#9CA3AF]">Plan {planName}</span>}
          </span>
        </Link>

        <nav aria-label="Navigation vendeur" className="mt-2 flex-1 overflow-y-auto">
          {desktopSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 pt-5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                {section.title}
              </p>
              <div className="grid gap-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition ${
                        isActive
                          ? "bg-brand-light font-bold text-brand-dark"
                          : "font-semibold text-muted hover:bg-gray-100 hover:text-ink"
                      }`
                    }
                  >
                    <item.Icon size={19} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge === "pending" && pendingCount > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                        {pendingCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {plan === "FREE" && (
          <div className="mt-4 rounded-2xl bg-[#111827] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <ZapIcon size={16} className="text-brand" />
              Passez à une offre supérieure
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">
              Plus de produits, plus de commandes et une meilleure visibilité.
            </p>
            <Link
              to="/plan"
              className="mt-3 flex items-center justify-center rounded-[10px] bg-brand px-3 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Voir les offres
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-100 hover:text-ink"
        >
          <LogOutIcon size={19} />
          Se déconnecter
        </button>
      </aside>

      <div className="lg:pl-64">
        {header && (
          <header className="sticky top-0 z-30 hidden border-b border-black/[0.06] bg-white/95 backdrop-blur lg:block">
            <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-8 py-4">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[22px] font-extrabold leading-tight text-ink">{header.title}</h1>
                {header.subtitle && <p className="mt-0.5 truncate text-[13px] font-medium text-muted">{header.subtitle}</p>}
              </div>
              {header.actions}
            </div>
          </header>
        )}
        <main
          className={`mx-auto pb-[calc(var(--tabbar-h)+var(--tabbar-safe)+1.5rem)] lg:pb-6 ${
            header ? "max-w-6xl lg:max-w-[1400px]" : "max-w-6xl"
          }`}
        >
          {children}
        </main>
      </div>

      <BottomNav pendingCount={pendingCount} />

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
