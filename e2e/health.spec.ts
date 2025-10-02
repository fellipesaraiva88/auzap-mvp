import { test, expect } from '@playwright/test';

test.describe('Health Checks', () => {
  test('backend API health endpoint should respond', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
  });

  test('frontend should load successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loaded
    await expect(page).toHaveTitle(/AuZap/);

    // Check for main app container
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('frontend should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some expected errors (like 401 for unauthenticated routes)
    const criticalErrors = errors.filter(
      (err) => !err.includes('401') && !err.includes('Unauthorized')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
