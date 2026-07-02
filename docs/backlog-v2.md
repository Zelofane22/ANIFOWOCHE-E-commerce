# 📋 Backlog v2 — Épics & User Stories (post-MVP)

[← Retour au README](../README.md)

Suite de [docs/backlog.md](backlog.md) (E1-E5, MVP terminé). Ce backlog couvre la prochaine version :
fermer les fonctionnalités déjà à moitié construites, préparer un vrai lancement public, puis étendre.

Priorités — **P1** : Critique avant lancement public · **P2** : Haute valeur · **P3** : Normale / confort

Chaque story a été vérifiée contre l'état réel du code (pas une liste générique) — voir la colonne **Constat**.

## E6 — Connecter les modules déjà en base (avis, promos, bannières, retours)

Les apps `content`, `promotions`, `returns`, `reviews` existent côté Django (modèles + admin Unfold) mais
n'ont **aucune route API** (`urls.py` vide) ni **aucune consommation frontend**. Le back-office peut déjà
créer des avis/promotions/bannières/retours, mais rien n'est visible ni actionnable côté site public.

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-21 | En tant que client, je vois les avis approuvés et je peux en soumettre un (note 1-5 + commentaire) sur une fiche produit | P2 | `apps/reviews` : modèle + admin OK, `views.py`/`urls.py` vides |
| US-22 | En tant que client, la fiche produit affiche la note moyenne et le nombre d'avis réels | P2 | `Product.jsx:132-135` affiche `4.7` / `128 avis` en dur |
| US-23 | En tant que visiteur, je vois les bannières promo publiées en carrousel sur l'accueil | P3 | `apps/content.Banner` (titre, image, lien, `is_published`, `order`) jamais exposé |
| US-24 | En tant que client, je vois les promotions actives (prix barré + badge %) sur le catalogue et la fiche produit | P2 | `apps/promotions.Promotion` (produits/catégories, dates, %) jamais exposé |
| US-25 | En tant que client, j'applique un code coupon au panier/checkout et la réduction s'applique à la commande | P2 | `apps/promotions.Coupon` (code, `max_uses`, `used_count`, expiration) jamais exposé ni branché sur `Order` |
| US-26 | En tant que client, je demande un retour depuis mon historique de commande ; l'admin approuve/rejette/rembourse | P2 | `apps/returns.ReturnRequest` existe, admin OK, aucune route ni bouton côté `Account.jsx` |

## E7 — Finir l'expérience produit (boutons déjà dans l'UI mais non branchés)

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-27 | En tant que client, je consulte plusieurs photos par produit (galerie) | P3 | `Product.jsx` a déjà le bouton galerie/flèches mais `hasGallery = false` codé en dur ; `Product.image` est un champ unique |
| US-28 | En tant que client connecté, j'ajoute un produit à ma liste de souhaits et je la retrouve dans mon compte | P2 | Bouton cœur présent (`Product.jsx`) mais `wishlist` est un `useState` local non persisté, aucun modèle backend |
| US-29 | En tant que client, le bouton "Partager" envoie réellement le lien produit (Web Share API / copie presse-papiers) | P3 | Bouton SVG présent sans `onClick` — mort actuellement |
| US-30 | En tant que client, je vois le stock réel du produit (rupture, "plus que X en stock") | P2 | Badge "En stock" affiché en dur dans `Product.jsx`, indépendant du champ `Product.stock` |
| US-31 | En tant que client, je filtre/trie le catalogue (prix, catégorie, unité pièce/mètre, disponibilité) | P2 | `Catalogue.jsx` à vérifier au chiffrage — filtre catégorie simple existant, pas de filtre prix/dispo |

## E8 — Paiement & notifications réels (dette identifiée en rétro Sprint 2/3)

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-32 | En tant que client, je paie réellement via FedaPay/KkiaPay sandbox puis en production | P1 | `docs/sprints/retro-sprint.md` : intégration codée avec clés placeholder, jamais testée avec de vraies clés |
| US-33 | En tant que client, je reçois une vraie notification WhatsApp (confirmation, en route) | P1 | Idem, client WhatsApp Cloud codé mais jamais testé avec un vrai token |
| US-34 | En tant qu'admin, les paiements échoués sont visibles et relançables (panier abandonné) | P3 | Aucune gestion d'échec/relance actuellement |

