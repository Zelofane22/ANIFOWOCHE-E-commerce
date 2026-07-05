# 🚧 Sprint 6 — Suivi de progression

[← Retour au planning v2](planning-v2.md)

Sprint 6 complet = E8 (US-32, US-33, US-34) + E9 (US-35 à US-38). Les tâches nécessitant de vraies
clés/comptes externes (paiement FedaPay/KkiaPay, WhatsApp Business, Sentry/backups Render) sont **hors
scope de cette boucle automatisée** : elles attendent que l'utilisateur fournisse les identifiants réels.

Exécuté via une boucle automatisée (une tâche toutes les ~10 min, un commit local testé après chacune —
même mécanisme que [Sprint 5](sprint5-progress.md)). Chaque tâche ne démarre qu'une fois la précédente
committée. Aucun push pendant la boucle — commits locaux uniquement.

- [x] 1. US-35 — Rôles admin prédéfinis (Gestion catalogue / Gestion commandes / Support client) avec permissions pré-remplies
- [x] 2. US-38 — Revue de sécurité complète (rate limiting, secrets, HTTPS, dépendances à jour) avant ouverture publique
- [x] 3. US-34 — Paiements échoués visibles/relançables (juillet 2026) : échec d'initiation FedaPay et
  webhooks `declined`/`canceled` remontent dans la cloche backoffice (`BackofficeNotification`, kind
  « Paiement échoué », lien direct vers le paiement) ; action admin « Relancer le paiement » sur la
  liste des paiements — nouvelle ligne `Payment` + nouvelle transaction FedaPay, lien de paiement
  envoyé au client (event `payment_retry`, email par défaut). Garde-fous : uniquement statuts
  échec/refusé/annulé, FedaPay seulement, refus si la commande a déjà un paiement approuvé ou si le
  moyen de paiement est désactivé. Le test réel de bout en bout reste conditionné aux clés FedaPay (US-32).

## Hors boucle — en attente de l'utilisateur

- [ ] US-32 — Vraies clés FedaPay/KkiaPay sandbox → test paiement réel → clés prod
- [ ] US-33 — Vraies clés WhatsApp Business API → test notification réelle
- [ ] US-37 — Sauvegardes automatiques PostgreSQL (Render) + monitoring erreurs (Sentry ou équivalent).
  **Partie code faite (juillet 2026)** : SDK Sentry intégré backend (`settings.py`) et frontend
  (`main.jsx` + error boundary + source maps Vite) avec DSN configurés ; workflow de sauvegarde
  quotidienne chiffrée [db-backup.yml](../../.github/workflows/db-backup.yml) en place (pg_dump +
  GPG + artifact 30 jours — le plan free Render n'a pas de backups managés, voir
  [docs/backups.md](../backups.md)). **Reste (actions manuelles dashboards)** : ajouter les secrets
  GitHub `RENDER_DATABASE_URL` + `BACKUP_PASSPHRASE`, et `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
  `SENTRY_PROJECT` côté Vercel pour l'upload des source maps (voir [ci-cd.md](../ci-cd.md)).

**Livrable partiel Sprint 6** (boucle auto) : rôles admin métier prêts à l'emploi + audit de sécurité
documenté et failles corrigeables sans clés externes corrigées + relance des paiements échoués (US-34)
+ sauvegardes BDD automatisées côté code (US-37).
