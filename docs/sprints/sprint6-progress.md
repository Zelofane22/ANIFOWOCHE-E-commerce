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

- [x] 4. US-37 — Sauvegardes automatiques PostgreSQL (Render) + monitoring erreurs (Sentry). SDK Sentry
  intégré backend (`settings.py`) et frontend (`main.jsx` + error boundary + source maps Vite) ; workflow
  de sauvegarde quotidienne chiffrée [db-backup.yml](../../.github/workflows/db-backup.yml) en place
  (pg_dump + GPG + artifact 30 jours — voir [docs/backups.md](../backups.md)) ; secrets GitHub
  (`RENDER_DATABASE_URL`, `BACKUP_PASSPHRASE`) et Vercel (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
  `SENTRY_PROJECT`) configurés — validé le 17 juillet 2026.

## Hors boucle — en attente de l'utilisateur

- [ ] US-32 — Vraies clés FedaPay/KkiaPay sandbox → test paiement réel → clés prod

## Reportée (pas de sprint assigné)

- US-33 — Vraies clés WhatsApp Business API → test notification réelle. Pas d'actualité pour l'instant ;
  déplacée en [E15 — Fonctionnalités futures](../backlog-v2.md#e15--fonctionnalités-futures-reportées)
  du backlog v2, à reprendre bien plus tard. Email reste le canal de notification par défaut d'ici là.

**Livrable Sprint 6** (boucle auto) : rôles admin métier prêts à l'emploi + audit de sécurité documenté
et failles corrigeables sans clés externes corrigées + relance des paiements échoués (US-34) +
sauvegardes BDD automatisées et monitoring Sentry opérationnels (US-37). Seule US-32 reste bloquée sur
de vraies clés FedaPay/KkiaPay ; US-33 est reportée sans échéance.
