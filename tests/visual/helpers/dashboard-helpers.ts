/**
 * @fileoverview Dashboard state management utilities for visual testing
 * 
 * Provides utilities for managing admin dashboard states including metrics,
 * charts, chat panel, and offer management for visual regression testing.
 */

import { Page } from '@playwright/test';
import { prepareAdminDashboard, prepareChatPanel, prepareDashboardState } from '../visual-setup';

/**
 * Admin dashboard state configuration
 */
export interface AdminDashboardState {
  metricsLoaded: boolean;
  chatPanelOpen: boolean;
  offerManagementOpen: boolean;
  timeRange: '24h' | '7d' | '30d';
}

/**
 * Dashboard metrics data for testing
 */
export interface DashboardMetrics {
  totalOffers: number;
  activeOffers: number;
  totalClicks: number;
  conversionRate: number;
  topPerformingOffers: string[];
}

/**
 * Navigate to admin dashboard
 */
export async function navigateToAdminDashboard(page: Page): Promise<void> {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  await prepareAdminDashboard(page);
}

/**
 * Navigate to offer management page
 */
export async function navigateToOfferManagement(page: Page): Promise<void> {
  try {
    await page.goto('/admin/offers');
    await page.waitForLoadState('networkidle');
  } catch {
    // Fallback to main admin page if offer management doesn't exist as separate page
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  }
  await prepareAdminDashboard(page);
}

/**
 * Set dashboard to specific state
 */
export async function setDashboardState(page: Page, state: Partial<AdminDashboardState>): Promise<void> {
  await prepareDashboardState(page, state);
}

/**
 * Wait for dashboard metrics to load
 */
export async function waitForDashboardMetrics(page: Page): Promise<void> {
  const metricSelectors = [
    '[data-testid="total-offers"], .total-offers, .offer-count',
    '[data-testid="active-offers"], .active-offers',
    '[data-testid="total-clicks"], .total-clicks, .click-count',
    '[data-testid="conversion-rate"], .conversion-rate'
  ];
  
  for (const selector of metricSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
    } catch (error) {
      console.warn(`Metric selector ${selector} not found, continuing...`);
    }
  }
  
  // Wait for metrics to stabilize
  await page.waitForTimeout(1000);
}

/**
 * Wait for charts to finish rendering
 */
export async function waitForChartsToRender(page: Page): Promise<void> {
  const chartSelectors = [
    '[data-testid="metrics-chart"], .metrics-chart',
    '[data-testid="epc-chart"], .epc-chart',
    '[data-testid="performance-chart"], .performance-chart',
    '.chart-container:not(.loading)'
  ];
  
  for (const selector of chartSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
    } catch (error) {
      console.warn(`Chart selector ${selector} not found, continuing...`);
    }
  }
  
  // Wait for chart animations to complete
  await page.waitForTimeout(1500);
}

/**
 * Open chat panel
 */
export async function openChatPanel(page: Page): Promise<void> {
  const chatToggle = page.locator('[data-testid="chat-toggle"], .chat-toggle, .chat-button').first();
  
  if (await chatToggle.count() > 0) {
    // Check if chat panel is already open
    const chatPanel = page.locator('[data-testid="chat-panel"], .chat-panel').first();
    const isVisible = await chatPanel.isVisible().catch(() => false);
    
    if (!isVisible) {
      await chatToggle.click();
      await page.waitForTimeout(500);
    }
    
    await prepareChatPanel(page);
  }
}

/**
 * Close chat panel
 */
