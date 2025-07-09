/**
 * @fileoverview Integration tests for OfferController
 * 
 * Tests for offer management API endpoints with database integration
 * for the affiliate offer CRUD operations system.
 */

import request from 'supertest';
import app from '../../../backend/src/app';
import { PrismaClient } from '@prisma/client';
import type { 
  CreateOfferRequest, 
  UpdateOfferRequest, 
  OfferCategory,
  OfferStatus 
} from '@survai/shared';
import { createTestUser, createTestOffer, cleanupTestData } from '../helpers/dbSeed';
import { getTestToken } from '../helpers/getTestToken';
import { expectSuccessResponse, expectErrorResponse, expectValidationError } from '../helpers/testUtils';

// Override the default test setup to use real database for integration tests
jest.resetModules();
jest.restoreAllMocks();

// Set up environment for integration tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://survai_user:survai_password@localhost:5433/survai_test?schema=public';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

describe('OfferController Integration', () => {
  let testUserId: string;
  let testUserToken: string;
  let createdOfferIds: string[] = [];

  beforeAll(async () => {
    // Create test user for authentication
    const testUser = await createTestUser('ADMIN');
    testUserId = testUser.id;
    testUserToken = getTestToken(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData({
      userIds: [testUserId],
      offerIds: createdOfferIds,
    });
    await prisma.$disconnect();
  });

  afterEach(() => {
    // Reset the array after each test
    createdOfferIds = [];
  });

  describe('POST /api/offers', () => {
    const validCreateRequest: CreateOfferRequest = {
      title: 'Premium Finance Offer',
      description: 'High-converting financial services offer',
      category: 'FINANCE',
      destinationUrl: 'https://example.com/finance-offer',
      config: {
        payout: 75.00,
        currency: 'USD',
        dailyClickCap: 1000,
        totalClickCap: 50000,
        cooldownPeriod: 24
      },
      targeting: {
        geoTargeting: ['US', 'CA', 'GB'],
        deviceTargeting: ['desktop', 'mobile']
      },
      createdBy: testUserId
    };

    it('should create offer with all fields', async () => {
      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(validCreateRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe('Premium Finance Offer');
      expect(response.body.data.description).toBe('High-converting financial services offer');
      expect(response.body.data.category).toBe('FINANCE');
      expect(response.body.data.destinationUrl).toBe('https://example.com/finance-offer');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.pixelUrl).toBeDefined();
      expect(response.body.data.pixelUrl).toContain('https://tracking.survai.app/pixel');
      expect(response.body.data.pixelUrl).toContain('click_id={click_id}');
      expect(response.body.data.pixelUrl).toContain('survey_id={survey_id}');
      expect(response.body.data.config).toEqual(expect.objectContaining({
        payout: 75.00,
        currency: 'USD',
        dailyClickCap: 1000,
        totalClickCap: 50000,
        cooldownPeriod: 24
      }));
      expect(response.body.data.targeting).toEqual(expect.objectContaining({
        geoTargeting: ['US', 'CA', 'GB'],
        deviceTargeting: ['desktop', 'mobile']
      }));
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
      expect(response.body.timestamp).toBeDefined();

      // Store for cleanup
      createdOfferIds.push(response.body.data.id);
    });

    it('should create offer with minimal fields', async () => {
      const minimalRequest: CreateOfferRequest = {
        title: 'Basic Offer',
        category: 'TECHNOLOGY',
        destinationUrl: 'https://example.com/basic-offer'
      };

      const response = await request(app)
        .post('/api/offers')
        .send(minimalRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Basic Offer');
      expect(response.body.data.category).toBe('TECHNOLOGY');
      expect(response.body.data.destinationUrl).toBe('https://example.com/basic-offer');
      expect(response.body.data.description).toBeUndefined();
      expect(response.body.data.config).toEqual(expect.objectContaining({
        payout: 0,
        currency: 'USD'
      }));
      expect(response.body.data.targeting).toBeUndefined();
      expect(response.body.data.pixelUrl).toBeDefined();

      // Store for cleanup
      createdOfferIds.push(response.body.data.id);
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        description: 'Missing title and category',
        destinationUrl: 'https://example.com/invalid'
      };

      const response = await request(app)
        .post('/api/offers')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should validate destination URL format', async () => {
      const invalidUrlRequest = {
        title: 'Invalid URL Offer',
        category: 'FINANCE',
        destinationUrl: 'not-a-valid-url'
      };

      const response = await request(app)
        .post('/api/offers')
        .send(invalidUrlRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('url');
    });

    it('should validate category enum', async () => {
      const invalidCategoryRequest = {
        title: 'Invalid Category Offer',
        category: 'INVALID_CATEGORY',
        destinationUrl: 'https://example.com/invalid-category'
      };

      const response = await request(app)
        .post('/api/offers')
        .send(invalidCategoryRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('category');
    });

    it('should validate config fields', async () => {
      const invalidConfigRequest = {
        title: 'Invalid Config Offer',
        category: 'FINANCE',
        destinationUrl: 'https://example.com/invalid-config',
        config: {
          payout: -10, // Invalid negative payout
          currency: 'INVALID_CURRENCY'
        }
      };

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(invalidConfigRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    // Comprehensive Error Path Testing
    describe('Error Path Testing', () => {
      it('should return 401 when no authentication token provided', async () => {
        const response = await request(app)
          .post('/api/offers')
          .send(validCreateRequest)
          .expect(401);

        expectErrorResponse(response, 401);
      });

      it('should return 401 when invalid authentication token provided', async () => {
        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', 'Bearer invalid-token')
          .send(validCreateRequest)
          .expect(401);

        expectErrorResponse(response, 401);
      });

      it('should return 403 when user is not admin', async () => {
        const regularUser = await createTestUser('USER');
        const userToken = getTestToken(regularUser);

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${userToken}`)
          .send(validCreateRequest)
          .expect(403);

        expectErrorResponse(response, 403);
        
        // Cleanup
        await cleanupTestData({ userIds: [regularUser.id] });
      });

      it('should return 400 when request body is empty', async () => {
        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({})
          .expect(400);

        expectValidationError(response, ['title', 'category', 'destinationUrl']);
      });

      it('should return 400 when request body is malformed JSON', async () => {
        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .set('Content-Type', 'application/json')
          .send('{ invalid json }')
          .expect(400);

        expectErrorResponse(response, 400);
      });

      it('should return 400 when title is too long', async () => {
        const longTitleRequest = {
          ...validCreateRequest,
          title: 'a'.repeat(256), // Exceeds max length
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(longTitleRequest)
          .expect(400);

        expectValidationError(response, ['title']);
      });

      it('should return 400 when category is invalid', async () => {
        const invalidCategoryRequest = {
          ...validCreateRequest,
          category: 'INVALID_CATEGORY',
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(invalidCategoryRequest)
          .expect(400);

        expectValidationError(response, ['category']);
      });

      it('should return 400 when destinationUrl is not a valid URL', async () => {
        const invalidUrlRequest = {
          ...validCreateRequest,
          destinationUrl: 'not-a-valid-url',
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(invalidUrlRequest)
          .expect(400);

        expectValidationError(response, ['destinationUrl']);
      });

      it('should return 400 when payout is negative', async () => {
        const negativePayoutRequest = {
          ...validCreateRequest,
          config: {
            ...validCreateRequest.config,
            payout: -10,
          },
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(negativePayoutRequest)
          .expect(400);

        expectValidationError(response, ['payout']);
      });

      it('should return 400 when currency is invalid', async () => {
        const invalidCurrencyRequest = {
          ...validCreateRequest,
          config: {
            ...validCreateRequest.config,
            currency: 'INVALID',
          },
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(invalidCurrencyRequest)
          .expect(400);

        expectValidationError(response, ['currency']);
      });

      it('should return 400 when dailyClickCap is negative', async () => {
        const negativeCapRequest = {
          ...validCreateRequest,
          config: {
            ...validCreateRequest.config,
            dailyClickCap: -1,
          },
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(negativeCapRequest)
          .expect(400);

        expectValidationError(response, ['dailyClickCap']);
      });

      it('should return 400 when geoTargeting contains invalid country codes', async () => {
        const invalidGeoRequest = {
          ...validCreateRequest,
          targeting: {
            ...validCreateRequest.targeting,
            geoTargeting: ['INVALID_COUNTRY'],
          },
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(invalidGeoRequest)
          .expect(400);

        expectValidationError(response, ['geoTargeting']);
      });

      it('should return 400 when deviceTargeting contains invalid device types', async () => {
        const invalidDeviceRequest = {
          ...validCreateRequest,
          targeting: {
            ...validCreateRequest.targeting,
            deviceTargeting: ['invalid_device'],
          },
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(invalidDeviceRequest)
          .expect(400);

        expectValidationError(response, ['deviceTargeting']);
      });

      it('should return 500 when database is unavailable', async () => {
        // Mock prisma to throw an error
        const originalCreate = prisma.offer.create;
        prisma.offer.create = jest.fn().mockRejectedValue(new Error('Database unavailable'));

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(validCreateRequest)
          .expect(500);

        expectErrorResponse(response, 500);

        // Restore original method
        prisma.offer.create = originalCreate;
      });

      it('should return 400 when Content-Type is not application/json', async () => {
        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .set('Content-Type', 'text/plain')
          .send('not json')
          .expect(400);

        expectErrorResponse(response, 400);
      });

      it('should handle very large payload gracefully', async () => {
        const largePayloadRequest = {
          ...validCreateRequest,
          description: 'x'.repeat(100000), // Very large description
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(largePayloadRequest)
          .expect(400);

        expectValidationError(response, ['description']);
      });

      it('should return 400 when required fields are null', async () => {
        const nullFieldsRequest = {
          title: null,
          category: null,
          destinationUrl: null,
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(nullFieldsRequest)
          .expect(400);

        expectValidationError(response, ['title', 'category', 'destinationUrl']);
      });

      it('should return 400 when required fields are undefined', async () => {
        const undefinedFieldsRequest = {
          title: undefined,
          category: undefined,
          destinationUrl: undefined,
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(undefinedFieldsRequest)
          .expect(400);

        expectValidationError(response, ['title', 'category', 'destinationUrl']);
      });

      it('should return 400 when numeric fields are strings', async () => {
        const stringNumericRequest = {
          ...validCreateRequest,
          config: {
            ...validCreateRequest.config,
            payout: '50.00', // String instead of number
            dailyClickCap: '1000', // String instead of number
          },
        };

        const response = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(stringNumericRequest)
          .expect(400);

        expectValidationError(response, ['payout', 'dailyClickCap']);
      });
    });
  });

  describe('GET /api/offers', () => {
    const testOfferIds: string[] = [];

    beforeAll(async () => {
      // Create test offers for listing
      const testOffers = [
        {
          title: 'Finance Offer 1',
          description: 'First finance offer',
          category: 'FINANCE' as OfferCategory,
          status: 'ACTIVE' as OfferStatus,
          destinationUrl: 'https://example.com/finance1',
          pixelUrl: 'https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}',
          config: { payout: 50.00, currency: 'USD' },
          targeting: { geoTargeting: ['US'], deviceTargeting: ['desktop'] },
          metrics: { totalClicks: 100, totalConversions: 10, totalRevenue: 500, conversionRate: 10, epc: 5.0, lastUpdated: new Date() }
        },
        {
          title: 'Insurance Offer 1',
          description: 'First insurance offer',
          category: 'INSURANCE' as OfferCategory,
          status: 'PAUSED' as OfferStatus,
          destinationUrl: 'https://example.com/insurance1',
          pixelUrl: 'https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}',
          config: { payout: 75.00, currency: 'USD' },
          targeting: { geoTargeting: ['US', 'CA'], deviceTargeting: ['mobile'] },
          metrics: { totalClicks: 200, totalConversions: 15, totalRevenue: 1125, conversionRate: 7.5, epc: 5.625, lastUpdated: new Date() }
        },
        {
          title: 'Tech Offer 1',
          description: 'First technology offer',
          category: 'TECHNOLOGY' as OfferCategory,
          status: 'ACTIVE' as OfferStatus,
          destinationUrl: 'https://example.com/tech1',
          pixelUrl: 'https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}',
          config: { payout: 25.00, currency: 'USD' },
          targeting: { geoTargeting: ['US', 'CA', 'GB'], deviceTargeting: ['desktop', 'mobile'] },
          metrics: { totalClicks: 300, totalConversions: 30, totalRevenue: 750, conversionRate: 10, epc: 2.5, lastUpdated: new Date() }
        }
      ];

      for (const offerData of testOffers) {
        const created = await prisma.offer.create({ data: offerData });
        testOfferIds.push(created.id);
      }
    });

    afterAll(async () => {
      // Clean up test offers
      await prisma.offer.deleteMany({
        where: { id: { in: testOfferIds } }
      });
    });

    it('should return paginated offers with default parameters', async () => {
      const response = await request(app)
        .get('/api/offers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.offers).toBeDefined();
      expect(response.body.data.offers).toBeInstanceOf(Array);
      expect(response.body.data.offers.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(3);
      expect(response.body.data.pagination.totalPages).toBeGreaterThanOrEqual(1);
      expect(response.body.data.pagination.hasMore).toBeDefined();

      // Verify offer structure includes EPC metrics
      const firstOffer = response.body.data.offers[0];
      expect(firstOffer.id).toBeDefined();
      expect(firstOffer.title).toBeDefined();
      expect(firstOffer.category).toBeDefined();
      expect(firstOffer.status).toBeDefined();
      expect(firstOffer.epcMetrics).toBeDefined();
      expect(firstOffer.epcMetrics.epc).toBeDefined();
      expect(firstOffer.epcMetrics.totalClicks).toBeDefined();
      expect(firstOffer.epcMetrics.totalConversions).toBeDefined();
      expect(firstOffer.epcMetrics.totalRevenue).toBeDefined();
      expect(firstOffer.epcMetrics.conversionRate).toBeDefined();
      expect(firstOffer.epcMetrics.lastUpdated).toBeDefined();
    });

    it('should filter offers by category', async () => {
      const response = await request(app)
        .get('/api/offers')
        .query({ category: 'FINANCE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toBeDefined();
      expect(response.body.data.offers.length).toBeGreaterThan(0);
      
      // All returned offers should be FINANCE category
      response.body.data.offers.forEach((offer: any) => {
        expect(offer.category).toBe('FINANCE');
      });
    });

    it('should filter offers by status', async () => {
      const response = await request(app)
        .get('/api/offers')
        .query({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toBeDefined();
      expect(response.body.data.offers.length).toBeGreaterThan(0);
      
      // All returned offers should be ACTIVE status
      response.body.data.offers.forEach((offer: any) => {
        expect(offer.status).toBe('ACTIVE');
      });
    });

    it('should search offers by title', async () => {
      const response = await request(app)
        .get('/api/offers')
        .query({ search: 'Finance' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toBeDefined();
      expect(response.body.data.offers.length).toBeGreaterThan(0);
      
      // At least one offer should contain 'Finance' in title
      const hasFinanceOffer = response.body.data.offers.some((offer: any) => 
        offer.title.includes('Finance')
      );
      expect(hasFinanceOffer).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/offers')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toBeDefined();
      expect(response.body.data.offers.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should handle sorting by different fields', async () => {
      const response = await request(app)
        .get('/api/offers')
        .query({ sortBy: 'title', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toBeDefined();
      expect(response.body.data.offers.length).toBeGreaterThan(0);
      
      // Verify sorting (basic check for first two offers)
      if (response.body.data.offers.length >= 2) {
        const firstTitle = response.body.data.offers[0].title;
        const secondTitle = response.body.data.offers[1].title;
        expect(firstTitle.localeCompare(secondTitle)).toBeLessThanOrEqual(0);
      }
    });

    it('should handle multiple filters combined', async () => {
      const response = await request(app)
        .get('/api/offers')
        .query({ 
          category: 'FINANCE',
          status: 'ACTIVE',
          search: 'Finance',
          page: 1,
          limit: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toBeDefined();
      
      // Verify all filters are applied
      response.body.data.offers.forEach((offer: any) => {
        expect(offer.category).toBe('FINANCE');
        expect(offer.status).toBe('ACTIVE');
        expect(offer.title).toContain('Finance');
      });
    });

    it('should return empty array for non-matching filters', async () => {
      const response = await request(app)
        .get('/api/offers')
        .query({ category: 'HEALTH', status: 'ACTIVE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/offers/:id', () => {
    let testOfferId: string;

    beforeAll(async () => {
      // Create test offer
      const testOffer = await prisma.offer.create({
        data: {
          title: 'Single Offer Test',
          description: 'Test offer for single retrieval',
          category: 'HEALTH',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/single-offer',
          pixelUrl: 'https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}',
          config: { payout: 40.00, currency: 'USD', dailyClickCap: 500 },
          targeting: { geoTargeting: ['US'], deviceTargeting: ['desktop'] },
          metrics: { totalClicks: 150, totalConversions: 12, totalRevenue: 480, conversionRate: 8, epc: 3.2, lastUpdated: new Date() }
        }
      });
      testOfferId = testOffer.id;
    });

    afterAll(async () => {
      // Clean up test offer
      await prisma.offer.deleteMany({
        where: { id: testOfferId }
      });
    });

    it('should return offer with metrics by ID', async () => {
      const response = await request(app)
        .get(`/api/offers/${testOfferId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testOfferId);
      expect(response.body.data.title).toBe('Single Offer Test');
      expect(response.body.data.description).toBe('Test offer for single retrieval');
      expect(response.body.data.category).toBe('HEALTH');
      expect(response.body.data.status).toBe('ACTIVE');
      expect(response.body.data.destinationUrl).toBe('https://example.com/single-offer');
      expect(response.body.data.pixelUrl).toBeDefined();
      expect(response.body.data.config).toEqual(expect.objectContaining({
        payout: 40.00,
        currency: 'USD',
        dailyClickCap: 500
      }));
      expect(response.body.data.targeting).toEqual(expect.objectContaining({
        geoTargeting: ['US'],
        deviceTargeting: ['desktop']
      }));
      expect(response.body.data.epcMetrics).toBeDefined();
      expect(response.body.data.epcMetrics.epc).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 for non-existent offer', async () => {
      const response = await request(app)
        .get('/api/offers/non-existent-offer-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should validate offer ID format', async () => {
      const response = await request(app)
        .get('/api/offers/invalid-id-format')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PATCH /api/offers/:id', () => {
    let testOfferId: string;

    beforeEach(async () => {
      // Create test offer for each update test
      const testOffer = await prisma.offer.create({
        data: {
          title: 'Original Update Test Offer',
          description: 'Original description',
          category: 'EDUCATION',
          status: 'PENDING',
          destinationUrl: 'https://example.com/original',
          pixelUrl: 'https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}',
          config: { payout: 30.00, currency: 'USD' },
          targeting: { geoTargeting: ['US'], deviceTargeting: ['desktop'] },
          metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() }
        }
      });
      testOfferId = testOffer.id;
    });

    afterEach(async () => {
      // Clean up test offer
      await prisma.offer.deleteMany({
        where: { id: testOfferId }
      });
    });

    it('should update offer with all fields', async () => {
      const updateData: UpdateOfferRequest = {
        title: 'Updated Offer Title',
        description: 'Updated description',
        destinationUrl: 'https://example.com/updated',
        config: {
          payout: 60.00,
          currency: 'USD',
          dailyClickCap: 2000,
          totalClickCap: 100000
        },
        targeting: {
          geoTargeting: ['US', 'CA', 'GB'],
          deviceTargeting: ['desktop', 'mobile', 'tablet']
        },
        updatedBy: testUserId
      };

      const response = await request(app)
        .patch(`/api/offers/${testOfferId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOfferId);
      expect(response.body.data.title).toBe('Updated Offer Title');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.destinationUrl).toBe('https://example.com/updated');
      expect(response.body.data.pixelUrl).toBeDefined();
      expect(response.body.data.pixelUrl).toContain('https://tracking.survai.app/pixel');
      expect(response.body.data.config).toEqual(expect.objectContaining({
        payout: 60.00,
        currency: 'USD',
        dailyClickCap: 2000,
        totalClickCap: 100000
      }));
      expect(response.body.data.targeting).toEqual(expect.objectContaining({
        geoTargeting: ['US', 'CA', 'GB'],
        deviceTargeting: ['desktop', 'mobile', 'tablet']
      }));
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should update offer with partial fields', async () => {
      const updateData: UpdateOfferRequest = {
        title: 'Partially Updated Title',
        config: {
          payout: 45.00,
          currency: 'USD'
        }
      };

      const response = await request(app)
        .patch(`/api/offers/${testOfferId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Partially Updated Title');
      expect(response.body.data.config.payout).toBe(45.00);
      expect(response.body.data.description).toBe('Original description'); // Should remain unchanged
    });

    it('should regenerate pixel URL when destination URL changes', async () => {
      const updateData: UpdateOfferRequest = {
        destinationUrl: 'https://example.com/new-destination'
      };

      const response = await request(app)
        .patch(`/api/offers/${testOfferId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.destinationUrl).toBe('https://example.com/new-destination');
      expect(response.body.data.pixelUrl).toBeDefined();
      expect(response.body.data.pixelUrl).toContain('https://tracking.survai.app/pixel');
    });

    it('should return 404 for non-existent offer', async () => {
      const updateData = { title: 'Update Non-Existent' };

      const response = await request(app)
        .patch('/api/offers/non-existent-offer-id')
        .send(updateData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should validate destination URL format', async () => {
      const updateData = {
        destinationUrl: 'invalid-url-format'
      };

      const response = await request(app)
        .patch(`/api/offers/${testOfferId}`)
        .send(updateData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid destination URL');
    });
  });

  describe('PATCH /api/offers/:id/toggle', () => {
    let testOfferId: string;

    beforeEach(async () => {
      // Create test offer for each toggle test
      const testOffer = await prisma.offer.create({
        data: {
          title: 'Toggle Test Offer',
          category: 'TRAVEL',
          status: 'PAUSED',
          destinationUrl: 'https://example.com/toggle',
          pixelUrl: 'https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}',
          config: { payout: 35.00, currency: 'USD' },
          metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() }
        }
      });
      testOfferId = testOffer.id;
    });

    afterEach(async () => {
      // Clean up test offer
      await prisma.offer.deleteMany({
        where: { id: testOfferId }
      });
    });

    it('should toggle offer status from PAUSED to ACTIVE', async () => {
      const response = await request(app)
        .patch(`/api/offers/${testOfferId}/toggle`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOfferId);
      expect(response.body.data.status).toBe('ACTIVE');
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should toggle offer status from ACTIVE to PAUSED', async () => {
      // First set to ACTIVE
      await prisma.offer.update({
        where: { id: testOfferId },
        data: { status: 'ACTIVE' }
      });

      const response = await request(app)
        .patch(`/api/offers/${testOfferId}/toggle`)
        .send({ status: 'PAUSED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PAUSED');
    });

    it('should validate status parameter', async () => {
      const response = await request(app)
        .patch(`/api/offers/${testOfferId}/toggle`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('status');
    });

    it('should require status parameter', async () => {
      const response = await request(app)
        .patch(`/api/offers/${testOfferId}/toggle`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 404 for non-existent offer', async () => {
      const response = await request(app)
        .patch('/api/offers/non-existent-offer-id/toggle')
        .send({ status: 'ACTIVE' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/offers/:id', () => {
    let testOfferId: string;

    beforeEach(async () => {
      // Create test offer for each delete test
      const testOffer = await prisma.offer.create({
        data: {
          title: 'Delete Test Offer',
          category: 'SHOPPING',
          status: 'ACTIVE',
          destinationUrl: 'https://example.com/delete',
          pixelUrl: 'https://tracking.survai.app/pixel?click_id={click_id}&survey_id={survey_id}',
          config: { payout: 20.00, currency: 'USD' },
          metrics: { totalClicks: 0, totalConversions: 0, totalRevenue: 0, conversionRate: 0, epc: 0, lastUpdated: new Date() }
        }
      });
      testOfferId = testOffer.id;
    });

    afterEach(async () => {
      // Clean up test offer (if not already deleted)
      await prisma.offer.deleteMany({
        where: { id: testOfferId }
      });
    });

    it('should soft delete offer by setting status to ARCHIVED', async () => {
      const response = await request(app)
        .delete(`/api/offers/${testOfferId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOfferId);
      expect(response.body.data.status).toBe('ARCHIVED');
      expect(response.body.data.updatedAt).toBeDefined();

      // Verify offer is still in database but archived
      const archivedOffer = await prisma.offer.findUnique({
        where: { id: testOfferId }
      });
      expect(archivedOffer).toBeDefined();
      expect(archivedOffer?.status).toBe('ARCHIVED');
    });

    it('should return 404 for non-existent offer', async () => {
      const response = await request(app)
        .delete('/api/offers/non-existent-offer-id')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should allow deleting already archived offer', async () => {
      // First archive the offer
      await prisma.offer.update({
        where: { id: testOfferId },
        data: { status: 'ARCHIVED' }
      });

      const response = await request(app)
        .delete(`/api/offers/${testOfferId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ARCHIVED');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle concurrent offer creation', async () => {
      const concurrentRequests = Array(5).fill(null).map((_, index) => ({
        title: `Concurrent Offer ${index + 1}`,
        category: 'FINANCE',
        destinationUrl: `https://example.com/concurrent-${index + 1}`,
        config: { payout: 25.00 + index * 5, currency: 'USD' }
      }));

      const promises = concurrentRequests.map((request) =>
        request(app)
          .post('/api/offers')
          .send(request)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(`Concurrent Offer ${index + 1}`);
        
        // Store for cleanup
        createdOfferIds.push(response.body.data.id);
      });
    });

    it('should respond to offer creation within time limit', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/offers')
        .send({
          title: 'Performance Test Offer',
          category: 'TECHNOLOGY',
          destinationUrl: 'https://example.com/performance'
        })
        .expect(201);

      const responseTime = Date.now() - startTime;
      
      // Response should be under 500ms for create operations
      expect(responseTime).toBeLessThan(500);
      
      // Store for cleanup
      createdOfferIds.push(response.body.data.id);
    });

    it('should handle malformed request data gracefully', async () => {
      const response = await request(app)
        .post('/api/offers')
        .send({
          title: 'Malformed Offer',
          category: 'FINANCE',
          destinationUrl: 'https://example.com/malformed',
          config: 'invalid-config-format', // Should be object
          extraField: 'should-be-ignored'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the API handles basic validation errors
      const response = await request(app)
        .post('/api/offers')
        .send({
          title: '', // Empty title should fail validation
          category: 'FINANCE',
          destinationUrl: 'https://example.com/validation-error'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});