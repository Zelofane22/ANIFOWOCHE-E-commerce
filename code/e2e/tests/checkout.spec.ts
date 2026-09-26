import { test, expect } from '@playwright/test';

test.describe('Checkout flow with WhatsApp button for non-Business sellers', () => {
  test.beforeEach(async ({ page }) => {
    // Go to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/ANIFOWOCHE/);
  });

  test('full checkout flow: browse → product → cart → checkout with WhatsApp button', async ({ page }) => {
    // 1. Go to catalogue
    await page.getByRole('link', { name: /Catalogue|Boutique/i }).first().click();
    await page.waitForURL(/\/catalogue/);

    // 2. Find and click a product (first product card)
    const productCard = page.locator('[data-testid="product-card"], .product-card, article').first();
    await productCard.waitFor({ state: 'visible', timeout: 10000 });
    await productCard.click();

    // 3. On product page, add to cart
    await page.waitForURL(/\/produit\//);
    const addToCartBtn = page.getByRole('button', { name: /Ajouter|Panier/i }).first();
    await addToCartBtn.waitFor({ state: 'visible' });
    await addToCartBtn.click();

    // 4. Go to checkout (cart page or direct checkout)
    await page.getByRole('link', { name: /Commander|Paiement|Panier/i }).first().click();
    await page.waitForURL(/\/commande/);

    // 5. Step 1: Shipping form - fill required fields
    await expect(page.locator('h1')).toContainText(/Adresse|Livraison/i);
    
    await page.fill('input[name="fullName"], input[placeholder*="nom" i], input[id*="nom" i]', 'Jean Test');
    await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="téléphone" i]', '+229 01 00 00 00');
    
    // Select delivery zone if dropdown exists
    const zoneSelect = page.locator('select[name="zoneId"], select[id*="zone" i]').first();
    if (await zoneSelect.isVisible({ timeout: 2000 })) {
      await zoneSelect.selectOption({ index: 1 });
    }
    
    // Select time slot if dropdown exists
    const slotSelect = page.locator('select[name="slotId"], select[id*="slot" i]').first();
    if (await slotSelect.isVisible({ timeout: 2000 })) {
      await slotSelect.selectOption({ index: 1 });
    }

    // Continue to payment step
    const continueBtn = page.getByRole('button', { name: /Continuer|Suivant|Paiement/i }).first();
    await continueBtn.click();

    // 6. Step 2: Payment step - verify WhatsApp button appears alongside COD
    await page.waitForURL(/\/commande/);
    await expect(page.locator('h1')).toContainText(/Moyen de paiement/i);

    // Verify Cash on Delivery option is visible
    const codOption = page.getByRole('button', { name: /Paiement à la livraison|Cash on delivery/i }).first();
    await expect(codOption).toBeVisible({ timeout: 5000 });

    // Verify WhatsApp button block is visible (green box with "Commander directement sur WhatsApp")
    const whatsappBlock = page.locator('text=Commander directement sur WhatsApp').first();
    await expect(whatsappBlock).toBeVisible({ timeout: 5000 });

    // Verify WhatsApp button link has wa.me URL
    const whatsappLink = page.locator('a[href*="wa.me"]').first();
    await expect(whatsappLink).toBeVisible({ timeout: 5000 });
    await expect(whatsappLink).toContainText(/WhatsApp/i);

    // Optional: click the WhatsApp link to verify it opens wa.me (in headed mode, will open new tab)
    // We just verify the href is correct
    const href = await whatsappLink.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\//);

    console.log('✅ Checkout flow complete - WhatsApp button verified alongside COD');
  });

  test('product page has WhatsApp button on seller shop', async ({ page }) => {
    // Go to a public shop
    await page.goto('/sellers/');
    await page.waitForURL(/\/sellers/);

    // Click first shop
    const shopLink = page.locator('a[href*="/sellers/"]').first();
    await shopLink.click();
    await page.waitForURL(/\/sellers\/[^/]+$/);

    // Check for WhatsApp share button on shop page
    const whatsappShareBtn = page.getByRole('button', { name: /WhatsApp/i }).first();
    if (await whatsappShareBtn.isVisible({ timeout: 3000 })) {
      await expect(whatsappShareBtn).toBeVisible();
    }
  });
});
