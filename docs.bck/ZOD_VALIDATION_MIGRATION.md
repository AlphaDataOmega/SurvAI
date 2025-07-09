# Zod Validation Migration Guide

## Overview

This document provides a comprehensive guide for migrating from Joi to Zod validation in the SurvAI project. The migration is part of M3_PHASE_03 implementation, providing TypeScript-first validation with enhanced type safety and better integration with the existing codebase.

## Why Migrate to Zod?

### Benefits of Zod

1. **TypeScript-First**: Built specifically for TypeScript with automatic type inference
2. **Better DX**: Superior developer experience with IntelliSense and type checking
3. **Runtime Safety**: Type validation at runtime with compile-time type checking
4. **Smaller Bundle**: More tree-shakeable than Joi
5. **Modern API**: Chainable API with better error messages

### Comparison: Joi vs Zod

| Feature | Joi | Zod |
|---------|-----|-----|
| TypeScript Support | Manual types | Automatic inference |
| Bundle Size | Larger | Smaller |
| API Style | Object-based | Chainable |
| Type Inference | Manual | Automatic |
| Error Messages | Good | Excellent |

## Migration Strategy

### Phase 1: New Features (Completed)
- ✅ Implement Zod validation for new Question Controller endpoints
- ✅ Create Zod middleware factories
- ✅ Establish patterns for future migrations

### Phase 2: Gradual Migration (Future)
- Migrate existing validation schemas one by one
- Maintain backward compatibility during transition
- Update tests incrementally

### Phase 3: Complete Migration (Future)
- Remove Joi dependencies
- Update all validation schemas
- Finalize documentation

## Implementation Patterns

### Zod Schema Definition

```typescript
// backend/src/validators/questionValidator.ts
import { z } from 'zod';

// Define schema with validation rules
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
  aiContext: z.object({
    userIncome: z.string().optional(),
    employment: z.string().optional(),
    surveyType: z.string().optional(),
    targetAudience: z.string().optional(),
    previousAnswers: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional()
  }).optional()
});

// Type inference
export type QuestionGenerateRequest = z.infer<typeof questionGenerateSchema>;
```

### Middleware Factory Pattern

```typescript
// Generic validation middleware factory
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

// Pre-configured middleware exports
export const validateQuestionGenerate = validateRequest(questionGenerateSchema);
export const validateQuestionUpdate = validateRequest(questionUpdateSchema);
```

### Route Integration

```typescript
// backend/src/routes/questions.ts
import { 
  validateQuestionGenerate,
  validateQuestionUpdate,
  validateSurveyParams,
  validateQuestionParams
} from '../validators/questionValidator';

// Apply validation middleware to routes
router.post('/generate', 
  validateQuestionGenerate, 
  questionController.generate
);

router.put('/:id', 
  validateQuestionParams,
  validateQuestionUpdate, 
  questionController.updateQuestion
);
```

## Migration Examples

### Before: Joi Validation

```typescript
// Old pattern with Joi
const Joi = require('joi');

const trackClickSchema = Joi.object({
  sessionId: Joi.string().required(),
  questionId: Joi.string().required(),
  offerId: Joi.string().required(),
  buttonVariantId: Joi.string().required(),
  timestamp: Joi.number().optional(),
  userAgent: Joi.string().optional(),
  ipAddress: Joi.string().optional()
});

// Manual type definition
interface TrackClickRequest {
  sessionId: string;
  questionId: string;
  offerId: string;
  buttonVariantId: string;
  timestamp?: number;
  userAgent?: string;
  ipAddress?: string;
}

// Validation middleware
export const validateTrackClick = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = trackClickSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Click tracking validation failed: ${errorMessage}`));
  }

  req.body = value;
  next();
};
```

### After: Zod Validation

```typescript
// New pattern with Zod
import { z } from 'zod';

const trackClickSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  offerId: z.string().min(1, 'Offer ID is required'),
  buttonVariantId: z.string().min(1, 'Button variant ID is required'),
  timestamp: z.number().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional()
});

// Automatic type inference
export type TrackClickRequest = z.infer<typeof trackClickSchema>;

