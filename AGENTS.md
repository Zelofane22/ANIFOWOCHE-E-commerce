# AGENTS.md

Directives pour Codex sur ce projet ANIFOWOCHE E-commerce.

## Environnement d'exécution

- Ne jamais lancer l'application en local hors Docker. Pas de `python manage.py runserver`, `npm run dev`, `npm start`, installation locale Python/Node/PostgreSQL, etc.
- Tout passe par Docker Compose, voir [docs/docker.md](docs/docker.md).
- Le fichier `docker-compose.yml` vit dans `code/`.
- Le code source est sous `code/backend/` et `code/frontend/`.
- Depuis la racine du repo, utiliser `docker compose -f code/docker-compose.yml ...`.
- Pour démarrer l'environnement : `docker compose -f code/docker-compose.yml up --build`.
- Pour exécuter une commande dans un service : `docker compose -f code/docker-compose.yml exec <service> <commande>`.
- Exemple migrations : `docker compose -f code/docker-compose.yml exec backend python manage.py migrate`.
- Ne reconstruire les images avec `--build` qu'après un changement de `requirements.txt`, `package.json` ou d'un Dockerfile. Le code est monté en volume.
- Services locaux Docker :
  - frontend Vite : http://localhost:5173
  - backend Django : http://localhost:8000
  - db PostgreSQL : localhost:5432

## Stack

- Frontend : React + Vite + Tailwind CSS + React Router + Axios
- Backend : Django + Django REST Framework + PostgreSQL
- Auth : JWT avec `djangorestframework-simplejwt`
- Paiement : FedaPay / KkiaPay
- Hébergement MVP : backend + PostgreSQL sur Render, frontend sur Vercel
- Documentation de référence : [docs/stack-technique.md](docs/stack-technique.md), [docs/ci-cd.md](docs/ci-cd.md)

## Déploiement

- Le déploiement se fait automatiquement sur push vers `main`.
- Render héberge le backend Django et PostgreSQL.
- Vercel héberge le frontend React/Vite.
- Ne pas tenter de déployer manuellement ou de simuler un déploiement en local sans demande explicite.

## Frontend et design

- Toujours utiliser ou s'inspirer de la maquette Figma exportée pour les interfaces frontend :
  `/home/zelofane/projets/ANIFOWOCHE-E-commerce/docs/ANIFIWOSHE Mockup Figma`
- Conserver la logique métier existante : appels API, panier, auth, checkout, dashboard.
- Améliorer l'UI sans casser les routes existantes.
- Vérifier les interfaces sur mobile et desktop quand l'environnement permet de lancer Docker.

## Pratiques de modification

- Lire le code existant avant de modifier.
- Ne pas écraser les changements utilisateur déjà présents dans le worktree.
- Garder les changements ciblés sur la demande.
- Pour les tests et builds, préférer les commandes Docker Compose du projet.
- Si une commande nécessaire échoue parce qu'un outil manque hors Docker, le signaler clairement.


### multi agents
utiliser le mode multi agents quand c'est neccessaire pour les grosses tâches full-stck pour améliorer la productivité

## Workflow worktrees

Après toute tâche sur un worktree :
- Faire le commit des changements avec un message clair
- Pousser vers `develop` avec `git push origin HEAD:develop`
- Ne pas laisser de changements non-commités dans le worktree

Cela garantit que le travail remonte sur la branche principale (`develop` → Railway auto-déploie).

## choix de model et de niveau d'effort
Avant d'executer une tâche, identifie d'abord le model adapté pour la tâche.
Sortie attendue : Model : Effort
Ensuite tu attends ma confirmation que j'ai changé de model avant d'excuter la tâche.
Cela devrais permettre le gaspillage de tockens.