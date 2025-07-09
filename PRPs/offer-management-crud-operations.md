name: "M3_PHASE_07 - Offer Management CRUD + Pixel URL Auto-Generation"
description: |
  Complete implementation of Offer Management module with comprehensive CRUD operations, 
  pixel URL auto-generation, and admin UI integration. This PRP provides all necessary 
  context for one-pass implementation success.

---

## Goal
Build a complete Offer Management system that allows admins to create, read, update, and delete affiliate offers with automatic pixel URL generation. The system must integrate seamlessly with existing EPC tracking, click attribution, and admin authentication systems.

## Why
- **Business Value**: Streamlines affiliate offer management for admin users
- **Revenue Optimization**: Enables dynamic offer management for better EPC performance
- **User Experience**: Provides intuitive admin interface for offer lifecycle management
- **System Integration**: Connects offer management with existing tracking and analytics systems
- **Problems Solved**: Eliminates manual pixel URL generation and provides centralized offer control

## What
**User-Visible Behavior:**
- Admin dashboard displays paginated offers table with real-time metrics
- Create/Edit forms with auto-populated pixel URLs on destination URL changes
- One-click copy-to-clipboard for pixel URLs
- Real-time EPC, click, and conversion data display
- Offer activation/deactivation toggle controls
- Comprehensive offer search and filtering capabilities

**Technical Requirements:**
- RESTful API endpoints for all CRUD operations
- Automatic pixel URL generation with `{click_id}` and `{survey_id}` placeholders
- Integration with existing EPC service for performance metrics
- Comprehensive input validation and error handling
- Transactional database operations for data consistency
- Full test coverage (unit + integration)

### Success Criteria
- [ ] `POST /api/offers` creates offer with auto-generated pixel URL
- [ ] `GET /api/offers` lists offers with real-time EPC metrics
- [ ] `PATCH /api/offers/:id` updates offer and regenerates pixel URL if needed
- [ ] `DELETE /api/offers/:id` soft-deletes offer
- [ ] `PATCH /api/offers/:id/toggle` toggles offer active status
- [ ] Admin UI displays offers table with working CRUD operations
- [ ] Pixel URL field is read-only and auto-updates on destination URL changes
- [ ] All tests pass (100% coverage for new code)
- [ ] Integration with existing EPC service works correctly
- [ ] Documentation is updated and complete

## All Needed Context

### Documentation & References
```yaml
- file: backend/src/controllers/trackingController.ts
  why: Controller pattern, error handling, and API response structure
  critical: Transaction usage and validation patterns

- file: backend/src/services/trackingService.ts
  why: Service layer patterns, Prisma transactions, and URL generation
  critical: generatePixelUrl() method and transaction handling

- file: backend/src/services/epcService.ts
  why: EPC calculation integration and metrics updating
  critical: calculateEPC() and updateEPC() methods for offer performance

- file: backend/src/validators/dashboardValidation.ts
  why: Joi validation patterns and error handling
  critical: Schema validation structure and error formatting

- file: backend/src/routes/tracking.ts
  why: Route organization and middleware usage
  critical: Route structure and validation middleware integration

- file: backend/prisma/schema.prisma
  why: Database schema and Offer model structure
  critical: Offer model fields, relationships, and enums

- file: shared/src/types/offer.ts
  why: TypeScript interfaces and type definitions
  critical: Offer interface structure and related types

- file: frontend/src/components/admin/OfferManagement.tsx
  why: Current UI implementation and React patterns
  critical: Component structure and state management patterns

- file: frontend/src/services/api.ts
  why: API client configuration and request patterns
  critical: API helper functions and error handling

- file: tests/backend/services/epcService.test.ts
  why: Testing patterns and mock setup
  critical: Test structure, mocking patterns, and coverage requirements
```

### Current Codebase Structure (Key Files)
```bash
backend/
├── src/
│   ├── controllers/
│   │   ├── trackingController.ts     # ✅ Pattern reference
│   │   ├── authController.ts         # ✅ Validation patterns
│   │   └── dashboardController.ts    # ✅ Response patterns
│   ├── services/
│   │   ├── trackingService.ts        # ✅ URL generation patterns
│   │   ├── epcService.ts             # ✅ EPC integration required
│   │   └── authService.ts            # ✅ Service layer patterns
│   ├── routes/
│   │   ├── tracking.ts               # ✅ Route organization
│   │   └── auth.ts                   # ✅ Middleware patterns
│   ├── validators/
│   │   └── dashboardValidation.ts    # ✅ Joi validation patterns
│   └── utils/
│       └── epcCalculator.ts          # ✅ EPC calculation utilities
├── prisma/
│   └── schema.prisma                 # ✅ Offer model definition
frontend/
├── src/
│   ├── components/admin/
│   │   └── OfferManagement.tsx       # ⚠️ Currently mock implementation
│   ├── services/
│   │   └── api.ts                    # ✅ API client patterns
│   └── types/                        # ✅ TypeScript integration
shared/
├── src/types/
│   └── offer.ts                      # ✅ Type definitions
tests/
├── backend/
│   └── services/
│       └── epcService.test.ts        # ✅ Testing patterns
```

