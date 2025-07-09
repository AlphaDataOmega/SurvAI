/**
 * @fileoverview 404 Not Found handler middleware tests
 * 
 * Comprehensive tests for the 404 handler middleware including
 * proper response formatting, logging, and edge cases.
 */

import type { Request, Response, NextFunction } from 'express';
import { notFoundHandler } from '../../../backend/src/middleware/notFoundHandler';
import { logger } from '../../../backend/src/utils/logger';
import type { ApiResponse } from '@survai/shared';

// Mock dependencies
jest.mock('../../../backend/src/utils/logger');

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('NotFoundHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      method: 'GET',
      url: '/nonexistent-endpoint',
      path: '/nonexistent-endpoint',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent'),
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup mock next function
    mockNext = jest.fn();

    // Setup logger mocks
    mockLogger.warn = jest.fn();
    mockLogger.error = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.debug = jest.fn();
  });

  describe('notFoundHandler function', () => {
    it('should return 404 response for GET request', () => {
      // Arrange
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route GET /nonexistent-endpoint not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 response for POST request', () => {
      // Arrange
      mockRequest.method = 'POST';
      mockRequest.path = '/api/invalid-endpoint';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route POST /api/invalid-endpoint not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 response for PUT request', () => {
      // Arrange
      mockRequest.method = 'PUT';
      mockRequest.path = '/api/users/123';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route PUT /api/users/123 not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 response for DELETE request', () => {
      // Arrange
      mockRequest.method = 'DELETE';
      mockRequest.path = '/api/offers/456';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route DELETE /api/offers/456 not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 response for PATCH request', () => {
      // Arrange
      mockRequest.method = 'PATCH';
      mockRequest.path = '/api/surveys/789';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route PATCH /api/surveys/789 not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should log 404 request with proper details', () => {
      // Arrange
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      (mockRequest.get as jest.Mock).mockReturnValue(userAgent);

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith('404 Not Found:', {
        method: 'GET',
        url: '/nonexistent-endpoint',
        ip: '127.0.0.1',
        userAgent,
      });
    });

    it('should log 404 request with missing user agent', () => {
      // Arrange
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith('404 Not Found:', {
        method: 'GET',
        url: '/nonexistent-endpoint',
        ip: '127.0.0.1',
        userAgent: undefined,
      });
    });

    it('should handle request with query parameters', () => {
      // Arrange
      mockRequest.url = '/api/users?page=1&limit=10';
      mockRequest.path = '/api/users';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route GET /api/users not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockLogger.warn).toHaveBeenCalledWith('404 Not Found:', {
        method: 'GET',
        url: '/api/users?page=1&limit=10',
        ip: '127.0.0.1',
        userAgent: 'Test User Agent',
      });
    });

    it('should handle request with fragments and anchors', () => {
      // Arrange
      mockRequest.url = '/api/data#section1';
      mockRequest.path = '/api/data';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route GET /api/data not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle root path request', () => {
      // Arrange
      mockRequest.url = '/';
      mockRequest.path = '/';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route GET / not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle nested path request', () => {
      // Arrange
      mockRequest.url = '/api/v1/users/123/profile/settings';
      mockRequest.path = '/api/v1/users/123/profile/settings';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route GET /api/v1/users/123/profile/settings not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle request with special characters in path', () => {
      // Arrange
      mockRequest.url = '/api/search?q=test%20query&filter=active';
      mockRequest.path = '/api/search';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route GET /api/search not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should include valid timestamp in response', () => {
      // Arrange
      const beforeTimestamp = new Date().toISOString();

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      const afterTimestamp = new Date().toISOString();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        })
      );

      // Verify timestamp is within reasonable range
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(responseCall.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing request method', () => {
      // Arrange
      mockRequest.method = undefined;
      mockRequest.path = '/test';
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route undefined /test not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle missing request path', () => {
      // Arrange
      mockRequest.method = 'GET';
      mockRequest.path = undefined;
      const expectedResponse: ApiResponse<never> = {
        success: false,
        error: 'Route GET undefined not found',
        timestamp: expect.any(String),
      };

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle missing request IP', () => {
      // Arrange
      mockRequest.ip = undefined;

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith('404 Not Found:', {
        method: 'GET',
        url: '/nonexistent-endpoint',
        ip: undefined,
        userAgent: 'Test User Agent',
      });
    });

    it('should handle missing request URL', () => {
      // Arrange
      mockRequest.url = undefined;

      // Act
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith('404 Not Found:', {
        method: 'GET',
        url: undefined,
        ip: '127.0.0.1',
        userAgent: 'Test User Agent',
      });
    });

    it('should handle request.get throwing an error', () => {
      // Arrange
      (mockRequest.get as jest.Mock).mockImplementation(() => {
        throw new Error('Header access error');
      });

      // Act & Assert
      expect(() => {
        notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Header access error');
    });

    it('should handle logger.warn throwing an error', () => {
      // Arrange
      mockLogger.warn.mockImplementation(() => {
        throw new Error('Logger error');
      });

      // Act & Assert
      expect(() => {
        notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Logger error');
    });

    it('should handle response.status throwing an error', () => {
      // Arrange
      mockResponse.status = jest.fn().mockImplementation(() => {
        throw new Error('Status error');
      });

      // Act & Assert
      expect(() => {
        notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Status error');
    });

    it('should handle response.json throwing an error', () => {
      // Arrange
      mockResponse.json = jest.fn().mockImplementation(() => {
        throw new Error('JSON error');
      });

      // Act & Assert
      expect(() => {
        notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('JSON error');
    });

    it('should handle completely malformed request object', () => {
      // Arrange
      const malformedRequest = {} as Request;

      // Act
      notFoundHandler(malformedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Route undefined undefined not found',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('HTTP Methods Coverage', () => {
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

    httpMethods.forEach(method => {
      it(`should handle ${method} request correctly`, () => {
        // Arrange
        mockRequest.method = method;
        mockRequest.path = `/api/test-${method.toLowerCase()}`;
        const expectedResponse: ApiResponse<never> = {
          success: false,
          error: `Route ${method} /api/test-${method.toLowerCase()} not found`,
          timestamp: expect.any(String),
        };

        // Act
        notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
        expect(mockLogger.warn).toHaveBeenCalledWith('404 Not Found:', {
          method,
          url: `/api/test-${method.toLowerCase()}`,
          ip: '127.0.0.1',
          userAgent: 'Test User Agent',
        });
      });
    });
  });

  describe('Common API Endpoints', () => {
    const commonEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/users',
      '/api/offers',
      '/api/surveys',
      '/api/questions',
      '/api/analytics',
      '/api/dashboard',
      '/api/settings',
      '/api/health',
    ];

    commonEndpoints.forEach(endpoint => {
      it(`should handle missing ${endpoint} endpoint`, () => {
        // Arrange
        mockRequest.path = endpoint;
        const expectedResponse: ApiResponse<never> = {
          success: false,
          error: `Route GET ${endpoint} not found`,
          timestamp: expect.any(String),
        };

        // Act
        notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });
    });
  });
});