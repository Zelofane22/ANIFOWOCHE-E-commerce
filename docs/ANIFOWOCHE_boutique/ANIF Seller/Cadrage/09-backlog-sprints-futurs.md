# Backlog Sprints Futurs — ANIF Seller

[← Retour](../README.md)

Suite de [08-backlog-agile.md](08-backlog-agile.md) (E0-E8, MVP + beta) et du
[04-modele-economique.md](04-modele-economique.md). Ce backlog couvre **tout le
reste à faire** pour transformer ANIF Seller en SaaS payant : la pipeline
d'abonnement (coeur de revenu), les fonctionnalités réservées aux offres
payantes, l'offre Business et le pilotage fondateur.

Priorités : **P1** critique, **P2** haute, **P3** normale, **P4** future.

Estimations : **1 pt** très simple, **2 pts** simple, **3 pts** moyen, **5 pts** complexe, **8 pts** à découper si possible.

Chaque story a été vérifiée contre l'état réel du code (voir colonne **Constat**).
L'inventaire de référence : backend `apps/sellers/` (endpoints, `limits.py`,
`SellerSubscription`) et frontend `src/pages/seller/*`.

## E9 — Abonnement SaaS : pipeline de revenu (coeur du modèle économique)

> Aujourd'hui `SellerSubscription` (modèle + admin + KPI backoffice) existe mais
> **aucun flux public ne le nourrit** : pas de checkout, pas de webhook, pas de
> page d'offre dynamique, plan non modifiable par le vendeur.

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-901 | En tant que visiteur, je vois la page d'offre vendeur avec les prix réels du backend (Gratuit 0, Starter 5 000, Pro 10 000) au lieu de textes en dur | P1 | 2 | `SellerLanding.jsx:348-453` : prix en dur ; backend sert `limits.price_xof` jamais lu |
| US-902 | En tant que vendeur, je choisis un plan et je le paie via FedaPay (checkout abonnement) | P1 | 8 | Aucun endpoint create/pay d'abonnement ; `payments/services.py` est lié aux commandes uniquement |
| US-903 | En tant que système, je reçois le webhook FedaPay dédié aux abonnements et je marque l'abonnement `APPROVED` | P1 | 5 | `FedaPayWebhookView` (`payments/views.py:112-137`) ne cherche que des `Payment` d'ordres |
| US-904 | En tant que système, j'active automatiquement le plan (dates de début/fin) et je bascule le `plan` du vendeur | P1 | 3 | `SellerSubscription.starts_at/ends_at` existent mais ne sont jamais alimentés |
| US-905 | En tant que vendeur, mon plan revient automatiquement à Gratuit à l'expiration (sans impacter mes données) | P1 | 3 | Pas de mécanisme d'expiration/rétrogradation |
| US-906 | En tant que vendeur, je passe à un plan supérieur ou inférieur en self-service avec facturation au prorata | P2 | 5 | `plan` est read-only côté API (`sellers/serializers.py:107`) |
| US-907 | En tant que vendeur, je m'abonne à l'offre Business « sur devis » (formulaire de contact) | P2 | 3 | Offre Business absente de la landing (3 cartes seulement) |
| US-908 | En tant que vendeur, je résilie mon abonnement et j'en suis averti (échéance à venir, perte des features payantes) | P2 | 3 | Aucun flux de résiliation |

## E10 — Exposer le plan au vendeur et payer les modules (paywall)

