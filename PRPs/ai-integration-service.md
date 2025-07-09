name: "AI Integration Service (OpenAI + Ollama) - M3_PHASE_02"
description: |

## Purpose
Comprehensive PRP for implementing a unified AI integration layer supporting OpenAI and Ollama with fallback logic, specifically designed for financial assistance survey content generation. This implementation provides context-rich guidance for one-pass implementation success.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Create a modular, extendable AI service in the backend that supports multiple providers (OpenAI, Ollama) with fallback logic and includes the basic function `generateQuestion(context: QuestionContext): Promise<GeneratedQuestion>` for financial assistance survey content generation.

## Why
- **Business value**: Enables AI-driven copy generation and adaptive question logic for SurvAI
- **Integration**: Powers future AI-driven features with unified interface
- **Reliability**: Provides fallback to local Ollama if OpenAI fails
- **Performance**: Logs provider performance metrics for optimization

## What
A TypeScript service implementing:
- Provider-agnostic AI service class
- OpenAI integration with official library
- Ollama integration with fallback logic
- Content sanitization for XSS/injection prevention
- Performance logging and error handling
- Unit tests for all key paths

### Success Criteria
- [ ] AIService can generate survey questions with OpenAI
- [ ] Fallback to Ollama works when OpenAI fails
- [ ] All AI output is sanitized before storage
- [ ] Unit tests cover success, fallback, and error scenarios
- [ ] Environment configuration via .env
- [ ] Performance metrics logged per provider
- [ ] All Necessary Documentation has been written or updated

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://github.com/openai/openai-node
  why: Official OpenAI Node.js library with TypeScript support
  
- url: https://github.com/ollama/ollama-js
  why: Official Ollama JavaScript library with TypeScript support
  
- url: https://www.npmjs.com/package/openai
  section: Chat Completions API and error handling
  critical: Use official v5.8.2+ with proper TypeScript support
  
- url: https://www.npmjs.com/package/ollama
  section: Generate API and streaming support
  critical: AbortError handling for stream timeouts
  
- url: https://blog.arcjet.com/protecting-your-node-js-app-from-sql-injection-xss-attacks/
  why: XSS prevention and input sanitization patterns
  critical: DOMPurify, js-xss, or sanitize-html for content sanitization
  
- file: backend/src/services/authService.ts
  why: Service class structure, error handling, and singleton pattern
  
- file: backend/src/services/questionService.ts
  why: Database integration, error handling, and async patterns
  
- file: backend/src/services/trackingService.ts
  why: External service integration and performance logging
  
- file: backend/src/types/
  why: Empty - types go in shared/src/types/
  
- file: shared/src/types/common.ts
  why: Base types, ID, timestamps, and utility types
  
- file: shared/src/types/api.ts
  why: API response patterns and error handling
  
- file: backend/src/utils/validateEnv.ts
  why: Environment variable validation with Joi
  
- file: tests/backend/authService.test.ts
  why: Jest testing patterns, mocking, and describe structure
  
- file: tests/backend/questionService.test.ts
  why: Service testing with mocks and spies
```

### Current Codebase Structure
```bash
backend/
├── src/
│   ├── services/
│   │   ├── authService.ts          # Class + singleton pattern
│   │   ├── questionService.ts      # Database integration
│   │   └── trackingService.ts      # External service integration
│   ├── types/                      # Empty - types in shared/
│   └── utils/
│       ├── logger.ts               # Winston logging
│       └── validateEnv.ts          # Joi validation
shared/
├── src/
│   └── types/
│       ├── common.ts               # Base types, ID, timestamps
│       └── api.ts                  # API response patterns
tests/
└── backend/
    ├── authService.test.ts         # Jest patterns
    └── questionService.test.ts     # Mocking and spies
