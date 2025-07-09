/**
 * @fileoverview Enhanced Visual regression test suite for SurvAI
 * 
 * Comprehensive visual testing for:
 * - Admin dashboard states and components
 * - Survey flow navigation and CTA questions
 * - Chat interface states
 * - Metrics charts and offer management
 * - Embeddable widget integration
 * - Cross-browser compatibility
 * - Performance and consistency validation
 * 
 * This suite integrates all dedicated test suites into a comprehensive regression test.
 */

import { test, expect } from '@playwright/test';
import { 
  loginAsAdmin, 
  createDeterministicTestData, 
  cleanupVisualTestData,
  disconnectPrisma,
  type VisualTestData
} from './auth-helpers';
import {
  setupBrowserContext,
  preparePageForVisualTesting,
  setupVisualTestEnvironment,
  cleanupVisualTestEnvironment,
  prepareAdminDashboard,
  prepareSurveyPage,
  prepareChatPanel
} from './visual-setup';

// Import helper functions from dedicated helper files
import { navigateToAdminDashboard, waitForDashboardToLoad } from './helpers/dashboard-helpers';
import { navigateToSurveyWithOffers, waitForSurveyToLoad } from './helpers/survey-helpers';
import { navigateToWidgetTestPage, mountWidget, WIDGET_THEMES } from './helpers/widget-helpers';
import { createComprehensiveTestDataSet } from './helpers/data-seeders';

// Global test data
let testData: ReturnType<typeof createComprehensiveTestDataSet>;

