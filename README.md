# 🛍️ ANIFOWOCHE — Plateforme e-commerce

> Boutique en ligne de tissus locaux, vêtements et accessoires homme — Cotonou, Bénin.

---

## 📌 À propos du projet

ANIFOWOCHE digitalise un commerce physique de mode masculine au Bénin.  
La plateforme permet aux clients de Cotonou de commander en ligne et de payer via **MTN Money**, **Moov Money** ou carte bancaire, avec livraison à domicile.

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| CMS / E-commerce | WordPress + WooCommerce |
| Hébergement | Hostinger (plan Business) |
| Paiement | FedaPay / KkiaPay |
| Gestion de projet | GitHub Projects |
| Communication | WhatsApp Business |

---

## 📁 Structure du repo

```
anifowoche/
├── .github/
│   ├── ISSUE_TEMPLATE/       # Templates pour les issues GitHub
│   └── workflows/            # GitHub Actions (CI/CD futur)
├── .wordpress/
│   ├── themes/
│   │   └── anifowoche-child/ # Thème enfant WooCommerce personnalisé
│   └── plugins/              # Plugins développés sur mesure (si besoin)
├── docs/
│   ├── sprints/              # Notes de sprint & rétrospectives
│   └── decisions/            # ADR — Architecture Decision Records
├── assets/
│   ├── images/               # Visuels produits & branding
│   └── mockups/              # Maquettes des pages
└── README.md
```

---

## 🗓️ Planning Agile

| Sprint | Thème | Durée | Livrable |
|--------|-------|-------|----------|
| Sprint 1 | Installation & catalogue | Sem. 1–3 (21h) | Site visible en ligne |
| Sprint 2 | Panier & paiement | Sem. 4–6 (21h) | 1ère commande test payée |
| Sprint 3 | Livraison & admin | Sem. 7–9 (21h) | Flux commande complet |
| Sprint 4 | Compte client & lancement | Sem. 10–12 (21h) | MVP en production |

> Capacité : **7h/semaine** (principalement le weekend — alternance ingénierie de production)

---

## 💳 Paiements supportés (MVP)

- MTN Mobile Money
- Moov Money
- Visa / Mastercard

---

## 🚀 Démarrage rapide

1. Cloner le repo : `git clone https://github.com/TON_USERNAME/anifowoche.git`
2. Installer WordPress + WooCommerce sur Hostinger
3. Copier `/.wordpress/themes/anifowoche-child/` dans `wp-content/themes/`
4. Activer le thème enfant dans l'admin WordPress
5. Installer le plugin FedaPay WooCommerce

---

## 📋 Contribuer

Ce projet est développé en solo (méthodologie Agile).  
Toutes les tâches sont suivies via **[GitHub Projects](../../projects)**.

---

*Projet personnel — © 2026 ANIFOWOCHE*
