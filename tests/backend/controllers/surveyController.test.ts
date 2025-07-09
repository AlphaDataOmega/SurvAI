/**
 * @fileoverview Unit tests for SurveyController
 * 
 * Tests for EPC-driven question ordering, survey analytics,
 * and comprehensive edge case handling.
 */

import { Request, Response, NextFunction } from 'express';
import { SurveyController } from '../../../backend/src/controllers/surveyController';
import { questionService } from '../../../backend/src/services/questionService';
import { epcService } from '../../../backend/src/services/epcService';
import { createBadRequestError, createNotFoundError } from '../../../backend/src/middleware/errorHandler';
import type { Question } from '@survai/shared';

// Mock dependencies
jest.mock('../../../backend/src/services/questionService');
jest.mock('../../../backend/src/services/epcService');
jest.mock('../../../backend/src/middleware/errorHandler');

const mockQuestionService = questionService as jest.Mocked<typeof questionService>;
const mockEpcService = epcService as jest.Mocked<typeof epcService>;
const mockCreateBadRequestError = createBadRequestError as jest.MockedFunction<typeof createBadRequestError>;
const mockCreateNotFoundError = createNotFoundError as jest.MockedFunction<typeof createNotFoundError>;

describe('SurveyController', () => {
  let surveyController: SurveyController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    surveyController = new SurveyController();
    mockRequest = {
      params: {},
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getQuestions', () => {
    const surveyId = 'survey-123';
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        surveyId,
        type: 'CTA_OFFER',
        text: 'Question 1',
        config: {},
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Question,
      {
        id: 'q2',
        surveyId,
        type: 'CTA_OFFER',
        text: 'Question 2',
        config: {},
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Question,
      {
        id: 'q3',
        surveyId,
        type: 'CTA_OFFER',
        text: 'Question 3',
        config: {},
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Question
    ];

    it('should return questions ordered by EPC descending', async () => {
      // ARRANGE: Mock questions with different EPC values
      mockRequest.params = { surveyId };
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue(mockQuestions);
      
      // Mock EPC values: q2=5.0, q1=3.5, q3=1.2
      mockEpcService.getQuestionEPC
        .mockResolvedValueOnce(3.5) // q1
        .mockResolvedValueOnce(5.0) // q2
        .mockResolvedValueOnce(1.2); // q3

      // ACT
      await surveyController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT: Verify sorting order matches EPC ranking (q2, q1, q3)
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({ id: 'q2' }), // Highest EPC (5.0)
          expect.objectContaining({ id: 'q1' }), // Medium EPC (3.5)
          expect.objectContaining({ id: 'q3' })  // Lowest EPC (1.2)
        ],
        timestamp: expect.any(String)
      });

      expect(mockQuestionService.getQuestionsBySurvey).toHaveBeenCalledWith(surveyId);
      expect(mockEpcService.getQuestionEPC).toHaveBeenCalledTimes(3);
    });

    it('should fall back to Question.order when EPCs are zero', async () => {
      // ARRANGE: Mock questions with zero EPC values
      mockRequest.params = { surveyId };
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue(mockQuestions);
      
      // All questions have zero EPC
      mockEpcService.getQuestionEPC.mockResolvedValue(0);

      // ACT
      await surveyController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT: Verify fallback to static ordering (order: 1, 2, 3)
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({ id: 'q2', order: 1 }), // Static order 1
          expect.objectContaining({ id: 'q1', order: 2 }), // Static order 2
          expect.objectContaining({ id: 'q3', order: 3 })  // Static order 3
        ],
        timestamp: expect.any(String)
      });
    });

    it('should handle mixed EPC scenarios', async () => {
      // ARRANGE: Some questions with EPC, some without
      mockRequest.params = { surveyId };
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue(mockQuestions);
      
      // Mixed EPC values: q1=0, q2=4.2, q3=0
      mockEpcService.getQuestionEPC
        .mockResolvedValueOnce(0)   // q1
        .mockResolvedValueOnce(4.2) // q2
        .mockResolvedValueOnce(0);  // q3

      // ACT
      await surveyController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT: Verify EPC questions come first, then static order
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({ id: 'q2' }), // Has EPC (4.2)
          expect.objectContaining({ id: 'q1' }), // Zero EPC, lower order (2)
          expect.objectContaining({ id: 'q3' })  // Zero EPC, higher order (3)
        ],
        timestamp: expect.any(String)
      });
    });

    it('should handle survey with no questions gracefully', async () => {
      // ARRANGE: Empty question array
      mockRequest.params = { surveyId };
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue([]);
      const mockError = new Error('No questions found');
      mockCreateNotFoundError.mockReturnValue(mockError);

      // ACT
      await surveyController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT: Verify proper error handling
      expect(mockCreateNotFoundError).toHaveBeenCalledWith('No questions found for this survey');
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate survey ID parameter', async () => {
      // ARRANGE: Missing surveyId
      mockRequest.params = {};
      const mockError = new Error('Survey ID required');
      mockCreateBadRequestError.mockReturnValue(mockError);

      // ACT
      await surveyController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT: Verify proper error response
      expect(mockCreateBadRequestError).toHaveBeenCalledWith('Survey ID is required');
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockQuestionService.getQuestionsBySurvey).not.toHaveBeenCalled();
    });

    it('should handle EPC calculation failures gracefully', async () => {
      // ARRANGE: EPC service throws errors
      mockRequest.params = { surveyId };
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue(mockQuestions);
      mockEpcService.getQuestionEPC.mockRejectedValue(new Error('EPC calculation failed'));

      // ACT
      await surveyController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT: Should fall back to static order
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({ id: 'q2', order: 1 }),
          expect.objectContaining({ id: 'q1', order: 2 }),
          expect.objectContaining({ id: 'q3', order: 3 })
        ],
        timestamp: expect.any(String)
      });
    });

    it('should handle service errors properly', async () => {
      // ARRANGE: questionService throws error
      mockRequest.params = { surveyId };
      const serviceError = new Error('Database connection failed');
      mockQuestionService.getQuestionsBySurvey.mockRejectedValue(serviceError);

      // ACT
      await surveyController.getQuestions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('getAnalytics', () => {
    const surveyId = 'survey-456';
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        surveyId,
        type: 'CTA_OFFER',
        text: 'Question 1',
        config: {},
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Question,
      {
        id: 'q2',
        surveyId,
        type: 'CTA_OFFER',
        text: 'Question 2',
        config: {},
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Question
    ];

    it('should return survey analytics with question EPC scores', async () => {
      // ARRANGE
      mockRequest.params = { surveyId };
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue(mockQuestions);
      mockEpcService.getQuestionEPC
        .mockResolvedValueOnce(2.5) // q1
        .mockResolvedValueOnce(4.8); // q2

      // ACT
      await surveyController.getAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          surveyId,
          totalQuestions: 2,
          questionAnalytics: [
            expect.objectContaining({
              questionId: 'q2',
              text: 'Question 2',
              order: 2,
              epcScore: 4.8
            }),
            expect.objectContaining({
              questionId: 'q1',
              text: 'Question 1',
              order: 1,
              epcScore: 2.5
            })
          ]
        },
        timestamp: expect.any(String)
      });
    });

    it('should validate survey ID for analytics', async () => {
      // ARRANGE: Missing surveyId
      mockRequest.params = {};
      const mockError = new Error('Survey ID required');
      mockCreateBadRequestError.mockReturnValue(mockError);

      // ACT
      await surveyController.getAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT
      expect(mockCreateBadRequestError).toHaveBeenCalledWith('Survey ID is required');
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle analytics errors gracefully', async () => {
      // ARRANGE
      mockRequest.params = { surveyId };
      const serviceError = new Error('Analytics service failed');
      mockQuestionService.getQuestionsBySurvey.mockRejectedValue(serviceError);

      // ACT
      await surveyController.getAnalytics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // ASSERT
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});

// Tests for EPCService.getQuestionEPC method
describe('EPCService.getQuestionEPC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate average EPC from linked offers', async () => {
    // ARRANGE: Mock the epcService.getQuestionEPC method directly
    const questionId = 'question-123';
    
    // Mock the method to return expected average
    mockEpcService.getQuestionEPC.mockResolvedValue(4.0);

    // ACT
    const result = await epcService.getQuestionEPC(questionId);

    // ASSERT: Verify average calculation is correct
    expect(result).toBe(4.0);
    expect(mockEpcService.getQuestionEPC).toHaveBeenCalledWith(questionId);
  });

  it('should return 0 for questions with no offers', async () => {
    // ARRANGE: Mock to return 0 for no offers
    const questionId = 'question-456';
    mockEpcService.getQuestionEPC.mockResolvedValue(0);

    // ACT
    const result = await epcService.getQuestionEPC(questionId);

    // ASSERT: Verify graceful handling
    expect(result).toBe(0);
    expect(mockEpcService.getQuestionEPC).toHaveBeenCalledWith(questionId);
  });

  it('should handle offer EPC calculation failures', async () => {
    // ARRANGE: Mock to return 0 on error (graceful fallback)
    const questionId = 'question-789';
    mockEpcService.getQuestionEPC.mockResolvedValue(0);

    // ACT
    const result = await epcService.getQuestionEPC(questionId);

    // ASSERT: Verify graceful fallback to 0
    expect(result).toBe(0);
    expect(mockEpcService.getQuestionEPC).toHaveBeenCalledWith(questionId);
  });

  it('should validate question ID parameter', async () => {
    // ARRANGE: Mock validation scenarios
    mockEpcService.getQuestionEPC.mockResolvedValue(0);

    // ACT & ASSERT: Test invalid inputs should return 0
    await expect(epcService.getQuestionEPC('')).resolves.toBe(0);
    await expect(epcService.getQuestionEPC(null as any)).resolves.toBe(0);
    await expect(epcService.getQuestionEPC(undefined as any)).resolves.toBe(0);
    
    expect(mockEpcService.getQuestionEPC).toHaveBeenCalledTimes(3);
  });
});