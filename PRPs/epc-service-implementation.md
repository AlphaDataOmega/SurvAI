# EPC Service Implementation PRP

## Goal
Create a fully functional EPC (Earnings Per Click) service that calculates and updates offer performance metrics based on recent click and conversion data. The service must handle real-time EPC calculations, use proper database transactions, and provide a foundation for question ordering optimization.

## Why
- **Business Value**: Enables real-time offer optimization based on performance, maximizing revenue per click
- **Integration**: Connects click tracking to offer ranking for dynamic question ordering
- **Foundation**: Establishes EPC calculation system for the AI-enhanced survey monetization engine

## What
A complete EPC service that:
- Calculates EPC from past 7 days of click/conversion data
- Updates offer EPC values in the database using atomic transactions
- Handles edge cases (zero clicks, no conversions)
- Provides comprehensive error handling and validation
- Includes full unit test coverage

### Success Criteria
- [ ] `calculateEPC(offerId: string): number` returns accurate EPC based on 7-day performance
- [ ] `updateEPC(offerId: string): Promise<void>` writes EPC to database using transactions
- [ ] EPC = 0.0 when no clicks exist in the time window
- [ ] Edge case handling: clicks without conversions return EPC = 0.0
- [ ] All functions are covered by unit tests (happy path, edge cases, failures)
- [ ] Service uses Prisma transactions for data consistency
- [ ] Time utility helper created for date calculations
- [ ] Documentation updated for new service functionality

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Critical implementation context
- url: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
  why: Transaction patterns and best practices for atomic EPC updates
  critical: Use Prisma.TransactionClient type for type safety

- url: https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing
  why: Official Jest mocking patterns for Prisma testing
  critical: Use jest-mock-extended for comprehensive mocking

- file: backend/src/utils/epcCalculator.ts
  why: Existing EPC calculation utilities to leverage - calculateEPC function already exists
  critical: Don't recreate calculation logic, use existing pure functions

- file: backend/src/services/trackingService.ts
  why: Pattern for service class structure, transaction usage, and error handling
  critical: Follow existing patterns for consistency and reliability

- file: tests/backend/trackingService.test.ts
  why: Comprehensive test patterns including mocking, validation, and edge cases
  critical: Mirror test structure and coverage expectations

- file: backend/prisma/schema.prisma
  why: Data models for ClickTrack and Offer - understand relationships and field types
  critical: ClickTrack has converted boolean, revenue decimal, clickedAt timestamp

- file: shared/src/types/analytics.ts
  why: EPCMetrics interface definition and type structure
  critical: Use EPCMetrics type for return values and consistency
```

### Current Codebase Tree
```bash
backend/src/
├── services/
│   ├── epcService.ts          # EXISTS - stub implementation to replace
│   ├── trackingService.ts     # EXISTS - transaction patterns to follow
│   └── aiService.ts
├── utils/
│   ├── epcCalculator.ts       # EXISTS - pure calculation functions to use
│   └── logger.ts
└── validators/
    └── questionValidator.ts

tests/backend/
├── services/                  # EXISTS - test patterns to follow
│   ├── trackingService.test.ts
│   └── authService.test.ts
```

### Desired Codebase Tree
```bash
backend/src/
├── services/
│   └── epcService.ts          # MODIFY - replace stub with real implementation
├── utils/
│   └── time.ts                # CREATE - date calculation utilities
└── tests/backend/services/
    └── epcService.test.ts     # CREATE - comprehensive unit tests
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Prisma transaction typing
// Use: Prisma.TransactionClient or Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
import { PrismaClient, Prisma } from '@prisma/client';

// CRITICAL: Date filtering in Prisma requires specific format
const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
await prisma.clickTrack.findMany({
  where: {
    clickedAt: {
      gte: sevenDaysAgo
    }
  }
});

// CRITICAL: Decimal handling in calculations
// revenue field is Decimal in Prisma, must convert: Number(record.revenue)

// CRITICAL: Jest mocking patterns for Prisma
// Use jest-mock-extended for comprehensive PrismaClient mocking
jest.mock('@prisma/client');

// CRITICAL: EPC calculation handles division by zero
// Always check totalClicks > 0 before dividing
```

## Implementation Blueprint

### Data Models Used
```typescript
// From Prisma schema - no changes needed
model ClickTrack {
  clickedAt  DateTime    @default(now())
  converted  Boolean     @default(false)
  revenue    Decimal?    @db.Decimal(10, 2)
  offerId    String
  // ... other fields
}

model Offer {
  id      String @id @default(cuid())
  // NOTE: Feature mentions epcValue field but it's not in current schema
  // Use metrics JSON field instead for storing EPC data
  metrics Json?
  // ... other fields
}
```

### Task Implementation Order
```yaml
Task 1 - Create Time Utility:
  CREATE backend/src/utils/time.ts:
    - Function getDateDaysAgo(days: number): Date
    - Function isWithinTimeWindow(date: Date, windowDays: number): boolean
    - Handle timezone considerations and edge cases

Task 2 - Implement Core EPC Functions:
  MODIFY backend/src/services/epcService.ts:
    - REPLACE stub calculateEPC function with real implementation
    - ADD updateEPC function using Prisma transactions
    - LEVERAGE existing calculateEPC from utils/epcCalculator.ts
    - FOLLOW trackingService patterns for error handling

Task 3 - Comprehensive Unit Tests:
  CREATE tests/backend/services/epcService.test.ts:
    - Happy path: EPC calculation with valid data
    - Edge case: Zero clicks returns EPC = 0
    - Edge case: Clicks without conversions returns EPC = 0
    - Error case: Invalid offer ID
    - Error case: Database connection failure
    - Transaction testing: Verify atomic operations

