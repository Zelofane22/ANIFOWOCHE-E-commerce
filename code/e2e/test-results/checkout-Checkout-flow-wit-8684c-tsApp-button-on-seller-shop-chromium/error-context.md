# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> Checkout flow with WhatsApp button for non-Business sellers >> product page has WhatsApp button on seller shop
- Location: tests/checkout.spec.ts:66:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href*="/sellers/"]').first()

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - navigation [ref=f1e5]:
      - link "ANIFOWOCHE ANIFOWOCHE" [ref=f1e7] [cursor=pointer]:
        - /url: /
        - img "ANIFOWOCHE" [ref=f1e8]
        - generic [ref=f1e9]: ANIFOWOCHE
      - generic [ref=f1e10]:
        - searchbox "Rechercher un tissu, vêtement, accessoire..." [ref=f1e11]
        - button "Rechercher" [ref=f1e12]
      - generic [ref=f1e16]:
        - link "Bonjour, identifiez-vous Compte et listes" [ref=f1e17] [cursor=pointer]:
          - /url: /compte
          - generic [ref=f1e21]:
            - generic [ref=f1e22]: Bonjour, identifiez-vous
            - generic [ref=f1e23]: Compte et listes
        - link "Panier" [ref=f1e26] [cursor=pointer]:
          - /url: /panier
    - generic [ref=f1e33]:
      - link "Vendre" [ref=f1e34] [cursor=pointer]:
        - /url: https://seller.anifowoche.com
      - link "Toutes les catégories" [ref=f1e39] [cursor=pointer]:
        - /url: /catalogue
      - link "Catalogue" [ref=f1e41] [cursor=pointer]:
        - /url: /catalogue
      - link "Accessoires" [ref=f1e43] [cursor=pointer]:
        - /url: /catalogue?category=accessoires
      - link "Alimentation" [ref=f1e44] [cursor=pointer]:
        - /url: /catalogue?category=food
      - link "Bien-être" [ref=f1e45] [cursor=pointer]:
        - /url: /catalogue?category=bien-etre
      - link "Chaussures" [ref=f1e46] [cursor=pointer]:
        - /url: /catalogue?category=chaussures
      - generic [ref=f1e47]: Livraison Cotonou
  - main [ref=f1e52]:
    - generic [ref=f1e54]:
      - generic [ref=f1e55]:
        - heading "Nos vendeurs" [level=1] [ref=f1e56]
        - paragraph [ref=f1e57]: Parcourez les boutiques de nos vendeurs et retrouvez leurs articles directement sur ANIFOWOCHE.
      - alert [ref=f1e58]: Impossible de charger les vendeurs pour le moment.
  - contentinfo [ref=f1e59]:
    - generic [ref=f1e61]:
      - generic [ref=f1e68]:
        - paragraph [ref=f1e69]: Livraison rapide
        - paragraph [ref=f1e70]: Cotonou en 24-48h
      - generic [ref=f1e76]:
        - paragraph [ref=f1e77]: Paiement sécurisé
        - paragraph [ref=f1e78]: MTN, Moov, Visa
      - generic [ref=f1e83]:
        - paragraph [ref=f1e84]: Prix artisans
        - paragraph [ref=f1e85]: Direct boutique locale
      - generic [ref=f1e90]:
        - paragraph [ref=f1e91]: Support WhatsApp
        - paragraph [ref=f1e92]: Suivi de commande
    - generic [ref=f1e93]:
      - generic [ref=f1e94]:
        - link [ref=f1e95] [cursor=pointer]:
          - /url: /
          - img "ANIFOWOCHE" [ref=f1e96]
        - paragraph [ref=f1e97]: Le site ecommerce 100% béninois, pour découvrir et acheter des produits locaux de qualité.
      - generic [ref=f1e98]:
        - generic [ref=f1e99]:
          - paragraph [ref=f1e100]: Boutique
          - link "Catalogue" [ref=f1e101] [cursor=pointer]:
            - /url: /catalogue
          - link "Vendeurs" [ref=f1e102] [cursor=pointer]:
            - /url: /sellers
          - link "Panier" [ref=f1e103] [cursor=pointer]:
            - /url: /panier
          - link "Compte" [ref=f1e104] [cursor=pointer]:
            - /url: /compte
        - generic [ref=f1e105]:
          - paragraph [ref=f1e106]: Services
          - generic [ref=f1e107]: Livraison Cotonou
          - generic [ref=f1e108]: Paiement mobile
          - generic [ref=f1e109]: Support client
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Checkout flow with WhatsApp button for non-Business sellers', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Go to home page
  6  |     await page.goto('/');
  7  |     await expect(page).toHaveTitle(/ANIFOWOCHE/);
  8  |   });
  9  | 
  10 |   test('full checkout flow: browse → product → cart → checkout with WhatsApp button', async ({ page }) => {
  11 |     test.setTimeout(180_000);
  12 | 
  13 |     // Compte seedé par `manage.py seed_e2e` (CLIENT_EMAIL / CLIENT_PASSWORD).
  14 |     await page.goto('/compte');
  15 |     await page.locator('#login-username').fill('client@e2e.test');
  16 |     await page.locator('#login-password').fill('ClientE2E!2026');
  17 |     await page.getByRole('button', { name: 'Se connecter' }).click();
  18 |     await expect(page.getByRole('button', { name: /Se déconnecter/i })).toBeVisible();
  19 | 
  20 |     // Produit d'un vendeur non Business (seed E2E) : seul cas où le bouton WhatsApp apparaît.
  21 |     await page.goto('/produits/tissu-wax-e2e');
  22 |     await page.waitForURL(/\/produits\//);
  23 |     // Use CSS selector for "Panier" button (getByRole misses it due to hidden/display issues)
  24 |     const addToCartBtn = page.locator('button:has-text("Panier")').first();
  25 |     await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });
  26 |     await addToCartBtn.click();
  27 |     // Cart updates optimistically; wait briefly for header count
  28 |     await page.waitForTimeout(1000);
  29 | 
  30 |     // Cart link already shows count (verified in snapshot) - click it
  31 |     await page.getByRole('link', { name: 'Panier', exact: true }).first().click();
  32 |     await page.waitForURL(/\/panier/);
  33 |     // "Passer la commande" button in summary aside (not the fixed mobile one at bottom)
  34 |     const checkoutBtn = page.locator('button:has-text("Passer la commande")').nth(0);  // first = summary aside, second = fixed mobile (hidden on desktop)
  35 |     await checkoutBtn.waitFor({ state: 'visible', timeout: 10000 });
  36 |     await checkoutBtn.click({ force: true });
  37 |     await page.waitForURL(/\/commande/);
  38 | 
  39 |     await expect(page.locator('h1')).toContainText(/Adresse|Livraison|Informations/i);
  40 |     await page.getByLabel('Nom complet').fill('Jean Test');
  41 |     await page.getByLabel(/Téléphone/i).fill('+229 01 00 00 00');
  42 | 
  43 |     const zoneSelect = page.getByLabel(/Quartier|Zone/i);
  44 |     if (await zoneSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
  45 |       await zoneSelect.selectOption({ index: 0 });
  46 |     }
  47 |     const slotBtn = page.getByRole('button', { name: /Matin|Soir|Créneau/i }).first();
  48 |     if (await slotBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  49 |       await slotBtn.click();
  50 |     }
  51 | 
  52 |     await page.getByRole('button', { name: /Continuer vers le paiement|Continuer|Suivant/i }).click();
  53 | 
  54 |     await expect(page.locator('h1')).toContainText(/Moyen de paiement/i);
  55 |     await expect(page.getByRole('button', { name: /Paiement à la livraison/i }).first()).toBeVisible();
  56 | 
  57 |     const whatsappBlock = page.getByText('Commander directement sur WhatsApp').first();
  58 |     await expect(whatsappBlock).toBeVisible();
  59 |     const whatsappLink = page.locator('a[href*="wa.me"]').first();
  60 |     await expect(whatsappLink).toBeVisible();
  61 |     await expect(whatsappLink).toContainText(/WhatsApp/i);
  62 |     const href = await whatsappLink.getAttribute('href');
  63 |     expect(href).toMatch(/^https:\/\/wa\.me\//);
  64 |   });
  65 | 
  66 |   test('product page has WhatsApp button on seller shop', async ({ page }) => {
  67 |     // Go to a public shop
  68 |     await page.goto('/sellers/');
  69 |     await page.waitForURL(/\/sellers/);
  70 | 
  71 |     // Click first shop
  72 |     const shopLink = page.locator('a[href*="/sellers/"]').first();
> 73 |     await shopLink.click();
     |                    ^ Error: locator.click: Test timeout of 30000ms exceeded.
  74 |     await page.waitForURL(/\/sellers\/[^/]+$/);
  75 | 
  76 |     // Check for WhatsApp share button on shop page
  77 |     const whatsappShareBtn = page.getByRole('button', { name: /WhatsApp/i }).first();
  78 |     if (await whatsappShareBtn.isVisible({ timeout: 3000 })) {
  79 |       await expect(whatsappShareBtn).toBeVisible();
  80 |     }
  81 |   });
  82 | });
  83 | 
```