/**
 * @fileoverview Dashboard controller tests
 * 
 * Unit tests for the DashboardController covering metrics endpoints,
 * admin authentication requirements, and error handling.
 */

import request from 'supertest';
import app, { prisma } from '../../backend/src/app';
import { authService } from '../../backend/src/services/authService';
import type { UserRole } from '@survai/shared';

// Mock dashboard service
jest.mock('../../backend/src/services/dashboardService');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';

describe('DashboardController', () => {
  // Test admin user
  const testAdmin = {
    email: 'admin@example.com',
    password: 'adminpassword123',
    name: 'Test Admin',
    role: 'ADMIN' as UserRole
  };

  let adminAuthCookie: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await authService.hashPassword(testAdmin.password);
    const user = await prisma.user.create({
      data: {
        email: testAdmin.email,
        name: testAdmin.name,
        passwordHash: hashedPassword,
        role: testAdmin.role,
        status: 'ACTIVE'
      }
    });
    adminUserId = user.id;

    // Generate admin auth token
    const adminToken = authService.generateJWT({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    adminAuthCookie = `accessToken=${adminToken}`;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testAdmin.email }
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/metrics', () => {
    it('should return dashboard metrics for authenticated admin', async () => {
      // Mock dashboard service response
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockResolvedValue({
        offerMetrics: [
          {
            offerId: 'offer-1',
            title: 'Test Offer',
            rank: 1,
            totalClicks: 100,
            totalConversions: 15,
            totalRevenue: 375.50,
            epc: 3.755,
            conversionRate: 15.0,
            lastUpdated: new Date()
          }
        ],
        questionMetrics: [
          {
            questionId: 'question-1',
            text: 'Test Question',
            impressions: 50,
            buttonClicks: 45,
            skips: 5,
            skipRate: 10.0,
            clickThroughRate: 90.0,
            averageEPC: 2.5
          }
        ],
        timeRange: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          range: 'last7days'
        },
        summary: {
          totalOffers: 1,
          totalClicks: 100,
          totalConversions: 15,
          totalRevenue: 375.50,
          averageEPC: 3.755,
          topPerformingOffer: null
        }
      });

      const response = await request(app)
        .get('/api/dashboard/metrics')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.offerMetrics).toHaveLength(1);
      expect(response.body.data.questionMetrics).toHaveLength(1);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      
      expect(mockDashboardService.dashboardService.getDashboardMetrics).toHaveBeenCalledWith({
        timeRange: 'last7d',
        offerIds: undefined,
        minEPC: undefined
      });
    });

    it('should handle query parameters correctly', async () => {
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockResolvedValue({
        offerMetrics: [],
        questionMetrics: [],
        timeRange: { startDate: new Date(), endDate: new Date(), range: 'today' },
        summary: {
          totalOffers: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          averageEPC: 0,
          topPerformingOffer: null
        }
      });

      await request(app)
        .get('/api/dashboard/metrics?timeRange=last24h&offerIds=offer-1,offer-2&minEPC=2.5')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(mockDashboardService.dashboardService.getDashboardMetrics).toHaveBeenCalledWith({
        timeRange: 'last24h',
        offerIds: ['offer-1', 'offer-2'],
        minEPC: 2.5
      });
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('authentication');
    });

    it('should handle service errors gracefully', async () => {
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/dashboard/metrics')
        .set('Cookie', adminAuthCookie)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should validate invalid time range parameters', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics?timeRange=invalid')
        .set('Cookie', adminAuthCookie)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation failed');
    });
  });

  describe('GET /api/dashboard/offers', () => {
    it('should return offer metrics only', async () => {
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockResolvedValue({
        offerMetrics: [
          {
            offerId: 'offer-1',
            title: 'Test Offer',
            rank: 1,
            totalClicks: 100,
            totalConversions: 15,
            totalRevenue: 375.50,
            epc: 3.755,
            conversionRate: 15.0,
            lastUpdated: new Date()
          }
        ],
        questionMetrics: [],
        timeRange: { startDate: new Date(), endDate: new Date(), range: 'last7days' },
        summary: {
          totalOffers: 1,
          totalClicks: 100,
          totalConversions: 15,
          totalRevenue: 375.50,
          averageEPC: 3.755,
          topPerformingOffer: null
        }
      });

      const response = await request(app)
        .get('/api/dashboard/offers')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].offerId).toBe('offer-1');
    });

    it('should require admin authentication', async () => {
      await request(app)
        .get('/api/dashboard/offers')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/questions', () => {
    it('should return question metrics only', async () => {
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockResolvedValue({
        offerMetrics: [],
        questionMetrics: [
          {
            questionId: 'question-1',
            text: 'Test Question',
            impressions: 50,
            buttonClicks: 45,
            skips: 5,
            skipRate: 10.0,
            clickThroughRate: 90.0,
            averageEPC: 2.5
          }
        ],
        timeRange: { startDate: new Date(), endDate: new Date(), range: 'last7days' },
        summary: {
          totalOffers: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          averageEPC: 0,
          topPerformingOffer: null
        }
      });

      const response = await request(app)
        .get('/api/dashboard/questions')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].questionId).toBe('question-1');
    });

    it('should require admin authentication', async () => {
      await request(app)
        .get('/api/dashboard/questions')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/summary', () => {
    it('should return summary statistics only', async () => {
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockResolvedValue({
        offerMetrics: [],
        questionMetrics: [],
        timeRange: { startDate: new Date(), endDate: new Date(), range: 'last7days' },
        summary: {
          totalOffers: 5,
          totalClicks: 500,
          totalConversions: 75,
          totalRevenue: 1875.0,
          averageEPC: 3.75,
          topPerformingOffer: {
            offerId: 'offer-1',
            title: 'Top Offer',
            rank: 1,
            totalClicks: 100,
            totalConversions: 20,
            totalRevenue: 500.0,
            epc: 5.0,
            conversionRate: 20.0,
            lastUpdated: new Date()
          }
        }
      });

      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalOffers).toBe(5);
      expect(response.body.data.totalClicks).toBe(500);
      expect(response.body.data.averageEPC).toBe(3.75);
      expect(response.body.data.topPerformingOffer).toBeDefined();
    });

    it('should require admin authentication', async () => {
      await request(app)
        .get('/api/dashboard/summary')
        .expect(401);
    });
  });

  describe('GET /api/dashboard/health', () => {
    it('should return health status for admin', async () => {
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockResolvedValue({
        offerMetrics: [],
        questionMetrics: [],
        timeRange: { startDate: new Date(), endDate: new Date(), range: 'today' },
        summary: {
          totalOffers: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          averageEPC: 0,
          topPerformingOffer: null
        }
      });

      const response = await request(app)
        .get('/api/dashboard/health')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.responseTime).toBeDefined();
      expect(typeof response.body.data.responseTime).toBe('number');
    });

    it('should require admin authentication', async () => {
      await request(app)
        .get('/api/dashboard/health')
        .expect(401);
    });

    it('should handle service errors in health check', async () => {
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .get('/api/dashboard/health')
        .set('Cookie', adminAuthCookie)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('parameter validation', () => {
    it('should accept valid timeRange values', async () => {
      const mockDashboardService = jest.requireMock('../../backend/src/services/dashboardService');
      mockDashboardService.dashboardService.getDashboardMetrics.mockResolvedValue({
        offerMetrics: [],
        questionMetrics: [],
        timeRange: { startDate: new Date(), endDate: new Date(), range: 'today' },
        summary: {
          totalOffers: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          averageEPC: 0,
          topPerformingOffer: null
        }
      });

      for (const timeRange of ['last24h', 'last7d', 'last30d']) {
        await request(app)
          .get(`/api/dashboard/metrics?timeRange=${timeRange}`)
          .set('Cookie', adminAuthCookie)
          .expect(200);
      }
    });

    it('should reject invalid minEPC values', async () => {
      await request(app)
        .get('/api/dashboard/metrics?minEPC=-1')
        .set('Cookie', adminAuthCookie)
        .expect(400);

      await request(app)
        .get('/api/dashboard/metrics?minEPC=invalid')
        .set('Cookie', adminAuthCookie)
        .expect(400);
    });
  });
});