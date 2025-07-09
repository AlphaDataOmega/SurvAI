/**
 * @fileoverview Widget analytics validation schemas
 * 
 * Joi validation schemas for widget analytics endpoints to ensure proper
 * input validation and data integrity for analytics beacon events.
 */

import Joi from 'joi';

/**
 * Schema for validating widget analytics event requests
 * POST /api/widget/analytics
 */
export const widgetAnalyticsEventSchema = Joi.object({
  surveyId: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Survey ID must be a string',
      'string.empty': 'Survey ID cannot be empty',
      'string.min': 'Survey ID must be at least 1 character long',
      'string.max': 'Survey ID must not exceed 255 characters',
      'any.required': 'Survey ID is required'
    }),
  
  event: Joi.string().valid('loaded', 'dwell').required()
    .messages({
      'string.base': 'Event must be a string',
      'any.only': 'Event must be either "loaded" or "dwell"',
      'any.required': 'Event is required'
    }),
  
  dwellTimeMs: Joi.number().integer().min(0).max(3600000).when('event', {
    is: 'dwell',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }).messages({
    'number.base': 'Dwell time must be a number',
    'number.integer': 'Dwell time must be an integer',
    'number.min': 'Dwell time must be 0 or greater',
    'number.max': 'Dwell time must not exceed 1 hour (3600000ms)',
    'any.required': 'Dwell time is required for dwell events',
    'any.unknown': 'Dwell time is not allowed for loaded events'
  }),
  
  metadata: Joi.object().optional()
    .messages({
      'object.base': 'Metadata must be an object'
    })
});

/**
 * Schema for validating widget analytics aggregation requests
 * GET /api/widget/analytics/aggregation
 */
export const widgetAnalyticsAggregationSchema = Joi.object({
  surveyId: Joi.string().min(1).max(255).optional()
    .messages({
      'string.base': 'Survey ID must be a string',
      'string.empty': 'Survey ID cannot be empty',
      'string.min': 'Survey ID must be at least 1 character long',
      'string.max': 'Survey ID must not exceed 255 characters'
    }),
  
  days: Joi.number().integer().min(1).max(90).default(7)
    .messages({
      'number.base': 'Days must be a number',
      'number.integer': 'Days must be an integer',
      'number.min': 'Days must be at least 1',
      'number.max': 'Days must not exceed 90'
    }),
  
  timezone: Joi.string().default('UTC')
    .messages({
      'string.base': 'Timezone must be a string'
    })
});

/**
 * Format validation error messages
 * @param error - Joi validation error
 * @returns Formatted error message
 */
export const formatValidationError = (error: Joi.ValidationError): string => {
  return error.details
    .map(detail => detail.message)
    .join(', ');
};

/**
 * Common validation patterns for widget analytics
 */
export const widgetAnalyticsPatterns = {
  // Survey ID pattern (UUID or custom format)
  surveyId: /^[a-zA-Z0-9_-]+$/,
  
  // Event types
  eventTypes: ['loaded', 'dwell'] as const,
  
  // Maximum dwell time (1 hour in milliseconds)
  maxDwellTimeMs: 3600000
};

/**
 * Type definitions for validated data
 */
export interface ValidatedWidgetAnalyticsEvent {
  surveyId: string;
  event: 'loaded' | 'dwell';
  dwellTimeMs?: number;
  metadata?: Record<string, any>;
}

export interface ValidatedWidgetAnalyticsAggregation {
  surveyId?: string;
  days: number;
  timezone: string;
}