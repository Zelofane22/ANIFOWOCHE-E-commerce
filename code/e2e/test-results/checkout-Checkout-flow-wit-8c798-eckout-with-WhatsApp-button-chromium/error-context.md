# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> Checkout flow with WhatsApp button for non-Business sellers >> full checkout flow: browse → product → cart → checkout with WhatsApp button
- Location: tests/checkout.spec.ts:10:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="product-card"], .product-card, article').first() to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - navigation [ref=e5]:
      - link "ANIFOWOCHE ANIFOWOCHE" [ref=e7] [cursor=pointer]:
        - /url: /
        - img "ANIFOWOCHE" [ref=e8]
        - generic [ref=e9]: ANIFOWOCHE
      - generic [ref=e10]:
        - searchbox "Rechercher un tissu, vêtement, accessoire..." [ref=e11]
        - button "Rechercher" [ref=e12]
      - generic [ref=e16]:
        - link "Bonjour, identifiez-vous Compte et listes" [ref=e17] [cursor=pointer]:
          - /url: /compte
          - generic [ref=e21]:
            - generic [ref=e22]: Bonjour, identifiez-vous
            - generic [ref=e23]: Compte et listes
        - link "Panier" [ref=e26] [cursor=pointer]:
          - /url: /panier
    - generic [ref=e33]:
      - link "Vendre" [ref=e34] [cursor=pointer]:
        - /url: https://seller.anifowoche.com
      - link "Toutes les catégories" [ref=e39] [cursor=pointer]:
        - /url: /catalogue
      - link "Catalogue" [active] [ref=e41] [cursor=pointer]:
        - /url: /catalogue
      - link "Accessoires" [ref=e43] [cursor=pointer]:
        - /url: /catalogue?category=accessoires
      - link "Alimentation" [ref=e44] [cursor=pointer]:
        - /url: /catalogue?category=food
      - link "Bien-être" [ref=e45] [cursor=pointer]:
        - /url: /catalogue?category=bien-etre
      - link "Chaussures" [ref=e46] [cursor=pointer]:
        - /url: /catalogue?category=chaussures
      - generic [ref=e47]: Livraison Cotonou
  - main [ref=e52]:
    - generic [ref=e54]:
      - paragraph [ref=e57]: Catalogue
      - generic [ref=e58]:
        - generic [ref=e59]:
          - generic [ref=e60]: Recherche produit
          - searchbox "Recherche produit" [ref=e62]
        - generic [ref=e67]:
          - button "Tout" [ref=e68]
          - button "Accessoires" [ref=e69]
          - button "Bien-être" [ref=e70]
          - button "Chaussures" [ref=e71]
          - button "Senteurs" [ref=e72]
        - generic [ref=e74]:
          - generic [ref=e75]:
            - text: Prix min
            - spinbutton "Prix min" [ref=e76]
          - generic [ref=e77]:
            - text: Prix max
            - spinbutton "Prix max" [ref=e78]
          - generic [ref=e79]:
            - text: Unité
            - combobox "Unité" [ref=e80]:
              - option "Toutes" [selected]
              - option "Pièce"
              - option "Mètre"
          - generic [ref=e81]:
            - checkbox "En stock uniquement" [ref=e82]
            - text: En stock uniquement
          - generic [ref=e83]:
            - text: Trier par
            - combobox "Trier par" [ref=e84]:
              - option "Pertinence" [selected]
              - option "Prix croissant"
              - option "Prix décroissant"
        - heading "Sélection ANIFOWOCHE" [level=2] [ref=e87]
        - generic [ref=e89]:
          - link "Roberto Guerrini Chaussures Roberto Guerrini Pas encore d'avis Livraison Cotonou 55 000 F" [ref=e90] [cursor=pointer]:
            - /url: /produits/roberto-guerrini
            - generic [ref=e91]:
              - img "Roberto Guerrini" [ref=e92]
              - generic [ref=e93]: Chaussures
            - generic [ref=e94]:
              - heading "Roberto Guerrini" [level=3] [ref=e95]
              - generic [ref=e96]: Pas encore d'avis
              - generic [ref=e98]: Livraison Cotonou
              - paragraph [ref=e100]: 55 000 F
          - link "Berluti Chaussures Berluti Pas encore d'avis Livraison Cotonou 55 000 F" [ref=e101] [cursor=pointer]:
            - /url: /produits/berluti
            - generic [ref=e102]:
              - img "Berluti" [ref=e103]
              - generic [ref=e104]: Chaussures
            - generic [ref=e105]:
              - heading "Berluti" [level=3] [ref=e106]
              - generic [ref=e107]: Pas encore d'avis
              - generic [ref=e109]: Livraison Cotonou
              - paragraph [ref=e111]: 55 000 F
          - link "Manchette Accessoires Plus que 4 Manchette Pas encore d'avis Livraison Cotonou 7 000 F" [ref=e112] [cursor=pointer]:
            - /url: /produits/manchette-8
            - generic [ref=e113]:
              - img "Manchette" [ref=e114]
              - generic [ref=e115]: Accessoires
              - generic [ref=e116]: Plus que 4
            - generic [ref=e117]:
              - heading "Manchette" [level=3] [ref=e118]
              - generic [ref=e119]: Pas encore d'avis
              - generic [ref=e121]: Livraison Cotonou
              - paragraph [ref=e123]: 7 000 F
          - link "Manchette Accessoires Manchette Pas encore d'avis Livraison Cotonou 7 000 F" [ref=e124] [cursor=pointer]:
            - /url: /produits/manchette-7
            - generic [ref=e125]:
              - img "Manchette" [ref=e126]
              - generic [ref=e127]: Accessoires
            - generic [ref=e128]:
              - heading "Manchette" [level=3] [ref=e129]
              - generic [ref=e130]: Pas encore d'avis
              - generic [ref=e132]: Livraison Cotonou
              - paragraph [ref=e134]: 7 000 F
          - link "Manchette Accessoires Manchette Pas encore d'avis Livraison Cotonou 7 000 F" [ref=e135] [cursor=pointer]:
            - /url: /produits/manchette-6
            - generic [ref=e136]:
              - img "Manchette" [ref=e137]
              - generic [ref=e138]: Accessoires
            - generic [ref=e139]:
              - heading "Manchette" [level=3] [ref=e140]
              - generic [ref=e141]: Pas encore d'avis
              - generic [ref=e143]: Livraison Cotonou
              - paragraph [ref=e145]: 7 000 F
          - link "Manchette Accessoires Manchette Pas encore d'avis Livraison Cotonou 7 000 F" [ref=e146] [cursor=pointer]:
            - /url: /produits/manchette-5
            - generic [ref=e147]:
              - img "Manchette" [ref=e148]
              - generic [ref=e149]: Accessoires
            - generic [ref=e150]:
              - heading "Manchette" [level=3] [ref=e151]
              - generic [ref=e152]: Pas encore d'avis
              - generic [ref=e154]: Livraison Cotonou
              - paragraph [ref=e156]: 7 000 F
          - link "Manchette Accessoires Manchette Pas encore d'avis Livraison Cotonou 7 000 F" [ref=e157] [cursor=pointer]:
            - /url: /produits/manchette-4
            - generic [ref=e158]:
              - img "Manchette" [ref=e159]
              - generic [ref=e160]: Accessoires
            - generic [ref=e161]:
              - heading "Manchette" [level=3] [ref=e162]
              - generic [ref=e163]: Pas encore d'avis
              - generic [ref=e165]: Livraison Cotonou
              - paragraph [ref=e167]: 7 000 F
          - link "Manchette Accessoires Manchette Pas encore d'avis Livraison Cotonou 7 000 F" [ref=e168] [cursor=pointer]:
            - /url: /produits/manchette-3
            - generic [ref=e169]:
              - img "Manchette" [ref=e170]
              - generic [ref=e171]: Accessoires
            - generic [ref=e172]:
              - heading "Manchette" [level=3] [ref=e173]
              - generic [ref=e174]: Pas encore d'avis
              - generic [ref=e176]: Livraison Cotonou
              - paragraph [ref=e178]: 7 000 F
          - link "Emperio way Senteurs Plus que 5 Emperio way Pas encore d'avis Livraison Cotonou 5 000 F" [ref=e179] [cursor=pointer]:
            - /url: /produits/emperio-way
            - generic [ref=e180]:
              - img "Emperio way" [ref=e181]
              - generic [ref=e182]: Senteurs
              - generic [ref=e183]: Plus que 5
            - generic [ref=e184]:
              - heading "Emperio way" [level=3] [ref=e185]
              - generic [ref=e186]: Pas encore d'avis
              - generic [ref=e188]: Livraison Cotonou
              - paragraph [ref=e190]: 5 000 F
          - link "Marque collection Senteurs Plus que 5 Marque collection Pas encore d'avis Livraison Cotonou 2 500 F" [ref=e191] [cursor=pointer]:
            - /url: /produits/marque-collection
            - generic [ref=e192]:
              - img "Marque collection" [ref=e193]
              - generic [ref=e194]: Senteurs
              - generic [ref=e195]: Plus que 5
            - generic [ref=e196]:
              - heading "Marque collection" [level=3] [ref=e197]
              - generic [ref=e198]: Pas encore d'avis
              - generic [ref=e200]: Livraison Cotonou
              - paragraph [ref=e202]: 2 500 F
          - link "Smart collection Senteurs Plus que 5 Smart collection Pas encore d'avis Livraison Cotonou 2 500 F" [ref=e203] [cursor=pointer]:
            - /url: /produits/smart-collection-2
            - generic [ref=e204]:
              - img "Smart collection" [ref=e205]
              - generic [ref=e206]: Senteurs
              - generic [ref=e207]: Plus que 5
            - generic [ref=e208]:
              - heading "Smart collection" [level=3] [ref=e209]
              - generic [ref=e210]: Pas encore d'avis
              - generic [ref=e212]: Livraison Cotonou
              - paragraph [ref=e214]: 2 500 F
          - link "Smart collection Senteurs Plus que 5 Smart collection Pas encore d'avis Livraison Cotonou 2 500 F" [ref=e215] [cursor=pointer]:
            - /url: /produits/smart-collection
            - generic [ref=e216]:
              - img "Smart collection" [ref=e217]
              - generic [ref=e218]: Senteurs
              - generic [ref=e219]: Plus que 5
            - generic [ref=e220]:
              - heading "Smart collection" [level=3] [ref=e221]
              - generic [ref=e222]: Pas encore d'avis
              - generic [ref=e224]: Livraison Cotonou
              - paragraph [ref=e226]: 2 500 F
          - link "Canal Box Accessoires Canal Box Pas encore d'avis Livraison Cotonou 15 000 F" [ref=e227] [cursor=pointer]:
            - /url: /produits/canal-box
            - generic [ref=e228]:
              - img "Canal Box" [ref=e229]
              - generic [ref=e230]: Accessoires
            - generic [ref=e231]:
              - heading "Canal Box" [level=3] [ref=e232]
              - generic [ref=e233]: Pas encore d'avis
              - generic [ref=e235]: Livraison Cotonou
              - paragraph [ref=e237]: 15 000 F
          - link "Chapeau Accessoires Chapeau Pas encore d'avis Livraison Cotonou 15 000 F" [ref=e238] [cursor=pointer]:
            - /url: /produits/chapeau
            - generic [ref=e239]:
              - img "Chapeau" [ref=e240]
              - generic [ref=e241]: Accessoires
            - generic [ref=e242]:
              - heading "Chapeau" [level=3] [ref=e243]
              - generic [ref=e244]: Pas encore d'avis
              - generic [ref=e246]: Livraison Cotonou
              - paragraph [ref=e248]: 15 000 F
          - link "Manchette Accessoires Manchette Pas encore d'avis Livraison Cotonou 7 000 F" [ref=e249] [cursor=pointer]:
            - /url: /produits/manchette-2
            - generic [ref=e250]:
              - img "Manchette" [ref=e251]
              - generic [ref=e252]: Accessoires
            - generic [ref=e253]:
              - heading "Manchette" [level=3] [ref=e254]
              - generic [ref=e255]: Pas encore d'avis
              - generic [ref=e257]: Livraison Cotonou
              - paragraph [ref=e259]: 7 000 F
          - link "Manchette Accessoires Manchette Pas encore d'avis Livraison Cotonou 7 000 F" [ref=e260] [cursor=pointer]:
            - /url: /produits/manchette
            - generic [ref=e261]:
              - img "Manchette" [ref=e262]
              - generic [ref=e263]: Accessoires
            - generic [ref=e264]:
              - heading "Manchette" [level=3] [ref=e265]
              - generic [ref=e266]: Pas encore d'avis
              - generic [ref=e268]: Livraison Cotonou
              - paragraph [ref=e270]: 7 000 F
          - link "Bain de bouche Bien-être Plus que 3 Bain de bouche Pas encore d'avis Livraison Cotonou 5 000 F" [ref=e271] [cursor=pointer]:
            - /url: /produits/bain-de-bouche
            - generic [ref=e272]:
              - img "Bain de bouche" [ref=e273]
              - generic [ref=e274]: Bien-être
              - generic [ref=e275]: Plus que 3
            - generic [ref=e276]:
              - heading "Bain de bouche" [level=3] [ref=e277]
              - generic [ref=e278]: Pas encore d'avis
              - generic [ref=e280]: Livraison Cotonou
              - paragraph [ref=e282]: 5 000 F
          - link "Bain de bouche Dontodent Bien-être Rupture Bain de bouche Dontodent Pas encore d'avis Livraison Cotonou 3 000 F" [ref=e283] [cursor=pointer]:
            - /url: /produits/bain-de-bouche-dontodent
            - generic [ref=e284]:
              - img "Bain de bouche Dontodent" [ref=e285]
              - generic [ref=e286]: Bien-être
              - generic [ref=e287]: Rupture
            - generic [ref=e288]:
              - heading "Bain de bouche Dontodent" [level=3] [ref=e289]
              - generic [ref=e290]: Pas encore d'avis
              - generic [ref=e292]: Livraison Cotonou
              - paragraph [ref=e294]: 3 000 F
          - link "Thé pour le foie et la vue Bien-être Rupture Thé pour le foie et la vue Pas encore d'avis Livraison Cotonou 5 000 F" [ref=e295] [cursor=pointer]:
            - /url: /produits/the-pour-le-foie-et-la-vue
            - generic [ref=e296]:
              - img "Thé pour le foie et la vue" [ref=e297]
              - generic [ref=e298]: Bien-être
              - generic [ref=e299]: Rupture
            - generic [ref=e300]:
              - heading "Thé pour le foie et la vue" [level=3] [ref=e301]
              - generic [ref=e302]: Pas encore d'avis
              - generic [ref=e304]: Livraison Cotonou
              - paragraph [ref=e306]: 5 000 F
          - link "Thé pour le foie Bien-être Rupture Thé pour le foie Pas encore d'avis Livraison Cotonou 5 000 F" [ref=e307] [cursor=pointer]:
            - /url: /produits/the-pour-le-foie
            - generic [ref=e308]:
              - img "Thé pour le foie" [ref=e309]
              - generic [ref=e310]: Bien-être
              - generic [ref=e311]: Rupture
            - generic [ref=e312]:
              - heading "Thé pour le foie" [level=3] [ref=e313]
              - generic [ref=e314]: Pas encore d'avis
              - generic [ref=e316]: Livraison Cotonou
              - paragraph [ref=e318]: 5 000 F
  - contentinfo [ref=e319]:
    - generic [ref=e321]:
      - generic [ref=e328]:
        - paragraph [ref=e329]: Livraison rapide
        - paragraph [ref=e330]: Cotonou en 24-48h
      - generic [ref=e336]:
        - paragraph [ref=e337]: Paiement sécurisé
        - paragraph [ref=e338]: MTN, Moov, Visa
      - generic [ref=e343]:
        - paragraph [ref=e344]: Prix artisans
        - paragraph [ref=e345]: Direct boutique locale
      - generic [ref=e350]:
        - paragraph [ref=e351]: Support WhatsApp
        - paragraph [ref=e352]: Suivi de commande
    - generic [ref=e353]:
      - generic [ref=e354]:
        - link [ref=e355] [cursor=pointer]:
          - /url: /
          - img "ANIFOWOCHE" [ref=e356]
        - paragraph [ref=e357]: Le site ecommerce 100% béninois, pour découvrir et acheter des produits locaux de qualité.
      - generic [ref=e358]:
        - generic [ref=e359]:
          - paragraph [ref=e360]: Boutique
          - link "Catalogue" [ref=e361] [cursor=pointer]:
            - /url: /catalogue
          - link "Vendeurs" [ref=e362] [cursor=pointer]:
            - /url: /sellers
          - link "Panier" [ref=e363] [cursor=pointer]:
            - /url: /panier
          - link "Compte" [ref=e364] [cursor=pointer]:
            - /url: /compte
        - generic [ref=e365]:
          - paragraph [ref=e366]: Services
          - generic [ref=e367]: Livraison Cotonou
          - generic [ref=e368]: Paiement mobile
          - generic [ref=e369]: Support client
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
  11 |     // 1. Go to catalogue
  12 |     await page.getByRole('link', { name: /Catalogue|Boutique/i }).first().click();
  13 |     await page.waitForURL(/\/catalogue/);
  14 | 
  15 |     // 2. Find and click a product (first product card)
  16 |     const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();
