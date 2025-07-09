/**
 * @fileoverview Offer validation middleware
 * 
 * Express middleware functions for validating offer requests
 * using Joi schemas to ensure data integrity and security.
 */

import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createBadRequestError } from '../middleware/errorHandler';

/**
 * Schema for creating a new offer
 * POST /api/offers
 */
export const createOfferSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title must not exceed 255 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description must not exceed 1000 characters'
    }),
  
  category: Joi.string()
    .valid('FINANCE', 'INSURANCE', 'HEALTH', 'EDUCATION', 'TECHNOLOGY', 'TRAVEL', 'SHOPPING', 'OTHER')
    .required()
    .messages({
      'string.base': 'Category must be a string',
      'any.only': 'Category must be one of: FINANCE, INSURANCE, HEALTH, EDUCATION, TECHNOLOGY, TRAVEL, SHOPPING, OTHER',
      'any.required': 'Category is required'
    }),
  
  destinationUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.base': 'Destination URL must be a string',
      'string.uri': 'Destination URL must be a valid URL',
      'any.required': 'Destination URL is required'
    }),
  
  config: Joi.object({
    payout: Joi.number()
      .min(0)
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Payout must be a number',
        'number.min': 'Payout must be greater than or equal to 0',
        'number.precision': 'Payout must have at most 2 decimal places'
      }),
    
    currency: Joi.string()
      .length(3)
      .uppercase()
      .default('USD')
      .optional()
      .messages({
        'string.base': 'Currency must be a string',
        'string.length': 'Currency must be exactly 3 characters',
        'string.uppercase': 'Currency must be uppercase'
      }),
    
    dailyClickCap: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Daily click cap must be a number',
        'number.integer': 'Daily click cap must be an integer',
        'number.min': 'Daily click cap must be at least 1'
      }),
    
    totalClickCap: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Total click cap must be a number',
        'number.integer': 'Total click cap must be an integer',
        'number.min': 'Total click cap must be at least 1'
      }),
    
    cooldownPeriod: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Cooldown period must be a number',
        'number.integer': 'Cooldown period must be an integer',
        'number.min': 'Cooldown period must be greater than or equal to 0'
      }),
    
    urlParams: Joi.object()
      .pattern(Joi.string(), Joi.string())
      .optional()
      .messages({
        'object.base': 'URL params must be an object',
        'object.pattern.match': 'URL params must be key-value pairs of strings'
      })
  })
    .optional()
    .messages({
      'object.base': 'Config must be an object'
    }),
  
  targeting: Joi.object({
    geoTargeting: Joi.array()
      .items(Joi.string().length(2).uppercase())
      .optional()
      .messages({
        'array.base': 'Geo targeting must be an array',
        'string.length': 'Country codes must be exactly 2 characters',
        'string.uppercase': 'Country codes must be uppercase'
      }),
    
    deviceTargeting: Joi.array()
      .items(Joi.string().valid('DESKTOP', 'MOBILE', 'TABLET'))
      .optional()
      .messages({
        'array.base': 'Device targeting must be an array',
        'any.only': 'Device targeting must contain only: DESKTOP, MOBILE, TABLET'
      }),
    
    timeTargeting: Joi.object({
      daysOfWeek: Joi.array()
        .items(Joi.number().integer().min(0).max(6))
        .optional()
        .messages({
          'array.base': 'Days of week must be an array',
          'number.integer': 'Days of week must be integers',
          'number.min': 'Day of week must be at least 0',
          'number.max': 'Day of week must be at most 6'
        }),
      
      hourRange: Joi.object({
        start: Joi.number().integer().min(0).max(23).required(),
        end: Joi.number().integer().min(0).max(23).required()
      })
        .optional()
        .messages({
          'object.base': 'Hour range must be an object',
          'number.integer': 'Hour must be an integer',
          'number.min': 'Hour must be at least 0',
          'number.max': 'Hour must be at most 23'
        }),
      
      timezone: Joi.string()
        .optional()
        .messages({
          'string.base': 'Timezone must be a string'
        })
    })
      .optional()
      .messages({
        'object.base': 'Time targeting must be an object'
      })
  })
    .optional()
    .messages({
      'object.base': 'Targeting must be an object'
    })
});

