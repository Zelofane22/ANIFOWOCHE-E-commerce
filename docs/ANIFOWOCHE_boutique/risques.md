# ⚠️ Analyse des risques

[← Retour au README](../README.md)

| Risque | Probabilité | Impact | Mitigation |
|--------|--------------|--------|------------|
| Intégration FedaPay API complexe (webhooks, sandbox) | Haute | Élevé | Dédier 5h au sprint 2, tester en sandbox dès le sprint 1 |
| Render : coût ou limites du tier choisi pour backend + PostgreSQL | Moyenne | Moyen | Surveiller consommation, backups et quotas avant l'ouverture publique ; migrer vers Hostinger/VPS si le coût devient trop élevé |
| Render : cold start ou latence backend selon le plan retenu | Moyenne | Faible | Acceptable pour prototype ; tester le temps de réponse avant lancement beta |
| Weekend indisponible (partiels, fatigue alternance) | Moyenne | Moyen | Marge de 3h/sprint + durée sprint 3 semaines |
| Logistique livraison Cotonou non définie | Haute | Élevé | Définir le processus (livreur, zones, prix) avant le sprint 3 |
| Démarches administratives FedaPay longues | Haute | Élevé | Lancer l'inscription FedaPay dès le sprint 1 en parallèle |
| Courbe d'apprentissage Django REST Framework | Moyenne | Moyen | Prévoir 2h/sprint pour documentation + tutoriels DRF |
