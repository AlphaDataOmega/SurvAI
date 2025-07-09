/**
 * @fileoverview Comprehensive tests for all validator schemas
 * 
 * Tests all Joi validation schemas for proper validation, error handling,
 * and edge cases across all validators in the system.
 */

import {
  createOfferSchema,
  updateOfferSchema,
  listOffersSchema,
  getOfferSchema,
  toggleOfferSchema,
  validateCreateOffer,
  validateUpdateOffer,
  validateListOffers,
  validateGetOffer,
  validateToggleOffer,
} from '../../../backend/src/validators/offerValidator';

import {
  createQuestionSchema,
  updateQuestionSchema,
  listQuestionsSchema,
  getQuestionSchema,
  deleteQuestionSchema,
  validateCreateQuestion,
  validateUpdateQuestion,
  validateListQuestions,
  validateGetQuestion,
  validateDeleteQuestion,
} from '../../../backend/src/validators/questionValidator';

import {
  metricsQuerySchema,
  offerPerformanceQuerySchema,
  sessionFlowQuerySchema,
  validateMetricsQuery,
  validateOfferPerformanceQuery,
  validateSessionFlowQuery,
} from '../../../backend/src/validators/dashboardValidation';

import {
  widgetAnalyticsEventSchema,
  widgetAnalyticsQuerySchema,
  validateWidgetAnalyticsEvent,
  validateWidgetAnalyticsQuery,
} from '../../../backend/src/validators/widgetAnalyticsValidator';

import { expectErrorResponse, expectValidationError } from '../helpers/testUtils';
import type { Request, Response, NextFunction } from 'express';

