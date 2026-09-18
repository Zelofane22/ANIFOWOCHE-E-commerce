# Changelog

## [2.13.2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.13.1...v2.13.2) (2026-09-18)


### Bug Fixes

* **frontend:** corrige les vulnerabilites detectees par npm audit ([3c26bfa](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3c26bfa3c7326ee9219acd89a3c29eea7ea951d3))
* **frontend:** filtre les deprecations ReportingObserver dans Sentry ([dd274f6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/dd274f65f54ba864cf3d3d1025406121e4d26c44))
* **frontend:** filtre les deprecations ReportingObserver dans Sentry ([d570cf6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d570cf6cd1c31a924ee18c9a426660678c27701a))

## [2.13.1](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.13.0...v2.13.1) (2026-09-01)


### Bug Fixes

* **catalogue:** corrige accès www.anifowoche.com/catalogue et 500 store/status ([3fa6751](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3fa675165070d033c18d42d10baf55b22eb626dd))

## [2.13.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.12.0...v2.13.0) (2026-08-29)


### Features

* **seller:** permettre ajout images supplémentaires dans ProductFormMobile avant création ([625122e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/625122e1b9a64bd2863374d1f3fd69097a883465))


### Bug Fixes

* **ci:** remove pull_request trigger from CI workflow ([ce92ce5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ce92ce5807713fd525bede5e1a877b1a78047e3b))
* **delivery:** corriger test guest checkout pour requires_delivery ([65d8a46](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/65d8a46ffdaab83d4966a0115e5abcb6b8eac821))
* **frontend:** corrige lint maintenanceMode dans PhotoGallery ([6cae515](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6cae5158303f044cbdca8e7004642b33e7ec2ea5))
* **frontend:** corrige lint maintenanceMode dans PhotoGallery ([1971ea3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1971ea3823ec6bafd62fab5249659c7d08fadeea))
* **frontend:** mode maintenance boutique désormais visible et bloquant ([b44e67c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b44e67c777a6b60a3503d0771507d0504db147c4))
* **frontend:** remove "Voir le produit" button from ProductCard and PublicShop components ([0584618](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0584618f1349b3d805031447a4a630e53f126297))
* **maintenance:** suspend aussi les actions vendeur ([2b00cfa](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2b00cfac04306dfe5ecc00ed65b493a9d2581085))
* optimize image upload process in ProductForm and ProductFormMobile ([b6a3904](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b6a39048024f40baf2813b08a798f6d992d38a93))
* remove seller product commission ([d099e27](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d099e276195b6c04dbef68dac889e9c6942d86f3))
* **seller:** rendre galerie mobile visible après création produit (correction bouton Enregistrez le produit) ([b1b27f6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b1b27f601eddca7a2c8471f69538233b31ca5f32))
* simplify seller financial preview ([92a7e58](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/92a7e587d87e9b26fadb846e0d181f512a502b19))

## [2.12.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.11.0...v2.12.0) (2026-08-28)


### Features

* delivery method per item (delivery/pickup) ([c47cda3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c47cda3d896320c1c855491d025590bc34b9125b))
* **order:** add WhatsApp contact option with order details in confirmation ([655265c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/655265c59fb85f4e867f0cf2be76f483d5e568b4))
* **order:** include order details in confirmation state for improved display ([d4e0ce6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d4e0ce68273237205d3d972e95ff403252ac6efb))
* **seller:** permettre au vendeur de réactiver un produit archivé ([bed4304](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bed43040253b9de481f44fa77cb4c4447ae7a91d))
* **seller:** update StatCard component to accept additional className prop ([23d2731](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/23d27317ac51a6eba0fbe3288a58fcd461f4c715))
* update public order and shop routing, remove deprecated paths ([ed4ba1f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ed4ba1fc0f3f074489251ad40a10f7519c9e4aa5))


### Bug Fixes

* **notifications:** ensure email check for seller notifications is correctly placed ([23d2731](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/23d27317ac51a6eba0fbe3288a58fcd461f4c715))
* **order:** pass shopSlug to order details for improved navigation ([b62f570](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b62f570dd847a0d042d1bcffba5270a2d547a3a3))
* **SellerOrders:** initialize activeFilter state from searchParams for improved filtering ([23d2731](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/23d27317ac51a6eba0fbe3288a58fcd461f4c715))
* **seller:** redirect connected sellers away from landing, auto-redirect to products after save ([f3f581e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f3f581e53b76ef29a5ddf308096733b4cf5b3009))
* **seller:** wrap seller routes in CartProvider for improved cart management ([5a4ff92](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/5a4ff92cdf09e01c941e28755e19fbcba66ad7e6))

## [2.11.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.10.0...v2.11.0) (2026-08-27)


### Features

* **sellers:** update free plan limits to allow 50 active products ([93e9f83](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/93e9f830d890a3630c99cf2476d997af49d0ed7b))
* **sellers:** update free plan limits to allow 50 active products ([b541731](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b5417313b5b6f7a36a641683654a1b2e235b39b1))

## [2.10.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.9.0...v2.10.0) (2026-08-25)


### Features

* **sellers:** autoriser plusieurs boutiques officielles exemptées des limites ([712d333](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/712d33342690656df789f5d81b5058282de1cfea))
* **sellers:** autoriser plusieurs boutiques officielles exemptées des limites ([2dde970](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2dde97024980bfed0757b4362122c5883a678ce3))

## [2.9.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.8.0...v2.9.0) (2026-08-25)


### Features

* **ui:** enhance Navbar and Checkout components with improved styling and cart adjustment notice ([1b27cd5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1b27cd5bbd8db8c5685c5e525fda7fcc80ce37a2))


### Bug Fixes

* **catalogue:** fetch products and categories together, update available categories logic ([fd171e5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fd171e5c7853b98663d05f98b23d6458d0647435))

## [2.8.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.7.0...v2.8.0) (2026-08-24)


### Features

* **ui:** ScrollToTop au changement de page ([1d0227c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1d0227cef87a69feb42ac41c221495a23a753184))
* **ui:** ScrollToTop sur le sous-domaine vendeur ([2fcef07](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2fcef0792f9e3ef3f745b93138bd975da3dbe3ef))


