name: "Question Controller + AI Integration - M3_PHASE_03"
description: |

## Purpose
Comprehensive PRP for implementing enhanced Question Controller with AI integration, EPC-aware ordering, and Zod validation. This extends the existing question system from survey flow management to full CRUD operations for question management, incorporating AI-generated content generation and EPC-based optimization.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Enhance the existing question system to support full CRUD operations with AI-powered question generation, EPC-based ordering, and Zod validation for admin question management while maintaining existing survey flow functionality.

## Why
- **Business value**: Enables admin management of survey questions with AI assistance
- **AI Integration**: Leverages M3_PHASE_02 AIService for dynamic content generation
- **Performance**: EPC-based question ordering for optimization (stubbed for now)
- **Type Safety**: Migrates from Joi to Zod for better TypeScript integration
- **Extensibility**: Prepares foundation for advanced question management features

## What
A comprehensive question management system implementing:
- Enhanced question controller with CRUD operations
- AI-powered question generation using existing AIService
- EPC-based question ordering (stubbed implementation)
- Zod validation schemas with Express middleware
- Comprehensive unit and integration tests
- Type-safe API endpoints with proper error handling

### Success Criteria
- [ ] API route POST /questions/generate creates questions with AI or static content
- [ ] API route GET /questions/:surveyId returns EPC-ordered questions
- [ ] API route PUT /questions/:id updates existing questions
- [ ] All routes use Zod validation schemas
- [ ] Unit tests cover success, failure, and edge cases
- [ ] EPC service stub exists for future integration
- [ ] Existing survey flow functionality remains intact
- [ ] Code passes lint, type-check, and test validation

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://zod.dev/
  why: Official Zod documentation for TypeScript-first schema validation
  critical: Latest API reference for schema definition and validation
  
- url: https://dev.to/osalumense/validating-request-data-in-expressjs-using-zod-a-comprehensive-guide-3a0j
  why: Comprehensive guide for Zod Express middleware patterns from 2024
  critical: Generic validation middleware implementation patterns
  
- url: https://dev.to/franciscomendes10866/schema-validation-with-zod-and-expressjs-111p
  why: Schema validation best practices with Express.js and Zod
  critical: Error handling and type inference patterns
  
- url: https://blog.logrocket.com/schema-validation-typescript-zod/
  why: Complete Zod schema validation guide for TypeScript
  critical: Advanced schema patterns and type inference
  
- file: backend/src/controllers/questionController.ts
  why: Existing question controller for survey flow - DO NOT REPLACE
  critical: Understand existing patterns to extend, not conflict
  
- file: backend/src/services/questionService.ts
  why: Existing question service with Prisma integration
  critical: Service patterns and database interaction methods
  
- file: backend/src/controllers/trackingController.ts
  why: Controller patterns, error handling, and ApiResponse structure
  critical: Follow established controller architecture
  
- file: backend/src/middleware/trackingValidation.ts
  why: Current Joi validation middleware patterns
  critical: Understand existing validation architecture to migrate to Zod
  
- file: backend/src/utils/trackingValidation.ts
  why: Joi schema definitions and validation utilities
  critical: Understand validation patterns to replicate with Zod
  
- file: backend/src/services/aiService.ts
  why: AI service integration from M3_PHASE_02
  critical: AIService.generateQuestion() method for AI integration
  
- file: backend/prisma/schema.prisma
  why: Question model structure and relationships
  critical: Question fields, types, and database constraints
  
- file: tests/backend/questionController.integration.test.ts
  why: Existing test patterns for question endpoints
  critical: Test structure, setup, and assertion patterns
  
- file: tests/backend/trackingController.integration.test.ts
  why: Integration test patterns with database setup
  critical: Test data creation and cleanup patterns
  
- file: shared/src/types/survey.ts
  why: Question and survey type definitions
  critical: TypeScript interfaces for data structures
