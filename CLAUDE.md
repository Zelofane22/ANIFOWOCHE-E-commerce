# CLAUDE.md

Directives pour Claude Code sur ce projet (ANIFOWOCHE E-commerce).

## Environnement d'exécution

- **Ne jamais lancer l'app en local hors Docker.** Pas de `python manage.py runserver`, `npm run dev`, `npm start`, install de Python/Node/PostgreSQL en local, etc. Tout passe par `docker compose` (voir [docs/docker.md](docs/docker.md)).
- Le fichier `docker-compose.yml` vit dans `code/` (le code source est sous `code/backend/` et `code/frontend/`). Toutes les commandes `docker compose` doivent être lancées depuis `code/`, ou avec `-f code/docker-compose.yml` depuis la racine.
- Pour démarrer l'environnement : `docker compose -f code/docker-compose.yml up --build`.
- Pour exécuter une commande dans un service (migrations, tests, shell) : `docker compose -f code/docker-compose.yml exec <service> <commande>` (ex. `docker compose -f code/docker-compose.yml exec backend python manage.py migrate`).
- Ne reconstruire les images (`--build`) qu'après un changement de `requirements.txt` ou `package.json` — le code est monté en volume, pas besoin de rebuild sinon.
- Services : frontend (Vite, http://localhost:5173), backend (Django, http://localhost:8000), db (PostgreSQL, localhost:5432).

## Stack

- Frontend : React + Vite + Tailwind CSS + React Router + Axios
- Backend : Django + Django REST Framework + PostgreSQL
- Auth : JWT (djangorestframework-simplejwt)
- Paiement : FedaPay / KkiaPay
- Monitoring : Sentry (backend + frontend, inactif sans DSN)
- Hébergement : backend + DB sur Render, frontend sur Vercel (détails : [docs/stack-technique.md](docs/stack-technique.md))

## Déploiement

- Le déploiement se fait automatiquement sur push vers `main` (Render pour le backend + DB, Vercel pour le frontend). Ne jamais essayer de déployer manuellement ou de simuler un déploiement en local.

## Design
Toujours utiliser ou s'inpirer de la maque figma pour les interfaces frontend.
/home/zelofane/projets/ANIFOWOCHE-E-commerce/docs/ANIFIWOSHE Mockup Figma

## choix de model et de niveau d'effort
Avant d'executer une tâche, identifie d'abord le model adapté pour la tâche.
Sortie attendue : Model : Effort
Ensuite tu attends ma confirmation que j'ai changé de model avant d'excuter la tâche.
Cela devrais permettre le gaspillage de tockens.