### Desired Codebase Structure (Files to Create/Update)
```bash
# NEW FILES TO CREATE
backend/src/routes/offers.ts                    # CRUD routes
backend/src/controllers/offerController.ts      # Business logic
backend/src/services/offerService.ts           # Data operations + pixel URL generation
backend/src/validators/offerValidator.ts        # Input validation
tests/backend/services/offerService.test.ts    # Unit tests
tests/backend/controllers/offerController.test.ts # Controller tests

# FILES TO UPDATE
frontend/src/components/admin/OfferManagement.tsx  # Replace mock with real implementation
frontend/src/services/offer.ts                     # Create API service
shared/src/types/offer.ts                          # Add missing interfaces if needed
```

### Known Gotchas of Codebase & Library Quirks
```typescript
// CRITICAL: Prisma transaction usage
// Pattern: ALL database operations must use transactions for consistency
await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
  // Operations here
});

// CRITICAL: EPC service integration
// Pattern: Update EPC whenever offer is modified
import { epcService } from '../services/epcService';
await epcService.updateEPC(offerId);

// CRITICAL: Pixel URL generation
// Pattern: Use existing trackingService.generatePixelUrl()
const pixelUrl = `${PIXEL_BASE}?click_id={click_id}&survey_id={survey_id}`;
// Do NOT encode placeholders - store raw templates

// CRITICAL: Error handling pattern
// Pattern: Use existing error types from errorHandler middleware
import { createBadRequestError } from '../middleware/errorHandler';
throw createBadRequestError('Validation failed');

// CRITICAL: Response format
// Pattern: ALL responses use ApiResponse<T> format
const response: ApiResponse<Offer> = {
  success: true,
  data: offer,
  timestamp: new Date().toISOString()
};

// CRITICAL: Validation pattern
// Pattern: Use Joi schemas with formatValidationError
const { error, value } = schema.validate(data, {
  abortEarly: false,
  stripUnknown: true,
  allowUnknown: false
});
```

## Implementation Blueprint

### Data Models and Structure
Current Offer model in schema.prisma is complete - use existing structure:
```prisma
model Offer {
  id             String      @id @default(cuid())
  title          String
  description    String?
  category       OfferCategory
  status         OfferStatus @default(PENDING)
  destinationUrl String      @map("destination_url")
  pixelUrl       String?     @map("pixel_url")
  config         Json?
  targeting      Json?
  metrics        Json?
  createdBy      String?     @map("created_by")
  updatedBy      String?     @map("updated_by")
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")
  // Relations with ClickTrack and ConversionTrack
}
```

### Tasks to Complete (In Order)

```yaml
Task 1: Create Offer Validator
CREATE backend/src/validators/offerValidator.ts:
  - MIRROR pattern from: backend/src/validators/dashboardValidation.ts
  - CREATE schemas for: createOffer, updateOffer, listOffers, toggleOffer
  - INCLUDE validation for: title, description, category, destinationUrl, config
  - PRESERVE existing error handling patterns

Task 2: Create Offer Service
CREATE backend/src/services/offerService.ts:
  - MIRROR pattern from: backend/src/services/trackingService.ts
  - IMPLEMENT generatePixelUrl() method using existing pattern
  - IMPLEMENT CRUD operations with Prisma transactions
  - INTEGRATE with existing epcService.updateEPC() method
  - PRESERVE atomic operation patterns

Task 3: Create Offer Controller
CREATE backend/src/controllers/offerController.ts:
  - MIRROR pattern from: backend/src/controllers/trackingController.ts
  - IMPLEMENT REST endpoints: create, list, get, update, delete, toggle
  - PRESERVE existing error handling and response patterns
  - INTEGRATE with offerService methods

Task 4: Create Offer Routes
CREATE backend/src/routes/offers.ts:
  - MIRROR pattern from: backend/src/routes/tracking.ts
  - MOUNT validation middleware for each endpoint
  - PRESERVE route organization patterns
  - INTEGRATE with existing auth middleware

Task 5: Update Frontend API Service
CREATE frontend/src/services/offer.ts:
  - MIRROR pattern from: frontend/src/services/api.ts
  - IMPLEMENT typed API methods for all CRUD operations
  - PRESERVE error handling patterns
  - INTEGRATE with existing apiClient

Task 6: Update Admin UI Component
MODIFY frontend/src/components/admin/OfferManagement.tsx:
  - REPLACE mock data with real API calls
  - IMPLEMENT form for create/edit operations
  - ADD auto-updating pixel URL field (read-only)
  - PRESERVE existing styling patterns

Task 7: Register Routes in Main App
MODIFY backend/src/app.ts:
  - IMPORT offers routes
  - MOUNT at '/api/offers' path
  - PRESERVE existing route mounting patterns

Task 8: Add Types if Needed
MODIFY shared/src/types/offer.ts:
  - ADD any missing request/response types
  - PRESERVE existing type structure
  - ENSURE compatibility with API endpoints

Task 9: Create Unit Tests
CREATE tests/backend/services/offerService.test.ts:
  - MIRROR pattern from: tests/backend/services/epcService.test.ts
  - TEST all CRUD operations with mocked Prisma
  - INCLUDE success, edge case, and failure scenarios
  - PRESERVE existing testing patterns

Task 10: Create Integration Tests
CREATE tests/backend/controllers/offerController.test.ts:
  - MIRROR pattern from: tests/backend/controllers/surveyController.test.ts
  - TEST all API endpoints with real request/response
  - PRESERVE existing integration test patterns
```

