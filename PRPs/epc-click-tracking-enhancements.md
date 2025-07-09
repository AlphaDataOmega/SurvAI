# M3 Phase 01 - EPC Click Tracking + Pixel Attribution Enhancement PRP

## Purpose
Enhance the existing click tracking and pixel attribution system to fully meet M3_PHASE_01 requirements with robust validation, idempotent pixel firing, and comprehensive testing for EPC-based offer optimization.

## Core Principles
1. **Context is King**: All necessary documentation, examples, and caveats included
2. **Validation Loops**: Executable tests/lints for iterative refinement
3. **Information Dense**: Keywords and patterns from the existing codebase
4. **Progressive Success**: Build on existing robust implementation
5. **Global rules**: Follow all rules in CLAUDE.md

---

## Goal
Enhance the existing comprehensive click tracking and pixel attribution system to ensure 100% compliance with M3_PHASE_01 requirements: robust input validation, idempotent pixel firing, session/offer validation, and pixel firing simulation capabilities.

## Why
- **Business value**: Ensures accurate EPC calculations for offer optimization and prevents revenue loss from double-conversions
- **Integration**: Builds upon existing robust TrackingService, TrackingController, and EPC calculator utilities
- **Problems solved**: Eliminates potential data integrity issues, adds missing validation layers, and provides testing simulation tools

## What
Enhanced backend tracking system with:
- **Idempotent pixel firing** to prevent double-conversions
- **Comprehensive input validation** using Joi schemas for all tracking endpoints
- **Robust session + offer validation** before click tracking
- **Pixel firing simulation** for manual testing
- **Enhanced error handling** with detailed logging
- **Comprehensive test coverage** for all enhancement features

### Success Criteria
- [ ] All conversions are idempotent (no double-conversion possible)
- [ ] Input validation implemented for all tracking endpoints using Joi
- [ ] Session and offer validation occurs before every click track
- [ ] Pixel firing simulation tools available for manual testing
- [ ] All new enhancements covered by unit and integration tests
- [ ] EPC calculations remain accurate with enhanced validation
- [ ] Response times under 200ms maintained for all tracking endpoints

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Core architecture and patterns
- file: /home/ado/SurvAI.3.0/PLANNING.md
  why: Architecture overview, tech stack, development rules, and performance strategy
  critical: Atomic tracking operations, precision EPC calculations, React 18 concurrent rendering

- file: /home/ado/SurvAI.3.0/CLAUDE.md
  why: Code structure, testing requirements, style conventions, and AI behavior rules
  critical: Never exceed 500 lines per file, create unit tests, update documentation

- file: /home/ado/SurvAI.3.0/M3_PHASE_01.md
  why: Specific requirements for this phase including acceptance criteria
  critical: Click tracking MUST be atomic, pixel firing MUST be idempotent, session + offer validation required

# EXISTING IMPLEMENTATION PATTERNS
- file: /home/ado/SurvAI.3.0/backend/src/services/trackingService.ts
  why: Current implementation patterns, EPC calculation methods, URL generation
  critical: Follow existing patterns for TrackingService class, transaction handling, error management

- file: /home/ado/SurvAI.3.0/backend/src/controllers/trackingController.ts
  why: Existing controller patterns, API response formats, error handling
  critical: Follow existing controller structure, maintain API compatibility

- file: /home/ado/SurvAI.3.0/backend/src/utils/epcCalculator.ts
  why: EPC calculation patterns, validation, and performance optimization
  critical: Follow existing EPC calculation patterns, maintain mathematical accuracy

- file: /home/ado/SurvAI.3.0/backend/src/utils/validateEnv.ts
  why: Joi validation patterns already in use in the codebase
  critical: Follow existing Joi schema patterns for input validation

# TESTING PATTERNS
- file: /home/ado/SurvAI.3.0/tests/backend/trackingService.test.ts
  why: Unit testing patterns, mock implementations, test structure
  critical: Follow existing test patterns, maintain test coverage standards

- file: /home/ado/SurvAI.3.0/tests/backend/trackingController.integration.test.ts
  why: Integration testing patterns, API testing, database interactions
  critical: Follow existing integration test patterns, maintain performance requirements

# SHARED TYPES AND INTERFACES
- file: /home/ado/SurvAI.3.0/shared/src/types/analytics.ts
  why: Type definitions for EPC metrics, analytics, and tracking data
  critical: Maintain type consistency across enhancements

- file: /home/ado/SurvAI.3.0/shared/src/types/api.ts
  why: API response formats, error handling types
  critical: Follow existing API response patterns