```

### Current Codebase Structure
```bash
backend/
├── src/
│   ├── controllers/
│   │   ├── questionController.ts        # EXISTS - Survey flow (getNext, skip, analytics)
│   │   └── trackingController.ts        # EXISTS - Patterns to follow
│   ├── services/
│   │   ├── questionService.ts           # EXISTS - Prisma integration patterns
│   │   ├── aiService.ts                 # EXISTS - AI integration from M3_PHASE_02
│   │   └── trackingService.ts           # EXISTS - Service patterns
│   ├── middleware/
│   │   ├── trackingValidation.ts        # EXISTS - Joi middleware patterns
│   │   └── errorHandler.ts              # EXISTS - Error creation utilities
│   ├── utils/
│   │   └── trackingValidation.ts        # EXISTS - Joi schemas and utilities
│   └── routes/
│       ├── questions.ts                 # EXISTS - Current routes
│       └── tracking.ts                  # EXISTS - Route patterns
shared/
└── src/
    └── types/
        ├── survey.ts                    # EXISTS - Question interfaces
        ├── api.ts                       # EXISTS - ApiResponse patterns
        └── ai.ts                        # EXISTS - AI types from M3_PHASE_02
tests/
└── backend/
    ├── questionController.integration.test.ts  # EXISTS - Test patterns
    └── trackingController.integration.test.ts  # EXISTS - Integration patterns
```

### New Files Structure (Implementation Target)
```bash
backend/
├── src/
│   ├── controllers/
│   │   └── questionController.ts        # EXTEND - Add CRUD methods to existing
│   ├── services/
│   │   ├── questionService.ts           # EXTEND - Add CRUD operations
│   │   └── epcService.ts                # NEW - EPC stub service
│   ├── validators/
│   │   └── questionValidator.ts         # NEW - Zod schemas
│   ├── middleware/
│   │   └── zodValidation.ts             # NEW - Zod middleware
│   └── routes/
│       └── questions.ts                 # EXTEND - Add new routes
tests/
└── backend/
    └── questionController.test.ts       # EXTEND - Add unit tests
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Do not replace existing questionController - EXTEND it
// Current controller handles survey flow (getNext, skip, analytics)
// New controller methods handle admin CRUD operations
// Must coexist without conflicts

// CRITICAL: Zod validation middleware pattern
// Use generic middleware function that returns Express middleware
// Follow pattern from research: validate(schema) => middleware function
// Replace req.body/params/query with validated data

// CRITICAL: AI Service integration 
// Import from '../services/aiService' 
// Use aiService.generateQuestion(context) method
// Handle AI failures gracefully with fallback to manual input

// CRITICAL: EPC Service stubbing
// Create simple stub that returns mock EPC scores
// Structure data for future real EPC integration
// Order questions by epcScore descending

// CRITICAL: Prisma integration patterns
// Follow existing questionService patterns for database operations
// Use proper error handling and transaction management
// Include proper relations loading with survey and user data

// CRITICAL: Error handling consistency
// Use createBadRequestError, createNotFoundError from errorHandler
// Return ApiResponse<T> structure for all responses
// Include timestamp in all responses

// CRITICAL: TypeScript type safety
// Import Question, Survey, QuestionType from @survai/shared
// Use z.infer<typeof schema> for request type inference
// Maintain strict typing throughout the implementation
```

## Implementation Blueprint

### Data Models and Validation Schemas

Create comprehensive Zod schemas for question operations:

```typescript
// backend/src/validators/questionValidator.ts
import { z } from 'zod';

export const questionGenerateSchema = z.object({
  surveyId: z.string().min(1, 'Survey ID is required'),
  useAI: z.boolean().default(false),
  text: z.string().min(1, 'Question text is required').optional(),
  description: z.string().optional(),
  type: z.enum(['CTA_OFFER']).default('CTA_OFFER'),
  config: z.record(z.unknown()).optional(),
  options: z.array(z.unknown()).optional(),
  order: z.number().int().positive().optional(),
  required: z.boolean().default(false),
  logic: z.record(z.unknown()).optional(),
  // AI context fields when useAI is true
  aiContext: z.object({
    userIncome: z.string().optional(),
    employment: z.string().optional(),
    surveyType: z.string().optional(),
    targetAudience: z.string().optional(),
    previousAnswers: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional()
  }).optional()
});

export const questionUpdateSchema = z.object({
  text: z.string().min(1).optional(),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  options: z.array(z.unknown()).optional(),
  order: z.number().int().positive().optional(),
  required: z.boolean().optional(),
  logic: z.record(z.unknown()).optional()
});

export const surveyParamsSchema = z.object({
  surveyId: z.string().min(1, 'Survey ID is required')
});

export const questionParamsSchema = z.object({
  id: z.string().min(1, 'Question ID is required')
});

