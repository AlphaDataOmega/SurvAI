/**
 * @fileoverview Widget mounting and configuration utilities for visual testing
 * 
 * Provides utilities for mounting widgets with different themes and configurations
 * for comprehensive visual regression testing.
 */

import { Page } from '@playwright/test';
import { prepareWidgetForVisualTesting } from '../visual-setup';

/**
 * Widget theme configuration interface
 */
export interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor: string;
  textColor?: string;
  buttonSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'spacious';
  borderRadius?: string;
  fontFamily?: string;
  shadows?: boolean;
  transitions?: boolean;
}

/**
 * Widget configuration for testing
 */
export interface WidgetConfig {
  surveyId: string;
  apiUrl?: string;
  theme?: WidgetTheme;
  partnerId?: string;
  containerId?: string;
}

/**
 * Predefined widget themes for testing
 */
export const WIDGET_THEMES: Record<string, WidgetTheme> = {
  default: {
    primaryColor: '#3182ce',
    secondaryColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    buttonSize: 'medium',
    spacing: 'normal'
  },
  corporate: {
    primaryColor: '#1e40af',
    secondaryColor: '#dbeafe',
    accentColor: '#3b82f6',
    textColor: '#1e3a8a',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    buttonSize: 'large',
    spacing: 'normal',
    shadows: true,
    transitions: true
  },
  nature: {
    primaryColor: '#059669',
    secondaryColor: '#d1fae5',
    accentColor: '#10b981',
    textColor: '#064e3b',
    backgroundColor: '#f0fdf4',
    borderRadius: '0.25rem',
    buttonSize: 'small',
    spacing: 'compact',
    shadows: true,
    transitions: true
  },
  dark: {
    primaryColor: '#3b82f6',
    secondaryColor: '#374151',
    accentColor: '#06b6d4',
    textColor: '#f9fafb',
    backgroundColor: '#111827',
    borderRadius: '0.75rem',
    buttonSize: 'medium',
    spacing: 'normal',
    shadows: false,
    transitions: true
  },
  minimal: {
    primaryColor: '#6b7280',
    secondaryColor: '#f3f4f6',
    accentColor: '#4b5563',
    textColor: '#374151',
    backgroundColor: '#ffffff',
    borderRadius: '0.125rem',
    buttonSize: 'medium',
    spacing: 'normal',
    shadows: false,
    transitions: false
  }
};

/**
 * Mount widget with specific configuration
 * CRITICAL: Use deterministic survey IDs for consistent testing
 */
