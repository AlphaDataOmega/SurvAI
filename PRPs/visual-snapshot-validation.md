name: "Visual Snapshot Validation Harness PRP"
description: |

## Goal
Implement a comprehensive Playwright-based visual regression testing system that automatically captures and compares UI snapshots across the authenticated admin area and public survey flow to catch visual regressions in CI/CD pipeline.

## Why
- **Quality Assurance**: Prevent visual regressions from reaching production by catching UI changes early in development cycle
- **Integration Safety**: Ensure UI consistency when multiple developers work on dashboard, chat interface, and survey components simultaneously  
- **CI/CD Integration**: Automate visual testing as part of PR validation to surface unintended UI changes before merge
- **Cross-browser Consistency**: Validate that admin interface and survey flow render consistently across browser environments

## What
A headless browser automation system that:
1. **Authenticates as admin** using existing test user credentials and JWT cookie system
2. **Captures dashboard states** including metrics charts, offer management interface, and chat panel in various states
3. **Tests survey flow** by navigating through CTA questions and capturing each screen state
4. **Compares snapshots** to stored baselines with 0.1% pixel diff tolerance, failing CI if threshold exceeded
5. **Manages baselines** with documented update workflow for legitimate UI changes

### Success Criteria
- [ ] `npm run test:visual` executes snapshot capture and comparison with deterministic results
- [ ] Admin dashboard, metrics charts, and chat panel states captured consistently across test runs
- [ ] Survey flow navigation and CTA question screenshots generated reliably
- [ ] Deliberate 5px UI shift triggers diff failure above 0.1% threshold
- [ ] Baseline update workflow documented and executable via `npm run test:visual:update`
- [ ] CI pipeline integration with visual tests running after unit/integration suites
- [ ] Visual test results include actual, expected, and diff images for failed comparisons
- [ ] All documentation updated in TESTING.md and VISUAL_TESTING.md

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://playwright.dev/docs/test-snapshots
  why: Core visual testing API and configuration patterns
  
- url: https://playwright.dev/docs/test-configuration  
  why: Browser configuration, viewport settings, and CI-specific options
  
- file: /home/ado/SurvAI.3.0/backend/src/scripts/createTestUser.ts
  why: Test admin user creation pattern - provides admin@example.com/admin123 credentials
  
- file: /home/ado/SurvAI.3.0/backend/src/controllers/authController.ts
  why: JWT authentication flow, cookie handling, and admin role validation patterns
  
- file: /home/ado/SurvAI.3.0/jest.config.js
  why: Existing monorepo test configuration pattern - follow for Playwright integration
  
- file: /home/ado/SurvAI.3.0/package.json
  why: Current script structure and monorepo workspace configuration
  
- file: /home/ado/SurvAI.3.0/tests/backend/dashboardController.integration.test.ts
  why: Authentication patterns in tests - JWT token generation and admin user setup
  
- file: /home/ado/SurvAI.3.0/PLANNING.md
  why: Project architecture, conventions, and component structure to test visually
```

### Current Codebase Tree
```bash
/home/ado/SurvAI.3.0/
├── package.json                    # Root monorepo config
├── jest.config.js                  # Existing test configuration
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminPage.tsx       # Admin dashboard to snapshot
│   │   │   ├── LoginPage.tsx       # Login flow for auth
│   │   │   └── SurveyPage.tsx      # Survey flow to test
│   │   └── components/
│   │       └── admin/
│   │           ├── Dashboard.tsx    # Main dashboard component
│   │           ├── OfferMetrics.tsx # Metrics charts to capture
│   │           └── chat/
│   │               └── ChatPanel.tsx # Chat interface states
├── backend/
│   ├── src/
│   │   ├── scripts/createTestUser.ts # Test admin: admin@example.com/admin123
│   │   ├── controllers/authController.ts # JWT auth flow
│   │   └── routes/auth.ts           # Login endpoints
└── tests/
    ├── backend/setup.ts             # Backend test patterns
    ├── frontend/setup.ts            # Frontend test patterns
    ├── global-setup.ts              # Global Jest setup
    └── global-teardown.ts           # Global Jest teardown
