name: "EPC-Driven Question Ordering Implementation"
description: |

## Purpose
Implement dynamic question ordering based on EPC (Earnings Per Click) values to optimize survey flow and maximize revenue. This feature completes the feedback loop between click tracking, EPC calculation, and question delivery by routing users through higher-performing questions first.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Update the survey flow logic to fetch questions tied to a survey, calculate average EPC scores per question based on linked offers, and return questions sorted by descending EPC performance. Fall back to static `Question.order` when EPCs are unavailable or zero.

## Why
- **Business value**: Higher-performing questions first maximizes conversion rates and revenue per survey session
- **Integration with existing features**: Completes the M3 phase feedback loop between click tracking (M3_PHASE_02), EPC calculation (M3_PHASE_04), and question delivery
- **Problems this solves**: Static question ordering doesn't adapt to performance data, missing revenue optimization opportunities

## What
Dynamic question ordering system that:
- Fetches all questions for a survey with their associated offers
- Calculates average EPC score per question from linked offer performance  
- Returns questions sorted by EPC performance (highest first)
- Gracefully falls back to static order when EPC data is unavailable
- Maintains compatibility with existing survey flow

### Success Criteria
- [ ] Survey questions are returned ordered by average EPC score (descending)
- [ ] Questions without offers or EPCs fall back to static `Question.order`
- [ ] EPC scores calculated using only active offers from past 7 days
- [ ] Edge cases handled: no EPCs, some EPCs, all EPCs tested
- [ ] End-to-end test confirms ordering improves as EPCs change
- [ ] All existing survey flow functionality remains intact
- [ ] Performance impact is minimal (< 100ms additional latency)

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /home/ado/SurvAI.3.0/M3_PHASE_05.md
  why: Feature specification and requirements
  
- file: /home/ado/SurvAI.3.0/M3_PHASE_04.md
  why: EPC service implementation details and dependencies
  
- file: /home/ado/SurvAI.3.0/backend/src/services/epcService.ts
  why: Existing EPC calculation patterns and service methods
  
- file: /home/ado/SurvAI.3.0/backend/src/controllers/questionController.ts
  why: Current question retrieval patterns and controller structure
  
- file: /home/ado/SurvAI.3.0/backend/src/services/questionService.ts
  why: Question-offer linking logic and CTA generation patterns
  
- file: /home/ado/SurvAI.3.0/backend/src/services/trackingService.ts
  why: EPC ranking and offer performance calculation methods
  
- file: /home/ado/SurvAI.3.0/backend/prisma/schema.prisma
  why: Database schema for Question, Offer, ClickTrack relationships
  
- file: /home/ado/SurvAI.3.0/shared/src/types/survey.ts
  why: TypeScript interfaces for Question and related types
  
- file: /home/ado/SurvAI.3.0/tests/backend/services/epcService.test.ts
  why: Existing test patterns for EPC service validation
  
- url: https://khalilstemmler.com/articles/enterprise-typescript-nodejs/clean-consistent-expressjs-controllers/
  why: Clean Express.js controller patterns with TypeScript
  section: Controller structure and error handling best practices
  critical: Consistent API responses and proper abstraction layers

- url: https://www.prisma.io/docs/concepts/components/prisma-client/aggregation-grouping-summarizing
  why: Prisma aggregation patterns for calculating average EPCs
  section: Grouping and aggregation methods
  critical: Performance considerations for complex queries
```

### Current Codebase Structure
```bash
/home/ado/SurvAI.3.0/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── questionController.ts      # Current question endpoints
│   │   │   └── trackingController.ts      # Click tracking logic
│   │   ├── services/
│   │   │   ├── epcService.ts             # EPC calculation service
│   │   │   ├── questionService.ts        # Question-offer linking
│   │   │   └── trackingService.ts        # EPC ranking methods
│   │   ├── utils/
│   │   │   ├── epcCalculator.ts          # EPC math utilities
│   │   │   └── time.ts                   # Date window calculations
│   │   └── routes/
│   │       └── questions.ts              # Question route definitions
│   └── prisma/
│       └── schema.prisma                 # Database schema
├── shared/
│   └── src/types/survey.ts              # Question and survey types
└── tests/backend/
    ├── controllers/
    │   └── questionController.test.ts     # Controller tests (needs creation)
    └── services/
        └── epcService.test.ts            # EPC service test patterns
