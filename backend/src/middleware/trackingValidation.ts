/**
 * @fileoverview Tracking validation middleware
 * 
 * Express middleware functions for validating tracking requests
 * using Joi schemas to ensure data integrity and security.
 */

import type { Request, Response, NextFunction } from 'express';
import { createBadRequestError } from './errorHandler';
import { logger } from '../utils/logger';
import { 
  trackClickSchema,
  recordConversionQuerySchema,
  recordConversionBodySchema,
  generatePixelSchema,
  handlePixelParamsSchema,
  handlePixelQuerySchema,
  getAnalyticsSchema,
  formatValidationError
} from '../utils/trackingValidation';

/**
 * Middleware to validate click tracking requests
 * Validates request body for POST /api/track/click
 */
export const validateTrackClick = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = trackClickSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Click tracking validation failed: ${errorMessage}`));
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

/**
 * Middleware to validate conversion recording requests (GET method)
 * Validates query parameters for GET /api/track/conversion
 */
export const validateRecordConversionQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = recordConversionQuerySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Conversion recording validation failed: ${errorMessage}`));
  }

  // Replace request query with validated and sanitized data
  req.query = value;
  next();
};

/**
 * Middleware to validate conversion recording requests (POST method)
 * Validates request body for POST /api/track/conversion
 */
export const validateRecordConversionBody = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = recordConversionBodySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Conversion recording validation failed: ${errorMessage}`));
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

/**
 * Middleware to validate pixel generation requests
 * Validates request body for POST /api/track/pixel
 */
export const validateGeneratePixel = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = generatePixelSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Pixel generation validation failed: ${errorMessage}`));
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

/**
 * Middleware to validate pixel tracking requests
 * Validates path parameters for GET /api/track/pixel/:click_id
 */
export const validateHandlePixelParams = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = handlePixelParamsSchema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Pixel tracking params validation failed: ${errorMessage}`));
  }

  // Replace request params with validated and sanitized data
  req.params = value;
  next();
};

/**
 * Middleware to validate pixel tracking query parameters
 * Validates query parameters for GET /api/track/pixel/:click_id
 */
export const validateHandlePixelQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = handlePixelQuerySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Pixel tracking query validation failed: ${errorMessage}`));
  }

  // Replace request query with validated and sanitized data
  req.query = value;
  next();
};

/**
 * Middleware to validate analytics requests
 * Validates query parameters for GET /api/track/analytics
 */
export const validateGetAnalytics = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = getAnalyticsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Analytics validation failed: ${errorMessage}`));
  }

  // Replace request query with validated and sanitized data
  req.query = value;
  next();
};

/**
 * Combined middleware for pixel tracking (params + query)
 * Validates both path parameters and query parameters for GET /api/track/pixel/:click_id
 */
export const validateHandlePixel = [
  validateHandlePixelParams,
  validateHandlePixelQuery
];

/**
 * Session and offer validation middleware
 * Validates that session and offer exist and are valid before processing
 */
export const validateSessionAndOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // This will be implemented in the controller enhancement
    // For now, we'll just pass through to maintain middleware chain
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Request logging middleware for tracking endpoints
 * Logs tracking requests for debugging and monitoring
 */
export const logTrackingRequest = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request details
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: req.method === 'POST' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    params: Object.keys(req.params).length > 0 ? req.params : undefined
  };

  // Log the request using structured logging
  logger.info('Tracking request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: logData.timestamp,
    hasBody: req.method === 'POST' && !!req.body,
    hasQuery: Object.keys(req.query).length > 0,
    hasParams: Object.keys(req.params).length > 0,
    correlationId: req.get('X-Correlation-ID') || `tracking_${Date.now()}`
  });

  // Add response time logging
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.info('Tracking request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      correlationId: req.get('X-Correlation-ID') || `tracking_${Date.now()}`
    });
  });

  next();
};

/**
 * Rate limiting middleware for tracking endpoints
 * Implements basic rate limiting to prevent abuse
 */
export const rateLimitTracking = (req: Request, res: Response, next: NextFunction): void => {
  // Basic rate limiting can be implemented here
  // For now, we'll just pass through to maintain middleware chain
  // In production, consider using express-rate-limit or similar
  next();
};

/**
 * Security headers middleware for tracking endpoints
 * Adds security headers to tracking responses
 */
export const addTrackingSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // For pixel tracking, allow cross-origin requests
  if (req.path.includes('/pixel/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  next();
};

/**
 * Comprehensive tracking middleware chain
 * Combines all tracking middleware for easy application
 */
export const trackingMiddleware = [
  addTrackingSecurityHeaders,
  logTrackingRequest,
  rateLimitTracking
];

/**
 * Error wrapper for async middleware
 * Wraps async middleware to properly handle errors
 */
export const asyncMiddleware = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};