> Le backend expose déjà `plan`, `price_xof`, `can_appear_on_main_store` et une
> matrice `features` (12 drapeaux) via `limits.build_limits_payload` ; le
> frontend n'en consomme **que** les barres de quota (`max_products`,
> `products_used`, ...).

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1001 | En tant que vendeur, je vois mon plan actuel (vrai nom + prix depuis le backend) au lieu du badge « Gratuit » en dur | P1 | 2 | `SellerDashboard.jsx:216`, `SellerSettings.jsx:245-249` : « Gratuit » codé en dur |
| US-1002 | En tant que vendeur, je vois une page/encart « Mon plan » avec usage et CTA d'upgrade | P1 | 3 | Pas de page plan, pas de CTA upgrade (boutons morts « Bientôt disponible ») |
| US-1003 | En tant que vendeur, les modules payants sont masqués/verrouillés selon `limits.features` (stats avancées, exports, équipe, promos, relances, domaine, paiement en ligne) | P1 | 5 | `limits.features` jamais lu côté frontend |
| US-1004 | En tant que vendeur qui atteint 5 produits ou 5 commandes, je suis redirigé vers l'offre avec un CTA clair | P2 | 3 | Bannière quota existe (`SellerDashboard.jsx:205-210`) mais sans CTA d'upgrade |
| US-1005 | En tant que vendeur, je reçois une 403 claire avec le plan requis quand une feature payante est appelée | P3 | 3 | Backend : aucun garde-fou `has_feature()` sur les endpoints (fonctions présentes dans `limits.py`) |

## E11 — Statistiques avancées (Pro)

> Le dashboard vendeur (`SellerDashboardView`) sert des KPIs essentiels sur 30 j.
> Aucun endpoint d'analytics avancées n'existe (`apps/analytics` ne tracke que
> des pageviews anonymes).

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1101 | En tant que vendeur Pro, je choisis une période (7/30/90 j ou plages personnalisées) pour mes stats | P1 | 3 | `KPI_PERIOD_DAYS = 30` en dur (`sellers/views.py:36`) |
| US-1102 | En tant que vendeur Pro, je vois le panier moyen, le taux de conversion et la répartition par statut sur la période | P1 | 5 | Non implémenté (seuls revenus/commandes/évolution existent) |
| US-1103 | En tant que vendeur Pro, je compare deux périodes (évolution des ventes, top produits, catégories) | P2 | 5 | `_percent_change` existe sur revenus/commandes uniquement |
| US-1104 | En tant que vendeur Pro, je vois les heures/jours à plus forte activité pour mieux me préparer | P3 | 3 | Non implémenté |

## E12 — Exports (Pro)

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1201 | En tant que vendeur Pro, j'exporte mes produits en CSV | P2 | 2 | Export CSV seulement admin (`core/views.py:100-115`) |
| US-1202 | En tant que vendeur Pro, j'exporte mes commandes en CSV | P2 | 3 | Idem |
| US-1203 | En tant que vendeur Pro, j'exporte un état comptable simple (CA, remises, annulations) | P3 | 5 | Non implémenté |

## E13 — Équipe / multi-utilisateurs (Pro)

> Aucun modèle de collaborateur n'existe. `Shop.seller` est `OneToOne` et le
> dashboard est lié à l'utilisateur connecté.

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1301 | En tant que propriétaire Pro, j'invite des membres (email/WhatsApp) avec des rôles : propriétaire, vendeur, préparateur | P1 | 5 | Aucun modèle `TeamMember`/rôle |
| US-1302 | En tant que membre, je me connecte et j'accède au dashboard selon mes permissions (produits, commandes, paramètres) | P1 | 8 | Auth actuelle = profil vendeur unique |
| US-1303 | En tant que propriétaire, je révoque un membre ou je change son rôle | P2 | 2 | Non implémenté |
| US-1304 | En tant que vendeur Pro, je limite le nombre de membres selon le plan (1 pour Starter, plusieurs pour Pro) | P3 | 2 | `features.team` existe, aucun quota membres |

## E14 — Outils promotionnels vendeur (Pro)