/**
 * Schema for updating an existing offer
 * PATCH /api/offers/:id
 */
export const updateOfferSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title must not exceed 255 characters'
    }),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description must not exceed 1000 characters'
    }),
  
  category: Joi.string()
    .valid('FINANCE', 'INSURANCE', 'HEALTH', 'EDUCATION', 'TECHNOLOGY', 'TRAVEL', 'SHOPPING', 'OTHER')
    .optional()
    .messages({
      'string.base': 'Category must be a string',
      'any.only': 'Category must be one of: FINANCE, INSURANCE, HEALTH, EDUCATION, TECHNOLOGY, TRAVEL, SHOPPING, OTHER'
    }),
  
  status: Joi.string()
    .valid('ACTIVE', 'PAUSED', 'EXPIRED', 'PENDING', 'ARCHIVED')
    .optional()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: ACTIVE, PAUSED, EXPIRED, PENDING, ARCHIVED'
    }),
  
  destinationUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.base': 'Destination URL must be a string',
      'string.uri': 'Destination URL must be a valid URL'
    }),
  
  config: Joi.object({
    payout: Joi.number()
      .min(0)
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Payout must be a number',
        'number.min': 'Payout must be greater than or equal to 0',
        'number.precision': 'Payout must have at most 2 decimal places'
      }),
    
    currency: Joi.string()
      .length(3)
      .uppercase()
      .optional()
      .messages({
        'string.base': 'Currency must be a string',
        'string.length': 'Currency must be exactly 3 characters',
        'string.uppercase': 'Currency must be uppercase'
      }),
    
    dailyClickCap: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Daily click cap must be a number',
        'number.integer': 'Daily click cap must be an integer',
        'number.min': 'Daily click cap must be at least 1'
      }),
    
    totalClickCap: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Total click cap must be a number',
        'number.integer': 'Total click cap must be an integer',
        'number.min': 'Total click cap must be at least 1'
      }),
    
    cooldownPeriod: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Cooldown period must be a number',
        'number.integer': 'Cooldown period must be an integer',
        'number.min': 'Cooldown period must be greater than or equal to 0'
      }),
    
    urlParams: Joi.object()
      .pattern(Joi.string(), Joi.string())
      .optional()
      .messages({
        'object.base': 'URL params must be an object',
        'object.pattern.match': 'URL params must be key-value pairs of strings'
      })
  })
    .optional()
    .messages({
      'object.base': 'Config must be an object'
    }),
  
  targeting: Joi.object({
    geoTargeting: Joi.array()
      .items(Joi.string().length(2).uppercase())
      .optional()
      .messages({
        'array.base': 'Geo targeting must be an array',
        'string.length': 'Country codes must be exactly 2 characters',
        'string.uppercase': 'Country codes must be uppercase'
      }),
    
    deviceTargeting: Joi.array()
      .items(Joi.string().valid('DESKTOP', 'MOBILE', 'TABLET'))
      .optional()
      .messages({
        'array.base': 'Device targeting must be an array',
        'any.only': 'Device targeting must contain only: DESKTOP, MOBILE, TABLET'
      }),
    
    timeTargeting: Joi.object({
      daysOfWeek: Joi.array()
        .items(Joi.number().integer().min(0).max(6))
        .optional()
        .messages({
          'array.base': 'Days of week must be an array',
          'number.integer': 'Days of week must be integers',
          'number.min': 'Day of week must be at least 0',
          'number.max': 'Day of week must be at most 6'
        }),
      
      hourRange: Joi.object({
        start: Joi.number().integer().min(0).max(23).required(),
        end: Joi.number().integer().min(0).max(23).required()
      })
        .optional()
        .messages({
          'object.base': 'Hour range must be an object',
          'number.integer': 'Hour must be an integer',
          'number.min': 'Hour must be at least 0',
          'number.max': 'Hour must be at most 23'
        }),
      
      timezone: Joi.string()
        .optional()
        .messages({
          'string.base': 'Timezone must be a string'
        })
    })
      .optional()
      .messages({
        'object.base': 'Time targeting must be an object'
      })
  })
    .optional()
    .messages({
      'object.base': 'Targeting must be an object'
    })
});