```

### Desired Codebase Structure with Files to be Added
```bash
backend/
├── src/
│   ├── services/
│   │   ├── authService.ts          # Existing
│   │   ├── questionService.ts      # Existing
│   │   ├── trackingService.ts      # Existing
│   │   └── aiService.ts            # NEW - Main AI service
│   ├── types/                      # Empty - types in shared/
│   └── utils/
│       ├── logger.ts               # Existing
│       └── validateEnv.ts          # Existing
shared/
├── src/
│   └── types/
│       ├── common.ts               # Existing
│       ├── api.ts                  # Existing
│       └── ai.ts                   # NEW - AI types
tests/
└── backend/
    ├── authService.test.ts         # Existing
    ├── questionService.test.ts     # Existing
    └── aiService.test.ts           # NEW - AI service tests
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: OpenAI library v5.8.2+ requires proper error handling
// AbortError is thrown when streams are aborted
// Use one client per stream for timeout management

// CRITICAL: Ollama returns different error formats than OpenAI
// Normalize error responses in service layer

// CRITICAL: All AI output MUST be sanitized before storage
// Use DOMPurify, js-xss, or sanitize-html

// CRITICAL: Environment validation required for API keys
// Use existing validateEnv.ts pattern with Joi

// CRITICAL: Service class pattern - class + singleton export
// Follow existing pattern in authService.ts

// CRITICAL: Database integration uses Prisma ORM
// Not needed for this phase but prepare for future integration

// CRITICAL: JSDoc comments required (Google style)
// Follow existing pattern in all services

// CRITICAL: TypeScript strict mode enabled
// All functions must have proper typing
```

## Implementation Blueprint

### Data Models and Structure

Create the core data models ensuring type safety and consistency:

```typescript
// shared/src/types/ai.ts
export interface QuestionContext {
  userIncome?: string;
  employment?: string;
  surveyType?: string;
  previousAnswers?: Record<string, any>;
  targetAudience?: string;
}

