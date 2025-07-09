/**
 * @fileoverview Unit tests for QuestionService
 * 
 * Tests for CTA question management, button generation,
 * and survey progression logic.
 */

import { QuestionService } from '../../backend/src/services/questionService';
import { PrismaClient } from '@prisma/client';
import type { NextQuestionRequest, Question, Offer } from '@survai/shared';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  surveyResponse: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  question: {
    findFirst: jest.fn(),
  },
  offer: {
    findMany: jest.fn(),
  },
} as any;

// Mock the prisma import
jest.mock('../../backend/src/services/questionService', () => {
  const actual = jest.requireActual('../../backend/src/services/questionService');
  return {
    ...actual,
    QuestionService: jest.fn().mockImplementation(() => ({
      ...actual.QuestionService.prototype,
    })),
  };
});

describe('QuestionService', () => {
  let questionService: QuestionService;
  
  beforeEach(() => {
    questionService = new QuestionService();
    jest.clearAllMocks();
  });

  describe('getNextQuestion', () => {
    const mockRequest: NextQuestionRequest = {
      sessionId: 'test-session-123',
      surveyId: 'survey-456',
      previousQuestionId: undefined,
      userAgent: 'Mozilla/5.0 Test Browser',
      ipAddress: '192.168.1.1',
    };

    const mockQuestion: Question = {
      id: 'question-1',
      surveyId: 'survey-456',
      type: 'CTA_OFFER' as any,
      text: 'What are you interested in?',
      description: 'Choose the option that best fits your needs.',
      config: { maxButtons: 3, buttonLayout: 'vertical' },
      options: [],
      order: 1,
      logic: undefined,
      aiVersions: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockOffers: Offer[] = [
      {
        id: 'offer-1',
        title: 'Financial Planning',
        description: 'Get expert financial advice',
        category: 'FINANCE' as any,
        status: 'ACTIVE' as any,
        destinationUrl: 'https://example.com/finance?click_id={click_id}',
        pixelUrl: 'https://tracking.example.com/pixel',
        config: { payout: 25.00, currency: 'USD' },
        targeting: undefined,
        metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: undefined,
      },
      {
        id: 'offer-2',
        title: 'Health Insurance',
        description: 'Compare health insurance plans',
        category: 'INSURANCE' as any,
        status: 'ACTIVE' as any,
        destinationUrl: 'https://example.com/health?click_id={click_id}',
        pixelUrl: 'https://tracking.example.com/pixel',
        config: { payout: 35.00, currency: 'USD' },
        targeting: undefined,
        metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: undefined,
      },
    ];

    it('should return next question with offer buttons for new session', async () => {
      // Mock successful scenario
      const mockSurveyResponse = {
        id: 'response-1',
        sessionData: {
          sessionId: 'test-session-123',
          clickId: 'click-456',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test Browser',
        },
      };

      // Create a spy version of the service with mocked methods
      const getOrCreateSessionSpy = jest.spyOn(questionService as any, 'getOrCreateSession')
        .mockResolvedValue(mockSurveyResponse);
      const getNextQuestionForSessionSpy = jest.spyOn(questionService as any, 'getNextQuestionForSession')
        .mockResolvedValue(mockQuestion);
      const getEligibleOffersSpy = jest.spyOn(questionService as any, 'getEligibleOffers')
        .mockResolvedValue(mockOffers);

      const result = await questionService.getNextQuestion(mockRequest);

      expect(result).toBeDefined();
      expect(result.question).toEqual(mockQuestion);
      expect(result.offerButtons).toHaveLength(2);
      expect(result.offerButtons[0]).toMatchObject({
        offerId: 'offer-1',
        style: 'primary',
        order: 1,
      });
      expect(result.offerButtons[1]).toMatchObject({
        offerId: 'offer-2',
        style: 'secondary',
        order: 2,
      });

      getOrCreateSessionSpy.mockRestore();
      getNextQuestionForSessionSpy.mockRestore();
      getEligibleOffersSpy.mockRestore();
    });

    it('should throw error when no questions available', async () => {
      const getOrCreateSessionSpy = jest.spyOn(questionService as any, 'getOrCreateSession')
        .mockResolvedValue({});
      const getNextQuestionForSessionSpy = jest.spyOn(questionService as any, 'getNextQuestionForSession')
        .mockResolvedValue(null);

      await expect(questionService.getNextQuestion(mockRequest))
        .rejects
        .toThrow('No more questions available');

      getOrCreateSessionSpy.mockRestore();
      getNextQuestionForSessionSpy.mockRestore();
    });

    it('should handle database errors gracefully', async () => {
      const getOrCreateSessionSpy = jest.spyOn(questionService as any, 'getOrCreateSession')
        .mockRejectedValue(new Error('Database connection failed'));

      await expect(questionService.getNextQuestion(mockRequest))
        .rejects
        .toThrow('Failed to get next question: Database connection failed');

      getOrCreateSessionSpy.mockRestore();
    });
  });

  describe('generateCTAVariants', () => {
    const mockQuestion: Question = {
      id: 'question-1',
      surveyId: 'survey-456',
      type: 'CTA_OFFER' as any,
      text: 'Test question',
      description: 'Test description',
      config: { maxButtons: 2 },
      options: [],
      order: 1,
      logic: undefined,
      aiVersions: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockOffers: Offer[] = [
      {
        id: 'offer-1',
        title: 'Test Offer 1',
        description: 'Test offer description',
        category: 'FINANCE' as any,
        status: 'ACTIVE' as any,
        destinationUrl: 'https://example.com/offer1',
        pixelUrl: undefined,
        config: { payout: 25.00, currency: 'USD' },
        targeting: undefined,
        metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: undefined,
      },
      {
        id: 'offer-2',
        title: 'Test Offer 2',
        description: 'Test offer description 2',
        category: 'INSURANCE' as any,
        status: 'ACTIVE' as any,
        destinationUrl: 'https://example.com/offer2',
        pixelUrl: undefined,
        config: { payout: 35.00, currency: 'USD' },
        targeting: undefined,
        metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: undefined,
      },
      {
        id: 'offer-3',
        title: 'Test Offer 3',
        description: 'Test offer description 3',
        category: 'HEALTH' as any,
        status: 'ACTIVE' as any,
        destinationUrl: 'https://example.com/offer3',
        pixelUrl: undefined,
        config: { payout: 15.00, currency: 'USD' },
        targeting: undefined,
        metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: undefined,
      },
    ];

    it('should generate correct number of button variants', async () => {
      const result = await questionService.generateCTAVariants(mockQuestion, mockOffers);

      expect(result).toHaveLength(2); // maxButtons = 2
      expect(result[0].offerId).toBe('offer-1');
      expect(result[1].offerId).toBe('offer-2');
    });

    it('should assign correct button styles', async () => {
      const result = await questionService.generateCTAVariants(mockQuestion, mockOffers);

      expect(result[0].style).toBe('primary');
      expect(result[1].style).toBe('secondary');
    });

    it('should generate unique button IDs', async () => {
      const result = await questionService.generateCTAVariants(mockQuestion, mockOffers);

      expect(result[0].id).toBeDefined();
      expect(result[1].id).toBeDefined();
      expect(result[0].id).not.toBe(result[1].id);
    });

    it('should handle empty offers array', async () => {
      const result = await questionService.generateCTAVariants(mockQuestion, []);

      expect(result).toHaveLength(0);
    });

    it('should respect maxButtons configuration', async () => {
      const questionWithMaxButtons = {
        ...mockQuestion,
        config: { maxButtons: 1 }
      };

      const result = await questionService.generateCTAVariants(questionWithMaxButtons, mockOffers);

      expect(result).toHaveLength(1);
      expect(result[0].offerId).toBe('offer-1');
    });
  });
});