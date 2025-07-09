/**
 * @fileoverview Integration tests for TrackingController
 * 
 * Tests for tracking API endpoints with database integration
 * for the CTA click tracking system.
 */

import request from 'supertest';
import app from '../../backend/src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('TrackingController Integration', () => {
  let testSurveyId: string;
  let testQuestionId: string;
  let testOfferId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Set up test data
    testSessionId = 'test-tracking-session-123';

    const testSurvey = await prisma.survey.create({
      data: {
        title: 'Test Tracking Survey',
        description: 'Integration test survey for tracking',
        status: 'ACTIVE',
        config: {},
      },
    });
    testSurveyId = testSurvey.id;

    const testQuestion = await prisma.question.create({
      data: {
        surveyId: testSurveyId,
        type: 'CTA_OFFER',
        text: 'Which service interests you most?',
        description: 'Select your preferred service type',
        config: { maxButtons: 3 },
        options: [],
        order: 1,
        required: false,
      },
    });
    testQuestionId = testQuestion.id;

    const testOffer = await prisma.offer.create({
      data: {
        title: 'Premium Service Package',
        description: 'Get access to our premium features',
        category: 'TECHNOLOGY',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/premium?click_id={click_id}&survey_id={survey_id}&ref=test',
        pixelUrl: 'https://tracking.example.com/conversion',
        config: {
          payout: 50.00,
          currency: 'USD',
          dailyClickCap: 500,
        },
        metrics: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          epc: 0,
        },
      },
    });
    testOfferId = testOffer.id;

    // Create a survey response for testing
    await prisma.surveyResponse.create({
      data: {
        surveyId: testSurveyId,
        sessionData: {
          sessionId: testSessionId,
          clickId: 'test-click-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test Browser',
        },
        status: 'IN_PROGRESS',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.clickTrack.deleteMany({
      where: { offerId: testOfferId },
    });
    await prisma.surveyResponse.deleteMany({
      where: { surveyId: testSurveyId },
    });
    await prisma.question.deleteMany({
      where: { surveyId: testSurveyId },
    });
    await prisma.offer.deleteMany({
      where: { id: testOfferId },
    });
    await prisma.survey.deleteMany({
      where: { id: testSurveyId },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/track/click', () => {
    it('should track click and return redirect URL', async () => {
      const response = await request(app)
        .post('/api/track/click')
        .send({
          sessionId: testSessionId,
          questionId: testQuestionId,
          offerId: testOfferId,
          buttonVariantId: 'button-variant-123',
          timestamp: Date.now(),
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '192.168.1.1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.clickTrack).toBeDefined();
      expect(response.body.data.clickTrack.offerId).toBe(testOfferId);
      expect(response.body.data.clickTrack.status).toBe('VALID');
      expect(response.body.data.redirectUrl).toBeDefined();
      expect(response.body.data.redirectUrl).toContain('https://example.com/premium');
      expect(response.body.data.redirectUrl).toContain('click_id=');
      expect(response.body.data.redirectUrl).toContain('ref=test');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/track/click')
        .send({
          sessionId: testSessionId,
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should handle non-existent offer', async () => {
      const response = await request(app)
        .post('/api/track/click')
        .send({
          sessionId: testSessionId,
          questionId: testQuestionId,
          offerId: 'non-existent-offer',
          buttonVariantId: 'button-variant-123',
          timestamp: Date.now(),
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should track multiple clicks from same session', async () => {
      const baseRequest = {
        sessionId: testSessionId,
        questionId: testQuestionId,
        offerId: testOfferId,
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 Test Browser',
        ipAddress: '192.168.1.1',
      };

      // First click
      const response1 = await request(app)
        .post('/api/track/click')
        .send({
          ...baseRequest,
          buttonVariantId: 'button-variant-first',
        })
        .expect(200);

      // Second click
      const response2 = await request(app)
        .post('/api/track/click')
        .send({
          ...baseRequest,
          buttonVariantId: 'button-variant-second',
        })
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
      expect(response1.body.data.clickTrack.id).not.toBe(response2.body.data.clickTrack.id);
    });
  });

  describe('GET /api/track/conversion', () => {
    let testClickId: string;

    beforeEach(async () => {
      // Create a test click to convert
      const clickResponse = await request(app)
        .post('/api/track/click')
        .send({
          sessionId: testSessionId,
          questionId: testQuestionId,
          offerId: testOfferId,
          buttonVariantId: 'button-for-conversion',
          timestamp: Date.now(),
        });

      testClickId = clickResponse.body.data.clickTrack.session.clickId;
    });

    it('should record conversion with click ID', async () => {
      const response = await request(app)
        .get('/api/track/conversion')
        .query({
          click_id: testClickId,
          revenue: '25.50',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.converted).toBe(true);
    });

    it('should record conversion without revenue', async () => {
      const response = await request(app)
        .get('/api/track/conversion')
        .query({
          click_id: testClickId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.converted).toBe(true);
    });

    it('should validate click ID parameter', async () => {
      const response = await request(app)
        .get('/api/track/conversion')
        .query({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Click ID is required');
    });

    it('should handle non-existent click ID', async () => {
      const response = await request(app)
        .get('/api/track/conversion')
        .query({
          click_id: 'non-existent-click-id',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/track/conversion', () => {
    let testClickId: string;

    beforeEach(async () => {
      // Create a test click to convert
      const clickResponse = await request(app)
        .post('/api/track/click')
        .send({
          sessionId: testSessionId,
          questionId: testQuestionId,
          offerId: testOfferId,
          buttonVariantId: 'button-for-post-conversion',
          timestamp: Date.now(),
        });

      testClickId = clickResponse.body.data.clickTrack.session.clickId;
    });

    it('should handle POST conversion tracking', async () => {
      const response = await request(app)
        .post('/api/track/conversion')
        .send({
          click_id: testClickId,
          revenue: 35.75,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.converted).toBe(true);
    });
  });

  describe('GET /api/track/analytics', () => {
    beforeEach(async () => {
      // Create some test clicks for analytics
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/track/click')
          .send({
            sessionId: `${testSessionId}-analytics-${i}`,
            questionId: testQuestionId,
            offerId: testOfferId,
            buttonVariantId: `button-analytics-${i}`,
            timestamp: Date.now(),
          });
      }
    });

    it('should return overall analytics', async () => {
      const response = await request(app)
        .get('/api/track/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalClicks).toBeGreaterThanOrEqual(0);
      expect(response.body.data.conversions).toBeGreaterThanOrEqual(0);
      expect(response.body.data.conversionRate).toBeGreaterThanOrEqual(0);
      expect(response.body.data.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(response.body.data.epc).toBeGreaterThanOrEqual(0);
    });

    it('should return analytics filtered by offer', async () => {
      const response = await request(app)
        .get('/api/track/analytics')
        .query({ offerId: testOfferId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalClicks).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-existent offer filter', async () => {
      const response = await request(app)
        .get('/api/track/analytics')
        .query({ offerId: 'non-existent-offer' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalClicks).toBe(0);
    });
  });

  describe('POST /api/track/pixel', () => {
    it('should generate pixel URL', async () => {
      const response = await request(app)
        .post('/api/track/pixel')
        .send({
          clickId: 'test-click-pixel-123',
          surveyId: testSurveyId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pixelUrl).toBeDefined();
      expect(response.body.data.pixelUrl).toContain('click_id=test-click-pixel-123');
      expect(response.body.data.pixelUrl).toContain(`survey_id=${testSurveyId}`);
    });

    it('should validate required fields for pixel generation', async () => {
      const response = await request(app)
        .post('/api/track/pixel')
        .send({
          clickId: 'test-click-123',
          // Missing surveyId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-frequency click tracking', async () => {
      const promises = Array(10).fill(null).map((_, index) =>
        request(app)
          .post('/api/track/click')
          .send({
            sessionId: `${testSessionId}-load-test-${index}`,
            questionId: testQuestionId,
            offerId: testOfferId,
            buttonVariantId: `button-load-${index}`,
            timestamp: Date.now(),
          })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should respond to click tracking within time limit', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/track/click')
        .send({
          sessionId: `${testSessionId}-performance`,
          questionId: testQuestionId,
          offerId: testOfferId,
          buttonVariantId: 'button-performance',
          timestamp: Date.now(),
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Response should be under 200ms as specified in PRP
      expect(responseTime).toBeLessThan(200);
    });

    it('should handle malformed tracking data gracefully', async () => {
      const response = await request(app)
        .post('/api/track/click')
        .send({
          sessionId: testSessionId,
          questionId: testQuestionId,
          offerId: testOfferId,
          buttonVariantId: 'button-malformed',
          timestamp: 'invalid-timestamp',
          extraField: 'should-be-ignored',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});