# Sprint 0 — Recherche IA sans interviews

[← Retour](README.md)

## Décision de départ

ANIF Seller sera développé avec l'aide de l'IA. Le Sprint 0 ne repose pas sur des interviews vendeurs : il sert à cadrer rapidement le produit avec des recherches internet, un benchmark concurrentiel et des hypothèses explicites à vérifier plus tard par l'usage réel.

## Objectif du sprint

Produire assez de clarté pour lancer le Sprint 1 sans surconstruire :

- marché et usages à cibler ;
- concurrents et standards fonctionnels ;
- promesse produit provisoire ;
- périmètre MVP ;
- brief exploitable par l'IA pour générer maquettes, code et tests.

## Sources consultées

| Source | Ce qu'elle apporte |
|--------|--------------------|
| DataReportal — Digital 2024 Benin : https://datareportal.com/reports/digital-2024-benin | Internet, réseaux sociaux et progression des usages digitaux au Bénin |
| DataReportal — Digital 2025 Benin : https://datareportal.com/reports/digital-2025-benin | Croissance récente des identités social media au Bénin |
| DataReportal — Digital 2026 Benin : https://datareportal.com/reports/digital-2026-benin | Continuité de la croissance social media |
| GSMA — State of the Industry Report on Mobile Money : https://www.gsma.com/sotir/ | Dynamique mobile money et paiements marchands |
| WhatsApp Business — Features : https://whatsappbusiness.com/products/business-app-features/ | Catalogue, liens catalogue et commandes dans WhatsApp |
| WhatsApp Help Center — About catalog : https://faq.whatsapp.com/405903568419894 | Fonctionnement officiel du catalogue WhatsApp Business |
| Shopify Help Center — Starter plan : https://help.shopify.com/manual/intro-to-shopify/pricing-plans/plans-features/shopify-starter-plan | Positionnement social selling via liens produit |
| Flutterwave Store : https://flutterwave.com/store | Boutique en ligne simple pour marchands africains |
| Bumpa — Meta integration : https://www.getbumpa.com/blog/announcing-the-meta-integration-on-the-bumpa-app | Gestion de ventes et messages Instagram/Facebook depuis un outil marchand |

## Synthèse marché

- Le Bénin reste un marché digital en croissance mais pas encore massivement mature : DataReportal indique 4,69 millions d'internautes au début 2024, soit 33,8 % de pénétration internet, et 2,15 millions d'utilisateurs social media, soit 15,5 % de la population.
- Les usages social media progressent vite : DataReportal indique une hausse de 95,5 % des utilisateurs social media entre début 2023 et début 2024, puis une croissance d'environ 11 % sur les périodes suivantes publiées pour 2025 et 2026.
- Le commerce conversationnel est cohérent avec le contexte : WhatsApp Business met déjà en avant catalogue, collections, liens de catalogue et commandes dans WhatsApp.
- Le mobile money est un levier important pour la suite, mais pas forcément pour le premier écran du MVP. La GSMA indique que les paiements marchands sont un des cas d'usage mobile money en forte croissance.

## Benchmark rapide

| Produit | Positionnement | À retenir pour ANIF Seller |
|---------|----------------|----------------------------|
| WhatsApp Business | Catalogue et conversation client dans WhatsApp | Très familier, mais faible pilotage global des commandes, stock et statistiques |
| Shopify Starter | Vendre via liens sur réseaux sociaux et messageries | Le lien produit partageable est un standard clair |
| Flutterwave Store | Boutique gratuite avec produits et paiements | Utile comme référence africaine, mais peut sembler orienté paiement avant gestion quotidienne |
| Bumpa | Gestion mobile-first des ventes, inventaire, messages et commandes | Référence forte pour social commerce africain ; prouve l'intérêt d'un tableau de bord simple |

## Hypothèses produit

Ces hypothèses ne sont pas encore validées par interviews. Elles guident seulement le MVP.

| Hypothèse | Implication MVP |
|-----------|-----------------|
| Les vendeurs veulent continuer à vendre via WhatsApp plutôt que changer complètement d'outil | ANIF Seller doit compléter WhatsApp, pas le remplacer |
| Le premier besoin est de clarifier produits, commandes et suivi | Prioriser catalogue, commandes, statuts et dashboard |
| Le vendeur veut partager un lien simple | Générer une boutique publique avec slug partageable |
| Le client final ne veut pas forcément créer un compte | Autoriser la commande publique sans inscription client |
| Les paiements sont importants mais peuvent venir après le flux commande | Mettre FedaPay/KkiaPay en phase post-MVP si le flux manuel marche |

## Promesse provisoire

> ANIF Seller aide les vendeurs WhatsApp et Instagram à transformer leurs messages de commande en boutique simple, catalogue clair et tableau de bord de suivi.

Version plus courte :

> La boutique simple pour vendre sur WhatsApp sans perdre tes commandes.

## Périmètre MVP recommandé

À construire avant les fonctionnalités avancées :

- inscription et connexion vendeur ;
- profil boutique avec nom, ville, téléphone WhatsApp et slug ;
- création/modification/masquage de produits ;
- boutique publique mobile-first ;
- commande sans compte client ;
- dashboard vendeur avec commandes du jour, commandes en attente et statuts ;
- génération d'un message WhatsApp de confirmation.

À repousser :

- paiement automatique ;
- abonnement payant ;
- domaine personnalisé par vendeur ;
- analytics avancées ;
- intégrations Meta avancées ;
- application mobile native.

## Brief IA pour Sprint 1

Construire dans l'application existante un espace vendeur ANIF Seller sous `https://sell.anifowoche.com`, en conservant React/Vite, Django REST Framework, JWT et PostgreSQL. Le MVP doit être mobile-first, simple pour un vendeur non technique, et centré sur trois objets : boutique, produit, commande.

Contraintes :

- ne pas remplacer WhatsApp ;
- générer des liens et messages compatibles WhatsApp ;
- ne pas obliger le client final à créer un compte ;
- garder les routes existantes ANIFOWOCHE intactes ;
- documenter les décisions produit au fil des sprints ;
- développer avec l'IA à partir de user stories courtes et critères d'acceptation vérifiables.

## Tâches Sprint 0

| Tâche | Statut |
|-------|--------|
| Rechercher les données Bénin/social commerce/mobile money | Fait |
| Benchmarker WhatsApp Business, Shopify Starter, Flutterwave Store, Bumpa | Fait |
| Remplacer les interviews par des hypothèses documentées | Fait |
| Définir la promesse provisoire | Fait |
| Définir le périmètre MVP | Fait |
| Préparer le brief IA du Sprint 1 | Fait |

## Critère de fin Sprint 0

Sprint 0 est terminé quand le Sprint 1 peut démarrer sans interview, avec un périmètre clair, un backlog priorisé et des hypothèses assumées comme provisoires.