```

### Desired Codebase Structure After Implementation
```bash
/home/ado/SurvAI.3.0/
├── backend/src/controllers/
│   └── surveyController.ts               # NEW: Survey-specific controller with EPC ordering
├── backend/src/services/
│   ├── epcService.ts                     # MODIFY: Add getQuestionEPC helper method
│   └── questionService.ts                # MODIFY: Update question retrieval for EPC ordering
└── tests/backend/controllers/
    └── surveyController.test.ts          # NEW: Unit tests for EPC ordering logic
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Prisma transaction patterns (existing codebase uses these)
// Example: EPC updates must use $transaction for atomic operations
await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
  // All operations must use tx instead of prisma
});

// CRITICAL: EPC calculation edge cases
// Example: Division by zero when no clicks exist
if (totalClicks === 0) {
  return { epc: 0, conversionRate: 0 };
}

// CRITICAL: Question-offer linking is dynamic, not database-enforced
// Example: Questions get offers through questionService.getEligibleOffers()
// No QuestionOffer join table exists - offers are ranked globally by EPC

// CRITICAL: TypeScript exactOptionalPropertyTypes requires explicit undefined handling
// Example: Question.config may be undefined, use optional chaining
const maxButtons = question.config?.maxButtons || 3;

// CRITICAL: Date window calculations must be consistent
// Example: Use existing getDateDaysAgo(7) utility for 7-day windows
const sevenDaysAgo = getDateDaysAgo(7);
```

## Implementation Blueprint

### Data Models and Structure

The existing schema already supports EPC-driven ordering through:
```typescript
// Question model (existing)
model Question {
  id          String       @id @default(cuid())
  surveyId    String       @map("survey_id")
  order       Int          // Fallback ordering
  // ... other fields
}

// Offer model with EPC metrics (existing)
model Offer {
  id             String      @id @default(cuid())
  metrics        Json?       // Contains EPC data
  clicks         ClickTrack[]
  conversions    ConversionTrack[]
  // ... other fields
}

// ClickTrack for EPC calculation (existing)
model ClickTrack {
  offerId    String
  converted  Boolean     @default(false)
  revenue    Decimal?
  clickedAt  DateTime    @default(now())
  // ... other fields
}
```

### List of Tasks to Complete (in order)

```yaml
Task 1:
CREATE backend/src/controllers/surveyController.ts:
  - MIRROR pattern from: backend/src/controllers/questionController.ts
  - IMPLEMENT getQuestions endpoint with EPC ordering
  - USE existing questionService and epcService patterns
  - PRESERVE error handling patterns from existing controllers

Task 2:
MODIFY backend/src/services/epcService.ts:
  - ADD getQuestionEPC(questionId: string): Promise<number> method
  - IMPLEMENT logic to calculate average EPC from question's linked offers
  - USE existing calculateEPC utility from utils/epcCalculator.ts
  - MAINTAIN compatibility with existing methods

Task 3:
MODIFY backend/src/controllers/questionController.ts:
  - UPDATE getQuestionsBySurvey method to use new EPC ordering
  - REPLACE legacy epcService.orderQuestionsByEPC with new implementation
  - MAINTAIN existing API response structure

Task 4:
CREATE tests/backend/controllers/surveyController.test.ts:
  - MIRROR test patterns from: tests/backend/services/epcService.test.ts
  - TEST EPC sorting logic with various scenarios
  - TEST fallback to static order when EPCs unavailable
  - TEST edge cases: no offers, zero EPCs, mixed EPCs

Task 5:
UPDATE backend/src/routes/questions.ts:
  - ADD route for new survey controller getQuestions endpoint
  - MAINTAIN backward compatibility with existing routes
  - USE consistent route patterns from existing files
```

### Per Task Pseudocode

```typescript
// Task 1: Survey Controller Implementation
class SurveyController {
  async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    // PATTERN: Parameter validation (see questionController.ts)
    const { surveyId } = req.params;
    if (!surveyId) {
      return next(createBadRequestError('Survey ID is required'));
    }

    // PATTERN: Service delegation (see existing controllers)
    const questions = await questionService.getQuestionsBySurvey(surveyId);
    
    // NEW: EPC-based ordering
    const orderedQuestions = await this.orderQuestionsByEPC(questions);
    
    // PATTERN: Consistent API response (see questionController.ts)
    const apiResponse: ApiResponse<Question[]> = {
      success: true,
      data: orderedQuestions,
      timestamp: new Date().toISOString()
    };
    res.status(200).json(apiResponse);
  }

  private async orderQuestionsByEPC(questions: Question[]): Promise<Question[]> {
    // Calculate EPC for each question
    const questionsWithEPC = await Promise.all(
      questions.map(async (question) => ({
        question,
        epc: await epcService.getQuestionEPC(question.id)
      }))
    );
    
    // Sort by EPC (descending), fall back to order for ties
    return questionsWithEPC
      .sort((a, b) => {
        if (a.epc !== b.epc) return b.epc - a.epc;
        return a.question.order - b.question.order;
      })
      .map(({ question }) => question);
  }
}

