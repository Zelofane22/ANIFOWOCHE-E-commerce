import { NavLink } from "react-router";
import { useCart } from "../context/useCart.js";
import { CartIcon, HeartIcon, HomeIcon, MenuIcon, UserIcon } from "./icons.jsx";

function Tab({ to, label, Icon, badge = 0 }) {
  return (
    <NavLink
      to={to}
      className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold text-white/60 transition active:scale-95"
      style={({ isActive }) => (isActive ? { color: "var(--color-brand)" } : undefined)}
    >
      <span className="relative flex items-center justify-center">
        <Icon size={22} />
        {badge > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function MobileTabBar() {
  const { itemCount } = useCart();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-charcoal md:hidden"
      style={{ paddingBottom: "var(--tabbar-safe)" }}
    >
      <div className="mx-auto flex h-[var(--tabbar-h)] max-w-lg items-stretch">
        <Tab to="/" label="Accueil" Icon={HomeIcon} />
        <Tab to="/catalogue" label="Catalogue" Icon={MenuIcon} />
        <Tab to="/panier" label="Panier" Icon={CartIcon} badge={itemCount} />
        <Tab to="/compte/favoris" label="Favoris" Icon={HeartIcon} />
        <Tab to="/compte" label="Compte" Icon={UserIcon} />
      </div>
    </nav>
  );
}
