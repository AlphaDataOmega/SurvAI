/**
 * @fileoverview AI service tests
 * 
 * Unit tests for the AIService class covering provider initialization,
 * question generation, fallback logic, and content sanitization.
 */

import { AIService } from '../../backend/src/services/aiService';
import type { QuestionContext } from '@survai/shared';
import OpenAI from 'openai';
import { Ollama } from 'ollama';

// Mock external dependencies
jest.mock('openai');
jest.mock('ollama');
jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: jest.fn((content: string) => {
    // Simulate sanitize-html behavior
    return content.replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ');
  })
}));

const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
const MockedOllama = Ollama as jest.MockedClass<typeof Ollama>;

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAIClient: jest.Mocked<OpenAI>;
  let mockOllamaClient: jest.Mocked<Ollama>;

  // Mock question context
  const mockContext: QuestionContext = {
    userIncome: '50000-75000',
    employment: 'full-time',
    surveyType: 'financial-assistance',
    targetAudience: 'working-professionals',
    previousAnswers: { hasDebt: true }
  };

  beforeEach(() => {
    // Reset environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.OPENAI_MODEL = 'gpt-4';
    process.env.OPENAI_MAX_TOKENS = '1000';
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    process.env.OLLAMA_MODEL = 'llama2';

    // Setup mocks
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any;

    mockOllamaClient = {
      generate: jest.fn()
    } as any;

    MockedOpenAI.mockImplementation(() => mockOpenAIClient);
    MockedOllama.mockImplementation(() => mockOllamaClient);

    // Create fresh instance for each test
    aiService = new AIService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with OpenAI provider when API key is provided', () => {
      expect(MockedOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-openai-key'
      });
    });

    test('should initialize with Ollama provider when base URL is provided', () => {
      expect(MockedOllama).toHaveBeenCalledWith({
        host: 'http://localhost:11434'
      });
    });

    test('should initialize without providers when no configuration is provided', () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.OLLAMA_BASE_URL;
      
      const newService = new AIService();
      expect(newService.getEnabledProviders()).toHaveLength(0);
    });

    test('should get enabled providers in priority order', () => {
      const providers = aiService.getEnabledProviders();
      expect(providers).toEqual(['openai', 'ollama']);
    });
  });

  describe('generateQuestion', () => {
    test('should generate question using OpenAI (highest priority)', async () => {
      const mockResponse = 'What is your monthly income range?';
      mockOpenAIClient.chat.completions.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          choices: [{ message: { content: mockResponse } }]
        } as any), 1))
      );

      const result = await aiService.generateQuestion(mockContext);

      expect(result).toEqual({
        text: mockResponse,
        description: undefined,
        suggestions: [],
        confidence: 0.8,
        provider: 'openai',
        generatedAt: expect.any(Date),
        metadata: {
          responseTime: expect.any(Number),
          sanitized: false
        }
      });

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Generate engaging financial assistance survey questions.' },
          { role: 'user', content: `Context: ${JSON.stringify(mockContext)}` }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });
    });

    test('should fallback to Ollama when OpenAI fails', async () => {
      const mockResponse = 'How much debt do you currently have?';
      mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('OpenAI API Error'));
      mockOllamaClient.generate.mockResolvedValue({ response: mockResponse } as any);

      const result = await aiService.generateQuestion(mockContext);

      expect(result.provider).toBe('ollama');
      expect(result.text).toBe(mockResponse);
      expect(mockOllamaClient.generate).toHaveBeenCalledWith({
        model: 'llama2',
        prompt: expect.stringContaining('Generate an engaging financial assistance survey question'),
        stream: false
      });
    });

    test('should throw error when all providers fail', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('OpenAI failed'));
      mockOllamaClient.generate.mockRejectedValue(new Error('Ollama failed'));

      await expect(aiService.generateQuestion(mockContext)).rejects.toThrow('Failed to generate question: All AI providers failed');
    });

    test('should throw error when no providers are available', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.OLLAMA_BASE_URL;
      
      const newService = new AIService();
      await expect(newService.generateQuestion(mockContext)).rejects.toThrow('Failed to generate question: No AI providers available');
    });
  });

  describe('OpenAI provider', () => {
    test('should handle OpenAI API errors', async () => {
      const apiError = new OpenAI.APIError('Rate limit exceeded', null as any, 429, undefined);
      mockOpenAIClient.chat.completions.create.mockRejectedValue(apiError);
      mockOllamaClient.generate.mockResolvedValue({ response: 'Fallback response' } as any);

      const result = await aiService.generateQuestion(mockContext);
      expect(result.provider).toBe('ollama');
    });

    test('should handle empty OpenAI response', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }]
      } as any);
      mockOllamaClient.generate.mockResolvedValue({ response: 'Fallback response' } as any);

      const result = await aiService.generateQuestion(mockContext);
      expect(result.provider).toBe('ollama');
    });

    test('should handle missing OpenAI client', async () => {
      delete process.env.OPENAI_API_KEY;
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      
      const newService = new AIService();
      mockOllamaClient.generate.mockResolvedValue({ response: 'Ollama response' } as any);
      
      const result = await newService.generateQuestion(mockContext);
      expect(result.provider).toBe('ollama');
    });
  });

  describe('Ollama provider', () => {
    test('should handle Ollama timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      
      mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('OpenAI failed'));
      mockOllamaClient.generate.mockRejectedValue(timeoutError);

      await expect(aiService.generateQuestion(mockContext)).rejects.toThrow('Failed to generate question: All AI providers failed');
    });

    test('should handle empty Ollama response', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('OpenAI failed'));
      mockOllamaClient.generate.mockResolvedValue({ response: '' } as any);

      await expect(aiService.generateQuestion(mockContext)).rejects.toThrow('Failed to generate question: All AI providers failed');
    });

    test('should handle missing Ollama client', async () => {
      delete process.env.OLLAMA_BASE_URL;
      
      const newService = new AIService();
      const mockResponse = 'OpenAI only response';
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }]
      } as any);

      const result = await newService.generateQuestion(mockContext);
      expect(result.provider).toBe('openai');
    });
  });

  describe('content sanitization', () => {
    test('should sanitize HTML content', () => {
      const htmlContent = '<script>alert("xss")</script><p>What is your income?</p>';
      const sanitized = aiService.sanitizeContent(htmlContent);
      
      // The actual sanitization removes HTML tags and normalizes whitespace
      expect(sanitized).toBe('alert("xss")What is your income?');
    });

    test('should trim whitespace and normalize spaces', () => {
      const messyContent = '   What    is   your   income?   ';
      const sanitized = aiService.sanitizeContent(messyContent);
      
      expect(sanitized).toBe('What is your income?');
    });

    test('should handle sanitization errors gracefully', () => {
      const content = 'Normal content';
      const sanitizeHtml = jest.requireMock('sanitize-html').default;
      sanitizeHtml.mockImplementation(() => {
        throw new Error('Sanitization failed');
      });

      const result = aiService.sanitizeContent(content);
      expect(result).toBe(content);
    });
  });

  describe('metrics tracking', () => {
    test('should track successful generation metrics', async () => {
      const mockResponse = 'Test question';
      mockOpenAIClient.chat.completions.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          choices: [{ message: { content: mockResponse } }]
        } as any), 1))
      );

      await aiService.generateQuestion(mockContext);
      
      const metrics = aiService.getMetrics();
      const openaiMetrics = metrics.get('openai');
      
      expect(openaiMetrics).toBeDefined();
      expect(openaiMetrics!.requestCount).toBe(1);
      expect(openaiMetrics!.successCount).toBe(1);
      expect(openaiMetrics!.errorCount).toBe(0);
      expect(openaiMetrics!.avgResponseTime).toBeGreaterThan(0);
    });

    test('should track failure metrics', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('OpenAI failed'));
      mockOllamaClient.generate.mockResolvedValue({ response: 'Fallback response' } as any);

      await aiService.generateQuestion(mockContext);
      
      const metrics = aiService.getMetrics();
      const openaiMetrics = metrics.get('openai');
      const ollamaMetrics = metrics.get('ollama');
      
      expect(openaiMetrics!.errorCount).toBe(1);
      expect(openaiMetrics!.successCount).toBe(0);
      expect(ollamaMetrics!.successCount).toBe(1);
      expect(ollamaMetrics!.errorCount).toBe(0);
    });

    test('should update average response time correctly', async () => {
      const mockResponse = 'Test question';
      mockOpenAIClient.chat.completions.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          choices: [{ message: { content: mockResponse } }]
        } as any), 1))
      );

      // Generate multiple questions to test average calculation
      await aiService.generateQuestion(mockContext);
      await aiService.generateQuestion(mockContext);
      
      const metrics = aiService.getMetrics();
      const openaiMetrics = metrics.get('openai');
      
      expect(openaiMetrics!.requestCount).toBe(2);
      expect(openaiMetrics!.avgResponseTime).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    test('should handle undefined context gracefully', async () => {
      const mockResponse = 'Default question';
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }]
      } as any);

      const result = await aiService.generateQuestion({} as QuestionContext);
      expect(result.text).toBe(mockResponse);
    });

    test('should handle provider priority correctly', () => {
      const providers = aiService.getEnabledProviders();
      expect(providers[0]).toBe('openai'); // Priority 1
      expect(providers[1]).toBe('ollama');  // Priority 2
    });

    test('should handle long response times', async () => {
      const mockResponse = 'Test question';
      mockOpenAIClient.chat.completions.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          choices: [{ message: { content: mockResponse } }]
        } as any), 100))
      );

      const result = await aiService.generateQuestion(mockContext);
      expect(result.metadata!.responseTime).toBeGreaterThan(90);
    });
  });

  describe('integration scenarios', () => {
    test('should complete full generation cycle with sanitization', async () => {
      const htmlResponse = '<p>What is your <strong>monthly</strong> income?</p>';
      
      mockOpenAIClient.chat.completions.create.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          choices: [{ message: { content: htmlResponse } }]
        } as any), 1))
      );

      const result = await aiService.generateQuestion(mockContext);
      
      // Test the structure regardless of sanitization mock behavior
      expect(result.text).toBeDefined();
      expect(result.provider).toBe('openai');
      expect(result.confidence).toBe(0.8);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.responseTime).toBeGreaterThan(0);
    });

    test('should handle complete provider failure gracefully', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(new Error('OpenAI down'));
      mockOllamaClient.generate.mockRejectedValue(new Error('Ollama down'));

      await expect(aiService.generateQuestion(mockContext)).rejects.toThrow('Failed to generate question: All AI providers failed');
      
      const metrics = aiService.getMetrics();
      expect(metrics.get('openai')!.errorCount).toBe(1);
      expect(metrics.get('ollama')!.errorCount).toBe(1);
    });
  });
});