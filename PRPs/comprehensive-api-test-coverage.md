# PRP: M5_PHASE_02 - Comprehensive API Test Coverage

**Feature**: Achieve **≥90% line & branch coverage** for all backend API routes using Jest + Supertest

**Priority**: High  
**Complexity**: Medium-High  
**Estimated Effort**: 8-12 hours  

## 🎯 Goal

Transform the SurvAI backend from 51% line coverage to ≥90% line and branch coverage through comprehensive Jest + Supertest test implementation. Create a robust test suite that validates all API routes, services, and middleware with success, edge, and failure scenarios.

## 📋 Why

- **Production Readiness**: Ensure all API endpoints are thoroughly tested before deployment
- **Regression Prevention**: Catch breaking changes early through comprehensive test coverage
- **Code Quality**: Identify untested code paths and potential bugs
- **CI/CD Confidence**: Enable automated deployment with high confidence in system stability
- **Documentation**: Tests serve as living documentation of API behavior

## 🔧 What

### **User-Visible Behavior**
- All API endpoints return consistent, well-tested responses
- Error conditions are handled gracefully with appropriate HTTP status codes
- Authentication and authorization work reliably across all protected routes
- Rate limiting and validation behave predictably under load

### **Technical Requirements**
- Jest + Supertest test coverage ≥90% for lines and branches
- Complete test coverage for all 8 controllers, 8 services, and 6 middleware
- Comprehensive error path testing (400, 401, 403, 404, 409, 429, 500)
- Database isolation with proper setup/teardown
- Authentication testing with JWT tokens
- Fast test execution (<60 seconds total)

### **Success Criteria**
- [ ] Coverage report shows ≥90% lines and branches
- [ ] All critical error paths tested (400, 401, 403, 404, 409, 429, 500)
- [ ] Tests run in <60s via parallel workers
- [ ] CI fails if coverage drops below threshold
- [ ] All existing tests continue to pass
- [ ] New test helpers for database seeding and auth tokens

## 📚 All Needed Context

### **Documentation & References**
```yaml
# Essential Reading
- url: https://jestjs.io/docs/configuration
  why: Coverage configuration and thresholds
  
- url: https://github.com/ladjs/supertest
  why: HTTP assertion patterns and best practices
  
- url: https://medium.com/@giladhoshmand/how-to-reach-100-unit-test-coverage-with-node-js-express-jest-d8909080f9dd
  why: Comprehensive coverage strategies for Express APIs
  
- url: https://www.velotio.com/engineering-blog/scalable-api-testing-framework-with-jest-and-supertest
  why: Scalable testing framework patterns
  
# Critical Codebase Files
- file: tests/backend/controllers/offerController.test.ts
  why: Excellent example of happy-edge-fail test structure with Supertest
  
- file: tests/backend/authController.test.ts
  why: Authentication testing patterns and JWT token usage
  
- file: jest.config.js
  why: Current Jest configuration and coverage setup
  
- file: backend/src/app.ts
  why: All route registrations and middleware setup
  
# Feature Documentation
- doc: /home/ado/SurvAI.3.0/M5_PHASE_02.md
  why: Complete feature requirements and success criteria
  
- doc: /home/ado/SurvAI.3.0/FINAL_REVIEW_PLANNING.md
  why: Milestone context and quality gates
  
- doc: /home/ado/SurvAI.3.0/CLAUDE.md
  why: Testing patterns and file size constraints
```

### **Current Codebase Structure**
```bash
backend/src/
├── controllers/          # 8 controllers need comprehensive testing
│   ├── authController.ts           # ✅ Has tests
│   ├── dashboardController.ts      # ✅ Has tests  
│   ├── offerController.ts          # ✅ Has tests
│   ├── questionController.ts       # ✅ Has tests
│   ├── sessionController.ts        # ✅ Has tests
│   ├── surveyController.ts         # ✅ Has tests
│   ├── trackingController.ts       # ⚠️ Limited coverage
│   └── widgetAnalyticsController.ts # ⚠️ Limited coverage
├── services/             # 8 services need comprehensive testing
│   ├── authService.ts              # ✅ Has tests
│   ├── dashboardService.ts         # ✅ Has tests
│   ├── epcService.ts               # ✅ Has tests
│   ├── offerService.ts             # ✅ Has tests
│   ├── questionService.ts          # ✅ Has tests
│   ├── trackingService.ts          # ✅ Has tests
│   ├── widgetAnalyticsService.ts   # ✅ Has tests
│   └── aiService.ts                # ✅ Has tests
├── middleware/           # 6 middleware need comprehensive testing
│   ├── auth.ts                     # ❌ Missing tests
│   ├── errorHandler.ts             # ❌ Missing tests
│   ├── notFoundHandler.ts          # ❌ Missing tests
│   ├── requestLogger.ts            # ❌ Missing tests
│   ├── trackingValidation.ts       # ⚠️ Limited coverage
│   └── widgetAnalyticsValidation.ts # ⚠️ Limited coverage
├── routes/               # 7 route files need integration testing
│   ├── auth.ts, dashboard.ts, offers.ts, questions.ts
│   ├── sessions.ts, tracking.ts, widgetAnalytics.ts
└── utils/validators/     # Poor coverage in validators
```

