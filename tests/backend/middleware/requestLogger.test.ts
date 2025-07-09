/**
 * @fileoverview Request logger middleware tests
 * 
 * Comprehensive tests for the request logging middleware including
 * request ID generation, timing, and response logging.
 */

import type { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../../../backend/src/middleware/requestLogger';
import { logger } from '../../../backend/src/utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('../../../backend/src/utils/logger');
jest.mock('uuid');

const mockLogger = logger as jest.Mocked<typeof logger>;
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('RequestLogger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let originalEnd: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock response.end
    originalEnd = jest.fn();

    // Setup mock request
    mockRequest = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn(),
      requestId: undefined,
      startTime: undefined,
    };

    // Setup mock response
    mockResponse = {
      set: jest.fn(),
      get: jest.fn(),
      end: originalEnd,
      statusCode: 200,
    };

    // Setup mock next function
    mockNext = jest.fn();

    // Setup logger mocks
    mockLogger.info = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.error = jest.fn();
    mockLogger.debug = jest.fn();

    // Setup UUID mock
    mockUuidv4.mockReturnValue('test-request-id-123');

    // Mock Date.now for consistent timing
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requestLogger function', () => {
    it('should generate request ID and add it to request and response', () => {
      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockRequest.requestId).toBe('test-request-id-123');
      expect(mockResponse.set).toHaveBeenCalledWith('X-Request-ID', 'test-request-id-123');
    });

    it('should set start time on request', () => {
      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.startTime).toBe(1000000);
    });

    it('should log request start with all details', () => {
      // Arrange
      const userAgent = 'Mozilla/5.0 (Test Browser)';
      const contentType = 'application/json';
      const contentLength = '123';
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce(userAgent)
        .mockReturnValueOnce(contentType)
        .mockReturnValueOnce(contentLength);

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', {
        requestId: 'test-request-id-123',
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        userAgent,
        contentType,
        contentLength,
      });
    });

    it('should log request start with missing headers', () => {
      // Arrange
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', {
        requestId: 'test-request-id-123',
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        userAgent: undefined,
        contentType: undefined,
        contentLength: undefined,
      });
    });

    it('should call next middleware', () => {
      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should override response.end method', () => {
      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.end).not.toBe(originalEnd);
      expect(typeof mockResponse.end).toBe('function');
    });

    describe('response.end override', () => {
      it('should log response completion with duration', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        jest.spyOn(Date, 'now').mockReturnValue(1000500); // 500ms later
        mockResponse.statusCode = 200;
        (mockResponse.get as jest.Mock).mockReturnValue('456');

        // Act
        (mockResponse.end as any)();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Request completed:', {
          requestId: 'test-request-id-123',
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          duration: '500ms',
          contentLength: '456',
        });
      });

      it('should call original end method with no arguments', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

        // Act
        (mockResponse.end as any)();

        // Assert
        expect(originalEnd).toHaveBeenCalledWith();
      });

      it('should call original end method with chunk argument', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        const chunk = 'response data';

        // Act
        (mockResponse.end as any)(chunk);

        // Assert
        expect(originalEnd).toHaveBeenCalledWith(chunk);
      });

      it('should call original end method with chunk and encoding', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        const chunk = 'response data';
        const encoding = 'utf8';

        // Act
        (mockResponse.end as any)(chunk, encoding);

        // Assert
        expect(originalEnd).toHaveBeenCalledWith(chunk, encoding);
      });

      it('should call original end method with all arguments', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        const chunk = 'response data';
        const encoding = 'utf8';
        const callback = jest.fn();

        // Act
        (mockResponse.end as any)(chunk, encoding, callback);

        // Assert
        expect(originalEnd).toHaveBeenCalledWith(chunk, encoding, callback);
      });

      it('should handle different status codes', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        mockResponse.statusCode = 404;

        // Act
        (mockResponse.end as any)();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Request completed:', expect.objectContaining({
          statusCode: 404,
        }));
      });

      it('should handle error status codes', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        mockResponse.statusCode = 500;

        // Act
        (mockResponse.end as any)();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Request completed:', expect.objectContaining({
          statusCode: 500,
        }));
      });

      it('should handle missing content length', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        (mockResponse.get as jest.Mock).mockReturnValue(undefined);

        // Act
        (mockResponse.end as any)();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Request completed:', expect.objectContaining({
          contentLength: undefined,
        }));
      });

      it('should calculate duration correctly for different timing', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        jest.spyOn(Date, 'now').mockReturnValue(1002000); // 2 seconds later

        // Act
        (mockResponse.end as any)();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Request completed:', expect.objectContaining({
          duration: '2000ms',
        }));
      });

      it('should handle zero duration', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        jest.spyOn(Date, 'now').mockReturnValue(1000000); // Same time

        // Act
        (mockResponse.end as any)();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Request completed:', expect.objectContaining({
          duration: '0ms',
        }));
      });

      it('should return response object from original end method', () => {
        // Arrange
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
        const mockReturnValue = { test: 'value' };
        originalEnd.mockReturnValue(mockReturnValue);

        // Act
        const result = (mockResponse.end as any)();

        // Assert
        expect(result).toBe(mockReturnValue);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing request method', () => {
      // Arrange
      mockRequest.method = undefined;

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        method: undefined,
      }));
    });

    it('should handle missing request URL', () => {
      // Arrange
      mockRequest.url = undefined;

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        url: undefined,
      }));
    });

    it('should handle missing request IP', () => {
      // Arrange
      mockRequest.ip = undefined;

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        ip: undefined,
      }));
    });

    it('should handle request.get throwing an error', () => {
      // Arrange
      (mockRequest.get as jest.Mock).mockImplementation(() => {
        throw new Error('Header access error');
      });

      // Act & Assert
      expect(() => {
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Header access error');
    });

    it('should handle response.set throwing an error', () => {
      // Arrange
      (mockResponse.set as jest.Mock).mockImplementation(() => {
        throw new Error('Header set error');
      });

      // Act & Assert
      expect(() => {
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Header set error');
    });

    it('should handle logger.info throwing an error', () => {
      // Arrange
      mockLogger.info.mockImplementation(() => {
        throw new Error('Logger error');
      });

      // Act & Assert
      expect(() => {
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Logger error');
    });

    it('should handle UUID generation throwing an error', () => {
      // Arrange
      mockUuidv4.mockImplementation(() => {
        throw new Error('UUID generation error');
      });

      // Act & Assert
      expect(() => {
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('UUID generation error');
    });

    it('should handle Date.now throwing an error', () => {
      // Arrange
      jest.spyOn(Date, 'now').mockImplementation(() => {
        throw new Error('Date.now error');
      });

      // Act & Assert
      expect(() => {
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Date.now error');
    });

    it('should handle response.end logging throwing an error', () => {
      // Arrange
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      mockLogger.info.mockImplementation(() => {
        throw new Error('Response logging error');
      });

      // Act & Assert
      expect(() => {
        (mockResponse.end as any)();
      }).toThrow('Response logging error');
    });

    it('should handle original end method throwing an error', () => {
      // Arrange
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      originalEnd.mockImplementation(() => {
        throw new Error('Original end error');
      });

      // Act & Assert
      expect(() => {
        (mockResponse.end as any)();
      }).toThrow('Original end error');
    });

    it('should handle missing response object', () => {
      // Arrange
      const malformedResponse = {} as Response;

      // Act & Assert
      expect(() => {
        requestLogger(mockRequest as Request, malformedResponse, mockNext);
      }).toThrow();
    });

    it('should handle missing request object', () => {
      // Arrange
      const malformedRequest = {} as Request;

      // Act
      requestLogger(malformedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        method: undefined,
        url: undefined,
        ip: undefined,
      }));
    });
  });

  describe('Request Types and Scenarios', () => {
    it('should handle POST request with body', () => {
      // Arrange
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('Mozilla/5.0 (Test Browser)')
        .mockReturnValueOnce('application/json')
        .mockReturnValueOnce('256');

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', {
        requestId: 'test-request-id-123',
        method: 'POST',
        url: '/api/users',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        contentType: 'application/json',
        contentLength: '256',
      });
    });

    it('should handle PUT request', () => {
      // Arrange
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/123';

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        method: 'PUT',
        url: '/api/users/123',
      }));
    });

    it('should handle DELETE request', () => {
      // Arrange
      mockRequest.method = 'DELETE';
      mockRequest.url = '/api/users/456';

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        method: 'DELETE',
        url: '/api/users/456',
      }));
    });

    it('should handle request with query parameters', () => {
      // Arrange
      mockRequest.url = '/api/users?page=1&limit=10';

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        url: '/api/users?page=1&limit=10',
      }));
    });

    it('should handle request with different IP addresses', () => {
      // Arrange
      mockRequest.ip = '192.168.1.100';

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        ip: '192.168.1.100',
      }));
    });

    it('should handle request with different user agents', () => {
      // Arrange
      const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      (mockRequest.get as jest.Mock).mockReturnValueOnce(chromeUserAgent);

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Request started:', expect.objectContaining({
        userAgent: chromeUserAgent,
      }));
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete request-response cycle', () => {
      // Arrange
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      jest.spyOn(Date, 'now').mockReturnValue(1000250); // 250ms later
      mockResponse.statusCode = 201;
      (mockResponse.get as jest.Mock).mockReturnValue('789');

      // Act
      (mockResponse.end as any)('{"success": true}');

      // Assert
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'Request started:', expect.any(Object));
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'Request completed:', {
        requestId: 'test-request-id-123',
        method: 'GET',
        url: '/api/test',
        statusCode: 201,
        duration: '250ms',
        contentLength: '789',
      });
      expect(originalEnd).toHaveBeenCalledWith('{"success": true}');
    });

    it('should handle multiple concurrent requests with different request IDs', () => {
      // Arrange
      const mockRequest2 = { ...mockRequest };
      const mockResponse2 = { ...mockResponse, end: jest.fn() };
      mockUuidv4.mockReturnValueOnce('request-1').mockReturnValueOnce('request-2');

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      requestLogger(mockRequest2 as Request, mockResponse2 as Response, mockNext);

      // Assert
      expect(mockRequest.requestId).toBe('request-1');
      expect(mockRequest2.requestId).toBe('request-2');
      expect(mockResponse.set).toHaveBeenCalledWith('X-Request-ID', 'request-1');
      expect(mockResponse2.set).toHaveBeenCalledWith('X-Request-ID', 'request-2');
    });
  });
});