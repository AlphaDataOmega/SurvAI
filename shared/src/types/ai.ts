/**
 * @fileoverview AI service types and interfaces
 * 
 * Type definitions for AI integration layer supporting OpenAI and Ollama
 * for financial assistance survey content generation.
 */

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