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
    const hasStoreContent = pageContent.includes('Store') || pageContent.includes('Welcome');

    expect(hasStoreNotFound || hasStoreContent).toBe(true);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    // Title should contain store name or default text
    expect(title.length).toBeGreaterThan(0);

    const description = await page.locator('meta[name="description"]');
    // Description should exist
    await expect(description).toHaveCount(1);
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
