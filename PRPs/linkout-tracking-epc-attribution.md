# PRP: Linkout Tracking, EPC Attribution & Pixel Injection

## Goal
Implement complete affiliate conversion tracking pipeline with click tracking, pixel-based conversions, EPC calculation, and question ranking optimization. Users click CTA buttons → new tabs open with tracking parameters → pixel firing marks conversions → EPC values update offer rankings in real time.

## Why
- **Revenue optimization**: EPC-driven question ordering maximizes earnings per survey session
- **Attribution accuracy**: Proper click tracking enables precise conversion attribution  
- **Performance insights**: Real-time metrics drive offer and question optimization decisions
- **Affiliate compliance**: Standard pixel tracking integration with affiliate networks

## What
Complete the click-through → conversion → EPC feedback loop using pixel tracking, URL parameter injection, and atomic database operations.

### Success Criteria
- [ ] CTA clicks open new tabs with injected {click_id} and {survey_id} parameters
- [ ] POST /api/track/click creates ClickTrack records and returns tracking URLs
- [ ] GET /pixel/:click_id marks conversions and updates offer EPC values  
- [ ] Admin UI displays pixel URLs (read-only) and real-time EPC values
- [ ] Questions reorder based on EPC performance of associated offers
- [ ] All operations use Prisma transactions for data consistency

## All Needed Context

### Documentation & References
```yaml
- url: https://www.scaleo.io/blog/affiliate-marketing-postback-url-tracking/
  why: Standard patterns for affiliate pixel tracking and parameter injection
  
- url: https://www.clickbank.com/blog/what-is-earnings-per-click-aka-epc/
  why: EPC calculation methodology (total revenue / total clicks)

- file: backend/src/services/trackingService.ts
  why: Existing click tracking, URL generation, and analytics patterns to extend
  
- file: backend/src/controllers/trackingController.ts  
  why: Request handling patterns and response formatting to mirror

- file: backend/prisma/schema.prisma
  why: ClickTrack, Offer, and metrics models for database operations

- file: frontend/src/services/tracking.ts
  why: Frontend tracking service patterns for click handling

- file: frontend/src/components/survey/QuestionCard.tsx
  why: CTA button click handling that needs pixel tracking integration

- file: shared/src/types/offer.ts
  why: Existing type definitions for ClickTrack, Offer, UrlVariables

- file: backend/src/scripts/seedCTAData.ts
  why: Sample data structure and offer configuration patterns
```

### Current Codebase Tree
```bash
SurvAI.3.0/
├── backend/
│   ├── src/
│   │   ├── controllers/trackingController.ts    # Existing click tracking
│   │   ├── services/trackingService.ts          # URL generation, analytics  
│   │   ├── routes/tracking.ts                   # Current tracking routes
│   │   └── utils/                               # Missing: EPC calculation utility
│   └── prisma/schema.prisma                     # ClickTrack, Offer models
├── frontend/
│   ├── src/
│   │   ├── components/survey/QuestionCard.tsx   # CTA button handling
│   │   ├── services/tracking.ts                 # Click tracking service
│   │   └── pages/AdminPage.tsx                  # Admin dashboard stub
├── shared/
│   └── src/types/offer.ts                       # ClickTrack, Offer types
```

### Desired Codebase Tree (Files to Add/Modify)
```bash
SurvAI.3.0/
├── backend/
│   ├── src/
│   │   ├── controllers/trackingController.ts    # ADD: pixel endpoint
│   │   ├── services/trackingService.ts          # ADD: EPC update method  
│   │   ├── routes/tracking.ts                   # ADD: GET /pixel/:click_id
│   │   ├── utils/epcCalculator.ts               # NEW: EPC math utility
│   │   └── services/questionService.ts          # ADD: EPC-based ordering
├── frontend/
│   ├── src/
│   │   ├── components/admin/                    # NEW: Admin components
│   │   │   ├── OfferManagement.tsx              # NEW: Offer admin UI
│   │   │   └── OfferMetrics.tsx                 # NEW: EPC display component
│   │   ├── services/tracking.ts                 # MODIFY: Enhanced tracking
│   │   └── hooks/useSurvey.ts                   # MODIFY: Click handling
├── shared/
│   └── src/types/analytics.ts                   # NEW: EPC types
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Prisma requires $transaction for EPC updates
// Pattern: Always wrap click conversion + EPC update in single transaction
await prisma.$transaction(async (tx) => {
  await tx.clickTrack.update(...);
  await tx.offer.update(...);
});

// CRITICAL: TypeScript exactOptionalPropertyTypes=true requires spread operator
// for optional properties in request objects
const request = {
  sessionId,
  offerId,
  ...(clickId && { clickId })
};

// CRITICAL: window.open() requires specific params for new tab security
window.open(url, '_blank', 'noopener,noreferrer');

// CRITICAL: EPC calculation must handle division by zero
const epc = totalClicks > 0 ? totalRevenue / totalClicks : 0;

// PATTERN: Use existing UUID generation for click IDs  
import { v4 as uuidv4 } from 'uuid';
const clickId = uuidv4();
```