export interface GeneratedQuestion {
  text: string;
  description?: string;
  suggestions?: string[];
  confidence: number;
  provider: 'openai' | 'ollama';
  generatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AIProvider {
  name: 'openai' | 'ollama';
  enabled: boolean;
  priority: number;
  config: OpenAIConfig | OllamaConfig;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature?: number;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout?: number;
}

export interface AIServiceMetrics {
  provider: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  lastUsed: Date;
}
```

### List of Tasks to Complete the PRP

```yaml
Task 1: Install Dependencies
MODIFY backend/package.json:
  - ADD "openai": "^5.8.2" to dependencies
  - ADD "ollama": "^0.5.16" to dependencies  
  - ADD "sanitize-html": "^2.11.0" to dependencies
  - ADD "@types/sanitize-html": "^2.9.5" to devDependencies

Task 2: Create AI Types
CREATE shared/src/types/ai.ts:
  - DEFINE QuestionContext interface with financial survey fields
  - DEFINE GeneratedQuestion interface with provider metadata
  - DEFINE AIProvider and config interfaces
  - DEFINE AIServiceMetrics for performance tracking
  - EXPORT all types for service use

Task 3: Update Environment Validation
MODIFY backend/src/utils/validateEnv.ts:
  - ADD OPENAI_API_KEY validation (required when enabled)
  - ADD OLLAMA_BASE_URL validation with default
  - ADD OLLAMA_MODEL validation with default
  - UPDATE schema to include AI provider configs

Task 4: Create AI Service Implementation
CREATE backend/src/services/aiService.ts:
  - IMPLEMENT AIService class with provider management
  - IMPLEMENT generateQuestion method with fallback logic
  - IMPLEMENT sanitizeContent utility function
  - IMPLEMENT provider performance logging
  - IMPLEMENT error handling and retry logic
  - FOLLOW existing service patterns from authService.ts

Task 5: Create Unit Tests
CREATE tests/backend/aiService.test.ts:
  - IMPLEMENT tests for OpenAI success scenario
  - IMPLEMENT tests for Ollama fallback scenario
  - IMPLEMENT tests for error handling
  - IMPLEMENT tests for content sanitization
  - IMPLEMENT integration tests for complete flow
  - FOLLOW existing test patterns from authService.test.ts

Task 6: Update Environment Configuration
MODIFY .env.example:
  - ADD OpenAI configuration section
  - ADD Ollama configuration section
  - ADD example values with security notes
  - UPDATE documentation comments

Task 7: Add Type Exports
MODIFY shared/src/index.ts:
  - ADD export * from './types/ai';
  - ENSURE types are available to backend services
```

### Task Implementation Details

#### Task 1: Install Dependencies
```bash
# Install OpenAI official library with TypeScript support
npm install openai@^5.8.2

# Install Ollama JavaScript library
npm install ollama@^0.5.16

# Install sanitization library for XSS prevention
npm install sanitize-html@^2.11.0
npm install --save-dev @types/sanitize-html@^2.9.5
```

#### Task 2: Create AI Types (shared/src/types/ai.ts)
```typescript
/**
 * @fileoverview AI service types and interfaces
 * 
 * Type definitions for AI integration layer supporting OpenAI and Ollama
 * for financial assistance survey content generation.
 */

import type { BaseEntity } from './common';

export interface QuestionContext {
  /** User's income bracket */
  userIncome?: string;
  /** Employment status */
  employment?: string;
  /** Type of survey being conducted */
  surveyType?: string;
  /** Previous answers for context */
  previousAnswers?: Record<string, any>;
  /** Target audience description */
  targetAudience?: string;
  /** Additional context metadata */
  metadata?: Record<string, any>;
}

export interface GeneratedQuestion {
  /** Generated question text */
  text: string;
  /** Optional description or context */
  description?: string;
  /** Suggested follow-up questions */
  suggestions?: string[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Provider that generated the question */
  provider: 'openai' | 'ollama';
  /** Generation timestamp */
  generatedAt: Date;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface AIProvider {
  /** Provider name */
  name: 'openai' | 'ollama';
  /** Whether provider is enabled */
  enabled: boolean;
  /** Priority order (lower = higher priority) */
  priority: number;
  /** Provider-specific configuration */
  config: OpenAIConfig | OllamaConfig;
}

export interface OpenAIConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Model to use */
  model: string;
  /** Maximum tokens for response */
  maxTokens: number;
  /** Temperature for randomness (0-1) */
  temperature?: number;
}

export interface OllamaConfig {
  /** Ollama base URL */
  baseUrl: string;
  /** Model to use */
  model: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export interface AIServiceMetrics {
  /** Provider name */
  provider: string;
  /** Total request count */
  requestCount: number;
  /** Successful request count */
  successCount: number;
  /** Error count */
  errorCount: number;
  /** Average response time in milliseconds */
  avgResponseTime: number;
  /** Last used timestamp */
  lastUsed: Date;
}

export interface AIGenerationRequest {
  /** Context for question generation */
  context: QuestionContext;
  /** Optional system prompt override */
  systemPrompt?: string;
  /** Optional user prompt override */
  userPrompt?: string;
}

export interface AIGenerationResponse {
  /** Generated question */
  question: GeneratedQuestion;
  /** Response metadata */
  metadata: {
    /** Time taken in milliseconds */
    responseTime: number;
    /** Raw response from provider */
    rawResponse?: any;
    /** Sanitization applied */
    sanitized: boolean;
  };
}

export type AIProviderName = 'openai' | 'ollama';
```

#### Task 4: Create AI Service Implementation (backend/src/services/aiService.ts)
```typescript
/**
 * @fileoverview AI integration service
 * 
 * Service for managing AI providers (OpenAI, Ollama) with fallback logic,
 * content sanitization, and performance tracking for survey question generation.
 */

import OpenAI from 'openai';
import { Ollama } from 'ollama';
import sanitizeHtml from 'sanitize-html';
import { logger } from '../utils/logger';
import type { 
  QuestionContext, 
  GeneratedQuestion, 
  AIProvider,
  AIServiceMetrics,
  AIGenerationRequest,
  AIGenerationResponse,
  AIProviderName
} from '@survai/shared';

/**
 * AI service class for question generation with multiple providers
 */
export class AIService {
  private providers: Map<AIProviderName, AIProvider> = new Map();
  private metrics: Map<string, AIServiceMetrics> = new Map();
  private openaiClient?: OpenAI;
  private ollamaClient?: Ollama;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize AI providers based on environment configuration
   */
  private initializeProviders(): void {
    // Initialize OpenAI if configured
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      this.providers.set('openai', {
        name: 'openai',
        enabled: true,
        priority: 1,
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
          temperature: 0.7,
        },
      });
    }

