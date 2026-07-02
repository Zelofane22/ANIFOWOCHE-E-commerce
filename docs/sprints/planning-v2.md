# 🗓️ Planning v2 — Sprints post-MVP

[← Retour au README](../../README.md)

Suite de [planning.md](planning.md) (Sprints 1-4, MVP terminé). Pas de capacité horaire fixe pour cette
version (l'hypothèse "solo 7h/semaine" du MVP ne s'applique plus) — le découpage suit la **priorité et les
dépendances**, pas un budget d'heures. Détail des épics/stories : [docs/backlog-v2.md](../backlog-v2.md).

## Sprint 5 — Finir ce qui est à moitié construit (E6 + E7)

Priorité : fermer les écarts entre ce qui existe déjà en base/UI et ce qui est réellement utilisable.
Faible risque, forte valeur perçue : le backend des avis/promos/bannières/retours existe déjà, il manque
seulement la couche API + frontend. Idem pour wishlist/stock réel/galerie côté fiche produit.

- Avis produits : API publique (lecture avis approuvés + soumission) + affichage note réelle sur fiche produit et `ProductCard` (US-21, US-22)
- Promotions & coupons : API publique promos actives + affichage prix barré/badge + application code coupon au checkout (US-24, US-25)
- Bannières : API publique + carrousel accueil (US-23)
- Retours : formulaire de demande depuis l'historique de commande + traitement admin (US-26)
- Stock réel affiché sur la fiche produit (US-30)
- Wishlist persistée (modèle backend + bouton cœur fonctionnel) (US-28)
- Bouton partage fonctionnel (US-29)
- Filtres/tri catalogue (prix, catégorie, unité, disponibilité) (US-31)
- Galerie multi-images (US-27) — dépend d'un changement de modèle (`Product.image` → plusieurs images), à chiffrer à part si le reste du sprint suffit déjà à occuper le temps disponible

**Livrable Sprint 5** : le site public reflète réellement ce que l'admin peut déjà configurer (avis, promos, bannières, retours), et les boutons déjà visibles sur la fiche produit fonctionnent.

## Sprint 6 — Lancement réel & sécurité (E8 + E9, P1 uniquement)

Priorité : ce sprint conditionne l'ouverture publique. Ne pas ouvrir le site aux vrais clients avant que
tout ce sprint soit fait.

- Vraies clés FedaPay/KkiaPay sandbox → test de paiement réel de bout en bout → clés prod (US-32)
- Vraies clés WhatsApp Business API → test de notification réelle (US-33)
- Sauvegardes automatiques PostgreSQL (Render) + monitoring erreurs (Sentry ou équivalent) (US-37)
- Revue de sécurité complète avant lancement (rate limiting, secrets, HTTPS, dépendances à jour) (US-38)
- Rôles admin prédéfinis (Gestion catalogue / Gestion commandes / Support client) — prolonge le garde-fou superuser déjà en place (US-35)

**Livrable Sprint 6** : premier vrai client peut commander et payer, être notifié, et l'infra est surveillée/sauvegardée.

## Sprint 7 — Qualité (E10)

Priorité : dette technique notée dès la rétro Sprint 2/3 ("pas encore de tests frontend ni e2e"). À faire
avant d'accumuler encore plus de code non couvert.

- Tests frontend Vitest : panier, checkout, auth (US-39)
- Tests end-to-end (Playwright/Cypress) sur le parcours d'achat complet (US-40)
- CI : lint frontend + backend, seuil de couverture (US-41)

**Livrable Sprint 7** : régressions détectées automatiquement avant merge, plus seulement par test manuel Docker.

## Sprint 8 — Performance, SEO & confort (E11 restant + E9 restant)

- SEO : meta tags dynamiques produit, sitemap.xml, Open Graph (US-43)
- Images optimisées (WebP/Cloudinary transforms, lazy loading) (US-42)
- Socle CMS d'apparence : modèles Django `SiteTheme` / sections accueil, endpoint public de configuration visuelle, application frontend via variables CSS et composants prédéfinis (US-50, US-51, US-53)
- Alerting sur actions admin sensibles (US-36)
- Cache Redis catalogue — seulement si le trafic réel post-lancement le justifie (US-44)

**Livrable Sprint 8** : le site est trouvable (SEO), rapide à charger, et l'admin peut ajuster les principaux éléments visuels sans modifier le code.

## Sprint 9+ — Extensions (E12, E13)

Bas de priorité, à ne traiter qu'une fois Sprints 5-8 livrés et le retour des premiers clients recueilli :

- Modèle Livreur dédié + suivi de livraison temps réel (US-45, US-46)
- CMS d'apparence avancé : navigation/footer éditables, aperçu avant publication, historique ou rollback de configuration (US-52, US-54)
- PWA installable (US-47)
- Multi-langue FR/EN (US-49)
- Application mobile React Native — Phase 3 (US-48)

---

## Principe de séquençage

1. **Sprint 5 avant Sprint 6** : les fonctionnalités déjà à moitié construites (E6/E7) sont un risque de
   confusion pour les utilisateurs si le site ouvre publiquement (boutons morts, admin qui configure des
   promos jamais visibles) — à fermer avant l'ouverture.
2. **Sprint 6 est un prérequis dur au lancement public** — tout le reste peut théoriquement attendre.
3. **Sprint 7 (tests) le plus tôt possible après le lancement** — chaque sprint suivant sans tests augmente
   le coût de régression.
4. **Sprint 8** : bon moment pour le socle CMS d'apparence, car les contenus dynamiques et l'ouverture publique
   auront déjà validé les besoins réels ; garder des options prédéfinies plutôt qu'un éditeur CSS libre.
5. **Sprints 8-9** : reclassables selon les retours clients réels du Sprint 6 — ne pas figer leur contenu
   avant d'avoir des données d'usage.