## Implementation Blueprint

### Data Models and Structure
Core EPC calculation types and analytics interfaces:
```typescript
// shared/src/types/analytics.ts
export interface EPCMetrics {
  totalClicks: number;
  totalConversions: number; 
  totalRevenue: number;
  conversionRate: number;
  epc: number;
  lastUpdated: Date;
}

export interface OfferPerformance extends EPCMetrics {
  offerId: string;
  title: string;
  rank: number;
}
```

### List of Tasks (Execution Order)

```yaml
Task 1: Create EPC Calculation Utility
CREATE backend/src/utils/epcCalculator.ts:
  - PATTERN: Pure function for mathematical calculations
  - INPUT: clicks count, conversions count, total revenue
  - OUTPUT: EPCMetrics object with calculated values
  - HANDLE: Division by zero edge case

Task 2: Add Pixel Tracking Endpoint  
MODIFY backend/src/routes/tracking.ts:
  - ADD: GET /pixel/:click_id route
  - PATTERN: Mirror existing route structure from file
  
MODIFY backend/src/controllers/trackingController.ts:
  - ADD: handlePixel() method 
  - PATTERN: Follow existing method signature patterns
  - LOGIC: Mark conversion + trigger EPC update

Task 3: Enhance Tracking Service with EPC Updates
MODIFY backend/src/services/trackingService.ts:
  - ADD: updateOfferEPC() method
  - PATTERN: Use Prisma transaction for atomic updates
  - INTEGRATE: epcCalculator utility for math operations

Task 4: Frontend Click Tracking Enhancement
MODIFY frontend/src/hooks/useSurvey.ts:  
  - MODIFY: handleButtonClick() to properly track and open tabs
  - PATTERN: Use existing trackingService.trackClick()
  - ENSURE: New tab opens with tracking parameters

MODIFY frontend/src/services/tracking.ts:
  - ADD: Enhanced error handling for tracking failures
  - IMPROVE: URL parameter validation

Task 5: Admin Offer Management UI
CREATE frontend/src/components/admin/OfferManagement.tsx:
  - PATTERN: Mirror card layout from AdminPage.tsx
  - DISPLAY: Offers table with pixel URLs and EPC values
  - FEATURES: Read-only pixel URL display, real-time EPC metrics

CREATE frontend/src/components/admin/OfferMetrics.tsx:
  - PATTERN: Follow existing component structure
  - DISPLAY: EPC metrics with auto-refresh capability

Task 6: Question Ordering by EPC
MODIFY backend/src/services/questionService.ts:
  - ADD: getQuestionsOrderedByEPC() method
  - PATTERN: Use existing Prisma query patterns  
  - LOGIC: Order questions by associated offer EPC values

Task 7: Shared Types for Analytics
CREATE shared/src/types/analytics.ts:
  - EXPORT: EPCMetrics, OfferPerformance interfaces
  - PATTERN: Follow existing type definition patterns from offer.ts
```

### Per Task Pseudocode

```typescript
// Task 1: EPC Calculator
export function calculateEPC(clicks: number, revenue: number): EPCMetrics {
  // CRITICAL: Handle division by zero
  const epc = clicks > 0 ? revenue / clicks : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  
  return {
    totalClicks: clicks,
    totalRevenue: revenue, 
    epc: Math.round(epc * 100) / 100, // Round to 2 decimals
    conversionRate: Math.round(conversionRate * 100) / 100,
    lastUpdated: new Date()
  };
}

// Task 2: Pixel Endpoint
async handlePixel(req: Request, res: Response) {
  const { click_id } = req.params;
  
  // PATTERN: Validate required parameters first
  if (!click_id) {
    return next(createBadRequestError('Click ID required'));
  }
  
  // CRITICAL: Use transaction for conversion + EPC update
  await prisma.$transaction(async (tx) => {
    await tx.clickTrack.update({
      where: { clickId: click_id },
      data: { converted: true, convertedAt: new Date() }
    });
    
    // Trigger EPC recalculation
    await trackingService.updateOfferEPC(offer.id, tx);
  });
  
  // PATTERN: Return simple response for pixel tracking
  res.status(200).json({ success: true });
}

// Task 3: EPC Update Service  
async updateOfferEPC(offerId: string, tx?: PrismaTransaction) {
  // PATTERN: Get current metrics from database
  const analytics = await this.getAnalytics(offerId);
  const epcMetrics = calculateEPC(analytics.totalClicks, analytics.totalRevenue);
  
  // PATTERN: Update offer metrics atomically
  await (tx || prisma).offer.update({
    where: { id: offerId },
    data: {
      metrics: {
        ...analytics,
        ...epcMetrics
      }
    }
  });
}

// Task 4: Frontend Click Enhancement
const handleButtonClick = async (buttonId: string, offerId: string) => {
  // PATTERN: Track click first, get redirect URL
  const trackResponse = await trackingService.trackClick({
    sessionId: state.sessionId,
    questionId: state.currentQuestion!.id,
    offerId,
    buttonVariantId: buttonId
  });
  
  // CRITICAL: Open in new tab with security params
  window.open(trackResponse.redirectUrl, '_blank', 'noopener,noreferrer');
  
  // PATTERN: Continue with survey progression
  await loadNextQuestion(state.currentQuestion.id);
};
```

