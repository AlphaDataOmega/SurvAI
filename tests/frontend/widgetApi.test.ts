/**
 * @fileoverview Tests for widget API service
 */

import { WidgetApi, createWidgetApi } from '../../frontend/src/widget/services/widgetApi';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-user-agent'
  }
});

describe('WidgetApi', () => {
  let api: WidgetApi;

  beforeEach(() => {
    api = createWidgetApi({
      baseUrl: 'http://localhost:3001',
      timeout: 5000,
      retries: 2
    });
    mockFetch.mockClear();
  });

  describe('bootstrapSession', () => {
    it('should bootstrap session successfully', async () => {
      const mockResponse = {
        sessionId: 'test-session',
        clickId: 'test-click',
        surveyId: 'test-survey'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse
        })
      });

      const result = await api.bootstrapSession('test-survey');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ surveyId: 'test-survey' })
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Survey not found'
        })
      });

      await expect(api.bootstrapSession('invalid-survey')).rejects.toThrow('Failed to bootstrap session');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.bootstrapSession('test-survey')).rejects.toThrow();
    });

    it('should retry on failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { sessionId: 'test-session' }
          })
        });

      const result = await api.bootstrapSession('test-survey');

      expect(result).toEqual({ sessionId: 'test-session' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getNextQuestion', () => {
    it('should get next question successfully', async () => {
      const mockResponse = {
        question: {
          id: 'question-1',
          text: 'Test question',
          type: 'CTA_OFFER'
        },
        offerButtons: [
          {
            id: 'button-1',
            text: 'Click me',
            offerId: 'offer-1'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse
        })
      });

      const result = await api.getNextQuestion('test-survey', 'test-session');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/questions/test-survey/next',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test-session',
            surveyId: 'test-survey',
            previousQuestionId: undefined,
            userAgent: 'test-user-agent',
            ipAddress: undefined
          })
        })
      );
    });

    it('should handle question not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Question not found'
      });

      await expect(api.getNextQuestion('invalid-survey', 'test-session')).rejects.toThrow();
    });
  });

  describe('trackClick', () => {
    it('should track click successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: null
        })
      });

      await expect(api.trackClick('session', 'question', 'offer', 'button')).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/track/click',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('session'),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should not throw on tracking errors', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockFetch.mockRejectedValueOnce(new Error('Tracking failed'));

      await expect(api.trackClick('session', 'question', 'offer', 'button')).resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to track click:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        timeout: 10000,
        retries: 5
      };

      api.updateConfig(newConfig);

      const config = api.getConfig();
      expect(config.timeout).toBe(10000);
      expect(config.retries).toBe(5);
    });

    it('should return current configuration', () => {
      const config = api.getConfig();

      expect(config).toEqual({
        baseUrl: 'http://localhost:3001',
        timeout: 5000,
        retries: 2,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('timeout handling', () => {
    it('should configure timeout in API config', () => {
      const config = api.getConfig();
      expect(config.timeout).toBe(5000);
    });
  });
});

describe('createWidgetApi', () => {
  it('should create widget API instance', () => {
    const api = createWidgetApi({
      baseUrl: 'http://test.com'
    });

    expect(api).toBeInstanceOf(WidgetApi);
  });

  it('should use default config values', () => {
    const api = createWidgetApi({
      baseUrl: 'http://test.com'
    });

    const config = api.getConfig();
    expect(config.timeout).toBe(10000);
    expect(config.retries).toBe(3);
  });
});