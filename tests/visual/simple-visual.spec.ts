/**
 * @fileoverview Simplified visual regression test suite
 * 
 * Basic visual testing for existing pages without complex authentication
 * or database dependencies. Focus on capturing actual rendered content.
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Visual Regression Testing', () => {
  
  test('should capture homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('should capture login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('should capture admin page (unauthenticated)', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    // This will capture whatever the app shows for unauthenticated admin access
    await expect(page).toHaveScreenshot('admin-unauthenticated.png');
  });

  test('should capture survey page with test ID', async ({ page }) => {
    await page.goto('/survey/test-survey-id');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('survey-test-page.png');
  });

  test('should capture 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('404-page.png');
  });

});

test.describe('Responsive Visual Testing', () => {
  
  test('should capture mobile homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });

  test('should capture tablet homepage', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-tablet.png');
  });

});

test.describe('Component Visual Testing', () => {
  
  test('should capture specific components if they exist', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to capture specific components if they exist
    const header = page.locator('header, .header, nav').first();
    if (await header.count() > 0) {
      await expect(header).toHaveScreenshot('header-component.png');
    }
    
    const footer = page.locator('footer, .footer').first();
    if (await footer.count() > 0) {
      await expect(footer).toHaveScreenshot('footer-component.png');
    }
  });

  test('should capture admin components when available', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for admin dashboard elements
    const dashboard = page.locator('[data-testid="admin-dashboard"], .admin-dashboard').first();
    if (await dashboard.count() > 0) {
      await expect(dashboard).toHaveScreenshot('admin-dashboard-component.png');
    }
    
    // Look for metrics charts
    const metrics = page.locator('[data-testid="metrics-chart"], .metrics, .chart').first();
    if (await metrics.count() > 0) {
      await expect(metrics).toHaveScreenshot('metrics-component.png');
    }
  });

  test('should capture survey components when available', async ({ page }) => {
    await page.goto('/survey/test-id');
    await page.waitForLoadState('networkidle');
    
    // Look for survey elements
    const surveyPage = page.locator('[data-testid="survey-page"], .survey').first();
    if (await surveyPage.count() > 0) {
      await expect(surveyPage).toHaveScreenshot('survey-page-component.png');
    }
    
    const questionCard = page.locator('[data-testid="question-card"], .question').first();
    if (await questionCard.count() > 0) {
      await expect(questionCard).toHaveScreenshot('question-card-component.png');
    }
    
    const offerButtons = page.locator('[data-testid="offer-buttons"], .offer-buttons').first();
    if (await offerButtons.count() > 0) {
      await expect(offerButtons).toHaveScreenshot('offer-buttons-component.png');
    }
  });

});

test.describe('UI State Validation', () => {
  
  test('should validate UI shift detection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Add a CSS rule that shifts content by 5px
    await page.addStyleTag({
      content: `
        body { 
          transform: translateX(5px); 
        }
      `
    });
    
    // This should fail if our threshold is working correctly
    await expect(page).toHaveScreenshot('ui-shift-test.png');
  });

});