# PRISMA SCHEMA AND DATABASE
- file: /home/ado/SurvAI.3.0/backend/prisma/schema.prisma
  why: Database schema, relationships, and constraints
  critical: ClickTrack and ConversionTrack models already comprehensive

# EXTERNAL DOCUMENTATION
- url: https://joi.dev/api/
  why: Joi validation library documentation for implementing input validation
  critical: Use latest Joi syntax and best practices

- url: https://www.prisma.io/docs/concepts/components/prisma-client/transactions
  why: Prisma transaction patterns for atomic operations
  critical: Follow transaction best practices for idempotent operations

- url: https://trackier.com/blog/pixels-v-s-postbacks-which-tracking-method-is-better/
  why: Industry best practices for pixel tracking and postback implementation
  critical: Understand idempotent pixel firing patterns

- url: https://www.partnero.com/articles/what-is-affiliate-tracking-a-beginners-guide-to-getting-started-2024
  why: 2024 affiliate tracking best practices and validation patterns
  critical: Follow modern affiliate tracking security practices
```

### Current Codebase Structure
```bash
/home/ado/SurvAI.3.0/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── trackingController.ts        # ✅ Comprehensive click & conversion tracking
│   │   ├── services/
│   │   │   └── trackingService.ts           # ✅ EPC calculation, URL generation, analytics
│   │   ├── routes/
│   │   │   └── tracking.ts                  # ✅ All tracking endpoints defined
│   │   ├── utils/
│   │   │   ├── epcCalculator.ts             # ✅ Mathematical EPC utilities
│   │   │   ├── validateEnv.ts               # ✅ Joi validation patterns
│   │   │   └── logger.ts                    # ✅ Logging utilities
│   │   └── middleware/
│   │       └── errorHandler.ts              # ✅ Error handling patterns
│   └── prisma/
│       └── schema.prisma                    # ✅ Complete tracking models
├── shared/src/types/
│   ├── analytics.ts                         # ✅ EPC and tracking types
│   └── api.ts                               # ✅ API response formats
└── tests/backend/
    ├── trackingService.test.ts              # ✅ Unit tests
    └── trackingController.integration.test.ts # ✅ Integration tests
```

### Desired Enhancements Structure
```bash
/home/ado/SurvAI.3.0/
├── backend/src/
│   ├── controllers/
│   │   └── trackingController.ts            # ENHANCE: Add input validation middleware
│   ├── services/
│   │   └── trackingService.ts               # ENHANCE: Add idempotent conversion checking
│   ├── utils/
│   │   └── trackingValidation.ts            # CREATE: Joi schemas for tracking endpoints
│   ├── middleware/
│   │   └── trackingValidation.ts            # CREATE: Validation middleware
│   └── scripts/
│       └── pixelSimulation.ts               # CREATE: Manual pixel firing simulation
└── tests/backend/
    ├── trackingValidation.test.ts           # CREATE: Validation tests
    └── pixelSimulation.integration.test.ts  # CREATE: Simulation tests
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Prisma requires explicit transaction handling for atomic operations
// Example: The current markConversion method doesn't check if already converted
await prisma.$transaction(async (tx) => {
  const existingClick = await tx.clickTrack.findUnique({
    where: { clickId },
    select: { converted: true }
  });
  
  if (existingClick?.converted) {
    // IDEMPOTENT: Return existing record, don't update
    return existingClick;
  }
  
  // Only update if not already converted
  return await tx.clickTrack.update({
    where: { clickId },
    data: { converted: true, convertedAt: new Date() }
  });
});

// CRITICAL: Joi validation must be applied at controller level
// Example: Follow existing pattern in validateEnv.ts
const trackClickSchema = Joi.object({
  sessionId: Joi.string().required(),
  questionId: Joi.string().required(),
  offerId: Joi.string().required(),
  buttonVariantId: Joi.string().required(),
  timestamp: Joi.number().optional()
});

// CRITICAL: Express middleware pattern for validation
export const validateTrackClick = (req: Request, res: Response, next: NextFunction) => {
  const { error } = trackClickSchema.validate(req.body);
  if (error) {
    return next(createBadRequestError(error.details.map(d => d.message).join(', ')));
  }
  next();
};

// CRITICAL: Session and offer validation must occur before tracking
// Example: Check both session and offer exist and are valid
const surveyResponse = await prisma.surveyResponse.findFirst({
  where: { sessionData: { path: ['sessionId'], equals: request.sessionId } }
});

const offer = await prisma.offer.findUnique({
  where: { id: request.offerId, status: 'ACTIVE' }
});