// Middleware factory function
export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = result.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');
        return next(createBadRequestError(`Validation failed: ${errorMessage}`));
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errorMessage = result.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');
        return next(createBadRequestError(`Parameter validation failed: ${errorMessage}`));
      }
      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### EPC Service Implementation

Create stub service for EPC-based ordering:

```typescript
// backend/src/services/epcService.ts
/**
 * @fileoverview EPC (Earnings Per Click) service stub
 * 
 * Stub implementation for EPC-based question ordering.
 * Will be replaced with real EPC calculations in future phases.
 */

import type { Question } from '@survai/shared';

export interface QuestionEPCScore {
  questionId: string;
  epcScore: number;
  totalClicks: number;
  totalRevenue: number;
  lastUpdated: Date;
}

/**
 * EPC service class for question performance tracking
 */
export class EPCService {
  /**
   * Get EPC scores for questions (STUB IMPLEMENTATION)
   * 
   * @param questionIds - Array of question IDs to get scores for
   * @returns Promise<QuestionEPCScore[]> - Mock EPC scores
   */
  async getQuestionEPCScores(questionIds: string[]): Promise<QuestionEPCScore[]> {
    // STUB: Return mock EPC scores for testing
    // In real implementation, this would query actual performance data
    return questionIds.map((questionId, index) => ({
      questionId,
      epcScore: Math.random() * 10, // Random EPC between 0-10
      totalClicks: Math.floor(Math.random() * 1000),
      totalRevenue: Math.random() * 5000,
      lastUpdated: new Date()
    }));
  }

  /**
   * Order questions by EPC score (STUB IMPLEMENTATION)
   * 
   * @param questions - Array of questions to order
   * @returns Promise<Question[]> - Questions ordered by EPC score descending
   */
  async orderQuestionsByEPC(questions: Question[]): Promise<Question[]> {
    try {
      const questionIds = questions.map(q => q.id);
      const epcScores = await this.getQuestionEPCScores(questionIds);
      
      // Create mapping for quick lookup
      const epcMap = new Map(epcScores.map(score => [score.questionId, score.epcScore]));
      
      // Sort questions by EPC score (descending)
      return [...questions].sort((a, b) => {
        const aEPC = epcMap.get(a.id) || 0;
        const bEPC = epcMap.get(b.id) || 0;
        return bEPC - aEPC;
      });
    } catch (error) {
      // Fallback to original order if EPC ordering fails
      console.warn('EPC ordering failed, falling back to original order:', error);
      return questions;
    }
  }

  /**
   * Calculate EPC score for a question (STUB IMPLEMENTATION)
   * 
   * @param questionId - Question ID to calculate EPC for
   * @returns Promise<number> - EPC score (mock value)
   */
  async calculateQuestionEPC(questionId: string): Promise<number> {
    // STUB: Return mock EPC calculation
    // Real implementation would calculate: totalRevenue / totalClicks
    return Math.random() * 10;
  }
}

// Export singleton instance
export const epcService = new EPCService();
```

### Enhanced Question Controller Implementation

Extend existing controller with new CRUD methods:

