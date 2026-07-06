# 💾 Sauvegardes de la base de données (US-37)

[← Retour au README](../README.md)

## Vue d'ensemble

La base PostgreSQL de production (`anifowoche-db`) est hébergée sur Render en plan **free**, qui ne
fournit **aucune sauvegarde automatique** (les backups quotidiens managés sont réservés aux plans
payants). Deux dispositifs se complètent :

| Dispositif | Statut | Coût |
|---|---|---|
| Workflow GitHub Actions [`db-backup.yml`](../.github/workflows/db-backup.yml) : `pg_dump` quotidien chiffré, stocké en artifact | ✅ En place (secrets à configurer) | Gratuit |
| Backups managés Render (quotidiens + restauration point-in-time) | ⏳ Optionnel — nécessite un passage au plan payant | Payant |

## Workflow GitHub Actions

Chaque nuit à 03:00 UTC (ou manuellement via *Actions → DB Backup → Run workflow*) :

1. `pg_dump --format=custom` sur l'URL de connexion externe de la base Render (format compressé,
   restaurable sélectivement avec `pg_restore`) ;
2. chiffrement symétrique GPG (AES-256) — le dump contient des données personnelles clients et des
   hashes de mots de passe, il ne doit jamais être stocké en clair hors de la base ;
3. upload comme artifact GitHub avec **30 jours de rétention** (les artifacts ne sont accessibles
   qu'aux comptes ayant accès au repo).

Tant que les secrets ne sont pas configurés, le workflow se termine en succès avec une notice
« sauvegarde ignorée » — aucun échec quotidien parasite avant la mise en production.

### Secrets à configurer (GitHub → Settings → Secrets and variables → Actions)

| Secret | Valeur |
|---|---|
| `RENDER_DATABASE_URL` | **External Database URL** de `anifowoche-db` (dashboard Render → base → *Connect* → *External*). Attention : c'est bien l'URL *externe* — l'URL interne n'est joignable que depuis les services Render. |
| `BACKUP_PASSPHRASE` | Passphrase longue et aléatoire (ex. `openssl rand -base64 32`). **À conserver dans un gestionnaire de mots de passe** : sans elle, les sauvegardes sont indéchiffrables. |

## Restaurer une sauvegarde

1. Télécharger l'artifact depuis l'onglet *Actions* du repo (run « DB Backup » voulu), puis :

```bash
# Déchiffrer (la passphrase est demandée interactivement)
gpg --decrypt --output anifowoche-db.dump anifowoche-db-2026-07-05.dump.gpg

# Restaurer vers la base cible (écrase les objets existants)
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname "$DATABASE_URL" anifowoche-db.dump
```

2. Vérifier l'application (connexion admin, liste des commandes) après restauration.

Pour un test de restauration sans toucher à la prod, restaurer vers la base Docker locale :

```bash
docker compose -f code/docker-compose.yml cp anifowoche-db.dump db:/tmp/
docker compose -f code/docker-compose.yml exec db \
  pg_restore --clean --if-exists --no-owner --no-privileges \
  -U anifowoche -d anifowoche /tmp/anifowoche-db.dump
```

## Option : backups managés Render (plan payant)

Si le projet passe la base sur un plan payant Render, les sauvegardes quotidiennes managées et la
restauration point-in-time s'activent sans configuration (dashboard Render → base → *Recovery*).
Le workflow GitHub Actions reste utile comme copie **hors Render** (une sauvegarde chez le même
hébergeur que la base ne protège pas d'un incident de compte ou de facturation).

## Limites connues

- L'URL externe de la base free Render est accessible depuis Internet (protégée par mot de passe) :
  c'est ce qui permet au runner GitHub de s'y connecter. Ne jamais committer cette URL.
- Rétention de 30 jours seulement, sans archivage long terme. Si un besoin d'archives mensuelles
  apparaît, prévoir un upload complémentaire vers un stockage objet (Cloudinary raw, S3, etc.).
- Les bases free Render **expirent et sont supprimées après la période d'essai** indiquée sur le
  dashboard — les sauvegardes de ce workflow sont alors le seul filet de sécurité.
