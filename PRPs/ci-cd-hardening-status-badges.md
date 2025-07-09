name: "CI/CD Hardening and Status Badges PRP v2"
description: |
  Comprehensive Project Requirements Plan for implementing CI/CD hardening with matrix testing,
  coverage gates, and status badges integration for the SurvAI monorepo.

## Goal
Create a comprehensive CI/CD pipeline (`.github/workflows/ci.yml`) with matrix testing across Node.js 18 & 20, implementing lint/type-check/unit/integration/visual testing gates with ≥90% coverage thresholds, and add CI and coverage status badges to README.md. Separate build and deploy jobs to ensure deployment only occurs on main branch merges or tags.

## Why
- **Business value**: Ensures code quality and prevents regressions from reaching production
- **Integration with existing features**: Builds upon existing Jest and Playwright testing infrastructure
- **Problems this solves**: 
  - Lack of comprehensive CI gates before deployment
  - No visual feedback on build/test status
  - Missing coverage enforcement in CI pipeline
  - No matrix testing across Node.js versions

## What
User-visible behavior and technical requirements:
- CI status badges in README.md showing build status and coverage percentage
- Automated testing across Node.js 18 and 20 in CI environment
- 90% coverage enforcement preventing merges of undertested code
- Separate build/deploy workflow ensuring only tested code reaches production

### Success Criteria
- [ ] CI workflow runs on all PRs and main branch pushes
- [ ] Matrix testing validates compatibility across Node.js 18 & 20
- [ ] All test gates (lint, type-check, unit, integration, visual) pass before deployment
- [ ] Coverage gate enforces ≥90% threshold
- [ ] Status badges display current build status and coverage percentage
- [ ] Deployment only occurs on main branch merges or tags
- [ ] Build artifacts are properly stored and accessible

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /home/ado/SurvAI.3.0/M5_PHASE_06.md
  why: Original feature requirements and specifications
  
- file: /home/ado/SurvAI.3.0/.github/workflows/widget-deploy.yml
  why: Existing workflow pattern for deployment jobs, git tagging, and artifact handling
  critical: Shows proper job separation and conditional deployment logic

- file: /home/ado/SurvAI.3.0/jest.config.js
  why: Monorepo Jest configuration with existing 90% coverage thresholds
  critical: Already has coverageThreshold configured globally

- file: /home/ado/SurvAI.3.0/playwright.config.ts
  why: Playwright configuration for visual testing with CI optimizations
  critical: Has CI-specific settings for retries and workers

- file: /home/ado/SurvAI.3.0/package.json
  why: Available npm scripts for CI commands (test:ci, test:coverage, test:visual:ci)
  critical: Shows existing test infrastructure and commands

- url: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs
  section: Matrix strategy and caching
  critical: Official patterns for Node.js CI with multiple versions

- url: https://github.com/codecov/codecov-action
  section: Usage with Jest coverage
  critical: Proper coverage reporting and badge generation
```

### Current Codebase tree
```bash
/home/ado/SurvAI.3.0/
├── .github/
│   └── workflows/
│       └── widget-deploy.yml          # Existing deployment workflow
├── backend/src/                       # Backend TypeScript code
├── frontend/src/                      # Frontend React TypeScript code  
├── shared/src/                        # Shared utilities and types
├── tests/
│   ├── backend/                       # Backend unit tests
│   ├── frontend/                      # Frontend unit tests
│   ├── shared/                        # Shared package tests
│   ├── visual/                        # Playwright visual tests
│   ├── global-setup.ts               # Jest global setup
│   └── global-teardown.ts            # Jest global teardown
├── jest.config.js                     # Monorepo Jest configuration
├── playwright.config.ts               # Playwright configuration
├── package.json                       # NPM scripts and dependencies
└── README.md                          # Documentation to update with badges
```

### Desired Codebase tree with files to be added
```bash
/home/ado/SurvAI.3.0/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # NEW: Main CI workflow with matrix testing
│       └── widget-deploy.yml          # EXISTING: Keep existing deployment workflow
└── README.md                          # MODIFY: Add CI and coverage status badges
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Monorepo structure requires specific Jest project configuration
// The jest.config.js already has projects array with backend/frontend/shared
// Coverage thresholds are already set to 90% globally

// CRITICAL: Playwright requires web server to be running
// playwright.config.ts has webServer configured for 'npm run dev'
// CI must handle frontend dev server startup

// CRITICAL: NPM scripts for CI are already defined
// package.json has test:ci, test:coverage, test:visual:ci commands
// Use these exact commands in the workflow

// CRITICAL: Path-based triggering for monorepo
// Changes to backend/ should trigger backend tests
// Changes to frontend/ should trigger frontend + visual tests
// Changes to shared/ should trigger all tests

// CRITICAL: Coverage reporting format
// Jest already configured with 'lcov' reporter for coverage uploads
// coverageDirectory is set to '<rootDir>/coverage'
```

## Implementation Blueprint

### Data models and structure
No new data models required. This is a CI/CD infrastructure enhancement using existing test configurations and GitHub Actions YAML structure.

### List of tasks to be completed in order

```yaml
Task 1:
CREATE .github/workflows/ci.yml:
  - MIRROR pattern from: .github/workflows/widget-deploy.yml (job structure, Node.js setup)
  - IMPLEMENT matrix strategy with node-version: [18, 20]
  - CONFIGURE path-based triggering for monorepo efficiency
  - ADD all test gates: lint, type-check, unit, integration, visual

