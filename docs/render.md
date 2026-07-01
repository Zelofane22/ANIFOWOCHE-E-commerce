# Déploiement backend sur Render

[← Retour au README](../README.md)

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

- `CORS_ALLOWED_ORIGINS` : URL du frontend, par exemple `https://anifowoche.vercel.app`
- `CSRF_TRUSTED_ORIGINS` : même origine en HTTPS si besoin, par exemple `https://anifowoche.vercel.app`
- `FRONTEND_BASE_URL` : URL publique du frontend
- `FEDAPAY_SECRET_KEY`
- `FEDAPAY_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

`DEBUG` est forcé à `False` dans le Blueprint. Django ajoute automatiquement le domaine Render fourni par `RENDER_EXTERNAL_HOSTNAME` à `ALLOWED_HOSTS`.

`SECURE_SSL_REDIRECT` est activé par défaut sur Render. `SECURE_HSTS_SECONDS` reste à `0` au lancement ; augmente cette valeur uniquement quand le domaine final est validé en HTTPS.

## Étapes Render

1. Créer un nouveau Blueprint Render depuis le repo GitHub.
2. Sélectionner le fichier `render.yaml`.
3. Renseigner les variables marquées `sync: false`.
4. Appliquer le Blueprint.
5. Après le premier déploiement, créer un superutilisateur depuis le Shell Render :

```bash
python manage.py createsuperuser
```

Le frontend Vercel doit utiliser l'URL Render avec `/api`, par exemple :

```bash
VITE_API_BASE_URL=https://anifowoche-backend.onrender.com/api
```