> 17 |     await productCard.waitFor({ state: 'visible', timeout: 10000 });
     |                       ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
  18 |     await productCard.click();
  19 | 
  20 |     // 3. On product page, add to cart
  21 |     await page.waitForURL(/\/produit\//);
  22 |     const addToCartBtn = page.getByRole('button', { name: /Ajouter|Panier/i }).first();
  23 |     await addToCartBtn.waitFor({ state: 'visible' });
  24 |     await addToCartBtn.click();
  25 | 
  26 |     // 4. Go to checkout (cart page or direct checkout)
  27 |     await page.getByRole('link', { name: /Commander|Paiement|Panier/i }).first().click();
  28 |     await page.waitForURL(/\/commande/);
  29 | 
  30 |     // 5. Step 1: Shipping form - fill required fields
  31 |     await expect(page.locator('h1')).toContainText(/Adresse|Livraison/i);
  32 |     
  33 |     await page.fill('input[name="fullName"], input[placeholder*="nom" i], input[id*="nom" i]', 'Jean Test');
  34 |     await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="téléphone" i]', '+229 01 00 00 00');
  35 |     
  36 |     // Select delivery zone if dropdown exists
  37 |     const zoneSelect = page.locator('select[name="zoneId"], select[id*="zone" i]').first();
  38 |     if (await zoneSelect.isVisible({ timeout: 2000 })) {
  39 |       await zoneSelect.selectOption({ index: 1 });
  40 |     }
  41 |     
  42 |     // Select time slot if dropdown exists
  43 |     const slotSelect = page.locator('select[name="slotId"], select[id*="slot" i]').first();
  44 |     if (await slotSelect.isVisible({ timeout: 2000 })) {
  45 |       await slotSelect.selectOption({ index: 1 });
  46 |     }
  47 | 
  48 |     // Continue to payment step
  49 |     const continueBtn = page.getByRole('button', { name: /Continuer|Suivant|Paiement/i }).first();
  50 |     await continueBtn.click();
  51 | 
  52 |     // 6. Step 2: Payment step - verify WhatsApp button appears alongside COD
  53 |     await page.waitForURL(/\/commande/);
  54 |     await expect(page.locator('h1')).toContainText(/Moyen de paiement/i);
  55 | 
  56 |     // Verify Cash on Delivery option is visible
  57 |     const codOption = page.getByRole('button', { name: /Paiement à la livraison|Cash on delivery/i }).first();
  58 |     await expect(codOption).toBeVisible({ timeout: 5000 });
  59 | 
  60 |     // Verify WhatsApp button block is visible (green box with "Commander directement sur WhatsApp")
  61 |     const whatsappBlock = page.locator('text=Commander directement sur WhatsApp').first();
  62 |     await expect(whatsappBlock).toBeVisible({ timeout: 5000 });
  63 | 
  64 |     // Verify WhatsApp button link has wa.me URL
  65 |     const whatsappLink = page.locator('a[href*="wa.me"]').first();
  66 |     await expect(whatsappLink).toBeVisible({ timeout: 5000 });
  67 |     await expect(whatsappLink).toContainText(/WhatsApp/i);
  68 | 
  69 |     // Optional: click the WhatsApp link to verify it opens wa.me (in headed mode, will open new tab)
  70 |     // We just verify the href is correct
  71 |     const href = await whatsappLink.getAttribute('href');
  72 |     expect(href).toMatch(/^https:\/\/wa\.me\//);
  73 | 
  74 |     console.log('✅ Checkout flow complete - WhatsApp button verified alongside COD');
  75 |   });
  76 | 
  77 |   test('product page has WhatsApp button on seller shop', async ({ page }) => {
  78 |     // Go to a public shop
  79 |     await page.goto('/sellers/');
  80 |     await page.waitForURL(/\/sellers/);
  81 | 
  82 |     // Click first shop
  83 |     const shopLink = page.locator('a[href*="/sellers/"]').first();
  84 |     await shopLink.click();
  85 |     await page.waitForURL(/\/sellers\/[^/]+$/);
  86 | 
  87 |     // Check for WhatsApp share button on shop page
  88 |     const whatsappShareBtn = page.getByRole('button', { name: /WhatsApp/i }).first();
  89 |     if (await whatsappShareBtn.isVisible({ timeout: 3000 })) {
  90 |       await expect(whatsappShareBtn).toBeVisible();
  91 |     }
  92 |   });
  93 | });
  94 | 
```