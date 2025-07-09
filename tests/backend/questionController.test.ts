/**
 * @fileoverview Unit tests for Question Controller
 * 
 * Tests for question controller methods including generate, update,
 * and getQuestionsBySurvey with AI integration and validation.
 */

import { Request, Response, NextFunction } from 'express';
import { questionController } from '../../backend/src/controllers/questionController';
import { questionService } from '../../backend/src/services/questionService';
import { aiService } from '../../backend/src/services/aiService';
import { epcService } from '../../backend/src/services/epcService';
import { createBadRequestError, createNotFoundError } from '../../backend/src/middleware/errorHandler';
import type { Question, QuestionContext } from '@survai/shared';

// Mock the services
jest.mock('../../backend/src/services/questionService');
jest.mock('../../backend/src/services/aiService');
jest.mock('../../backend/src/services/epcService');
jest.mock('../../backend/src/middleware/errorHandler');

const mockQuestionService = questionService as jest.Mocked<typeof questionService>;
const mockAiService = aiService as jest.Mocked<typeof aiService>;
const mockEpcService = epcService as jest.Mocked<typeof epcService>;
const mockCreateBadRequestError = createBadRequestError as jest.MockedFunction<typeof createBadRequestError>;
const mockCreateNotFoundError = createNotFoundError as jest.MockedFunction<typeof createNotFoundError>;

