/**
 * @fileoverview Unit tests for tracking validation
 * 
 * Tests for Joi validation schemas and middleware functions
 * used in the tracking system for input validation.
 */

import { Request, Response, NextFunction } from 'express';
import {
  trackClickSchema,
  recordConversionQuerySchema,
  recordConversionBodySchema,
  generatePixelSchema,
  handlePixelParamsSchema,
  handlePixelQuerySchema,
  getAnalyticsSchema,
  validateSchema,
  formatValidationError,
  validationPatterns
} from '../../backend/src/utils/trackingValidation';
import {
  validateTrackClick,
  validateRecordConversionQuery,
  validateRecordConversionBody,
  validateGeneratePixel,
  validateHandlePixelParams,
  validateHandlePixelQuery,
  validateGetAnalytics,
  validateHandlePixel
} from '../../backend/src/middleware/trackingValidation';
import { createBadRequestError } from '../../backend/src/middleware/errorHandler';

// Mock the error handler
jest.mock('../../backend/src/middleware/errorHandler');

describe('Tracking Validation Schemas', () => {
  describe('trackClickSchema', () => {
    it('should validate valid click tracking request', () => {
      const validRequest = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 Test Browser',
        ipAddress: '192.168.1.1'
      };

      const { error, value } = trackClickSchema.validate(validRequest);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validRequest);
    });

    it('should validate minimal click tracking request', () => {
      const minimalRequest = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      const { error, value } = trackClickSchema.validate(minimalRequest);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(minimalRequest);
    });

    it('should reject empty required fields', () => {
      const invalidRequest = {
        sessionId: '',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      const { error } = trackClickSchema.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Session ID cannot be empty');
    });

    it('should reject missing required fields', () => {
      const invalidRequest = {
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      const { error } = trackClickSchema.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Session ID is required');
    });

    it('should reject overly long fields', () => {
      const longString = 'a'.repeat(256);
      const invalidRequest = {
        sessionId: longString,
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      const { error } = trackClickSchema.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Session ID must not exceed 255 characters');
    });

    it('should reject invalid IP address', () => {
      const invalidRequest = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        ipAddress: 'invalid-ip'
      };

      const { error } = trackClickSchema.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('IP Address must be a valid IP address');
    });

    it('should reject invalid timestamp', () => {
      const invalidRequest = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        timestamp: -1
      };

      const { error } = trackClickSchema.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Timestamp must be positive');
    });

    it('should reject non-integer timestamp', () => {
      const invalidRequest = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        timestamp: 123.45
      };

      const { error } = trackClickSchema.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Timestamp must be an integer');
    });
  });

  describe('recordConversionQuerySchema', () => {
    it('should validate valid conversion query', () => {
      const validQuery = {
        click_id: 'click-123',
        revenue: 25.50
      };

      const { error, value } = recordConversionQuerySchema.validate(validQuery);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validQuery);
    });

    it('should validate conversion query without revenue', () => {
      const validQuery = {
        click_id: 'click-123'
      };

      const { error, value } = recordConversionQuerySchema.validate(validQuery);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validQuery);
    });

    it('should reject missing click_id', () => {
      const invalidQuery = {
        revenue: 25.50
      };

      const { error } = recordConversionQuerySchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Click ID is required');
    });

    it('should reject negative revenue', () => {
      const invalidQuery = {
        click_id: 'click-123',
        revenue: -10.00
      };

      const { error } = recordConversionQuerySchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Revenue must be positive');
    });

    it('should reject revenue with too many decimal places', () => {
      const invalidQuery = {
        click_id: 'click-123',
        revenue: 25.999
      };

      const { error } = recordConversionQuerySchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Revenue must have at most 2 decimal places');
    });
  });

  describe('recordConversionBodySchema', () => {
    it('should validate valid conversion body', () => {
      const validBody = {
        click_id: 'click-123',
        revenue: 25.50
      };

      const { error, value } = recordConversionBodySchema.validate(validBody);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validBody);
    });

    it('should reject empty click_id', () => {
      const invalidBody = {
        click_id: '',
        revenue: 25.50
      };

      const { error } = recordConversionBodySchema.validate(invalidBody);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Click ID cannot be empty');
    });
  });

  describe('generatePixelSchema', () => {
    it('should validate valid pixel generation request', () => {
      const validRequest = {
        clickId: 'click-123',
        surveyId: 'survey-456'
      };

      const { error, value } = generatePixelSchema.validate(validRequest);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validRequest);
    });

    it('should reject missing surveyId', () => {
      const invalidRequest = {
        clickId: 'click-123'
      };

      const { error } = generatePixelSchema.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Survey ID is required');
    });

    it('should reject empty clickId', () => {
      const invalidRequest = {
        clickId: '',
        surveyId: 'survey-456'
      };

      const { error } = generatePixelSchema.validate(invalidRequest);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Click ID cannot be empty');
    });
  });

  describe('handlePixelParamsSchema', () => {
    it('should validate valid pixel params', () => {
      const validParams = {
        click_id: 'click-123'
      };

      const { error, value } = handlePixelParamsSchema.validate(validParams);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validParams);
    });

    it('should reject missing click_id', () => {
      const invalidParams = {};

      const { error } = handlePixelParamsSchema.validate(invalidParams);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Click ID is required');
    });
  });

  describe('handlePixelQuerySchema', () => {
    it('should validate valid pixel query', () => {
      const validQuery = {
        revenue: 25.50
      };

      const { error, value } = handlePixelQuerySchema.validate(validQuery);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validQuery);
    });

    it('should validate empty pixel query', () => {
      const emptyQuery = {};

      const { error, value } = handlePixelQuerySchema.validate(emptyQuery);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(emptyQuery);
    });

    it('should reject negative revenue', () => {
      const invalidQuery = {
        revenue: -10.00
      };

      const { error } = handlePixelQuerySchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Revenue must be positive');
    });
  });

  describe('getAnalyticsSchema', () => {
    it('should validate valid analytics query', () => {
      const validQuery = {
        offerId: 'offer-123'
      };

      const { error, value } = getAnalyticsSchema.validate(validQuery);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validQuery);
    });

    it('should validate empty analytics query', () => {
      const emptyQuery = {};

      const { error, value } = getAnalyticsSchema.validate(emptyQuery);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(emptyQuery);
    });

    it('should reject empty offerId', () => {
      const invalidQuery = {
        offerId: ''
      };

      const { error } = getAnalyticsSchema.validate(invalidQuery);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Offer ID cannot be empty');
    });
  });
});

