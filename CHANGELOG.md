# Changelog

## [2.6.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.5.0...v2.6.0) (2026-08-23)


### Features

* add MenuItem and FooterBlock models with serializers and admin interfaces; update SiteConfigView and Footer component to include new data ([861a469](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/861a46958d9f354957e906e910dfca58f9b2b6b1))
* add SellerNotification model, views, and serializers; implement notifications for sellers ([1ed11fb](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1ed11fb1fea42f5940964aea5b1bba6664410adf))
* add SellerProductManage component for managing seller products ([7bd1874](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/7bd1874d7c20ec505ac0e7b42b967dfc4944b442))
* add SellerStats page and update SellerDashboard links ([cffcc07](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cffcc07f3647ddf8ff16c492a49060bd8e7682b6))
* add SubscriptionSuccessModal component with animations for successful subscription feedback ([697a3d0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/697a3d0f1252a170463cb6809972c57daaa42298))
* add TypeScript support and improve API documentation ([bc4cdb3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bc4cdb31bfa25dc92cc20677e4d8fb94d3e21afa))
* **core:** US-1802 — taux d'activation vendeurs sur dashboard admin ([bbac826](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bbac826b81a068510f1ee27d1138255b2554e7d2))
* **dashboard:** add MRR, ARPU, and churn metrics to seller dashboard ([01c2642](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/01c2642179f7289a2e9f64529def84b501e0881e))
* **dashboard:** enhance seller dashboard with period and date range filters ([e2f422a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e2f422a658a72ec41707de175d429ff6fce563bf))
* **dashboard:** KPIs plateforme ANIF Seller (global + par plan) ([430a9e4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/430a9e43d4ae9b4a865d797afe8769ebd567fb53))
* **docs:** update economic model document and reintroduce UX conversion techniques ([0be2229](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0be2229cd1cc4d03e6fac59f07485508b234f600))
* enhance product limit notifications and upgrade prompts across seller pages ([83dd5ff](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/83dd5ff623547f72b3908a18539c297e0e2a80b0))
* enhance SellerOrders page with improved order filtering and status management; add SellerShopPage for shop sharing functionality ([cf66dd3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cf66dd34c7e586cc47a39494e91337d180d9d114))
* implement SellerShopPage with shop editing functionality and delivery zone management ([7e7709c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/7e7709c8d616b9520f24790bbde5bef1c77b329f))
* **notifications:** add seller notifications inbox ([6d9c0e2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6d9c0e26f00b1c5087b5cbd14ab52cdb739b328c))
* **notifications:** add sensitive action notifications and related middleware ([f031523](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f0315234a12a05bdac014052acb02cae61e677ad))
* remove unused seller state from SellerDashboard component ([c132f56](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c132f56f092c450712809810566f02cb4f3095e6))
* **seller-stats:** gate advanced stats behind Pro plan ([3142f00](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3142f00eb4c7054304c08f26f09979a7bce75d16))
* **sellers:** rappel d'expiration abonnement vendeur (1j/2 pendant 7j avant ends_at) ([19e2668](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/19e26683af42fafd1f202df450552d66fadac5ed))
* update BUSINESS plan pricing and features; enhance SellerDashboard and SellerPlan components ([364141a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/364141a9682dd85d086a2b799effce193f9c1cdb))
* update seller plan limits and dashboard metrics; remove basic customization features ([aeb63c8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/aeb63c8c324e6413c89553e54386972bbda4f679))
* **workflow:** add daily subscriptions management workflow with reminders and expirations ([deabf11](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/deabf115c8cd0ac9596a3b344acba717d14e0b17))


### Bug Fixes

* add missing jsdom dev dependency for vitest ([a231e0c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a231e0cef0a2abfb99d6acf2ddec33802d5692b8))
* add missing recharts dependency for SellerStats ([bce6a9b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bce6a9b756e51a86ef39605d8410c6d93956cc26))
* correct 'selle.localhost' typo to 'seller.localhost' in 4 frontend files ([007e8b9](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/007e8b94ec54385f3ca2daf73227aa304a5106ac))
* **limits:** set max_orders_per_month for STARTER plan to 100 ([fe12e8e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fe12e8e93edb1ebc349f03a5ce803bf8d32fd3fa))
* remove unused BellIcon import and handleShopSave in SellerSettings ([8f228b8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/8f228b83418a0a56097aee388bb6e9f60314a2ca))
* **seller-dashboard:** handle fetch errors to prevent infinite loader ([bb51473](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bb514739e0d106a4f698cdf240021ae5ebf1144e))
* SellerDashboard ne charge pas - mapper la reponse backend et corriger le param period ([11fc0ca](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/11fc0ca12112dd8465e17830442ba36b281bf55b))

## [2.5.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.4.0...v2.5.0) (2026-08-20)


### Features

* feat:  ([e6393a8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e6393a8c93f5b3304d6e9068e1973ca48950890d))
* feat:  ([440a885](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/440a885394c91894aac2ed59b0a860b7c93d5118))
* add image gallery to SellerProductDetail page ([e583865](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e5838659f2fe72a290a19bdc0e6ca21a43ecab2d))
* **frontend:** support selle.localhost as seller subdomain in local dev ([f625da7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f625da7862cd741110e9d7276d53e8adb9da458b))


### Bug Fixes

* **seller:** add /shop/:slug redirect to /:slug on seller subdomain ([9bf5c5a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9bf5c5ad8774cc110ab97cb0b95894530f1bb545))
* **seo:** enhance SEO title for product pages based on category ([ea28f28](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ea28f281e64b07ea0ad2c503871588dfc1911f1d))

## [2.4.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.3.0...v2.4.0) (2026-08-15)


### Features

* **seo:** enhance structured data and add SEO to missing pages ([6f92e9f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6f92e9fc804b99bc96654ba090843f2b0c051e36))


### Bug Fixes

* **seo:** update default description for improved clarity and relevance ([9ba1517](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9ba1517db17702dc95b4744b35206495f88e84b2))

## [2.3.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.2.0...v2.3.0) (2026-08-15)


### Features

* **fedapay:** enhance payment status handling and improve comments ([5645da0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/5645da0f041217280f83ca2695fdd27f06cadd82))
* **paiement:** migrer FedaPay vers Checkout.js (modale intégrée) ([2eec0e6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2eec0e69b46438094adb93a16faa0b257854a93e))
* **paiement:** vérifier et resynchroniser le statut FedaPay côté confirmation ([729e0f5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/729e0f550dd4c90c887a51a2b8b3c55a5fffc889))


### Bug Fixes

* **docs:** correct branch name in AGENTS.md and clarify model identification in task execution ([1e728ae](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1e728ae144a3dbc374ec26872b71928a548a5510))
* **fedapay:** use widget object API with public_key and named constants ([6ec1467](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6ec1467645fc9085e621ffd6d36b6b7a502c9955))

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
