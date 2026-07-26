# 🐳 Environnement de développement Docker

[← Retour au README](../README.md)

Les tests en local se font via des conteneurs Docker (pas d'installation locale de Python/Node/PostgreSQL requise).

## Démarrage

Le code source (`backend/` et `frontend/`) et `docker-compose.yml` vivent sous `code/`.

```bash
cp code/backend/.env.example code/backend/.env
cp code/frontend/.env.example code/frontend/.env

docker compose -f code/docker-compose.yml up --build
```

| Service | URL | Rôle |
|---------|-----|------|
| frontend | http://localhost:5173 | React (Vite, hot reload) |
| backend | http://localhost:8000 | API Django REST |
| db | localhost:5432 | PostgreSQL 18 |

## Commandes utiles

```bash
# Migrations Django
docker compose -f code/docker-compose.yml exec backend python manage.py migrate

# Créer un superuser (accès /admin/)
docker compose -f code/docker-compose.yml exec backend python manage.py createsuperuser

# Logs d'un service
docker compose -f code/docker-compose.yml logs -f backend

# Arrêter et supprimer les conteneurs
docker compose -f code/docker-compose.yml down
```

> Le code source de `code/backend/` et `code/frontend/` est monté en volume : les modifications sont prises en compte sans reconstruire l'image. Reconstruire (`--build`) uniquement après un changement de `requirements.txt` ou `package.json`.
