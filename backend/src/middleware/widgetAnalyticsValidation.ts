/**
 * @fileoverview Widget analytics validation middleware
 * 
 * Express middleware functions for validating widget analytics requests
 * using Joi schemas to ensure data integrity and security.
 */

import type { Request, Response, NextFunction } from 'express';
import { createBadRequestError } from './errorHandler';
import { logger } from '../utils/logger';
import { 
  widgetAnalyticsEventSchema,
  widgetAnalyticsAggregationSchema,
  formatValidationError
} from '../validators/widgetAnalyticsValidator';

/**
 * Middleware to validate widget analytics event requests
 * Validates request body for POST /api/widget/analytics
 */
export const validateWidgetAnalyticsEvent = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = widgetAnalyticsEventSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Widget analytics event validation failed: ${errorMessage}`));
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

/**
 * Middleware to validate widget analytics aggregation requests
 * Validates query parameters for GET /api/widget/analytics/aggregation
 */
export const validateWidgetAnalyticsAggregation = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = widgetAnalyticsAggregationSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Widget analytics aggregation validation failed: ${errorMessage}`));
  }

  // Replace request query with validated and sanitized data
  req.query = value;
  next();
};

/**
 * Middleware to validate survey ID parameter
 * Validates path parameters for GET /api/widget/analytics/summary/:surveyId
 */
export const validateSurveyIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const { surveyId } = req.params;
  
  if (!surveyId || typeof surveyId !== 'string' || surveyId.trim().length === 0) {
    return next(createBadRequestError('Survey ID parameter is required and must be a non-empty string'));
  }

  if (surveyId.length > 255) {
    return next(createBadRequestError('Survey ID parameter must not exceed 255 characters'));
  }

  // Basic pattern validation
  if (!/^[a-zA-Z0-9_-]+$/.test(surveyId)) {
    return next(createBadRequestError('Survey ID parameter contains invalid characters'));
  }

  next();
};

/**
 * Request logging middleware for widget analytics endpoints
 * Logs widget analytics requests for debugging and monitoring
 */
export const logWidgetAnalyticsRequest = (req: Request, res: Response, next: NextFunction): void => {
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
  logger.info('Widget analytics request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: logData.timestamp,
    hasBody: req.method === 'POST' && !!req.body,
    hasQuery: Object.keys(req.query).length > 0,
    hasParams: Object.keys(req.params).length > 0,
    correlationId: req.get('X-Correlation-ID') || `widget_${Date.now()}`
  });

  // Add response time logging
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.info('Widget analytics request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      correlationId: req.get('X-Correlation-ID') || `widget_${Date.now()}`
    });
  });

  next();
};

/**
 * Security headers middleware for widget analytics endpoints
 * Adds security headers to widget analytics responses
 */
export const addWidgetAnalyticsSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // For widget analytics, allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  next();
};

/**
 * Rate limiting middleware for widget analytics endpoints
 * Implements basic rate limiting to prevent abuse
 */
export const rateLimitWidgetAnalytics = (req: Request, res: Response, next: NextFunction): void => {
  // Basic rate limiting can be implemented here
  // For now, we'll just pass through to maintain middleware chain
  // In production, consider using express-rate-limit or similar
  next();
};

/**
 * Comprehensive widget analytics middleware chain
 * Combines all widget analytics middleware for easy application
 */
export const widgetAnalyticsMiddleware = [
  addWidgetAnalyticsSecurityHeaders,
  logWidgetAnalyticsRequest,
  rateLimitWidgetAnalytics
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