// Task 2: EPC Service Enhancement
class EPCService {
  async getQuestionEPC(questionId: string): Promise<number> {
    try {
      // Get offers linked to this question via questionService
      const offers = await questionService.getEligibleOffers(questionId);
      
      if (offers.length === 0) return 0;
      
      // Calculate average EPC from all linked offers
      const epcValues = await Promise.all(
        offers.map(offer => this.calculateEPC(offer.id))
      );
      
      const validEPCs = epcValues.filter(epc => epc > 0);
      if (validEPCs.length === 0) return 0;
      
      return validEPCs.reduce((sum, epc) => sum + epc, 0) / validEPCs.length;
    } catch (error) {
      console.warn(`Failed to calculate question EPC for ${questionId}:`, error);
      return 0; // Graceful fallback
    }
  }
}
```

### Integration Points
```yaml
ROUTES:
  - add to: backend/src/routes/questions.ts
  - pattern: "router.get('/survey/:surveyId/questions', surveyController.getQuestions)"
  
SERVICES:
  - modify: backend/src/services/epcService.ts
  - add method: getQuestionEPC(questionId: string): Promise<number>
  
CONTROLLERS:
  - create: backend/src/controllers/surveyController.ts
  - modify: backend/src/controllers/questionController.ts (update existing method)
  
VALIDATION:
  - reuse: existing request validation patterns from questionController.ts
  - maintain: consistent error handling and API response structure
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                          # ESLint with auto-fix
npm run type-check                    # TypeScript compilation check

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests for Each New Feature
```typescript
// CREATE tests/backend/controllers/surveyController.test.ts with these test cases:
describe('SurveyController', () => {
  describe('getQuestions', () => {
    it('should return questions ordered by EPC descending', async () => {
      // Mock questions with different EPC values
      // Verify sorting order matches EPC ranking
    });

    it('should fall back to Question.order when EPCs are zero', async () => {
      // Mock questions with zero EPC values
      // Verify fallback to static ordering
    });

    it('should handle mixed EPC scenarios', async () => {
      // Some questions with EPC, some without
      // Verify EPC questions come first, then static order
    });

    it('should handle survey with no questions gracefully', async () => {
      // Empty question array
      // Verify empty response without errors
    });

    it('should validate survey ID parameter', async () => {
      // Missing or invalid surveyId
      // Verify proper error response
    });
  });
});

describe('EPCService.getQuestionEPC', () => {
  it('should calculate average EPC from linked offers', async () => {
    // Mock multiple offers with different EPCs
    // Verify average calculation is correct
  });

  it('should return 0 for questions with no offers', async () => {
    // Question with no linked offers
    // Verify graceful handling
  });

  it('should handle offer EPC calculation failures', async () => {
    // Mock EPC calculation errors
    // Verify graceful fallback to 0
  });
});
```

```bash
# Run and iterate until passing:
npm run test:unit
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start the development server
npm run dev

# Test the new endpoint
curl -X GET http://localhost:3001/api/questions/survey/survey-123/questions \
  -H "Authorization: Bearer <valid-jwt-token>" \
  -H "Content-Type: application/json"

# Expected: {"success": true, "data": [...questions ordered by EPC...]}
# If error: Check logs for stack trace and validation failures
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test:unit`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Manual endpoint test successful with proper EPC ordering
- [ ] Error cases handled gracefully (invalid survey ID, no questions)
- [ ] Backward compatibility maintained for existing question endpoints
- [ ] Performance within acceptable limits (< 100ms additional latency)
- [ ] Documentation updated in relevant files

---

## Anti-Patterns to Avoid
- ❌ Don't create new database relationships when service-level linking works
- ❌ Don't skip EPC calculation failures - always provide graceful fallbacks
- ❌ Don't ignore existing patterns - mirror questionController structure exactly
- ❌ Don't hardcode EPC calculation logic - reuse existing utilities
- ❌ Don't break backward compatibility with existing survey flow
- ❌ Don't introduce performance bottlenecks with N+1 queries
- ❌ Don't cache EPC values without considering real-time requirements

## Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation because:
- ✅ Complete codebase analysis shows exact patterns to follow
- ✅ Detailed task breakdown with specific file modifications
- ✅ Existing EPC service and test patterns provide clear templates
- ✅ Known gotchas and edge cases are documented with solutions
- ✅ Validation loops are executable and comprehensive
- ✅ Fallback strategies are clearly defined for all error scenarios

The high confidence score reflects the thorough research into existing codebase patterns, comprehensive test coverage plans, and clear implementation steps that follow established architectural conventions.