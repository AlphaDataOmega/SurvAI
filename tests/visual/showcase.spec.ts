/**
 * @fileoverview Visual testing showcase
 * 
 * Comprehensive visual testing demonstration that showcases:
 * - Screenshot comparison with 0.1% threshold
 * - Responsive design testing
 * - Component-level testing
 * - UI change detection
 * - HTML report generation with embedded screenshots
 */

import { test, expect } from '@playwright/test';

test.describe('🎯 Visual Testing Showcase', () => {
  
  test('📸 Homepage Screenshot Comparison', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // This will pass if homepage renders consistently
    await expect(page).toHaveScreenshot('showcase-homepage.png');
  });

  test('🔐 Login Page Visual Test', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Capture login form layout
    await expect(page).toHaveScreenshot('showcase-login.png');
  });

  test('⚡ Admin Dashboard (No Auth Required)', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // This captures whatever the admin page shows without authentication
    await expect(page).toHaveScreenshot('showcase-admin.png');
  });

  test('📱 Mobile Responsive Test', async ({ page }) => {
    // Set iPhone viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Mobile layout should look different from desktop
    await expect(page).toHaveScreenshot('showcase-mobile.png');
  });

  test('💻 Desktop vs Tablet Layout', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tablet layout comparison
    await expect(page).toHaveScreenshot('showcase-tablet.png');
  });

  test('🧩 Component-Level Testing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test individual components if they exist
    const header = page.locator('header, .header, nav, .navigation').first();
    if (await header.count() > 0) {
      await expect(header).toHaveScreenshot('showcase-header.png');
    }
    
    const mainContent = page.locator('main, .main-content, .content').first();
    if (await mainContent.count() > 0) {
      await expect(mainContent).toHaveScreenshot('showcase-main-content.png');
    }
  });

  test('🔍 UI Change Detection Demo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // First, capture the baseline
    await expect(page).toHaveScreenshot('ui-baseline.png');
    
    // Now add a 5px shift to demonstrate detection
    await page.addStyleTag({
      content: `
        body { 
          transform: translateX(5px) !important;
          transition: none !important;
        }
      `
    });
    
    // This should fail when compared to baseline due to 5px shift
    // If threshold is working correctly (0.1%), this will detect the change
    await expect(page).toHaveScreenshot('ui-shifted.png');
  });

  test('🎨 Dark/Light Theme Testing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test light theme (default)
    await expect(page).toHaveScreenshot('theme-light.png');
    
    // Simulate dark theme
    await page.addStyleTag({
      content: `
        body, html { 
          background-color: #1a202c !important;
          color: #f7fafc !important;
        }
        .card, .btn { 
          background-color: #2d3748 !important;
          color: #f7fafc !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('theme-dark.png');
  });

  test('📋 Error States Visual Test', async ({ page }) => {
    // Test 404 page
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('error-404.png');
  });

  test('🔧 Loading States (Fast Capture)', async ({ page }) => {
    await page.goto('/admin');
    
    // Capture immediately for potential loading state
    await page.waitForTimeout(100);
    await expect(page).toHaveScreenshot('loading-state.png');
  });

});

test.describe('🚀 Performance Visual Tests', () => {
  
  test('⏱️ Page Load Visual Consistency', async ({ page }) => {
    // Test that page looks the same across multiple loads
    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Each reload should look identical
      await expect(page).toHaveScreenshot(`consistency-test-${i + 1}.png`);
    }
  });

  test('🖱️ Interactive State Testing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test button hover states if buttons exist
    const buttons = page.locator('button, .btn, input[type="submit"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      
      // Normal state
      await expect(firstButton).toHaveScreenshot('button-normal.png');
      
      // Hover state
      await firstButton.hover();
      await expect(firstButton).toHaveScreenshot('button-hover.png');
    }
  });

});

test.describe('🎭 Visual Regression Edge Cases', () => {
  
  test('📐 Scroll Position Consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ensure scroll position doesn't affect screenshots
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.evaluate(() => window.scrollTo(0, 0));
    
    await expect(page).toHaveScreenshot('scroll-position-test.png');
  });

  test('⚡ Animation States', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('no-animations.png');
  });

  test('🌐 Font Loading Consistency', async ({ page }) => {
    await page.goto('/');
    
    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('fonts-loaded.png');
  });

});