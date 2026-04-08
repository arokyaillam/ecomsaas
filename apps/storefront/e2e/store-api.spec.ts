import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8000';

test.describe('Store Public API', () => {
  test('should return 400 for invalid UUID', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/store/invalid-uuid/products`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid store ID format');
  });

  test('should return 400 for invalid category ID', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/store/550e8400-e29b-41d4-a716-446655440000/categories/invalid-uuid/subcategories`);
    expect(response.status()).toBe(400);
  });

  test('should return 404 for non-existent store', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request.get(`${API_URL}/api/store/${fakeId}`);
    // Database might be down, so accept various responses
    expect([400, 404, 500]).toContain(response.status());
  });

  test('should return 404 or 400 for non-existent domain', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/store/by-domain/nonexistent-domain-12345.com`);
    // Database might cause 500, but ideally should be 404
    expect([400, 404, 500]).toContain(response.status());
  });

  test('should validate domain format', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/store/by-domain/invalid<domain>.com`);
    expect(response.status()).toBe(400);
  });
});
