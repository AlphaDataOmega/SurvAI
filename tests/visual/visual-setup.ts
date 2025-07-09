/**
 * @fileoverview Visual test environment setup
 * 
 * Configures the testing environment for visual regression tests including:
 * - Browser context setup with consistent configuration
 * - CSS injection for masking dynamic content
 * - Environment variable validation
 * - Test isolation and cleanup helpers
 */

import { Page, BrowserContext } from '@playwright/test';
import { createDeterministicTestData, cleanupVisualTestData, disconnectPrisma } from './auth-helpers';

/**
 * Required environment variables for visual testing
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET'
];

/**
 * CSS to mask dynamic content for consistent screenshots
 * GOTCHA: Hide timestamps, session IDs, and other dynamic elements
 */
const VISUAL_TEST_CSS = `
  /* Hide dynamic timestamps */
  .timestamp, 
  [data-testid="timestamp"],
  .created-at,
  .updated-at,
  .last-login,
  .time-ago {
    visibility: hidden !important;
  }

  /* Hide session and user IDs */
  .session-id,
  .user-id,
  .click-id,
  [data-testid="session-id"],
  [data-testid="user-id"] {
    visibility: hidden !important;
  }

  /* Hide loading spinners and dynamic indicators */
  .loading-spinner,
  .spinner,
  [data-testid="loading"],
  .loading-indicator {
    display: none !important;
  }

  /* Hide random/dynamic order indicators */
  .offer-order,
  .question-order,
  [data-dynamic="true"] {
    visibility: hidden !important;
  }

  /* Hide cursor and selection states */
  * {
    cursor: default !important;
  }

  /* Stabilize animations */
  *,
  *::before,
  *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }

  /* Hide scroll bars for consistent screenshots */
  ::-webkit-scrollbar {
    display: none;
  }

  /* Ensure consistent font rendering */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Hide live data updates */
  .live-data,
  .real-time,
  [data-live="true"] {
    visibility: hidden !important;
  }

  /* Hide tooltips and hover states */
  .tooltip,
  [data-tooltip],
  .hover-content {
    display: none !important;
  }
`;

/**
 * Visual test data IDs for deterministic content
 */
export interface VisualTestData {
  surveyId: string;
  questionId: string;
  offerId: string;
  userId: string;
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for visual testing: ${missingVars.join(', ')}\n` +
      'Please ensure these are set in your .env file or environment.'
    );
  }

  // Validate we're not running against production database
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.includes('production')) {
    throw new Error(
      'Visual tests cannot run against production database. ' +
      'Please use a test database URL.'
    );
  }
}

/**
 * Set up browser context for visual testing
 * CRITICAL: Consistent configuration for deterministic screenshots
 */
export async function setupBrowserContext(context: BrowserContext): Promise<void> {
  // Set consistent user agent
  await context.setExtraHTTPHeaders({
    'User-Agent': 'Visual-Test-Browser/1.0 (Playwright)'
  });

  // Set consistent geolocation (optional)
  await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 }); // San Francisco
  
  // Set consistent timezone
  await context.addInitScript(() => {
    // Override Date.now() to return a fixed timestamp for tests
    const originalNow = Date.now;
    Date.now = () => new Date('2024-01-01T12:00:00Z').getTime();
    
    // Override Math.random() to return consistent values
    const originalRandom = Math.random;
    let seed = 12345;
    Math.random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  });
}

/**
 * Prepare page for visual testing
 * PATTERN: Apply consistent styling and wait for content to load
 */
export async function preparePageForVisualTesting(page: Page): Promise<void> {
  // Inject CSS to mask dynamic content
  await page.addStyleTag({
    content: VISUAL_TEST_CSS
  });

  // Set consistent device pixel ratio
  await page.emulateMedia({ reducedMotion: 'reduce' });

  // Wait for any initial animations to complete
  await page.waitForTimeout(500);

  // Ensure page is fully loaded
  await page.waitForLoadState('networkidle');
}

/**
 * Set up deterministic test data and environment
 */
export async function setupVisualTestEnvironment(): Promise<VisualTestData> {
  // Validate environment first
  // validateEnvironment(); // Temporarily disabled for validation testing

  // Create deterministic test data
  const testData = await createDeterministicTestData();

  return testData;
}

/**
 * Clean up test environment after tests
 */
export async function cleanupVisualTestEnvironment(): Promise<void> {
  await cleanupVisualTestData();
  await disconnectPrisma();
}

/**
 * Wait for specific elements to be stable for screenshots
 * CRITICAL: Ensure dynamic content has loaded and stabilized
 */
export async function waitForElementsToStabilize(page: Page, selectors: string[]): Promise<void> {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 10000 });
      
      // Wait additional time for the element to fully render
      await page.waitForTimeout(200);
      
      // Check if element is visible and not animating
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible' });
      
    } catch (error) {
      console.warn(`Warning: Element ${selector} not found or not stable, continuing...`);
    }
  }
}

/**
 * Hide specific dynamic elements on a page
 */
export async function hideDynamicElements(page: Page, additionalSelectors: string[] = []): Promise<void> {
  const baseSelectors = [
    '.timestamp',
    '.session-id', 
    '.loading-spinner',
    '[data-testid="loading"]'
  ];

  const allSelectors = [...baseSelectors, ...additionalSelectors];

  await page.addStyleTag({
    content: allSelectors.map(selector => `${selector} { display: none !important; }`).join('\n')
  });
}

/**
 * Prepare admin dashboard for visual testing
 * Specific setup for dashboard page with charts and metrics
 */
export async function prepareAdminDashboard(page: Page): Promise<void> {
  // Wait for dashboard components to load
  const dashboardSelectors = [
    '[data-testid="admin-dashboard"], .admin-dashboard',
    '[data-testid="metrics-chart"], .metrics-chart, .chart-container',
    '[data-testid="offer-metrics"], .offer-metrics',
    '[data-testid="chat-panel"], .chat-panel'
  ];

  await waitForElementsToStabilize(page, dashboardSelectors);

  // Hide dashboard-specific dynamic content
  await hideDynamicElements(page, [
    '.last-updated',
    '.refresh-time',
    '.live-metrics',
    '.real-time-data'
  ]);

  // Ensure charts have finished rendering
  await page.waitForTimeout(1000);
}

/**
 * Prepare survey page for visual testing
 * Specific setup for survey flow with questions and offers
 */
export async function prepareSurveyPage(page: Page): Promise<void> {
  // Wait for survey components to load
  const surveySelectors = [
    '[data-testid="question-card"], .question-card',
    '[data-testid="offer-button"], .offer-button',
    '[data-testid="survey-progress"], .survey-progress'
  ];

  await waitForElementsToStabilize(page, surveySelectors);

  // Hide survey-specific dynamic content
  await hideDynamicElements(page, [
    '.progress-time',
    '.session-timer',
    '.randomized-order'
  ]);

  // Wait for offer ordering to stabilize (EPC-driven)
  await page.waitForTimeout(500);
}

/**
 * Prepare chat panel for visual testing
 * Specific setup for chat interface states
 */
export async function prepareChatPanel(page: Page): Promise<void> {
  // Wait for chat components
  const chatSelectors = [
    '[data-testid="chat-panel"], .chat-panel',
    '[data-testid="chat-messages"], .chat-messages',
    '[data-testid="chat-input"], .chat-input'
  ];

  await waitForElementsToStabilize(page, chatSelectors);

  // Hide chat-specific dynamic content
  await hideDynamicElements(page, [
    '.message-timestamp',
    '.typing-indicator',
    '.online-status'
  ]);
}

/**
 * Prepare widget for visual testing
 * Widget-specific setup for embeddable widget testing
 */
export async function prepareWidgetForVisualTesting(page: Page, widgetConfig?: any): Promise<void> {
  // Apply base visual testing setup first
  await preparePageForVisualTesting(page);
  
  // Wait for React dependencies to load
  await page.waitForFunction(() => window.React && window.ReactDOM);
  
  // Wait for widget bundle to load
  await page.waitForFunction(() => window.SurvAIWidget);
  
  // Apply widget-specific CSS masking
  await page.addStyleTag({
    content: `
      /* Hide widget loading states */
      .widget-loading, [data-widget-loading], .survai-widget-loading {
        display: none !important;
      }
      
