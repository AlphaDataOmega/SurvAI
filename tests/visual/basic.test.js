/**
 * Basic visual test to verify Playwright setup
 */

const { test, expect } = require('@playwright/test');

test.describe('Basic Setup Validation', () => {
  test('should connect to localhost', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example/i);
  });
});