describe('QuestionController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generate', () => {
    const mockQuestion: Question = {
      id: 'test-question-id',
      surveyId: 'test-survey-id',
      type: 'CTA_OFFER',
      text: 'Generated question text',
      description: 'Generated description',
      config: {},
      options: [],
      order: 1,
      logic: null,
      aiVersions: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    beforeEach(() => {
      mockRequest.body = {
        surveyId: 'test-survey-id',
        useAI: false,
        text: 'Static question text',
        description: 'Static description',
        type: 'CTA_OFFER'
      };
    });

    it('should generate question with static content successfully', async () => {
      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion);

      await questionController.generate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.createQuestion).toHaveBeenCalledWith({
        surveyId: 'test-survey-id',
        type: 'CTA_OFFER',
        text: 'Static question text',
        description: 'Static description',
        config: {},
        options: [],
        order: 1,
        required: false,
        logic: null,
        aiVersions: null
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockQuestion,
        timestamp: expect.any(String)
      });
    });

    it('should generate question with AI content successfully', async () => {
      const aiContext = {
        userIncome: '50000-75000',
        employment: 'full-time',
        surveyType: 'finance'
      };

      const mockAiResponse = {
        text: 'AI generated question',
        description: 'AI generated description',
        provider: 'openai',
        confidence: 0.95,
        generatedAt: new Date().toISOString()
      };

      mockRequest.body = {
        surveyId: 'test-survey-id',
        useAI: true,
        aiContext
      };

      mockAiService.generateQuestion.mockResolvedValue(mockAiResponse);
      mockQuestionService.createQuestion.mockResolvedValue({
        ...mockQuestion,
        text: mockAiResponse.text,
        description: mockAiResponse.description,
        aiVersions: {
          generated: true,
          provider: mockAiResponse.provider,
          confidence: mockAiResponse.confidence,
          generatedAt: mockAiResponse.generatedAt,
          originalContext: aiContext
        }
      });

      await questionController.generate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAiService.generateQuestion).toHaveBeenCalledWith(aiContext);
      expect(mockQuestionService.createQuestion).toHaveBeenCalledWith({
        surveyId: 'test-survey-id',
        type: 'CTA_OFFER',
        text: 'AI generated question',
        description: 'AI generated description',
        config: {},
        options: [],
        order: 1,
        required: false,
        logic: null,
        aiVersions: {
          generated: true,
          provider: 'openai',
          confidence: 0.95,
          generatedAt: mockAiResponse.generatedAt,
          originalContext: aiContext
        }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should fallback to provided text when AI generation fails', async () => {
      mockRequest.body = {
        surveyId: 'test-survey-id',
        useAI: true,
        text: 'Fallback text',
        aiContext: { userIncome: '50000' }
      };

      const aiError = new Error('AI service unavailable');
      mockAiService.generateQuestion.mockRejectedValue(aiError);
      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await questionController.generate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalledWith('AI generation failed, using provided text:', aiError);
      expect(mockQuestionService.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Fallback text',
          aiVersions: null
        })
      );

      consoleSpy.mockRestore();
    });

    it('should return error when AI fails and no fallback text provided', async () => {
      mockRequest.body = {
        surveyId: 'test-survey-id',
        useAI: true,
        aiContext: { userIncome: '50000' }
        // No text field for fallback
      };

      const aiError = new Error('AI service unavailable');
      mockAiService.generateQuestion.mockRejectedValue(aiError);
      
      const mockError = new Error('AI generation failed');
      mockCreateBadRequestError.mockReturnValue(mockError);

      await questionController.generate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCreateBadRequestError).toHaveBeenCalledWith(
        'AI generation failed and no fallback text provided'
      );
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should return error when no question text provided', async () => {
      mockRequest.body = {
        surveyId: 'test-survey-id',
        useAI: false
        // No text field
      };

      const mockError = new Error('Question text required');
      mockCreateBadRequestError.mockReturnValue(mockError);

      await questionController.generate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCreateBadRequestError).toHaveBeenCalledWith('Question text is required');
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        surveyId: 'test-survey-id',
        text: 'Test question'
      };

      const serviceError = new Error('Database error');
      mockQuestionService.createQuestion.mockRejectedValue(serviceError);

      await questionController.generate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('updateQuestion', () => {
    const mockUpdatedQuestion: Question = {
      id: 'test-question-id',
      surveyId: 'test-survey-id',
      type: 'CTA_OFFER',
      text: 'Updated question text',
      description: 'Updated description',
      config: {},
      options: [],
      order: 1,
      logic: null,
      aiVersions: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    beforeEach(() => {
      mockRequest.params = { id: 'test-question-id' };
      mockRequest.body = {
        text: 'Updated question text',
        description: 'Updated description'
      };
    });

    it('should update question successfully', async () => {
      mockQuestionService.updateQuestion.mockResolvedValue(mockUpdatedQuestion);

      await questionController.updateQuestion(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.updateQuestion).toHaveBeenCalledWith(
        'test-question-id',
        {
          text: 'Updated question text',
          description: 'Updated description'
        }
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedQuestion,
        timestamp: expect.any(String)
      });
    });

    it('should return not found error when question does not exist', async () => {
      const serviceError = new Error('Question not found');
      mockQuestionService.updateQuestion.mockRejectedValue(serviceError);
      
      const mockNotFoundError = new Error('Question not found');
      mockCreateNotFoundError.mockReturnValue(mockNotFoundError);

      await questionController.updateQuestion(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockCreateNotFoundError).toHaveBeenCalledWith('Question not found');
      expect(mockNext).toHaveBeenCalledWith(mockNotFoundError);
    });

    it('should handle other service errors', async () => {
      const serviceError = new Error('Database connection error');
      mockQuestionService.updateQuestion.mockRejectedValue(serviceError);

      await questionController.updateQuestion(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getQuestionsBySurvey', () => {
    const mockQuestions: Question[] = [
      {
        id: 'question-1',
        surveyId: 'test-survey-id',
        type: 'CTA_OFFER',
        text: 'Question 1',
        description: 'Description 1',
        config: {},
        options: [],
        order: 1,
        logic: null,
        aiVersions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'question-2',
        surveyId: 'test-survey-id',
        type: 'CTA_OFFER',
        text: 'Question 2',
        description: 'Description 2',
        config: {},
        options: [],
        order: 2,
        logic: null,
        aiVersions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    beforeEach(() => {
      mockRequest.params = { surveyId: 'test-survey-id' };
    });

    it('should get questions for survey ordered by EPC', async () => {
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue(mockQuestions);
      mockEpcService.orderQuestionsByEPC.mockResolvedValue([mockQuestions[1], mockQuestions[0]]);

      await questionController.getQuestionsBySurvey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.getQuestionsBySurvey).toHaveBeenCalledWith('test-survey-id');
      expect(mockEpcService.orderQuestionsByEPC).toHaveBeenCalledWith(mockQuestions);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [mockQuestions[1], mockQuestions[0]], // EPC ordered
        timestamp: expect.any(String)
      });
    });

    it('should return empty array when no questions found', async () => {
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue([]);
      mockEpcService.orderQuestionsByEPC.mockResolvedValue([]);

      await questionController.getQuestionsBySurvey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        timestamp: expect.any(String)
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Database query failed');
      mockQuestionService.getQuestionsBySurvey.mockRejectedValue(serviceError);

      await questionController.getQuestionsBySurvey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it('should handle EPC ordering errors gracefully', async () => {
      mockQuestionService.getQuestionsBySurvey.mockResolvedValue(mockQuestions);
      
      const epcError = new Error('EPC service unavailable');
      mockEpcService.orderQuestionsByEPC.mockRejectedValue(epcError);

      await questionController.getQuestionsBySurvey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(epcError);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle missing request body in generate', async () => {
      mockRequest.body = undefined;

      await questionController.generate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should handle gracefully - exact behavior depends on validation middleware
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing params in updateQuestion', async () => {
      mockRequest.params = {};
      mockRequest.body = { text: 'Updated text' };

      await questionController.updateQuestion(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.updateQuestion).toHaveBeenCalledWith(
        undefined,
        { text: 'Updated text' }
      );
    });

    it('should handle missing params in getQuestionsBySurvey', async () => {
      mockRequest.params = {};

      await questionController.getQuestionsBySurvey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockQuestionService.getQuestionsBySurvey).toHaveBeenCalledWith(undefined);
    });
  });
});