> Les modèles `Promotion` et `Coupon` existent (`apps/promotions`) mais ne sont
> exposés qu'en validation publique de coupon (`coupons/validate/`). Aucun CRUD
> vendeur, aucune visibilité sur la boutique publique du vendeur.

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1401 | En tant que vendeur Pro, je crée/modifie/archive des promotions sur mes produits ou catégories (dates, % de réduction) | P1 | 5 | `Promotion` modèle OK, aucun endpoint vendeur |
| US-1402 | En tant que client, je vois le prix barré et le badge % sur la boutique publique du vendeur | P1 | 3 | Boutique publique (`PublicShopView`) ne calcule aucune réduction |
| US-1403 | En tant que vendeur Pro, je crée des codes coupon (usage max, expiration) liés à ma boutique | P2 | 5 | `Coupon` modèle OK, pas d'endpoint vendeur |
| US-1404 | En tant que client, j'applique un coupon sur la commande d'un vendeur et la réduction est appliquée | P2 | 8 | `Order` ne référence pas les coupons |

## E15 — Relances clients (Pro)

> Seule existe la relance de paiement d'une commande (`relance-paiement/`).
> Aucun outil de relance marketing (panier abandonné, commandes en attente).

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1501 | En tant que vendeur Pro, je relance les clients dont la commande est en attente avec un message pré-rempli | P2 | 3 | Seulement relance paiement (`sellers/views.py:256`) |
| US-1502 | En tant que vendeur Pro, je relance les clients qui ont consulté ma boutique sans commander (panier abandonné) | P3 | 5 | Aucun suivi de panier abandonné côté vendeur |
| US-1503 | En tant que vendeur Pro, je personnalise mes modèles de relance (WhatsApp/email) | P3 | 3 | Templates fixes (`notifications/services.py`) |

## E16 — Personnalisation, domaine et paiement en ligne (Pro)

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1601 | En tant que vendeur Pro, je personnalise ma boutique (logo, couleurs, bannière, présentation) | P2 | 5 | `Shop` n'a pas de champ logo/image ; personnalisation de base (Starter) vs avancée (Pro) à définir |
| US-1602 | En tant que vendeur Pro, j'attache un domaine personnalisé à ma boutique | P3 | 8 | `Shop` sans champ domaine ; routing subdomaine actuel (`App.jsx:15,54`) |
| US-1603 | En tant que vendeur, j'active la réception de paiements en ligne sur ma boutique (FedaPay puis KkiaPay) | P2 | 8 | `features.online_payment` existe ; FedaPay lié aux ordres de la vitrine principale uniquement |
| US-1604 | En tant que fondateur, je perçois une commission de service sur les paiements vendeur (paramétrable) | P3 | 5 | Aucune notion de commission sur les transactions vendeur |

## E17 — Offre Business (sur devis)

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1701 | En tant que vendeur Business, je gère plusieurs boutiques sous un même compte | P2 | 8 | `Shop.seller` est `OneToOne` (`sellers/models.py:32`) |
| US-1702 | En tant que vendeur Business, je bénéficie d'un support prioritaire (canal/tickets dédié) | P3 | 3 | Aucun système de support |
| US-1703 | En tant que vendeur Business, j'accède à toutes les features Pro + options avancées définies au devis | P3 | 2 | Matrice `features` prête (BUSINESS = PRO + multi_store + priority_support) |

## E18 — Pilotage fondateur (KPI)

> `apps/core.dashboard` expose des KPIs backoffice, mais aucun suivi des
> indicateurs du modèle économique (activation, ARPU, mix, churn, MRR).

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1801 | En tant que fondateur, je vois le nombre de boutiques créées, produits publiés et commandes reçues (global et par plan) | P1 | 3 | Partiel dans le backoffice admin |
| US-1802 | En tant que fondateur, je vois le taux d'activation (vendeurs ≥ 5 produits publiés et ≥ 1 commande) | P1 | 3 | Défini dans le doc (tunnel commercial) mais pas suivi |
| US-1803 | En tant que fondateur, je vois le mix Free/Starter/Pro/Business, l'ARPU, le MRR et le churn | P1 | 5 | Non implémenté ; `SellerSubscription` disponible en admin |
| US-1804 | En tant que fondateur, je vois le délai moyen jusqu'à la première commande d'un vendeur | P2 | 2 | Non implémenté |
| US-1805 | En tant que fondateur, je suis les commissions perçues sur les paiements vendeur | P3 | 3 | Dépend de US-1604 |

