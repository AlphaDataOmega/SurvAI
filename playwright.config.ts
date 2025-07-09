/**
 * @fileoverview Playwright configuration for visual regression testing
 * 
 * Configures Playwright for SurvAI visual testing with:
 * - 1366x768 viewport for consistent rendering
 * - 0.1% pixel difference threshold for snapshot comparison
 * - CI/CD optimizations for stability
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  outputDir: 'test-results/visual',
  timeout: 30 * 1000,
  expect: {
    // 0.1% pixel difference threshold as specified in M3_PHASE_09.md
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 }
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { 
      open: 'never',
      outputFolder: 'playwright-report',
      embedAttachments: true 
    }],
    ['line']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // CRITICAL: Consistent viewport as specified in M3_PHASE_09.md
    viewport: { width: 1366, height: 768 }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  // Ensure dev server is running for visual tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});