### **Target Structure with New Files**
```bash
tests/
├── backend/
│   ├── helpers/                    # 🆕 New helper directory
│   │   ├── dbSeed.ts              # 🆕 Database seeding utilities
│   │   ├── getTestToken.ts        # 🆕 JWT token generation
│   │   └── testUtils.ts           # 🆕 Common test utilities
│   ├── controllers/               # Enhanced coverage
│   │   ├── [all existing].test.ts # Enhanced with more scenarios
│   │   └── healthCheck.test.ts    # 🆕 Health endpoint testing
│   ├── services/                  # Enhanced coverage
│   │   └── [all existing].test.ts # Enhanced with edge cases
│   ├── middleware/                # 🆕 New middleware tests
│   │   ├── auth.test.ts           # 🆕 Authentication middleware
│   │   ├── errorHandler.test.ts   # 🆕 Error handling middleware
│   │   ├── notFoundHandler.test.ts # 🆕 404 handler
│   │   └── requestLogger.test.ts  # 🆕 Request logging
│   ├── routes/                    # 🆕 Integration tests
│   │   ├── auth.integration.test.ts
│   │   ├── dashboard.integration.test.ts
│   │   └── [others].integration.test.ts
│   └── utils/                     # Enhanced coverage
│       ├── validators.test.ts     # 🆕 Comprehensive validation tests
│       └── [existing].test.ts     # Enhanced coverage
```

### **Known Gotchas & Library Quirks**
```typescript
// CRITICAL: Prisma requires proper cleanup in tests
// Always use transactions that can be rolled back
await prisma.$transaction(async (tx) => {
  // Test operations here
  throw new Error('Rollback transaction'); // This ensures cleanup
});

// CRITICAL: JWT_SECRET must be set in test environment
process.env.JWT_SECRET = 'test-secret-key-for-testing';

// CRITICAL: Supertest requires not listening on port
// Export app without .listen() for testing
export default app; // NOT app.listen(port)

// CRITICAL: Rate limiting can interfere with tests
// Disable or use higher limits in test environment
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 100 // Higher for tests
});

// CRITICAL: Database isolation is essential
// Use beforeEach/afterEach for clean test state
afterEach(async () => {
  await prisma.user.deleteMany();
  await prisma.offer.deleteMany();
  // Clean all test data
});
```

## 🛠️ Implementation Blueprint

### **Test Infrastructure Setup**
```typescript
// tests/backend/helpers/dbSeed.ts
export const createTestUser = async (role: UserRole = 'ADMIN') => {
  return await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role,
      isActive: true,
    },
  });
};

export const createTestOffer = async (userId: string) => {
  return await prisma.offer.create({
    data: {
      title: 'Test Offer',
      description: 'Test Description',
      destinationUrl: 'https://example.com',
      category: 'FINANCE',
      status: 'ACTIVE',
      createdBy: userId,
      // ... other required fields
    },
  });
};

// tests/backend/helpers/getTestToken.ts
export const getTestToken = async (user: User): Promise<string> => {
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
  return token;
};
```

### **Tasks in Implementation Order**

```yaml
Task 1: Create Test Infrastructure (30 minutes)
CREATE tests/backend/helpers/dbSeed.ts:
  - PATTERN: Mirror existing prisma operations from offerController.test.ts
  - IMPLEMENT: createTestUser, createTestOffer, createTestSurvey functions
  - INCLUDE: cleanup utilities and database transaction helpers

CREATE tests/backend/helpers/getTestToken.ts:
  - PATTERN: Follow JWT patterns from authController.test.ts
  - IMPLEMENT: getTestToken function with role-based token generation
  - INCLUDE: token validation and expiration handling

Task 2: Enhance Existing Controller Tests (90 minutes)
MODIFY tests/backend/controllers/[all existing].test.ts:
  - ADD: Comprehensive error path testing (400, 401, 403, 404, 500)
  - ADD: Edge case scenarios (empty payloads, malformed data)
  - ADD: Rate limiting tests (429 responses)
  - ENSURE: Each test covers success, edge, and failure paths

Task 3: Create Missing Middleware Tests (60 minutes)
CREATE tests/backend/middleware/auth.test.ts:
  - TEST: Valid token authentication
  - TEST: Invalid token rejection (401)
  - TEST: Missing token handling (401)
  - TEST: Role-based authorization (403)

CREATE tests/backend/middleware/errorHandler.test.ts:
  - TEST: Error formatting and status codes
  - TEST: Prisma error handling
  - TEST: Validation error responses
  - TEST: Generic error fallback

Task 4: Create Route Integration Tests (90 minutes)
CREATE tests/backend/routes/[each route].integration.test.ts:
  - PATTERN: Full request/response cycle testing
  - TEST: All HTTP methods (GET, POST, PUT, DELETE, PATCH)
  - TEST: Authentication middleware integration
  - TEST: Validation middleware integration
  - INCLUDE: End-to-end user journey tests

Task 5: Enhance Service Tests (60 minutes)
MODIFY tests/backend/services/[all existing].test.ts:
  - ADD: Database operation edge cases
  - ADD: External API failure scenarios
  - ADD: Concurrent operation handling
  - ADD: Performance boundary testing

Task 6: Create Validator Tests (45 minutes)
CREATE tests/backend/utils/validators.test.ts:
  - TEST: All Joi validation schemas
  - TEST: Edge cases and boundary conditions
  - TEST: Custom validation logic
  - TEST: Error message formatting

Task 7: Update Coverage Configuration (15 minutes)
MODIFY jest.config.js:
  - UPDATE: coverageThreshold to 90% for lines and branches
  - ADD: Detailed coverage reporting
  - CONFIGURE: Parallel test execution optimization

Task 8: Create CI Coverage Script (15 minutes)
MODIFY package.json:
  - ADD: "test:coverage" script with threshold enforcement
  - ADD: Coverage reporting to CI/CD pipeline
  - ENSURE: Tests fail if coverage drops below 90%
```