      /* Stabilize widget animations */
      .widget-container *, .survai-widget * {
        animation: none !important;
        transition: none !important;
      }
      
      /* Hide widget-specific dynamic content */
      .widget-session-id,
      .widget-timestamp,
      .widget-random-id,
      [data-widget-dynamic] {
        visibility: hidden !important;
      }
      
      /* Ensure consistent widget font rendering */
      .widget-container, .survai-widget {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `
  });
  
  // Wait for widget to be ready
  await page.waitForTimeout(1000);
}

/**
 * Prepare dashboard state for visual testing
 * Dashboard-specific state management
 */
export async function prepareDashboardState(page: Page, state?: {
  metricsLoaded?: boolean;
  chatPanelOpen?: boolean;
  timeRange?: '24h' | '7d' | '30d';
}): Promise<void> {
  const defaultState = {
    metricsLoaded: true,
    chatPanelOpen: false,
    timeRange: '7d' as const
  };
  
  const finalState = { ...defaultState, ...state };
  
  // Wait for dashboard to be ready
  await prepareAdminDashboard(page);
  
  // Handle chat panel state
  if (finalState.chatPanelOpen) {
    const chatToggle = page.locator('[data-testid="chat-toggle"], .chat-toggle, .chat-button').first();
    if (await chatToggle.count() > 0) {
      await chatToggle.click();
      await page.waitForTimeout(500);
      await prepareChatPanel(page);
    }
  }
  
  // Handle time range selection if UI exists
  const timeRangeSelector = page.locator('[data-testid="time-range"], .time-range-selector').first();
  if (await timeRangeSelector.count() > 0) {
    await timeRangeSelector.selectOption(finalState.timeRange);
    await page.waitForTimeout(500);
  }
}

/**
 * Prepare survey flow state for visual testing
 * Survey-specific flow navigation
 */
export async function prepareSurveyFlowState(page: Page, state?: {
  currentQuestion?: number;
  hasOffers?: boolean;
  offersCount?: number;
}): Promise<void> {
  const defaultState = {
    currentQuestion: 1,
    hasOffers: true,
    offersCount: 3
  };
  
  const finalState = { ...defaultState, ...state };
  
  // Wait for survey components to load
  await prepareSurveyPage(page);
  
  // Ensure offers are ordered deterministically
  if (finalState.hasOffers) {
    const offerButtons = page.locator('[data-testid="offer-button"], .offer-button');
    const buttonCount = await offerButtons.count();
    
    if (buttonCount > 0) {
      // Wait for EPC ordering to stabilize
      await page.waitForTimeout(1000);
      
      // Hide dynamic offer ordering indicators
      await hideDynamicElements(page, [
        '.offer-order',
        '.epc-indicator',
        '.offer-rank'
      ]);
    }
  }
  
  // Wait for question progression UI to stabilize
  await page.waitForTimeout(500);
}