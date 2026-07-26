# Déploiement backend sur Render

[← Retour au README](../README.md)

> 💾 **Sauvegardes de la base** : le plan free Render n'inclut aucun backup automatique — un workflow
> GitHub Actions quotidien s'en charge, voir [docs/backups.md](backups.md) (US-37).

## Configuration du service

Le backend est prêt pour un déploiement Render via le Blueprint [render.yaml](../render.yaml).

- Service : `anifowoche-backend`
- Root directory : `code/backend`
- Runtime : Python
- Build command : `./build.sh`
- Start command : `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- Base de données : PostgreSQL Render `anifowoche-db`

Le script [code/backend/build.sh](../code/backend/build.sh) installe les dépendances, collecte les fichiers statiques et applique les migrations.

## Variables à renseigner dans Render

Render génère ou injecte automatiquement `DATABASE_URL`, `SECRET_KEY`, `RENDER` et `RENDER_EXTERNAL_HOSTNAME`.

À renseigner manuellement :

- `CORS_ALLOWED_ORIGINS` : origine du frontend sans slash final, par exemple `https://anifowoche.vercel.app`
- `CSRF_TRUSTED_ORIGINS` : même origine en HTTPS sans slash final, par exemple `https://anifowoche.vercel.app`
- `FRONTEND_BASE_URL` : URL publique du frontend
- `FEDAPAY_SECRET_KEY`
- `FEDAPAY_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `SENTRY_DSN` : DSN du projet Sentry « Django » (monitoring erreurs/performance). Optionnel si le
  DSN configuré par défaut dans `config/settings.py` convient ; à définir si le projet Sentry change.

Optionnelles (valeurs par défaut définies dans `config/settings.py`, à surcharger pour changer les
identifiants du superadmin créé automatiquement — voir [Superadmin par défaut](#superadmin-par-défaut)
ci-dessous) :

- `DEFAULT_SUPERUSER_USERNAME` (défaut : `anifowoche`)
- `DEFAULT_SUPERUSER_PASSWORD` (défaut : `Anifowoche123!`)
- `SENTRY_TRACES_SAMPLE_RATE` (défaut : `0.1` — part des requêtes tracées pour le monitoring de performance)

`DEBUG` est forcé à `False` dans le Blueprint. Django ajoute automatiquement le domaine Render fourni par `RENDER_EXTERNAL_HOSTNAME` à `ALLOWED_HOSTS`.

`SECURE_SSL_REDIRECT` est activé par défaut sur Render. `SECURE_HSTS_SECONDS` reste à `0` au lancement ; augmente cette valeur uniquement quand le domaine final est validé en HTTPS.

## Étapes Render

1. Créer un nouveau Blueprint Render depuis le repo GitHub.
2. Sélectionner le fichier `render.yaml`.
3. Renseigner les variables marquées `sync: false`.
4. Appliquer le Blueprint.
5. Après le premier déploiement, se connecter à `/admin` avec le superadmin créé automatiquement (voir
   ci-dessous) — aucune commande manuelle nécessaire.

Le frontend Vercel doit utiliser l'URL Render avec `/api`, par exemple :

```bash
VITE_API_BASE_URL=https://anifowoche-backend.onrender.com/api
```

## Superadmin par défaut

Le script [build.sh](../code/backend/build.sh) exécute `python manage.py create_default_superuser` à
chaque déploiement (commande idempotente : ne recrée rien si le compte existe déjà). Identifiants par
défaut :

| Champ | Valeur par défaut |
|-------|--------------------|
| Username | `anifowoche` |
| Mot de passe | `Anifowoche123!` |

`apps.core.middleware.ForceDefaultPasswordChangeMiddleware` oblige un changement de mot de passe dès la
première connexion tant que ce mot de passe par défaut est actif — mais mieux vaut ne pas dépendre
uniquement de ce garde-fou : renseigner `DEFAULT_SUPERUSER_USERNAME` / `DEFAULT_SUPERUSER_PASSWORD` sur
Render avant le premier déploiement en production évite d'exposer, même brièvement, un mot de passe connu
publiquement (il est visible en clair dans ce dépôt).
