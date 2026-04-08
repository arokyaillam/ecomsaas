import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8000';

test.describe('Health Checks', () => {
  test('backend should respond', async ({ request }) => {
    const response = await request.get(`${API_URL}/docs`);
    expect(response.status()).toBe(401); // Swagger requires auth
  });

  test('storefront should load', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('backend security headers should be present', async ({ request }) => {
    const response = await request.get(`${API_URL}/docs`);
    const headers = response.headers();
    // Helmet should add security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