    // Initialize Ollama if configured
    if (process.env.OLLAMA_BASE_URL) {
      this.ollamaClient = new Ollama({
        host: process.env.OLLAMA_BASE_URL,
      });
      
      this.providers.set('ollama', {
        name: 'ollama',
        enabled: true,
        priority: 2,
        config: {
          baseUrl: process.env.OLLAMA_BASE_URL,
          model: process.env.OLLAMA_MODEL || 'llama2',
          timeout: 30000,
        },
      });
    }

    logger.info('AI providers initialized', {
      providers: Array.from(this.providers.keys()),
      openaiEnabled: !!this.openaiClient,
      ollamaEnabled: !!this.ollamaClient,
    });
  }

  /**
   * Generate a question using AI providers with fallback logic
   * 
   * @param context - Question generation context
   * @returns Promise<GeneratedQuestion> - Generated question
   */
  async generateQuestion(context: QuestionContext): Promise<GeneratedQuestion> {
    const startTime = Date.now();
    
    try {
      // Get providers sorted by priority
      const sortedProviders = Array.from(this.providers.values())
        .filter(p => p.enabled)
        .sort((a, b) => a.priority - b.priority);

      if (sortedProviders.length === 0) {
        throw new Error('No AI providers available');
      }

      // Try each provider in order
      for (const provider of sortedProviders) {
        try {
          const result = await this.generateWithProvider(provider, context);
          
          // Record success metrics
          this.recordMetrics(provider.name, true, Date.now() - startTime);
          
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          logger.warn(`Provider ${provider.name} failed, trying next`, {
            provider: provider.name,
            error: message,
          });
          
          // Record error metrics
          this.recordMetrics(provider.name, false, Date.now() - startTime);
          
          // Continue to next provider
          continue;
        }
      }

      throw new Error('All AI providers failed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('AI question generation failed', {
        error: message,
        context,
        responseTime: Date.now() - startTime,
      });
      throw new Error(`Failed to generate question: ${message}`);
    }
  }

