/**
 * @fileoverview Shared types tests
 * 
 * Tests for shared TypeScript types and interfaces
 * to ensure type safety and consistency.
 */

import {
  UserRole,
  UserStatus,
  SurveyStatus,
  QuestionType,
  OfferStatus,
  OfferCategory,
  type ApiResponse,
  type HealthCheckResponse,
  type User,
  type Survey,
  type Question,
  type Offer
} from '@survai/shared'

describe('Shared Types', () => {
  describe('API Types', () => {
    it('should have correct ApiResponse structure', () => {
      const successResponse: ApiResponse<string> = {
        success: true,
        data: 'test data',
        timestamp: new Date().toISOString(),
      }

      expect(successResponse.success).toBe(true)
      expect(successResponse.data).toBe('test data')
      expect(successResponse.timestamp).toBeDefined()

      const errorResponse: ApiResponse<never> = {
        success: false,
        error: 'test error',
        timestamp: new Date().toISOString(),
      }

      expect(errorResponse.success).toBe(false)
      expect(errorResponse.error).toBe('test error')
      expect(errorResponse.data).toBeUndefined()
    })

    it('should have correct HealthCheckResponse structure', () => {
      const healthResponse: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected',
        checks: {
          database: true,
          environment: 'test',
        },
      }

      expect(healthResponse.status).toBe('healthy')
      expect(healthResponse.timestamp).toBeDefined()
      expect(healthResponse.version).toBe('1.0.0')
      expect(healthResponse.database).toBe('connected')
      expect(healthResponse.checks).toBeDefined()
    })
  })

  describe('User Types', () => {
    it('should have correct User structure', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(user.id).toBe('user-123')
      expect(user.email).toBe('test@example.com')
      expect(user.role).toBe(UserRole.ADMIN)
      expect(user.status).toBe(UserStatus.ACTIVE)
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should have correct UserRole enum values', () => {
      expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN')
      expect(UserRole.ADMIN).toBe('ADMIN')
      expect(UserRole.VIEWER).toBe('VIEWER')
    })

    it('should have correct UserStatus enum values', () => {
      expect(UserStatus.ACTIVE).toBe('ACTIVE')
      expect(UserStatus.INACTIVE).toBe('INACTIVE')
      expect(UserStatus.PENDING).toBe('PENDING')
      expect(UserStatus.SUSPENDED).toBe('SUSPENDED')
    })
  })

  describe('Survey Types', () => {
    it('should have correct Survey structure', () => {
      const survey: Survey = {
        id: 'survey-123',
        title: 'Test Survey',
        description: 'A test survey',
        status: SurveyStatus.ACTIVE,
        config: {
          timeout: 30000,
          shuffleQuestions: false,
        },
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(survey.id).toBe('survey-123')
      expect(survey.title).toBe('Test Survey')
      expect(survey.status).toBe(SurveyStatus.ACTIVE)
      expect(survey.config).toBeDefined()
      expect(survey.questions).toEqual([])
    })

    it('should have correct SurveyStatus enum values', () => {
      expect(SurveyStatus.DRAFT).toBe('DRAFT')
      expect(SurveyStatus.ACTIVE).toBe('ACTIVE')
      expect(SurveyStatus.PAUSED).toBe('PAUSED')
      expect(SurveyStatus.COMPLETED).toBe('COMPLETED')
    })

    it('should have correct Question structure', () => {
      const question: Question = {
        id: 'question-123',
        surveyId: 'survey-123',
        type: QuestionType.SINGLE_CHOICE,
        text: 'What is your favorite color?',
        config: {},
        order: 1,
        required: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(question.id).toBe('question-123')
      expect(question.surveyId).toBe('survey-123')
      expect(question.type).toBe(QuestionType.SINGLE_CHOICE)
      expect(question.text).toBe('What is your favorite color?')
      expect(question.order).toBe(1)
      expect(question.required).toBe(true)
    })

    it('should have correct QuestionType enum values', () => {
      expect(QuestionType.SINGLE_CHOICE).toBe('SINGLE_CHOICE')
      expect(QuestionType.MULTIPLE_CHOICE).toBe('MULTIPLE_CHOICE')
      expect(QuestionType.TEXT_INPUT).toBe('TEXT_INPUT')
      expect(QuestionType.NUMBER_INPUT).toBe('NUMBER_INPUT')
      expect(QuestionType.RATING_SCALE).toBe('RATING_SCALE')
      expect(QuestionType.YES_NO).toBe('YES_NO')
      expect(QuestionType.EMAIL_INPUT).toBe('EMAIL_INPUT')
      expect(QuestionType.PHONE_INPUT).toBe('PHONE_INPUT')
    })
  })

  describe('Offer Types', () => {
    it('should have correct Offer structure', () => {
      const offer: Offer = {
        id: 'offer-123',
        title: 'Test Offer',
        description: 'A test offer',
        category: OfferCategory.FINANCE,
        status: OfferStatus.ACTIVE,
        destinationUrl: 'https://example.com',
        config: {
          payout: 10.00,
          currency: 'USD',
        },
        metrics: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          epc: 0,
          lastUpdated: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(offer.id).toBe('offer-123')
      expect(offer.title).toBe('Test Offer')
      expect(offer.category).toBe(OfferCategory.FINANCE)
      expect(offer.status).toBe(OfferStatus.ACTIVE)
      expect(offer.destinationUrl).toBe('https://example.com')
      expect(offer.config.payout).toBe(10.00)
      expect(offer.metrics.totalClicks).toBe(0)
    })

    it('should have correct OfferCategory enum values', () => {
      expect(OfferCategory.FINANCE).toBe('FINANCE')
      expect(OfferCategory.INSURANCE).toBe('INSURANCE')
      expect(OfferCategory.HEALTH).toBe('HEALTH')
      expect(OfferCategory.EDUCATION).toBe('EDUCATION')
      expect(OfferCategory.TECHNOLOGY).toBe('TECHNOLOGY')
      expect(OfferCategory.TRAVEL).toBe('TRAVEL')
      expect(OfferCategory.SHOPPING).toBe('SHOPPING')
      expect(OfferCategory.OTHER).toBe('OTHER')
    })

    it('should have correct OfferStatus enum values', () => {
      expect(OfferStatus.ACTIVE).toBe('ACTIVE')
      expect(OfferStatus.PAUSED).toBe('PAUSED')
      expect(OfferStatus.EXPIRED).toBe('EXPIRED')
      expect(OfferStatus.PENDING).toBe('PENDING')
      expect(OfferStatus.ARCHIVED).toBe('ARCHIVED')
    })
  })

  describe('Type Compatibility', () => {
    it('should allow proper type assignments', () => {
      // Test that types can be assigned correctly
      const apiResponse: ApiResponse<User> = {
        success: true,
        data: {
          id: 'user-123',
          email: 'test@example.com',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        timestamp: new Date().toISOString(),
      }

      expect(apiResponse.success).toBe(true)
      expect(apiResponse.data?.email).toBe('test@example.com')
    })

    it('should enforce optional fields correctly', () => {
      // Test that optional fields work correctly
      const minimalUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.VIEWER,
        status: UserStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(minimalUser.name).toBeUndefined()
      expect(minimalUser.lastLoginAt).toBeUndefined()
      expect(minimalUser.metadata).toBeUndefined()
    })
  })
})