## E19 — Robustesse de la pipeline de paiement

| ID | User Story | Priorité | Points | Constat |
|----|-----------|----------|--------|---------|
| US-1901 | En tant que système, le webhook d'abonnement est idempotent et sécurisé (signature FedaPay vérifiée) | P1 | 5 | Webhook ordres existe, signature à répliquer pour les abonnements |
| US-1902 | En tant que fondateur, je teste le flux d'abonnement complet avec de vraies clés sandbox FedaPay | P1 | 3 | Clés placeholder actuellement (`payments/services.py`) |
| US-1903 | En tant que système, les abonnements impayés déclenchent une relance puis une rétrogradation automatique | P2 | 5 | Non implémenté |

## Regroupement en sprints

Sprints de 2 semaines, capacité 7-10 h/semaine (cf. [07-methode-agile.md](07-methode-agile.md)).

### Sprint 6 — Checkout abonnement (coeur de revenu)

| Story | Objectif |
|-------|----------|
| US-901 | Page d'offre dynamique (prix du backend) |
| US-902 | Checkout plan → FedaPay |
| US-903 | Webhook abonnement → APPROVED |
| US-904 | Activation auto du plan |

Critère de sortie : un vendeur pilote peut payer Starter/Pro et être activé.

### Sprint 7 — Paywall & plans côté vendeur

| Story | Objectif |
|-------|----------|
| US-1001 | Vrai nom/prix du plan affichés |
| US-1002 | Encart « Mon plan » + CTA upgrade |
| US-1003 | Verrouillage des modules selon `features` |
| US-905 | Expiration auto → retour Gratuit |

Critère de sortie : les features payantes sont visibles mais verrouillées pour FREE.

### Sprint 8 — Statistiques avancées (Pro)

| Story | Objectif |
|-------|----------|
| US-1101 | Sélecteur de période |
| US-1102 | Panier moyen, conversion, répartition |
| US-1104 | Heures/jours à forte activité |
| US-1005 | 403 clair sur endpoint stats payant |

Critère de sortie : un vendeur Pro pilote ses ventes sur une période.

### Sprint 9 — Exports & équipe (Pro)

| Story | Objectif |
|-------|----------|
| US-1201 | Export produits CSV |
| US-1202 | Export commandes CSV |
| US-1301 | Invitation membres + rôles |
| US-1302 | Accès membre selon permissions |

Critère de sortie : un vendeur Pro peut exporter et déléguer une partie de sa gestion.

### Sprint 10 — Promotions vendeur (Pro)

| Story | Objectif |
|-------|----------|
| US-1401 | CRUD promotions vendeur |
| US-1402 | Prix barré + badge % sur la boutique publique |
| US-1403 | Codes coupon vendeur |
| US-1404 | Application coupon sur commande |

### Sprint 11 — Relances & personnalisation (Pro)

| Story | Objectif |
|-------|----------|
| US-1501 | Relance commandes en attente |
| US-1601 | Personnalisation avancée (logo, couleurs) |
| US-1603 | Activation paiement en ligne boutique |

### Sprint 12+ — Business & pilotage fondateur

| Story | Objectif |
|-------|----------|
| US-1701 | Multi-boutiques (Business) |
| US-1801/02/03 | Dashboard fondateur : activation, ARPU, MRR, churn |
| US-1902 | Tests réels sandbox FedaPay |
| US-1602 | Domaine personnalisé |
| US-1604/1805 | Commission sur paiements |
| US-907 | Offre Business « sur devis » |

## Critères de validation du passage au payant

- au moins 1 vendeur paie un abonnement Starter ou Pro de bout en bout (sans admin) ;
- l'activation et l'expiration du plan se font sans intervention manuelle ;
- les features payantes sont réellement bloquées pour l'offre Gratuit (backend + frontend) ;
- le mix Free/Starter/Pro et le MRR sont visibles par le fondateur.
