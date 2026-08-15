# Changelog

## [2.2.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.1.1...v2.2.0) (2026-08-13)


### Features

* feat:  ([bc677b7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bc677b7b70eea0d79cdad6144d251c2651e3f82d))
* **admin:** update ShopAdmin to include seller in list_display and add list_select_related ([6c958bc](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6c958bc8ae8b73e4417cba62d1166e7d545e4124))
* **github:** add local command for GitHub projects integration ([a0d5021](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a0d502167ee7ef6eb8583175423abc4bb4b6627b))
* **limits:** aligner les limites des offres vendeurs sur le modèle économique (FREE 5/5) ([1b82799](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1b8279953738092ba4bd7290d059acfcc5bd2952))
* **pricing:** restructure pricing model and clarify service tiers ([c983b51](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c983b512799ac103ac8eff189c9ec79b8a7c2cdd))
* **sellers-admin:** rendre SellerProfile et Shop en lecture seule dans l'admin ([2e46c79](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2e46c79c874776ce768e4c83fa3c336ed8105a08))
* **sellers:** ajouter le modèle SellerSubscription et son CA en carte KPI admin ([588c92b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/588c92ba669fe5a7cd4e516991b944daf18ef70d))
* **sellers:** remplacer le plan binaire FREE/PAID par 4 paliers FREE/STARTER/PRO/BUSINESS ([3ca554c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3ca554c98622da16d21d45634c49dc3bb52b0414))


### Bug Fixes

* **pricing:** align seller landing offers with economic model (Gratuit 5/5, Starter, Pro) ([2904639](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/29046399eaeb0eceb955dff38aede66120c5c8d3))
* **pricing:** mark Starter and Pro as coming soon on seller landing ([86ab640](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/86ab6403f7671c53a011e7609dcc3622b618ba7b))
* **pricing:** Starter fondatrice à 2 000 F/mois les 3 premiers mois puis 5 000 F/mois ([e10ba19](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e10ba19743e1be1a7c655a83ae18c6b7c6d9cc50))
* **pricing:** update Starter plan price to 5,000 FCFA ([9730cd4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9730cd454b769a016fcc6caf9b37b4a808e63c5a))
* **pricing:** update Starter plan price to 5,000 FCFA/month ([de0e0eb](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/de0e0eb77b0d94c8ced0e70e91552c3e0a059a19))

## [2.1.1](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.1.0...v2.1.1) (2026-08-13)


### Bug Fixes

* **seller:** update dashboard label from 'Tableau de bord' to 'Acceuil' ([57813b7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/57813b78bb9ebacffd763246454970b2d9216a22))
* **seller:** update dashboard label from 'Tableau de bord' to 'Acceuil' ([ed008e5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ed008e5670d1566694ad0e6def8aeed742b624e5))

## [2.1.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.0.0...v2.1.0) (2026-08-13)


### Features

* **products:** arbre de catégories à 3 niveaux ([7e2831c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/7e2831c6fdd9514afda57b0f9a5390072f2cb486))
* **products:** arbre de catégories à 3 niveaux (release-please) ([b2e3697](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b2e3697f3c987b4d9af822a90236e9ecda73c58d))
* **products:** produits en L1/L2/L3 et branche Alimentation simplifiée ([98ae9c7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/98ae9c71ca913c49dae9b35900918086474d0374))
* release ([37bdf7d](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/37bdf7d3f2eaca76d4eae7b2f9fcec4fab128922))
* **seller:** refonte nav mobile avec bouton + et profil vendeur ([907ccf7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/907ccf74896de2bd3cbf41088cd85e5bb9af6a14))
* **seller:** séparer l'ajout de produit (/products/new) de la liste (/products) ([cc3effc](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cc3effcf861d62c9a43fc0cc390d29b159077366))


### Bug Fixes

* **backups:** add reminder to run migrations after restoring prod dump locally ([b545fe0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b545fe0e92372bb0366bf1e4567bae8f1a74d95a))
* **products:** get_leaf_paths vise le vrai niveau 3 et slugs de type uniques ([4ac4205](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/4ac4205d816ac82c7232a7d7de56445ecdd4b624))
* **products:** slugs de type Sport uniques, disjoints des slugs racines ([f834fda](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f834fda881eacc9dca8b7a1469c7d814606c1844))
* **seller-products:** permettre la création sans stock et envoyer 0 par défaut ([2cd2248](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2cd2248be94439331b714ea86f230255c059ad11))