// Generic validation middleware
export const validateTrackClick = validateRequest(trackClickSchema);
```

## Error Handling

### Zod Error Structure

```typescript
// Zod validation error
{
  "success": false,
  "error": "Validation failed: surveyId: Survey ID is required, text: Question text must be at least 1 character",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Message Formatting

```typescript
const formatZodError = (error: z.ZodError): string => {
  return error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
};
```

## Type Safety Benefits

### Automatic Type Inference

```typescript
// Schema definition
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email()
});

// Automatic type inference
type User = z.infer<typeof userSchema>;
// Results in: { name: string; age: number; email: string; }

// Request handler with type safety
async function createUser(req: Request, res: Response) {
  // req.body is now properly typed as User
  const { name, age, email } = req.body;
  // TypeScript knows the exact types of these fields
}
```

### Compile-time Validation

```typescript
// TypeScript catches errors at compile time
const validData = {
  name: "John",
  age: 30,
  email: "john@example.com"
};

const invalidData = {
  name: "John",
  age: "thirty", // TypeScript error: Type 'string' is not assignable to type 'number'
  email: "invalid-email" // Runtime validation will catch this
};
```

## Best Practices

### Schema Organization

```typescript
// Group related schemas
export const questionSchemas = {
  generate: questionGenerateSchema,
  update: questionUpdateSchema,
  params: questionParamsSchema
};

// Create reusable components
const baseQuestionFields = {
  text: z.string().min(1, 'Text is required'),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional()
};

export const createQuestionSchema = z.object({
  ...baseQuestionFields,
  surveyId: z.string().min(1, 'Survey ID is required')
});

export const updateQuestionSchema = z.object(baseQuestionFields).partial();
```

### Default Values

```typescript
// Provide sensible defaults
const questionSchema = z.object({
  surveyId: z.string().min(1),
  useAI: z.boolean().default(false), // Default to false
  type: z.enum(['CTA_OFFER']).default('CTA_OFFER'), // Default type
  required: z.boolean().default(false), // Default to optional
  order: z.number().int().positive().optional()
});
```

### Custom Validation

```typescript
// Custom validation functions
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number');

// Transform functions
const emailSchema = z.string()
  .email('Invalid email format')
  .transform(email => email.toLowerCase());
```

## Testing Strategies

### Schema Testing

```typescript
// Test schema validation
describe('questionGenerateSchema', () => {
  it('should validate valid question data', () => {
    const validData = {
      surveyId: 'survey-123',
      text: 'What interests you?',
      useAI: false
    };
    
    const result = questionGenerateSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.surveyId).toBe('survey-123');
      expect(result.data.useAI).toBe(false);
    }
  });

  it('should reject invalid data', () => {
    const invalidData = {
      surveyId: '', // Empty string should fail
      text: 'Valid text'
    };
    
    const result = questionGenerateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Survey ID is required');
    }
  });
});
```

### Integration Testing

```typescript
// Test middleware integration
describe('Zod validation middleware', () => {
  it('should validate request and proceed', async () => {
    const response = await request(app)
      .post('/api/questions/generate')
      .send({
        surveyId: 'test-survey',
        text: 'Test question',
        useAI: false
      })
      .expect(201);

    expect(response.body.success).toBe(true);
  });

  it('should return validation error for invalid data', async () => {
    const response = await request(app)
      .post('/api/questions/generate')
      .send({
        surveyId: '', // Invalid empty string
        text: 'Test question'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Survey ID is required');
  });
});
```

## Performance Considerations

### Bundle Size Impact

```typescript
// Zod is more tree-shakeable than Joi
import { z } from 'zod'; // Only imports what's used

// Before (Joi)
const Joi = require('joi'); // Imports entire library
```

### Runtime Performance

```typescript
// Zod validation is generally faster
const schema = z.object({
  id: z.string(),
  count: z.number()
});

// Fast validation with safeParse
const result = schema.safeParse(data);
if (result.success) {
  // Use validated data
  const { id, count } = result.data;
}
```

## Common Patterns

### Optional Fields with Defaults

```typescript
const configSchema = z.object({
  maxButtons: z.number().int().positive().default(3),
  buttonLayout: z.enum(['vertical', 'horizontal']).default('vertical'),
  theme: z.string().default('default')
});
```

### Nested Object Validation

```typescript
const questionWithMetadataSchema = z.object({
  text: z.string().min(1),
  metadata: z.object({
    category: z.string(),
    tags: z.array(z.string()),
    difficulty: z.number().min(1).max(5)
  }).optional()
});
```

### Array Validation

```typescript
const questionListSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    order: z.number()
  })).min(1, 'At least one question is required')
});
```

## Troubleshooting

### Common Issues

#### Type Inference Problems
```typescript
// Problem: Type not inferred correctly
const schema = z.object({
  data: z.unknown() // Too generic
});

// Solution: Be more specific
const schema = z.object({
  data: z.record(z.string()) // Object with string values
});
```

#### Circular References
```typescript
// Problem: Circular type references
type Node = {
  id: string;
  children: Node[];
};

// Solution: Use z.lazy()
const nodeSchema: z.ZodType<Node> = z.lazy(() => z.object({
  id: z.string(),
  children: z.array(nodeSchema)
}));
```

### Debugging Tips

```typescript
// Use safeParse for debugging
const result = schema.safeParse(data);
if (!result.success) {
  console.log('Validation errors:', result.error.issues);
  result.error.issues.forEach(issue => {
    console.log(`Path: ${issue.path.join('.')}`);
    console.log(`Message: ${issue.message}`);
  });
}
```

## Future Considerations

### Complete Migration Roadmap

1. **Phase 1**: New features (✅ Completed)
2. **Phase 2**: Migrate tracking validation
3. **Phase 3**: Migrate authentication validation
4. **Phase 4**: Remove Joi dependencies

### Advanced Features

- Schema composition and inheritance
- Custom error messages with i18n
- Async validation for database checks
- Schema versioning for API evolution

## Conclusion

The migration to Zod provides significant benefits in type safety, developer experience, and maintainability. The implementation in M3_PHASE_03 establishes solid patterns that can be used throughout the application for consistent, type-safe validation.

### Key Takeaways

- ✅ **Type Safety**: Automatic type inference eliminates manual type definitions
- ✅ **Better DX**: Superior IntelliSense and compile-time error checking
- ✅ **Consistency**: Standardized error handling and validation patterns
- ✅ **Performance**: Smaller bundle size and faster runtime validation
- ✅ **Maintainability**: Cleaner, more readable validation code

The foundation is now in place for gradually migrating the rest of the application to Zod validation while maintaining backward compatibility and code quality.