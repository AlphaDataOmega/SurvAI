# EPC Service API Reference

## Overview

The EPC (Earnings Per Click) Service provides real-time calculation and tracking of offer performance metrics. This service calculates EPC values based on 7-day rolling windows of click and conversion data, enabling dynamic offer optimization and revenue maximization.

**New in M3_PHASE_05**: The service now includes question-level EPC calculation and automatic question ordering by performance, completing the feedback loop between click tracking, EPC calculation, and intelligent survey flow optimization.

**Dashboard Integration**: The EPC service is now fully integrated with the Admin Dashboard for real-time metrics visualization, interactive charts, and comprehensive analytics. See [Dashboard API Reference](DASHBOARD_API_REFERENCE.md) for dashboard-specific functionality.

## Table of Contents

- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Core EPC Functions](#core-epc-functions)
- [Question Ordering Functions](#question-ordering-functions)
- [Utility Functions](#utility-functions)
- [Code Examples](#code-examples)
- [Testing](#testing)
- [Performance Considerations](#performance-considerations)

## Authentication

EPC service functions are internal service methods and do not require external authentication. However, when exposed via API endpoints, they should use the existing JWT authentication middleware.

```typescript
// Protected EPC endpoints would use:
app.use('/api/epc', authenticateJWT);
```

## Error Handling

All EPC service methods follow consistent error handling patterns:

### Error Types

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

### Error Response Format

```json
{
  "success": false,
  "error": "Failed to calculate EPC: Offer offer-123 not found",
  "code": "OFFER_NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

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

#### Behavior

- **Time Window**: Calculates EPC based on the last 7 days of data
- **Zero Clicks**: Returns `0.0` when no clicks exist in the time window
- **No Conversions**: Returns `0.0` when clicks exist but no conversions occurred
- **Data Source**: Uses `clickTrack` table with `clickedAt >= 7 days ago`

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

#### Error Conditions

```typescript
// Invalid offer ID
await epcService.calculateEPC(''); 
// Throws: "Offer ID is required and must be a string"

await epcService.calculateEPC('non-existent'); 
// Throws: "Offer non-existent not found"

// Database connection failure
// Throws: "Failed to calculate EPC: Database connection failed"
```

---

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

#### Returns

- **Type**: `Promise<void>`
- **Description**: Promise that resolves when the update is complete

#### Behavior

- **Atomic Operation**: Uses Prisma `$transaction` for data consistency
- **Metrics Merge**: Preserves existing metrics while updating EPC data
- **Recalculation**: Calls `calculateEPC` internally for current values
- **Database Update**: Updates the `offer.metrics` JSON field

#### Transaction Flow

1. **Fetch Current Offer**: Retrieves existing metrics to preserve non-EPC data
2. **Calculate New EPC**: Gets 7-day performance data and calculates current EPC
3. **Merge Metrics**: Combines existing metrics with new EPC calculations
4. **Atomic Update**: Updates offer metrics within a database transaction

#### Examples

```typescript
import { epcService } from '../services/epcService';

// Update EPC metrics for an offer
try {
  await epcService.updateEPC('offer-123');
  console.log('EPC metrics updated successfully');
} catch (error) {
  console.error('EPC update failed:', error.message);
}

// Update multiple offers
const offerIds = ['offer-1', 'offer-2', 'offer-3'];
for (const offerId of offerIds) {
  try {
    await epcService.updateEPC(offerId);
    console.log(`Updated EPC for ${offerId}`);
  } catch (error) {
    console.error(`Failed to update EPC for ${offerId}:`, error.message);
  }
}
```

#### Metrics Structure

The updated metrics JSON includes:

```typescript
interface UpdatedMetrics {
  // Existing metrics preserved
  ...existingMetrics,
  
  // New EPC calculation data
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  epc: number;
  lastUpdated: Date;
}
```

#### Error Conditions

```typescript
// Invalid offer ID
await epcService.updateEPC('');
// Throws: "Offer ID is required and must be a string"

// Offer not found
await epcService.updateEPC('non-existent');
// Throws: "Failed to update EPC: Offer non-existent not found"

// Transaction failure
// Throws: "Failed to update EPC: Transaction failed"
```

---

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

#### Error Conditions

```typescript
// Invalid question ID - graceful fallback
await epcService.getQuestionEPC(''); 
// Returns: 0 (graceful fallback)

await epcService.getQuestionEPC(null); 
// Returns: 0 (graceful fallback)

// Calculation failure - graceful fallback
// Returns: 0 (prevents blocking survey flow)
```

---

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

#### Examples

```typescript
import { epcService } from '../services/epcService';
import { questionService } from '../services/questionService';

// Order questions by EPC for a survey
try {
  const questions = await questionService.getQuestionsBySurvey('survey-123');
  const orderedQuestions = await epcService.orderQuestionsByEPCScore(questions);
  
  console.log('Questions ordered by EPC:');
  orderedQuestions.forEach((q, index) => {
    console.log(`${index + 1}. ${q.text} (Order: ${q.order})`);
  });
} catch (error) {
  console.error('Question ordering failed:', error.message);
  // Questions fall back to static order automatically
}

// Handle empty question arrays
const emptyResult = await epcService.orderQuestionsByEPCScore([]);
console.log(emptyResult); // []
```

#### Performance Characteristics

- **Parallel EPC Calculation**: Concurrent processing for optimal speed
- **Fallback Performance**: Static ordering if EPC calculation fails
- **Memory Efficient**: No persistent storage of question EPCs
- **Cache Friendly**: Leverages existing offer EPC calculations

---

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

## Code Examples

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

### API Endpoint Integration

```typescript
import express from 'express';
import { epcService } from '../services/epcService';
import { questionService } from '../services/questionService';

const router = express.Router();

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

// Survey analytics with EPC data
router.get('/analytics/survey/:surveyId/epc', async (req, res, next) => {
  try {
    const { surveyId } = req.params;
    
    const questions = await questionService.getQuestionsBySurvey(surveyId);
    
    // Calculate EPC analytics for each question
    const questionAnalytics = await Promise.all(
      questions.map(async (question) => ({
        questionId: question.id,
        text: question.text,
        staticOrder: question.order,
        epcScore: await epcService.getQuestionEPC(question.id)
      }))
    );
    
    // Sort by EPC for analytics display
    questionAnalytics.sort((a, b) => b.epcScore - a.epcScore);
    
    res.json({
      success: true,
      data: {
        surveyId,
        totalQuestions: questions.length,
        questionAnalytics,
        summary: {
          questionsWithEPC: questionAnalytics.filter(q => q.epcScore > 0).length,
          questionsWithoutEPC: questionAnalytics.filter(q => q.epcScore === 0).length,
          averageEPC: questionAnalytics.reduce((sum, q) => sum + q.epcScore, 0) / questionAnalytics.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});
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

    it('should handle EPC calculation failures gracefully', async () => {
      mockEpcService.getQuestionEPC.mockRejectedValue(new Error('EPC failed'));
      
      const result = await epcService.orderQuestionsByEPCScore(mockQuestions);
      
      // Should fall back to static order
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

### Database Queries

The EPC service is optimized for performance:

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

### Caching Recommendations

For high-traffic scenarios, consider implementing caching:

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

### Batch Operations

For updating multiple offers efficiently:

```typescript
async function batchUpdateEPC(offerIds: string[], batchSize: number = 10) {
  const batches = [];
  for (let i = 0; i < offerIds.length; i += batchSize) {
    batches.push(offerIds.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    await Promise.all(
      batch.map(offerId => epcService.updateEPC(offerId))
    );
  }
}
```

### Monitoring and Metrics

Track EPC service performance:

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

---

This API reference provides comprehensive coverage of the EPC service functionality, enabling developers to effectively integrate and use the real-time EPC calculation system in the SurvAI platform.