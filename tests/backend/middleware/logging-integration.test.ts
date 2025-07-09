/**
 * @fileoverview Integration tests for middleware logging
 * 
 * Tests that verify the middleware correctly uses the Winston logger
 * for structured logging instead of console.log statements.
 */

import type { Request, Response, NextFunction } from 'express';
import { logTrackingRequests } from '../../../backend/src/middleware/trackingValidation';
import { logWidgetAnalyticsRequests } from '../../../backend/src/middleware/widgetAnalyticsValidation';
import { logger } from '../../../backend/src/utils/logger';

// Mock the logger
jest.mock('../../../backend/src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const mockedLogger = logger as jest.Mocked<typeof logger>;

describe('Middleware Logging Integration', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      method: 'POST',
      url: '/api/test',
      ip: '192.168.1.1',
      body: { test: 'data' },
      query: {},
      params: {},
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'Mozilla/5.0 (Test Browser)';
        if (header === 'X-Correlation-ID') return 'test-correlation-123';
        return undefined;
      })
    };

    mockRes = {
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          // Simulate response finishing after 50ms
          setTimeout(callback, 50);
        }
      })
    };

    mockNext = jest.fn();
  });

  describe('tracking validation middleware logging', () => {
    it('should log tracking request with structured data', () => {
      // Arrange
      mockReq.url = '/api/track/click';
      mockReq.method = 'POST';

      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Tracking request received',
        expect.objectContaining({
          method: 'POST',
          url: '/api/track/click',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          timestamp: expect.any(String),
          hasBody: true,
          hasQuery: false,
          hasParams: false,
          correlationId: expect.stringContaining('tracking_')
        })
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should log tracking response completion with timing', (done) => {
      // Arrange
      mockReq.url = '/api/track/pixel/test-click';
      mockReq.method = 'GET';
      mockRes.statusCode = 200;

      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Wait for the response 'finish' event to be triggered
      setTimeout(() => {
        // Assert
        expect(mockedLogger.info).toHaveBeenCalledWith(
          'Tracking request completed',
          expect.objectContaining({
            method: 'GET',
            url: '/api/track/pixel/test-click',
            statusCode: 200,
            responseTime: expect.stringMatching(/^\d+ms$/),
            correlationId: expect.stringContaining('tracking_')
          })
        );
        done();
      }, 60); // Wait slightly longer than the simulated response time
    });

    it('should handle requests without correlation ID', () => {
      // Arrange
      (mockReq.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'User-Agent') return 'Mozilla/5.0 (Test Browser)';
        return undefined; // No X-Correlation-ID header
      });

      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Tracking request received',
        expect.objectContaining({
          correlationId: expect.stringMatching(/^tracking_\d+$/)
        })
      );
    });

    it('should log requests with query parameters', () => {
      // Arrange
      mockReq.query = { click_id: 'test-click-123', survey_id: 'survey-456' };
      mockReq.method = 'GET';

      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Tracking request received',
        expect.objectContaining({
          hasQuery: true,
          hasBody: false
        })
      );
    });

    it('should log requests with route parameters', () => {
      // Arrange
      mockReq.params = { clickId: 'test-click-123' };
      mockReq.method = 'GET';

      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Tracking request received',
        expect.objectContaining({
          hasParams: true
        })
      );
    });
  });

  describe('widget analytics validation middleware logging', () => {
    it('should log widget analytics request with structured data', () => {
      // Arrange
      mockReq.url = '/api/widget/analytics';
      mockReq.method = 'POST';
      mockReq.body = { 
        event: 'widget_impression',
        widgetId: 'widget-123',
        partnerId: 'partner-456'
      };

      // Act
      logWidgetAnalyticsRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Widget analytics request received',
        expect.objectContaining({
          method: 'POST',
          url: '/api/widget/analytics',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          timestamp: expect.any(String),
          hasBody: true,
          hasQuery: false,
          hasParams: false,
          correlationId: expect.stringContaining('widget_')
        })
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should log widget analytics response completion', (done) => {
      // Arrange
      mockReq.url = '/api/widget/analytics/aggregation';
      mockReq.method = 'GET';
      mockRes.statusCode = 200;

      // Act
      logWidgetAnalyticsRequests(mockReq as Request, mockRes as Response, mockNext);

      // Wait for the response 'finish' event
      setTimeout(() => {
        // Assert
        expect(mockedLogger.info).toHaveBeenCalledWith(
          'Widget analytics request completed',
          expect.objectContaining({
            method: 'GET',
            url: '/api/widget/analytics/aggregation',
            statusCode: 200,
            responseTime: expect.stringMatching(/^\d+ms$/),
            correlationId: expect.stringContaining('widget_')
          })
        );
        done();
      }, 60);
    });

    it('should handle error responses', (done) => {
      // Arrange
      mockReq.url = '/api/widget/analytics';
      mockRes.statusCode = 400; // Bad Request

      // Act
      logWidgetAnalyticsRequests(mockReq as Request, mockRes as Response, mockNext);

      // Wait for the response 'finish' event
      setTimeout(() => {
        // Assert
        expect(mockedLogger.info).toHaveBeenCalledWith(
          'Widget analytics request completed',
          expect.objectContaining({
            statusCode: 400,
            responseTime: expect.stringMatching(/^\d+ms$/)
          })
        );
        done();
      }, 60);
    });
  });

  describe('logging format consistency', () => {
    it('should use consistent correlation ID format for tracking', () => {
      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      const logCall = mockedLogger.info.mock.calls[0];
      const logData = logCall[1];
      expect(logData.correlationId).toMatch(/^tracking_\d+$/);
    });

    it('should use consistent correlation ID format for widget analytics', () => {
      // Act
      logWidgetAnalyticsRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      const logCall = mockedLogger.info.mock.calls[0];
      const logData = logCall[1];
      expect(logData.correlationId).toMatch(/^widget_\d+$/);
    });

    it('should preserve existing correlation ID when provided', () => {
      // Arrange
      const existingCorrelationId = 'external-correlation-xyz-789';
      (mockReq.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'User-Agent') return 'Mozilla/5.0 (Test Browser)';
        if (header === 'X-Correlation-ID') return existingCorrelationId;
        return undefined;
      });

      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Tracking request received',
        expect.objectContaining({
          correlationId: existingCorrelationId
        })
      );
    });

    it('should include timestamp in ISO format', () => {
      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      const logCall = mockedLogger.info.mock.calls[0];
      const logData = logCall[1];
      expect(logData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('performance impact', () => {
    it('should not significantly delay request processing', () => {
      // Arrange
      const startTime = Date.now();

      // Act
      logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(10); // Should complete in less than 10ms
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle high-frequency requests efficiently', () => {
      // Arrange
      const requestCount = 100;
      const startTime = Date.now();

      // Act
      for (let i = 0; i < requestCount; i++) {
        logTrackingRequests(mockReq as Request, mockRes as Response, mockNext);
      }

      // Assert
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100); // Should handle 100 requests in less than 100ms
      expect(mockNext).toHaveBeenCalledTimes(requestCount);
    });
  });
});