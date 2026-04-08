import { test, expect } from '@playwright/test';

test.describe('Storefront UI', () => {
  test('homepage should load without crashing', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load - either showing content or store not found
    await page.waitForLoadState('networkidle');

    // Check that the page loaded - look for body
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Check for expected content - either store content or error message
    const pageContent = await page.content();
    const hasStoreNotFound = pageContent.includes('Store Not Found');
    const hasEcomSaas = pageContent.includes('EcomSaaS');

    expect(hasStoreNotFound || hasEcomSaas).toBe(true);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toContain('EcomSaaS');

    const description = await page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', 'Modern e-commerce storefront');
  });

  test('should apply theme colors', async ({ page }) => {
    await page.goto('/');

    // Check that CSS variables are defined
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        primary: getComputedStyle(root).getPropertyValue('--primary'),
        background: getComputedStyle(root).getPropertyValue('--background'),
      };
    });

    // Default theme colors should be set
    expect(rootStyles.primary).toBeTruthy();
    expect(rootStyles.background).toBeTruthy();
  });
});

test.describe('API Endpoints', () => {
  test('backend health check', async ({ request }) => {
    // Check if backend is responding
    const response = await request.get('http://localhost:8000/docs');
    expect(response.status()).toBe(401); // Swagger requires auth
  });
});
