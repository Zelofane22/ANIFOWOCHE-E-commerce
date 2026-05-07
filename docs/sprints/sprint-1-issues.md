# 📋 Issues Sprint 1 — Installation & Catalogue

> Sprint 1 · Semaines 1–3 · Capacité : 21h  
> Livrable : **Site visible en ligne avec catalogue produits**

---

## Comment utiliser ce fichier

Chaque section ci-dessous correspond à une issue à créer manuellement sur GitHub :
1. Va dans ton repo → **Issues → New issue**
2. Choisis le bon template
3. Copie le titre et le contenu correspondants ci-dessous

---

---

## ⚙️ TECH-01 — Ouvrir le compte Hostinger & configurer le domaine

**Labels :** `technique` `sprint-1`  
**Temps estimé :** 2h  
**Priorité :** P1

### Checklist
- [ ] Créer un compte sur hostinger.com
- [ ] Choisir le plan Business (~3,99 €/mois, engagement 1 an)
- [ ] Enregistrer le nom de domaine (anifowoche.com ou .bj)
- [ ] Activer le certificat SSL (Let's Encrypt, inclus)
- [ ] Vérifier que le domaine pointe correctement (DNS propagation)

### Notes
> Prendre l'engagement 1 an pour bloquer le tarif promotionnel.  
> Le domaine .bj donne une crédibilité locale au Bénin — à envisager en priorité.

---

## ⚙️ TECH-02 — Installer WordPress + WooCommerce

**Labels :** `technique` `sprint-1`  
**Temps estimé :** 2h  
**Priorité :** P1

### Checklist
- [ ] Installer WordPress en 1 clic depuis le panneau Hostinger
- [ ] Définir les réglages de base (langue FR, fuseau horaire Africa/Porto-Novo, titre du site)
- [ ] Installer le plugin WooCommerce
- [ ] Compléter l'assistant de configuration WooCommerce (devise XOF — Franc CFA, unités, etc.)
- [ ] Installer un thème compatible WooCommerce (Storefront — gratuit et officiel)
- [ ] Créer le thème enfant (dossier `.wordpress/themes/anifowoche-child/`)
- [ ] Activer le thème enfant

### Notes
> Ne jamais modifier le thème parent directement — toujours passer par le thème enfant.  
> Storefront est maintenu par WooCommerce, zéro risque de conflit.

---

## ⚙️ TECH-03 — Initialiser le repo GitHub & GitHub Projects

**Labels :** `technique` `sprint-1`  
**Temps estimé :** 1h  
**Priorité :** P1

### Checklist
- [ ] Créer le repo GitHub `anifowoche` (public ou privé)
- [ ] Pousser la structure de base du repo (README, dossiers, templates)
- [ ] Créer le projet GitHub Projects : "ANIFOWOCHE — MVP"
- [ ] Configurer les colonnes kanban : `📥 Backlog` / `🔄 En cours` / `🧪 En test` / `✅ Terminé`
- [ ] Créer les labels : `sprint-1`, `sprint-2`, `sprint-3`, `sprint-4`, `user-story`, `technique`, `bug`, `P1`, `P2`, `P3`
- [ ] Ajouter toutes les issues du sprint 1 au projet et les placer dans `📥 Backlog`

### Notes
> Les labels de couleur suggérés :  
> P1 = rouge `#E11D48` · P2 = orange `#F59E0B` · P3 = gris `#9CA3AF`  
> sprint-1 = bleu `#1A56A0` · technique = violet `#7C3AED` · bug = rouge vif `#DC2626`

---

## 📖 US-01 — Parcourir les produits par catégorie

**Labels :** `user-story` `sprint-1` `P1`  
**Story points :** 3 pts · **Temps estimé :** 2h

### User Story
> En tant que **visiteur**, je peux **parcourir les produits par catégorie (tissus, vêtements, accessoires)** afin de **trouver rapidement ce qui m'intéresse**.

### Critères d'acceptation
- [ ] La page d'accueil affiche les 3 catégories principales avec une image et un intitulé
- [ ] Cliquer sur une catégorie affiche uniquement les produits correspondants
- [ ] Les catégories sont : Tissus (bazin, googluck), Vêtements (chemises, pantalons, dessous), Accessoires (montres, ceintures, chaussures)
- [ ] La navigation fonctionne sur mobile et desktop

### Tâches techniques
- [ ] Créer les catégories WooCommerce dans le back-office
- [ ] Configurer la page boutique pour afficher les catégories en premier
- [ ] Ajouter une image représentative à chaque catégorie

---

## 📖 US-02 — Voir la fiche d'un produit

**Labels :** `user-story` `sprint-1` `P1`  
**Story points :** 3 pts · **Temps estimé :** 1h30

### User Story
> En tant que **visiteur**, je peux **voir la fiche détaillée d'un produit** afin de **vérifier les informations avant d'acheter**.

### Critères d'acceptation
- [ ] La fiche produit affiche : photo(s), nom, description, prix en XOF (Franc CFA), tailles disponibles (si applicable)
- [ ] Il est possible de zoomer sur la photo
- [ ] Un bouton "Ajouter au panier" est clairement visible
- [ ] La fiche s'affiche correctement sur mobile

### Tâches techniques
- [ ] Configurer les champs produit WooCommerce (prix, description, variantes de taille)
- [ ] Activer la galerie d'images produit dans le thème
- [ ] Vérifier l'affichage mobile de la fiche produit

---

## 📖 US-03 — Gérer les produits depuis le back-office

**Labels :** `user-story` `sprint-1` `P1`  
**Story points :** 2 pts · **Temps estimé :** 3h

### User Story
> En tant qu'**administrateur (le père)**, je peux **ajouter, modifier et supprimer des produits depuis le back-office** afin de **maintenir le catalogue à jour sans aide technique**.

### Critères d'acceptation
- [ ] L'admin peut se connecter à `/wp-admin` avec ses propres identifiants
- [ ] L'ajout d'un produit inclut : nom, description, prix XOF, catégorie, photo(s)
- [ ] L'admin peut modifier un produit existant
- [ ] L'admin peut marquer un produit comme "rupture de stock"
- [ ] L'interface back-office est compréhensible sans formation technique

### Tâches techniques
- [ ] Créer un compte administrateur dédié pour le père
- [ ] Ajouter 10 produits test réels (avec photos) pour valider le workflow
- [ ] Rédiger un mini-guide en français (1 page) : "Comment ajouter un produit"
- [ ] Tester l'ajout de produit depuis un smartphone Android (usage réel du père)

### Notes
> Le guide admin sera placé dans `docs/guides/ajouter-un-produit.md`

---

## 📖 US-04 — Rechercher un produit

**Labels :** `user-story` `sprint-1` `P2`  
**Story points :** 2 pts · **Temps estimé :** 1h

### User Story
> En tant que **visiteur**, je peux **rechercher un produit par nom ou catégorie** afin de **trouver rapidement un article précis**.

### Critères d'acceptation
- [ ] Une barre de recherche est visible sur toutes les pages (header)
- [ ] La recherche retourne des résultats pertinents parmi les produits WooCommerce
- [ ] Si aucun résultat : un message clair est affiché ("Aucun produit trouvé")
- [ ] La recherche fonctionne sur mobile

### Tâches techniques
- [ ] Activer la recherche WooCommerce native dans le thème
- [ ] Vérifier que les descriptions produit sont bien indexées

---

## ⚙️ TECH-04 — Personnaliser la homepage & les pages essentielles

**Labels :** `technique` `sprint-1`  
**Temps estimé :** 3h  
**Priorité :** P1

### Checklist
- [ ] Créer une homepage avec : bannière hero, présentation de la boutique, sections catégories, produits vedettes
- [ ] Créer la page "À propos" (histoire du commerce, valeurs)
- [ ] Créer la page "Contact" (numéro WhatsApp Business, email)
- [ ] Créer la page "Livraison & retours" (zone Cotonou, délais estimés, conditions)
- [ ] Configurer le menu de navigation principal
- [ ] Configurer le pied de page (mentions légales, liens utiles)

### Notes
> Utiliser Canva pour créer la bannière hero (format recommandé : 1920×600 px).

---

## ⚙️ TECH-05 — Tests & rétrospective Sprint 1

**Labels :** `technique` `sprint-1`  
**Temps estimé :** 3h  
**Priorité :** P1

### Checklist
**Tests fonctionnels**
- [ ] Naviguer dans toutes les catégories depuis un desktop
- [ ] Naviguer depuis un smartphone (Chrome Android)
- [ ] Ouvrir 5 fiches produit différentes et vérifier l'affichage
- [ ] Tester la barre de recherche avec des termes corrects et incorrects
- [ ] Demander au père de tester l'ajout d'un produit depuis son téléphone

**Tests techniques**
- [ ] Vérifier que le SSL est actif (cadenas vert dans le navigateur)
- [ ] Vérifier la vitesse de chargement (Google PageSpeed Insights > 60/100)
- [ ] Vérifier qu'une sauvegarde automatique est planifiée sur Hostinger

**Rétrospective (30 min avec le père)**
- [ ] Ce qui a bien fonctionné ?
- [ ] Ce qui a bloqué ?
- [ ] Ajustements pour le Sprint 2 ?
- [ ] Documenter la rétro dans `docs/sprints/retro-sprint-1.md`

---

*Fichier généré le 7 mai 2026 — ANIFOWOCHE*