/**
 * Schema for listing offers
 * GET /api/offers
 */
export const listOffersSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must be at most 100'
    }),
  
  category: Joi.string()
    .valid('FINANCE', 'INSURANCE', 'HEALTH', 'EDUCATION', 'TECHNOLOGY', 'TRAVEL', 'SHOPPING', 'OTHER')
    .optional()
    .messages({
      'string.base': 'Category must be a string',
      'any.only': 'Category must be one of: FINANCE, INSURANCE, HEALTH, EDUCATION, TECHNOLOGY, TRAVEL, SHOPPING, OTHER'
    }),
  
  status: Joi.string()
    .valid('ACTIVE', 'PAUSED', 'EXPIRED', 'PENDING', 'ARCHIVED')
    .optional()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: ACTIVE, PAUSED, EXPIRED, PENDING, ARCHIVED'
    }),
  
  search: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.base': 'Search must be a string',
      'string.max': 'Search must not exceed 255 characters'
    }),
  
  sortBy: Joi.string()
    .valid('title', 'category', 'status', 'createdAt', 'updatedAt', 'epc')
    .default('createdAt')
    .optional()
    .messages({
      'string.base': 'Sort by must be a string',
      'any.only': 'Sort by must be one of: title, category, status, createdAt, updatedAt, epc'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
    .messages({
      'string.base': 'Sort order must be a string',
      'any.only': 'Sort order must be either: asc, desc'
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
 * Schema for toggling offer status
 * PATCH /api/offers/:id/toggle
 */
export const toggleOfferSchema = Joi.object({
  status: Joi.string()
    .valid('ACTIVE', 'PAUSED')
    .required()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be either: ACTIVE, PAUSED',
      'any.required': 'Status is required'
    })
});

/**
 * Schema for offer ID parameter validation
 */
export const offerIdSchema = Joi.object({
  id: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.base': 'Offer ID must be a string',
      'string.empty': 'Offer ID cannot be empty',
      'string.min': 'Offer ID must be at least 1 character long',
      'string.max': 'Offer ID must not exceed 255 characters',
      'any.required': 'Offer ID is required'
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
 * Middleware to validate offer creation requests
 * Validates body for POST /api/offers
 */
export const validateCreateOffer = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = createOfferSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Offer creation validation failed: ${errorMessage}`));
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

/**
 * Middleware to validate offer update requests
 * Validates body for PATCH /api/offers/:id
 */
export const validateUpdateOffer = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = updateOfferSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Offer update validation failed: ${errorMessage}`));
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

/**
 * Middleware to validate offer listing requests
 * Validates query parameters for GET /api/offers
 */
export const validateListOffers = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = listOffersSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Offer listing validation failed: ${errorMessage}`));
  }

  // Replace request query with validated and sanitized data
  req.query = value;
  next();
};

/**
 * Middleware to validate offer toggle requests
 * Validates body for PATCH /api/offers/:id/toggle
 */
export const validateToggleOffer = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = toggleOfferSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Offer toggle validation failed: ${errorMessage}`));
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

/**
 * Middleware to validate offer ID parameter
 * Validates params for routes with :id parameter
 */
export const validateOfferId = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = offerIdSchema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = formatValidationError(error);
    return next(createBadRequestError(`Offer ID validation failed: ${errorMessage}`));
  }

  // Replace request params with validated and sanitized data
  req.params = value;
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
 * Common validation patterns for offers
 */
export const offerValidationPatterns = {
  // Offer ID pattern (UUID or custom format)
  offerId: /^[a-zA-Z0-9_-]+$/,
  
  // URL pattern for destination URLs
  url: /^https?:\/\/.+/,
  
  // EPC value pattern (positive number with up to 2 decimal places)
  epc: /^\d+(\.\d{1,2})?$/,
  
  // Country code pattern (ISO 3166-1 alpha-2)
  countryCode: /^[A-Z]{2}$/,
  
  // Currency code pattern (ISO 4217)
  currencyCode: /^[A-Z]{3}$/
};