### Integration Points
```yaml
DATABASE:
  - transaction: "Wrap pixel conversion + EPC update in single transaction"
  - index: "Ensure clickId index exists for pixel lookup performance"
  
ROUTES:
  - add to: backend/src/routes/tracking.ts
  - pattern: "router.get('/pixel/:click_id', trackingController.handlePixel)"
  
FRONTEND:
  - integrate: Admin components into existing AdminPage.tsx
  - pattern: "Import OfferManagement component and add to admin grid"
```

## Validation Loop

### Level 1: Syntax & Style  
```bash
# Backend validation
cd backend && npm run build                    # TypeScript compilation
cd backend && npm run lint                     # ESLint checks

# Frontend validation  
cd frontend && npm run build                   # TypeScript + Vite build
cd frontend && npm run lint                    # ESLint checks

# Shared types validation
cd shared && npm run build                     # Type definitions export

# Expected: No errors. Fix any TypeScript/lint errors before proceeding.
```

### Level 2: Unit Tests
```typescript
// CREATE tests/backend/epcCalculator.test.ts
describe('EPC Calculator', () => {
  test('calculates EPC correctly with valid data', () => {
    const result = calculateEPC(100, 250.50);
    expect(result.epc).toBe(2.51);
    expect(result.totalClicks).toBe(100);
    expect(result.totalRevenue).toBe(250.50);
  });

  test('handles zero clicks gracefully', () => {
    const result = calculateEPC(0, 0);
    expect(result.epc).toBe(0);
    expect(result.conversionRate).toBe(0);
  });

  test('handles division by zero', () => {
    const result = calculateEPC(0, 100);
    expect(result.epc).toBe(0);
    expect(result.totalRevenue).toBe(100);
  });
});

// CREATE tests/backend/pixelTracking.test.ts
describe('Pixel Tracking', () => {
  test('pixel endpoint marks conversion', async () => {
    const clickTrack = await createTestClickTrack();
    
    const response = await request(app)
      .get(`/api/track/pixel/${clickTrack.clickId}`)
      .expect(200);
      
    const updated = await prisma.clickTrack.findUnique({
      where: { clickId: clickTrack.clickId }
    });
    
    expect(updated.converted).toBe(true);
    expect(updated.convertedAt).toBeDefined();
  });

  test('invalid click ID returns 404', async () => {
    await request(app)
      .get('/api/track/pixel/invalid-id')
      .expect(404);
  });
});
```

```bash
# Run tests and iterate until passing
npm test -- --testPathPattern="epcCalculator|pixelTracking"
# If failing: Read error, fix code, re-run (never mock to pass)
```

### Level 3: Integration Test
```bash
# Start backend server  
cd backend && npm run dev

# Test pixel tracking flow
curl -X POST http://localhost:8000/api/track/click \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "questionId": "test-question", 
    "offerId": "test-offer",
    "buttonVariantId": "test-button",
    "timestamp": 1640995200000
  }'

# Extract clickId from response, then test pixel
curl http://localhost:8000/api/track/pixel/{clickId}

# Expected: {"success": true}, click marked as converted in database
# Test EPC calculation by checking offer metrics updated
```

## Final Validation Checklist
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: All packages build successfully
- [ ] No linting errors: `npm run lint` in all packages
- [ ] Click tracking creates records: Manual test with curl
- [ ] Pixel endpoint marks conversions: Database verification
- [ ] EPC values update correctly: Check offer metrics after conversion
- [ ] Frontend opens new tabs properly: Browser testing
- [ ] Admin UI displays pixel URLs: Visual verification
- [ ] Transaction integrity maintained: No partial updates in database

## Anti-Patterns to Avoid
- ❌ Don't update click status without updating EPC in same transaction
- ❌ Don't hardcode pixel URLs - use environment configuration  
- ❌ Don't block main thread with EPC calculations - use async operations
- ❌ Don't ignore window.open() security parameters
- ❌ Don't calculate EPC on every request - cache and update on conversion
- ❌ Don't expose internal click IDs in frontend - use tracking service
- ❌ Don't skip validation of click_id parameter in pixel endpoint

---

**Confidence Score: 9/10** - Comprehensive context provided with existing patterns, executable validation steps, and clear implementation path. Most infrastructure exists; implementation focuses on specific missing pieces with established patterns.