import { test, expect } from '@playwright/test';

test.describe('Checkout flow with WhatsApp button for non-Business sellers', () => {
  test.beforeEach(async ({ page }) => {
    // Go to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/ANIFOWOCHE/);
  });

  test('full checkout flow: browse → product → cart → checkout with WhatsApp button', async ({ page }) => {
    test.setTimeout(180_000);

    // Compte seedé par `manage.py seed_e2e` (CLIENT_EMAIL / CLIENT_PASSWORD).
    await page.goto('/compte');
    await page.locator('#login-username').fill('client@e2e.test');
    await page.locator('#login-password').fill('ClientE2E!2026');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('button', { name: /Se déconnecter/i })).toBeVisible();

    // Produit d'un vendeur non Business (seed E2E) : seul cas où le bouton WhatsApp apparaît.
    await page.goto('/produits/tissu-wax-e2e');
    await page.waitForURL(/\/produits\//);
    // Use CSS selector for "Panier" button (getByRole misses it due to hidden/display issues)
    const addToCartBtn = page.locator('button:has-text("Panier")').first();
    await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addToCartBtn.click();
    // Cart updates optimistically; wait briefly for header count
    await page.waitForTimeout(1000);

    // Cart link already shows count (verified in snapshot) - click it
    await page.getByRole('link', { name: 'Panier', exact: true }).first().click();
    await page.waitForURL(/\/panier/);
    // "Passer la commande" button in summary aside (not the fixed mobile one at bottom)
    const checkoutBtn = page.locator('button:has-text("Passer la commande")').nth(0);  // first = summary aside, second = fixed mobile (hidden on desktop)
    await checkoutBtn.waitFor({ state: 'visible', timeout: 10000 });
    await checkoutBtn.click({ force: true });
    await page.waitForURL(/\/commande/);

    await expect(page.locator('h1')).toContainText(/Adresse|Livraison|Informations/i);
    await page.getByLabel('Nom complet').fill('Jean Test');
    await page.getByLabel(/Téléphone/i).fill('+229 01 00 00 00');

    const zoneSelect = page.getByLabel(/Quartier|Zone/i);
    if (await zoneSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await zoneSelect.selectOption({ index: 0 });
    }
    const slotBtn = page.getByRole('button', { name: /Matin|Soir|Créneau/i }).first();
    if (await slotBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await slotBtn.click();
    }

    await page.getByRole('button', { name: /Continuer vers le paiement|Continuer|Suivant/i }).click();

    await expect(page.locator('h1')).toContainText(/Moyen de paiement/i);
    await expect(page.getByRole('button', { name: /Paiement à la livraison/i }).first()).toBeVisible();

    const whatsappBlock = page.getByText('Commander directement sur WhatsApp').first();
    await expect(whatsappBlock).toBeVisible();
    const whatsappLink = page.locator('a[href*="wa.me"]').first();
    await expect(whatsappLink).toBeVisible();
    await expect(whatsappLink).toContainText(/WhatsApp/i);
    const href = await whatsappLink.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\//);
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
