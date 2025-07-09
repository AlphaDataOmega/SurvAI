name: "M5_PHASE_03 - Comprehensive Visual Tests Suite"
description: |
  Complete Playwright visual-snapshot suite covering all major UI states with tight diff checking, 
  deterministic seed data, and CI/CD integration for robust visual regression testing.

## Goal
Build a comprehensive Playwright visual-snapshot suite that covers every major UI state of the SurvAI application including Admin Dashboard (metrics + chat panel states), Offer Management (list + modal), Survey flow (CTA question, subsequent questions, thank-you), and Embeddable Widget (inline on test pages). All snapshots must be diff-checked against baselines in CI with 0.1% pixel tolerance and <90s execution time.

## Why
- **Regression Prevention**: Catch unintended UI changes before they reach production
- **Visual Consistency**: Ensure consistent branding and layout across all user interfaces
- **CI/CD Quality Gates**: Automated visual validation prevents broken UI deployments
- **Cross-Browser Compatibility**: Validate UI rendering across different browsers and viewports
- **Developer Confidence**: Provide immediate feedback on UI changes during development

## What
A complete visual regression testing suite that captures baseline screenshots of all critical UI states and compares them against future runs with sub-pixel accuracy. The suite must handle dynamic content masking, deterministic data seeding, and graceful failure scenarios.

### Success Criteria
- [ ] Baseline PNGs exist for all target screens (≥8 captures minimum)
- [ ] CI fails when unintended pixel diff >0.1% is detected
- [ ] Visual test run completes in <90s in CI environment
- [ ] All tests use deterministic seed data for consistent results
- [ ] Documentation updated with baseline management workflow
- [ ] Coverage includes: Admin Dashboard, Offer Management, Survey Flow, Embeddable Widget
- [ ] Tests handle authentication, loading states, and error scenarios
- [ ] All necessary documentation reviewed and updated

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: tests/visual/visual.spec.ts
  why: Existing comprehensive test patterns and setup structure
  
- file: tests/visual/visual-setup.ts
  why: Environment setup utilities, CSS masking, and stabilization patterns
  
- file: docs/VISUAL_TESTING.md
  why: Complete guide to current visual testing infrastructure and best practices
  
- file: M5_PHASE_03.md
  why: Specific requirements for test coverage and success criteria
  
- file: tests/visual/auth-helpers.ts
  why: Authentication bypass patterns and deterministic data creation
  
- file: examples/widget-test.html
  why: Widget mounting patterns and configuration examples
  
- file: examples/widget-theme-test.html
  why: Theme variations and responsive testing patterns
  
- file: examples/widget-remote-config.html
  why: Remote configuration and error handling patterns
  
- url: https://playwright.dev/docs/test-snapshots
  why: Official Playwright visual testing documentation
  
- url: https://www.browserstack.com/guide/visual-regression-testing-using-playwright
  why: Best practices for visual regression testing with Playwright
  
- url: https://testgrid.io/blog/playwright-visual-regression-testing/
  why: Advanced techniques for screenshot comparison and threshold management
```

### Current Codebase Tree (Visual Testing Structure)
```bash
tests/visual/
├── auth-helpers.ts              # Authentication utilities (exists)
├── visual-setup.ts              # Environment and CSS setup (exists)
├── visual.spec.ts               # Main test suite (exists, needs enhancement)
├── simple-visual.spec.ts        # Basic working tests (exists)
├── showcase.spec.ts             # Demo tests (exists)
└── *-snapshots/                 # Baseline screenshots (exists)
    ├── simple-visual.spec.ts-snapshots/
    ├── showcase.spec.ts-snapshots/
    └── visual.spec.ts-snapshots/

examples/
├── widget-test.html             # Basic widget test page
├── widget-theme-test.html       # Theme variation examples
├── widget-remote-config.html    # Remote config examples
└── widget-offline-test.html     # Offline state examples

docs/
└── VISUAL_TESTING.md           # Comprehensive documentation (exists)

playwright.config.ts            # Playwright configuration (exists)
```

### Desired Codebase Tree with New Files
```bash
tests/visual/
├── auth-helpers.ts              # ENHANCE: Add more deterministic data functions
├── visual-setup.ts              # ENHANCE: Add widget-specific setup functions
├── visual.spec.ts               # ENHANCE: Complete all UI state coverage
├── simple-visual.spec.ts        # KEEP: Working baseline tests
├── showcase.spec.ts             # KEEP: Demo tests
├── admin-dashboard.spec.ts      # NEW: Dedicated admin dashboard tests
├── offer-management.spec.ts     # NEW: Dedicated offer management tests
├── survey-flow.spec.ts          # NEW: Dedicated survey flow tests
├── embeddable-widget.spec.ts    # NEW: Dedicated widget tests
└── *-snapshots/                 # EXPAND: All new baseline screenshots
    ├── admin-dashboard.spec.ts-snapshots/
    ├── offer-management.spec.ts-snapshots/
    ├── survey-flow.spec.ts-snapshots/
    └── embeddable-widget.spec.ts-snapshots/

