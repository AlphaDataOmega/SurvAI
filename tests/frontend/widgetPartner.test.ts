/**
 * @fileoverview Tests for widget partner ID propagation in API calls
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

describe('WidgetApi Partner ID Integration', () => {
  let api: WidgetApi;
  let apiWithPartner: WidgetApi;

  beforeEach(() => {
    // API without partner ID
    api = createWidgetApi({
      baseUrl: 'http://localhost:3001',
      timeout: 5000,
      retries: 2
    });

    // API with partner ID
    apiWithPartner = createWidgetApi({
      baseUrl: 'http://localhost:3001',
      timeout: 5000,
      retries: 2,
      partnerId: 'test-partner-123'
    });

    mockFetch.mockClear();
  });

  describe('bootstrapSession with partner ID', () => {
    it('should include partnerId in query parameters when provided', async () => {
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

      await apiWithPartner.bootstrapSession('test-survey');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions?surveyId=test-survey&partnerId=test-partner-123',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ surveyId: 'test-survey' })
        })
      );
    });

    it('should not include partnerId in query parameters when not provided', async () => {
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

      await api.bootstrapSession('test-survey');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions?surveyId=test-survey',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ surveyId: 'test-survey' })
        })
      );
    });

    it('should include partnerId in error context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Survey not found'
        })
      });

      try {
        await apiWithPartner.bootstrapSession('invalid-survey');
      } catch (error: any) {
        expect(error.context).toEqual({
          surveyId: 'invalid-survey',
          partnerId: 'test-partner-123'
        });
      }
    });
  });

  describe('getNextQuestion with partner ID', () => {
    it('should include partnerId in query parameters when provided', async () => {
      const mockResponse = {
        question: {
          id: 'question-1',
          text: 'Test question',
          type: 'CTA_OFFER'
        },
        offerButtons: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse
        })
      });

      await apiWithPartner.getNextQuestion('test-survey', 'test-session');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/questions/test-survey/next?partnerId=test-partner-123',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test-session')
        })
      );
    });

    it('should not include query parameters when partnerId not provided', async () => {
      const mockResponse = {
        question: {
          id: 'question-1',
          text: 'Test question',
          type: 'CTA_OFFER'
        },
        offerButtons: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse
        })
      });

      await api.getNextQuestion('test-survey', 'test-session');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/questions/test-survey/next',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test-session')
        })
      );
    });

    it('should include partnerId in error context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Question not found'
      });

      try {
        await apiWithPartner.getNextQuestion('invalid-survey', 'test-session');
      } catch (error: any) {
        expect(error.context).toEqual({
          surveyId: 'invalid-survey',
          sessionId: 'test-session',
          previousQuestionId: undefined,
          partnerId: 'test-partner-123'
        });
      }
    });
  });

  describe('trackClick with partner ID', () => {
    it('should include partnerId in query parameters when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: null
        })
      });

      await apiWithPartner.trackClick('session', 'question', 'offer', 'button');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/track/click?partnerId=test-partner-123',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('session')
        })
      );
    });

    it('should not include query parameters when partnerId not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: null
        })
      });

      await api.trackClick('session', 'question', 'offer', 'button');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/track/click',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('session')
        })
      );
    });

    it('should handle tracking errors gracefully without throwing', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockFetch.mockRejectedValueOnce(new Error('Tracking failed'));

      // Should not throw even with partner ID
      await expect(apiWithPartner.trackClick('session', 'question', 'offer', 'button')).resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to track click:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('configuration updates', () => {
    it('should update partnerId when config is updated', () => {
      const initialConfig = api.getConfig();
      expect(initialConfig.partnerId).toBeUndefined();

      api.updateConfig({ partnerId: 'new-partner-456' });

      const updatedConfig = api.getConfig();
      expect(updatedConfig.partnerId).toBe('new-partner-456');
    });

    it('should handle partnerId removal', () => {
      const initialConfig = apiWithPartner.getConfig();
      expect(initialConfig.partnerId).toBe('test-partner-123');

      apiWithPartner.updateConfig({ partnerId: undefined });

      const updatedConfig = apiWithPartner.getConfig();
      expect(updatedConfig.partnerId).toBeUndefined();
    });

    it('should preserve other config values when updating partnerId', () => {
      const initialTimeout = api.getConfig().timeout;
      
      api.updateConfig({ partnerId: 'new-partner-789' });
      
      const updatedConfig = api.getConfig();
      expect(updatedConfig.partnerId).toBe('new-partner-789');
      expect(updatedConfig.timeout).toBe(initialTimeout);
    });
  });

  describe('backward compatibility', () => {
    it('should work without partnerId in configuration', () => {
      const legacyApi = createWidgetApi({
        baseUrl: 'http://localhost:3001'
      });

      const config = legacyApi.getConfig();
      expect(config.partnerId).toBeUndefined();
      expect(config.baseUrl).toBe('http://localhost:3001');
      expect(config.timeout).toBe(10000); // Default value
    });

    it('should handle empty string partnerId', async () => {
      const apiWithEmptyPartner = createWidgetApi({
        baseUrl: 'http://localhost:3001',
        partnerId: ''
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sessionId: 'test' }
        })
      });

      await apiWithEmptyPartner.bootstrapSession('test-survey');

      // Empty string should not be included in URL
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions?surveyId=test-survey',
        expect.any(Object)
      );
    });
  });

  describe('integration with different partner IDs', () => {
    it('should handle special characters in partnerId', async () => {
      const specialPartnerApi = createWidgetApi({
        baseUrl: 'http://localhost:3001',
        partnerId: 'partner-123@example.com'
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sessionId: 'test' }
        })
      });

      await specialPartnerApi.bootstrapSession('test-survey');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions?surveyId=test-survey&partnerId=partner-123%40example.com',
        expect.any(Object)
      );
    });

    it('should handle numeric partnerId', async () => {
      const numericPartnerApi = createWidgetApi({
        baseUrl: 'http://localhost:3001',
        partnerId: '12345'
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { sessionId: 'test' }
        })
      });

      await numericPartnerApi.bootstrapSession('test-survey');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions?surveyId=test-survey&partnerId=12345',
        expect.any(Object)
      );
    });
  });
});

describe('createWidgetApi with partner configuration', () => {
  it('should create widget API with partnerId', () => {
    const api = createWidgetApi({
      baseUrl: 'http://test.com',
      partnerId: 'test-partner'
    });

    expect(api).toBeInstanceOf(WidgetApi);
    
    const config = api.getConfig();
    expect(config.partnerId).toBe('test-partner');
  });

  it('should create widget API without partnerId', () => {
    const api = createWidgetApi({
      baseUrl: 'http://test.com'
    });

    expect(api).toBeInstanceOf(WidgetApi);
    
    const config = api.getConfig();
    expect(config.partnerId).toBeUndefined();
  });
});