```

### Desired Codebase Tree (Files to Add)
```bash
/home/ado/SurvAI.3.0/
├── playwright.config.ts            # Playwright configuration with 1366x768 viewport
├── package.json                    # ADD: test:visual script and Playwright dependency
├── tests/
│   └── visual/
│       ├── auth-helpers.ts          # Admin authentication utilities
│       ├── visual.spec.ts           # Main visual test suite
│       ├── baselines/               # Auto-generated baseline screenshots
│       │   ├── admin-dashboard.png
│       │   ├── metrics-chart.png
│       │   ├── chat-panel-open.png
│       │   └── survey-cta-question.png
│       └── visual-setup.ts          # Visual test environment setup
└── docs/
    └── VISUAL_TESTING.md            # Visual testing documentation and workflows
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Authentication requires proper JWT cookie handling
// SurvAI uses HTTP-only cookies with 15-minute expiration
// Pattern: Login via API, cookies auto-attached to subsequent requests

// CRITICAL: Monorepo structure requires workspace-aware commands
// Use: npm run <script> --workspace=<package> for specific workspace commands
// Root package.json scripts coordinate across frontend/backend

// CRITICAL: Database state must be deterministic for consistent snapshots
// Use: Seeded test data with known values, avoid timestamps/random IDs
// Pattern: Clear and seed database before each visual test run

// CRITICAL: Playwright viewport must be consistent (1366x768 specified)
// Browser rendering varies by OS, version, and hardware settings
// Use: Exact viewport configuration in playwright.config.ts

// CRITICAL: Dynamic content must be masked/hidden
// Examples: Timestamps, session IDs, random offer ordering
// Use: CSS injection via stylePath or DOM manipulation before snapshot

// CRITICAL: Jest vs Playwright - different test runners
// Visual tests run via Playwright Test, not Jest
// Integration: Separate test command, different assertion API
```

## Implementation Blueprint

### Data Models and Structure
Database seeding for deterministic visual tests:
```typescript
// Seed consistent test data for visual snapshots
interface VisualTestData {
  testSurvey: {
    id: string;           // Known UUID for consistent routing
    title: string;        // "Visual Test Survey"  
    description: string;  // Static content
  };
  testQuestions: Array<{
    id: string;           // Known UUIDs
    question: string;     // Static question text
    buttonText: string;   // Static button copy
    order: number;        // Deterministic ordering
  }>;
  testOffers: Array<{
    id: string;           // Known UUIDs  
    title: string;        // Static offer names
    description: string;  // Static descriptions
    payout: number;       // Fixed payout amounts
    epc: number;          // Known EPC values for chart testing
  }>;
}
```

### List of Tasks (Implementation Order)

```yaml
Task 1: Install and Configure Playwright
MODIFY package.json:
  - ADD "@playwright/test": "^1.40.0" to devDependencies
  - ADD "test:visual": "playwright test" script
  - ADD "test:visual:update": "playwright test --update-snapshots" script
  - ADD "test:visual:ui": "playwright test --ui" script

CREATE playwright.config.ts:
  - SET viewport: { width: 1366, height: 768 } for consistent rendering
  - CONFIGURE projects for chromium browser (follow PLANNING.md browser strategy)
  - SET testDir: 'tests/visual'
  - SET outputDir: 'test-results/visual'
  - CONFIGURE screenshot options with 0.1% threshold (maxDiffPixelRatio: 0.001)
  - SET timeout: 30000 for slower visual operations
  - SET retries: 2 for CI environment stability

Task 2: Create Authentication Helpers
CREATE tests/visual/auth-helpers.ts:
  - IMPLEMENT loginAsAdmin() function using existing auth patterns
  - MIRROR pattern from: tests/backend/dashboardController.integration.test.ts
  - USE credentials: admin@example.com / admin123 from createTestUser.ts
  - HANDLE JWT cookie attachment for authenticated requests
  - ADD helper for creating deterministic test admin user
  - IMPLEMENT cookie persistence across page navigations

Task 3: Set Up Visual Test Environment
CREATE tests/visual/visual-setup.ts:
  - IMPLEMENT database seeding with deterministic test data
  - CONFIGURE CSS injection for masking dynamic content (timestamps, IDs)
  - SET up browser context with consistent configuration
  - IMPLEMENT cleanup helpers for test isolation
  - ADD environment variable validation (DATABASE_URL, JWT_SECRET)