```typescript
// backend/src/controllers/questionController.ts
// ADD TO EXISTING FILE - Do not replace existing methods

import { aiService } from '../services/aiService';
import { epcService } from '../services/epcService';
import type { QuestionContext } from '@survai/shared';

/**
 * Generate new question with optional AI content
 * 
 * @param req - Request object with question data (validated by middleware)
 * @param res - Response object
 * @param next - Next function for error handling
 */
async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { 
      surveyId, 
      useAI, 
      text, 
      description, 
      type, 
      config, 
      options, 
      order, 
      required, 
      logic,
      aiContext 
    } = req.body;

    let questionText = text;
    let questionDescription = description;
    let aiVersions = null;

    // Generate AI content if requested
    if (useAI && aiContext) {
      try {
        const generatedQuestion = await aiService.generateQuestion(aiContext);
        questionText = generatedQuestion.text;
        questionDescription = generatedQuestion.description;
        
        // Store AI generation metadata
        aiVersions = {
          generated: true,
          provider: generatedQuestion.provider,
          confidence: generatedQuestion.confidence,
          generatedAt: generatedQuestion.generatedAt,
          originalContext: aiContext
        };
      } catch (error) {
        // If AI generation fails, fall back to provided text
        if (!text) {
          return next(createBadRequestError('AI generation failed and no fallback text provided'));
        }
        console.warn('AI generation failed, using provided text:', error);
      }
    }

    // Validate required fields after AI processing
    if (!questionText) {
      return next(createBadRequestError('Question text is required'));
    }

    // Create question using enhanced service
    const question = await questionService.createQuestion({
      surveyId,
      type: type || 'CTA_OFFER',
      text: questionText,
      description: questionDescription,
      config: config || {},
      options: options || [],
      order: order || 1,
      required: required || false,
      logic: logic || null,
      aiVersions
    });

    const apiResponse: ApiResponse<Question> = {
      success: true,
      data: question,
      timestamp: new Date().toISOString()
    };

    res.status(201).json(apiResponse);
  } catch (error) {
    next(error);
  }
}

/**
 * Update existing question
 * 
 * @param req - Request object with question updates (validated by middleware)
 * @param res - Response object
 * @param next - Next function for error handling
 */
async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await questionService.updateQuestion(id, updateData);

    const apiResponse: ApiResponse<Question> = {
      success: true,
      data: question,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(apiResponse);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return next(createNotFoundError('Question not found'));
    }
    next(error);
  }
}

/**
 * Get questions for survey ordered by EPC
 * 
 * @param req - Request object with survey ID (validated by middleware)
 * @param res - Response object
 * @param next - Next function for error handling
 */
async getQuestionsBySurvey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { surveyId } = req.params;

    // Get questions for survey
    const questions = await questionService.getQuestionsBySurvey(surveyId);

    // Order by EPC score (using stub service)
    const orderedQuestions = await epcService.orderQuestionsByEPC(questions);

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

### List of Tasks to Complete the PRP

```yaml
Task 1: Create EPC Service Stub
CREATE backend/src/services/epcService.ts:
  - IMPLEMENT EPCService class with stub methods
  - PROVIDE getQuestionEPCScores for mock EPC data
  - IMPLEMENT orderQuestionsByEPC for question sorting
  - EXPORT singleton instance for controller use

Task 2: Create Zod Validation Schemas
CREATE backend/src/validators/questionValidator.ts:
  - DEFINE questionGenerateSchema for POST /questions/generate
  - DEFINE questionUpdateSchema for PUT /questions/:id
  - DEFINE parameter validation schemas
  - IMPLEMENT validateRequest and validateParams middleware factories
  - FOLLOW patterns from trackingValidation.ts but with Zod

Task 3: Extend Question Service
MODIFY backend/src/services/questionService.ts:
  - ADD createQuestion method for new question creation
  - ADD updateQuestion method for question updates
  - ADD getQuestionsBySurvey method for survey questions retrieval
  - MAINTAIN existing getNextQuestion functionality
  - FOLLOW existing Prisma patterns and error handling

Task 4: Extend Question Controller
MODIFY backend/src/controllers/questionController.ts:
  - ADD generate method for AI-powered question creation
  - ADD updateQuestion method for question updates
  - ADD getQuestionsBySurvey method for EPC-ordered retrieval
  - MAINTAIN existing getNext, skip, getAnalytics methods
  - IMPORT and use aiService, epcService

Task 5: Update Question Routes
MODIFY backend/src/routes/questions.ts:
  - ADD POST /generate route with validation middleware
  - ADD PUT /:id route with validation middleware
  - ADD GET /:surveyId route with parameter validation
  - MAINTAIN existing routes for survey flow
  - BIND new controller methods

Task 6: Create Comprehensive Unit Tests
CREATE tests/backend/questionController.test.ts:
  - IMPLEMENT tests for generate method (AI and static paths)
  - IMPLEMENT tests for updateQuestion method
  - IMPLEMENT tests for getQuestionsBySurvey method
  - IMPLEMENT validation failure tests
  - IMPLEMENT AI service integration tests
  - FOLLOW existing test patterns from trackingController tests

Task 7: Install and Configure Dependencies
MODIFY backend/package.json:
  - ENSURE zod dependency is installed
  - UPDATE types if needed for Zod integration

Task 8: Integration Testing
EXTEND tests/backend/questionController.integration.test.ts:
  - ADD integration tests for new endpoints
  - TEST database interactions and validation
  - VERIFY EPC ordering functionality
  - MAINTAIN existing integration tests