### Bug Fixes

* remove Cart tab from MobileTabBar component ([942b762](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/942b76237be26423e928023e94673d85114fe54b))
* remove unused Cart context and import in MobileTabBar component ([6d587c4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6d587c442c70a88ab06b751c113e5890fdfb6d96))

## [2.7.0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/compare/v2.6.0...v2.7.0) (2026-08-24)


### Features

* feat:  ([e6393a8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e6393a8c93f5b3304d6e9068e1973ca48950890d))
* feat:  ([440a885](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/440a885394c91894aac2ed59b0a860b7c93d5118))
* feat:  ([bc677b7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bc677b7b70eea0d79cdad6144d251c2651e3f82d))
* add address management, order details, and wishlist functionality ([3cbc8a3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3cbc8a3a1b59c529754be299b236ccc388d73994))
* add admin guide and architecture documentation for seller management ([5548d7c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/5548d7c24dc06c243f78c257ae21d3270953778b))
* add cash on delivery payment method, enhance payment settings, and update UI components ([a739905](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a7399053e9c218f95fb1fb0cd4edc5945ca9981d))
* add Cloudflare configurations for various services in opencode.json ([16d24b3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/16d24b3db62319fa665c0c27f9014e909e50fc90))
* add Cloudinary configuration to settings and update requirements; include logo ([c4c2ed5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c4c2ed5b0547308d76492287955ecb2827ce71fa))
* add color support to products and orders, including color selection in cart and checkout ([50d8935](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/50d89350f850f02c8ae6f7721ed58489611efa9d))
* add command to create default superuser in build script ([dcbdcd0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/dcbdcd0584ef268fbaeb990a7a06008cc72d38c2))
* add command to create default superuser in build script ([2cd3a56](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2cd3a56d28afd8dab886f1aeed05c9584ce5915d))
* add delivery zone to orders and update related components ([e5419ee](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e5419eee7182cb4fc3d8f1de235ae9b20c808829))
* Add detailed docstrings and comments across various modules for better code clarity ([24c9219](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/24c92194bd7cb696cf5182557034cb90662e1cd1))
* add email notification for database backup failures and create failure email template ([6ea8f61](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6ea8f613f06df15c64928b75ee4ba7eb1f03d136))
* add email notification for database backup failures and create failure email template ([d8e5afc](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d8e5afc4e57e1f43e38144f22d22c7c79c36a0a0))
* add image gallery to SellerProductDetail page ([e583865](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e5838659f2fe72a290a19bdc0e6ca21a43ecab2d))
* add logo image and update Navbar and Footer components to use logo ([a6a13ea](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a6a13ea0f9ee3a3a4b340b201bd5ba687ad352cd))
* add logo image and update Navbar component to display logo with text ([f6bb769](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f6bb769e48a39c352b8342ca94a632165477c941))
* add logo image and update Navbar component to display logo with text ([552f6f0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/552f6f0c1b1f2f68fa0c5a3d7e2604f658ea4e7f))
* add MenuItem and FooterBlock models with serializers and admin interfaces; update SiteConfigView and Footer component to include new data ([861a469](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/861a46958d9f354957e906e910dfca58f9b2b6b1))
* add opencode configuration for remote rendering and update error handling in ProductView ([4def4a0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/4def4a06dd1ceed36d8b0e7c265f6dc9e6a40695))
* add opencode configuration for remote rendering and update error handling in ProductView ([bded3de](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bded3defbf3edc375465b43b2b3cb8ebd0fbc102))
* add order reference property and update admin display; enforce authentication for order creation and checkout ([6efa8e8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6efa8e8c6d9ed65e0da266571743f2f6571426be))
* add order reference property and update admin display; enforce authentication for order creation and checkout ([12ff84f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/12ff84fc0bb86d7401aa601ad0ede4a516466b9b))
* add order status update functionality for sellers with corresponding API and UI integration ([eabd193](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/eabd1939e223b107307c4ec2c0baaac73c2260b5))
* add origin normalization for CSRF and CORS settings in backend configuration ([dc09caf](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/dc09caf68646f4ae25e10e018546f578c7dc4088))
* add origin normalization for CSRF and CORS settings in backend configuration ([a0bfe3e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a0bfe3e3324138bac41fe23356a2e978e9fcce1b))
* add payment relaunch functionality for sellers with corresponding API and UI updates ([ca46bda](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ca46bda37357e9761f5fdaaf84b5bc74faa46cf6))
* add plan field to SellerProfile and implement product visibility tests ([f33fc44](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f33fc44719c97008ba79035fdd09ff7d7e2eb3be))
* add plan field to SellerProfile and implement product visibility tests ([876648a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/876648a91f60a5e94ff726bd95c82f161ce17648))
* add product image management functionality in SellerProducts ([89ccaa5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/89ccaa504ce90f0f71054c986d09808a4493c90d))
* add production investigation guidelines and Render MCP tools usage to AGENTS.md ([0e1cefc](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0e1cefcfa8358c49a9f3f6c552637eee3fa9b426))
* add publicClient for public API requests and update delivery and product API calls ([3f40aad](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3f40aadba671ee241bb71b7bace81147763f8e85))
* add publicClient for public API requests and update delivery and product API calls ([fe30ff2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fe30ff26c9453184421e13745a38dd05dfaf2841))
* add seller name to product details and enhance product serializer ([2969ad8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2969ad856b6691ea5039848414d32f56f0fc01dd))
* add seller product catalogue ([5656283](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/5656283d44fbaf1b60c7b727ab882d0f43171ac7))
* add seller profiles and shops section to admin interface ([71b9f36](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/71b9f36e7aac07df911de534482238121efb5550))
* add SellerLanding page with features overview and onboarding steps ([a141188](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a141188434208a7f43e9f7691d37837421dd1b1b))
* add SellerLanding page with features overview and onboarding steps ([2f91241](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2f912410815371466f76cfe0f87bfd170e1f9d04))
* add SellerNotification model, views, and serializers; implement notifications for sellers ([1ed11fb](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1ed11fb1fea42f5940964aea5b1bba6664410adf))
* add SellerProductManage component for managing seller products ([7bd1874](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/7bd1874d7c20ec505ac0e7b42b967dfc4944b442))
* add SellerStats page and update SellerDashboard links ([cffcc07](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cffcc07f3647ddf8ff16c492a49060bd8e7682b6))
* add shop association to products and enhance product image management ([23c5f2c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/23c5f2cbc0f1fbd2cfe0a0a1127cddafdc36b415))
* add SubscriptionSuccessModal component with animations for successful subscription feedback ([697a3d0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/697a3d0f1252a170463cb6809972c57daaa42298))
* add TypeScript support and improve API documentation ([bc4cdb3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bc4cdb31bfa25dc92cc20677e4d8fb94d3e21afa))
* add Vercel configuration to opencode.json ([545921a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/545921a4b98f0587d680a4c144b8f5b5354e0301))
* add wireframes and mockups for MVP screens in maquettes.md ([af69a1c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/af69a1c00e36798ef3d1f1e6e92e20dc9bccb131))
* **admin:** add action to send welcome email to new users ([413e7b9](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/413e7b9e19180ca1488d3edeef9bed4d35e582fa))
* **admin:** add action to send welcome email to new users ([d711352](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d7113523f3a4a75fc52f05299fae3f8deebced62))
* **admin:** add predefined admin roles (US-35) ([6f71430](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6f71430cda17639f81de44f8858866bab4401f47))
* **admin:** add welcome email action and inline forms for client profile and address ([0c45c70](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0c45c7055476cd7acf8eebacdca5d122d28422ae))
* **admin:** add welcome email action and inline forms for client profile and address ([4f4aa57](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/4f4aa572863616e594ffefb07b45db269c64244d))
* **admin:** dashboard admin Django stylisé (django-unfold) + modules associés ([e5532d4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e5532d46262beac47c5a2d928f531a15be936a65))
* **admin:** enrich sales reports ([79fa707](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/79fa7072233398e7818760e37582de92fdc8db6c))
* **admin:** turn dashboard into actionable hub with filtered links ([85dbff0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/85dbff0816cd1c99522ee9f648ba6b70829aa033))
* **admin:** unify admin tokens and complete dark mode ([47f2f06](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/47f2f06d8c73337799c2f5e2a85f6ce6b776ed5f))
* **admin:** update ShopAdmin to include seller in list_display and add list_select_related ([6c958bc](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6c958bc8ae8b73e4417cba62d1166e7d545e4124))
* **appearance:** add CMS foundation for site theming (E14 US-50/51/53) ([89fcf91](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/89fcf91e65306233c7ae87aa1db5241afd7afd1b))
* **appearance:** add CMS foundation for site theming (E14 US-50/51/53) ([80429ce](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/80429cea5bbf42eb64cf64510b5b95fb31c21322))
* **auth:** handle email delivery failure in password reset request and log errors ([61050e6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/61050e6a558a20be1fb4b97c578480f64e937487))
* **auth:** implement email and phone authentication backend with normalization ([0301754](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/03017546a0e09312d26197a0549c186e0a60ca44))
* **auth:** implement password reset functionality with request and confirmation endpoints ([f7e0e06](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f7e0e068d6f1f408d4354578225f3375c82ba722))
* **auth:** implement password reset functionality with request and confirmation endpoints ([ba1bb1f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ba1bb1f52c2542521ba4fa7b330bb299748d69d7))
* **auth:** refresh silencieux proactif des tokens JWT ([cab2b15](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cab2b1586a0c4d66b35db8cabf554b9da6f20652))
* **auth:** refresh silencieux proactif des tokens JWT ([ab34955](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ab349557a3f3c92bab3380570c3e96bc13b8b72e))
* **cart:** réconciliation robuste du panier via validate-cart endpoint ([5b57b10](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/5b57b101e81b2ddc60782182298a52c1a10eced2))
* **catalogue:** filtres prix/unité/disponibilité + tri, délégués au serveur ([816f0e0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/816f0e06e2a395f8d01a2534afc6ee06caa1df0a))
* configure Sentry DSN for backend and frontend, update documentation for monitoring setup ([1447160](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/14471606c00df00f0429b16e550c9693015157de))
* **content:** API bannières + carrousel accueil ([7be9dc1](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/7be9dc1ab4585c956e3edb5f6c19dab67edea5c5))
* **core:** US-1802 — taux d'activation vendeurs sur dashboard admin ([bbac826](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bbac826b81a068510f1ee27d1138255b2554e7d2))
* **dashboard:** add MRR, ARPU, and churn metrics to seller dashboard ([01c2642](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/01c2642179f7289a2e9f64529def84b501e0881e))
* **dashboard:** enhance seller dashboard with period and date range filters ([e2f422a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e2f422a658a72ec41707de175d429ff6fce563bf))
* **dashboard:** KPIs plateforme ANIF Seller (global + par plan) ([430a9e4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/430a9e43d4ae9b4a865d797afe8769ebd567fb53))
* **dashboard:** restreindre les statistiques admin à la boutique ets-anifowoche ([02342d2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/02342d26640f1ae2fc0211618787cae4c88e8dbb))
* **delivery:** add geolocation support for delivery zones and enhance models with coordinates ([85df065](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/85df065ccbddd4dd79878768223afaedce46c13f))
* **dependabot:** add open-pull-requests-limit and groups for package ecosystems ([c831cc7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c831cc7eea95921ed1a70cd5aa04922aa9dd1e10))
* **docs:** add Agile methodology and backlog documentation for ANIF Seller ([d10f53a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d10f53a1718f178638f7162b9337c2dbf8d9bb81))
* **docs:** add CLAUDE.md for project directives and environment setup ([bd8dc3b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bd8dc3b603b114bde26dce1545129d5cfdb7e2a7))
* **docs:** update economic model document and reintroduce UX conversion techniques ([0be2229](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0be2229cd1cc4d03e6fac59f07485508b234f600))
* **docs:** update README and backlog for Sprint 6 progress and feature status ([0ef0b5f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0ef0b5f39a55f43ce1a9c123ee5f756825ceece2))
* enhance admin interfaces with ordering and date hierarchy for better data management ([8ffb129](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/8ffb1297de4cbdcc959376c36aed320fbf401bd7))
* enhance admin interfaces with ordering and date hierarchy for better data management ([dfe5235](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/dfe5235847f6246b176a2f6dd9a331a20fc4fa23))
* enhance admin UI with custom styles and theme variables ([329c3fa](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/329c3faa73c6ac5340a88bba8a15a1dbd686cc3e))
* enhance backend configuration for Render deployment and add build script ([3c5d488](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3c5d48894453c43ae8c41c0b28d0a44b39b8e6a5))
* enhance backend configuration for Render deployment and add build script ([9bffc73](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9bffc7372933b121085a23b3fea9987e2a227fbe))
* enhance category field configuration to include color management ([44152d1](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/44152d1c2c158c432a17c5189bb6aad3c94c6c4d))
* enhance category field configuration to include color management ([65fa393](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/65fa3933bca95df079b2390cb237c1e735ce305a))
* enhance CI configuration, add error fallback component, and refactor order helpers ([24628de](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/24628dea359a94b6d696e53d0c4553086dcbaca9))
* enhance product limit notifications and upgrade prompts across seller pages ([83dd5ff](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/83dd5ff623547f72b3908a18539c297e0e2a80b0))
* enhance product options validation and improve checkout flow ([80f890b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/80f890b45f1803fd0d812bd9ebedf4a364731307))
* enhance seller dashboard with KPI metrics, sales chart, and recent orders overview ([05306b1](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/05306b10b6f31b2a1e2ecf4407e9f78b17f9ff73))
* enhance SellerOrders page with improved order filtering and status management; add SellerShopPage for shop sharing functionality ([cf66dd3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cf66dd34c7e586cc47a39494e91337d180d9d114))
* enhance UI components for better responsiveness and usability across seller pages ([cf348eb](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cf348eb085509563ad0be43974f57ec68a61c028))
* enhance UserAdmin permissions and readonly fields for non-superusers ([d7227b3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d7227b3129e75c92c872903bd405dd101d26ef87))
* **fedapay:** enhance payment status handling and improve comments ([5645da0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/5645da0f041217280f83ca2695fdd27f06cadd82))
* **frontend:** implement lazy loading for routes and optimize image loading in components ([3afe07e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3afe07e26a1c575b6db3ea17b872206217ffb779))
* **frontend:** mobile experience app native (PWA, tab bar, bottom sheet filtres) ([6880565](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/688056591077d353fbf7a2bb97e4ac4eeea1493a))
* **frontend:** mobile experience app native (PWA, tab bar, bottom sheet filtres) ([fbbba74](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fbbba749da6811b88466ee5e51ed84923fbc82d8))
* **frontend:** support selle.localhost as seller subdomain in local dev ([f625da7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f625da7862cd741110e9d7276d53e8adb9da458b))
* **github:** add local command for GitHub projects integration ([a0d5021](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a0d502167ee7ef6eb8583175423abc4bb4b6627b))
* **home:** add admin-driven hero section ([37c877d](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/37c877da276b2f1db29eb63308a0ac9c7cbb8523))
* **home:** carrousel d'images produits en fond de la section héro ([0e0a89a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0e0a89a350fa03c77c7030cb6b801e22be5736ea))
* **home:** carrousel d'images produits en fond de la section héro ([4ab4f4f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/4ab4f4fcd99a1fd4276656b85e7fbf9d8f3f2a3d))
* **images:** add optimizedImage utility for Cloudinary image handling ([66b8cc7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/66b8cc7da2388e0d6a37f434def0067490e73d84))
* **images:** add optimizedImage utility for Cloudinary image handling ([3afe07e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3afe07e26a1c575b6db3ea17b872206217ffb779))
* **images:** complete Cloudinary image optimization coverage (US-42) ([ad512b0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ad512b0f3e2e3edf50ac03a6e7c10ed1017ca29a))
* implement address management for users, including CRUD operations and integration in checkout ([a26d103](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a26d103b7b7db0cc0b3a4e9d30fa7a4cb7eff62b))
* implement address management for users, including CRUD operations and integration in checkout ([9dd0f1c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9dd0f1caadf260fc64da3a9ee810cfedab0ffc3e))
* implement backoffice notifications system, add settings hub view, and enhance admin UI ([d249604](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d249604971d1b322d65f667cd72723bb09d13889))
* implement order cancellation feature for sellers with corresponding UI and API updates ([a48ba62](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a48ba62e40f2a7036ef2972f817a8f318312c772))
* implement product fetching and display top products on home page ([5decf50](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/5decf5078f61e7f3a887b095ce05e6163278c2fd))
* implement product option groups and options management in SellerProducts ([3f8f2aa](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3f8f2aa795a027efd2e9b3a41bcf2f36ac8183a1))
* implement public order functionality with order form and routing ([cdfe703](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cdfe70319e8c71a521e8496f9fb6ff5be11ada3f))
* implement seller orders management with dashboard metrics and order listing ([a5969da](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a5969da4d64d15a872b4db086d640719164d59c0))
* implement seller registration, profile management, and public shop functionality ([41605d9](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/41605d9e97a7bd4a4dec1e7eadd6c9ef953f5294))
* implement SellerShopPage with shop editing functionality and delivery zone management ([7e7709c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/7e7709c8d616b9520f24790bbde5bef1c77b329f))
* implement shop slug availability check and update seller profile logic ([440623a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/440623aa01da001ca239cf741830b6e0ed8e810e))
* **limits:** aligner les limites des offres vendeurs sur le modèle économique (FREE 5/5) ([1b82799](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1b8279953738092ba4bd7290d059acfcc5bd2952))
* **Navbar:** integrate category fetching and enhance UI with new icons ([f3be788](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f3be788093bb49d7e42bdf977587292fa794d95e))
* **ngrok:** add ngrok support for local webhook testing and update Docker setup ([49e6be1](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/49e6be1ec7892d62ddd51fe3915f051ae06bb308))
* normalize form labels, focus states and a11y notifications ([6f8c2aa](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6f8c2aa4ceb77a099a385efc705b4dc570b23139))
* **notifications:** add email notifications and user profile preferences ([fe34d45](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fe34d45c13d7c381c1229214a0ded33c4daad7eb))
* **notifications:** add is_read and read_at fields to backofficenotification model ([def8758](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/def87587a4e309159380cc66d66695e9daa1ad9e))
* **notifications:** add seller notifications inbox ([6d9c0e2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6d9c0e26f00b1c5087b5cbd14ab52cdb739b328c))
* **notifications:** add sensitive action notifications and related middleware ([f031523](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f0315234a12a05bdac014052acb02cae61e677ad))
* **notifications:** add title to setting change request notification ([6898c83](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6898c83329c4be2bf1acdf2221f44e41c071f7c0))
* **notifications:** block WhatsApp/SMS by default, admin toggle to re-enable ([c2032f9](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c2032f97f54f1125acdf4e828c6bb3a0e4242dfb))
* **notifications:** enhance backoffice notifications management with read/unread functionality ([d0e43d8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d0e43d8eeb6347271c16d2bc1cf92ae367dafc47))
* **notifications:** envoyer un email au vendeur à chaque nouvelle commande ([d983e3b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d983e3bab06b862d031a0532c0293b74f1f2baa0))
* **notifications:** implement resend notifications action and enhance email rendering ([f45e040](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f45e040923096f5d4503e32c2dfd1051bc9bc57c))
* **notifications:** implement resend notifications action and enhance email rendering ([a135350](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a1353502640ed115c116bfbeb42b8f5fb5d6be7f))
* **ops:** add encrypted daily PostgreSQL backup workflow (US-37) ([48fac05](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/48fac05a17b98f3692559a71b40765d6fa5f724c))
* optimize product and delivery zone handling in shop components ([9222fb5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9222fb5e80b12336d86038e655228f8fa49a16cf))
* **paiement:** migrer FedaPay vers Checkout.js (modale intégrée) ([2eec0e6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2eec0e69b46438094adb93a16faa0b257854a93e))
* **paiement:** vérifier et resynchroniser le statut FedaPay côté confirmation ([729e0f5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/729e0f550dd4c90c887a51a2b8b3c55a5fffc889))
* **payments:** enhance payment retrieval for authenticated users and update order confirmation messages ([33c837b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/33c837b9cd6df1be0a2a9f15bf4d0c26e0bcae29))
* **payments:** make failed payments visible and relaunchable from admin (US-34) ([0f712b5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0f712b5dd1d2380c9210f773997d353d674e1d63))
* **payments:** refactor payment handling and add retry mechanism for failed payments ([d896451](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d8964519698742b17e7b813d1dc11a72a0334df9))
* **pricing:** restructure pricing model and clarify service tiers ([c983b51](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c983b512799ac103ac8eff189c9ec79b8a7c2cdd))
* **product:** bouton "Partager" fonctionnel ([5fd84ed](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/5fd84ed97630296018c064069e537d8e8928d490))
* **products:** add 'made_to_order' field and update filters to include made-to-order products ([dca5be5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/dca5be524fc384fbbbf623547cea0a3b48b975e8))
* **products:** add 'made_to_order' field and update filters to include made-to-order products ([337a9f7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/337a9f7800fba847ee9c281d394bc1a4c3431729))
* **products:** add made_to_order field and update stock handling for made-to-order products ([b0516e7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b0516e7380cea62c0cd634dfcefcbd9d13ac504f))
* **products:** add made_to_order field so restauration/made-to-home products are no longer shown as out of stock ([dfb6abb](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/dfb6abbb52edc596f4a0879f0b2de34457b8ea6e))
* **products:** affiche le stock réel sur la fiche produit et la carte ([6c2f09a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6c2f09a6e26786d48618064dd66e72be4c2f22aa))
* **products:** arbre de catégories à 3 niveaux ([7e2831c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/7e2831c6fdd9514afda57b0f9a5390072f2cb486))
* **products:** arbre de catégories à 3 niveaux (release-please) ([b2e3697](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b2e3697f3c987b4d9af822a90236e9ecda73c58d))
* **products:** galerie multi-images sur la fiche produit ([18b2169](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/18b2169521b0cd511ab33ecfcbe6d0058f12d459))
* **products:** include option groups options in product image prefetching ([1e6610e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1e6610efecbb9317ddef1fe3db4e2b4557ad60cd))
* **products:** produits en L1/L2/L3 et branche Alimentation simplifiée ([98ae9c7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/98ae9c71ca913c49dae9b35900918086474d0374))
* **promotions:** promotions actives (prix barré) + coupons au checkout ([d98bc6f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d98bc6f571376b8e386f69e415f3c9a9fc32aa5c))
* **pwa:** manifest, icônes et méta vendeur distincts pour seller.anifowoche.com ([fab4bd5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fab4bd5430c6cfa362220f13060137cb4ce1ec01))
* **pwa:** manifest, icônes et méta vendeur distincts pour seller.anifowoche.com ([527c5d3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/527c5d3ab7c88b1278ba78290e367df746fee5e5))
* refactor error message extraction logic to improve clarity and handling of nested structures ([baa438c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/baa438c5c8fd5eb0717d1001e9ded48a0917ecf6))
* refactor error message extraction logic to improve clarity and handling of nested structures ([1530136](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/153013603864d1f21eb5ae6e72be3dedfd30bae9))
* release ([37bdf7d](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/37bdf7d3f2eaca76d4eae7b2f9fcec4fab128922))
* remove example environment files and add backend documentation ([41d85fd](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/41d85fd720ca88393883e22b96859dfa47a1f63f))
* remove unused icon components from SellerLanding page ([0caf862](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0caf86240845d670afe43ff6d8e34e44a9f5f591))
* remove unused seller state from SellerDashboard component ([c132f56](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c132f56f092c450712809810566f02cb4f3095e6))
* **returns:** demande de retour depuis l'historique de commande ([f0ef443](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f0ef4439d56df350edf22f2df14cbccc7d21a272))
* **reviews:** API avis produits + affichage note réelle ([4d086f1](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/4d086f109bd6340eac7d5b2ec4321d7aec6df8b5))
* **security:** security review + payment rate limiting (US-38) ([fc2859d](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fc2859d70e3231713a7cda0a60fa319f4481ac7e))
* **seed:** implement seed command for E2E tests with idempotent data generation ([ef3a1c0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ef3a1c05365af8a4c5b55111893d53e2d566c3d1))
* **seller-orders:** add order status filter to enhance order management ([4834b7e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/4834b7edf394fa9b1b737b087bd18551d3a903ea))
* **seller-stats:** gate advanced stats behind Pro plan ([3142f00](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3142f00eb4c7054304c08f26f09979a7bce75d16))
* **seller:** appliquer les limites du plan gratuit (10 produits, 20 commandes/mois, hors catalogue principal) ([63df1dd](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/63df1ddcbbb24c98d60eb9dd8e13e59061aff922))
* **seller:** bouton d'installation PWA sur l'accueil du dashboard vendeur ([2ef38aa](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2ef38aa88f08a494425db748d923b7f1e4e5598b))
* **seller:** bouton d'installation PWA sur l'accueil du dashboard vendeur ([2a2685f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2a2685fdc974fa8e09c6acdb42f647c4962e601f))
* **seller:** bouton d'installation PWA sur l'accueil du dashboard vendeur ([277e811](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/277e81152a1a22feec4f4c1a156b740a3f64ad6a))
* **seller:** pipeline d'abonnement FedaPay + statistiques avancées dashboard (issues [#224](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/issues/224), [#228](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/issues/228), [#245](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/issues/245), [#250](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/issues/250), [#261](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/issues/261), [#279](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/issues/279), [#280](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/issues/280)) ([89468f0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/89468f029f26162067888b33ae890083cf560df1))
* **seller:** refonte nav mobile avec bouton + et profil vendeur ([907ccf7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/907ccf74896de2bd3cbf41088cd85e5bb9af6a14))
* **sellers-admin:** rendre SellerProfile et Shop en lecture seule dans l'admin ([2e46c79](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2e46c79c874776ce768e4c83fa3c336ed8105a08))
* **seller:** SAAS architecture with seller.anifowoche.com subdomain ([d4333de](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d4333de245617f46013120c24a208e4298e138fd))
* **sellers:** ajouter le modèle SellerSubscription et son CA en carte KPI admin ([588c92b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/588c92ba669fe5a7cd4e516991b944daf18ef70d))
* **seller:** séparer l'ajout de produit (/products/new) de la liste (/products) ([cc3effc](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cc3effcf861d62c9a43fc0cc390d29b159077366))
* **sellers:** rappel d'expiration abonnement vendeur (1j/2 pendant 7j avant ends_at) ([19e2668](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/19e26683af42fafd1f202df450552d66fadac5ed))
* **sellers:** remplacer le plan binaire FREE/PAID par 4 paliers FREE/STARTER/PRO/BUSINESS ([3ca554c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3ca554c98622da16d21d45634c49dc3bb52b0414))
* **sellers:** replace MAIN_STORE_SLUG with is_official flag on Shop model ([e0deae9](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e0deae935be4b29333783538e09c041aa09063aa))
* **seller:** tarif de lancement Starter 2 000 F/mois les 3 premiers mois puis 5 000 F/mois ([af73824](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/af7382491b1a61209360d74b7417df399e1a8f07))
* **seo:** enhance structured data and add SEO to missing pages ([6f92e9f](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6f92e9fc804b99bc96654ba090843f2b0c051e36))
* **seo:** implement SEO components and sitemap generation for improved visibility ([73658d4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/73658d450a1e19ac44b0a9b0a43310d61dcb1fe6))
* **seo:** meta OG dynamiques par boutique vendeur (middleware edge + Seo client) ([e3a62c8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e3a62c8a812ed7aea6a578caecfaca89e10a9886))
* **shop:** carrousel de bannières promo sur l'accueil + durcissement sécurité (US-23, US-38) ([3e82344](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3e8234433db26accaffee481566ff079d6e91936))
* **storage:** implement ReadOnlyCloudinaryStorage for local writes in development ([ce2b1f3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ce2b1f354d51b7b1c4ed77d41716363c3ac39b2a))
* **tests:** add comprehensive tests for analytics and core apps ([fba299a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fba299ad51fad98c031a4c7050b52409887c1e2f))
* **ui:** squelette de page animé en fallback Suspense ([323d8a4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/323d8a4f0a8411183c49039eb762f5e6c972c737))
* update border color variable for improved UI aesthetics ([84d9508](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/84d95087edf4afa9e6094bfd64cfcc0962a6630b))
* update brace-expansion and react-router versions in package-lock.json ([6310b6e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6310b6e63a4f1dff8999aa474956b7938f16700b))
* update BUSINESS plan pricing and features; enhance SellerDashboard and SellerPlan components ([364141a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/364141a9682dd85d086a2b799effce193f9c1cdb))
* update CI/CD documentation and add Vercel configuration for frontend deployment ([e8d16bf](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e8d16bf5cf3e5ded135ee3163feac1e7abcc49f6))
* update CI/CD documentation and add Vercel configuration for frontend deployment ([c461203](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c461203b250858aa1b31d8618a96a0c8e0a64d7e))
* update database backup workflow to use Docker for pg_dump and simplify failure email template ([88b5460](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/88b5460cbb1c9a957bfff8fc81829f599e30fc8e))
* update database backup workflow to use Docker for pg_dump and simplify failure email template ([3d53c6c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3d53c6c7525bbaa01b2138221dccda31186da82b))
* update default superuser credentials for deployment ([28cfcb2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/28cfcb2c28b257e6f6cb5b5d782317465b12930a))
* update default superuser credentials for deployment ([7488086](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/74880862cba5feac7af9c29be4865e7cf8c2d0d0))
* update deployment references from Railway to Render in documentation and configuration files ([026ae32](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/026ae325d6da2e33443f860a3421d60a418423ba))
* update deployment references from Railway to Render in documentation and configuration files ([ddafbf8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ddafbf8b38d7802cac870e46523c7878074093b4))
* update read-only fields in ProductImageSerializer and modify image upload format in tests ([22fe87b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/22fe87bfc2dd58b2e2a0601f3d3f06b65251c3c7))
* update requirements to include factory_boy version constraint ([1b261c4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1b261c4b3c840e70283cbaba2ae3d522e4bc710c))
* update seller plan limits and dashboard metrics; remove basic customization features ([aeb63c8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/aeb63c8c324e6413c89553e54386972bbda4f679))
* update seller routes to remove '/seller' prefix and enhance navigation ([57b61a8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/57b61a8ddf40306428ab1517a1ab9835a68b0a3f))
* update shop slug generation logic in SellerSettings and adjust sitemap URLs for local development ([d0fa251](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/d0fa251d7903b1d5212735800f27201bf566f38d))
* update shop slug generation logic in SellerSettings and adjust sitemap URLs for local development ([808b8c8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/808b8c8747bc4dcb4ee6d378327e07a454142c01))
* **users:** enhance registration process with phone length validation and atomic transaction for user creation ([b08fc27](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b08fc277c23d273dab5ae01ff33003fb1c587fd7))
* **users:** implement proxy models for Client and AdminUser, update admin configurations ([44eeea4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/44eeea4b7cae4021d9dc06d68aa8e35aeace8d77))
* **users:** implement proxy models for Client and AdminUser, update admin configurations ([df269e7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/df269e78ea39fc96dffa2b9cc58494c78efbd30b))
* **vite:** add proxy for media requests to backend ([ce2b1f3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ce2b1f354d51b7b1c4ed77d41716363c3ac39b2a))
* **wishlist:** liste de souhaits persistée ([88e0185](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/88e01857ec22d3df2edd16f7127291af1214841d))
* **workflow:** add daily subscriptions management workflow with reminders and expirations ([deabf11](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/deabf115c8cd0ac9596a3b344acba717d14e0b17))


