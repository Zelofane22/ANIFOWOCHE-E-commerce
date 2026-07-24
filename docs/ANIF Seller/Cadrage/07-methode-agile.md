# Méthode Agile — ANIF Seller

[← Retour](README.md)

## Objectif

Organiser le développement d'ANIF Seller avec une méthode Agile légère, adaptée à un fondateur solo ou à une petite équipe.

Le but n'est pas d'appliquer Scrum de façon lourde. Le but est de livrer vite, tester avec de vrais vendeurs, apprendre, puis ajuster le produit avant de construire trop de fonctionnalités.

L'application sera développée avec l'aide de l'IA. La méthode doit donc produire des entrées courtes et exploitables par l'IA : user stories précises, règles métier, maquettes, critères d'acceptation et prompts de génération.

## Approche recommandée

ANIF Seller doit utiliser une méthode **Scrum léger + Lean Startup** :

- Scrum léger pour organiser les sprints, le backlog et les livraisons ;
- Lean Startup pour valider les hypothèses business avec des vendeurs réels ;
- Kanban pour visualiser simplement l'avancement des tâches.

## Principes

1. Livrer une petite version utilisable à chaque sprint.
2. Tester chaque livraison avec au moins un vendeur réel ou simulé.
3. Prioriser les fonctionnalités qui valident le business.
4. Éviter les fonctionnalités avancées avant la preuve d'usage.
5. Documenter les décisions importantes au fil de l'eau.
6. Mesurer l'usage, pas seulement le code livré.

## Rôles

| Rôle | Responsable | Mission |
|------|-------------|---------|
| Product Owner | Fondateur | Définir la vision, prioriser le backlog, parler aux vendeurs |
| Développeur | Fondateur ou équipe technique | Construire, tester, corriger, déployer |
| Testeurs pilotes | Vendeurs sélectionnés | Utiliser le produit, signaler les blocages |
| Support métier | Commerçants proches | Donner du feedback terrain |

Si le projet reste solo, une même personne porte les rôles Product Owner et Développeur. Il faut alors protéger du temps séparé pour penser produit, coder et tester.

## Cadence

| Élément | Recommandation |
|---------|----------------|
| Durée d'un sprint | 2 semaines |
| Capacité cible | 7 à 10 heures par semaine |
| Livraison | À la fin de chaque sprint |
| Test utilisateur | Au moins 1 test vendeur par sprint |
| Rétrospective | 30 minutes en fin de sprint |
| Repriorisation backlog | Début de chaque sprint |

Un sprint de 2 semaines est assez court pour garder de l'élan, mais assez long pour livrer une fonctionnalité complète.

## Cycle Agile

```text
Idée ou problème terrain
  ↓
User story dans le backlog
  ↓
Priorisation
  ↓
Sprint planning
  ↓
Développement
  ↓
Test fonctionnel
  ↓
Feedback vendeur
  ↓
Rétrospective
  ↓
Adaptation du backlog
```

## Gestion du backlog

Le backlog doit être organisé par valeur business :

| Priorité | Sens |
|----------|------|
| P1 | Indispensable pour vendre ou tester le MVP |
| P2 | Important pour améliorer l'expérience |
| P3 | Utile mais non bloquant |
| P4 | Idée future ou amélioration post-MVP |

Chaque user story doit avoir :

- un identifiant ;
- un utilisateur cible ;
- un besoin clair ;
- une valeur métier ;
- une priorité ;
- une estimation ;
- des critères d'acceptation.

## Format des user stories

```text
En tant que [type d'utilisateur],
je veux [action ou fonctionnalité],
afin de [valeur ou bénéfice].
```

Exemple :

```text
En tant que vendeur,
je veux créer un produit avec photo, prix et stock,
afin de construire mon catalogue sans aide technique.
```

## Definition of Ready

Une user story est prête à entrer en sprint si :

- le besoin est compréhensible ;
- l'utilisateur cible est identifié ;
- les critères d'acceptation sont écrits ;
- les dépendances sont connues ;
- la story est assez petite pour être terminée dans un sprint ;
- la priorité est claire.

## Definition of Done

Une fonctionnalité est terminée si :

- le code est implémenté ;
- les erreurs principales sont gérées ;
- l'interface fonctionne sur mobile et desktop si elle est visible par l'utilisateur ;
- les routes/API nécessaires sont connectées ;
- les données sont sauvegardées correctement ;
- le scénario principal a été testé ;
- la documentation est mise à jour si nécessaire ;
- la fonctionnalité peut être montrée à un vendeur pilote.

## Tableau Kanban

Colonnes recommandées :