Task 4 - Integration Validation:
  - Verify EPC service integrates with existing codebase
  - Run validation commands to ensure code quality
  - Update documentation as needed
```

### Task 1 Pseudocode
```typescript
// backend/src/utils/time.ts
export function getDateDaysAgo(days: number): Date {
  // PATTERN: Validate input (see existing validators)
  if (days < 0) throw new Error('Days cannot be negative');
  
  // CALCULATION: Current time minus days in milliseconds
  const msPerDay = 24 * 60 * 60 * 1000;
  return new Date(Date.now() - (days * msPerDay));
}

export function isWithinTimeWindow(date: Date, windowDays: number): boolean {
  // PATTERN: Use getDateDaysAgo for consistency
  const cutoffDate = getDateDaysAgo(windowDays);
  return date >= cutoffDate;
}
```

### Task 2 Pseudocode  
```typescript
// backend/src/services/epcService.ts
import { calculateEPC } from '../utils/epcCalculator';
import { getDateDaysAgo } from '../utils/time';

export class EPCService {
  async calculateEPC(offerId: string): Promise<number> {
    // VALIDATION: Check offerId exists (pattern from trackingService)
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new Error(`Offer ${offerId} not found`);
    
    // QUERY: Get clicks from past 7 days
    const sevenDaysAgo = getDateDaysAgo(7);
    const clicks = await prisma.clickTrack.findMany({
      where: {
        offerId,
        clickedAt: { gte: sevenDaysAgo }
      }
    });
    
    // CALCULATION: Use existing utility
    const totalClicks = clicks.length;
    const conversions = clicks.filter(c => c.converted).length;
    const revenue = clicks.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0);
    
    // PATTERN: Use existing calculateEPC function from utils
    const metrics = calculateEPC(totalClicks, conversions, revenue);
    return metrics.epc;
  }

  async updateEPC(offerId: string): Promise<void> {
    // PATTERN: Use transaction for atomic operation (see trackingService)
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const epc = await this.calculateEPC(offerId);
      
      await tx.offer.update({
        where: { id: offerId },
        data: {
          metrics: {
            ...existingMetrics,
            epc,
            lastUpdated: new Date()
          }
        }
      });
    });
  }
}
```

### Integration Points
```yaml
DATABASE:
  - Uses existing ClickTrack and Offer models
  - No schema migration needed - uses metrics JSON field
  
SERVICES:
  - Integrates with existing trackingService patterns
  - Uses existing epcCalculator utility functions
  
TYPES:
  - Uses EPCMetrics from @survai/shared
  - Follows existing service export patterns
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding  
npm run lint
npm run type-check

# Expected: No errors. Focus on proper TypeScript typing for Prisma transactions
```

### Level 2: Unit Tests
```typescript
// CREATE tests/backend/services/epcService.test.ts
describe('EPCService', () => {
  describe('calculateEPC', () => {
    it('should calculate EPC correctly with valid data', async () => {
      // Mock 100 clicks, 15 conversions, $375.50 revenue
      // Expect EPC = 3.755
    });

    it('should return 0 for zero clicks', async () => {
      // Mock empty click array
      // Expect EPC = 0
    });

    it('should return 0 for clicks without conversions', async () => {
      // Mock clicks with converted: false
      // Expect EPC = 0
    });

    it('should handle only 7-day window', async () => {
      // Mock clicks older than 7 days + recent clicks
      // Verify only recent clicks are included
    });
  });

  describe('updateEPC', () => {
    it('should update offer metrics atomically', async () => {
      // Mock successful transaction
      // Verify metrics.epc updated correctly
    });

    it('should rollback on transaction failure', async () => {
      // Mock transaction failure
      // Verify no partial updates occur
    });
  });
});
```

```bash
# Run and iterate until passing:
npm run test:unit

# Expected: All tests pass with proper mocking and edge case coverage
```

### Level 3: Integration Validation
```bash
# Validate service integration
npm run build
npm run dev

# Expected: Service exports correctly and integrates with existing codebase
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test:unit`
- [ ] No linting errors: `npm run lint`  
- [ ] No type errors: `npm run type-check`
- [ ] EPC calculations match expected business logic
- [ ] Transaction patterns follow existing service conventions
- [ ] Error handling covers all edge cases
- [ ] Time utilities handle timezone and edge cases correctly
- [ ] Documentation reflects new service capabilities

## Anti-Patterns to Avoid
- ❌ Don't recreate EPC calculation logic - use existing utils/epcCalculator.ts
- ❌ Don't skip transaction usage for database updates - follow trackingService patterns  
- ❌ Don't ignore TypeScript types for Prisma transactions - use proper typing
- ❌ Don't hardcode 7-day window - use time utility for flexibility
- ❌ Don't assume database operations succeed - add proper error handling
- ❌ Don't test against real database - use proper mocking patterns
- ❌ Don't skip edge case testing - zero clicks and no conversions are common

---

## Confidence Score: 9/10

This PRP provides comprehensive context including:
- Complete codebase understanding and existing patterns to follow
- Detailed implementation blueprint with specific pseudocode
- External documentation and best practices for Prisma transactions and Jest testing
- Clear task breakdown with implementation order
- Comprehensive validation approach with executable commands
- Known gotchas and anti-patterns to avoid

The high confidence score reflects the thorough research, existing utility functions to leverage, and clear implementation path based on established codebase patterns.