### Bug Fixes

* **a11y:** BottomSheet — fermeture Escape, focus trap et restauration du focus ([c36853e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c36853e1fdda30efb1010236f6928215837ec5f9))
* **a11y:** confirmation inline avant suppression d'adresse ([fffc4a4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fffc4a4e61c45bcab1e07a3c50831c63c3164200))
* add missing jsdom dev dependency for vitest ([a231e0c](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a231e0cef0a2abfb99d6acf2ddec33802d5692b8))
* add missing recharts dependency for SellerStats ([bce6a9b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bce6a9b756e51a86ef39605d8410c6d93956cc26))
* **admin:** add search_fields on DeliverySlotAdmin and actionable CTAs on empty states ([a90e4d2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/a90e4d2e4b50c00122bcf7fc8e37f7bcee4043e2))
* **analytics:** no auth on public pageview endpoint (401 on expired JWT) ([032fb09](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/032fb090f67115154121ed248154a4086a2a8ee7))
* **auth:** robust token refresh with single-flight and proper UI logout on expiry ([f094763](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f094763a7adb2c55e436e7f4d16cc96177d8bd7d))
* **auth:** robust token refresh with single-flight and proper UI logout on expiry ([0ec5f55](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0ec5f55767d2602e640302c1197db667636a9923))
* **backups:** add reminder to run migrations after restoring prod dump locally ([b545fe0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/b545fe0e92372bb0366bf1e4567bae8f1a74d95a))
* **ci:** patch brace-expansion and postcss to clear npm audit (frontend CI failure) ([cb27c43](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cb27c4366e1809ef4cf462083487234ccde2a911))
* correct 'selle.localhost' typo to 'seller.localhost' in 4 frontend files ([007e8b9](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/007e8b94ec54385f3ca2daf73227aa304a5106ac))
* correct French translations in ProductFormMobile component ([0cdbee2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0cdbee226be21dceb262f5b770c7d304da639afd))
* correct French translations in ProductFormMobile component ([53f5260](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/53f5260885d8d2d2d6157c5ecd46dcfbcab4efa7))
* **dashboard:** compter tous les comptes clients dans le KPI « Clients » ([c2a83c2](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c2a83c2c007c172e921385af0476ecfaaaa60584))
* **docs:** clarify instructions for committing changes to the local Develop branch ([0615b90](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/0615b9008bc30d385082ad3b2b0d92f218c70071))
* **docs:** correct branch name in AGENTS.md and clarify model identification in task execution ([1e728ae](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1e728ae144a3dbc374ec26872b71928a548a5510))
* **docs:** correct wording in project modification directive ([03c0cd8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/03c0cd8a1a35ff778ee934c3f372a0c32b47df6a))
* **docs:** update README version and enhance documentation structure ([ef8d89e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ef8d89e83c40204b7d991ac7b7b3a2c10e0e06a6))
* **env:** update VITE_API_BASE_URL to point to the correct backend URL ([8032da6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/8032da67eda38fa39951db6b6c474b5bd9c56faa))
* **fedapay:** use widget object API with public_key and named constants ([6ec1467](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6ec1467645fc9085e621ffd6d36b6b7a502c9955))
* **frontend:** prevent 'Failed to fetch dynamically imported module' after deploys ([c8f9d59](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/c8f9d590867e526677337d9e52219162b74cff51))
* **frontend:** prevent mobile navbar overflow ([87761d6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/87761d615523b73678b893e05725618101398775))
* increase precision of latitude and longitude fields in DeliveryZone and Order models ([3f73593](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3f73593ed593a6c92c113da96bbe3a72eabf8e7c))
* increase precision of latitude and longitude fields in DeliveryZone and Order models ([09e89d0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/09e89d0c9162195e05597b29131625bc5f0b9d52))
* **limits:** set max_orders_per_month for STARTER plan to 100 ([fe12e8e](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fe12e8e93edb1ebc349f03a5ce803bf8d32fd3fa))
* **lint:** éviter les setState synchrones dans les effets de fetch ([1daa9bf](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/1daa9bfd90e25b3399b9202d19954106ce5d17ca))
* **lint:** éviter les setState synchrones dans les effets de fetch ([44014f6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/44014f67c61eef28f5ee22cd65dbb8a937ef4981))
* **notifications:** add is_read and read_at fields to BackofficeNotification model ([ef56619](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ef5661943df3279f88cd0f5829fe20ea054cf26d))
* **orders,checkout:** résolution des 400/401 Sentry (JAVASCRIPT-REACT-S, -4, -R) ([ebcdff3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ebcdff395c20d15969f7f9af3498805371596726))
* **orders:** validate product options at checkout and allow guest checkout ([fe71c2b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/fe71c2b5a6233c5d9698dc2a114528f918f26d16))
* **pricing:** align seller landing offers with economic model (Gratuit 5/5, Starter, Pro) ([2904639](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/29046399eaeb0eceb955dff38aede66120c5c8d3))
* **pricing:** mark Starter and Pro as coming soon on seller landing ([86ab640](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/86ab6403f7671c53a011e7609dcc3622b618ba7b))
* **pricing:** Starter fondatrice à 2 000 F/mois les 3 premiers mois puis 5 000 F/mois ([e10ba19](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e10ba19743e1be1a7c655a83ae18c6b7c6d9cc50))
* **pricing:** update Starter plan price to 5,000 FCFA ([9730cd4](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9730cd454b769a016fcc6caf9b37b4a808e63c5a))
* **pricing:** update Starter plan price to 5,000 FCFA/month ([de0e0eb](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/de0e0eb77b0d94c8ced0e70e91552c3e0a059a19))
* **products:** fix in_stock filter (CharFilter) and make restauration/made-to-order products available ([33937ee](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/33937ee6dabe5b7adaf075def33408a1648f3247))
* **products:** get_leaf_paths vise le vrai niveau 3 et slugs de type uniques ([4ac4205](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/4ac4205d816ac82c7232a7d7de56445ecdd4b624))
* **products:** slugs de type Sport uniques, disjoints des slugs racines ([f834fda](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f834fda881eacc9dca8b7a1469c7d814606c1844))
* **products:** update error handling for unauthorized requests and set maxLength for input fields ([e03e395](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/e03e395fc5a487f9fdfe34cb2474b1663241d370))
* remove unused BellIcon import and handleShopSave in SellerSettings ([8f228b8](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/8f228b83418a0a56097aee388bb6e9f60314a2ca))
* reorder delivery URLs to prevent router catch-all from matching geolocate endpoint ([ef4859d](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ef4859d288153ce7ad97bca0fa1d13b3b6b51f63))
* reorder delivery URLs to prevent router catch-all from matching geolocate endpoint ([11fe176](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/11fe17672f4896e694b0ecb34f598b8578b3c2cc))
* **robots:** update sitemap URL to production domain ([ef3a1c0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ef3a1c05365af8a4c5b55111893d53e2d566c3d1))
* **seller-dashboard:** handle fetch errors to prevent infinite loader ([bb51473](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/bb514739e0d106a4f698cdf240021ae5ebf1144e))
* **seller-products:** permettre la création sans stock et envoyer 0 par défaut ([2cd2248](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2cd2248be94439331b714ea86f230255c059ad11))
* **seller:** add /shop/:slug redirect to /:slug on seller subdomain ([9bf5c5a](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9bf5c5ad8774cc110ab97cb0b95894530f1bb545))
* SellerDashboard ne charge pas - mapper la reponse backend et corriger le param period ([11fc0ca](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/11fc0ca12112dd8465e17830442ba36b281bf55b))
* **seller:** install PWA via beforeinstallprompt capté à la racine + popup native ([7841162](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/7841162dbf9d91888e88a49bcc3e0e28cbf1ea95))
* **sellers:** add missing get_object_or_404 import in PublicShopProductDetailView ([ac918b0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ac918b02fdd0718b8c7d9786a37ee812d9c1bb16))
* **sellers:** add select_related/prefetch_related and error handling to PublicShopProductDetailView ([551c3a5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/551c3a5ebba57a13e255d94102b5b5a2c3993cf6))
* **seller:** update dashboard label from 'Tableau de bord' to 'Acceuil' ([57813b7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/57813b78bb9ebacffd763246454970b2d9216a22))
* **seller:** update dashboard label from 'Tableau de bord' to 'Acceuil' ([ed008e5](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ed008e5670d1566694ad0e6def8aeed742b624e5))
* **seller:** use extractErrorMessage in option group handlers for meaningful error messages ([2834854](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/2834854116dac9e9e4c5beb086cc71877342012a))
* **sentry:** enhance beforeSend logic to handle 401 status for auth/me endpoint ([80ac05d](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/80ac05d8122acb69e199c929f76892de2006a9d9))
* **sentry:** filtrer bruit 400 sur endpoints de validation métier ([cd47fd6](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/cd47fd69e9b13ecc7d9256e43983093a545d96c5))
* **seo:** enhance SEO title for product pages based on category ([ea28f28](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ea28f281e64b07ea0ad2c503871588dfc1911f1d))
* **seo:** update default description for improved clarity and relevance ([9ba1517](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/9ba1517db17702dc95b4744b35206495f88e84b2))
* **settings:** adjust storage backend based on DEBUG mode ([ce2b1f3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ce2b1f354d51b7b1c4ed77d41716363c3ac39b2a))
* **sitemap:** change URLs to production domain ([ef3a1c0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ef3a1c05365af8a4c5b55111893d53e2d566c3d1))
* update phone number format to +22901XXXXXXXX across the application ([3961c2b](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/3961c2b3237fac2dcaa909c1840a76f83d8c9008))
* update phone number format to +22901XXXXXXXX across the application ([20bd6e7](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/20bd6e777a1e5891ef74f67e0922e94f6d6f0342))
* **urls:** serve media files in DEBUG mode ([ce2b1f3](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/ce2b1f354d51b7b1c4ed77d41716363c3ac39b2a))
* **ux:** champ code promo replié par défaut dans le récapitulatif ([f68ee66](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/f68ee66ddcc73a68124556beabf8425c14793013))
* **ux:** messages d'erreur orientés utilisateur + bouton Réessayer ([6cbcac0](https://github.com/Zelofane22/ANIFOWOCHE-E-commerce/commit/6cbcac0985a6f17b181976de63bfe9f79d585bf6))

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