| Colonne | Usage |
|---------|-------|
| Idées | Opportunités, retours vendeurs, inspirations |
| Backlog | Stories retenues mais pas encore planifiées |
| À faire | Stories sélectionnées pour le sprint |
| En cours | Travail actif |
| À tester | Développement terminé, test nécessaire |
| Feedback vendeur | À valider avec un utilisateur pilote |
| Terminé | Fonctionnel et validé |

Limiter la colonne "En cours" à 1 ou 2 tâches évite de disperser l'effort.

## Cérémonies légères

### Sprint planning

Durée : 30 à 45 minutes.

Questions :

- Quel est l'objectif du sprint ?
- Quelles stories apportent le plus de valeur maintenant ?
- Qu'est-ce qui peut réellement être fini en 2 semaines ?
- Quel test vendeur sera réalisé à la fin ?

### Point d'avancement

Durée : 10 minutes, 2 à 3 fois par semaine.

Questions :

- Qu'est-ce qui est terminé ?
- Qu'est-ce qui bloque ?
- Quelle est la prochaine petite action ?

### Sprint review

Durée : 30 minutes.

Objectif : montrer une version utilisable, pas seulement expliquer ce qui a été codé.

Questions :

- Le vendeur comprend-il l'écran sans explication longue ?
- La fonctionnalité réduit-elle vraiment une douleur ?
- Qu'est-ce qui manque pour que le vendeur l'utilise demain ?

### Rétrospective

Durée : 30 minutes.

Questions :

- Qu'est-ce qui a bien fonctionné ?
- Qu'est-ce qui a ralenti le sprint ?
- Quelle habitude doit changer au prochain sprint ?
- Quelle décision produit a été confirmée ou invalidée ?

## Plan de sprints MVP

### Sprint 0 — Recherche IA et cadrage sans interviews

Objectif : cadrer le produit à partir de recherches internet, de benchmarks concurrents et d'hypothèses documentées, sans organiser d'interviews au démarrage.

Livrables :

- synthèse de recherche marché et social commerce ;
- benchmark WhatsApp Business, Shopify Starter, Flutterwave Store, Bumpa et outils proches ;
- hypothèses prioritaires à vérifier plus tard par l'usage réel ;
- promesse produit provisoire ;
- backlog initial adapté au développement assisté par IA ;
- choix du périmètre MVP.

### Sprint 1 — Base vendeur et boutique

Objectif : permettre à un vendeur de créer son espace.

Livrables :

- inscription vendeur ;
- connexion vendeur ;
- profil boutique ;
- slug ou lien public boutique ;
- structure de navigation vendeur.

### Sprint 2 — Catalogue produits

Objectif : permettre au vendeur de publier ses produits.

Livrables :

- création produit ;
- modification produit ;
- suppression ou archivage produit ;
- image principale ;
- prix, stock, catégorie ;
- affichage des produits dans la boutique publique.

### Sprint 3 — Commandes

Objectif : recevoir et suivre les premières commandes.

Livrables :

- formulaire de commande public ;
- création de commande ;
- dashboard des commandes ;
- détail commande ;
- changement de statut.

### Sprint 4 — WhatsApp assisté et tests pilotes

Objectif : connecter l'outil au comportement réel des vendeurs.

Livrables :

- bouton message WhatsApp ;
- modèles de messages ;
- relance paiement ;
- confirmation commande ;
- tests avec 3 à 5 vendeurs pilotes.

### Sprint 5 — Beta payante

Objectif : préparer une première monétisation.

Livrables :

- limites offre gratuite ;
- page d'offre ;
- indicateurs dashboard ;
- correction des retours pilotes ;
- proposition d'abonnement aux premiers vendeurs.

## Indicateurs Agile produit

Mesures à suivre à chaque sprint :

- nombre de stories terminées ;
- nombre de bugs bloquants ;
- nombre de vendeurs testés ;
- nombre de produits créés par les vendeurs ;
- nombre de commandes reçues ;
- temps nécessaire pour créer une boutique ;
- feedback principal du sprint ;
- décision : continuer, modifier ou retirer une fonctionnalité.

## Règle de décision produit

À la fin de chaque sprint, classer chaque hypothèse dans une des catégories suivantes :

| Statut | Sens |
|--------|------|
| Validée | Les vendeurs utilisent ou demandent clairement la fonctionnalité |
| À améliorer | Le besoin existe, mais l'implémentation bloque |
| Non validée | Peu ou pas d'intérêt observé |
| À reporter | Intéressant, mais pas nécessaire pour vendre le MVP |

Cette règle aide à éviter de construire un produit trop large avant d'avoir des utilisateurs actifs.