tests/visual/helpers/
├── widget-helpers.ts            # NEW: Widget mounting and configuration utilities
├── dashboard-helpers.ts         # NEW: Dashboard state management utilities
├── survey-helpers.ts            # NEW: Survey flow navigation utilities
└── data-seeders.ts              # NEW: Deterministic data seeding utilities

docs/
└── VISUAL_TESTING.md           # UPDATE: Add new test suite documentation
```

### Known Gotchas of Our Codebase & Library Quirks
```typescript
// CRITICAL: Playwright requires specific browser context setup
// Example: Must use setupBrowserContext() for consistent rendering
// Example: CSS masking must be applied before screenshots

// CRITICAL: Widget tests require React dependencies to be loaded
// Example: Must load React 18 UMD before widget bundle
// Example: Widget mounting is async and requires proper awaiting

// CRITICAL: Authentication bypass required for visual tests
// Example: Use createDeterministicTestData() instead of real auth
// Example: Skip database-dependent flows with mock data

// CRITICAL: Dynamic content must be masked or stabilized
// Example: Timestamps, session IDs, loading states cause flakiness
// Example: Use Date.now() override and Math.random() seeding

// CRITICAL: Font loading affects visual consistency
// Example: Wait for font loading before screenshots
// Example: Use -webkit-font-smoothing: antialiased for consistency

// CRITICAL: CI environment differences require specific handling
// Example: Use headless mode with consistent viewport (1366x768)
// Example: Browser dependencies must be installed in CI
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// Core visual test configuration types
interface VisualTestConfig {
  surveyId: string;
  questionId: string;
  offerId: string;
  userId: string;
  theme?: WidgetTheme;
  partnerId?: string;
}

interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  buttonSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'spacious';
}

interface AdminDashboardState {
  metricsLoaded: boolean;
  chatPanelOpen: boolean;
  offerManagementOpen: boolean;
  timeRange: '24h' | '7d' | '30d';
}

interface SurveyFlowState {
  currentQuestion: number;
  totalQuestions: number;
  hasOffers: boolean;
  showThankYou: boolean;
}
```

### List of Tasks to be Completed in Order

```yaml
Task 1: Enhance Visual Test Infrastructure
MODIFY tests/visual/visual-setup.ts:
  - ADD widget-specific setup functions (prepareWidgetForVisualTesting)
  - ADD dashboard-specific state management (prepareDashboardState)
  - ADD survey flow navigation helpers (prepareSurveyFlowState)
  - ENHANCE CSS masking for new dynamic content patterns

CREATE tests/visual/helpers/widget-helpers.ts:
  - IMPLEMENT widget mounting utilities for all theme variations
  - ADD widget configuration builders for different states
  - INCLUDE error handling and timeout management

CREATE tests/visual/helpers/dashboard-helpers.ts:
  - IMPLEMENT dashboard state management utilities
  - ADD metric loading and chart stabilization functions
  - INCLUDE chat panel state management

CREATE tests/visual/helpers/survey-helpers.ts:
  - IMPLEMENT survey flow navigation utilities
  - ADD question progression and offer presentation helpers
  - INCLUDE thank-you page state management

CREATE tests/visual/helpers/data-seeders.ts:
  - IMPLEMENT deterministic data seeding for all test scenarios
  - ADD survey, question, and offer data generators
  - INCLUDE user session and analytics data seeders

Task 2: Create Admin Dashboard Visual Tests
CREATE tests/visual/admin-dashboard.spec.ts:
  - IMPLEMENT comprehensive dashboard state testing
  - ADD metrics chart rendering validation
  - INCLUDE chat panel collapsed/expanded states
  - ADD offer management table and modal tests
  - IMPLEMENT responsive design testing (desktop, tablet, mobile)

Task 3: Create Offer Management Visual Tests
CREATE tests/visual/offer-management.spec.ts:
  - IMPLEMENT offer list view with different states
  - ADD offer creation/edit modal tests
  - INCLUDE offer status toggle validations
  - ADD pagination and filtering visual tests
  - IMPLEMENT bulk operations UI testing

Task 4: Create Survey Flow Visual Tests
CREATE tests/visual/survey-flow.spec.ts:
  - IMPLEMENT initial CTA question rendering
  - ADD subsequent question progression tests
  - INCLUDE offer presentation and selection tests
  - ADD thank-you page variations
  - IMPLEMENT error state and loading state tests

