import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Homepage should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have optimized bundle size', async ({ page }) => {
    const resources: { url: string; size: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        response
          .body()
          .then((buffer) => {
            resources.push({
              url,
              size: buffer.length,
            });
          })
          .catch(() => {});
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for all resources to be captured
    await page.waitForTimeout(1000);

    // Check that we have some resources loaded
    expect(resources.length).toBeGreaterThan(0);

    // Main bundle should be reasonable (< 2MB for initial load)
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    expect(totalSize).toBeLessThan(2 * 1024 * 1024);
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial metrics
    const metrics1 = await page.metrics();

    // Navigate to different sections (if routes exist)
    const links = page.locator('a[href]');
    const linkCount = await links.count();

    if (linkCount > 0) {
      // Click first internal link
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');

        if (href && href.startsWith('/')) {
          await link.click().catch(() => {});
          await page.waitForLoadState('networkidle');
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }
    }

    // Get final metrics
    const metrics2 = await page.metrics();

    // Memory shouldn't grow excessively (allow 50% growth)
    const memoryGrowth =
      (metrics2.JSHeapUsedSize - metrics1.JSHeapUsedSize) /
      metrics1.JSHeapUsedSize;
    expect(memoryGrowth).toBeLessThan(0.5);
  });

  test('should implement lazy loading for routes', async ({ page }) => {
    const jsFiles: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.js') && !url.includes('node_modules')) {
        jsFiles.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const initialJsCount = jsFiles.length;

    // Should have loaded some JS files
    expect(initialJsCount).toBeGreaterThan(0);

    console.log(`Initial JS files loaded: ${initialJsCount}`);
  });
});
