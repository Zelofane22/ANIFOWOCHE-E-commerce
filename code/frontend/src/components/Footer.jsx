import { Link } from "react-router";

function Icon({ children }) {
  return (
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand">
      {children}
    </span>
  );
}

export default function Footer() {
  const features = [
    {
      title: "Livraison rapide",
      desc: "Cotonou en 24-48h",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v10H3zM14 11h4l3 3v3h-7z" />
          <circle cx="7" cy="19" r="1.5" />
          <circle cx="18" cy="19" r="1.5" />
        </svg>
      ),
    },
    {
      title: "Paiement sécurisé",
      desc: "MTN, Moov, Visa",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-5" />
        </svg>
      ),
    },
    {
      title: "Prix artisans",
      desc: "Direct boutique locale",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v8H4v-8M2 7h20v5H2zM12 7v13M12 7H8.5A2.5 2.5 0 1 1 12 4.5M12 7h3.5A2.5 2.5 0 1 0 12 4.5" />
        </svg>
      ),
    },
    {
      title: "Support WhatsApp",
      desc: "Suivi de commande",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.4-5A8.5 8.5 0 1 1 21 11.5Z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="mt-16 bg-charcoal text-white">
      <div className="border-b border-white/10 px-4 py-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <Icon>{item.icon}</Icon>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-0.5 text-sm text-white/60">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to="/" className="block w-fit overflow-hidden rounded-md">
            <img
              src="/anifowoche-logo.png"
              alt="ANIFOWOCHE"
              className="h-16 w-48 object-cover object-center"
            />
          </Link>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">
            Tissus, vêtements et accessoires sélectionnés à Cotonou, avec commande en ligne et livraison à domicile.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="mb-2 font-semibold text-white">Boutique</p>
            {[
              ["Catalogue", "/catalogue"],
              ["Panier", "/panier"],
              ["Compte", "/compte"],
            ].map(([label, to]) => (
              <Link key={to} to={to} className="block py-1 text-white/60 transition hover:text-brand">
                {label}
              </Link>
            ))}
          </div>
          <div>
            <p className="mb-2 font-semibold text-white">Services</p>
            {["Livraison Cotonou", "Paiement mobile", "Support client"].map((label) => (
              <span key={label} className="block py-1 text-white/60">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
