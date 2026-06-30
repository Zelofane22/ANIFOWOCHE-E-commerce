# 🐳 Environnement de développement Docker

[← Retour au README](../README.md)

Les tests en local se font via des conteneurs Docker (pas d'installation locale de Python/Node/PostgreSQL requise).

## Démarrage

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up --build
```

| Service | URL | Rôle |
|---------|-----|------|
| frontend | http://localhost:5173 | React (Vite, hot reload) |
| backend | http://localhost:8000 | API Django REST |
| db | localhost:5432 | PostgreSQL 16 |

## Commandes utiles

```bash
# Migrations Django
docker compose exec backend python manage.py migrate

# Créer un superuser (accès /admin/)
docker compose exec backend python manage.py createsuperuser

# Logs d'un service
docker compose logs -f backend

# Arrêter et supprimer les conteneurs
docker compose down
```

> Le code source de `backend/` et `frontend/` est monté en volume : les modifications sont prises en compte sans reconstruire l'image. Reconstruire (`--build`) uniquement après un changement de `requirements.txt` ou `package.json`.
