/**
 * @fileoverview Global error handling middleware
 * 
 * Centralized error handling for the Express application
 * with proper logging and standardized error responses.
 */

import type { Request, Response, NextFunction } from 'express';
import { ApiResponse, ApiErrorResponse, ApiErrorType } from '@survai/shared';
import { logger } from '../utils/logger';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly type: ApiErrorType;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    type: ApiErrorType = ApiErrorType.INTERNAL_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Must be placed after all other middleware and routes
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Default error values
  let statusCode = 500;
  let errorType: ApiErrorType = ApiErrorType.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: unknown = undefined;

  // Handle different error types
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    errorType = error.type;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorType = ApiErrorType.VALIDATION_ERROR;
    message = 'Validation failed';
    details = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorType = ApiErrorType.AUTHENTICATION_ERROR;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorType = ApiErrorType.AUTHORIZATION_ERROR;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorType = ApiErrorType.NOT_FOUND_ERROR;
    message = 'Resource not found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    errorType = ApiErrorType.CONFLICT_ERROR;
    message = 'Resource conflict';
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('API Error:', {
    error: {
      message: error.message,
      stack: error.stack,
      type: errorType,
      statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  // Create error response
  const errorResponse: ApiErrorResponse = {
    type: errorType,
    message,
  };

  if (details) {
    errorResponse.context = { details };
  }

  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'] as string;
  }

  const response: ApiResponse<never> = {
    success: false,
    error: message,
    details: errorResponse,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

/**
 * Create a 400 Bad Request error
 */
export const createBadRequestError = (message: string): ApiError => new ApiError(message, 400, ApiErrorType.VALIDATION_ERROR);

/**
 * Create a 401 Unauthorized error
 */
export const createUnauthorizedError = (message: string = 'Unauthorized'): ApiError => new ApiError(message, 401, ApiErrorType.AUTHENTICATION_ERROR);

/**
 * Create a 403 Forbidden error
 */
export const createForbiddenError = (message: string = 'Forbidden'): ApiError => new ApiError(message, 403, ApiErrorType.AUTHORIZATION_ERROR);

/**
 * Create a 404 Not Found error
 */
export const createNotFoundError = (message: string = 'Resource not found'): ApiError => new ApiError(message, 404, ApiErrorType.NOT_FOUND_ERROR);

/**
 * Create a 409 Conflict error
 */
export const createConflictError = (message: string): ApiError => new ApiError(message, 409, ApiErrorType.CONFLICT_ERROR);

/**
 * Create a 500 Internal Server error
 */
export const createInternalError = (message: string = 'Internal server error'): ApiError => new ApiError(message, 500, ApiErrorType.INTERNAL_ERROR);