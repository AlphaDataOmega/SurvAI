/**
 * @fileoverview Embeddable Widget Visual Tests
 * 
 * Comprehensive visual regression testing for embeddable widget:
 * - Widget mounting on standalone test pages
 * - Theme variation testing (all predefined themes)
 * - Responsive widget behavior
 * - Remote configuration validation
 * - Error states and offline mode
 * - Widget integration patterns
 */

import { test, expect } from '@playwright/test';
import { setupBrowserContext, preparePageForVisualTesting } from './visual-setup';
import {
  navigateToWidgetTestPage,
  navigateToWidgetThemeTestPage,
  mountWidget,
  mountWidgetWithTheme,
  mountMultipleWidgets,
  createWidgetContainer,
  waitForWidgetState,
  getWidgetContainer,
  testWidgetErrorHandling,
  WIDGET_THEMES
} from './helpers/widget-helpers';
import { createComprehensiveTestDataSet } from './helpers/data-seeders';

// Global test data
let testData: ReturnType<typeof createComprehensiveTestDataSet>;

test.describe('Embeddable Widget Visual Tests', () => {
  
  test.beforeAll(async () => {
    // Create comprehensive test data set
    testData = createComprehensiveTestDataSet();
  });

  test.beforeEach(async ({ context, page }) => {
    // Set up browser context for consistent rendering
    await setupBrowserContext(context);
    
    // Prepare page for visual testing
    await preparePageForVisualTesting(page);
  });

  test.describe('Widget Mounting and Basic Functionality', () => {
    
    test('should capture widget mounted on test page', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create container and mount widget
      await createWidgetContainer(page, 'test-widget-1');
      await mountWidget(page, 'test-widget-1', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await waitForWidgetState(page, 'test-widget-1', 'ready');
      
      // Capture widget container
      const widgetContainer = getWidgetContainer(page, 'test-widget-1');
      await expect(widgetContainer).toHaveScreenshot('widget-basic-mounted.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget on full test page', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create container and mount widget
      await createWidgetContainer(page, 'test-widget-2');
      await mountWidget(page, 'test-widget-2', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await waitForWidgetState(page, 'test-widget-2', 'ready');
      
      // Capture full page with widget
      await expect(page).toHaveScreenshot('widget-full-test-page.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget loading state', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create container
      await createWidgetContainer(page, 'test-widget-loading');
      
      // Mount widget and capture immediately
      await mountWidget(page, 'test-widget-loading', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      // Capture loading state (if it exists)
      const widgetContainer = getWidgetContainer(page, 'test-widget-loading');
      await expect(widgetContainer).toHaveScreenshot('widget-loading-state.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Theme Variations', () => {
    
    test('should capture widget with default theme', async ({ page }) => {
      await navigateToWidgetThemeTestPage(page);
      
      // Mount widget with default theme
      await createWidgetContainer(page, 'widget-default');
      await mountWidgetWithTheme(page, 'widget-default', 'default');
      
      await waitForWidgetState(page, 'widget-default', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-default');
      await expect(widgetContainer).toHaveScreenshot('widget-theme-default.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with corporate theme', async ({ page }) => {
      await navigateToWidgetThemeTestPage(page);
      
      // Mount widget with corporate theme
      await createWidgetContainer(page, 'widget-corporate');
      await mountWidgetWithTheme(page, 'widget-corporate', 'corporate', {
        partnerId: 'corporate-partner-456'
      });
      
      await waitForWidgetState(page, 'widget-corporate', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-corporate');
      await expect(widgetContainer).toHaveScreenshot('widget-theme-corporate.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with nature theme', async ({ page }) => {
      await navigateToWidgetThemeTestPage(page);
      
      // Mount widget with nature theme
      await createWidgetContainer(page, 'widget-nature');
      await mountWidgetWithTheme(page, 'widget-nature', 'nature', {
        partnerId: 'eco-partner-789'
      });
      
      await waitForWidgetState(page, 'widget-nature', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-nature');
      await expect(widgetContainer).toHaveScreenshot('widget-theme-nature.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with dark theme', async ({ page }) => {
      await navigateToWidgetThemeTestPage(page);
      
      // Mount widget with dark theme
      await createWidgetContainer(page, 'widget-dark');
      await mountWidgetWithTheme(page, 'widget-dark', 'dark', {
        partnerId: 'dark-partner-321'
      });
      
      await waitForWidgetState(page, 'widget-dark', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-dark');
      await expect(widgetContainer).toHaveScreenshot('widget-theme-dark.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with minimal theme', async ({ page }) => {
      await navigateToWidgetThemeTestPage(page);
      
      // Mount widget with minimal theme
      await createWidgetContainer(page, 'widget-minimal');
      await mountWidgetWithTheme(page, 'widget-minimal', 'minimal', {
        partnerId: 'minimal-partner-987'
      });
      
      await waitForWidgetState(page, 'widget-minimal', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-minimal');
      await expect(widgetContainer).toHaveScreenshot('widget-theme-minimal.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture all theme variations on single page', async ({ page }) => {
      await navigateToWidgetThemeTestPage(page);
      
      // Mount multiple widgets with different themes
      await mountMultipleWidgets(page, [
        { containerId: 'widget-all-default', themeName: 'default' },
        { containerId: 'widget-all-corporate', themeName: 'corporate' },
        { containerId: 'widget-all-nature', themeName: 'nature' }
      ]);
      
      // Capture full page with all themes
      await expect(page).toHaveScreenshot('widget-all-themes.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Custom Theme Configuration', () => {
    
    test('should capture widget with custom colors', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create custom theme
      const customTheme = {
        primaryColor: '#ff6b6b',
        secondaryColor: '#ffd93d',
        backgroundColor: '#f8f9fa',
        textColor: '#212529',
        buttonSize: 'large' as const,
        spacing: 'spacious' as const,
        borderRadius: '1rem',
        shadows: true,
        transitions: true
      };
      
      await createWidgetContainer(page, 'widget-custom');
      await mountWidget(page, 'widget-custom', {
        surveyId: testData.baseData.surveyId,
        theme: customTheme,
        partnerId: 'custom-partner-123'
      });
      
      await waitForWidgetState(page, 'widget-custom', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-custom');
      await expect(widgetContainer).toHaveScreenshot('widget-custom-theme.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with small button size', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      const smallButtonTheme = {
        ...WIDGET_THEMES.default,
        buttonSize: 'small' as const,
        spacing: 'compact' as const
      };
      
      await createWidgetContainer(page, 'widget-small');
      await mountWidget(page, 'widget-small', {
        surveyId: testData.baseData.surveyId,
        theme: smallButtonTheme
      });
      
      await waitForWidgetState(page, 'widget-small', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-small');
      await expect(widgetContainer).toHaveScreenshot('widget-small-buttons.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with large button size', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      const largeButtonTheme = {
        ...WIDGET_THEMES.default,
        buttonSize: 'large' as const,
        spacing: 'spacious' as const
      };
      
      await createWidgetContainer(page, 'widget-large');
      await mountWidget(page, 'widget-large', {
        surveyId: testData.baseData.surveyId,
        theme: largeButtonTheme
      });
      
      await waitForWidgetState(page, 'widget-large', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-large');
      await expect(widgetContainer).toHaveScreenshot('widget-large-buttons.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Responsive Widget Behavior', () => {
    
    test('should capture widget on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToWidgetTestPage(page);
      
      await createWidgetContainer(page, 'widget-mobile');
      await mountWidget(page, 'widget-mobile', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await waitForWidgetState(page, 'widget-mobile', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-mobile');
      await expect(widgetContainer).toHaveScreenshot('widget-mobile-responsive.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await navigateToWidgetTestPage(page);
      
      await createWidgetContainer(page, 'widget-tablet');
      await mountWidget(page, 'widget-tablet', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await waitForWidgetState(page, 'widget-tablet', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-tablet');
      await expect(widgetContainer).toHaveScreenshot('widget-tablet-responsive.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      await navigateToWidgetTestPage(page);
      
      await createWidgetContainer(page, 'widget-desktop');
      await mountWidget(page, 'widget-desktop', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await waitForWidgetState(page, 'widget-desktop', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-desktop');
      await expect(widgetContainer).toHaveScreenshot('widget-desktop-responsive.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget responsive behavior comparison', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create multiple containers for different viewport simulations
      await createWidgetContainer(page, 'widget-resp-mobile', 'width: 375px; height: 200px; display: inline-block; margin: 10px; border: 1px solid #ccc;');
      await createWidgetContainer(page, 'widget-resp-tablet', 'width: 768px; height: 200px; display: inline-block; margin: 10px; border: 1px solid #ccc;');
      await createWidgetContainer(page, 'widget-resp-desktop', 'width: 1200px; height: 200px; display: inline-block; margin: 10px; border: 1px solid #ccc;');
      
      // Mount widgets
      await mountWidget(page, 'widget-resp-mobile', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await mountWidget(page, 'widget-resp-tablet', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await mountWidget(page, 'widget-resp-desktop', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      // Wait for all widgets to be ready
      await waitForWidgetState(page, 'widget-resp-mobile', 'ready');
      await waitForWidgetState(page, 'widget-resp-tablet', 'ready');
      await waitForWidgetState(page, 'widget-resp-desktop', 'ready');
      
      // Capture full page with responsive comparison
      await expect(page).toHaveScreenshot('widget-responsive-comparison.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Error States and Edge Cases', () => {
    
    test('should capture widget with invalid survey error', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      await createWidgetContainer(page, 'widget-error-survey');
      await testWidgetErrorHandling(page, 'widget-error-survey', 'invalid-survey');
      
      const widgetContainer = getWidgetContainer(page, 'widget-error-survey');
      await expect(widgetContainer).toHaveScreenshot('widget-error-invalid-survey.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with network error', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      await createWidgetContainer(page, 'widget-error-network');
      await testWidgetErrorHandling(page, 'widget-error-network', 'network-error');
      
      const widgetContainer = getWidgetContainer(page, 'widget-error-network');
      await expect(widgetContainer).toHaveScreenshot('widget-error-network.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with invalid container error', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // This test doesn't create a container, so it will fail
      await testWidgetErrorHandling(page, 'non-existent-container', 'invalid-container');
      
      // Capture any error messages that might appear
      await expect(page).toHaveScreenshot('widget-error-invalid-container.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget offline mode', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await createWidgetContainer(page, 'widget-offline');
      await mountWidget(page, 'widget-offline', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await page.waitForTimeout(2000);
      
      const widgetContainer = getWidgetContainer(page, 'widget-offline');
      await expect(widgetContainer).toHaveScreenshot('widget-offline-mode.png', {
        maxDiffPixelRatio: 0.001
      });
      
      // Restore online mode
      await page.context().setOffline(false);
    });

  });

  test.describe('Widget Integration Patterns', () => {
    
    test('should capture widget embedded in blog post', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create a blog post-like layout
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Georgia, serif;">
            <h1>Blog Post Title</h1>
            <p>This is a sample blog post with embedded widget. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <div id="widget-blog" style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;"></div>
            <p>Continue reading the blog post after the widget...</p>
          </div>
        `;
      });
      
      await mountWidget(page, 'widget-blog', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await waitForWidgetState(page, 'widget-blog', 'ready');
      
      // Capture full page with blog integration
      await expect(page).toHaveScreenshot('widget-blog-integration.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget in sidebar', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create a sidebar layout
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="display: flex; max-width: 1200px; margin: 0 auto; padding: 20px;">
            <div style="flex: 1; padding-right: 20px;">
              <h1>Main Content</h1>
              <p>This is the main content area with a widget in the sidebar.</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
            <div style="width: 300px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <h3>Sidebar</h3>
              <div id="widget-sidebar" style="margin: 20px 0;"></div>
            </div>
          </div>
        `;
      });
      
      await mountWidget(page, 'widget-sidebar', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.corporate
      });
      
      await waitForWidgetState(page, 'widget-sidebar', 'ready');
      
      // Capture full page with sidebar integration
      await expect(page).toHaveScreenshot('widget-sidebar-integration.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget in modal overlay', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create a modal overlay
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div style="position: relative; padding: 20px;">
            <h1>Page Content</h1>
            <p>This page has a modal overlay with embedded widget.</p>
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h3>Modal Title</h3>
                <div id="widget-modal" style="margin: 20px 0;"></div>
                <button style="margin-top: 10px; padding: 10px 20px; background: #007cba; color: white; border: none; border-radius: 4px;">Close</button>
              </div>
            </div>
          </div>
        `;
      });
      
      await mountWidget(page, 'widget-modal', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.minimal
      });
      
      await waitForWidgetState(page, 'widget-modal', 'ready');
      
      // Capture full page with modal integration
      await expect(page).toHaveScreenshot('widget-modal-integration.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Partner Attribution', () => {
    
    test('should capture widget with partner attribution', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      await createWidgetContainer(page, 'widget-partner');
      await mountWidget(page, 'widget-partner', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.corporate,
        partnerId: 'demo-partner-123'
      });
      
      await waitForWidgetState(page, 'widget-partner', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-partner');
      await expect(widgetContainer).toHaveScreenshot('widget-partner-attribution.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget without partner attribution', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      await createWidgetContainer(page, 'widget-no-partner');
      await mountWidget(page, 'widget-no-partner', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
        // No partnerId specified
      });
      
      await waitForWidgetState(page, 'widget-no-partner', 'ready');
      
      const widgetContainer = getWidgetContainer(page, 'widget-no-partner');
      await expect(widgetContainer).toHaveScreenshot('widget-no-partner-attribution.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

});

/**
 * Widget consistency and performance tests
 */
test.describe('Widget Consistency and Performance', () => {
  
  test.beforeAll(async () => {
    testData = createComprehensiveTestDataSet();
  });

  test.beforeEach(async ({ context, page }) => {
    await setupBrowserContext(context);
    await preparePageForVisualTesting(page);
  });

  test('should render widget consistently across multiple mounts', async ({ page }) => {
    await navigateToWidgetTestPage(page);
    
    // Test that widget looks the same across multiple mounts
    for (let i = 0; i < 3; i++) {
      const containerId = `widget-consistency-${i}`;
      await createWidgetContainer(page, containerId);
      await mountWidget(page, containerId, {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await waitForWidgetState(page, containerId, 'ready');
      
      const widgetContainer = getWidgetContainer(page, containerId);
      await expect(widgetContainer).toHaveScreenshot(`widget-consistency-${i + 1}.png`, {
        maxDiffPixelRatio: 0.001
      });
    }
  });

  test('should maintain theme consistency after interactions', async ({ page }) => {
    await navigateToWidgetTestPage(page);
    
    await createWidgetContainer(page, 'widget-interaction');
    await mountWidget(page, 'widget-interaction', {
      surveyId: testData.baseData.surveyId,
      theme: WIDGET_THEMES.corporate
    });
    
    await waitForWidgetState(page, 'widget-interaction', 'ready');
    
    // Interact with widget (hover, click, etc.)
    const widgetContainer = getWidgetContainer(page, 'widget-interaction');
    const button = widgetContainer.locator('button').first();
    
    if (await button.count() > 0) {
      await button.hover();
      await page.waitForTimeout(200);
      await button.click();
      await page.waitForTimeout(300);
    }
    
    // Theme should remain consistent after interactions
    await expect(widgetContainer).toHaveScreenshot('widget-post-interaction-consistency.png', {
      maxDiffPixelRatio: 0.001
    });
  });

});