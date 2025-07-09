# 🧪 Testing Strategy - SurvAI

## Overview

SurvAI implements a comprehensive testing strategy that ensures code quality, reliability, and visual consistency across all components. The testing approach combines unit testing, integration testing, and visual regression testing to provide complete coverage.

## 🎯 Testing Philosophy

### Core Principles

- **Test-Driven Development**: Write tests before implementation
- **Comprehensive Coverage**: Unit, integration, and visual testing
- **Deterministic Results**: Consistent, repeatable test outcomes
- **Fast Feedback**: Quick execution for development workflow
- **CI/CD Integration**: Automated testing in deployment pipeline

### Testing Pyramid

```
    🔺 Visual Tests (E2E UI)
   🔺🔺 Integration Tests  
  🔺🔺🔺 Unit Tests (Base)
```

---

## 📊 Test Types & Coverage

### 1. Unit Tests (Jest)

**Coverage**: Individual functions, components, and services

**Frameworks**: Jest, React Testing Library

**Current Status**: ✅ **26/26 tests passing**

#### Backend Unit Tests (`tests/backend/`)
- **Controllers**: API endpoint logic
- **Services**: Business logic (AI, EPC, tracking)
- **Utilities**: Helper functions and calculations
- **Validation**: Input validation and error handling

#### Frontend Unit Tests (`tests/frontend/`)
- **Components**: React component rendering and behavior
- **Hooks**: Custom React hooks functionality
- **Services**: API client and utility functions

#### Shared Unit Tests (`tests/shared/`)
- **Type Definitions**: TypeScript type validation
- **Shared Utilities**: Cross-package utility functions

### 2. Integration Tests

**Coverage**: API endpoints, database interactions, service integrations

**Current Status**: ✅ **Working** (included in backend tests)

#### Key Integration Tests
- **Authentication Flow**: Login, logout, session management
- **Tracking System**: Click tracking, conversion pixels, EPC updates
- **Dashboard API**: Metrics aggregation, real-time updates
- **Question Management**: AI-powered question generation and ordering

### 3. Visual Regression Tests (Playwright)

**Coverage**: UI consistency, responsive design, visual changes

**Current Status**: ✅ **Working** (basic implementation)

#### Visual Test Categories
- **Page Screenshots**: Homepage, login, admin, error pages
- **Component Testing**: Individual UI component validation
- **Responsive Design**: Mobile, tablet, desktop viewports
- **Interactive States**: Button hover, form states, animations
- **Theme Testing**: Light/dark mode consistency

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Setup test database
npm run db:migrate

# Create test admin user
npm run create-test-user
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:backend      # Backend unit & integration tests
npm run test:frontend     # Frontend React component tests
npm run test:shared       # Shared package tests
npm run test:visual       # Visual regression tests

# Watch mode for development
npm run test:watch

# Coverage reports
npm run test:coverage
```

---

## 📁 Test Structure

```
tests/
├── backend/                     # Backend tests (12 files)
│   ├── controllers/            # API controller tests
│   ├── services/               # Business logic tests
│   ├── setup.ts                # Test environment setup
│   └── *.test.ts               # Individual test files
├── frontend/                   # Frontend tests (5 files)
│   ├── components/             # React component tests
│   ├── hooks/                  # Custom hook tests
│   ├── setup.ts                # Frontend test setup
│   └── *.test.tsx              # Component test files
├── shared/                     # Shared package tests (2 files)
│   ├── setup.ts                # Shared test setup
│   └── *.test.ts               # Type and utility tests
├── visual/                     # Visual regression tests
│   ├── auth-helpers.ts         # Authentication utilities
│   ├── visual-setup.ts         # Environment setup
│   ├── simple-visual.spec.ts   # Basic visual tests ✅
│   ├── showcase.spec.ts        # Visual testing showcase ✅
│   └── visual.spec.ts          # Comprehensive suite ⚠️
├── global-setup.ts             # Global test configuration
└── global-teardown.ts          # Global test cleanup
```

---

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/tests/backend/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/backend/setup.ts']
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/tests/frontend/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.ts']
    },
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/tests/shared/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/shared/setup.ts']
    }
  ],
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts'
};
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests/visual',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 } // 0.1% threshold
  },
  use: {
    viewport: { width: 1366, height: 768 },
    baseURL: 'http://localhost:3000'
  },
  reporter: [
    ['html', { embedAttachments: true }],
    ['line']
  ]
});
```

---

## 📈 Test Metrics & Status

### Current Test Results

| Test Suite | Status | Coverage | Tests |
|------------|--------|----------|-------|
| **Backend** | ✅ Passing | 12/12 | Unit + Integration |
| **Frontend** | ⚠️ Partial | 5/5 | Component tests |
| **Shared** | ✅ Passing | 2/2 | Type validation |
| **Visual** | ✅ Working | 20+ | UI regression |

### Test Coverage Goals

- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: All API endpoints
- **Visual Tests**: Critical user journeys
- **E2E Tests**: Complete user workflows

---

## 🛠️ Development Workflow

### 1. Test-First Development

```bash
# Create test first
touch tests/backend/services/newService.test.ts

# Implement test cases
# - 1 success case
# - 1 edge case  
# - 1 failure case

# Implement functionality
# Run tests to verify
npm run test:backend
```

