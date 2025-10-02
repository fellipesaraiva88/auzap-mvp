import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should display login page for unauthenticated users', async ({
    page,
  }) => {
    await page.goto('/');

    // Should redirect to login or show login form
    await page.waitForLoadState('networkidle');

    // Look for login-related elements
    const hasLoginButton = await page
      .locator('button')
      .getByText(/login|entrar/i)
      .isVisible()
      .catch(() => false);
    const hasEmailInput = await page
      .locator('input[type="email"]')
      .isVisible()
      .catch(() => false);

    expect(hasLoginButton || hasEmailInput).toBeTruthy();
  });

  test('should have responsive layout', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#root')).toBeVisible();

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(viewport).toContain('width=device-width');

    // Check charset
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset).toBe('UTF-8');
  });
});
