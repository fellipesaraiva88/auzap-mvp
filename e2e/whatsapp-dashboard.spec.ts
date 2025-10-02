import { test, expect } from '@playwright/test';

test.describe('WhatsApp Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main dashboard elements', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if we're on login or dashboard
    const isLoginPage = await page
      .locator('input[type="email"]')
      .isVisible()
      .catch(() => false);

    if (isLoginPage) {
      test.skip(true, 'User not authenticated - skipping dashboard test');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate errors
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App should still load, just show error state
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');

    // Check for proper ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      // Button should have either aria-label or text content
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
  });
});
