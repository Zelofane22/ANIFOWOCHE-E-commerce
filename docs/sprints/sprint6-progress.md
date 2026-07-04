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

## Hors boucle — en attente de l'utilisateur

- [ ] US-32 — Vraies clés FedaPay/KkiaPay sandbox → test paiement réel → clés prod
- [ ] US-33 — Vraies clés WhatsApp Business API → test notification réelle
- [ ] US-37 — Sauvegardes automatiques PostgreSQL (Render) + monitoring erreurs (Sentry ou équivalent).
  **Partie code faite (juillet 2026)** : SDK Sentry intégré backend (`settings.py`, inactif sans
  `SENTRY_DSN`) et frontend (`main.jsx` + error boundary + source maps Vite, inactif sans
  `VITE_SENTRY_DSN`). Reste : créer les 2 projets sentry.io, renseigner les DSN sur Render/Vercel
  (voir [render.md](../render.md) et [ci-cd.md](../ci-cd.md)), activer les backups Render.
- [ ] US-34 — Paiements échoués visibles/relançables (P3, non prioritaire pour ce sprint)

**Livrable partiel Sprint 6** (boucle auto) : rôles admin métier prêts à l'emploi + audit de sécurité
documenté et failles corrigeables sans clés externes corrigées.
