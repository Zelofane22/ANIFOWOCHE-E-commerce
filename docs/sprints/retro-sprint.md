# 🔄 Rétrospective — Sprints 2 & 3

**Date :** 2026-07-01
**Participants :** Chef de projet + [Père]
**Durée :** ~30 minutes

> Sprints 2 et 3 exécutés via une boucle automatisée (une tâche du backlog toutes les 30 min, un commit local testé après chacune — voir [sprint2-progress.md](sprint2-progress.md) et [sprint3-progress.md](sprint3-progress.md)). Les métriques ci-dessous reflètent donc un rythme différent des 21h/sprint prévues au planning ; à relire avec le père avant de calibrer le Sprint 4.

---

## ✅ Ce qui a bien fonctionné

- Panier, auth JWT, paiement FedaPay (placeholder), checkout, livraison et notifications s'enchaînent proprement de bout en bout — testés manuellement via docker compose à chaque étape avant de cocher la case.
- Le pattern "appeler la vraie API externe (FedaPay, WhatsApp Cloud) avec des clés placeholder" a permis de valider le contrat d'intégration (payload, auth, gestion d'erreur) sans attendre de vraies clés sandbox.
- Deux bugs réels détectés et corrigés grâce aux tests manuels en conditions Docker avant de cocher une tâche : un champ `status` accidentellement en lecture seule sur `Delivery`, et un doublon de livraison qui plantait en 500 au lieu de renvoyer une erreur propre.
- La préparation du déploiement (Dockerfile prod, WhiteNoise, `DATABASE_URL`) a été validée dans un conteneur jetable sans jamais toucher à l'environnement de dev ni déployer réellement.

## ⚠️ Ce qui a bloqué ou posé problème

- Aucune vraie clé FedaPay / WhatsApp Business n'était disponible : les intégrations sont codées et testées côté contrat (erreurs gérées proprement), mais un vrai paiement ou une vraie notification n'ont jamais été envoyés bout en bout. À refaire avec les vraies clés avant le lancement beta.
- Les endpoints commandes/paiements/livraisons étaient ouverts à tout le monde (`AllowAny`) jusqu'à la construction du dashboard admin (Sprint 3, tâche 4) — la restriction `IsAdminUser` n'a été ajoutée qu'à ce moment-là, pas dès la création des modèles. Point de vigilance sécurité pour le Sprint 4 (US-19).
- Premiers tests automatisés du projet écrits seulement en toute fin de Sprint 3 (`docs/ci-cd.md` le signalait déjà comme dette). 29 tests ajoutés (products, orders, users, payments, delivery, notifications), tous verts, mais pas encore de tests frontend (Vitest) ni de tests de bout en bout multi-services.

## 🔧 Actions d'amélioration pour le Sprint 4

| Action | Responsable | Échéance |
|--------|-------------|----------|
| Obtenir de vraies clés sandbox FedaPay + WhatsApp Business et refaire un test de paiement/notification réel | Chef de projet | Avant lancement beta |
| Revoir les permissions dès la création d'un modèle exposant des données sensibles (pas seulement au moment du dashboard) | Chef de projet | Début Sprint 4 |
| Ajouter des tests frontend (Vitest) pour le panier, le checkout et l'auth | Chef de projet | Sprint 4 |

---

## 📊 Bilan du sprint

| Métrique | Valeur |
|----------|--------|
| Stories complétées | Sprint 2 : 6/6 · Sprint 3 : 5/5 |
| Heures consommées | Non mesurées (exécution automatisée, pas de suivi horaire manuel) |
| Issues reportées au Sprint 4 | Vraies clés API sandbox à intégrer ; tests frontend à écrire |

---

## 💬 Retours du père (utilisateur admin)

> À recueillir lors de la prochaine session avec le père — pas encore testé manuellement par un humain à cette date.
