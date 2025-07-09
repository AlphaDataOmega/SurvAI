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