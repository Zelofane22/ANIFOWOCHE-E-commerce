# Revue de sécurité — Sprint 6 (US-38)

Audit avant ouverture publique, portant sur : limitation de débit, gestion des secrets, HTTPS,
dépendances. Réalisé le 2026-07-04, vérifié via Docker (tests + `manage.py check --deploy` simulé en
conditions Render).

## 1. Limitation de débit (rate limiting)

**État constaté** : `DEFAULT_THROTTLE_CLASSES` (anon 60/min, user 300/min) + un scope dédié `auth`
(10/min) déjà appliqué sur connexion (`AuthTokenObtainPairView`) et inscription (`RegisterView`) via
`ScopedRateThrottle` — bonne protection anti brute-force déjà en place avant cette revue.

**Trouvé et corrigé** : `InitiatePaymentView` (`apps/payments/views.py`) n'avait aucun scope dédié —
seulement le throttle anon générique (60/min). Chaque appel déclenche un vrai appel payant à l'API
FedaPay et crée une ligne `Payment` en base ; un abus y serait coûteux (quota API tiers, bruit en base),
pas juste une nuisance. Ajout d'un scope `payments` (20/min) via `ScopedRateThrottle` — voir
`config/settings.py` (`DEFAULT_THROTTLE_RATES`) et `apps/payments/views.py`. Testé (`test_initiate_payment_is_rate_limited`
dans `apps/payments/tests.py`) : la 3ᵉ requête consécutive est bien rejetée (429).

**Noté mais non corrigé (recommandation manuelle)** :
- `ValidateCouponView` (`apps/promotions/views.py`) est en `AllowAny` avec seulement le throttle anon —
  permet l'énumération de codes coupon à faible débit (60/min). Risque jugé faible (gain pour l'attaquant
  limité à un pourcentage de réduction, pas un accès compte/paiement) ; à surveiller si des coupons à forte
  valeur sont introduits.
- `FedaPayWebhookView` vérifie la signature HMAC (constant-time, `hmac.compare_digest`) mais ne rejette
  pas les événements avec un timestamp trop ancien (pas de fenêtre de fraîcheur) — un événement intercepté
  et rejoué resterait valide indéfiniment. À corriger si FedaPay documente une fenêtre de tolérance
  recommandée (voir leur doc webhook), hors scope de cette revue (US-38 se concentre sur rate
  limiting/secrets/HTTPS/dépendances, pas une refonte de la vérification webhook).

## 2. Gestion des secrets

**État constaté** : tous les secrets (`SECRET_KEY`, clés FedaPay/WhatsApp/Resend/Cloudinary) passent par
variables d'environnement (`python-decouple`), aucun secret réel en dur dans le code. `.gitignore` exclut
bien `.env` ; seuls des `.env.example` avec valeurs placeholder sont versionnés. Recherche de secrets
commités (clés `sk_live_`, tokens Google, clés privées PEM) : aucun résultat.

**Trouvé et corrigé** : `SECRET_KEY` et `DEFAULT_SUPERUSER_PASSWORD` ont des valeurs de repli en dur dans
`config/settings.py` (`dev-secret-key-change-me`, `Anifowoche123!`) — nécessaires pour que Docker
fonctionne sans configuration en local, mais rien n'empêchait auparavant de déployer en production avec
ces mêmes valeurs par défaut si la variable d'environnement n'était pas positionnée sur Render. Ajout
d'un garde-fou dans `config/settings.py` : hors `DEBUG` (donc en production), le démarrage échoue
(`ImproperlyConfigured`) si `SECRET_KEY` est absente, égale au placeholder, ou fait moins de 32
caractères. `.env.example` documente la commande pour générer une vraie clé. Vérifié : lève bien
l'exception avec une clé faible + `DEBUG=False`, démarre normalement avec une clé longue + `DEBUG=False`,
et ne casse pas le dev local (`DEBUG=True`, non concerné par le garde-fou).

**Reste à faire manuellement** :
- `DEFAULT_SUPERUSER_PASSWORD` n'a pas de garde-fou équivalent — accepté tel quel car protégé par
  `ForceDefaultPasswordChangeMiddleware` (changement de mot de passe forcé à la première connexion), mais
  à vérifier que Render a bien une vraie valeur en variable d'environnement avant tout lancement public.
- Rotation des clés prod (FedaPay, WhatsApp, Resend, Cloudinary, `SECRET_KEY` Render) — nécessite un accès
  aux dashboards externes que l'automatisation n'a pas ; voir US-32/US-33/US-37 dans
  `docs/sprints/sprint6-progress.md`, hors scope de cette boucle.

## 3. HTTPS

**État constaté** : déjà solide, aucune correction nécessaire.
- `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS` (1 an), `SECURE_HSTS_INCLUDE_SUBDOMAINS`,
  `SECURE_HSTS_PRELOAD` tous conditionnés sur `ON_RENDER` (détection via variable d'env `RENDER`).
- `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE` conditionnés sur `not DEBUG`.
- `SECURE_PROXY_SSL_HEADER` correctement configuré pour le proxy Render.
- Vérifié avec `python manage.py check --deploy` en simulant l'environnement Render
  (`RENDER=1 DEBUG=False SECRET_KEY=<clé longue> ALLOWED_HOSTS=example.com`) : **0 avertissement**.
  Sans `RENDER=1` (donc en dev), `check --deploy` remonte logiquement les 2 avertissements HSTS/SSL
  attendus pour un environnement non-Render — comportement voulu, pas un problème.

## 4. Dépendances

**État constaté** : à jour, aucune vulnérabilité connue.
- Backend : `pip list --outdated` → rien à mettre à jour. `pip-audit -r requirements.txt` → aucune
  vulnérabilité connue.
- Frontend : `npm audit --omit=dev` → 0 vulnérabilité.

Aucune action nécessaire ce sprint ; à refaire périodiquement (pas d'automatisation CI pour l'instant,
voir Sprint 7 / US-41 pour l'intégration en CI).

## Résumé des changements de code

- `code/backend/config/settings.py` : garde-fou `SECRET_KEY` faible en production + scope de throttling
  `payments`.
- `code/backend/apps/payments/views.py` : `InitiatePaymentView` protégée par le scope `payments`.
- `code/backend/apps/payments/tests.py` : test de non-régression sur la limitation de débit.
- `code/backend/.env.example` : commande pour générer une vraie `SECRET_KEY`.

Suite de tests complète (81 tests) verte après ces changements, testée via Docker.
