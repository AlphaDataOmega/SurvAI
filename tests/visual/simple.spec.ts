/**
 * Simple visual test to verify Playwright setup
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Setup Validation', () => {
  test('should connect to local server', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SurvAI|Survey/i);
  });

  test('should capture homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png');
  });
});