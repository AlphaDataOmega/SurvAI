# EPC Service Comprehensive Guide

## Overview

The EPC (Earnings Per Click) Service is a real-time performance tracking and optimization system that calculates and updates offer performance metrics based on 7-day rolling windows of click and conversion data. This comprehensive guide covers both the service architecture and API reference for the EPC system.

**Enhanced in M3_PHASE_05**: The service now includes intelligent question ordering by EPC performance, automatically routing users through higher-performing questions first to maximize survey revenue.

**Dashboard Integration**: The EPC service powers the Admin Dashboard with real-time metrics, interactive charts, and comprehensive analytics for monitoring offer and question performance. See [Dashboard API Reference](DASHBOARD_API_REFERENCE.md) for visualization features.

## What is EPC?

**Earnings Per Click (EPC)** is a key performance metric in affiliate marketing that measures the average revenue generated per click on an offer or question.

```
EPC = Total Revenue ÷ Total Clicks
```

For example:
- 100 clicks generating $250 in revenue = $2.50 EPC
- Higher EPC indicates better performance

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│              EPC Service (Enhanced M3_PHASE_05)                    │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┤
│   Real-Time     │  Atomic         │  7-Day Rolling  │  Question EPC   │
│   Calculation   │  Transactions   │  Window Analytics│  Ordering      │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│  Live Database  │   Prisma        │   Time Utilities │ Parallel Calc   │
│  Integration    │   Transactions  │  & Edge Handling │ & Graceful      │
│                 │                 │                 │  Fallback       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Code Structure

```typescript
// backend/src/services/epcService.ts
export interface QuestionEPCScore {
  questionId: string;
  epcScore: number;
  totalClicks: number;
  totalRevenue: number;
  lastUpdated: Date;
}

export class EPCService {
  // Core EPC calculation methods
  async calculateEPC(offerId: string): Promise<number>
  async updateEPC(offerId: string): Promise<void>
  
  // Question-level EPC and ordering (M3_PHASE_05)
  async getQuestionEPC(questionId: string): Promise<number>
  async orderQuestionsByEPCScore(questions: Question[]): Promise<Question[]>
  
  // Legacy methods (maintained for compatibility)
  async getQuestionEPCScores(questionIds: string[]): Promise<QuestionEPCScore[]>
  async orderQuestionsByEPC(questions: Question[]): Promise<Question[]>
  async calculateQuestionEPC(questionId: string): Promise<number>
}
```

## API Reference

### Table of Contents

- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Core EPC Functions](#core-epc-functions)
- [Question Ordering Functions](#question-ordering-functions)
- [Utility Functions](#utility-functions)
- [API Endpoints](#api-endpoints)

### Authentication

EPC service functions are internal service methods and do not require external authentication. However, when exposed via API endpoints, they should use the existing JWT authentication middleware.

```typescript
// Protected EPC endpoints would use:
app.use('/api/epc', authenticateJWT);
```

### Error Handling

All EPC service methods follow consistent error handling patterns:

#### Error Types

```typescript
// Common error scenarios
class EPCError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EPCError';
  }
}

// Error codes
const EPC_ERRORS = {
  INVALID_OFFER_ID: 'INVALID_OFFER_ID',
  OFFER_NOT_FOUND: 'OFFER_NOT_FOUND', 
  CALCULATION_FAILED: 'CALCULATION_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;
```

#### Error Response Format

```json
{
  "success": false,
  "error": "Failed to calculate EPC: Offer offer-123 not found",
  "code": "OFFER_NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Rate Limiting

When exposed as API endpoints, EPC operations should include rate limiting:

```typescript
// Recommended rate limits
const epcRateLimits = {
  calculate: {
    windowMs: 60 * 1000,    // 1 minute
    max: 100               // 100 requests per minute
  },
  update: {
    windowMs: 60 * 1000,    // 1 minute  
    max: 50                // 50 updates per minute
  }
};
```

## Core EPC Functions

### calculateEPC

Calculates the EPC (Earnings Per Click) for a specific offer based on 7-day performance data.

#### Method Signature

```typescript
async calculateEPC(offerId: string): Promise<number>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offerId` | string | Yes | Unique identifier for the offer |

#### Returns

- **Type**: `Promise<number>`
- **Description**: EPC value calculated as `totalRevenue / totalClicks` for the past 7 days
- **Range**: `0.0` or positive number (rounded to 2 decimal places)

#### Implementation

```typescript
async calculateEPC(offerId: string): Promise<number> {
  // VALIDATION: Check offerId parameter and offer existence
  if (!offerId || typeof offerId !== 'string') {
    throw new Error('Offer ID is required and must be a string');
  }

  const offer = await prisma.offer.findUnique({ 
    where: { id: offerId },
    select: { id: true, status: true }
  });
  
  if (!offer) {
    throw new Error(`Offer ${offerId} not found`);
  }

  // QUERY: Get clicks from past 7 days using time utilities
  const sevenDaysAgo = getDateDaysAgo(7);
  const clicks = await prisma.clickTrack.findMany({
    where: {
      offerId,
      clickedAt: { gte: sevenDaysAgo }
    },
    select: {
      converted: true,
      revenue: true
    }
  });

  // CALCULATION: Use existing utility functions
  const totalClicks = clicks.length;
  const conversions = clicks.filter((c: any) => c.converted).length;
  const revenue = clicks.reduce((sum: number, c: any) => {
    return sum + (c.converted && c.revenue ? Number(c.revenue) : 0);
  }, 0);

  // PATTERN: Use existing calculateEPC function from utils
  const metrics = calculateEPC(totalClicks, conversions, revenue);
  return metrics.epc;
}
```

#### Examples

```typescript
import { epcService } from '../services/epcService';

// Calculate EPC for an offer
try {
  const epc = await epcService.calculateEPC('offer-123');
  console.log(`EPC: $${epc.toFixed(2)}`); // "EPC: $3.75"
} catch (error) {
  console.error('EPC calculation failed:', error.message);
}

// Handle edge cases
const epcZeroClicks = await epcService.calculateEPC('offer-no-clicks');
console.log(epcZeroClicks); // 0

const epcNoConversions = await epcService.calculateEPC('offer-no-conversions'); 
console.log(epcNoConversions); // 0
```

### updateEPC

Updates an offer's EPC metrics in the database using atomic transactions.

#### Method Signature

```typescript
async updateEPC(offerId: string): Promise<void>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offerId` | string | Yes | Unique identifier for the offer to update |

#### Implementation

```typescript
async updateEPC(offerId: string): Promise<void> {
  // VALIDATION: Check offerId parameter
  if (!offerId || typeof offerId !== 'string') {
    throw new Error('Offer ID is required and must be a string');
  }

  // PATTERN: Use transaction for atomic operation
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Get current offer to merge with existing metrics
    const currentOffer = await tx.offer.findUnique({
      where: { id: offerId },
      select: { metrics: true }
    });

    if (!currentOffer) {
      throw new Error(`Offer ${offerId} not found`);
    }

    // Calculate new EPC metrics using 7-day window
    const sevenDaysAgo = getDateDaysAgo(7);
    const clicks = await tx.clickTrack.findMany({
      where: {
        offerId,
        clickedAt: { gte: sevenDaysAgo }
      },
      select: {
        converted: true,
        revenue: true
      }
    });

    const totalClicks = clicks.length;
    const conversions = clicks.filter((c: any) => c.converted).length;
    const revenue = clicks.reduce((sum: number, c: any) => {
      return sum + (c.converted && c.revenue ? Number(c.revenue) : 0);
    }, 0);

    const epcMetrics: EPCMetrics = calculateEPC(totalClicks, conversions, revenue);

    // Merge with existing metrics to preserve non-EPC data
    const existingMetrics = (typeof currentOffer.metrics === 'object' && currentOffer.metrics !== null) 
      ? currentOffer.metrics as Record<string, unknown>
      : {};

    // Update the offer's metrics atomically
    await tx.offer.update({
      where: { id: offerId },
      data: {
        metrics: {
          ...existingMetrics,
          ...epcMetrics,
          lastUpdated: new Date()
        }
      }
    });
  });
}
```

## Question Ordering Functions

### getQuestionEPC

Calculates the average EPC for a question based on its linked active offers within a 7-day rolling window.

#### Method Signature

```typescript
async getQuestionEPC(questionId: string): Promise<number>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `questionId` | string | Yes | Unique identifier for the question |

#### Returns

- **Type**: `Promise<number>`
- **Description**: Average EPC calculated from all linked active offers
- **Range**: `0.0` or positive number (representing average EPC)

#### Behavior

- **Offer Linking**: Gets eligible offers via `questionService.getEligibleOffers()`
- **EPC Calculation**: Calculates individual EPC for each linked offer
- **Averaging**: Returns average of all positive EPC values
- **Zero Handling**: Returns `0.0` when no offers linked or all EPCs are zero
- **Error Resilience**: Returns `0.0` on calculation failures (graceful fallback)

#### Examples

```typescript
import { epcService } from '../services/epcService';

// Calculate EPC for a question
try {
  const questionEPC = await epcService.getQuestionEPC('question-123');
  console.log(`Question EPC: $${questionEPC.toFixed(2)}`); // "Question EPC: $4.25"
} catch (error) {
  console.error('Question EPC calculation failed:', error.message);
}

// Handle question with no offers
const noOfferEPC = await epcService.getQuestionEPC('question-no-offers');
console.log(noOfferEPC); // 0

// Handle calculation errors gracefully
const errorEPC = await epcService.getQuestionEPC('question-error');
console.log(errorEPC); // 0 (graceful fallback)
```

### orderQuestionsByEPCScore

Orders an array of questions by their EPC performance with fallback to static ordering.

#### Method Signature

```typescript
async orderQuestionsByEPCScore(questions: Question[]): Promise<Question[]>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `questions` | Question[] | Yes | Array of questions to order |

#### Returns

- **Type**: `Promise<Question[]>`
- **Description**: Questions ordered by EPC performance (highest first)

#### Behavior

- **Primary Sort**: EPC descending (higher EPC questions first)
- **Secondary Sort**: Static `Question.order` ascending for ties
- **Parallel Processing**: Uses `Promise.all()` for concurrent EPC calculations
- **Graceful Degradation**: Falls back to static order if EPC ordering fails
- **Performance**: < 100ms additional latency for typical question sets

#### Algorithm

```typescript
// 1. Calculate EPC for each question in parallel
const questionsWithEPC = await Promise.all(
  questions.map(async (question) => ({
    question,
    epc: await this.getQuestionEPC(question.id)
  }))
);

// 2. Sort by EPC (descending), fallback to order
return questionsWithEPC
  .sort((a, b) => {
    if (a.epc !== b.epc) return b.epc - a.epc;  // Higher EPC first
    return a.question.order - b.question.order; // Static order fallback
  })
  .map(({ question }) => question);
```

## API Endpoints

### Calculate EPC Endpoint

```typescript
// Calculate EPC endpoint
router.get('/epc/calculate/:offerId', async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const epc = await epcService.calculateEPC(offerId);
    
    res.json({
      success: true,
      data: {
        epc,
        offerId,
        windowDays: 7,
        lastUpdated: new Date()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});
```

### Update EPC Endpoint

```typescript
// Update EPC endpoint
router.post('/epc/update/:offerId', async (req, res, next) => {
  try {
    const { offerId } = req.params;
    await epcService.updateEPC(offerId);
    
    res.json({
      success: true,
      data: {
        updated: true,
        offerId,
        timestamp: new Date()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});
```

### Question EPC Endpoint

```typescript
// Question EPC calculation endpoint
router.get('/epc/question/:questionId', async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const epc = await epcService.getQuestionEPC(questionId);
    
    res.json({
      success: true,
      data: {
        epc,
        questionId,
        description: 'Average EPC from linked active offers',
        windowDays: 7,
        lastUpdated: new Date()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});
```

### EPC-Ordered Questions Endpoint

```typescript
// EPC-ordered questions endpoint
router.get('/questions/survey/:surveyId/epc-ordered', async (req, res, next) => {
  try {
    const { surveyId } = req.params;
    
    // Get questions for survey
    const questions = await questionService.getQuestionsBySurvey(surveyId);
    
    // Order by EPC performance
    const orderedQuestions = await epcService.orderQuestionsByEPCScore(questions);
    
    res.json({
      success: true,
      data: {
        surveyId,
        totalQuestions: orderedQuestions.length,
        questions: orderedQuestions,
        ordering: 'EPC performance (highest first)',
        fallback: 'Static Question.order for ties'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});
```

## Utility Functions

### Time Utilities

The EPC service uses time utility functions for consistent date handling:

```typescript
import { getDateDaysAgo, isWithinTimeWindow } from '../utils/time';

// Get date 7 days ago
const sevenDaysAgo = getDateDaysAgo(7);
console.log(sevenDaysAgo); // Date object for 7 days ago

// Check if date is within time window
const isRecent = isWithinTimeWindow(new Date(), 7);
console.log(isRecent); // true
```

### EPC Calculator Utilities

Uses existing calculation utilities for consistent EPC math:

```typescript
import { calculateEPC } from '../utils/epcCalculator';

// Calculate EPC metrics from raw data
const metrics = calculateEPC(100, 15, 375.50);
console.log(metrics);
// {
//   totalClicks: 100,
//   totalConversions: 15,
//   totalRevenue: 375.50,
//   epc: 3.76,
//   conversionRate: 15.0,
//   lastUpdated: Date
// }
```

## Implementation Examples

### Basic Usage

```typescript
import { epcService } from '../services/epcService';

async function getOfferPerformance(offerId: string) {
  try {
    // Get current EPC
    const currentEPC = await epcService.calculateEPC(offerId);
    
    // Update metrics in database  
    await epcService.updateEPC(offerId);
    
    return {
      offerId,
      epc: currentEPC,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`Performance calculation failed for ${offerId}:`, error);
    return null;
  }
}
```

### Batch Processing

```typescript
async function updateAllOfferEPCs(offerIds: string[]) {
  const results = [];
  
  for (const offerId of offerIds) {
    try {
      const epc = await epcService.calculateEPC(offerId);
      await epcService.updateEPC(offerId);
      
      results.push({
        offerId,
        epc,
        status: 'success'
      });
    } catch (error) {
      results.push({
        offerId,
        epc: 0,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
}
```

### Question Ordering Integration

```typescript
// backend/src/controllers/questionController.ts
async getQuestionsBySurvey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { surveyId } = req.params;

    // Get questions for survey
    const questions = await questionService.getQuestionsBySurvey(surveyId);

    // Order by EPC score
    const orderedQuestions = await epcService.orderQuestionsByEPCScore(questions);

    const apiResponse: ApiResponse<Question[]> = {
      success: true,
      data: orderedQuestions,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(apiResponse);
  } catch (error) {
    next(error);
  }
}
```

## Testing

### Unit Test Examples

```typescript
import { EPCService } from '../../../backend/src/services/epcService';

describe('EPCService', () => {
  let epcService: EPCService;
  
  beforeEach(() => {
    epcService = new EPCService();
  });

  describe('calculateEPC', () => {
    it('should calculate EPC correctly with valid data', async () => {
      // Mock offer and click data
      mockPrisma.offer.findUnique.mockResolvedValue({
        id: 'offer-123',
        status: 'ACTIVE'
      });
      
      mockPrisma.clickTrack.findMany.mockResolvedValue([
        ...Array(85).fill({ converted: false, revenue: null }),
        ...Array(15).fill({ converted: true, revenue: 25.00 })
      ]);
      
      const result = await epcService.calculateEPC('offer-123');
      
      expect(result).toBe(3.75); // 375.00 / 100 = 3.75
    });

    it('should return 0 for zero clicks', async () => {
      mockPrisma.offer.findUnique.mockResolvedValue({
        id: 'offer-123',
        status: 'ACTIVE'
      });
      
      mockPrisma.clickTrack.findMany.mockResolvedValue([]);
      
      const result = await epcService.calculateEPC('offer-123');
      
      expect(result).toBe(0);
    });

    it('should validate offer ID parameter', async () => {
      await expect(epcService.calculateEPC('')).rejects.toThrow(
        'Offer ID is required and must be a string'
      );
    });
  });

  describe('getQuestionEPC', () => {
    it('should calculate average EPC from linked offers', async () => {
      // Mock question service to return offers
      const mockOffers = [
        { id: 'offer-1', title: 'Offer 1' },
        { id: 'offer-2', title: 'Offer 2' },
        { id: 'offer-3', title: 'Offer 3' }
      ];
      
      mockQuestionService.getEligibleOffers.mockResolvedValue(mockOffers);
      
      // Mock individual EPC calculations: 2.0, 4.0, 6.0 (average = 4.0)
      mockEpcService.calculateEPC
        .mockResolvedValueOnce(2.0)
        .mockResolvedValueOnce(4.0)
        .mockResolvedValueOnce(6.0);
      
      const result = await epcService.getQuestionEPC('question-123');
      
      expect(result).toBe(4.0);
      expect(mockQuestionService.getEligibleOffers).toHaveBeenCalledWith('question-123');
    });

    it('should return 0 for questions with no offers', async () => {
      mockQuestionService.getEligibleOffers.mockResolvedValue([]);
      
      const result = await epcService.getQuestionEPC('question-456');
      
      expect(result).toBe(0);
    });

    it('should handle EPC calculation failures gracefully', async () => {
      const mockOffers = [{ id: 'offer-1', title: 'Offer 1' }];
      mockQuestionService.getEligibleOffers.mockResolvedValue(mockOffers);
      mockEpcService.calculateEPC.mockRejectedValue(new Error('EPC calculation failed'));
      
      const result = await epcService.getQuestionEPC('question-789');
      
      expect(result).toBe(0); // Graceful fallback
    });
  });

  describe('orderQuestionsByEPCScore', () => {
    const mockQuestions = [
      { id: 'q1', text: 'Question 1', order: 2 },
      { id: 'q2', text: 'Question 2', order: 1 },
      { id: 'q3', text: 'Question 3', order: 3 }
    ];

    it('should order questions by EPC descending', async () => {
      // Mock EPC values: q2=5.0, q1=3.5, q3=1.2
      mockEpcService.getQuestionEPC
        .mockResolvedValueOnce(3.5) // q1
        .mockResolvedValueOnce(5.0) // q2
        .mockResolvedValueOnce(1.2); // q3
      
      const result = await epcService.orderQuestionsByEPCScore(mockQuestions);
      
      expect(result).toEqual([
        expect.objectContaining({ id: 'q2' }), // Highest EPC (5.0)
        expect.objectContaining({ id: 'q1' }), // Medium EPC (3.5)
        expect.objectContaining({ id: 'q3' })  // Lowest EPC (1.2)
      ]);
    });

    it('should fall back to static order when EPCs are zero', async () => {
      mockEpcService.getQuestionEPC.mockResolvedValue(0);
      
      const result = await epcService.orderQuestionsByEPCScore(mockQuestions);
      
      expect(result).toEqual([
        expect.objectContaining({ id: 'q2', order: 1 }),
        expect.objectContaining({ id: 'q1', order: 2 }),
        expect.objectContaining({ id: 'q3', order: 3 })
      ]);
    });
  });
});
```

### Integration Test Examples

```typescript
describe('EPC Service Integration', () => {
  it('should update EPC using real database transaction', async () => {
    // Create test offer
    const offer = await prisma.offer.create({
      data: {
        title: 'Test Offer',
        destinationUrl: 'https://example.com',
        category: 'FINANCE',
        status: 'ACTIVE'
      }
    });

    // Create test clicks and conversions
    await prisma.clickTrack.createMany({
      data: [
        {
          offerId: offer.id,
          clickId: 'click-1',
          converted: true,
          revenue: 25.00,
          sessionData: {}
        },
        {
          offerId: offer.id,
          clickId: 'click-2', 
          converted: false,
          revenue: null,
          sessionData: {}
        }
      ]
    });

    // Test EPC calculation and update
    const epc = await epcService.calculateEPC(offer.id);
    expect(epc).toBe(12.50); // 25.00 / 2 = 12.50

    await epcService.updateEPC(offer.id);

    // Verify metrics were updated
    const updatedOffer = await prisma.offer.findUnique({
      where: { id: offer.id }
    });
    
    expect(updatedOffer?.metrics).toMatchObject({
      totalClicks: 2,
      totalConversions: 1,
      totalRevenue: 25.00,
      epc: 12.50
    });
  });
});
```

## Performance Considerations

### Database Optimization

```typescript
// Optimized query - only selects needed fields
const clicks = await prisma.clickTrack.findMany({
  where: {
    offerId,
    clickedAt: { gte: sevenDaysAgo }
  },
  select: {
    converted: true,
    revenue: true
  }
});
```

### Caching Strategy

```typescript
import Redis from 'ioredis';

class CachedEPCService extends EPCService {
  private redis = new Redis(process.env.REDIS_URL);
  
  async calculateEPC(offerId: string): Promise<number> {
    const cacheKey = `epc:${offerId}`;
    
    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return parseFloat(cached);
    }
    
    // Calculate and cache
    const epc = await super.calculateEPC(offerId);
    await this.redis.setex(cacheKey, 300, epc.toString()); // 5-minute cache
    
    return epc;
  }
}
```

### Performance Monitoring

```typescript
// Performance monitoring wrapper
class MonitoredEPCService extends EPCService {
  async calculateEPC(offerId: string): Promise<number> {
    const startTime = Date.now();
    
    try {
      const result = await super.calculateEPC(offerId);
      
      // Log successful calculation
      console.log(`EPC calculation completed for ${offerId} in ${Date.now() - startTime}ms`);
      
      return result;
    } catch (error) {
      // Log error with timing
      console.error(`EPC calculation failed for ${offerId} after ${Date.now() - startTime}ms:`, error);
      throw error;
    }
  }
}
```

## Best Practices

### Error Handling

- Always wrap EPC operations in try-catch blocks
- Provide meaningful error messages for debugging
- Consider fallback strategies for non-critical failures

### Performance

- Cache EPC values for frequently accessed offers
- Use batch operations when updating multiple offers
- Monitor query performance and optimize as needed

### Data Integrity

- Always use atomic transactions for updates
- Validate offer existence before calculations
- Handle edge cases (zero clicks, no conversions) gracefully

### Monitoring

- Log EPC calculation times for performance monitoring
- Track error rates and types
- Monitor database transaction success rates

## Troubleshooting

### Common Issues

**EPC calculation returns 0:**
- Check if offer exists and is active
- Verify clicks exist within the 7-day window
- Ensure conversions have proper revenue data

**Performance degradation:**
- Monitor database query performance
- Check for missing indexes on clickTrack table
- Consider implementing Redis caching

**Transaction failures:**
- Verify database connectivity
- Check Prisma transaction timeout settings
- Monitor for deadlocks in concurrent operations

### Debugging

```typescript
// Enable debug logging for EPC operations
const debugEPC = require('debug')('survai:epc');

async calculateEPC(offerId: string): Promise<number> {
  debugEPC(`Calculating EPC for offer ${offerId}`);
  
  const startTime = Date.now();
  const result = await this.performCalculation(offerId);
  
  debugEPC(`EPC calculation completed in ${Date.now() - startTime}ms: ${result}`);
  
  return result;
}
```

---

This comprehensive guide provides complete coverage of the EPC service functionality, enabling developers to effectively integrate and use the real-time EPC calculation system in the SurvAI platform.