describe('Validation Utility Functions', () => {
  describe('validateSchema', () => {
    it('should validate data against schema', () => {
      const data = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      const result = validateSchema(trackClickSchema, data);
      
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(data);
    });

    it('should strip unknown properties', () => {
      const data = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        unknownProperty: 'should be stripped'
      };

      const result = validateSchema(trackClickSchema, data);
      
      expect(result.error).toBeUndefined();
      expect(result.value).not.toHaveProperty('unknownProperty');
    });

    it('should return all errors when abortEarly is false', () => {
      const data = {
        sessionId: '',
        questionId: '',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      const result = validateSchema(trackClickSchema, data);
      
      expect(result.error).toBeDefined();
      expect(result.error?.details.length).toBeGreaterThan(1);
    });
  });

  describe('formatValidationError', () => {
    it('should format single validation error', () => {
      const data = {
        sessionId: '',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      const { error } = trackClickSchema.validate(data);
      
      if (error) {
        const formattedError = formatValidationError(error);
        expect(formattedError).toBe('Session ID cannot be empty');
      }
    });

    it('should format multiple validation errors', () => {
      const data = {
        sessionId: '',
        questionId: '',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      const { error } = trackClickSchema.validate(data);
      
      if (error) {
        const formattedError = formatValidationError(error);
        expect(formattedError).toContain('Session ID cannot be empty');
        expect(formattedError).toContain('Question ID cannot be empty');
        expect(formattedError).toContain(', ');
      }
    });
  });

  describe('validationPatterns', () => {
    it('should have valid regex patterns', () => {
      expect(validationPatterns.uuid).toBeInstanceOf(RegExp);
      expect(validationPatterns.clickId).toBeInstanceOf(RegExp);
      expect(validationPatterns.sessionId).toBeInstanceOf(RegExp);
      expect(validationPatterns.offerId).toBeInstanceOf(RegExp);
    });

    it('should validate UUID pattern', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const invalidUUID = 'not-a-uuid';

      expect(validationPatterns.uuid.test(validUUID)).toBe(true);
      expect(validationPatterns.uuid.test(invalidUUID)).toBe(false);
    });

    it('should validate click ID pattern', () => {
      const validClickId = 'click-123-abc';
      const invalidClickId = 'click@123';

      expect(validationPatterns.clickId.test(validClickId)).toBe(true);
      expect(validationPatterns.clickId.test(invalidClickId)).toBe(false);
    });
  });
});

describe('Tracking Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
    (createBadRequestError as jest.Mock).mockImplementation((message: string) => new Error(message));
  });

  describe('validateTrackClick', () => {
    it('should pass valid request body', () => {
      mockRequest.body = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      validateTrackClick(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      });
    });

    it('should reject invalid request body', () => {
      mockRequest.body = {
        sessionId: '',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc'
      };

      validateTrackClick(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createBadRequestError).toHaveBeenCalledWith(
        expect.stringContaining('Click tracking validation failed')
      );
    });

    it('should strip unknown properties from request body', () => {
      mockRequest.body = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        unknownProperty: 'should be stripped'
      };

      validateTrackClick(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).not.toHaveProperty('unknownProperty');
    });
  });

  describe('validateRecordConversionQuery', () => {
    it('should pass valid query parameters', () => {
      mockRequest.query = {
        click_id: 'click-123',
        revenue: '25.50'
      };

      validateRecordConversionQuery(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        click_id: 'click-123',
        revenue: '25.50'
      });
    });

    it('should reject invalid query parameters', () => {
      mockRequest.query = {
        click_id: '',
        revenue: '25.50'
      };

      validateRecordConversionQuery(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createBadRequestError).toHaveBeenCalledWith(
        expect.stringContaining('Conversion recording validation failed')
      );
    });
  });

  describe('validateRecordConversionBody', () => {
    it('should pass valid request body', () => {
      mockRequest.body = {
        click_id: 'click-123',
        revenue: 25.50
      };

      validateRecordConversionBody(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        click_id: 'click-123',
        revenue: 25.50
      });
    });

    it('should reject invalid request body', () => {
      mockRequest.body = {
        click_id: '',
        revenue: 25.50
      };

      validateRecordConversionBody(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createBadRequestError).toHaveBeenCalledWith(
        expect.stringContaining('Conversion recording validation failed')
      );
    });
  });

  describe('validateGeneratePixel', () => {
    it('should pass valid request body', () => {
      mockRequest.body = {
        clickId: 'click-123',
        surveyId: 'survey-456'
      };

      validateGeneratePixel(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        clickId: 'click-123',
        surveyId: 'survey-456'
      });
    });

    it('should reject invalid request body', () => {
      mockRequest.body = {
        clickId: '',
        surveyId: 'survey-456'
      };

      validateGeneratePixel(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createBadRequestError).toHaveBeenCalledWith(
        expect.stringContaining('Pixel generation validation failed')
      );
    });
  });

  describe('validateHandlePixelParams', () => {
    it('should pass valid path parameters', () => {
      mockRequest.params = {
        click_id: 'click-123'
      };

      validateHandlePixelParams(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.params).toEqual({
        click_id: 'click-123'
      });
    });

    it('should reject invalid path parameters', () => {
      mockRequest.params = {
        click_id: ''
      };

      validateHandlePixelParams(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createBadRequestError).toHaveBeenCalledWith(
        expect.stringContaining('Pixel tracking params validation failed')
      );
    });
  });

  describe('validateHandlePixelQuery', () => {
    it('should pass valid query parameters', () => {
      mockRequest.query = {
        revenue: '25.50'
      };

      validateHandlePixelQuery(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        revenue: '25.50'
      });
    });

    it('should pass empty query parameters', () => {
      mockRequest.query = {};

      validateHandlePixelQuery(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({});
    });

    it('should reject invalid query parameters', () => {
      mockRequest.query = {
        revenue: '-10.00'
      };

      validateHandlePixelQuery(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createBadRequestError).toHaveBeenCalledWith(
        expect.stringContaining('Pixel tracking query validation failed')
      );
    });
  });

  describe('validateGetAnalytics', () => {
    it('should pass valid query parameters', () => {
      mockRequest.query = {
        offerId: 'offer-123'
      };

      validateGetAnalytics(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        offerId: 'offer-123'
      });
    });

    it('should pass empty query parameters', () => {
      mockRequest.query = {};

      validateGetAnalytics(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({});
    });

    it('should reject invalid query parameters', () => {
      mockRequest.query = {
        offerId: ''
      };

      validateGetAnalytics(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createBadRequestError).toHaveBeenCalledWith(
        expect.stringContaining('Analytics validation failed')
      );
    });
  });

  describe('validateHandlePixel', () => {
    it('should be an array of middleware functions', () => {
      expect(Array.isArray(validateHandlePixel)).toBe(true);
      expect(validateHandlePixel.length).toBe(2);
      expect(typeof validateHandlePixel[0]).toBe('function');
      expect(typeof validateHandlePixel[1]).toBe('function');
    });

    it('should validate both params and query', () => {
      mockRequest.params = {
        click_id: 'click-123'
      };
      mockRequest.query = {
        revenue: '25.50'
      };

      // Run first middleware (params validation)
      validateHandlePixel[0](mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();

      // Run second middleware (query validation)
      validateHandlePixel[1](mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();

      expect(mockRequest.params).toEqual({
        click_id: 'click-123'
      });
      expect(mockRequest.query).toEqual({
        revenue: '25.50'
      });
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  describe('Boundary Value Testing', () => {
    it('should handle minimum length strings', () => {
      const minLengthRequest = {
        sessionId: 'a',
        questionId: 'b',
        offerId: 'c',
        buttonVariantId: 'd'
      };

      const { error } = trackClickSchema.validate(minLengthRequest);
      
      expect(error).toBeUndefined();
    });

    it('should handle maximum length strings', () => {
      const maxLengthString = 'a'.repeat(255);
      const maxLengthRequest = {
        sessionId: maxLengthString,
        questionId: maxLengthString,
        offerId: maxLengthString,
        buttonVariantId: maxLengthString
      };

      const { error } = trackClickSchema.validate(maxLengthRequest);
      
      expect(error).toBeUndefined();
    });

    it('should handle minimum valid revenue', () => {
      const minRevenueRequest = {
        click_id: 'click-123',
        revenue: 0.01
      };

      const { error } = recordConversionQuerySchema.validate(minRevenueRequest);
      
      expect(error).toBeUndefined();
    });

    it('should handle maximum precision revenue', () => {
      const precisionRevenueRequest = {
        click_id: 'click-123',
        revenue: 999999.99
      };

      const { error } = recordConversionQuerySchema.validate(precisionRevenueRequest);
      
      expect(error).toBeUndefined();
    });
  });

  describe('Type Coercion', () => {
    it('should handle numeric strings for revenue', () => {
      const numericStringRequest = {
        click_id: 'click-123',
        revenue: '25.50' as any
      };

      const { error, value } = recordConversionQuerySchema.validate(numericStringRequest);
      
      expect(error).toBeUndefined();
      expect(typeof value.revenue).toBe('number');
      expect(value.revenue).toBe(25.50);
    });

    it('should handle numeric strings for timestamp', () => {
      const numericStringRequest = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        timestamp: '1234567890' as any
      };

      const { error, value } = trackClickSchema.validate(numericStringRequest);
      
      expect(error).toBeUndefined();
      expect(typeof value.timestamp).toBe('number');
      expect(value.timestamp).toBe(1234567890);
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle special characters in IDs', () => {
      const specialCharRequest = {
        sessionId: 'session-123-abc_def',
        questionId: 'question-456-ghi_jkl',
        offerId: 'offer-789-mno_pqr',
        buttonVariantId: 'button-abc-stu_vwx'
      };

      const { error } = trackClickSchema.validate(specialCharRequest);
      
      expect(error).toBeUndefined();
    });

    it('should handle Unicode characters in user agent', () => {
      const unicodeRequest = {
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        userAgent: 'Mozilla/5.0 测试浏览器'
      };

      const { error } = trackClickSchema.validate(unicodeRequest);
      
      expect(error).toBeUndefined();
    });
  });
});