describe('All Validators', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('Offer Validator', () => {
    describe('createOfferSchema', () => {
      it('should validate valid offer creation data', () => {
        const validData = {
          title: 'Test Offer',
          description: 'Test Description',
          category: 'FINANCE',
          destinationUrl: 'https://example.com',
          config: {
            payout: 50.00,
            currency: 'USD',
            dailyClickCap: 1000,
            totalClickCap: 50000,
            cooldownPeriod: 24
          },
          targeting: {
            geoTargeting: ['US', 'CA'],
            deviceTargeting: ['desktop', 'mobile']
          }
        };

        const { error } = createOfferSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject missing required fields', () => {
        const invalidData = {};

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['title'] }),
            expect.objectContaining({ path: ['category'] }),
            expect.objectContaining({ path: ['destinationUrl'] }),
          ])
        );
      });

      it('should reject invalid category', () => {
        const invalidData = {
          title: 'Test Offer',
          category: 'INVALID_CATEGORY',
          destinationUrl: 'https://example.com'
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['category']);
      });

      it('should reject invalid URL', () => {
        const invalidData = {
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'not-a-url'
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['destinationUrl']);
      });

      it('should reject negative payout', () => {
        const invalidData = {
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com',
          config: {
            payout: -10
          }
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['config', 'payout']);
      });

      it('should reject payout with too many decimal places', () => {
        const invalidData = {
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com',
          config: {
            payout: 50.123
          }
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['config', 'payout']);
      });

      it('should reject invalid currency code', () => {
        const invalidData = {
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com',
          config: {
            currency: 'INVALID'
          }
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['config', 'currency']);
      });

      it('should reject invalid click caps', () => {
        const invalidData = {
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com',
          config: {
            dailyClickCap: 0,
            totalClickCap: -1
          }
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details.length).toBeGreaterThan(0);
      });

      it('should reject invalid targeting data', () => {
        const invalidData = {
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com',
          targeting: {
            geoTargeting: ['INVALID_COUNTRY'],
            deviceTargeting: ['invalid_device']
          }
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should handle empty description', () => {
        const validData = {
          title: 'Test Offer',
          description: '',
          category: 'FINANCE',
          destinationUrl: 'https://example.com'
        };

        const { error } = createOfferSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject description that is too long', () => {
        const invalidData = {
          title: 'Test Offer',
          description: 'x'.repeat(1001),
          category: 'FINANCE',
          destinationUrl: 'https://example.com'
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['description']);
      });

      it('should reject title that is too long', () => {
        const invalidData = {
          title: 'x'.repeat(256),
          category: 'FINANCE',
          destinationUrl: 'https://example.com'
        };

        const { error } = createOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['title']);
      });
    });

    describe('updateOfferSchema', () => {
      it('should validate valid offer update data', () => {
        const validData = {
          title: 'Updated Offer',
          description: 'Updated Description',
          config: {
            payout: 75.00
          }
        };

        const { error } = updateOfferSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should allow partial updates', () => {
        const validData = {
          title: 'Updated Title Only'
        };

        const { error } = updateOfferSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid data types', () => {
        const invalidData = {
          title: 123,
          category: 'INVALID_CATEGORY'
        };

        const { error } = updateOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('listOffersSchema', () => {
      it('should validate valid listing parameters', () => {
        const validData = {
          page: 1,
          limit: 10,
          category: 'FINANCE',
          status: 'ACTIVE'
        };

        const { error } = listOffersSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should use default values for missing parameters', () => {
        const { error, value } = listOffersSchema.validate({});
        expect(error).toBeUndefined();
        expect(value.page).toBe(1);
        expect(value.limit).toBe(10);
      });

      it('should reject invalid pagination values', () => {
        const invalidData = {
          page: 0,
          limit: -1
        };

        const { error } = listOffersSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should reject invalid status values', () => {
        const invalidData = {
          status: 'INVALID_STATUS'
        };

        const { error } = listOffersSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('getOfferSchema', () => {
      it('should validate valid offer ID', () => {
        const validData = {
          id: 'valid-uuid-string'
        };

        const { error } = getOfferSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject empty ID', () => {
        const invalidData = {
          id: ''
        };

        const { error } = getOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should reject missing ID', () => {
        const invalidData = {};

        const { error } = getOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('toggleOfferSchema', () => {
      it('should validate valid toggle data', () => {
        const validData = {
          id: 'valid-uuid-string',
          status: 'ACTIVE'
        };

        const { error } = toggleOfferSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid status', () => {
        const invalidData = {
          id: 'valid-uuid-string',
          status: 'INVALID_STATUS'
        };

        const { error } = toggleOfferSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('Offer Middleware Functions', () => {
      it('should call next() with valid data in validateCreateOffer', () => {
        mockRequest.body = {
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com'
        };

        validateCreateOffer(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should return error with invalid data in validateCreateOffer', () => {
        mockRequest.body = {
          title: '',
          category: 'INVALID',
          destinationUrl: 'not-a-url'
        };

        validateCreateOffer(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateUpdateOffer', () => {
        mockRequest.body = {
          title: 'Updated Title'
        };

        validateUpdateOffer(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateListOffers', () => {
        mockRequest.query = {
          page: '1',
          limit: '10'
        };

        validateListOffers(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateGetOffer', () => {
        mockRequest.params = {
          id: 'valid-uuid-string'
        };

        validateGetOffer(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateToggleOffer', () => {
        mockRequest.params = {
          id: 'valid-uuid-string'
        };
        mockRequest.body = {
          status: 'ACTIVE'
        };

        validateToggleOffer(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('Question Validator', () => {
    describe('createQuestionSchema', () => {
      it('should validate valid question creation data', () => {
        const validData = {
          title: 'Test Question',
          description: 'Test Description',
          type: 'SINGLE_CHOICE',
          surveyId: 'survey-uuid',
          order: 1,
          config: {
            options: ['Option 1', 'Option 2'],
            isRequired: true
          }
        };

        const { error } = createQuestionSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject missing required fields', () => {
        const invalidData = {};

        const { error } = createQuestionSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details.length).toBeGreaterThan(0);
      });

      it('should reject invalid question type', () => {
        const invalidData = {
          title: 'Test Question',
          type: 'INVALID_TYPE',
          surveyId: 'survey-uuid'
        };

        const { error } = createQuestionSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['type']);
      });

      it('should reject negative order', () => {
        const invalidData = {
          title: 'Test Question',
          type: 'SINGLE_CHOICE',
          surveyId: 'survey-uuid',
          order: -1
        };

        const { error } = createQuestionSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['order']);
      });

      it('should handle empty description', () => {
        const validData = {
          title: 'Test Question',
          description: '',
          type: 'SINGLE_CHOICE',
          surveyId: 'survey-uuid'
        };

        const { error } = createQuestionSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe('updateQuestionSchema', () => {
      it('should validate valid question update data', () => {
        const validData = {
          title: 'Updated Question',
          description: 'Updated Description',
          config: {
            options: ['New Option 1', 'New Option 2']
          }
        };

        const { error } = updateQuestionSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should allow partial updates', () => {
        const validData = {
          title: 'Updated Title Only'
        };

        const { error } = updateQuestionSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid data types', () => {
        const invalidData = {
          title: 123,
          type: 'INVALID_TYPE'
        };

        const { error } = updateQuestionSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('listQuestionsSchema', () => {
      it('should validate valid listing parameters', () => {
        const validData = {
          surveyId: 'survey-uuid',
          page: 1,
          limit: 10
        };

        const { error } = listQuestionsSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should use default values for missing parameters', () => {
        const { error, value } = listQuestionsSchema.validate({});
        expect(error).toBeUndefined();
        expect(value.page).toBe(1);
        expect(value.limit).toBe(10);
      });

      it('should reject invalid pagination values', () => {
        const invalidData = {
          page: 0,
          limit: -1
        };

        const { error } = listQuestionsSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('Question Middleware Functions', () => {
      it('should call next() with valid data in validateCreateQuestion', () => {
        mockRequest.body = {
          title: 'Test Question',
          type: 'SINGLE_CHOICE',
          surveyId: 'survey-uuid'
        };

        validateCreateQuestion(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should return error with invalid data in validateCreateQuestion', () => {
        mockRequest.body = {
          title: '',
          type: 'INVALID_TYPE'
        };

        validateCreateQuestion(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateListQuestions', () => {
        mockRequest.query = {
          page: '1',
          limit: '10'
        };

        validateListQuestions(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateGetQuestion', () => {
        mockRequest.params = {
          id: 'valid-uuid-string'
        };

        validateGetQuestion(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateDeleteQuestion', () => {
        mockRequest.params = {
          id: 'valid-uuid-string'
        };

        validateDeleteQuestion(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('Dashboard Validator', () => {
    describe('metricsQuerySchema', () => {
      it('should validate valid metrics query', () => {
        const validData = {
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          metric: 'conversions'
        };

        const { error } = metricsQuerySchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should use default values for missing parameters', () => {
        const { error, value } = metricsQuerySchema.validate({});
        expect(error).toBeUndefined();
        expect(value.startDate).toBeDefined();
        expect(value.endDate).toBeDefined();
      });

      it('should reject invalid date formats', () => {
        const invalidData = {
          startDate: 'invalid-date',
          endDate: '2023-12-31'
        };

        const { error } = metricsQuerySchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['startDate']);
      });

      it('should reject invalid metric values', () => {
        const invalidData = {
          metric: 'invalid_metric'
        };

        const { error } = metricsQuerySchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['metric']);
      });
    });

    describe('offerPerformanceQuerySchema', () => {
      it('should validate valid offer performance query', () => {
        const validData = {
          offerId: 'offer-uuid',
          timeRange: '7d'
        };

        const { error } = offerPerformanceQuerySchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid time range', () => {
        const invalidData = {
          timeRange: 'invalid_range'
        };

        const { error } = offerPerformanceQuerySchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['timeRange']);
      });
    });

    describe('sessionFlowQuerySchema', () => {
      it('should validate valid session flow query', () => {
        const validData = {
          surveyId: 'survey-uuid',
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        };

        const { error } = sessionFlowQuerySchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject empty survey ID', () => {
        const invalidData = {
          surveyId: ''
        };

        const { error } = sessionFlowQuerySchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['surveyId']);
      });
    });

    describe('Dashboard Middleware Functions', () => {
      it('should call next() with valid data in validateMetricsQuery', () => {
        mockRequest.query = {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        };

        validateMetricsQuery(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should return error with invalid data in validateMetricsQuery', () => {
        mockRequest.query = {
          startDate: 'invalid-date',
          endDate: '2023-12-31'
        };

        validateMetricsQuery(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateOfferPerformanceQuery', () => {
        mockRequest.query = {
          offerId: 'offer-uuid',
          timeRange: '7d'
        };

        validateOfferPerformanceQuery(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateSessionFlowQuery', () => {
        mockRequest.query = {
          surveyId: 'survey-uuid',
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        };

        validateSessionFlowQuery(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('Widget Analytics Validator', () => {
    describe('widgetAnalyticsEventSchema', () => {
      it('should validate valid widget analytics event', () => {
        const validData = {
          partnerId: 'partner-123',
          surveyId: 'survey-uuid',
          sessionId: 'session-uuid',
          eventType: 'impression',
          eventData: {
            timestamp: Date.now(),
            questionId: 'question-uuid'
          }
        };

        const { error } = widgetAnalyticsEventSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject missing required fields', () => {
        const invalidData = {};

        const { error } = widgetAnalyticsEventSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details.length).toBeGreaterThan(0);
      });

      it('should reject invalid event type', () => {
        const invalidData = {
          partnerId: 'partner-123',
          surveyId: 'survey-uuid',
          sessionId: 'session-uuid',
          eventType: 'invalid_event',
          eventData: {}
        };

        const { error } = widgetAnalyticsEventSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['eventType']);
      });

      it('should reject empty partner ID', () => {
        const invalidData = {
          partnerId: '',
          surveyId: 'survey-uuid',
          sessionId: 'session-uuid',
          eventType: 'impression',
          eventData: {}
        };

        const { error } = widgetAnalyticsEventSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['partnerId']);
      });

      it('should handle optional fields', () => {
        const validData = {
          partnerId: 'partner-123',
          surveyId: 'survey-uuid',
          sessionId: 'session-uuid',
          eventType: 'impression',
          eventData: {},
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '127.0.0.1',
          referrer: 'https://example.com'
        };

        const { error } = widgetAnalyticsEventSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe('widgetAnalyticsQuerySchema', () => {
      it('should validate valid analytics query', () => {
        const validData = {
          partnerId: 'partner-123',
          surveyId: 'survey-uuid',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          eventType: 'impression'
        };

        const { error } = widgetAnalyticsQuerySchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should use default values for missing parameters', () => {
        const { error, value } = widgetAnalyticsQuerySchema.validate({});
        expect(error).toBeUndefined();
        expect(value.startDate).toBeDefined();
        expect(value.endDate).toBeDefined();
      });

      it('should reject invalid date formats', () => {
        const invalidData = {
          startDate: 'invalid-date',
          endDate: '2023-12-31'
        };

        const { error } = widgetAnalyticsQuerySchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['startDate']);
      });

      it('should reject invalid event type', () => {
        const invalidData = {
          eventType: 'invalid_event'
        };

        const { error } = widgetAnalyticsQuerySchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].path).toEqual(['eventType']);
      });

      it('should handle page and limit parameters', () => {
        const validData = {
          page: 1,
          limit: 50
        };

        const { error } = widgetAnalyticsQuerySchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid pagination values', () => {
        const invalidData = {
          page: 0,
          limit: -1
        };

        const { error } = widgetAnalyticsQuerySchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    describe('Widget Analytics Middleware Functions', () => {
      it('should call next() with valid data in validateWidgetAnalyticsEvent', () => {
        mockRequest.body = {
          partnerId: 'partner-123',
          surveyId: 'survey-uuid',
          sessionId: 'session-uuid',
          eventType: 'impression',
          eventData: {}
        };

        validateWidgetAnalyticsEvent(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should return error with invalid data in validateWidgetAnalyticsEvent', () => {
        mockRequest.body = {
          partnerId: '',
          surveyId: 'survey-uuid',
          eventType: 'invalid_event'
        };

        validateWidgetAnalyticsEvent(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should call next() with valid data in validateWidgetAnalyticsQuery', () => {
        mockRequest.query = {
          partnerId: 'partner-123',
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        };

        validateWidgetAnalyticsQuery(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should return error with invalid data in validateWidgetAnalyticsQuery', () => {
        mockRequest.query = {
          startDate: 'invalid-date',
          endDate: '2023-12-31'
        };

        validateWidgetAnalyticsQuery(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockResponse.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null values gracefully', () => {
      const { error } = createOfferSchema.validate(null);
      expect(error).toBeDefined();
    });

    it('should handle undefined values gracefully', () => {
      const { error } = createOfferSchema.validate(undefined);
      expect(error).toBeDefined();
    });

    it('should handle empty strings in required fields', () => {
      const invalidData = {
        title: '',
        category: '',
        destinationUrl: ''
      };

      const { error } = createOfferSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle very large objects', () => {
      const largeData = {
        title: 'Test Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com',
        description: 'x'.repeat(999), // Just under limit
        config: {
          payout: 999999.99,
          currency: 'USD',
          dailyClickCap: 999999999,
          totalClickCap: 999999999,
          cooldownPeriod: 999999999
        }
      };

      const { error } = createOfferSchema.validate(largeData);
      expect(error).toBeUndefined();
    });

    it('should handle nested object validation errors', () => {
      const invalidData = {
        title: 'Test Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com',
        config: {
          payout: 'not-a-number',
          currency: 'TOOLONG',
          dailyClickCap: -1
        }
      };

      const { error } = createOfferSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(1);
    });

    it('should handle array validation errors', () => {
      const invalidData = {
        title: 'Test Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com',
        targeting: {
          geoTargeting: ['US', 'INVALID_COUNTRY', 'CA'],
          deviceTargeting: ['desktop', 'invalid_device']
        }
      };

      const { error } = createOfferSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should handle type coercion properly', () => {
      const dataWithStrings = {
        title: 'Test Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com',
        config: {
          payout: '50.00', // String that can be coerced to number
          dailyClickCap: '1000' // String that can be coerced to number
        }
      };

      const { error } = createOfferSchema.validate(dataWithStrings);
      // Depending on Joi configuration, this might pass or fail
      expect(error).toBeDefined(); // Assuming strict validation
    });

    it('should handle circular references gracefully', () => {
      const circularData: any = {
        title: 'Test Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com'
      };
      circularData.self = circularData;

      const { error } = createOfferSchema.validate(circularData);
      expect(error).toBeDefined();
    });
  });
});