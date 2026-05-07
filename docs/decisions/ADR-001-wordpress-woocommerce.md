# ADR-001 — Choix de WordPress + WooCommerce

**Date :** 7 mai 2026  
**Statut :** Accepté

---

## Contexte

Le projet nécessite une plateforme e-commerce opérationnelle rapidement, par un développeur solo de niveau intermédiaire, avec un budget < 5 €/mois.

## Décision

Utiliser **WordPress + WooCommerce** comme plateforme e-commerce.

## Justification

- Open source, gratuit, zéro commission sur les ventes
- Plugins de paiement locaux disponibles (FedaPay, KkiaPay)
- Niveau intermédiaire suffisant pour personnaliser
- Communauté large, documentation abondante en français
- Hébergement simple via Hostinger (installation en 1 clic)

## Alternatives écartées

| Alternative | Raison d'exclusion |
|-------------|-------------------|
| Shopify | Commission de 2 % + abonnement ~29 $/mois, pas adapté au budget |
| Wix e-commerce | Moins flexible, SEO limité, plugin paiement local inexistant |
| Développement custom | Trop long pour un développeur solo avec 7h/semaine |
| PrestaShop | Courbe d'apprentissage plus raide, moins de plugins pour le Bénin |

## Conséquences

- Maintenance WordPress à assurer (mises à jour régulières)
- Dépendance aux plugins WooCommerce tiers pour le paiement
- Migration vers une solution custom possible en phase 2 si le trafic croît fortement