if (!surveyResponse || !offer) {
  throw new Error('Invalid session or offer');
}
```

## Implementation Blueprint

### Data Models and Structure
All required data models already exist in the Prisma schema. The ClickTrack and ConversionTrack models are comprehensive and support all required functionality.

### List of Tasks to Complete (in order)

```yaml
Task 1: CREATE backend/src/utils/trackingValidation.ts
  - CREATE Joi schemas for all tracking endpoints (trackClick, recordConversion, generatePixel)
  - MIRROR pattern from: backend/src/utils/validateEnv.ts
  - INCLUDE schemas for request validation, parameter validation, and response validation
  - PRESERVE existing API contract and response formats

Task 2: CREATE backend/src/middleware/trackingValidation.ts
  - CREATE validation middleware functions for each tracking endpoint
  - MIRROR pattern from: backend/src/middleware/errorHandler.ts
  - INTEGRATE with existing error handling patterns
  - PRESERVE existing middleware chain structure

Task 3: ENHANCE backend/src/services/trackingService.ts
  - MODIFY markConversion method to implement idempotent conversion checking
  - MODIFY trackClick method to add session and offer validation
  - ADD comprehensive input validation before all database operations
  - PRESERVE existing method signatures and return types

Task 4: ENHANCE backend/src/controllers/trackingController.ts
  - INTEGRATE validation middleware with existing endpoints
  - ENHANCE error handling with detailed validation feedback
  - PRESERVE existing API response formats and error handling patterns
  - MAINTAIN existing performance characteristics

Task 5: CREATE backend/src/scripts/pixelSimulation.ts
  - CREATE manual pixel firing simulation script
  - IMPLEMENT ability to simulate click tracking and conversion scenarios
  - INCLUDE testing utilities for EPC calculation verification
  - FOLLOW existing script patterns in backend/src/scripts/

Task 6: ENHANCE tests/backend/trackingService.test.ts
  - ADD unit tests for idempotent conversion handling
  - ADD unit tests for enhanced validation methods
  - PRESERVE existing test structure and patterns
  - MAINTAIN comprehensive test coverage

Task 7: CREATE tests/backend/trackingValidation.test.ts
  - CREATE unit tests for Joi validation schemas
  - CREATE unit tests for validation middleware
  - FOLLOW existing test patterns in tests/backend/
  - INCLUDE edge case testing for validation scenarios

Task 8: CREATE tests/backend/pixelSimulation.integration.test.ts
  - CREATE integration tests for pixel simulation functionality
  - INCLUDE performance testing to ensure sub-200ms response times
  - FOLLOW existing integration test patterns
  - INCLUDE database cleanup and setup patterns

Task 9: ENHANCE backend/src/routes/tracking.ts
  - INTEGRATE validation middleware with existing routes
  - PRESERVE existing route definitions and URL patterns
  - MAINTAIN existing authentication and authorization patterns
  - KEEP existing route documentation and comments

Task 10: UPDATE documentation
  - UPDATE PLANNING.md to reflect enhanced tracking validation
  - UPDATE API documentation to include validation requirements
  - CREATE TASK.md entry for this enhancement (following CLAUDE.md requirements)
  - UPDATE README.md with pixel simulation usage instructions
```

### Task Implementation Details

#### Task 1: Joi Validation Schemas
```typescript
// backend/src/utils/trackingValidation.ts
import Joi from 'joi';

export const trackClickSchema = Joi.object({
  sessionId: Joi.string().min(1).max(255).required(),
  questionId: Joi.string().min(1).max(255).required(),
  offerId: Joi.string().min(1).max(255).required(),
  buttonVariantId: Joi.string().min(1).max(255).required(),
  timestamp: Joi.number().integer().positive().optional(),
  userAgent: Joi.string().max(1000).optional(),
  ipAddress: Joi.string().ip().optional()
});

export const recordConversionSchema = Joi.object({
  click_id: Joi.string().min(1).max(255).required(),
  revenue: Joi.number().positive().precision(2).optional()
});