### **Test Pattern Examples**

```typescript
// Pattern: Controller Test Structure
describe('ControllerName', () => {
  let testUser: User;
  let authToken: string;
  
  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = await getTestToken(testUser);
  });
  
  afterEach(async () => {
    await cleanupTestData();
  });
  
  describe('GET /endpoint', () => {
    it('should return success with valid data', async () => {
      // Happy path test
    });
    
    it('should return 401 without authentication', async () => {
      // Auth error test
    });
    
    it('should return 404 for non-existent resource', async () => {
      // Not found test
    });
    
    it('should handle edge case gracefully', async () => {
      // Edge case test
    });
  });
});

// Pattern: Service Test Structure
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should process valid input successfully', async () => {
      // Success scenario
    });
    
    it('should throw error for invalid input', async () => {
      // Error scenario
    });
    
    it('should handle database errors gracefully', async () => {
      // Database error simulation
    });
  });
});
```

## 🧪 Validation Loop

### **Level 1: Syntax & Style**
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                         # ESLint validation
npm run type-check                   # TypeScript validation

# Expected: No errors. If errors exist, fix them before continuing.
```

### **Level 2: Unit Tests**
```bash
# Run backend tests with coverage
npm run test -- --coverage --testPathPattern=backend

# Verify coverage meets threshold
npm run test -- --coverage --testPathPattern=backend --coverageThreshold='{"global":{"branches":90,"lines":90}}'

# Expected: All tests pass, coverage ≥90%
```

### **Level 3: Integration Tests**
```bash
# Run full test suite
npm run test:all

# Run specific integration tests
npm run test -- --testPathPattern=integration

# Expected: All integration tests pass with proper HTTP responses
```

### **Level 4: Coverage Validation**
```bash
# Generate detailed coverage report
npm run test:coverage

# Verify HTML coverage report
open coverage/backend/index.html

# Expected: All files show ≥90% coverage, no red areas in critical paths
```

## ✅ Final Validation Checklist

- [ ] All tests pass: `npm run test`
- [ ] Coverage ≥90%: `npm run test:coverage`
- [ ] No lint errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] All HTTP status codes tested (200, 400, 401, 403, 404, 409, 429, 500)
- [ ] Database operations isolated and cleaned up
- [ ] Authentication scenarios covered
- [ ] Error handling comprehensive
- [ ] Edge cases documented and tested
- [ ] CI/CD pipeline updated with coverage gates
- [ ] Test execution under 60 seconds
- [ ] Helper utilities created and documented

## 📈 Success Metrics

**Coverage Targets**:
- Lines: ≥90%
- Branches: ≥90%
- Functions: ≥85%
- Statements: ≥90%

**Test Quality**:
- All critical error paths tested
- Authentication/authorization coverage
- Database operation validation
- External API failure simulation
- Performance boundary testing

**Performance**:
- Test suite completes in <60 seconds
- Parallel test execution optimized
- Database operations isolated
- Memory usage optimized

## 🚫 Anti-Patterns to Avoid

- ❌ Don't mock away actual business logic - test real code paths
- ❌ Don't skip database cleanup - leads to test pollution
- ❌ Don't use fixed timestamps - causes flaky tests
- ❌ Don't test implementation details - focus on behavior
- ❌ Don't skip authentication testing - critical for security
- ❌ Don't ignore error scenarios - they're often the most important
- ❌ Don't copy-paste tests - use helper functions for common patterns
- ❌ Don't test everything in one giant test - keep focused and atomic

---

**Confidence Level**: 8/10

This PRP provides comprehensive context, clear implementation steps, and thorough validation. The existing codebase has good patterns to follow, and the Jest/Supertest combination is well-documented. Success depends on systematic execution and attention to coverage gaps.