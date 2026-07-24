import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getSellerDashboard } from "../api/seller.js";
import {
  CopyIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
  StoreIcon,
} from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import { useAuth } from "../context/useAuth.js";

function Metric({ label, value, Icon }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted">{label}</p>
        <Icon size={18} className="text-brand-dark" />
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copier");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/seller/login", { replace: true });
      return;
    }
    getSellerDashboard()
      .then(setDashboard)
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/seller/register" : "/seller/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  if (loading || !dashboard) {
    return <div className="min-h-screen bg-[#f7f6f2] px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  const { seller, metrics } = dashboard;
  const publicUrl = seller.shop.public_url;

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyLabel("Copié");
      window.setTimeout(() => setCopyLabel("Copier"), 1500);
    } catch {
      setCopyLabel("Copie indisponible");
    }
  };

  return (
    <SellerShell title="Tableau de bord" seller={seller}>
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <p className="text-sm font-semibold text-brand-dark">Sprint 1</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Bienvenue, {seller.display_name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Votre base vendeur est prête. Le prochain sprint ajoutera les produits, puis les commandes
            pourront être rattachées à cette boutique.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/seller/settings"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-medium"
            >
              <SettingsIcon size={15} />
              Compléter la boutique
            </Link>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
            >
              <ExternalLinkIcon size={15} />
              Voir la boutique
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-sm font-bold text-ink">Lien public</p>
          <p className="mt-2 break-all rounded-lg bg-gray-50 px-3 py-2 text-sm text-muted">{publicUrl}</p>
          <button
            type="button"
            onClick={copyPublicUrl}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand-dark"
          >
            <CopyIcon size={15} />
            {copyLabel}
          </button>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        <Metric label="Produits" value={metrics.products} Icon={PackageIcon} />
        <Metric label="Commandes du jour" value={metrics.orders_today} Icon={LayoutDashboardIcon} />
        <Metric label="En attente" value={metrics.pending_orders} Icon={StoreIcon} />
      </section>

      <section className="mt-5 rounded-xl border border-dashed border-black/15 bg-white p-6 text-center">
        <PackageIcon size={34} className="mx-auto text-muted" />
        <h2 className="mt-3 text-base font-bold text-ink">Catalogue à venir au Sprint 2</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-muted">
          La structure vendeur est en place. Les produits, stocks et images pourront maintenant être
          ajoutés sans reprendre l'authentification ou le profil boutique.
        </p>
      </section>
    </SellerShell>
  );
}
