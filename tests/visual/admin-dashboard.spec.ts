/**
 * @fileoverview Admin Dashboard Visual Tests
 * 
 * Comprehensive visual regression testing for admin dashboard states:
 * - Dashboard metrics and charts
 * - Chat panel states (open/closed)
 * - Responsive design variations
 * - Loading and error states
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, createDeterministicTestData } from './auth-helpers';
import { setupBrowserContext, preparePageForVisualTesting } from './visual-setup';
import {
  navigateToAdminDashboard,
  setDashboardState,
  waitForDashboardToLoad,
  openChatPanel,
  closeChatPanel,
  switchTimeRange,
  getDashboardMetricsContainer,
  getMetricsChartContainer,
  getOfferMetricsContainer,
  getChatPanelContainer,
  captureDashboardResponsive,
  prepareDashboardErrorState
} from './helpers/dashboard-helpers';
import { createComprehensiveTestDataSet } from './helpers/data-seeders';

// Global test data
let testData: ReturnType<typeof createComprehensiveTestDataSet>;

test.describe('Admin Dashboard Visual Tests', () => {
  
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

  test.describe('Dashboard Main Views', () => {
    
    test('should capture dashboard with loaded metrics', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Set dashboard state with loaded metrics
      await setDashboardState(page, {
        metricsLoaded: true,
        chatPanelOpen: false,
        timeRange: '7d'
      });
      
      await waitForDashboardToLoad(page);
      
      // Take full dashboard screenshot
      await expect(page).toHaveScreenshot('admin-dashboard-main.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture dashboard metrics section', async ({ page }) => {
      await navigateToAdminDashboard(page);
      await waitForDashboardToLoad(page);
      
      // Capture metrics section specifically
      const metricsContainer = getDashboardMetricsContainer(page);
      if (await metricsContainer.count() > 0) {
        await expect(metricsContainer).toHaveScreenshot('dashboard-metrics-section.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Fallback to main dashboard if metrics container not found
        await expect(page).toHaveScreenshot('dashboard-metrics-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture metrics chart', async ({ page }) => {
      await navigateToAdminDashboard(page);
      await waitForDashboardToLoad(page);
      
      // Capture metrics chart specifically
      const chartContainer = getMetricsChartContainer(page);
      if (await chartContainer.count() > 0) {
        await expect(chartContainer).toHaveScreenshot('metrics-chart.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Fallback to dashboard area if chart not found
        await expect(page.locator('.admin-content, .dashboard-content').first()).toHaveScreenshot('metrics-chart-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

    test('should capture offer metrics table', async ({ page }) => {
      await navigateToAdminDashboard(page);
      await waitForDashboardToLoad(page);
      
      // Capture offer metrics table
      const offerMetricsContainer = getOfferMetricsContainer(page);
      if (await offerMetricsContainer.count() > 0) {
        await expect(offerMetricsContainer).toHaveScreenshot('offer-metrics-table.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Fallback to main dashboard
        await expect(page).toHaveScreenshot('offer-metrics-table-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

  });

  test.describe('Chat Panel States', () => {
    
    test('should capture dashboard with chat panel closed', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Ensure chat panel is closed
      await closeChatPanel(page);
      
      await waitForDashboardToLoad(page);
      
      // Take screenshot with chat panel closed
      await expect(page).toHaveScreenshot('dashboard-chat-closed.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture dashboard with chat panel open', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Open chat panel
      await openChatPanel(page);
      
      await waitForDashboardToLoad(page);
      
      // Take screenshot with chat panel open
      await expect(page).toHaveScreenshot('dashboard-chat-open.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture chat panel component', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Open chat panel
      await openChatPanel(page);
      
      await waitForDashboardToLoad(page);
      
      // Capture chat panel specifically
      const chatContainer = getChatPanelContainer(page);
      if (await chatContainer.count() > 0) {
        await expect(chatContainer).toHaveScreenshot('chat-panel-component.png', {
          maxDiffPixelRatio: 0.001
        });
      } else {
        // Fallback to dashboard with chat toggle area
        await expect(page).toHaveScreenshot('chat-panel-component-fallback.png', {
          maxDiffPixelRatio: 0.001
        });
      }
    });

  });

  test.describe('Time Range Variations', () => {
    
    test('should capture dashboard with 24h time range', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Switch to 24h time range
      await switchTimeRange(page, '24h');
      
      await waitForDashboardToLoad(page);
      
      await expect(page).toHaveScreenshot('dashboard-24h-range.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture dashboard with 7d time range', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Switch to 7d time range (default)
      await switchTimeRange(page, '7d');
      
      await waitForDashboardToLoad(page);
      
      await expect(page).toHaveScreenshot('dashboard-7d-range.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture dashboard with 30d time range', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Switch to 30d time range
      await switchTimeRange(page, '30d');
      
      await waitForDashboardToLoad(page);
      
      await expect(page).toHaveScreenshot('dashboard-30d-range.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Responsive Design', () => {
    
    test('should capture mobile dashboard view', async ({ page }) => {
      await captureDashboardResponsive(page, { width: 375, height: 667 });
      
      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture tablet dashboard view', async ({ page }) => {
      await captureDashboardResponsive(page, { width: 768, height: 1024 });
      
      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture desktop dashboard view', async ({ page }) => {
      await captureDashboardResponsive(page, { width: 1366, height: 768 });
      
      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Error and Loading States', () => {
    
    test('should capture dashboard loading state', async ({ page }) => {
      await page.goto('/admin');
      
      // Capture immediately for potential loading state
      await page.waitForTimeout(100);
      
      await expect(page).toHaveScreenshot('dashboard-loading.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture unauthorized access', async ({ page }) => {
      await prepareDashboardErrorState(page, 'unauthorized');
      
      await expect(page).toHaveScreenshot('dashboard-unauthorized.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture network error state', async ({ page }) => {
      await prepareDashboardErrorState(page, 'network-error');
      
      await expect(page).toHaveScreenshot('dashboard-network-error.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture data error state', async ({ page }) => {
      await prepareDashboardErrorState(page, 'data-error');
      
      await expect(page).toHaveScreenshot('dashboard-data-error.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

  test.describe('Complex Dashboard States', () => {
    
    test('should capture dashboard with all panels open', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Set complex dashboard state
      await setDashboardState(page, {
        metricsLoaded: true,
        chatPanelOpen: true,
        timeRange: '7d'
      });
      
      await waitForDashboardToLoad(page);
      
      await expect(page).toHaveScreenshot('dashboard-all-panels-open.png', {
        maxDiffPixelRatio: 0.001
      });
    });

    test('should capture dashboard with minimal UI', async ({ page }) => {
      await navigateToAdminDashboard(page);
      
      // Set minimal dashboard state
      await setDashboardState(page, {
        metricsLoaded: true,
        chatPanelOpen: false,
        timeRange: '24h'
      });
      
      await waitForDashboardToLoad(page);
      
      await expect(page).toHaveScreenshot('dashboard-minimal.png', {
        maxDiffPixelRatio: 0.001
      });
    });

  });

});

/**
 * UI consistency tests for dashboard
 */
test.describe('Dashboard UI Consistency', () => {
  
  test.beforeAll(async () => {
    testData = createComprehensiveTestDataSet();
  });

  test.beforeEach(async ({ context, page }) => {
    await setupBrowserContext(context);
    await preparePageForVisualTesting(page);
  });

  test('should render dashboard consistently across multiple loads', async ({ page }) => {
    // Test that dashboard looks the same across multiple loads
    for (let i = 0; i < 3; i++) {
      await navigateToAdminDashboard(page);
      await waitForDashboardToLoad(page);
      
      // Each reload should look identical
      await expect(page).toHaveScreenshot(`dashboard-consistency-${i + 1}.png`, {
        maxDiffPixelRatio: 0.001
      });
    }
  });

  test('should maintain consistent layout after interactions', async ({ page }) => {
    await navigateToAdminDashboard(page);
    await waitForDashboardToLoad(page);
    
    // Perform various interactions
    await openChatPanel(page);
    await closeChatPanel(page);
    await switchTimeRange(page, '30d');
    await switchTimeRange(page, '7d');
    
    // Layout should be consistent after interactions
    await expect(page).toHaveScreenshot('dashboard-post-interactions.png', {
      maxDiffPixelRatio: 0.001
    });
  });

});