/**
 * @fileoverview Unit tests for TrackingService
 * 
 * Tests for click tracking, URL generation, and conversion handling
 * in the CTA system.
 */

import { TrackingService } from '../../backend/src/services/trackingService';
import type { TrackClickRequest, Offer, UrlVariables } from '@survai/shared';

// Mock Prisma
jest.mock('@prisma/client');

describe('TrackingService', () => {
  let trackingService: TrackingService;
  
  beforeEach(() => {
    trackingService = new TrackingService();
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.TRACKING_PIXEL_URL = 'https://tracking.test.com/pixel';
  });

  describe('trackClick', () => {
    const mockRequest: TrackClickRequest = {
      sessionId: 'session-123',
      questionId: 'question-456',
      offerId: 'offer-789',
      buttonVariantId: 'button-abc',
      timestamp: Date.now(),
      userAgent: 'Mozilla/5.0 Test Browser',
      ipAddress: '192.168.1.1',
    };

    it('should successfully track a click with all data', async () => {
      // Mock successful database operations
      const mockPrisma = {
        surveyResponse: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'response-123',
          }),
        },
        clickTrack: {
          create: jest.fn().mockResolvedValue({
            id: 'click-track-456',
            offerId: 'offer-789',
            responseId: 'response-123',
            clickId: 'generated-click-id',
            sessionData: {
              sessionId: 'session-123',
              clickId: 'generated-click-id',
              ipAddress: '192.168.1.1',
              userAgent: 'Mozilla/5.0 Test Browser',
            },
            status: 'VALID',
            converted: false,
            convertedAt: null,
            revenue: null,
            clickedAt: new Date(),
            metadata: {
              questionId: 'question-456',
              buttonVariantId: 'button-abc',
              timestamp: mockRequest.timestamp,
            },
          }),
        },
      };

      // Mock the prisma import in the service
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.trackClick(mockRequest);

      expect(result).toBeDefined();
      expect(result.offerId).toBe('offer-789');
      expect(result.status).toBe('VALID');
      expect(result.converted).toBe(false);
      expect(result.session.sessionId).toBe('session-123');
    });

    it('should handle missing survey response gracefully', async () => {
      const mockPrisma = {
        surveyResponse: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        clickTrack: {
          create: jest.fn().mockResolvedValue({
            id: 'click-track-456',
            offerId: 'offer-789',
            responseId: null,
            clickId: 'generated-click-id',
            sessionData: {},
            status: 'VALID',
            converted: false,
            convertedAt: null,
            revenue: null,
            clickedAt: new Date(),
            metadata: {},
          }),
        },
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.trackClick(mockRequest);

      expect(result).toBeDefined();
      expect(result.responseId).toBeUndefined();
    });

    it('should detect device type correctly', () => {
      // Test the private method indirectly through device detection
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const tabletUA = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

      // Access private method through type assertion
      const detectDeviceType = (trackingService as any).detectDeviceType.bind(trackingService);
      const isMobileDevice = (trackingService as any).isMobileDevice.bind(trackingService);

      expect(detectDeviceType(mobileUA)).toBe('MOBILE');
      expect(detectDeviceType(tabletUA)).toBe('TABLET');
      expect(detectDeviceType(desktopUA)).toBe('DESKTOP');
      
      expect(isMobileDevice(mobileUA)).toBe(true);
      expect(isMobileDevice(tabletUA)).toBe(false);
      expect(isMobileDevice(desktopUA)).toBe(false);
    });

    it('should validate required parameters', async () => {
      // Test missing sessionId
      await expect(trackingService.trackClick({
        sessionId: '',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        timestamp: Date.now(),
      })).rejects.toThrow('Missing required parameters: sessionId, questionId, offerId, and buttonVariantId are required');

      // Test missing offerId
      await expect(trackingService.trackClick({
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: '',
        buttonVariantId: 'button-abc',
        timestamp: Date.now(),
      })).rejects.toThrow('Missing required parameters: sessionId, questionId, offerId, and buttonVariantId are required');
    });

    it('should validate session exists', async () => {
      const mockPrisma = {
        surveyResponse: {
          findFirst: jest.fn().mockResolvedValue(null), // No session found
        },
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      await expect(trackingService.trackClick({
        sessionId: 'non-existent-session',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        timestamp: Date.now(),
      })).rejects.toThrow('Invalid session: Session ID non-existent-session not found');
    });

    it('should validate offer exists', async () => {
      const mockPrisma = {
        surveyResponse: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'response-123',
          }),
        },
        offer: {
          findUnique: jest.fn().mockResolvedValue(null), // No offer found
        },
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      await expect(trackingService.trackClick({
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'non-existent-offer',
        buttonVariantId: 'button-abc',
        timestamp: Date.now(),
      })).rejects.toThrow('Invalid offer: Offer ID non-existent-offer not found');
    });

    it('should validate offer is active', async () => {
      const mockPrisma = {
        surveyResponse: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'response-123',
          }),
        },
        offer: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'offer-789',
            status: 'PAUSED', // Inactive offer
          }),
        },
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      await expect(trackingService.trackClick({
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        timestamp: Date.now(),
      })).rejects.toThrow('Invalid offer: Offer ID offer-789 is not active (status: PAUSED)');
    });

    it('should use transaction for atomic click creation', async () => {
      const mockPrisma = {
        surveyResponse: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'response-123',
          }),
        },
        offer: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'offer-789',
            status: 'ACTIVE',
          }),
        },
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return callback({
            clickTrack: {
              create: jest.fn().mockResolvedValue({
                id: 'click-track-456',
                offerId: 'offer-789',
                responseId: 'response-123',
                clickId: 'generated-click-id',
                sessionData: {
                  sessionId: 'session-123',
                  clickId: 'generated-click-id',
                },
                status: 'VALID',
                converted: false,
                convertedAt: null,
                revenue: null,
                clickedAt: new Date(),
                metadata: {
                  questionId: 'question-456',
                  buttonVariantId: 'button-abc',
                },
              }),
            },
          });
        }),
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.trackClick({
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        timestamp: Date.now(),
      });

      expect(result).toBeDefined();
      expect(result.offerId).toBe('offer-789');
      expect(result.status).toBe('VALID');
      expect(result.converted).toBe(false);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should handle default timestamp when not provided', async () => {
      const mockPrisma = {
        surveyResponse: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'response-123',
          }),
        },
        offer: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'offer-789',
            status: 'ACTIVE',
          }),
        },
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return callback({
            clickTrack: {
              create: jest.fn().mockResolvedValue({
                id: 'click-track-456',
                offerId: 'offer-789',
                responseId: 'response-123',
                clickId: 'generated-click-id',
                sessionData: {},
                status: 'VALID',
                converted: false,
                convertedAt: null,
                revenue: null,
                clickedAt: new Date(),
                metadata: {
                  questionId: 'question-456',
                  buttonVariantId: 'button-abc',
                  timestamp: expect.any(Number),
                },
              }),
            },
          });
        }),
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.trackClick({
        sessionId: 'session-123',
        questionId: 'question-456',
        offerId: 'offer-789',
        buttonVariantId: 'button-abc',
        // No timestamp provided - should use default
      });

      expect(result).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
    });
  });

  describe('generatePixelUrl', () => {
    it('should generate pixel URL with correct parameters', () => {
      const clickId = 'click-123';
      const surveyId = 'survey-456';

      const result = trackingService.generatePixelUrl(clickId, surveyId);

      expect(result).toContain('https://tracking.test.com/pixel');
      expect(result).toContain('click_id=click-123');
      expect(result).toContain('survey_id=survey-456');
      expect(result).toContain('t='); // timestamp
    });

    it('should use default URL when env var not set', () => {
      delete process.env.TRACKING_PIXEL_URL;

      const result = trackingService.generatePixelUrl('click-123', 'survey-456');

      expect(result).toContain('https://tracking.survai.app/pixel');
    });
  });

  describe('generateOfferUrl', () => {
    const mockOffer: Offer = {
      id: 'offer-123',
      title: 'Test Offer',
      description: 'Test offer description',
      category: 'FINANCE' as any,
      status: 'ACTIVE' as any,
      destinationUrl: 'https://example.com/offer?ref=test&click_id={click_id}&survey_id={survey_id}',
      pixelUrl: undefined,
      config: { payout: 25.00, currency: 'USD' },
      targeting: undefined,
      metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: undefined,
    };

    const mockVariables: UrlVariables = {
      clickId: 'click-abc-123',
      surveyId: 'survey-def-456',
      sessionId: 'session-ghi-789',
    };

    it('should replace template variables in URL', () => {
      const result = trackingService.generateOfferUrl(mockOffer, mockVariables);

      expect(result).toContain('click_id=click-abc-123');
      expect(result).toContain('survey_id=survey-def-456');
      expect(result).toContain('session_id=session-ghi-789');
      expect(result).not.toContain('{click_id}');
      expect(result).not.toContain('{survey_id}');
    });

    it('should handle URLs without template variables', () => {
      const simpleOffer = {
        ...mockOffer,
        destinationUrl: 'https://example.com/simple-offer',
      };

      const result = trackingService.generateOfferUrl(simpleOffer, mockVariables);

      expect(result).toContain('https://example.com/simple-offer');
      expect(result).toContain('click_id=click-abc-123');
      expect(result).toContain('survey_id=survey-def-456');
    });

    it('should encode URL parameters properly', () => {
      const variablesWithSpecialChars: UrlVariables = {
        clickId: 'click-with-special-chars-!@#',
        surveyId: 'survey-with-spaces and symbols',
      };

      const result = trackingService.generateOfferUrl(mockOffer, variablesWithSpecialChars);

      expect(result).toContain(encodeURIComponent('click-with-special-chars-!@#'));
      expect(result).toContain(encodeURIComponent('survey-with-spaces and symbols'));
    });
  });

  describe('markConversion', () => {
    it('should mark conversion with revenue', async () => {
      const mockPrisma = {
        clickTrack: {
          update: jest.fn().mockResolvedValue({
            id: 'click-track-456',
            offerId: 'offer-789',
            responseId: 'response-123',
            clickId: 'click-abc-123',
            sessionData: {},
            status: 'VALID',
            converted: true,
            convertedAt: new Date(),
            revenue: 25.50,
            clickedAt: new Date(),
            metadata: {},
          }),
        },
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.markConversion('click-abc-123', 25.50);

      expect(result.converted).toBe(true);
      expect(result.revenue).toBe(25.50);
      expect(result.convertedAt).toBeDefined();
    });

    it('should mark conversion without revenue', async () => {
      const mockPrisma = {
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return callback({
            clickTrack: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'click-track-456',
                converted: false,
                convertedAt: null,
                revenue: null,
                offerId: 'offer-789',
                responseId: 'response-123',
                sessionData: {},
                status: 'VALID',
                clickedAt: new Date(),
                metadata: {},
              }),
              update: jest.fn().mockResolvedValue({
                id: 'click-track-456',
                offerId: 'offer-789',
                responseId: 'response-123',
                clickId: 'click-abc-123',
                sessionData: {},
                status: 'VALID',
                converted: true,
                convertedAt: new Date(),
                revenue: null,
                clickedAt: new Date(),
                metadata: {},
              }),
            },
          });
        }),
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.markConversion('click-abc-123');

      expect(result.converted).toBe(true);
      expect(result.revenue).toBe(0);
    });

    it('should be idempotent when conversion already exists', async () => {
      const existingConversionDate = new Date('2023-01-01T10:00:00Z');
      const mockPrisma = {
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return callback({
            clickTrack: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'click-track-456',
                converted: true,
                convertedAt: existingConversionDate,
                revenue: 25.50,
                offerId: 'offer-789',
                responseId: 'response-123',
                sessionData: {},
                status: 'VALID',
                clickedAt: new Date(),
                metadata: {},
              }),
              update: jest.fn(), // Should not be called
            },
          });
        }),
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.markConversion('click-abc-123', 50.00);

      expect(result.converted).toBe(true);
      expect(result.revenue).toBe(25.50); // Should return original revenue, not new one
      expect(result.convertedAt).toEqual(existingConversionDate);
      
      // Verify update was not called (idempotent)
      const mockTx = mockPrisma.$transaction.mock.calls[0][0];
      const mockClickTrack = { 
        clickTrack: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'click-track-456',
            converted: true,
            convertedAt: existingConversionDate,
            revenue: 25.50,
            offerId: 'offer-789',
            responseId: 'response-123',
            sessionData: {},
            status: 'VALID',
            clickedAt: new Date(),
            metadata: {},
          }),
          update: jest.fn(),
        },
      };
      
      await mockTx(mockClickTrack);
      expect(mockClickTrack.clickTrack.update).not.toHaveBeenCalled();
    });

    it('should validate click ID parameter', async () => {
      // Test empty string
      await expect(trackingService.markConversion('')).rejects.toThrow('Click ID is required and must be a string');
      
      // Test null
      await expect(trackingService.markConversion(null as any)).rejects.toThrow('Click ID is required and must be a string');
      
      // Test undefined
      await expect(trackingService.markConversion(undefined as any)).rejects.toThrow('Click ID is required and must be a string');
      
      // Test non-string
      await expect(trackingService.markConversion(123 as any)).rejects.toThrow('Click ID is required and must be a string');
    });

    it('should handle non-existent click ID', async () => {
      const mockPrisma = {
        $transaction: jest.fn().mockImplementation(async (callback) => {
          return callback({
            clickTrack: {
              findUnique: jest.fn().mockResolvedValue(null),
            },
          });
        }),
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      await expect(trackingService.markConversion('non-existent-click-id')).rejects.toThrow('Click ID non-existent-click-id not found');
    });

    it('should handle database errors gracefully', async () => {
      const mockPrisma = {
        $transaction: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      await expect(trackingService.markConversion('click-abc-123')).rejects.toThrow('Failed to mark conversion: Database connection failed');
    });
  });

  describe('getAnalytics', () => {
    it('should calculate EPC and conversion rates correctly', async () => {
      const mockPrisma = {
        clickTrack: {
          count: jest.fn()
            .mockResolvedValueOnce(100) // total clicks
            .mockResolvedValueOnce(15), // conversions
          aggregate: jest.fn().mockResolvedValue({
            _sum: { revenue: 375.50 }
          }),
        },
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.getAnalytics();

      expect(result.totalClicks).toBe(100);
      expect(result.conversions).toBe(15);
      expect(result.conversionRate).toBe(15); // 15/100 * 100
      expect(result.totalRevenue).toBe(375.50);
      expect(result.epc).toBe(3.755); // 375.50/100
    });

    it('should handle zero clicks gracefully', async () => {
      const mockPrisma = {
        clickTrack: {
          count: jest.fn()
            .mockResolvedValueOnce(0) // total clicks
            .mockResolvedValueOnce(0), // conversions
          aggregate: jest.fn().mockResolvedValue({
            _sum: { revenue: null }
          }),
        },
      };

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }));

      const result = await trackingService.getAnalytics();

      expect(result.totalClicks).toBe(0);
      expect(result.conversions).toBe(0);
      expect(result.conversionRate).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.epc).toBe(0);
    });
  });
});