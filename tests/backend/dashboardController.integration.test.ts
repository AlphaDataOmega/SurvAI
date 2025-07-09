/**
 * @fileoverview Integration tests for DashboardController
 * 
 * Integration tests for dashboard API endpoints with real database
 * integration and performance validation requirements.
 */

import request from 'supertest';
import app from '../../backend/src/app';
import { PrismaClient } from '@prisma/client';
import { authService } from '../../backend/src/services/authService';
import type { UserRole } from '@survai/shared';

const prisma = new PrismaClient();

describe('DashboardController Integration', () => {
  let testUserId: string;
  let testSurveyId: string;
  let testQuestionId: string;
  let testOfferId: string;
  let adminAuthCookie: string;

  beforeAll(async () => {
    // Create test admin user
    const testAdmin = {
      email: 'dashboard-admin@test.com',
      password: 'testpassword123',
      name: 'Dashboard Test Admin',
      role: 'ADMIN' as UserRole
    };

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
    testUserId = user.id;

    // Generate admin auth token
    const adminToken = authService.generateJWT({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    adminAuthCookie = `accessToken=${adminToken}`;

    // Create test survey
    const testSurvey = await prisma.survey.create({
      data: {
        title: 'Dashboard Test Survey',
        description: 'Integration test survey for dashboard',
        status: 'ACTIVE',
        config: {},
        createdBy: testUserId
      },
    });
    testSurveyId = testSurvey.id;

    // Create test question
    const testQuestion = await prisma.question.create({
      data: {
        surveyId: testSurveyId,
        type: 'CTA_OFFER',
        text: 'Dashboard test question?',
        description: 'Test question for dashboard metrics',
        config: { maxButtons: 3 },
        options: [],
        order: 1,
        required: false,
        createdBy: testUserId
      },
    });
    testQuestionId = testQuestion.id;

    // Create test offer
    const testOffer = await prisma.offer.create({
      data: {
        title: 'Dashboard Test Offer',
        description: 'Test offer for dashboard metrics',
        category: 'FINANCE',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/offer',
        pixelUrl: 'https://example.com/pixel?click_id={click_id}',
        config: {
          payout: 25.0,
          currency: 'USD',
          dailyClickCap: 1000,
          totalClickCap: 10000
        },
        targeting: {},
        metrics: {},
        createdBy: testUserId
      },
    });
    testOfferId = testOffer.id;

    // Create test survey response
    const testResponse = await prisma.surveyResponse.create({
      data: {
        surveyId: testSurveyId,
        sessionData: {
          sessionId: 'dashboard-test-session',
          clickId: 'dashboard-test-click-123',
          ipAddress: '192.168.1.100',
          userAgent: 'Test Browser for Dashboard'
        },
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      }
    });

    // Create test click tracks with various scenarios
    const clickTracksData = [
      // High performing clicks (converted)
      {
        offerId: testOfferId,
        responseId: testResponse.id,
        clickId: 'dashboard-click-1',
        sessionData: { sessionId: 'session-1', clickId: 'dashboard-click-1' },
        status: 'VALID',
        converted: true,
        convertedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        revenue: 25.0,
        clickedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        metadata: { questionId: testQuestionId }
      },
      {
        offerId: testOfferId,
        responseId: testResponse.id,
        clickId: 'dashboard-click-2',
        sessionData: { sessionId: 'session-2', clickId: 'dashboard-click-2' },
        status: 'VALID',
        converted: true,
        convertedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        revenue: 30.0,
        clickedAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
        metadata: { questionId: testQuestionId }
      },
      // Non-converted clicks
      {
        offerId: testOfferId,
        responseId: testResponse.id,
        clickId: 'dashboard-click-3',
        sessionData: { sessionId: 'session-3', clickId: 'dashboard-click-3' },
        status: 'VALID',
        converted: false,
        convertedAt: null,
        revenue: null,
        clickedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        metadata: { questionId: testQuestionId }
      },
      {
        offerId: testOfferId,
        responseId: testResponse.id,
        clickId: 'dashboard-click-4',
        sessionData: { sessionId: 'session-4', clickId: 'dashboard-click-4' },
        status: 'VALID',
        converted: false,
        convertedAt: null,
        revenue: null,
        clickedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        metadata: { questionId: testQuestionId }
      }
    ];

    // Create click tracks in batch
    for (const clickData of clickTracksData) {
      await prisma.clickTrack.create({ data: clickData });
    }

    // Create question answer
    await prisma.questionAnswer.create({
      data: {
        responseId: testResponse.id,
        questionId: testQuestionId,
        value: { selectedOfferId: testOfferId },
        timeToAnswer: 5000,
        answeredAt: new Date(Date.now() - 90 * 60 * 1000)
      }
    });
  });

  afterAll(async () => {
    // Clean up test data in reverse order of dependencies
    await prisma.questionAnswer.deleteMany({
      where: { questionId: testQuestionId }
    });
    await prisma.clickTrack.deleteMany({
      where: { offerId: testOfferId }
    });
    await prisma.surveyResponse.deleteMany({
      where: { surveyId: testSurveyId }
    });
    await prisma.question.deleteMany({
      where: { id: testQuestionId }
    });
    await prisma.offer.deleteMany({
      where: { id: testOfferId }
    });
    await prisma.survey.deleteMany({
      where: { id: testSurveyId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
    
    await prisma.$disconnect();
  });

  describe('GET /api/dashboard/metrics - Performance and Integration', () => {
    it('should return dashboard metrics within 200ms performance requirement', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard/metrics?timeRange=last24h')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // CRITICAL: Performance requirement from PRP - <200ms for 10k records
      expect(responseTime).toBeLessThan(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.offerMetrics).toBeDefined();
      expect(response.body.data.questionMetrics).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.timestamp).toBeDefined();

      console.log(`Dashboard metrics response time: ${responseTime}ms`);
    });

    it('should calculate correct EPC metrics from real data', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics?timeRange=last24h')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const { offerMetrics, summary } = response.body.data;
      
      // Verify offer metrics calculation
      expect(offerMetrics).toHaveLength(1);
      const offer = offerMetrics[0];
      
      expect(offer.offerId).toBe(testOfferId);
      expect(offer.title).toBe('Dashboard Test Offer');
      expect(offer.totalClicks).toBe(4); // 4 click tracks created
      expect(offer.totalConversions).toBe(2); // 2 converted clicks
      expect(offer.totalRevenue).toBe(55.0); // 25.0 + 30.0
      expect(offer.epc).toBe(13.75); // 55.0 / 4
      expect(offer.conversionRate).toBe(50.0); // 2/4 * 100
      expect(offer.rank).toBe(1);

      // Verify summary statistics
      expect(summary.totalOffers).toBe(1);
      expect(summary.totalClicks).toBe(4);
      expect(summary.totalConversions).toBe(2);
      expect(summary.totalRevenue).toBe(55.0);
      expect(summary.averageEPC).toBe(13.75);
      expect(summary.topPerformingOffer).toBeDefined();
      expect(summary.topPerformingOffer.offerId).toBe(testOfferId);
    });

    it('should filter metrics by time range correctly', async () => {
      // Test different time ranges
      const timeRanges = ['last24h', 'last7d', 'last30d'];
      
      for (const timeRange of timeRanges) {
        const response = await request(app)
          .get(`/api/dashboard/metrics?timeRange=${timeRange}`)
          .set('Cookie', adminAuthCookie)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.timeRange.range).toBeDefined();
        
        // All our test data is within the last 24 hours, so all should return same results
        if (timeRange === 'last24h') {
          expect(response.body.data.summary.totalClicks).toBe(4);
        }
      }
    });

    it('should handle minimum EPC filtering', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics?timeRange=last24h&minEPC=10.0')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const { offerMetrics } = response.body.data;
      
      // Our test offer has EPC of 13.75, so it should be included
      expect(offerMetrics).toHaveLength(1);
      expect(offerMetrics[0].epc).toBeGreaterThanOrEqual(10.0);

      // Test with higher threshold
      const highThresholdResponse = await request(app)
        .get('/api/dashboard/metrics?timeRange=last24h&minEPC=20.0')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const { offerMetrics: filteredOffers } = highThresholdResponse.body.data;
      
      // Should filter out our offer since 13.75 < 20.0
      expect(filteredOffers).toHaveLength(0);
    });

    it('should require admin authentication for access', async () => {
      // Test without authentication
      await request(app)
        .get('/api/dashboard/metrics')
        .expect(401);

      // Test with invalid token
      await request(app)
        .get('/api/dashboard/metrics')
        .set('Cookie', 'accessToken=invalid-token')
        .expect(401);
    });
  });

  describe('Dashboard endpoint performance under load', () => {
    it('should maintain performance with concurrent requests', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(null).map(() => {
        const startTime = Date.now();
        return request(app)
          .get('/api/dashboard/metrics?timeRange=last7d')
          .set('Cookie', adminAuthCookie)
          .then(response => {
            const responseTime = Date.now() - startTime;
            return { response, responseTime };
          });
      });

      const results = await Promise.all(requests);

      // All requests should succeed
      results.forEach(({ response }) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Average response time should still be under 200ms
      const avgResponseTime = results.reduce((sum, { responseTime }) => sum + responseTime, 0) / results.length;
      expect(avgResponseTime).toBeLessThan(200);

      console.log(`Average response time for ${concurrentRequests} concurrent requests: ${avgResponseTime.toFixed(2)}ms`);
    });
  });

  describe('Individual endpoint testing', () => {
    it('should return offer metrics only via /offers endpoint', async () => {
      const response = await request(app)
        .get('/api/dashboard/offers?timeRange=last24h')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('offerId');
      expect(response.body.data[0]).toHaveProperty('epc');
    });

    it('should return question metrics only via /questions endpoint', async () => {
      const response = await request(app)
        .get('/api/dashboard/questions?timeRange=last24h')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('questionId');
      expect(response.body.data[0]).toHaveProperty('averageEPC');
    });

    it('should return summary only via /summary endpoint', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary?timeRange=last24h')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.data).toHaveProperty('totalOffers');
      expect(response.body.data).toHaveProperty('totalClicks');
      expect(response.body.data).toHaveProperty('averageEPC');
      expect(response.body.data).toHaveProperty('topPerformingOffer');
    });

    it('should return healthy status via /health endpoint', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard/health')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const actualResponseTime = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.responseTime).toBeDefined();
      expect(typeof response.body.data.responseTime).toBe('number');
      
      // Health check should also be fast
      expect(actualResponseTime).toBeLessThan(200);
    });
  });
});