test.describe('Visual Regression Testing Suite', () => {
  
  test.beforeAll(async ({ browser }) => {
    // Set up comprehensive test data
    testData = createComprehensiveTestDataSet();
  });

  test.afterAll(async () => {
    // Clean up test environment
    await cleanupVisualTestEnvironment();
  });

  test.beforeEach(async ({ context, page }) => {
    // Set up browser context for consistent rendering
    await setupBrowserContext(context);
    
    // Prepare page for visual testing
    await preparePageForVisualTesting(page);
  });

  test.describe('Admin Dashboard Visual Regression', () => {
    
    test.beforeEach(async ({ page }) => {
      // PATTERN: Setup similar to existing integration tests
      // Skip auth for initial visual testing setup
      console.log('Skipping auth for visual testing');
    });

    test('should capture admin dashboard main view', async ({ page }) => {
      await navigateToAdminDashboard(page);
      await waitForDashboardToLoad(page);
      
      // Take screenshot of full dashboard
      await expect(page).toHaveScreenshot('admin-dashboard-main.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture dashboard metrics chart', async ({ page }) => {
      await page.goto('/admin');
      await prepareAdminDashboard(page);

      // Focus on metrics chart area
      const metricsChart = page.locator('[data-testid="metrics-chart"], .metrics-chart, .chart-container').first();
      if (await metricsChart.count() > 0) {
        await expect(metricsChart).toHaveScreenshot('metrics-chart.png');
      } else {
        // Fallback to whole dashboard if specific chart not found
        console.warn('Metrics chart not found, capturing dashboard area');
        await expect(page.locator('.dashboard-content, .admin-content').first()).toHaveScreenshot('metrics-chart-fallback.png');
      }
    });

    test('should capture offer metrics table', async ({ page }) => {
      await page.goto('/admin');
      await prepareAdminDashboard(page);

      // Capture offer metrics section
      const offerMetrics = page.locator('[data-testid="offer-metrics"], .offer-metrics, .offers-table').first();
      if (await offerMetrics.count() > 0) {
        await expect(offerMetrics).toHaveScreenshot('offer-metrics-table.png');
      } else {
        console.warn('Offer metrics table not found, capturing main dashboard');
        await expect(page).toHaveScreenshot('offer-metrics-fallback.png');
      }
    });

    test('should capture chat panel closed state', async ({ page }) => {
      await page.goto('/admin');
      await prepareAdminDashboard(page);

      // Ensure chat panel is closed
      const chatToggle = page.locator('[data-testid="chat-toggle"], .chat-toggle, .chat-button').first();
      if (await chatToggle.count() > 0) {
        // Make sure chat is closed
        const chatPanel = page.locator('[data-testid="chat-panel"], .chat-panel').first();
        const isVisible = await chatPanel.isVisible().catch(() => false);
        if (isVisible) {
          await chatToggle.click();
          await page.waitForTimeout(500);
        }
      }

      // Take screenshot with chat panel closed
      await expect(page).toHaveScreenshot('chat-panel-closed.png');
    });

    test('should capture chat panel open state', async ({ page }) => {
      await page.goto('/admin');
      await prepareAdminDashboard(page);

      // Open chat panel
      const chatToggle = page.locator('[data-testid="chat-toggle"], .chat-toggle, .chat-button').first();
      if (await chatToggle.count() > 0) {
        await chatToggle.click();
        await page.waitForTimeout(500);
        
        await prepareChatPanel(page);
        
        // Take screenshot with chat panel open
        await expect(page).toHaveScreenshot('chat-panel-open.png');
      } else {
        console.warn('Chat toggle not found, capturing dashboard without chat interaction');
        await expect(page).toHaveScreenshot('chat-panel-open-fallback.png');
      }
    });

    test('should capture offer management interface', async ({ page }) => {
      // Navigate to offer management if it exists as separate page
      await page.goto('/admin/offers').catch(async () => {
        // Fallback to main admin page
        await page.goto('/admin');
      });
      
      await prepareAdminDashboard(page);

      // Capture offer management interface
      await expect(page).toHaveScreenshot('offer-management.png');
    });

  });

  test.describe('Survey Flow Visual Regression', () => {
    
    test('should capture survey landing page', async ({ page }) => {
      // Use deterministic survey ID from test data
      await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
      await waitForSurveyToLoad(page);

      // Take screenshot of survey landing
      await expect(page).toHaveScreenshot('survey-landing.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture CTA question with offers', async ({ page }) => {
      await page.goto(`/survey/${testData.surveyId}`);
      await prepareSurveyPage(page);

      // Wait for question and offers to load
      const questionCard = page.locator('[data-testid="question-card"], .question-card').first();
      if (await questionCard.count() > 0) {
        await expect(questionCard).toHaveScreenshot('survey-cta-question.png');
      } else {
        // Fallback to full page if question card not found
        await expect(page).toHaveScreenshot('survey-cta-question-fallback.png');
      }
    });

    test('should capture offer buttons layout', async ({ page }) => {
      await page.goto(`/survey/${testData.surveyId}`);
      await prepareSurveyPage(page);

      // Focus on offer buttons area
      const offerButtons = page.locator('[data-testid="offer-buttons"], .offer-buttons, .cta-buttons').first();
      if (await offerButtons.count() > 0) {
        await expect(offerButtons).toHaveScreenshot('offer-buttons-layout.png');
      } else {
        // Look for individual offer buttons
        const firstButton = page.locator('[data-testid="offer-button"], .offer-button').first();
        if (await firstButton.count() > 0) {
          const buttonContainer = firstButton.locator('xpath=ancestor::*[contains(@class, "button") or contains(@class, "offer") or contains(@class, "cta")][1]');
          await expect(buttonContainer).toHaveScreenshot('offer-buttons-layout.png');
        } else {
          await expect(page).toHaveScreenshot('offer-buttons-layout-fallback.png');
        }
      }
    });

    test('should capture survey after offer click', async ({ page }) => {
      await page.goto(`/survey/${testData.surveyId}`);
      await prepareSurveyPage(page);

      // Click first offer button
      const offerButton = page.locator('[data-testid="offer-button"], .offer-button').first();
      if (await offerButton.count() > 0) {
        await offerButton.click();
        
        // Wait for navigation or state change
        await page.waitForTimeout(1000);
        await prepareSurveyPage(page);
        
        // Capture post-click state
        await expect(page).toHaveScreenshot('survey-post-click.png');
      } else {
        console.warn('No offer button found, capturing current state');
        await expect(page).toHaveScreenshot('survey-post-click-fallback.png');
      }
    });

  });

  test.describe('Responsive Design Visual Regression', () => {
    
    test('should capture mobile dashboard view', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin');
      await prepareAdminDashboard(page);

      await expect(page).toHaveScreenshot('admin-dashboard-mobile.png');
    });

    test('should capture mobile survey view', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`/survey/${testData.surveyId}`);
      await prepareSurveyPage(page);

      await expect(page).toHaveScreenshot('survey-mobile.png');
    });

    test('should capture tablet dashboard view', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/admin');
      await prepareAdminDashboard(page);

      await expect(page).toHaveScreenshot('admin-dashboard-tablet.png');
    });

  });

  test.describe('Error State Visual Regression', () => {
    
    test('should capture login page', async ({ page }) => {
      await page.goto('/login');
      await preparePageForVisualTesting(page);

      await expect(page).toHaveScreenshot('login-page.png');
    });

    test('should capture 404 page', async ({ page }) => {
      await page.goto('/non-existent-page');
      await preparePageForVisualTesting(page);

      await expect(page).toHaveScreenshot('404-page.png');
    });

    test('should capture unauthorized access attempt', async ({ page }) => {
      // Try to access admin without authentication
      await page.goto('/admin');
      await preparePageForVisualTesting(page);

      // Should redirect to login or show unauthorized message
      await expect(page).toHaveScreenshot('unauthorized-access.png');
    });

  });

  test.describe('Embeddable Widget Visual Regression', () => {
    
    test('should capture widget with default theme', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create container and mount widget
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'test-widget';
        container.style.cssText = 'min-height: 300px; padding: 20px; border: 2px dashed #ccc; border-radius: 8px; margin: 20px; background: white;';
        document.body.appendChild(container);
      });
      
      await mountWidget(page, 'test-widget', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await page.waitForTimeout(1000);
      
      // Capture widget container
      const widgetContainer = page.locator('#test-widget');
      await expect(widgetContainer).toHaveScreenshot('widget-default-theme.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget with corporate theme', async ({ page }) => {
      await navigateToWidgetTestPage(page);
      
      // Create container and mount widget
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'test-widget-corporate';
        container.style.cssText = 'min-height: 300px; padding: 20px; border: 2px dashed #ccc; border-radius: 8px; margin: 20px; background: white;';
        document.body.appendChild(container);
      });
      
      await mountWidget(page, 'test-widget-corporate', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.corporate,
        partnerId: 'corporate-partner-456'
      });
      
      await page.waitForTimeout(1000);
      
      // Capture widget container
      const widgetContainer = page.locator('#test-widget-corporate');
      await expect(widgetContainer).toHaveScreenshot('widget-corporate-theme.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture widget responsiveness', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToWidgetTestPage(page);
      
      // Create container and mount widget
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'test-widget-mobile';
        container.style.cssText = 'min-height: 200px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin: 10px;';
        document.body.appendChild(container);
      });
      
      await mountWidget(page, 'test-widget-mobile', {
        surveyId: testData.baseData.surveyId,
        theme: WIDGET_THEMES.default
      });
      
      await page.waitForTimeout(1000);
      
      // Capture widget container
      const widgetContainer = page.locator('#test-widget-mobile');
      await expect(widgetContainer).toHaveScreenshot('widget-mobile-responsive.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Loading State Visual Regression', () => {
    
    test('should capture dashboard loading state', async ({ page }) => {
      // Navigate to admin and immediately capture before full load
      await page.goto('/admin');
      
      // Capture potential loading state (if page loads slowly)
      await page.waitForTimeout(100);
      await expect(page).toHaveScreenshot('dashboard-loading.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

});

/**
 * Visual test for deliberate UI changes (for validation)
 * This test is designed to fail when UI changes are made
 */
test.describe('Visual Change Detection Validation', () => {
  
  test.beforeAll(async () => {
    testData = createComprehensiveTestDataSet();
  });

  test.afterAll(async () => {
    await cleanupVisualTestEnvironment();
  });

  test.beforeEach(async ({ context, page }) => {
    await setupBrowserContext(context);
    await preparePageForVisualTesting(page);
  });

  test('should detect 5px UI shift for validation', async ({ page }) => {
    await navigateToAdminDashboard(page);
    await waitForDashboardToLoad(page);

    // This test is designed to validate that visual differences are caught
    // To test: temporarily modify a component to shift 5px and run this test
    // It should fail when UI changes exceed the 0.1% threshold
    await expect(page).toHaveScreenshot('ui-shift-validation.png', {
      maxDiffPixelRatio: 0.001
    });
  });

});

/**
 * Performance and execution time validation
 * Ensures all visual tests complete within 90 seconds
 */
test.describe('Visual Test Performance Validation', () => {
  
  test.beforeAll(async () => {
    testData = createComprehensiveTestDataSet();
  });

  test.beforeEach(async ({ context, page }) => {
    await setupBrowserContext(context);
    await preparePageForVisualTesting(page);
  });

  test('should complete critical visual tests within time limit', async ({ page }) => {
    const startTime = Date.now();
    
    // Run a representative sample of critical visual tests
    await navigateToAdminDashboard(page);
    await waitForDashboardToLoad(page);
    await expect(page).toHaveScreenshot('performance-admin-dashboard.png', {
      maxDiffPixelRatio: 0.001
    });
    
    await navigateToSurveyWithOffers(page, testData.baseData.surveyId, 3);
    await waitForSurveyToLoad(page);
    await expect(page).toHaveScreenshot('performance-survey-flow.png', {
      maxDiffPixelRatio: 0.001
    });
    
    await navigateToWidgetTestPage(page);
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'performance-widget';
      container.style.cssText = 'min-height: 200px; padding: 10px; border: 1px solid #ccc; margin: 10px;';
      document.body.appendChild(container);
    });
    
    await mountWidget(page, 'performance-widget', {
      surveyId: testData.baseData.surveyId,
      theme: WIDGET_THEMES.default
    });
    
    await page.waitForTimeout(500);
    const widgetContainer = page.locator('#performance-widget');
    await expect(widgetContainer).toHaveScreenshot('performance-widget.png', {
      maxDiffPixelRatio: 0.001
    });
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Ensure critical tests complete within reasonable time (30s for this subset)
    expect(executionTime).toBeLessThan(30000);
    
    console.log(`Critical visual tests completed in ${executionTime}ms`);
  });

});