Task 2:
CONFIGURE coverage reporting and gates:
  - INTEGRATE Codecov action for coverage upload
  - ENFORCE 90% coverage threshold (already in jest.config.js)
  - GENERATE coverage artifacts for badge generation
  - SET up proper coverage reporting format

Task 3:
MODIFY README.md:
  - ADD CI status badge pointing to new workflow
  - ADD coverage badge from Codecov
  - POSITION badges prominently at top of README
  - MAINTAIN existing documentation structure

Task 4:
UPDATE workflow dependencies:
  - SEPARATE build job from test jobs
  - CREATE deploy job that depends on all test jobs passing
  - ENSURE deployment only on main branch or tags
  - ADD artifact storage for test results and coverage

Task 5:
VALIDATE workflow configuration:
  - TEST matrix builds locally if possible
  - VERIFY path-based triggering works correctly
  - CONFIRM coverage thresholds are enforced
  - ENSURE badge URLs are accessible
```

### Per task pseudocode

```yaml
# Task 1: Create main CI workflow
name: CI

on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
  # PATH-based triggering for efficiency
  paths: ['backend/**', 'frontend/**', 'shared/**', 'tests/**']

jobs:
  lint-type:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      # PATTERN: Mirror widget-deploy.yml setup steps
      - checkout@v4
      - setup-node with cache
      - npm ci
      # CRITICAL: Use existing package.json scripts
      - npm run lint
      - npm run type-check

  test-unit-int:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - checkout + setup (same pattern)
      # CRITICAL: Generate coverage for upload
      - npm run test:coverage
      # PATTERN: Upload coverage artifacts
      - upload coverage to Codecov
      - store coverage artifacts

  test-visual:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - checkout + setup
      # CRITICAL: Playwright requires browser installation
      - install playwright browsers
      # PATTERN: Use existing CI-optimized script
      - npm run test:visual:ci
      - upload playwright artifacts on failure

  coverage-gate:
    needs: [test-unit-int]
    runs-on: ubuntu-latest
    steps:
      # PATTERN: Download coverage artifacts
      - download coverage from previous job
      # CRITICAL: Jest config already has 90% threshold
      - validate coverage meets 90% requirement
```

### Integration Points
```yaml
CODECOV:
  - integration: "Add CODECOV_TOKEN to repository secrets"
  - pattern: "Use codecov/codecov-action@v3 for uploading"
  
BADGES:
  - add to: README.md
  - pattern: "![CI](https://github.com/user/repo/workflows/CI/badge.svg)"
  - pattern: "![Coverage](https://codecov.io/gh/user/repo/branch/main/graph/badge.svg)"
  
ARTIFACTS:
  - store: "coverage/lcov.info for Codecov upload"
  - store: "playwright-report/ for visual test debugging"
  - store: "test-results/ for debugging failed tests"

WORKFLOW_DEPENDENCIES:
  - deploy job: "needs: [lint-type, test-unit-int, test-visual, coverage-gate]"
  - condition: "if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/')"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                    # Check code style
npm run type-check             # TypeScript validation
yamllint .github/workflows/ci.yml  # YAML syntax validation

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```bash
# Test existing commands work correctly
npm run test:ci               # Verify CI test command works
npm run test:coverage         # Verify coverage generation
npm run test:visual:ci        # Verify visual tests run in CI mode

# Validate Jest configuration
npm run test:coverage -- --collectCoverage
# Expected: Coverage report shows ≥90% for all metrics
```

### Level 3: Integration Test
```bash
# Test GitHub Actions workflow locally (if act is available)
act -j lint-type             # Test lint/type job
act -j test-unit-int          # Test unit/integration job
act -j test-visual            # Test visual testing job

# Manual workflow validation:
# 1. Create test PR to trigger workflow
# 2. Verify matrix builds run for both Node.js 18 and 20
# 3. Check that coverage is uploaded to Codecov
# 4. Validate badges display correctly in README

# Expected: All jobs pass, coverage uploaded, badges working
```

## Final validation Checklist
- [ ] All tests pass: `npm run test:ci`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Workflow syntax valid: `yamllint .github/workflows/ci.yml`
- [ ] Matrix strategy works for Node.js 18 & 20
- [ ] Coverage uploaded to Codecov successfully
- [ ] CI and coverage badges display in README.md
- [ ] Deploy job only runs on main/tags
- [ ] Path-based triggering works for monorepo efficiency
- [ ] All artifacts stored properly for debugging

---

## Anti-Patterns to Avoid
- ❌ Don't duplicate test configurations - use existing Jest/Playwright configs
- ❌ Don't hardcode Node.js versions - use matrix strategy for flexibility  
- ❌ Don't skip coverage enforcement - leverage existing 90% thresholds
- ❌ Don't run all tests for all changes - use path-based triggering
- ❌ Don't ignore existing npm scripts - use test:ci, test:coverage, test:visual:ci
- ❌ Don't create new test patterns - follow existing monorepo structure
- ❌ Don't deploy without test gates - ensure proper job dependencies