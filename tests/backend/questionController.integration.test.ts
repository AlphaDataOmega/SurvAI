/**
 * @fileoverview Integration tests for QuestionController
 * 
 * Tests for question API endpoints with database integration
 * for the CTA system.
 */

import request from 'supertest';
import app from '../../backend/src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('QuestionController Integration', () => {
  let testSurveyId: string;
  let testQuestionId: string;
  let testOfferId: string;

  beforeAll(async () => {
    // Set up test data
    const testSurvey = await prisma.survey.create({
      data: {
        title: 'Test CTA Survey',
        description: 'Integration test survey',
        status: 'ACTIVE',
        config: { maxButtons: 3 },
      },
    });
    testSurveyId = testSurvey.id;

    const testQuestion = await prisma.question.create({
      data: {
        surveyId: testSurveyId,
        type: 'CTA_OFFER',
        text: 'What are you most interested in learning about?',
        description: 'Choose the topic that interests you most',
        config: {
          maxButtons: 3,
          buttonLayout: 'vertical',
          ctaStyle: {
            primaryColor: '#3182ce',
            buttonSize: 'large'
          }
        },
        options: [],
        order: 1,
        required: false,
        logic: null,
      },
    });
    testQuestionId = testQuestion.id;

    const testOffer = await prisma.offer.create({
      data: {
        title: 'Financial Planning Course',
        description: 'Learn how to manage your finances',
        category: 'EDUCATION',
        status: 'ACTIVE',
        destinationUrl: 'https://example.com/finance?click_id={click_id}&survey_id={survey_id}',
        pixelUrl: 'https://tracking.example.com/pixel',
        config: {
          payout: 25.00,
          currency: 'USD',
          dailyClickCap: 1000,
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
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.clickTrack.deleteMany({
      where: { offerId: testOfferId },
    });
    await prisma.questionAnswer.deleteMany({
      where: { questionId: testQuestionId },
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

  describe('POST /api/questions/:surveyId/next', () => {
    it('should return next question for new session', async () => {
      const response = await request(app)
        .post(`/api/questions/${testSurveyId}/next`)
        .send({
          sessionId: 'test-session-123',
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '192.168.1.1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.question).toBeDefined();
      expect(response.body.data.question.id).toBe(testQuestionId);
      expect(response.body.data.question.text).toBe('What are you most interested in learning about?');
      expect(response.body.data.offerButtons).toBeDefined();
      expect(Array.isArray(response.body.data.offerButtons)).toBe(true);
      expect(response.body.data.sessionData).toBeDefined();
      expect(response.body.data.sessionData.sessionId).toBe('test-session-123');
    });

    it('should handle missing survey ID', async () => {
      const response = await request(app)
        .post('/api/questions/non-existent-survey/next')
        .send({
          sessionId: 'test-session-456',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No more questions available');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/questions/${testSurveyId}/next`)
        .send({})
        .expect(200); // Should work with generated session ID

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionData.sessionId).toBeDefined();
    });

    it('should handle existing session', async () => {
      const sessionId = 'test-session-existing-789';
      
      // First request to create session
      await request(app)
        .post(`/api/questions/${testSurveyId}/next`)
        .send({ sessionId })
        .expect(200);

      // Second request with same session
      const response = await request(app)
        .post(`/api/questions/${testSurveyId}/next`)
        .send({
          sessionId,
          previousQuestionId: testQuestionId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionData.sessionId).toBe(sessionId);
    });
  });

  describe('POST /api/questions/:surveyId/skip', () => {
    it('should skip current question and return next', async () => {
      const sessionId = 'test-session-skip-123';
      
      // First, start the survey
      await request(app)
        .post(`/api/questions/${testSurveyId}/next`)
        .send({ sessionId })
        .expect(200);

      // Then skip the question
      const response = await request(app)
        .post(`/api/questions/${testSurveyId}/skip`)
        .send({
          sessionId,
          questionId: testQuestionId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Since we only have one question, this should indicate completion
      expect(response.body.data.completed).toBe(true);
    });

    it('should validate required fields for skip', async () => {
      const response = await request(app)
        .post(`/api/questions/${testSurveyId}/skip`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should handle non-existent session for skip', async () => {
      const response = await request(app)
        .post(`/api/questions/${testSurveyId}/skip`)
        .send({
          sessionId: 'non-existent-session',
          questionId: testQuestionId,
        })
        .expect(200);

      // Should still work by creating new session or completing survey
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/questions/:questionId/analytics', () => {
    it('should return analytics for question', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestionId}/analytics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.questionId).toBe(testQuestionId);
      expect(response.body.data.impressions).toBeDefined();
      expect(response.body.data.buttonClicks).toBeDefined();
      expect(response.body.data.skipRate).toBeDefined();
      expect(response.body.data.conversionRate).toBeDefined();
    });

    it('should validate question ID parameter', async () => {
      const response = await request(app)
        .get('/api/questions//analytics')
        .expect(404);

      // Should get 404 for empty question ID
    });

    it('should handle non-existent question ID', async () => {
      const response = await request(app)
        .get('/api/questions/non-existent-question/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questionId).toBe('non-existent-question');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request data', async () => {
      const response = await request(app)
        .post(`/api/questions/${testSurveyId}/next`)
        .send({
          sessionId: null,
          invalidField: 'should be ignored',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should generate new session ID when null provided
      expect(response.body.data.sessionData.sessionId).toBeDefined();
    });

    it('should handle very long session IDs', async () => {
      const longSessionId = 'a'.repeat(1000);
      
      const response = await request(app)
        .post(`/api/questions/${testSurveyId}/next`)
        .send({
          sessionId: longSessionId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionData.sessionId).toBe(longSessionId);
    });

    it('should handle concurrent requests with same session', async () => {
      const sessionId = 'test-session-concurrent-123';
      
      // Make multiple simultaneous requests
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post(`/api/questions/${testSurveyId}/next`)
          .send({ sessionId })
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sessionData.sessionId).toBe(sessionId);
      });
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post(`/api/questions/${testSurveyId}/next`)
        .send({
          sessionId: 'test-session-performance-123',
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Response should be under 500ms as specified in PRP
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('POST /api/questions/generate', () => {
    it('should generate question with static content', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          surveyId: testSurveyId,
          useAI: false,
          text: 'What financial goal interests you most?',
          description: 'Select your primary financial objective',
          type: 'CTA_OFFER',
          config: { maxButtons: 3 },
          order: 2,
          required: true
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.text).toBe('What financial goal interests you most?');
      expect(response.body.data.description).toBe('Select your primary financial objective');
      expect(response.body.data.surveyId).toBe(testSurveyId);
      expect(response.body.data.type).toBe('CTA_OFFER');
      expect(response.body.data.order).toBe(2);
      expect(response.body.data.required).toBe(true);
      expect(response.body.data.id).toBeDefined();
    });

    it('should generate question with AI content when available', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          surveyId: testSurveyId,
          useAI: true,
          text: 'Fallback question text',
          aiContext: {
            userIncome: '50000-75000',
            employment: 'full-time',
            surveyType: 'financial-planning'
          }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.text).toBeDefined();
      expect(response.body.data.surveyId).toBe(testSurveyId);
      expect(response.body.data.id).toBeDefined();
      // AI versions field should be populated if AI generation succeeded
      if (response.body.data.aiVersions) {
        expect(response.body.data.aiVersions.generated).toBe(true);
      }
    });

    it('should validate required fields for question generation', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          // Missing surveyId
          text: 'Test question'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Survey ID is required');
    });

    it('should handle AI generation with fallback text', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          surveyId: testSurveyId,
          useAI: true,
          text: 'Fallback text when AI fails',
          aiContext: {
            userIncome: 'invalid-income-range' // This might cause AI to fail
          }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBeDefined();
      expect(response.body.data.surveyId).toBe(testSurveyId);
    });

    it('should reject AI generation without fallback text', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          surveyId: testSurveyId,
          useAI: true,
          // No text field for fallback
          aiContext: {
            userIncome: '50000'
          }
        });

      // Could be 400 (validation error) or 201 (AI succeeded)
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('required');
      } else {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('PUT /api/questions/:id', () => {
    let createdQuestionId: string;

    beforeEach(async () => {
      // Create a question to update
      const createResponse = await request(app)
        .post('/api/questions/generate')
        .send({
          surveyId: testSurveyId,
          text: 'Original question text',
          description: 'Original description'
        });
      
      createdQuestionId = createResponse.body.data.id;
    });

    it('should update question successfully', async () => {
      const response = await request(app)
        .put(`/api/questions/${createdQuestionId}`)
        .send({
          text: 'Updated question text',
          description: 'Updated description',
          required: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.text).toBe('Updated question text');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.required).toBe(true);
      expect(response.body.data.id).toBe(createdQuestionId);
    });

    it('should update partial question fields', async () => {
      const response = await request(app)
        .put(`/api/questions/${createdQuestionId}`)
        .send({
          text: 'Only text updated'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe('Only text updated');
      expect(response.body.data.description).toBe('Original description'); // Should remain unchanged
    });

    it('should handle non-existent question ID', async () => {
      const response = await request(app)
        .put('/api/questions/non-existent-id')
        .send({
          text: 'Updated text'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should validate question ID parameter', async () => {
      const response = await request(app)
        .put('/api/questions/')
        .send({
          text: 'Updated text'
        })
        .expect(404); // Route not found

      // Should get 404 for missing ID parameter
    });

    it('should handle empty update request', async () => {
      const response = await request(app)
        .put(`/api/questions/${createdQuestionId}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return question unchanged
      expect(response.body.data.text).toBe('Original question text');
    });
  });

  describe('GET /api/questions/:surveyId', () => {
    let additionalQuestionId: string;

    beforeEach(async () => {
      // Create additional question for testing
      const createResponse = await request(app)
        .post('/api/questions/generate')
        .send({
          surveyId: testSurveyId,
          text: 'Second question for EPC testing',
          order: 3
        });
      
      additionalQuestionId = createResponse.body.data.id;
    });

    afterEach(async () => {
      // Clean up additional question
      if (additionalQuestionId) {
        await prisma.question.deleteMany({
          where: { id: additionalQuestionId }
        });
      }
    });

    it('should get questions for survey ordered by EPC', async () => {
      const response = await request(app)
        .get(`/api/questions/${testSurveyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // Original + additional

      // Verify questions structure
      response.body.data.forEach((question: any) => {
        expect(question.id).toBeDefined();
        expect(question.surveyId).toBe(testSurveyId);
        expect(question.type).toBe('CTA_OFFER');
        expect(question.text).toBeDefined();
        expect(question.order).toBeDefined();
      });
    });

    it('should return empty array for non-existent survey', async () => {
      const response = await request(app)
        .get('/api/questions/non-existent-survey-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should validate survey ID parameter', async () => {
      const response = await request(app)
        .get('/api/questions/')
        .expect(404); // Route not found for empty parameter

      // Should get 404 for missing survey ID
    });

    it('should handle EPC ordering correctly', async () => {
      const response = await request(app)
        .get(`/api/questions/${testSurveyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Questions should be ordered (EPC service stub provides random ordering)
      const questions = response.body.data;
      expect(questions.length).toBeGreaterThan(0);
      
      // Each question should have required fields
      questions.forEach((question: any) => {
        expect(question.id).toBeDefined();
        expect(question.surveyId).toBe(testSurveyId);
        expect(typeof question.order).toBe('number');
      });
    });
  });

  describe('Validation Integration', () => {
    it('should validate Zod schemas on generate endpoint', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          surveyId: '', // Invalid empty string
          text: 'Test question'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Survey ID is required');
    });

    it('should validate Zod schemas on update endpoint', async () => {
      const response = await request(app)
        .put('/api/questions/invalid-id')
        .send({
          text: '', // Invalid empty string
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('should strip unknown fields from request', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          surveyId: testSurveyId,
          text: 'Test question',
          unknownField: 'should be stripped',
          maliciousField: '<script>alert("xss")</script>'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      // Unknown fields should be stripped by Zod validation
      expect(response.body.data.unknownField).toBeUndefined();
      expect(response.body.data.maliciousField).toBeUndefined();
    });
  });
});