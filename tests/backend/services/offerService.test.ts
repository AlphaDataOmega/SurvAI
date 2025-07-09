/**
 * @fileoverview Unit tests for OfferService
 * 
 * Tests for offer CRUD operations, pixel URL generation, and EPC integration
 * in the affiliate offer management system.
 */

import { OfferService } from '../../../backend/src/services/offerService';
import { epcService } from '../../../backend/src/services/epcService';
import type { 
  CreateOfferRequest, 
  UpdateOfferRequest, 
  ListOffersRequest
} from '@survai/shared';

// Mock EPC service
jest.mock('../../../backend/src/services/epcService');
const mockEpcService = epcService as jest.Mocked<typeof epcService>;

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaInstance = {
    offer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaInstance),
    Prisma: {
      TransactionClient: jest.fn(),
    },
  };
});

// Import the mocked Prisma to access the instance
import { PrismaClient } from '@prisma/client';
const mockPrismaInstance = new (PrismaClient as jest.MockedClass<typeof PrismaClient>)();

describe('OfferService', () => {
  let offerService: OfferService;
  
  beforeEach(() => {
    offerService = new OfferService();
    jest.clearAllMocks();
    
    // Set up environment variable
    process.env.TRACKING_PIXEL_URL = 'https://tracking.survai.app/pixel';
  });

  afterEach(() => {
    delete process.env.TRACKING_PIXEL_URL;
  });

  describe('generatePixelUrl', () => {
    it('should generate pixel URL with default template variables', () => {
      // ARRANGE - defaults should be used
      
      // ACT
      const result = offerService.generatePixelUrl();
      
      // ASSERT
      expect(result).toBe('https://tracking.survai.app/pixel?click_id=%7Bclick_id%7D&survey_id=%7Bsurvey_id%7D');
    });

    it('should generate pixel URL with custom template variables', () => {
      // ARRANGE
      const clickId = 'custom-click-123';
      const surveyId = 'custom-survey-456';
      
      // ACT
      const result = offerService.generatePixelUrl(clickId, surveyId);
      
      // ASSERT
      expect(result).toBe('https://tracking.survai.app/pixel?click_id=custom-click-123&survey_id=custom-survey-456');
    });

    it('should use default URL when env var not set', () => {
      // ARRANGE
      delete process.env.TRACKING_PIXEL_URL;
      
      // ACT
      const result = offerService.generatePixelUrl();
      
      // ASSERT
      expect(result).toBe('https://tracking.survai.app/pixel?click_id=%7Bclick_id%7D&survey_id=%7Bsurvey_id%7D');
    });
  });

  describe('createOffer', () => {
    const mockCreateRequest: CreateOfferRequest = {
      title: 'Test Offer',
      category: 'FINANCE',
      destinationUrl: 'https://example.com/offer',
      description: 'Test offer description',
      config: {
        payout: 25.00,
        currency: 'USD',
        dailyClickCap: 1000,
        totalClickCap: 10000,
        cooldownPeriod: 30
      },
      targeting: {
        geoTargeting: ['US', 'CA'],
        deviceTargeting: ['desktop', 'mobile']
      },
      createdBy: 'user-123'
    };

    it('should create offer successfully with all data', async () => {
      // ARRANGE
      const mockCreatedOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        description: 'Test offer description',
        category: 'FINANCE',
        status: 'PENDING',
        destinationUrl: 'https://example.com/offer',
        pixelUrl: 'https://tracking.survai.app/pixel?click_id=%7Bclick_id%7D&survey_id=%7Bsurvey_id%7D',
        config: {
          payout: 25.00,
          currency: 'USD',
          dailyClickCap: 1000,
          totalClickCap: 10000,
          cooldownPeriod: 30
        },
        targeting: {
          geoTargeting: ['US', 'CA'],
          deviceTargeting: ['desktop', 'mobile']
        },
        metrics: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          epc: 0,
          lastUpdated: new Date()
        },
        createdBy: 'user-123',
        updatedBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTx = {
        offer: {
          create: jest.fn().mockResolvedValue(mockCreatedOffer)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockEpcService.updateEPC.mockResolvedValue(undefined);

      // ACT
      const result = await offerService.createOffer(mockCreateRequest);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        title: 'Test Offer',
        category: 'FINANCE',
        status: 'PENDING',
        destinationUrl: 'https://example.com/offer',
        pixelUrl: expect.stringContaining('https://tracking.survai.app/pixel')
      }));
      
      expect(mockTx.offer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com/offer',
          pixelUrl: expect.stringContaining('https://tracking.survai.app/pixel'),
          status: 'PENDING',
          config: expect.objectContaining({
            payout: 25.00,
            currency: 'USD'
          }),
          targeting: expect.objectContaining({
            geoTargeting: ['US', 'CA'],
            deviceTargeting: ['desktop', 'mobile']
          }),
          metrics: expect.objectContaining({
            totalClicks: 0,
            totalConversions: 0
          }),
          createdBy: 'user-123',
          updatedBy: 'user-123'
        })
      });
      
      expect(mockEpcService.updateEPC).toHaveBeenCalledWith('offer-123');
    });

    it('should create offer with default config when not provided', async () => {
      // ARRANGE
      const minimalRequest: CreateOfferRequest = {
        title: 'Minimal Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com/offer'
      };

      const mockCreatedOffer = {
        id: 'offer-456',
        title: 'Minimal Offer',
        description: null,
        category: 'FINANCE',
        status: 'PENDING',
        destinationUrl: 'https://example.com/offer',
        pixelUrl: 'https://tracking.survai.app/pixel?click_id=%7Bclick_id%7D&survey_id=%7Bsurvey_id%7D',
        config: {
          payout: 0,
          currency: 'USD'
        },
        targeting: null,
        metrics: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          epc: 0,
          lastUpdated: new Date()
        },
        createdBy: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTx = {
        offer: {
          create: jest.fn().mockResolvedValue(mockCreatedOffer)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockEpcService.updateEPC.mockResolvedValue(undefined);

      // ACT
      const result = await offerService.createOffer(minimalRequest);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-456',
        title: 'Minimal Offer',
        config: expect.objectContaining({
          payout: 0,
          currency: 'USD'
        })
      }));
      
      expect(mockTx.offer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          config: {
            payout: 0,
            currency: 'USD'
          }
        })
      });
    });

    it('should validate required fields', async () => {
      // Test missing title
      const noTitle = { ...mockCreateRequest, title: '' };
      await expect(offerService.createOffer(noTitle)).rejects.toThrow('Missing required fields: title, category, and destinationUrl are required');

      // Test missing category
      const noCategory = { ...mockCreateRequest, category: undefined as any };
      await expect(offerService.createOffer(noCategory)).rejects.toThrow('Missing required fields: title, category, and destinationUrl are required');

      // Test missing destinationUrl
      const noUrl = { ...mockCreateRequest, destinationUrl: '' };
      await expect(offerService.createOffer(noUrl)).rejects.toThrow('Missing required fields: title, category, and destinationUrl are required');
    });

    it('should validate destination URL format', async () => {
      // ARRANGE
      const invalidUrlRequest = { ...mockCreateRequest, destinationUrl: 'invalid-url' };

      // ACT & ASSERT
      await expect(offerService.createOffer(invalidUrlRequest)).rejects.toThrow('Invalid destination URL provided');
    });

    it('should handle EPC service failures gracefully', async () => {
      // ARRANGE
      const mockCreatedOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        category: 'FINANCE',
        status: 'PENDING',
        destinationUrl: 'https://example.com/offer',
        pixelUrl: 'https://tracking.survai.app/pixel?click_id=%7Bclick_id%7D&survey_id=%7Bsurvey_id%7D',
        config: { payout: 0, currency: 'USD' },
        targeting: null,
        metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
        createdBy: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTx = {
        offer: {
          create: jest.fn().mockResolvedValue(mockCreatedOffer)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockEpcService.updateEPC.mockRejectedValue(new Error('EPC service failed'));

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // ACT
      const result = await offerService.createOffer(mockCreateRequest);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        title: 'Test Offer'
      }));
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize EPC for offer offer-123:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle transaction errors', async () => {
      // ARRANGE
      mockPrismaInstance.$transaction.mockRejectedValue(new Error('Database transaction failed'));

      // ACT & ASSERT
      await expect(offerService.createOffer(mockCreateRequest)).rejects.toThrow('Failed to create offer: Database transaction failed');
    });
  });

  describe('getOfferById', () => {
    const offerId = 'offer-123';

    it('should return offer when found', async () => {
      // ARRANGE
      const mockOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        description: 'Test description',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/offer',
        pixelUrl: 'https://tracking.survai.app/pixel?click_id=%7Bclick_id%7D&survey_id=%7Bsurvey_id%7D',
        config: {
          payout: 25.00,
          currency: 'USD',
          dailyClickCap: 1000,
          totalClickCap: 10000,
          cooldownPeriod: 30
        },
        targeting: {
          geoTargeting: ['US', 'CA'],
          deviceTargeting: ['desktop', 'mobile']
        },
        metrics: {
          totalClicks: 100,
          totalConversions: 15,
          totalRevenue: 375.00,
          conversionRate: 15.0,
          epc: 3.75,
          lastUpdated: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrismaInstance.offer.findUnique.mockResolvedValue(mockOffer);

      // ACT
      const result = await offerService.getOfferById(offerId);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        title: 'Test Offer',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/offer',
        config: expect.objectContaining({
          payout: 25.00,
          currency: 'USD'
        }),
        targeting: expect.objectContaining({
          geoTargeting: ['US', 'CA'],
          deviceTargeting: ['desktop', 'mobile']
        })
      }));
      
      expect(mockPrismaInstance.offer.findUnique).toHaveBeenCalledWith({
        where: { id: offerId }
      });
    });

    it('should return null when offer not found', async () => {
      // ARRANGE
      mockPrismaInstance.offer.findUnique.mockResolvedValue(null);

      // ACT
      const result = await offerService.getOfferById('non-existent-offer');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should validate offer ID parameter', async () => {
      // Test empty string
      await expect(offerService.getOfferById('')).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test null
      await expect(offerService.getOfferById(null as any)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test undefined
      await expect(offerService.getOfferById(undefined as any)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test non-string
      await expect(offerService.getOfferById(123 as any)).rejects.toThrow('Offer ID is required and must be a string');
    });

    it('should handle database errors', async () => {
      // ARRANGE
      mockPrismaInstance.offer.findUnique.mockRejectedValue(new Error('Database connection failed'));

      // ACT & ASSERT
      await expect(offerService.getOfferById(offerId)).rejects.toThrow('Failed to get offer: Database connection failed');
    });
  });

  describe('getOfferWithMetrics', () => {
    const offerId = 'offer-123';

    it('should return offer with EPC metrics', async () => {
      // ARRANGE
      const mockOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        description: 'Test description',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/offer',
        pixelUrl: 'https://tracking.survai.app/pixel?click_id=%7Bclick_id%7D&survey_id=%7Bsurvey_id%7D',
        config: {
          payout: 25.00,
          currency: 'USD'
        },
        targeting: null,
        metrics: {
          totalClicks: 100,
          totalConversions: 15,
          totalRevenue: 375.00,
          conversionRate: 15.0,
          epc: 3.75,
          lastUpdated: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrismaInstance.offer.findUnique.mockResolvedValue(mockOffer);
      mockEpcService.calculateEPC.mockResolvedValue(3.75);

      // ACT
      const result = await offerService.getOfferWithMetrics(offerId);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        title: 'Test Offer',
        epcMetrics: expect.objectContaining({
          epc: 3.75,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          lastUpdated: expect.any(Date)
        })
      }));
      
      expect(mockEpcService.calculateEPC).toHaveBeenCalledWith(offerId);
    });

    it('should return null when offer not found', async () => {
      // ARRANGE
      mockPrismaInstance.offer.findUnique.mockResolvedValue(null);

      // ACT
      const result = await offerService.getOfferWithMetrics('non-existent-offer');

      // ASSERT
      expect(result).toBeNull();
    });

    it('should handle EPC service failures gracefully', async () => {
      // ARRANGE
      const mockOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/offer',
        config: { payout: 25.00, currency: 'USD' },
        targeting: null,
        metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrismaInstance.offer.findUnique.mockResolvedValue(mockOffer);
      mockEpcService.calculateEPC.mockRejectedValue(new Error('EPC service failed'));

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // ACT
      const result = await offerService.getOfferWithMetrics(offerId);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        title: 'Test Offer',
        epcMetrics: undefined
      }));
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get EPC metrics for offer offer-123:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('listOffers', () => {
    it('should return paginated offers with default parameters', async () => {
      // ARRANGE
      const mockOffers = [
        {
          id: 'offer-1',
          title: 'Offer 1',
          category: 'FINANCE',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/offer1',
          config: { payout: 25.00, currency: 'USD' },
          targeting: null,
          metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'offer-2',
          title: 'Offer 2',
          category: 'INSURANCE',
          status: 'PAUSED',
          destinationUrl: 'https://example.com/offer2',
          config: { payout: 50.00, currency: 'USD' },
          targeting: null,
          metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrismaInstance.offer.count.mockResolvedValue(2);
      mockPrismaInstance.offer.findMany.mockResolvedValue(mockOffers);
      mockEpcService.calculateEPC.mockResolvedValue(0);

      // ACT
      const result = await offerService.listOffers();

      // ASSERT
      expect(result).toEqual({
        offers: expect.arrayContaining([
          expect.objectContaining({
            id: 'offer-1',
            title: 'Offer 1',
            category: 'FINANCE',
            status: 'ACTIVE'
          }),
          expect.objectContaining({
            id: 'offer-2',
            title: 'Offer 2',
            category: 'INSURANCE',
            status: 'PAUSED'
          })
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasMore: false
        }
      });
      
      expect(mockPrismaInstance.offer.count).toHaveBeenCalledWith({ where: {} });
      expect(mockPrismaInstance.offer.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should handle filtering by category and status', async () => {
      // ARRANGE
      const params: ListOffersRequest = {
        category: 'FINANCE',
        status: 'ACTIVE',
        page: 1,
        limit: 5
      };

      mockPrismaInstance.offer.count.mockResolvedValue(0);
      mockPrismaInstance.offer.findMany.mockResolvedValue([]);

      // ACT
      await offerService.listOffers(params);

      // ASSERT
      expect(mockPrismaInstance.offer.count).toHaveBeenCalledWith({
        where: {
          category: 'FINANCE',
          status: 'ACTIVE'
        }
      });
      expect(mockPrismaInstance.offer.findMany).toHaveBeenCalledWith({
        where: {
          category: 'FINANCE',
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 5
      });
    });

    it('should handle search filtering', async () => {
      // ARRANGE
      const params: ListOffersRequest = {
        search: 'test offer',
        page: 1,
        limit: 10
      };

      mockPrismaInstance.offer.count.mockResolvedValue(0);
      mockPrismaInstance.offer.findMany.mockResolvedValue([]);

      // ACT
      await offerService.listOffers(params);

      // ASSERT
      expect(mockPrismaInstance.offer.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test offer', mode: 'insensitive' } },
            { description: { contains: 'test offer', mode: 'insensitive' } }
          ]
        }
      });
    });

    it('should handle sorting by different fields', async () => {
      // ARRANGE
      const params: ListOffersRequest = {
        sortBy: 'title',
        sortOrder: 'asc',
        page: 1,
        limit: 10
      };

      mockPrismaInstance.offer.count.mockResolvedValue(0);
      mockPrismaInstance.offer.findMany.mockResolvedValue([]);

      // ACT
      await offerService.listOffers(params);

      // ASSERT
      expect(mockPrismaInstance.offer.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { title: 'asc' },
        skip: 0,
        take: 10
      });
    });

    it('should handle pagination correctly', async () => {
      // ARRANGE
      const params: ListOffersRequest = {
        page: 3,
        limit: 5
      };

      mockPrismaInstance.offer.count.mockResolvedValue(20);
      mockPrismaInstance.offer.findMany.mockResolvedValue([]);

      // ACT
      const result = await offerService.listOffers(params);

      // ASSERT
      expect(mockPrismaInstance.offer.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 10, // (3-1) * 5
        take: 5
      });
      expect(result.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 20,
        totalPages: 4,
        hasMore: true
      });
    });

    it('should handle database errors', async () => {
      // ARRANGE
      mockPrismaInstance.offer.count.mockRejectedValue(new Error('Database connection failed'));

      // ACT & ASSERT
      await expect(offerService.listOffers()).rejects.toThrow('Failed to list offers: Database connection failed');
    });
  });

  describe('updateOffer', () => {
    const offerId = 'offer-123';
    const updateData: UpdateOfferRequest = {
      title: 'Updated Offer',
      description: 'Updated description',
      destinationUrl: 'https://updated.example.com/offer',
      config: {
        payout: 50.00,
        currency: 'USD'
      },
      updatedBy: 'user-456'
    };

    it('should update offer successfully', async () => {
      // ARRANGE
      const existingOffer = {
        id: 'offer-123',
        title: 'Original Offer',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://original.example.com/offer',
        config: { payout: 25.00, currency: 'USD' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedOffer = {
        ...existingOffer,
        title: 'Updated Offer',
        description: 'Updated description',
        destinationUrl: 'https://updated.example.com/offer',
        pixelUrl: 'https://tracking.survai.app/pixel?click_id=%7Bclick_id%7D&survey_id=%7Bsurvey_id%7D',
        config: { payout: 50.00, currency: 'USD' },
        updatedBy: 'user-456',
        updatedAt: new Date()
      };

      mockPrismaInstance.offer.findUnique.mockResolvedValue(existingOffer);

      const mockTx = {
        offer: {
          update: jest.fn().mockResolvedValue(updatedOffer)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockEpcService.updateEPC.mockResolvedValue(undefined);

      // ACT
      const result = await offerService.updateOffer(offerId, updateData);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        title: 'Updated Offer',
        description: 'Updated description',
        destinationUrl: 'https://updated.example.com/offer',
        pixelUrl: expect.stringContaining('https://tracking.survai.app/pixel'),
        config: expect.objectContaining({
          payout: 50.00,
          currency: 'USD'
        })
      }));
      
      expect(mockTx.offer.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: expect.objectContaining({
          title: 'Updated Offer',
          description: 'Updated description',
          destinationUrl: 'https://updated.example.com/offer',
          pixelUrl: expect.stringContaining('https://tracking.survai.app/pixel'),
          config: expect.objectContaining({
            payout: 50.00,
            currency: 'USD'
          }),
          updatedBy: 'user-456',
          updatedAt: expect.any(Date)
        })
      });
      
      expect(mockEpcService.updateEPC).toHaveBeenCalledWith(offerId);
    });

    it('should validate offer ID parameter', async () => {
      // Test empty string
      await expect(offerService.updateOffer('', updateData)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test null
      await expect(offerService.updateOffer(null as any, updateData)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test undefined
      await expect(offerService.updateOffer(undefined as any, updateData)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test non-string
      await expect(offerService.updateOffer(123 as any, updateData)).rejects.toThrow('Offer ID is required and must be a string');
    });

    it('should throw error when offer not found', async () => {
      // ARRANGE
      mockPrismaInstance.offer.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(offerService.updateOffer('non-existent-offer', updateData)).rejects.toThrow('Offer non-existent-offer not found');
    });

    it('should validate destination URL when provided', async () => {
      // ARRANGE
      const existingOffer = {
        id: 'offer-123',
        title: 'Original Offer',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://original.example.com/offer',
        config: { payout: 25.00, currency: 'USD' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrismaInstance.offer.findUnique.mockResolvedValue(existingOffer);

      const invalidUpdateData = {
        ...updateData,
        destinationUrl: 'invalid-url'
      };

      // ACT & ASSERT
      await expect(offerService.updateOffer(offerId, invalidUpdateData)).rejects.toThrow('Invalid destination URL provided');
    });

    it('should handle EPC service failures gracefully', async () => {
      // ARRANGE
      const existingOffer = {
        id: 'offer-123',
        title: 'Original Offer',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://original.example.com/offer',
        config: { payout: 25.00, currency: 'USD' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrismaInstance.offer.findUnique.mockResolvedValue(existingOffer);

      const mockTx = {
        offer: {
          update: jest.fn().mockResolvedValue(existingOffer)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockEpcService.updateEPC.mockRejectedValue(new Error('EPC service failed'));

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // ACT
      const result = await offerService.updateOffer(offerId, updateData);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        title: 'Original Offer'
      }));
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update EPC for offer offer-123:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('toggleOfferStatus', () => {
    const offerId = 'offer-123';

    it('should toggle offer status to ACTIVE', async () => {
      // ARRANGE
      const existingOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        category: 'FINANCE',
        status: 'PAUSED',
        destinationUrl: 'https://example.com/offer',
        config: { payout: 25.00, currency: 'USD' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedOffer = {
        ...existingOffer,
        status: 'ACTIVE',
        updatedAt: new Date()
      };

      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue(existingOffer),
          update: jest.fn().mockResolvedValue(updatedOffer)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      // ACT
      const result = await offerService.toggleOfferStatus(offerId, 'ACTIVE');

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        status: 'ACTIVE'
      }));
      
      expect(mockTx.offer.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          status: 'ACTIVE',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should toggle offer status to PAUSED', async () => {
      // ARRANGE
      const existingOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/offer',
        config: { payout: 25.00, currency: 'USD' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedOffer = {
        ...existingOffer,
        status: 'PAUSED',
        updatedAt: new Date()
      };

      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue(existingOffer),
          update: jest.fn().mockResolvedValue(updatedOffer)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      // ACT
      const result = await offerService.toggleOfferStatus(offerId, 'PAUSED');

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        status: 'PAUSED'
      }));
    });

    it('should validate offer ID parameter', async () => {
      // Test empty string
      await expect(offerService.toggleOfferStatus('', 'ACTIVE')).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test null
      await expect(offerService.toggleOfferStatus(null as any, 'ACTIVE')).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test undefined
      await expect(offerService.toggleOfferStatus(undefined as any, 'ACTIVE')).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test non-string
      await expect(offerService.toggleOfferStatus(123 as any, 'ACTIVE')).rejects.toThrow('Offer ID is required and must be a string');
    });

    it('should validate status parameter', async () => {
      // Test invalid status
      await expect(offerService.toggleOfferStatus(offerId, 'INVALID' as any)).rejects.toThrow('Status must be either ACTIVE or PAUSED');
      
      // Test null status
      await expect(offerService.toggleOfferStatus(offerId, null as any)).rejects.toThrow('Status must be either ACTIVE or PAUSED');
      
      // Test undefined status
      await expect(offerService.toggleOfferStatus(offerId, undefined as any)).rejects.toThrow('Status must be either ACTIVE or PAUSED');
    });

    it('should throw error when offer not found', async () => {
      // ARRANGE
      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      // ACT & ASSERT
      await expect(offerService.toggleOfferStatus('non-existent-offer', 'ACTIVE')).rejects.toThrow('Offer non-existent-offer not found');
    });
  });

  describe('deleteOffer', () => {
    const offerId = 'offer-123';

    it('should soft delete offer by setting status to ARCHIVED', async () => {
      // ARRANGE
      const existingOffer = {
        id: 'offer-123',
        title: 'Test Offer',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/offer',
        config: { payout: 25.00, currency: 'USD' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const archivedOffer = {
        ...existingOffer,
        status: 'ARCHIVED',
        updatedAt: new Date()
      };

      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue(existingOffer),
          update: jest.fn().mockResolvedValue(archivedOffer)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      // ACT
      const result = await offerService.deleteOffer(offerId);

      // ASSERT
      expect(result).toEqual(expect.objectContaining({
        id: 'offer-123',
        status: 'ARCHIVED'
      }));
      
      expect(mockTx.offer.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          status: 'ARCHIVED',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should validate offer ID parameter', async () => {
      // Test empty string
      await expect(offerService.deleteOffer('')).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test null
      await expect(offerService.deleteOffer(null as any)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test undefined
      await expect(offerService.deleteOffer(undefined as any)).rejects.toThrow('Offer ID is required and must be a string');
      
      // Test non-string
      await expect(offerService.deleteOffer(123 as any)).rejects.toThrow('Offer ID is required and must be a string');
    });

    it('should throw error when offer not found', async () => {
      // ARRANGE
      const mockTx = {
        offer: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };

      mockPrismaInstance.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      // ACT & ASSERT
      await expect(offerService.deleteOffer('non-existent-offer')).rejects.toThrow('Offer non-existent-offer not found');
    });
  });

  describe('getActiveOffersByEPC', () => {
    it('should return active offers sorted by EPC', async () => {
      // ARRANGE
      const mockOffers = [
        {
          id: 'offer-1',
          title: 'Low EPC Offer',
          category: 'FINANCE',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/offer1',
          config: { payout: 10.00, currency: 'USD' },
          targeting: null,
          metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'offer-2',
          title: 'High EPC Offer',
          category: 'INSURANCE',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/offer2',
          config: { payout: 50.00, currency: 'USD' },
          targeting: null,
          metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrismaInstance.offer.findMany.mockResolvedValue(mockOffers);
      mockEpcService.calculateEPC
        .mockResolvedValueOnce(1.50) // Low EPC offer
        .mockResolvedValueOnce(5.25); // High EPC offer

      // ACT
      const result = await offerService.getActiveOffersByEPC();

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'offer-2',
        title: 'High EPC Offer',
        epcMetrics: expect.objectContaining({
          epc: 5.25
        })
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        id: 'offer-1',
        title: 'Low EPC Offer',
        epcMetrics: expect.objectContaining({
          epc: 1.50
        })
      }));
      
      expect(mockPrismaInstance.offer.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should handle EPC service failures gracefully', async () => {
      // ARRANGE
      const mockOffers = [
        {
          id: 'offer-1',
          title: 'Test Offer',
          category: 'FINANCE',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/offer1',
          config: { payout: 25.00, currency: 'USD' },
          targeting: null,
          metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrismaInstance.offer.findMany.mockResolvedValue(mockOffers);
      mockEpcService.calculateEPC.mockRejectedValue(new Error('EPC service failed'));

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // ACT
      const result = await offerService.getActiveOffersByEPC();

      // ASSERT
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'offer-1',
        title: 'Test Offer',
        epcMetrics: expect.objectContaining({
          epc: 0
        })
      }));
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get EPC metrics for offer offer-1:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return empty array when no active offers', async () => {
      // ARRANGE
      mockPrismaInstance.offer.findMany.mockResolvedValue([]);

      // ACT
      const result = await offerService.getActiveOffersByEPC();

      // ASSERT
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // ARRANGE
      mockPrismaInstance.offer.findMany.mockRejectedValue(new Error('Database connection failed'));

      // ACT & ASSERT
      await expect(offerService.getActiveOffersByEPC()).rejects.toThrow('Failed to get active offers by EPC: Database connection failed');
    });
  });
});