  /**
   * Generate question using specific provider
   * 
   * @param provider - AI provider configuration
   * @param context - Question generation context
   * @returns Promise<GeneratedQuestion> - Generated question
   */
  private async generateWithProvider(
    provider: AIProvider,
    context: QuestionContext
  ): Promise<GeneratedQuestion> {
    const startTime = Date.now();
    
    try {
      let response: string;
      
      if (provider.name === 'openai') {
        response = await this.generateWithOpenAI(context);
      } else if (provider.name === 'ollama') {
        response = await this.generateWithOllama(context);
      } else {
        throw new Error(`Unknown provider: ${provider.name}`);
      }

      // Sanitize the response
      const sanitizedResponse = this.sanitizeContent(response);
      
      return {
        text: sanitizedResponse,
        description: undefined,
        suggestions: [],
        confidence: 0.8,
        provider: provider.name,
        generatedAt: new Date(),
        metadata: {
          responseTime: Date.now() - startTime,
          sanitized: response !== sanitizedResponse,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Provider ${provider.name} failed: ${message}`);
    }
  }

  /**
   * Generate question using OpenAI
   * 
   * @param context - Question generation context
   * @returns Promise<string> - Generated question text
   */
  private async generateWithOpenAI(context: QuestionContext): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const systemPrompt = "Generate engaging financial assistance survey questions.";
    const userPrompt = `Context: ${JSON.stringify(context)}`;

    try {
      const completion = await this.openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('OpenAI returned empty response');
      }

      return response;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate question using Ollama
   * 
   * @param context - Question generation context
   * @returns Promise<string> - Generated question text
   */
  private async generateWithOllama(context: QuestionContext): Promise<string> {
    if (!this.ollamaClient) {
      throw new Error('Ollama client not initialized');
    }

    const prompt = `Generate an engaging financial assistance survey question based on this context: ${JSON.stringify(context)}`;

    try {
      const response = await this.ollamaClient.generate({
        model: process.env.OLLAMA_MODEL || 'llama2',
        prompt,
        stream: false,
      });

      if (!response.response) {
        throw new Error('Ollama returned empty response');
      }

      return response.response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama request timeout');
      }
      throw error;
    }
  }

  /**
   * Sanitize AI-generated content to prevent XSS attacks
   * 
   * @param content - Raw content from AI provider
   * @returns string - Sanitized content
   */
  sanitizeContent(content: string): string {
    try {
      // Remove HTML tags and potentially dangerous content
      const sanitized = sanitizeHtml(content, {
        allowedTags: [], // No HTML tags allowed
        allowedAttributes: {},
        disallowedTagsMode: 'discard',
      });

      // Additional sanitization - remove excessive whitespace
      return sanitized.trim().replace(/\s+/g, ' ');
    } catch (error) {
      logger.warn('Content sanitization failed, using original', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return content;
    }
  }

  /**
   * Record provider performance metrics
   * 
   * @param provider - Provider name
   * @param success - Whether request succeeded
   * @param responseTime - Response time in milliseconds
   */
  private recordMetrics(provider: string, success: boolean, responseTime: number): void {
    const existing = this.metrics.get(provider) || {
      provider,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      lastUsed: new Date(),
    };

    existing.requestCount++;
    existing.lastUsed = new Date();
    
    if (success) {
      existing.successCount++;
    } else {
      existing.errorCount++;
    }

    // Update average response time
    existing.avgResponseTime = (existing.avgResponseTime * (existing.requestCount - 1) + responseTime) / existing.requestCount;

    this.metrics.set(provider, existing);

    logger.info('AI provider metrics updated', {
      provider,
      success,
      responseTime,
      metrics: existing,
    });
  }

  /**
   * Get performance metrics for all providers
   * 
   * @returns Map<string, AIServiceMetrics> - Provider metrics
   */
  getMetrics(): Map<string, AIServiceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get list of enabled providers
   * 
   * @returns AIProviderName[] - Enabled provider names
   */
  getEnabledProviders(): AIProviderName[] {
    return Array.from(this.providers.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(p => p.name);
  }
}

// Export singleton instance
export const aiService = new AIService();
```

## Integration Points

```yaml
ENVIRONMENT:
  - add to: .env.example
  - variables: OPENAI_API_KEY, OLLAMA_BASE_URL, OLLAMA_MODEL
  - validation: backend/src/utils/validateEnv.ts

TYPES:
  - add to: shared/src/types/ai.ts
  - export: shared/src/index.ts
  - import: backend services via @survai/shared

LOGGING:
  - use: backend/src/utils/logger.ts
  - pattern: winston with structured logging
  - levels: info, warn, error for different scenarios

TESTING:
  - pattern: tests/backend/aiService.test.ts
  - framework: Jest with ts-jest
  - mocking: jest.mock for external libraries
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
# Run unit tests with coverage
npm run test -- tests/backend/aiService.test.ts

# Expected: All tests pass
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start the backend server
npm run dev --workspace=backend

# Test the AI service integration (if exposed via API)
# Note: This phase focuses on service layer, API endpoints in future phase
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] OpenAI integration works with valid API key
- [ ] Ollama fallback works when OpenAI fails
- [ ] Content sanitization prevents XSS
- [ ] Environment variables validated
- [ ] Performance metrics logged
- [ ] Error handling graceful for all scenarios

---

## Anti-Patterns to Avoid
- ❌ Don't hardcode API keys or URLs
- ❌ Don't skip content sanitization
- ❌ Don't ignore provider errors without fallback
- ❌ Don't use sync operations in async context
- ❌ Don't mock tests to pass - fix actual issues
- ❌ Don't create new patterns when existing ones work

## Quality Assessment

**Confidence Score: 9/10**

This PRP provides:
- ✅ Complete implementation context from codebase analysis
- ✅ Specific library versions and integration patterns
- ✅ Comprehensive error handling and fallback logic
- ✅ Security considerations with sanitization
- ✅ Testing patterns following existing codebase
- ✅ Environment configuration following existing patterns
- ✅ Performance monitoring and logging
- ✅ TypeScript type safety throughout

The implementation should succeed in one pass given the thorough context and validation loops provided.