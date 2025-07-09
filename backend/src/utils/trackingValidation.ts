/**
 * @fileoverview Tracking validation schemas
 * 
 * Joi validation schemas for tracking endpoints to ensure proper
 * input validation and data integrity for click tracking and conversion.
 */

import Joi from 'joi';

/**
 * Schema for validating click tracking requests
 * POST /api/track/click
 */
export const trackClickSchema = Joi.object({
  sessionId: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Session ID must be a string',
      'string.empty': 'Session ID cannot be empty',
      'string.min': 'Session ID must be at least 1 character long',
      'string.max': 'Session ID must not exceed 255 characters',
      'any.required': 'Session ID is required'
    }),
  
  questionId: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Question ID must be a string',
      'string.empty': 'Question ID cannot be empty',
      'string.min': 'Question ID must be at least 1 character long',
      'string.max': 'Question ID must not exceed 255 characters',
      'any.required': 'Question ID is required'
    }),
  
  offerId: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Offer ID must be a string',
      'string.empty': 'Offer ID cannot be empty',
      'string.min': 'Offer ID must be at least 1 character long',
      'string.max': 'Offer ID must not exceed 255 characters',
      'any.required': 'Offer ID is required'
    }),
  
  buttonVariantId: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Button variant ID must be a string',
      'string.empty': 'Button variant ID cannot be empty',
      'string.min': 'Button variant ID must be at least 1 character long',
      'string.max': 'Button variant ID must not exceed 255 characters',
      'any.required': 'Button variant ID is required'
    }),
  
  timestamp: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Timestamp must be a number',
      'number.integer': 'Timestamp must be an integer',
      'number.positive': 'Timestamp must be positive'
    }),
  
  userAgent: Joi.string().max(1000).optional()
    .messages({
      'string.base': 'User Agent must be a string',
      'string.max': 'User Agent must not exceed 1000 characters'
    }),
  
  ipAddress: Joi.string().ip().optional()
    .messages({
      'string.base': 'IP Address must be a string',
      'string.ip': 'IP Address must be a valid IP address'
    })
});

/**
 * Schema for validating conversion recording requests
 * GET /api/track/conversion?click_id=...&revenue=...
 * POST /api/track/conversion
 */
export const recordConversionQuerySchema = Joi.object({
  click_id: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Click ID must be a string',
      'string.empty': 'Click ID cannot be empty',
      'string.min': 'Click ID must be at least 1 character long',
      'string.max': 'Click ID must not exceed 255 characters',
      'any.required': 'Click ID is required'
    }),
  
  revenue: Joi.number().positive().precision(2).optional()
    .messages({
      'number.base': 'Revenue must be a number',
      'number.positive': 'Revenue must be positive',
      'number.precision': 'Revenue must have at most 2 decimal places'
    })
});

/**
 * Schema for validating conversion recording POST body
 * POST /api/track/conversion
 */
export const recordConversionBodySchema = Joi.object({
  click_id: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Click ID must be a string',
      'string.empty': 'Click ID cannot be empty',
      'string.min': 'Click ID must be at least 1 character long',
      'string.max': 'Click ID must not exceed 255 characters',
      'any.required': 'Click ID is required'
    }),
  
  revenue: Joi.number().positive().precision(2).optional()
    .messages({
      'number.base': 'Revenue must be a number',
      'number.positive': 'Revenue must be positive',
      'number.precision': 'Revenue must have at most 2 decimal places'
    })
});

/**
 * Schema for validating pixel generation requests
 * POST /api/track/pixel
 */
export const generatePixelSchema = Joi.object({
  clickId: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Click ID must be a string',
      'string.empty': 'Click ID cannot be empty',
      'string.min': 'Click ID must be at least 1 character long',
      'string.max': 'Click ID must not exceed 255 characters',
      'any.required': 'Click ID is required'
    }),
  
  surveyId: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Survey ID must be a string',
      'string.empty': 'Survey ID cannot be empty',
      'string.min': 'Survey ID must be at least 1 character long',
      'string.max': 'Survey ID must not exceed 255 characters',
      'any.required': 'Survey ID is required'
    })
});

/**
 * Schema for validating pixel tracking requests
 * GET /api/track/pixel/:click_id?revenue=...
 */
export const handlePixelParamsSchema = Joi.object({
  click_id: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Click ID must be a string',
      'string.empty': 'Click ID cannot be empty',
      'string.min': 'Click ID must be at least 1 character long',
      'string.max': 'Click ID must not exceed 255 characters',
      'any.required': 'Click ID is required'
    })
});

/**
 * Schema for validating pixel tracking query parameters
 * GET /api/track/pixel/:click_id?revenue=...
 */
export const handlePixelQuerySchema = Joi.object({
  revenue: Joi.number().positive().precision(2).optional()
    .messages({
      'number.base': 'Revenue must be a number',
      'number.positive': 'Revenue must be positive',
      'number.precision': 'Revenue must have at most 2 decimal places'
    })
});

/**
 * Schema for validating analytics requests
 * GET /api/track/analytics?offerId=...
 */
export const getAnalyticsSchema = Joi.object({
  offerId: Joi.string().min(1).max(255).optional()
    .messages({
      'string.base': 'Offer ID must be a string',
      'string.empty': 'Offer ID cannot be empty',
      'string.min': 'Offer ID must be at least 1 character long',
      'string.max': 'Offer ID must not exceed 255 characters'
    })
});

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
 * Common validation patterns
 */
export const validationPatterns = {
  // UUID pattern for IDs
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  // Click ID pattern (allows UUID or custom format)
  clickId: /^[a-zA-Z0-9_-]+$/,
  
  // Session ID pattern
  sessionId: /^[a-zA-Z0-9_-]+$/,
  
  // Offer ID pattern (UUID or custom format)
  offerId: /^[a-zA-Z0-9_-]+$/
};