Task 4: Implement Core Visual Test Suite
CREATE tests/visual/visual.spec.ts:
  - IMPLEMENT admin dashboard screenshot capture
  - CAPTURE metrics chart with known test data
  - TEST chat panel in multiple states (closed, open, with messages)
  - IMPLEMENT survey flow navigation and CTA question capture
  - ADD responsive testing for mobile/desktop viewports
  - FOLLOW existing test structure from tests/frontend/ patterns

Task 5: Add Baseline Management
CREATE tests/visual/baselines/ directory:
  - CONFIGURE automatic baseline generation on first run
  - IMPLEMENT baseline update workflow via --update-snapshots flag
  - ADD version control integration (.gitignore configuration)
  - DOCUMENT baseline management in VISUAL_TESTING.md

Task 6: CI/CD Integration
MODIFY package.json scripts:
  - UPDATE existing test script to include visual tests
  - ADD conditional visual testing (skip in CI if no display available)
  - INTEGRATE with existing lint/type-check/test workflow

CREATE docs/VISUAL_TESTING.md:
  - DOCUMENT visual test execution commands
  - EXPLAIN baseline update workflow
  - PROVIDE troubleshooting guide for failed comparisons
  - INCLUDE CI/CD integration instructions
```

### Task Implementation Details

#### Task 1: Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  outputDir: 'test-results/visual',
  timeout: 30 * 1000,
  expect: {
    // 0.1% pixel difference threshold as specified
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 }
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // CRITICAL: Consistent viewport as specified in M3_PHASE_09.md
    viewport: { width: 1366, height: 768 }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  // Ensure dev server is running
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

#### Task 2: Authentication Helper Pseudocode
```typescript
// tests/visual/auth-helpers.ts
// PATTERN: Mirror existing auth patterns from integration tests
export async function loginAsAdmin(page: Page): Promise<void> {
  // CRITICAL: Use existing test user from createTestUser.ts
  const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin123'
  };
  
  // PATTERN: API login for faster execution vs form automation
  const response = await page.request.post('/api/auth/login', {
    data: adminCredentials
  });
  
  // GOTCHA: JWT cookie automatically attached to page context
  expect(response.status()).toBe(200);
  
  // Validate authentication by checking admin dashboard access
  await page.goto('/admin');
  await page.waitForSelector('[data-testid="admin-dashboard"]');
}

export async function createDeterministicTestData(): Promise<void> {
  // PATTERN: Use Prisma client similar to existing test setup
  // Create consistent survey, questions, and offers for visual tests
  // CRITICAL: Use known UUIDs and static content for snapshot consistency
}
```

#### Task 4: Visual Test Implementation Pseudocode
```typescript
// tests/visual/visual.spec.ts
// PATTERN: Follow existing Jest describe/it structure from tests/frontend/
import { test, expect } from '@playwright/test';
import { loginAsAdmin, createDeterministicTestData } from './auth-helpers';

test.describe('Admin Dashboard Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // PATTERN: Setup similar to existing integration tests
    await createDeterministicTestData();
    await loginAsAdmin(page);
  });

  test('should capture admin dashboard correctly', async ({ page }) => {
    await page.goto('/admin');
    // CRITICAL: Wait for dynamic content to load (charts, metrics)
    await page.waitForSelector('[data-testid="metrics-chart"]');
    
    // GOTCHA: Mask dynamic timestamps and IDs before screenshot
    await page.addStyleTag({
      content: `
        .timestamp, .session-id { visibility: hidden !important; }
        .loading-spinner { display: none !important; }
      `
    });
    
    await expect(page).toHaveScreenshot('admin-dashboard.png');
  });

  test('should capture chat panel states', async ({ page }) => {
    await page.goto('/admin');
    
    // Test closed state
    await expect(page).toHaveScreenshot('chat-panel-closed.png');
    
    // Test open state with messages
    await page.click('[data-testid="chat-toggle"]');
    await page.waitForSelector('[data-testid="chat-panel"]');
    await expect(page).toHaveScreenshot('chat-panel-open.png');
  });
});