```

### Task Implementation Details

#### Task 1: EPC Service Stub Implementation
```typescript
// Implementation focus: Simple stub with future-ready interface
// Key patterns: Service class with singleton export
// Error handling: Graceful fallback to original order
// Data structure: QuestionEPCScore interface for typed responses
```

#### Task 2: Zod Validation Schemas
```typescript
// Migration pattern: Convert Joi patterns to Zod equivalents
// Key features: Type inference with z.infer<typeof schema>
// Error handling: Structured validation errors with field paths
// Middleware pattern: Factory functions returning Express middleware
```

#### Task 3: Question Service Extensions
```typescript
// Pattern: Extend existing service without breaking changes
// Database: Use existing Prisma patterns and error handling
// Relations: Include survey and user relations where appropriate
// Validation: Service-level validation before database operations
```

## Integration Points

```yaml
AI_SERVICE:
  - import: '../services/aiService'
  - method: aiService.generateQuestion(context)
  - error_handling: Graceful fallback to manual text input
  - context_mapping: Map request aiContext to QuestionContext

EPC_SERVICE:
  - location: backend/src/services/epcService.ts
  - interface: QuestionEPCScore for typed responses
  - ordering: orderQuestionsByEPC method for question sorting
  - fallback: Return original order if EPC fails

DATABASE:
  - orm: Prisma with existing patterns
  - transactions: Use for data consistency
  - relations: Include survey, creator, updater relationships
  - indexes: Leverage existing question indexes

VALIDATION:
  - library: Zod for TypeScript-first validation
  - pattern: Factory middleware functions
  - error_format: Structured errors with field paths
  - type_safety: z.infer for request type inference

TESTING:
  - framework: Jest with ts-jest preset
  - integration: Supertest for API endpoint testing
  - database: Test database with cleanup in beforeAll/afterAll
  - patterns: Follow existing trackingController test structure
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run type-check                    # TypeScript compilation
npm run lint                          # ESLint fixes

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```bash
# Run unit tests for question controller
npm run test -- tests/backend/questionController.test.ts

# Expected: All tests pass
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Tests
```bash
# Run integration tests with database
npm run test -- tests/backend/questionController.integration.test.ts

# Expected: All integration tests pass
# If failing: Check database setup, test data creation, cleanup
```

### Level 4: Manual API Testing
```bash
# Start development server
npm run dev

# Test question generation (static)
curl -X POST http://localhost:8000/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{"surveyId":"test-survey","useAI":false,"text":"What interests you most?"}'

# Test question generation (AI)
curl -X POST http://localhost:8000/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{"surveyId":"test-survey","useAI":true,"aiContext":{"userIncome":"50000-75000","employment":"full-time"}}'

# Test get questions by survey (EPC ordered)
curl http://localhost:8000/api/questions/test-survey-id

# Test question update
curl -X PUT http://localhost:8000/api/questions/test-question-id \
  -H "Content-Type: application/json" \
  -d '{"text":"Updated question text"}'
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] POST /questions/generate works with both AI and static input
- [ ] GET /questions/:surveyId returns EPC-ordered questions
- [ ] PUT /questions/:id updates questions successfully
- [ ] Zod validation provides clear error messages
- [ ] AI service integration handles failures gracefully
- [ ] EPC service stub orders questions correctly
- [ ] Existing survey flow functionality still works
- [ ] Database operations maintain data integrity

---

## Anti-Patterns to Avoid
- ❌ Don't replace existing questionController methods - extend only
- ❌ Don't break existing survey flow functionality
- ❌ Don't skip validation middleware on any endpoint
- ❌ Don't ignore AI service failures - provide fallbacks
- ❌ Don't hardcode EPC scores - use service abstraction
- ❌ Don't skip error handling for database operations
- ❌ Don't ignore TypeScript errors - maintain strict typing

## Quality Assessment

**Confidence Score: 9/10**

This PRP provides:
- ✅ Complete implementation context from codebase analysis
- ✅ Specific Zod migration patterns from Joi validation research
- ✅ Clear AI service integration with fallback handling
- ✅ EPC service stub with future-ready interface
- ✅ Comprehensive testing strategy following existing patterns
- ✅ TypeScript type safety throughout implementation
- ✅ Clear task breakdown with implementation order
- ✅ Validation loops with executable commands
- ✅ Integration points clearly defined
- ✅ Extension approach that preserves existing functionality

The implementation should succeed in one pass given the thorough context, existing pattern analysis, and validation loops provided.