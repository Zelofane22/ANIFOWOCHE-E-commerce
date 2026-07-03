# ✅ Sprint 5 — Suivi de progression

[← Retour au planning v2](planning-v2.md)

Exécuté via une boucle automatisée (une tâche toutes les ~30 min, un commit local testé après chacune —
voir [retro-sprint.md](retro-sprint.md) pour le précédent Sprint 2/3). Chaque tâche ne démarre qu'une fois
la précédente committée. Aucun push pendant la boucle — commits locaux uniquement.

- [x] 1. US-30 — Stock réel affiché sur la fiche produit (remplace le badge "En stock" codé en dur)
- [x] 2. US-21 + US-22 — API avis produits (lecture avis approuvés + soumission) + note réelle sur fiche produit et `ProductCard`
- [x] 3. US-29 — Bouton "Partager" fonctionnel (Web Share API / copie presse-papiers)
- [x] 4. US-23 — API bannières + carrousel accueil
- [x] 5. US-24 + US-25 — API promotions actives (prix barré + badge %) + application code coupon au checkout
- [ ] 6. US-26 — Formulaire de demande de retour depuis l'historique de commande (traitement admin déjà existant)
- [ ] 7. US-28 — Wishlist persistée (modèle backend + bouton cœur fonctionnel + section compte)
- [ ] 8. US-31 — Filtres/tri catalogue (prix, catégorie, unité, disponibilité)
- [ ] 9. US-27 — Galerie multi-images (changement de modèle `Product.image` → plusieurs images)

**Livrable Sprint 5** : le site public reflète réellement ce que l'admin peut déjà configurer (avis,
promos, bannières, retours), et les boutons déjà visibles sur la fiche produit fonctionnent.
