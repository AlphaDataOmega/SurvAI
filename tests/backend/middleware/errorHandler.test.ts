/**
 * @fileoverview Error handler middleware tests
 * 
 * Comprehensive tests for the global error handling middleware
 * including different error types, status codes, and response formatting.
 */

import type { Request, Response, NextFunction } from 'express';
import { 
  errorHandler, 
  ApiError,
  createBadRequestError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createInternalError
} from '../../../backend/src/middleware/errorHandler';
import { logger } from '../../../backend/src/utils/logger';
import { ApiErrorType } from '@survai/shared';

// Mock dependencies
jest.mock('../../../backend/src/utils/logger');

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent'),
      headers: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };

    // Setup mock next function
    mockNext = jest.fn();

    // Setup logger mocks
    mockLogger.error = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.info = jest.fn();
    mockLogger.debug = jest.fn();
  });

  describe('ApiError class', () => {
    it('should create ApiError with default values', () => {
      const error = new ApiError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe(ApiErrorType.INTERNAL_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('Error');
    });

    it('should create ApiError with custom values', () => {
      const error = new ApiError(
        'Validation failed',
        400,
        ApiErrorType.VALIDATION_ERROR,
        false
      );
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ApiErrorType.VALIDATION_ERROR);
      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new ApiError('Test error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });
  });

  describe('errorHandler function', () => {
    it('should handle ApiError correctly', () => {
      // Arrange
      const error = new ApiError('Test API error', 400, ApiErrorType.VALIDATION_ERROR);
      const expectedResponse = {
        success: false,
        error: 'Test API error',
        details: {
          type: ApiErrorType.VALIDATION_ERROR,
          message: 'Test API error',
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockLogger.warn).toHaveBeenCalledWith('API Error:', expect.any(Object));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle ValidationError', () => {
      // Arrange
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      const expectedResponse = {
        success: false,
        error: 'Validation failed',
        details: {
          type: ApiErrorType.VALIDATION_ERROR,
          message: 'Validation failed',
          context: {
            details: 'Validation failed',
          },
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockLogger.warn).toHaveBeenCalledWith('API Error:', expect.any(Object));
    });

    it('should handle UnauthorizedError', () => {
      // Arrange
      const error = new Error('Unauthorized access');
      error.name = 'UnauthorizedError';
      const expectedResponse = {
        success: false,
        error: 'Unauthorized',
        details: {
          type: ApiErrorType.AUTHENTICATION_ERROR,
          message: 'Unauthorized',
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockLogger.warn).toHaveBeenCalledWith('API Error:', expect.any(Object));
    });

    it('should handle ForbiddenError', () => {
      // Arrange
      const error = new Error('Forbidden access');
      error.name = 'ForbiddenError';
      const expectedResponse = {
        success: false,
        error: 'Forbidden',
        details: {
          type: ApiErrorType.AUTHORIZATION_ERROR,
          message: 'Forbidden',
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockLogger.warn).toHaveBeenCalledWith('API Error:', expect.any(Object));
    });

    it('should handle NotFoundError', () => {
      // Arrange
      const error = new Error('Resource not found');
      error.name = 'NotFoundError';
      const expectedResponse = {
        success: false,
        error: 'Resource not found',
        details: {
          type: ApiErrorType.NOT_FOUND_ERROR,
          message: 'Resource not found',
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockLogger.warn).toHaveBeenCalledWith('API Error:', expect.any(Object));
    });

    it('should handle ConflictError', () => {
      // Arrange
      const error = new Error('Resource conflict');
      error.name = 'ConflictError';
      const expectedResponse = {
        success: false,
        error: 'Resource conflict',
        details: {
          type: ApiErrorType.CONFLICT_ERROR,
          message: 'Resource conflict',
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockLogger.warn).toHaveBeenCalledWith('API Error:', expect.any(Object));
    });

    it('should handle generic Error with default values', () => {
      // Arrange
      const error = new Error('Some generic error');
      const expectedResponse = {
        success: false,
        error: 'Internal server error',
        details: {
          type: ApiErrorType.INTERNAL_ERROR,
          message: 'Internal server error',
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockLogger.error).toHaveBeenCalledWith('API Error:', expect.any(Object));
    });

    it('should skip handling when headers are already sent', () => {
      // Arrange
      const error = new Error('Test error');
      mockResponse.headersSent = true;

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should log with error level for 5xx status codes', () => {
      // Arrange
      const error = new ApiError('Server error', 500, ApiErrorType.INTERNAL_ERROR);

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        error: expect.objectContaining({
          message: 'Server error',
          statusCode: 500,
          type: ApiErrorType.INTERNAL_ERROR,
        }),
        request: expect.objectContaining({
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
        }),
      }));
    });

    it('should log with warn level for 4xx status codes', () => {
      // Arrange
      const error = new ApiError('Client error', 400, ApiErrorType.VALIDATION_ERROR);

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        error: expect.objectContaining({
          message: 'Client error',
          statusCode: 400,
          type: ApiErrorType.VALIDATION_ERROR,
        }),
        request: expect.objectContaining({
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
        }),
      }));
    });

    it('should include request ID in response when present', () => {
      // Arrange
      const error = new Error('Test error');
      const requestId = 'test-request-id';
      mockRequest.headers = { 'x-request-id': requestId };
      const expectedResponse = {
        success: false,
        error: 'Internal server error',
        details: {
          type: ApiErrorType.INTERNAL_ERROR,
          message: 'Internal server error',
          requestId,
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should include user agent in log when present', () => {
      // Arrange
      const error = new Error('Test error');
      const userAgent = 'Mozilla/5.0 Test Browser';
      (mockRequest.get as jest.Mock).mockReturnValue(userAgent);

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        request: expect.objectContaining({
          userAgent,
        }),
      }));
    });

    it('should handle missing request properties gracefully', () => {
      // Arrange
      const error = new Error('Test error');
      mockRequest = {
        get: jest.fn().mockReturnValue(undefined),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockLogger.error).toHaveBeenCalledWith('API Error:', expect.objectContaining({
        request: expect.objectContaining({
          method: undefined,
          url: undefined,
          ip: undefined,
          userAgent: undefined,
        }),
      }));
    });
  });

  describe('Error creator functions', () => {
    it('should create BadRequestError correctly', () => {
      const error = createBadRequestError('Bad request');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe(ApiErrorType.VALIDATION_ERROR);
    });

    it('should create UnauthorizedError correctly', () => {
      const error = createUnauthorizedError('Unauthorized');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe(ApiErrorType.AUTHENTICATION_ERROR);
    });

    it('should create UnauthorizedError with default message', () => {
      const error = createUnauthorizedError();
      
      expect(error.message).toBe('Unauthorized');
    });

    it('should create ForbiddenError correctly', () => {
      const error = createForbiddenError('Forbidden');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.type).toBe(ApiErrorType.AUTHORIZATION_ERROR);
    });

    it('should create ForbiddenError with default message', () => {
      const error = createForbiddenError();
      
      expect(error.message).toBe('Forbidden');
    });

    it('should create NotFoundError correctly', () => {
      const error = createNotFoundError('Not found');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.type).toBe(ApiErrorType.NOT_FOUND_ERROR);
    });

    it('should create NotFoundError with default message', () => {
      const error = createNotFoundError();
      
      expect(error.message).toBe('Resource not found');
    });

    it('should create ConflictError correctly', () => {
      const error = createConflictError('Conflict');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Conflict');
      expect(error.statusCode).toBe(409);
      expect(error.type).toBe(ApiErrorType.CONFLICT_ERROR);
    });

    it('should create InternalError correctly', () => {
      const error = createInternalError('Internal error');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Internal error');
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe(ApiErrorType.INTERNAL_ERROR);
    });

    it('should create InternalError with default message', () => {
      const error = createInternalError();
      
      expect(error.message).toBe('Internal server error');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle error with no message', () => {
      // Arrange
      const error = new Error();
      const expectedResponse = {
        success: false,
        error: 'Internal server error',
        details: {
          type: ApiErrorType.INTERNAL_ERROR,
          message: 'Internal server error',
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle error with no name property', () => {
      // Arrange
      const error = { message: 'Test error' } as Error;
      const expectedResponse = {
        success: false,
        error: 'Internal server error',
        details: {
          type: ApiErrorType.INTERNAL_ERROR,
          message: 'Internal server error',
        },
        timestamp: expect.any(String),
      };

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should handle null error object', () => {
      // Arrange
      const error = null as any;

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Internal server error',
      }));
    });

    it('should handle undefined error object', () => {
      // Arrange
      const error = undefined as any;

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Internal server error',
      }));
    });

    it('should handle response.status throwing an error', () => {
      // Arrange
      const error = new Error('Test error');
      mockResponse.status = jest.fn().mockImplementation(() => {
        throw new Error('Response error');
      });

      // Act & Assert
      expect(() => {
        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Response error');
    });

    it('should handle response.json throwing an error', () => {
      // Arrange
      const error = new Error('Test error');
      mockResponse.json = jest.fn().mockImplementation(() => {
        throw new Error('JSON error');
      });

      // Act & Assert
      expect(() => {
        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('JSON error');
    });

    it('should handle logger throwing an error', () => {
      // Arrange
      const error = new Error('Test error');
      mockLogger.error.mockImplementation(() => {
        throw new Error('Logger error');
      });

      // Act & Assert
      expect(() => {
        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Logger error');
    });
  });
});