## E9 — Sécurité & administration (suite de US-20, garde-fou superuser ajouté ce jour)

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-35 | En tant que super admin, j'attribue des rôles prédéfinis (ex. "Gestion catalogue", "Gestion commandes", "Support client") avec permissions pré-remplies, au lieu de cocher les permissions une par une | P2 | Seuls les groupes Django génériques existent, pas de rôles métier pré-configurés |
| US-36 | En tant que super admin, je suis alerté sur des actions sensibles (suppression en masse, changement de permissions) | P3 | `LogEntry` déjà visible dans l'admin (US antérieure), pas d'alerting actif |
| US-37 | En tant qu'admin, la base de données est sauvegardée automatiquement et les erreurs serveur sont monitorées (Sentry ou équivalent) | P1 | Rien en place actuellement |
| US-38 | En tant qu'admin, une revue de sécurité complète est faite avant l'ouverture publique (rate limiting, secrets, HTTPS, dépendances) | P1 | Bases posées (JWT, CORS, throttling) mais pas d'audit formel |

## E10 — Qualité & CI (dette notée dans `docs/sprints/retro-sprint.md`)

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-39 | Tests frontend (Vitest) sur panier, checkout, auth | P2 | Retro Sprint 2/3 : "pas encore de tests frontend" |
| US-40 | Tests de bout en bout (Playwright/Cypress) sur le parcours d'achat complet | P2 | Aucun test e2e multi-services actuellement |
| US-41 | CI : ajouter lint frontend (ESLint) + backend, seuil de couverture minimum | P3 | Voir `docs/ci-cd.md` pour l'état actuel du pipeline |

## E11 — Performance & SEO

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-42 | Images produit optimisées (WebP/transformations Cloudinary, lazy loading) | P3 | Cloudinary déjà branché en storage, pas de transformations/format optimisé |
| US-43 | SEO : meta tags dynamiques par produit, sitemap.xml, Open Graph pour le partage | P2 | Rien en place, impacte l'acquisition organique |
| US-44 | Cache Redis sur les endpoints catalogue à fort trafic | P3 | Déjà noté "Phase 2" dans `docs/stack-technique.md` — à réévaluer selon trafic réel post-lancement |

## E12 — Livraison avancée

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-45 | Modèle Livreur dédié (nom, téléphone, zones couvertes) au lieu du texte libre `courier_name` | P3 | `Delivery.courier_name` est un `CharField` libre, pas d'entité Livreur |
| US-46 | En tant que client, je suis le statut de ma livraison en temps réel (ETA) | P3 | Statuts existent (`pending/assigned/in_transit/delivered`) mais pas de suivi live côté client |

## E13 — Élargir l'accès (post-lancement)

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-47 | PWA installable (cache catalogue offline, notifications push web) | P3 | Alternative légère avant le natif, aucun manifest/service worker actuellement |
| US-48 | Application mobile React Native | P3 | Déjà noté "Phase 3" dans `docs/contexte.md` |
| US-49 | Multi-langue (français + anglais) pour la diaspora | P3 | Site actuellement 100% français (`LANGUAGE_CODE = "fr-fr"`) |

## E14 — CMS d'apparence front client/admin

Objectif : permettre au propriétaire de modifier l'identité visuelle et les contenus commerciaux courants
sans intervention développeur, tout en gardant des garde-fous forts. Ce n'est pas un éditeur libre type
Webflow : l'admin choisit parmi des options et sections prévues, afin de préserver la cohérence du site et
la logique métier existante.

| ID | User Story | Priorité | Constat |
|----|-------------|----------|---------|
| US-50 | En tant qu'admin, je modifie le logo, les couleurs principales, les textes courts et les images clés du site depuis l'admin | P2 | Aujourd'hui, l'apparence est codée dans le frontend/Tailwind et les assets statiques |
| US-51 | En tant qu'admin, j'active, désactive et ordonne des sections prédéfinies de la page d'accueil (hero, bannières, catégories, produits mis en avant, arguments de confiance) | P2 | `apps/content.Banner` existe, mais il n'y a pas de configuration globale de page ni de sections pilotables |
| US-52 | En tant qu'admin, je gère les liens de navigation, le footer et les blocs éditoriaux simples sans modifier le code | P3 | `Navbar.jsx` et `Footer.jsx` sont actuellement statiques côté frontend |
| US-53 | En tant que client, l'interface applique automatiquement la configuration active via une API publique de configuration visuelle | P2 | Aucun endpoint `/api/site-config/` ou équivalent n'existe aujourd'hui |
| US-54 | En tant que super admin, je peux prévisualiser ou revenir à une configuration précédente avant publication | P3 | Aucun versioning/aperçu des réglages d'apparence n'existe |

---

Regroupement en sprints (par priorité/dépendance, sans découpage horaire fixe) : [docs/sprints/planning-v2.md](sprints/planning-v2.md).
