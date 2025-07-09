/**
 * @fileoverview Dashboard validation middleware
 * 
 * Express middleware functions for validating dashboard requests
 * using Joi schemas to ensure data integrity and security.
 */

import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createBadRequestError } from '../middleware/errorHandler';

/**
 * Schema for validating dashboard metrics requests
 * GET /api/dashboard/metrics
 */
export const dashboardMetricsSchema = Joi.object({
  timeRange: Joi.string()
    .valid('last24h', 'last7d', 'last30d')
    .default('last7d')
    .messages({
      'string.base': 'Time range must be a string',
      'any.only': 'Time range must be one of: last24h, last7d, last30d'
    }),
  
  offerIds: Joi.alternatives()
    .try(
      Joi.string().min(1).max(255),
      Joi.array().items(Joi.string().min(1).max(255))
    )
    .optional()
    .messages({
      'string.base': 'Offer ID must be a string',
      'string.empty': 'Offer ID cannot be empty',
      'string.min': 'Offer ID must be at least 1 character long',
      'string.max': 'Offer ID must not exceed 255 characters',
      'array.base': 'Offer IDs must be an array of strings'
    }),
  
  minEPC: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Minimum EPC must be a number',
      'number.min': 'Minimum EPC must be greater than or equal to 0',
      'number.precision': 'Minimum EPC must have at most 2 decimal places'
    })
});

/**
 * Format Joi validation errors for API responses
 * 
 * @param error - Joi validation error
 * @returns Formatted error message
 */
export const formatValidationError = (error: Joi.ValidationError): string => {
  return error.details
    .map(detail => detail.message)
    .join(', ');
};

/**
 * Middleware to validate dashboard metrics requests
 * Validates query parameters for GET /api/dashboard/metrics
 */
export const validateDashboardMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = dashboardMetricsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Dashboard metrics validation failed: ${errorMessage}`));
  }

  // Replace request query with validated and sanitized data
  req.query = value;
  next();
};

/**
 * Validate request data against a Joi schema
 * 
 * @param schema - Joi schema to validate against
 * @param data - Data to validate
 * @returns Validation result with error details if invalid
 */
export const validateSchema = (schema: Joi.ObjectSchema, data: unknown) => {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });
};

/**
 * Common validation patterns for dashboard
 */
export const dashboardValidationPatterns = {
  // Time range pattern
  timeRange: /^(last24h|last7d|last30d)$/,
  
  // Offer ID pattern (UUID or custom format)
  offerId: /^[a-zA-Z0-9_-]+$/,
  
  // EPC value pattern (positive number with up to 2 decimal places)
  epc: /^\d+(\.\d{1,2})?$/
};