Task 5: Create Embeddable Widget Visual Tests
CREATE tests/visual/embeddable-widget.spec.ts:
  - IMPLEMENT widget mounting on standalone test pages
  - ADD theme variation testing (all predefined themes)
  - INCLUDE responsive widget testing
  - ADD remote configuration visual validation
  - IMPLEMENT error state and offline mode testing

Task 6: Enhance Main Visual Test Suite
MODIFY tests/visual/visual.spec.ts:
  - INTEGRATE all new test patterns
  - ADD cross-browser compatibility tests
  - INCLUDE performance and consistency validation
  - ADD edge case and error scenario testing
  - IMPLEMENT comprehensive UI state coverage

Task 7: Update Documentation and CI Integration
MODIFY docs/VISUAL_TESTING.md:
  - ADD new test suite documentation
  - UPDATE baseline management workflow
  - INCLUDE troubleshooting guide for new tests
  - ADD CI/CD integration instructions

MODIFY playwright.config.ts:
  - OPTIMIZE for <90s execution time
  - ADD parallel test execution configuration
  - INCLUDE CI-specific browser setup
  - ADD artifact collection for failed tests

CREATE .github/workflows/visual-tests.yml:
  - IMPLEMENT CI/CD pipeline for visual tests
  - ADD baseline comparison and failure reporting
  - INCLUDE artifact upload for test results
  - ADD integration with existing test workflows
```

### Per Task Pseudocode

```typescript
// Task 1: Enhanced Visual Test Infrastructure
// CRITICAL: Follow existing patterns from visual-setup.ts
async function prepareWidgetForVisualTesting(page: Page, widgetConfig: WidgetConfig) {
  // PATTERN: Apply base visual testing setup first
  await preparePageForVisualTesting(page);
  
  // WIDGET-SPECIFIC: Load React dependencies
  await page.addScriptTag({ path: 'react.production.min.js' });
  await page.addScriptTag({ path: 'react-dom.production.min.js' });
  
  // CRITICAL: Wait for widget bundle to load
  await page.addScriptTag({ path: '../dist/widget/survai-widget.umd.js' });
  await page.waitForFunction(() => window.SurvAIWidget);
  
  // PATTERN: Apply widget-specific CSS masking
  await page.addStyleTag({
    content: `
      /* Hide widget loading states */
      .widget-loading, [data-widget-loading] { display: none !important; }
      /* Stabilize widget animations */
      .widget-container * { animation: none !important; }
    `
  });
}

// Task 2: Admin Dashboard Visual Tests
// CRITICAL: Use deterministic data and authentication bypass
test('should capture admin dashboard with metrics loaded', async ({ page }) => {
  // PATTERN: Bypass auth using existing helpers
  await loginAsAdmin(page);
  
  // CRITICAL: Seed deterministic dashboard data
  await seedDashboardMetrics(testData.userId, {
    totalOffers: 5,
    activeOffers: 3,
    totalClicks: 1250,
    conversionRate: 0.034
  });
  
  await page.goto('/admin');
  
  // PATTERN: Wait for dashboard components to stabilize
  await prepareDashboardState(page, {
    metricsLoaded: true,
    chatPanelOpen: false,
    timeRange: '7d'
  });
  
  // CRITICAL: Wait for charts to finish rendering
  await page.waitForSelector('.chart-container:not(.loading)');
  await page.waitForTimeout(1000); // Allow chart animations to complete
  
  // PATTERN: Take screenshot with tight threshold
  await expect(page).toHaveScreenshot('admin-dashboard-metrics.png', {
    maxDiffPixelRatio: 0.001
  });
});

// Task 4: Survey Flow Visual Tests
// CRITICAL: Handle question progression and offer presentation
test('should capture survey CTA question with offers', async ({ page }) => {
  // PATTERN: Use deterministic survey data
  await page.goto(`/survey/${testData.surveyId}`);
  
  // CRITICAL: Wait for question and offers to load
  await prepareSurveyFlowState(page, {
    currentQuestion: 1,
    hasOffers: true,
    offersCount: 3
  });
  
  // PATTERN: Ensure offers are ordered deterministically
  await page.waitForSelector('.offer-button:nth-child(3)');
  await page.waitForTimeout(500); // Allow EPC ordering to stabilize
  
  // CRITICAL: Mask dynamic offer ordering indicators
  await hideDynamicElements(page, ['.offer-order', '.epc-indicator']);
  
  await expect(page).toHaveScreenshot('survey-cta-question.png');
});