export async function mountWidget(page: Page, containerId: string, config: WidgetConfig): Promise<void> {
  // Prepare page for widget testing
  await prepareWidgetForVisualTesting(page, config);
  
  // Mount widget using page.evaluate to run in browser context
  await page.evaluate(
    ({ containerId, config }) => {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container element with id '${containerId}' not found`);
      }
      
      if (!window.SurvAIWidget) {
        throw new Error('SurvAIWidget not loaded. Make sure widget bundle is available.');
      }
      
      // Mount widget with configuration
      return window.SurvAIWidget.mount(container, {
        surveyId: config.surveyId,
        apiUrl: config.apiUrl || 'http://localhost:3001',
        theme: config.theme,
        partnerId: config.partnerId,
        onError: (error: Error) => {
          console.error('Widget error:', error);
        }
      });
    },
    { containerId, config }
  );
  
  // Wait for widget to be fully mounted
  await page.waitForSelector(`#${containerId} .widget-container, #${containerId} .survai-widget`, { timeout: 10000 });
  
  // Additional wait for widget to stabilize
  await page.waitForTimeout(1000);
}

/**
 * Mount widget with specific theme
 */
export async function mountWidgetWithTheme(page: Page, containerId: string, themeName: string, options?: Partial<WidgetConfig>): Promise<void> {
  const theme = WIDGET_THEMES[themeName];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeName}`);
  }
  
  const config: WidgetConfig = {
    surveyId: `test-survey-${themeName}`,
    theme,
    partnerId: `${themeName}-partner`,
    ...options
  };
  
  await mountWidget(page, containerId, config);
}

/**
 * Navigate to widget test page and prepare for testing
 */
export async function navigateToWidgetTestPage(page: Page, testPagePath: string = '/examples/widget-test.html'): Promise<void> {
  await page.goto(testPagePath);
  await page.waitForLoadState('networkidle');
  
  // Wait for React dependencies to load
  await page.waitForFunction(() => window.React && window.ReactDOM);
  
  // Wait for widget bundle to load
  await page.waitForFunction(() => window.SurvAIWidget);
}

/**
 * Navigate to widget theme test page
 */
export async function navigateToWidgetThemeTestPage(page: Page): Promise<void> {
  await navigateToWidgetTestPage(page, '/examples/widget-theme-test.html');
}

/**
 * Create widget container element for testing
 */
export async function createWidgetContainer(page: Page, containerId: string, styles?: string): Promise<void> {
  await page.evaluate(
    ({ containerId, styles }) => {
      const container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = styles || `
        min-height: 300px;
        padding: 20px;
        border: 2px dashed #ccc;
        border-radius: 8px;
        margin: 20px;
        background: white;
      `;
      document.body.appendChild(container);
    },
    { containerId, styles }
  );
}

/**
 * Wait for widget to be in specific state
 */
export async function waitForWidgetState(page: Page, containerId: string, expectedState: 'loading' | 'ready' | 'error'): Promise<void> {
  await page.waitForFunction(
    ({ containerId, expectedState }) => {
      const container = document.getElementById(containerId);
      if (!container) return false;
      
      // Check for widget state indicators
      switch (expectedState) {
        case 'loading':
          return container.querySelector('.widget-loading, .survai-widget-loading');
        case 'ready':
          return container.querySelector('.widget-container:not(.loading), .survai-widget:not(.loading)');
        case 'error':
          return container.querySelector('.widget-error, .error');
        default:
          return false;
      }
    },
    { containerId, expectedState },
    { timeout: 10000 }
  );
}

/**
 * Get widget container element for screenshot
 */
export function getWidgetContainer(page: Page, containerId: string) {
  return page.locator(`#${containerId}`);
}

/**
 * Mount multiple widgets with different themes for comparison
 */
export async function mountMultipleWidgets(page: Page, configurations: Array<{
  containerId: string;
  themeName: string;
  options?: Partial<WidgetConfig>;
}>): Promise<void> {
  // Create containers for all widgets
  for (const config of configurations) {
    await createWidgetContainer(page, config.containerId);
  }
  
  // Mount all widgets
  for (const config of configurations) {
    await mountWidgetWithTheme(page, config.containerId, config.themeName, config.options);
  }
  
  // Wait for all widgets to be ready
  for (const config of configurations) {
    await waitForWidgetState(page, config.containerId, 'ready');
  }
}

/**
 * Test widget error handling
 */
export async function testWidgetErrorHandling(page: Page, containerId: string, errorType: 'invalid-survey' | 'network-error' | 'invalid-container'): Promise<void> {
  await prepareWidgetForVisualTesting(page);
  
  const errorConfigs = {
    'invalid-survey': {
      surveyId: 'invalid-survey-id-does-not-exist',
      apiUrl: 'http://localhost:3001'
    },
    'network-error': {
      surveyId: 'test-survey-1',
      apiUrl: 'http://invalid-url-that-does-not-exist:9999'
    },
    'invalid-container': {
      surveyId: 'test-survey-1',
      apiUrl: 'http://localhost:3001'
    }
  };
  
  const config = errorConfigs[errorType];
  const targetContainerId = errorType === 'invalid-container' ? 'non-existent-container' : containerId;
  
  await page.evaluate(
    ({ containerId, config }) => {
      const container = document.getElementById(containerId);
      
      try {
        window.SurvAIWidget.mount(container, {
          surveyId: config.surveyId,
          apiUrl: config.apiUrl,
          onError: (error: Error) => {
            console.log('Expected error:', error.message);
          }
        });
      } catch (error) {
        console.log('Caught expected error:', error.message);
      }
    },
    { containerId: targetContainerId, config }
  );
  
  // Wait for error state to be displayed
  await page.waitForTimeout(2000);
}