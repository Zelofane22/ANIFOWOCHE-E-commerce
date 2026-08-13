import { Link } from "react-router";
import Seo from "../components/Seo.jsx";
import {
  StoreIcon,
  PackageIcon,
  MessageSquareIcon,
  CheckIcon,
  ArrowRightIcon,
  LayoutDashboardIcon,
} from "../components/icons.jsx";

function SmartphoneIcon(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function ZapIcon(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function GlobeIcon(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: StoreIcon,
    title: "Boutique en ligne en 2 minutes",
    desc: "Créez votre boutique sans compétence technique. Ajoutez votre nom, votre ville, votre numéro WhatsApp et obtenez un lien public à partager partout.",
  },
  {
    icon: PackageIcon,
    title: "Catalogue produits simple",
    desc: "Ajoutez vos articles avec photo, prix et description. Classez-les par catégorie. Masquez un produit quand il n'est plus disponible.",
  },
  {
    icon: MessageSquareIcon,
    title: "WhatsApp intégré",
    desc: "Générez des messages de confirmation, de relance ou de rupture en un clic. Ouvrez WhatsApp avec le message déjà prêt.",
  },
  {
    icon: LayoutDashboardIcon,
    title: "Tableau de bord clair",
    desc: "Voyez vos commandes du jour, les paiements en attente, votre chiffre d'affaires estimé et vos produits les plus commandés.",
  },
  {
    icon: SmartphoneIcon,
    title: "100% mobile",
    desc: "Votre boutique s'affiche parfaitement sur mobile. Vos clients commandent depuis leur téléphone, sans avoir à créer de compte.",
  },
  {
    icon: GlobeIcon,
    title: "Lien public partageable",
    desc: "Un lien simple à copier-coller sur WhatsApp, Instagram, Facebook ou même en bio. Vos clients voient tous vos produits d'un coup.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Créez votre boutique",
    desc: "Inscrivez-vous en quelques secondes. Donnez un nom à votre boutique, votre ville et votre numéro WhatsApp.",
  },
  {
    step: "2",
    title: "Ajoutez vos produits",
    desc: "Prenez une photo, mettez un prix et une description. Vos produits sont en ligne immédiatement.",
  },
  {
    step: "3",
    title: "Partagez et vendez",
    desc: "Copiez votre lien de boutique et partagez-le partout. Recevez les commandes, gérez les statuts et utilisez WhatsApp pour confirmer.",
  },
];

const FAQ = [
  {
    q: "C'est gratuit ?",
    a: "Oui, vous pouvez créer votre boutique gratuitement et vendre jusqu'à 5 produits. Des plans payants (Starter et Pro) arrivent bientôt pour les vendeurs qui ont besoin de plus de produits et de fonctionnalités avancées.",
  },
  {
    q: "Je n'ai pas de site web, je peux quand même vendre ?",
    a: "Oui, c'est exactement l'idée. Vous n'avez pas besoin de site web. Votre boutique ANIF Seller est votre vitrine en ligne. Vous partagez simplement le lien sur WhatsApp.",
  },
  {
    q: "Mes clients peuvent-ils payer en ligne ?",
    a: "Pour l'instant, les commandes sont confirmées par le vendeur et le paiement se fait à la livraison ou par mobile money selon votre arrangement avec le client. Le paiement en ligne arrive bientôt.",
  },
  {
    q: "Je peux vendre depuis mon téléphone ?",
    a: "Oui, toute l'interface est conçue pour fonctionner sur mobile. Vous pouvez gérer votre boutique, vos produits et vos commandes depuis votre téléphone.",
  },
  {
    q: "Combien de produits puis-je ajouter ?",
    a: "La version gratuite vous permet d'ajouter jusqu'à 5 produits et de recevoir jusqu'à 5 commandes par mois sur votre boutique publique. Les offres payantes Starter et Pro (bientôt disponibles) augmenteront ces limites (100 produits et commandes illimitées pour Starter) et ajouteront la visibilité sur le catalogue anifowoche.com.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui, vos données sont stockées de manière sécurisée. Seules les informations que vous choisissez de rendre publiques (nom de boutique, produits) sont visibles par vos clients.",
  },
];

export default function SellerLanding() {
  return (
    <div>
      <Seo
        title="ANIF Seller — Vendez facilement sur WhatsApp"
        description="Créez votre boutique en ligne en 2 minutes. Partagez votre catalogue sur WhatsApp, recevez les commandes et gérez tout depuis votre téléphone. Gratuit."
        path="/"
      />

      <HeroSection />
      <PainPointsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <FAQSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[480px] overflow-hidden bg-gradient-to-br from-charcoal via-charcoal to-coal">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent" />
      <div className="relative mx-auto flex min-h-[480px] max-w-7xl flex-col items-center px-4 py-20 text-center md:flex-row md:text-left">
        <div className="flex-1">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand">
            <ZapIcon size={13} /> Pour les petits commerçants
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            Vendez sur WhatsApp{" "}
            <span className="text-brand">sans vous y perdre</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/70 md:mx-0">
            Créez votre boutique en ligne en 2 minutes. Partagez votre catalogue
            sur WhatsApp, recevez les commandes et gérez tout depuis votre
            téléphone. Gratuit.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-7 py-3.5 font-bold text-white transition hover:bg-brand-medium"
            >
              Créer ma boutique gratuitement
              <ArrowRightIcon size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 px-7 py-3.5 font-semibold text-white transition hover:border-brand hover:text-brand"
            >
              J'ai déjà un compte
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/40">Aucune carte bancaire requise</p>
        </div>
        <div className="mt-12 hidden flex-1 md:mt-0 md:flex md:justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-brand/20 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-xs text-white/40">boutique.anif.shop</div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                  <div className="h-8 w-8 rounded-md bg-brand/30" />
                  <div className="flex-1">
                    <div className="h-2.5 w-28 rounded bg-white/20" />
                    <div className="mt-1.5 h-2 w-16 rounded bg-white/10" />
                  </div>
                  <div className="h-2.5 w-12 rounded bg-brand/40" />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                  <div className="h-8 w-8 rounded-md bg-brand/30" />
                  <div className="flex-1">
                    <div className="h-2.5 w-24 rounded bg-white/20" />
                    <div className="mt-1.5 h-2 w-14 rounded bg-white/10" />
                  </div>
                  <div className="h-2.5 w-12 rounded bg-brand/40" />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                  <div className="h-8 w-8 rounded-md bg-brand/30" />
                  <div className="flex-1">
                    <div className="h-2.5 w-32 rounded bg-white/20" />
                    <div className="mt-1.5 h-2 w-12 rounded bg-white/10" />
                  </div>
                  <div className="h-2.5 w-12 rounded bg-brand/40" />
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
                <div className="h-8 flex-1 rounded-lg bg-brand/20" />
                <div className="h-8 flex-1 rounded-lg border border-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PainPointsSection() {
  return (
    <section className="border-b border-black/10 bg-surface-muted py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">
            Vous gérez vos commandes sur WhatsApp ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            Vous n'êtes pas seul. Des centaines de petits commerçants au Bénin
            et en Afrique font face aux mêmes problèmes chaque jour.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Messages noyés",
              desc: "Les commandes se mélangent avec les messages perso et les statuts. Vous perdez du temps à retrouver une conversation.",
            },
            {
              title: "Catalogue inexistant",
              desc: "Vous envoyez des photos une par une. Difficile de montrer tous vos produits à un nouveau client.",
            },
            {
              title: "Suivi manuel",
              desc: "Vous notez les commandes sur un carnet ou dans vos notes téléphone. Compliqué de savoir qui a payé, qui est livré.",
            },
            {
              title: "Aucune vitrine",
              desc: "Pas de lien à partager. Pas de boutique en ligne. Vos produits ne sont visibles que dans vos conversations.",
            },
            {
              title: "Relances oubliées",
              desc: "Vous avez 5 clients qui n'ont pas payé, mais vous ne savez plus qui relancer. Vous perdez des ventes.",
            },
            {
              title: "Pas de vision",
              desc: "À la fin du mois, vous ne savez pas combien vous avez vendu ni quels produits marchent le mieux.",
            },
          ].map((pain) => (
            <div
              key={pain.title}
              className="rounded-xl border border-black/10 bg-white p-5"
            >
              <p className="font-bold text-ink">{pain.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-muted">{pain.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">
            Tout ce qu'il vous faut pour vendre
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            ANIF Seller transforme votre WhatsApp en une véritable boutique en ligne,
            sans rien changer à vos habitudes.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-black/10 bg-white p-6 transition hover:border-brand/40 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-bold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="border-y border-black/10 bg-surface-muted py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">
            Comment ça marche ?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Trois étapes pour passer de zéro à votre première commande.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {item.step}
              </div>
              <h3 className="mt-4 font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 font-bold text-white transition hover:bg-brand-medium"
          >
            Commencer maintenant
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="py-16 md:py-20" id="tarifs">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">
            Des offres pour tous les commerçants
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Commencez gratuitement. Passez à la vitesse supérieure quand vous
            êtes prêt.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-black/10 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-bold text-ink">Gratuit</h3>
            <p className="mt-1 text-sm text-muted">Pour démarrer et tester</p>
            <p className="mt-4">
              <span className="text-4xl font-bold text-ink">0 F</span>
              <span className="text-sm text-muted">/mois</span>
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Jusqu'à 5 produits",
                "Jusqu'à 5 commandes/mois",
                "Boutique publique dédiée",
                "Lien WhatsApp",
                "Messages de confirmation",
                "Support email",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink">
                  <CheckIcon size={16} className="mt-0.5 shrink-0 text-brand-dark" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-brand/40 px-5 py-2.5 font-bold text-brand-dark transition hover:bg-brand-light"
            >
              C'est parti
              <ArrowRightIcon size={16} />
            </Link>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-bold text-ink">Starter</h3>
            <p className="mt-1 text-sm text-muted">Pour les vendeurs actifs</p>
            <p className="mt-4">
              <span className="text-4xl font-bold text-ink">5 000 F</span>
              <span className="text-sm text-muted">/mois</span>
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "100 produits",
                "Commandes illimitées",
                "Statistiques essentielles",
                "Personnalisation de base",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink">
                  <CheckIcon size={16} className="mt-0.5 shrink-0 text-brand-dark" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-brand/10 px-5 py-2.5 text-center text-sm font-semibold text-brand-dark">
              Bientôt disponible — prévenez-moi
            </p>
          </div>
          <div className="relative rounded-xl border-2 border-brand bg-white p-6 sm:p-8">
            <div className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-bold text-white">
              Populaire
            </div>
            <h3 className="text-lg font-bold text-ink">Pro</h3>
            <p className="mt-1 text-sm text-muted">Mieux vendre et piloter</p>
            <p className="mt-4">
              <span className="text-4xl font-bold text-ink">10 000 F</span>
              <span className="text-sm text-muted">/mois</span>
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Produits et commandes illimités",
                "Statistiques avancées",
                "Exports",
                "Plusieurs utilisateurs",
                "Outils promotionnels",
                "Relances clients",
                "Personnalisation avancée",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink">
                  <CheckIcon size={16} className="mt-0.5 shrink-0 text-brand-dark" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-brand/10 px-5 py-2.5 text-center text-sm font-semibold text-brand-dark">
              Bientôt disponible — prévenez-moi
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-gradient-to-br from-charcoal to-coal py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-2xl font-bold text-white md:text-3xl">
          Prêt à vendre sans vous prendre la tête ?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-white/60">
          Créez votre boutique en 2 minutes. Gratuit. Aucune carte bancaire
          demandée.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-8 py-3.5 font-bold text-white transition hover:bg-brand-medium"
          >
            Créer ma boutique gratuite
            <ArrowRightIcon size={16} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-8 py-3.5 font-semibold text-white transition hover:border-brand hover:text-brand"
          >
            Me connecter
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-2xl font-bold text-ink md:text-3xl">
          Questions fréquentes
        </h2>
        <div className="mt-10 space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-black/10 bg-white"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-semibold text-ink transition hover:text-brand-dark">
                {item.q}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 transition group-open:rotate-180"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className="border-t border-black/10 px-5 py-4 text-sm leading-7 text-muted">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