### 2. Continuous Testing

```bash
# Watch mode during development
npm run test:watch

# Run specific test file
npm run test -- tests/backend/services/epcService.test.ts

# Debug failed tests
npm run test -- --verbose
```

### 3. Pre-Commit Validation

```bash
# Full test suite before commit
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Visual regression check
npm run test:visual
```

---

## 🔍 Test Examples

### Unit Test Example

```typescript
// tests/backend/services/epcService.test.ts
describe('EPC Service', () => {
  it('should calculate EPC correctly', async () => {
    const mockData = { totalRevenue: 100, totalClicks: 50 };
    const result = await epcService.calculateEPC('offer-123');
    
    expect(result.epc).toBe(2.0);
    expect(result.offerId).toBe('offer-123');
  });
  
  it('should handle zero clicks gracefully', async () => {
    const result = await epcService.calculateEPC('offer-zero');
    expect(result.epc).toBe(0.0);
  });
});
```

### Integration Test Example

```typescript
// tests/backend/trackingController.integration.test.ts
describe('Tracking Controller Integration', () => {
  it('should track click and update EPC', async () => {
    const response = await request(app)
      .post('/api/track/click')
      .send({ sessionId: 'test-session', offerId: 'offer-123' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    
    // Verify EPC updated
    const epc = await epcService.getOfferEPC('offer-123');
    expect(epc).toBeGreaterThan(0);
  });
});
```

### Visual Test Example

```typescript
// tests/visual/simple-visual.spec.ts
describe('Visual Regression Testing', () => {
  test('should capture homepage consistently', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 0.1% pixel difference threshold
    await expect(page).toHaveScreenshot('homepage.png');
  });
});
```

---

## 🚨 Troubleshooting

### Common Issues

#### Tests Failing After Database Changes

```bash
# Regenerate Prisma client
npx prisma generate

# Reset test database
npm run db:migrate

# Recreate test user
npm run create-test-user
```

#### Frontend Tests Import Issues

```bash
# Check TypeScript configuration
npm run type-check

# Verify shared package build
npm run build:shared
```

#### Visual Tests Inconsistent

```bash
# Update baselines after legitimate changes
npm run test:visual:update

# Check for dynamic content
npm run test:visual -- --headed

# View diff report
npx playwright show-report
```

### Debug Commands

```bash
# Run single test with verbose output
npm run test -- --testNamePattern="EPC calculation" --verbose

# Jest with debugging
npm run test -- --detectOpenHandles --forceExit

# Visual tests with browser visible
npm run test:visual -- --headed

# Playwright debug mode
npm run test:visual -- --debug
```

---

## 📋 Test Guidelines

### Best Practices

#### 1. Test Structure (AAA Pattern)
```typescript
describe('Service Name', () => {
  test('should do something when condition', async () => {
    // Arrange
    const mockData = { ... };
    
    // Act
    const result = await service.method(mockData);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

#### 2. Test Naming Convention
- **Descriptive**: `should calculate EPC correctly with valid data`
- **Behavior-focused**: `should return 0 when no clicks exist`
- **Clear conditions**: `should throw error when offer not found`

#### 3. Test Data Management
- Use deterministic test data
- Clean up after each test
- Isolate test environments
- Mock external dependencies

#### 4. Visual Test Guidelines
- Use consistent viewport sizes
- Mask dynamic content (timestamps, IDs)
- Test critical user journeys
- Update baselines only for intentional changes

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Run visual tests
        run: npm run test:visual
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-deployment Checks

1. **All unit tests pass**: `npm run test`
2. **Visual tests pass**: `npm run test:visual`
3. **Type checking**: `npm run type-check`
4. **Linting**: `npm run lint`
5. **Build succeeds**: `npm run build`

---

## 📚 Documentation

### Test Documentation

- **[Visual Testing Guide](./docs/VISUAL_TESTING.md)**: Comprehensive Playwright testing guide
- **[API Testing](./docs/API_TESTING.md)**: API endpoint testing strategies
- **[Component Testing](./docs/COMPONENT_TESTING.md)**: React component testing guide

### External Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Testing](https://playwright.dev/docs/test-intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🎯 Future Enhancements

### Planned Improvements

1. **E2E Test Suite**: Complete user workflow testing
2. **Performance Testing**: Load testing and benchmarking
3. **Accessibility Testing**: WCAG compliance validation
4. **Security Testing**: Vulnerability scanning
5. **Mobile Testing**: Device-specific testing
6. **API Contract Testing**: Schema validation

### Test Automation Goals

- **100% Unit Test Coverage**: All critical functions tested
- **Complete Visual Coverage**: All UI states captured
- **Automated Regression Detection**: Catch UI changes automatically
- **Performance Benchmarking**: Automated performance monitoring

---

## 📞 Support

### Getting Help

1. **Check this documentation** for common solutions
2. **Review test logs** for detailed error information
3. **Run tests in debug mode** for investigation
4. **Create detailed issues** with reproduction steps

### Quick Reference

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Visual tests
npm run test:visual

# Coverage report
npm run test:coverage

# Debug specific test
npm run test -- --testNamePattern="test name"
```

---

**Testing ensures SurvAI delivers reliable, consistent, and high-quality user experiences.**