// Task 5: Embeddable Widget Visual Tests
// CRITICAL: Test widget mounting and theme variations
test('should capture widget with corporate theme', async ({ page }) => {
  // PATTERN: Use widget test page
  await page.goto('/examples/widget-theme-test.html');
  
  // CRITICAL: Wait for page and widget dependencies
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => window.SurvAIWidget);
  
  // PATTERN: Mount widget with specific theme
  await page.evaluate(() => {
    const container = document.getElementById('widget-corporate');
    return window.SurvAIWidget.mount(container, {
      surveyId: 'test-survey-corporate',
      theme: {
        primaryColor: '#1e40af',
        buttonSize: 'large',
        spacing: 'normal'
      },
      partnerId: 'corporate-partner-456'
    });
  });
  
  // CRITICAL: Wait for widget to fully render
  await page.waitForSelector('#widget-corporate .widget-container:not(.loading)');
  
  // PATTERN: Take screenshot of widget container only
  const widgetContainer = page.locator('#widget-corporate');
  await expect(widgetContainer).toHaveScreenshot('widget-corporate-theme.png');
});
```

### Integration Points
```yaml
DATABASE:
  - seeding: "Use createDeterministicTestData() for consistent test data"
  - cleanup: "Use cleanupVisualTestData() after each test suite"
  
CONFIG:
  - playwright: "Update maxDiffPixelRatio: 0.001 for tight comparison"
  - ci: "Configure headless mode with consistent viewport 1366x768"
  
ROUTES:
  - examples: "Use existing widget test pages for embeddable testing"
  - admin: "Test authenticated admin routes with auth bypass"
  
AUTHENTICATION:
  - bypass: "Use loginAsAdmin() helper for dashboard tests"
  - mock: "Use deterministic user data instead of real sessions"
  
THEMES:
  - widget: "Test all predefined themes from widget-theme-test.html"
  - admin: "Test light/dark mode variations if applicable"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                     # ESLint checking
npm run type-check               # TypeScript validation
npx playwright install chromium # Ensure browser dependencies

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Individual Test Validation
```bash
# Test individual spec files first
npm run test:visual -- tests/visual/admin-dashboard.spec.ts
npm run test:visual -- tests/visual/offer-management.spec.ts
npm run test:visual -- tests/visual/survey-flow.spec.ts
npm run test:visual -- tests/visual/embeddable-widget.spec.ts

# Expected: Tests pass and generate baseline screenshots
# If failing: Check for dynamic content, timing issues, or authentication problems
```

### Level 3: Full Suite Integration Test
```bash
# Run complete visual test suite
npm run test:visual

# Expected: All tests pass within 90 seconds
# If timeout: Optimize test execution or increase parallel workers
# If pixel differences: Review actual vs expected screenshots in HTML report
```

### Level 4: CI Environment Validation
```bash
# Test in CI-like environment
npm run test:visual:ci

# Expected: Tests pass in headless mode with consistent results
# If flaky: Check for font loading, animation timing, or environment differences
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test:visual`
- [ ] Execution time <90s: Check test run duration
- [ ] Baseline screenshots generated: Verify *-snapshots/ directories
- [ ] HTML reports available: `npx playwright show-report`
- [ ] CI integration working: Test in GitHub Actions
- [ ] Documentation updated: docs/VISUAL_TESTING.md complete
- [ ] Pixel threshold appropriate: maxDiffPixelRatio: 0.001 working
- [ ] All UI states covered: ≥8 distinct screenshot captures
- [ ] Dynamic content masked: No flaky tests due to timestamps/IDs
- [ ] Authentication bypass working: Tests run without database dependency

## Anti-Patterns to Avoid
- ❌ Don't create pixel-perfect comparisons without masking dynamic content
- ❌ Don't skip authentication bypass - tests must work without real user sessions
- ❌ Don't ignore font loading - wait for fonts to prevent rendering differences
- ❌ Don't use real API calls - mock or seed deterministic data
- ❌ Don't create overly broad screenshots - focus on specific UI components
- ❌ Don't skip responsive testing - verify mobile/tablet viewports
- ❌ Don't commit test result artifacts - only commit baseline screenshots
- ❌ Don't update baselines without review - visual changes must be intentional

---

## Implementation Confidence Score: 8/10

**Strengths:**
- Existing robust visual testing infrastructure provides solid foundation
- Comprehensive documentation and examples already available
- Clear patterns established in current codebase
- Deterministic data seeding utilities already implemented
- Widget examples provide clear mounting and configuration patterns

**Challenges:**
- Database-dependent tests may require additional mocking
- Widget loading timing may need fine-tuning for consistency
- CI environment font rendering differences may need resolution
- Complex admin dashboard state management requires careful orchestration

**Risk Mitigation:**
- Start with simpler widget tests and build up to complex dashboard tests
- Use existing working patterns from simple-visual.spec.ts and showcase.spec.ts
- Implement comprehensive error handling and timeout management
- Focus on deterministic data seeding to prevent flakiness

This PRP provides sufficient context, clear implementation steps, and robust validation loops to achieve successful one-pass implementation of the comprehensive visual testing suite.