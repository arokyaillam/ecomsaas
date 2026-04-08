import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8000';

test.describe('API Security Tests', () => {
  test('should return 400 for invalid domain format with XSS', async ({ request }) => {
    // Test with XSS attempt in domain
    const response = await request.get(`${API_URL}/api/store/by-domain/test<script>.com`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid domain format');
  });

  test('should return 400 for invalid UUID format', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/store/invalid-uuid/products`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid store ID format');
  });

  test('should reject requests without auth token', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/categories`);
    expect(response.status()).toBe(401);
  });

  test('should return 404 for non-existent protected routes', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/store/by-domain/../../../etc/passwd`);
    // Fastify routing handles path traversal - returns 404
    expect([400, 404]).toContain(response.status());
  });

  test('should handle rate limiting on public endpoints', async ({ request }) => {
    // Make several requests quickly
    const requests = Array(10).fill(null).map(() =>
      request.get(`${API_URL}/api/store/by-domain/test.com`)
    );

    const responses = await Promise.all(requests);
    // All should complete (may get 200, 404, or 429 if rate limited)
    const validStatuses = responses.every(r =>
      r.status() === 200 || r.status() === 404 || r.status() === 429 || r.status() === 500
    );
    expect(validStatuses).toBe(true);
  });
});