export const generatePixelSchema = Joi.object({
  clickId: Joi.string().min(1).max(255).required(),
  surveyId: Joi.string().min(1).max(255).required()
});
```

#### Task 3: Idempotent Conversion Enhancement
```typescript
// ENHANCEMENT to trackingService.ts
async markConversion(clickId: string, revenue?: number): Promise<ClickTrack> {
  try {
    return await prisma.$transaction(async (tx) => {
      // IDEMPOTENT: Check if already converted
      const existingClick = await tx.clickTrack.findUnique({
        where: { clickId },
        select: { 
          id: true, 
          converted: true, 
          convertedAt: true, 
          revenue: true,
          offerId: true,
          responseId: true,
          sessionData: true,
          status: true,
          clickedAt: true,
          metadata: true
        }
      });

      if (!existingClick) {
        throw new Error(`Click ID ${clickId} not found`);
      }

      if (existingClick.converted) {
        // IDEMPOTENT: Return existing converted record
        return {
          id: existingClick.id,
          offerId: existingClick.offerId,
          responseId: existingClick.responseId || undefined,
          session: existingClick.sessionData as any,
          status: existingClick.status as any,
          converted: true,
          convertedAt: existingClick.convertedAt || undefined,
          revenue: existingClick.revenue ? Number(existingClick.revenue) : 0,
          clickedAt: existingClick.clickedAt,
          metadata: existingClick.metadata as any
        };
      }

      // Only update if not already converted
      const updatedClick = await tx.clickTrack.update({
        where: { clickId },
        data: {
          converted: true,
          convertedAt: new Date(),
          revenue: revenue || undefined
        }
      });

      return {
        id: updatedClick.id,
        offerId: updatedClick.offerId,
        responseId: updatedClick.responseId || undefined,
        session: updatedClick.sessionData as any,
        status: updatedClick.status as any,
        converted: updatedClick.converted,
        convertedAt: updatedClick.convertedAt || undefined,
        revenue: updatedClick.revenue ? Number(updatedClick.revenue) : 0,
        clickedAt: updatedClick.clickedAt,
        metadata: updatedClick.metadata as any
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to mark conversion: ${message}`);
  }
}
```

### Integration Points
```yaml
MIDDLEWARE:
  - add to: backend/src/controllers/trackingController.ts
  - pattern: "app.use('/api/track', validateTrackClick, trackingController.trackClick)"
  
VALIDATION:
  - add to: backend/src/services/trackingService.ts
  - pattern: "Validate session and offer existence before tracking"
  
ROUTES:
  - enhance: backend/src/routes/tracking.ts
  - pattern: "router.post('/click', validateTrackClick, trackingController.trackClick)"
  
TESTING:
  - add to: tests/backend/
  - pattern: "Follow existing test structure with setup/teardown"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                     # ESLint checking
npm run type-check              # TypeScript type checking

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```bash
# Run unit tests for new functionality
npm run test:unit -- --testPathPattern=trackingValidation
npm run test:unit -- --testPathPattern=trackingService

# Expected: All tests pass. If failing, read error and fix code.
```

### Level 3: Integration Tests
```bash
# Run integration tests
npm run test:integration -- --testPathPattern=trackingController
npm run test:integration -- --testPathPattern=pixelSimulation

# Expected: All tests pass with sub-200ms response times
```

### Level 4: Manual Testing
```bash
# Start the development server
npm run dev

# Test pixel simulation
npx tsx backend/src/scripts/pixelSimulation.ts

# Test API endpoints
curl -X POST http://localhost:8000/api/track/click \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "questionId": "test-question-456",
    "offerId": "test-offer-789",
    "buttonVariantId": "test-button-abc"
  }'

# Expected: Valid response with click tracking and no validation errors
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Manual API testing successful
- [ ] Pixel simulation script works
- [ ] Idempotent conversion handling verified
- [ ] Session and offer validation working
- [ ] Response times under 200ms maintained
- [ ] Documentation updated

---

## Anti-Patterns to Avoid
- ❌ Don't create new validation patterns when Joi is already used
- ❌ Don't skip transaction handling for idempotent operations
- ❌ Don't ignore existing error handling patterns
- ❌ Don't modify existing API response formats
- ❌ Don't hardcode validation rules that should be configurable
- ❌ Don't bypass existing middleware patterns

## Score: 9/10
**Confidence Level for One-Pass Implementation:** This PRP provides comprehensive context, follows existing patterns, includes detailed implementation guidance, and provides executable validation loops. The existing codebase is already robust, making this primarily an enhancement rather than a complete rewrite.

The high confidence score is justified by:
1. **Existing robust implementation** - 90% of functionality already exists
2. **Clear patterns to follow** - Joi validation, Prisma transactions, existing controller patterns
3. **Comprehensive context** - All necessary files and documentation referenced
4. **Detailed task breakdown** - Each task has specific implementation guidance
5. **Executable validation loops** - Clear testing and validation procedures
6. **Industry best practices** - Incorporates 2024 affiliate tracking best practices