### Per Task Pseudocode

```typescript
// Task 2: Offer Service Implementation
export class OfferService {
  // PATTERN: Use existing generatePixelUrl from trackingService
  generatePixelUrl(clickId: string, surveyId: string): string {
    const baseUrl = process.env.PIXEL_BASE_URL || 'https://tracking.survai.app/pixel';
    return `${baseUrl}?click_id={click_id}&survey_id={survey_id}`;
  }

  // PATTERN: Atomic transaction for offer creation
  async createOffer(data: CreateOfferRequest): Promise<Offer> {
    return await prisma.$transaction(async (tx) => {
      // Generate pixel URL
      const pixelUrl = this.generatePixelUrl('{click_id}', '{survey_id}');
      
      const offer = await tx.offer.create({
        data: {
          ...data,
          pixelUrl,
          status: 'PENDING'
        }
      });

      // Initialize EPC metrics
      await epcService.updateEPC(offer.id);
      
      return offer;
    });
  }

  // PATTERN: Update with EPC refresh
  async updateOffer(id: string, data: UpdateOfferRequest): Promise<Offer> {
    return await prisma.$transaction(async (tx) => {
      // Regenerate pixel URL if destination changed
      if (data.destinationUrl) {
        data.pixelUrl = this.generatePixelUrl('{click_id}', '{survey_id}');
      }

      const offer = await tx.offer.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      // Refresh EPC metrics
      await epcService.updateEPC(id);
      
      return offer;
    });
  }
}
```

### Integration Points
```yaml
DATABASE:
  - model: "Offer model already exists in schema.prisma"
  - relationships: "ClickTrack and ConversionTrack relations established"
  
SERVICES:
  - epcService: "Call updateEPC() after offer modifications"
  - trackingService: "Use generatePixelUrl() pattern for consistency"
  
ROUTES:
  - mount: "app.use('/api/offers', offerRoutes)" in backend/src/app.ts
  - auth: "Use existing requireAuth middleware"
  
FRONTEND:
  - api: "Extend frontend/src/services/api.ts with offer methods"
  - ui: "Replace mock data in OfferManagement.tsx component"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                    # Auto-fix linting issues
npm run type-check             # TypeScript type checking

# Expected: No errors. If errors exist, read and fix them.
```

### Level 2: Unit Tests
```bash
# Run unit tests for each new component
npm test -- --testPathPattern="offerService.test.ts"
npm test -- --testPathPattern="offerController.test.ts"

# Expected: All tests pass with >90% coverage
# If failing: Read error messages, fix code, re-run tests
```

### Level 3: Integration Tests
```bash
# Test complete API workflow
npm run test:integration

# Manual API testing (if needed)
curl -X POST http://localhost:8000/api/offers \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your_token" \
  -d '{
    "title": "Test Offer",
    "category": "FINANCE",
    "destinationUrl": "https://example.com/offer?ref=test"
  }'

# Expected: {"success": true, "data": {...}} with auto-generated pixelUrl
```

## Final Validation Checklist
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Pixel URL auto-generation works correctly
- [ ] EPC integration functions properly
- [ ] Admin UI CRUD operations work end-to-end
- [ ] Error handling works for all edge cases
- [ ] Transactions ensure data consistency
- [ ] Documentation is complete and updated

---

## Anti-Patterns to Avoid
- ❌ Don't create new error handling patterns - use existing errorHandler middleware
- ❌ Don't skip EPC integration - offers must update performance metrics
- ❌ Don't ignore transaction patterns - use them for all database operations
- ❌ Don't hardcode pixel URLs - use existing generation patterns
- ❌ Don't skip validation - use Joi schemas for all inputs
- ❌ Don't mock away core functionality in tests - test real behavior
- ❌ Don't break existing authentication patterns - use requireAuth middleware

## PRP Confidence Score: 9/10
This PRP provides comprehensive context for one-pass implementation success. All necessary patterns, examples, and integration points are documented. The only remaining variables are minor implementation details that can be resolved during development.