test.describe('Survey Flow Visual Regression', () => {
  test('should capture survey CTA question', async ({ page }) => {
    // CRITICAL: Use deterministic survey ID from test data
    await page.goto('/survey/test-survey-id');
    await page.waitForSelector('[data-testid="question-card"]');
    
    // GOTCHA: Ensure offer ordering is deterministic
    await page.waitForTimeout(1000); // Allow EPC calculations to complete
    
    await expect(page).toHaveScreenshot('survey-cta-question.png');
    
    // Test post-click state
    await page.click('[data-testid="offer-button"]');
    await page.waitForSelector('[data-testid="next-question"]');
    await expect(page).toHaveScreenshot('survey-post-click.png');
  });
});
```

### Integration Points
```yaml
SCRIPTS:
  - add to: package.json root
  - pattern: "test:visual": "playwright test"
  - pattern: "test:visual:update": "playwright test --update-snapshots"

CONFIG:
  - add to: playwright.config.ts
  - pattern: viewport { width: 1366, height: 768 }
  - pattern: maxDiffPixelRatio: 0.001 (0.1% threshold)

DATABASE:
  - seed deterministic test data before visual tests
  - use consistent UUIDs and static content
  - clear database between test runs for isolation

CI_PIPELINE:
  - integrate with existing npm scripts workflow
  - run visual tests after unit/integration tests
  - fail pipeline if visual differences exceed threshold
```

## Validation Loop

### Level 1: Installation & Setup
```bash
# Install Playwright and dependencies
npm install --save-dev @playwright/test

# Install browser binaries
npx playwright install chromium

# Verify Playwright configuration
npx playwright test --dry-run

# Expected: Configuration validates, test files discovered
```

### Level 2: Authentication & Test Data
```bash
# Create test admin user
npm run create-test-user

# Start development servers
npm run dev

# Verify authentication helper
npm run test:visual -- --grep "login"

# Expected: Admin authentication succeeds, dashboard accessible
```

### Level 3: Visual Test Execution
```bash
# Run visual tests (first run generates baselines)
npm run test:visual

# Expected: Baseline screenshots generated in tests/visual/baselines/
# Subsequent runs: All comparisons pass with 0 pixel differences

# Test failure detection with deliberate UI change
# Modify a component to shift 5px, re-run tests
npm run test:visual

# Expected: Tests fail with diff images showing 5px shift
```

### Level 4: CI Integration & Documentation
```bash
# Run full test suite including visual tests
npm run lint
npm run type-check  
npm run test
npm run test:visual

# Verify baseline update workflow
npm run test:visual:update

# Expected: New baselines committed to version control
```

## Final Validation Checklist
- [ ] All Playwright tests pass: `npm run test:visual`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Authentication works: Admin login successful in visual tests
- [ ] Deterministic snapshots: Multiple test runs produce identical results
- [ ] Failure detection: 5px UI shift triggers test failure
- [ ] Baseline management: Update workflow documented and functional
- [ ] CI integration: Visual tests run in proper sequence
- [ ] Documentation complete: VISUAL_TESTING.md created with workflows

---

## Anti-Patterns to Avoid
- ❌ Don't rely on random test data - use deterministic seeded content
- ❌ Don't ignore dynamic content - mask timestamps and IDs before screenshots  
- ❌ Don't use inconsistent viewport sizes - stick to 1366x768 specification
- ❌ Don't skip authentication setup - admin access required for dashboard tests
- ❌ Don't commit large baseline images to git without LFS consideration
- ❌ Don't run visual tests without proper database seeding
- ❌ Don't mix Jest and Playwright test patterns - use Playwright's assertion API
- ❌ Don't hardcode environment URLs - use playwright config baseURL

## Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation including:
✅ Complete authentication patterns with existing test user credentials  
✅ Detailed Playwright configuration following project conventions
✅ Integration with existing monorepo test structure
✅ Deterministic data seeding strategy for consistent snapshots
✅ Specific viewport and threshold requirements from M3_PHASE_09.md
✅ CI/CD integration following existing workflow patterns
✅ Comprehensive validation loops with executable commands
✅ Clear documentation requirements and baseline management

The implementation should succeed in one pass with this level of context and detailed task breakdown.