export async function closeChatPanel(page: Page): Promise<void> {
  const chatToggle = page.locator('[data-testid="chat-toggle"], .chat-toggle, .chat-button').first();
  
  if (await chatToggle.count() > 0) {
    // Check if chat panel is open
    const chatPanel = page.locator('[data-testid="chat-panel"], .chat-panel').first();
    const isVisible = await chatPanel.isVisible().catch(() => false);
    
    if (isVisible) {
      await chatToggle.click();
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Get dashboard metrics container
 */
export function getDashboardMetricsContainer(page: Page) {
  return page.locator('[data-testid="dashboard-metrics"], .dashboard-metrics, .metrics-container').first();
}

/**
 * Get metrics chart container
 */
export function getMetricsChartContainer(page: Page) {
  return page.locator('[data-testid="metrics-chart"], .metrics-chart, .chart-container').first();
}

/**
 * Get offer metrics table container
 */
export function getOfferMetricsContainer(page: Page) {
  return page.locator('[data-testid="offer-metrics"], .offer-metrics, .offers-table').first();
}

/**
 * Get chat panel container
 */
export function getChatPanelContainer(page: Page) {
  return page.locator('[data-testid="chat-panel"], .chat-panel').first();
}

/**
 * Switch time range on dashboard
 */
export async function switchTimeRange(page: Page, timeRange: '24h' | '7d' | '30d'): Promise<void> {
  const timeRangeSelector = page.locator('[data-testid="time-range"], .time-range-selector, .time-filter').first();
  
  if (await timeRangeSelector.count() > 0) {
    await timeRangeSelector.selectOption(timeRange);
    await page.waitForTimeout(1000);
    
    // Wait for charts to re-render with new data
    await waitForChartsToRender(page);
  }
}

/**
 * Check if dashboard is in loading state
 */
export async function isDashboardLoading(page: Page): Promise<boolean> {
  const loadingSelectors = [
    '.dashboard-loading',
    '.loading-spinner',
    '[data-testid="loading"]',
    '.chart-container.loading'
  ];
  
  for (const selector of loadingSelectors) {
    if (await page.locator(selector).count() > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Wait for dashboard to finish loading
 */
export async function waitForDashboardToLoad(page: Page): Promise<void> {
  // Wait for loading states to disappear
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('.dashboard-loading, .loading-spinner, [data-testid="loading"], .chart-container.loading');
    return loadingElements.length === 0;
  }, { timeout: 10000 });
  
  // Wait for metrics and charts to load
  await waitForDashboardMetrics(page);
  await waitForChartsToRender(page);
}

/**
 * Capture dashboard in specific responsive state
 */
export async function captureDashboardResponsive(page: Page, viewport: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(viewport);
  await navigateToAdminDashboard(page);
  await waitForDashboardToLoad(page);
  
  // Additional wait for responsive layout to settle
  await page.waitForTimeout(1000);
}

/**
 * Test dashboard error states
 */
export async function prepareDashboardErrorState(page: Page, errorType: 'unauthorized' | 'network-error' | 'data-error'): Promise<void> {
  switch (errorType) {
    case 'unauthorized':
      // Navigate to admin without authentication
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      break;
      
    case 'network-error':
      // Mock network failure
      await page.route('/api/dashboard/**', route => {
        route.abort('failed');
      });
      await navigateToAdminDashboard(page);
      break;
      
    case 'data-error':
      // Mock API error response
      await page.route('/api/dashboard/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      await navigateToAdminDashboard(page);
      break;
  }
}

/**
 * Get offer management table container
 */
export function getOfferManagementContainer(page: Page) {
  return page.locator('[data-testid="offer-management"], .offer-management, .offers-table').first();
}

/**
 * Wait for offer management table to load
 */
export async function waitForOfferManagementToLoad(page: Page): Promise<void> {
  const offerTableSelectors = [
    '[data-testid="offers-table"], .offers-table',
    '[data-testid="offer-list"], .offer-list',
    '.offer-row'
  ];
  
  for (const selector of offerTableSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
    } catch (error) {
      console.warn(`Offer table selector ${selector} not found, continuing...`);
    }
  }
  
  // Wait for table to stabilize
  await page.waitForTimeout(1000);
}

/**
 * Open offer creation modal
 */
export async function openOfferCreationModal(page: Page): Promise<void> {
  const createButton = page.locator('[data-testid="create-offer"], .create-offer, .new-offer-button').first();
  
  if (await createButton.count() > 0) {
    await createButton.click();
    await page.waitForSelector('[data-testid="offer-modal"], .offer-modal, .modal', { timeout: 5000 });
    await page.waitForTimeout(500);
  }
}

/**
 * Close offer modal
 */
export async function closeOfferModal(page: Page): Promise<void> {
  const closeButton = page.locator('[data-testid="close-modal"], .close-modal, .modal-close').first();
  
  if (await closeButton.count() > 0) {
    await closeButton.click();
    await page.waitForTimeout(500);
  }
}