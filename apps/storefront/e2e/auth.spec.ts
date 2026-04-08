import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8000';

test.describe('Authentication Flow', () => {
  test('should register a new merchant', async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: `test${timestamp}@example.com`,
        password: 'securePassword123',
        storeName: `Test Store ${timestamp}`,
        domain: `test-${timestamp}.com`
      }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.message).toBe('Store created successfully!');
    expect(body.storeId).toBeDefined();
  });

  test('should not allow duplicate email registration', async ({ request }) => {
    const timestamp = Date.now();
    const email = `duplicate${timestamp}@example.com`;

    // First registration
    await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email,
        password: 'securePassword123',
        storeName: 'Test Store',
        domain: `test-dup-${timestamp}.com`
      }
    });

    // Duplicate registration
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email,
        password: 'securePassword123',
        storeName: 'Another Store',
        domain: `test-dup2-${timestamp}.com`
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Email already exists');
  });

  test('should not allow duplicate domain registration', async ({ request }) => {
    const timestamp = Date.now();
    const domain = `test-domain-${timestamp}.com`;

    // First registration
    await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: `domain1${timestamp}@example.com`,
        password: 'securePassword123',
        storeName: 'Test Store',
        domain
      }
    });

    // Duplicate domain
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: `domain2${timestamp}@example.com`,
        password: 'securePassword123',
        storeName: 'Another Store',
        domain
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Domain already taken');
  });

  test('should login with valid credentials', async ({ request }) => {
    const timestamp = Date.now();
    const email = `login${timestamp}@example.com`;
    const password = 'securePassword123';

    // Register first
    await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email,
        password,
        storeName: 'Test Store',
        domain: `login-test-${timestamp}.com`
      }
    });

    // Login
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: { email, password }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(body.storeId).toBeDefined();
  });

  test('should reject invalid login credentials', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid email or password');
  });

  test('should sanitize inputs during registration', async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: `sanitize${timestamp}@example.com`,
        password: 'securePassword123',
        storeName: '<script>alert("xss")</script>Store',
        domain: `sanitize-${timestamp}.com`
      }
    });

    expect(response.status()).toBe(201);
  });

  test('should reject login with invalid email format', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'not-an-email',
        password: 'password123'
      }
    });

    expect(response.status()).toBe(400);
  });

  test('should reject registration with weak password', async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: `weak${timestamp}@example.com`,
        password: '123',
        storeName: 'Test Store',
        domain: `weak-${timestamp}.com`
      }
    });

    expect(response.status()).toBe(400);
  });
});
