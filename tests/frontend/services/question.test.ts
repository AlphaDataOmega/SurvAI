/**
 * @fileoverview Tests for question API service
 * 
 * Unit tests for the question API service methods including
 * survey-specific queries and error handling.
 */

import { questionApi } from '../../../frontend/src/services/question';
import { api } from '../../../frontend/src/services/api';
import type { ApiResponse, Question } from '@survai/shared';

// Mock the api module
jest.mock('../../../frontend/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('QuestionApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getQuestionsBySurvey', () => {
    it('should fetch questions for a survey successfully', async () => {
      // Arrange
      const surveyId = 'survey-123';
      const mockQuestions: Question[] = [
        {
          id: 'question-1',
          surveyId,
          type: 'CTA_OFFER',
          text: 'Test question 1',
          order: 1,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'question-2',
          surveyId,
          type: 'CTA_OFFER',
          text: 'Test question 2',
          order: 2,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockResponse: ApiResponse<Question[]> = {
        success: true,
        data: mockQuestions,
        timestamp: new Date().toISOString()
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse } as any);

      // Act
      const result = await questionApi.getQuestionsBySurvey(surveyId);

      // Assert
      expect(mockedApi.get).toHaveBeenCalledWith('/api/questions/survey-123');
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].text).toBe('Test question 1');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const surveyId = 'survey-404';
      const mockError = new Error('Survey not found');
      mockedApi.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(questionApi.getQuestionsBySurvey(surveyId)).rejects.toThrow('Survey not found');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/questions/survey-404');
    });

    it('should handle empty results', async () => {
      // Arrange
      const surveyId = 'survey-empty';
      const mockResponse: ApiResponse<Question[]> = {
        success: true,
        data: [],
        timestamp: new Date().toISOString()
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse } as any);

      // Act
      const result = await questionApi.getQuestionsBySurvey(surveyId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getQuestionsWithEPCOrdering', () => {
    it('should fetch questions with EPC ordering successfully', async () => {
      // Arrange
      const surveyId = 'survey-123';
      const mockQuestions: Question[] = [
        {
          id: 'question-high-epc',
          surveyId,
          type: 'CTA_OFFER',
          text: 'High EPC question',
          order: 2,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'question-low-epc',
          surveyId,
          type: 'CTA_OFFER',
          text: 'Low EPC question',
          order: 1,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockResponse: ApiResponse<Question[]> = {
        success: true,
        data: mockQuestions,
        timestamp: new Date().toISOString()
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse } as any);

      // Act
      const result = await questionApi.getQuestionsWithEPCOrdering(surveyId);

      // Assert
      expect(mockedApi.get).toHaveBeenCalledWith('/api/questions/survey/survey-123/questions');
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getSurveyAnalytics', () => {
    it('should fetch survey analytics successfully', async () => {
      // Arrange
      const surveyId = 'survey-123';
      const mockAnalytics = {
        totalQuestions: 5,
        totalResponses: 100,
        conversionRate: 15.5,
        avgEPC: 2.45
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        data: mockAnalytics,
        timestamp: new Date().toISOString()
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse } as any);

      // Act
      const result = await questionApi.getSurveyAnalytics(surveyId);

      // Assert
      expect(mockedApi.get).toHaveBeenCalledWith('/api/questions/survey/survey-123/analytics');
      expect(result).toEqual(mockResponse);
      expect(result.data.totalQuestions).toBe(5);
      expect(result.data.avgEPC).toBe(2.45);
    });
  });

  describe('getQuestionAnalytics', () => {
    it('should fetch question analytics successfully', async () => {
      // Arrange
      const questionId = 'question-123';
      const mockAnalytics = {
        impressions: 500,
        clicks: 75,
        conversions: 12,
        epc: 3.20,
        conversionRate: 16.0
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        data: mockAnalytics,
        timestamp: new Date().toISOString()
      };

      mockedApi.get.mockResolvedValue({ data: mockResponse } as any);

      // Act
      const result = await questionApi.getQuestionAnalytics(questionId);

      // Assert
      expect(mockedApi.get).toHaveBeenCalledWith('/api/questions/question-123/analytics');
      expect(result).toEqual(mockResponse);
      expect(result.data.epc).toBe(3.20);
      expect(result.data.conversionRate).toBe(16.0);
    });

    it('should handle question not found error', async () => {
      // Arrange
      const questionId = 'question-404';
      const mockError = new Error('Question not found');
      mockedApi.get.mockRejectedValue(mockError);

      // Act & Assert
      await expect(questionApi.getQuestionAnalytics(questionId)).rejects.toThrow('Question not found');
    });
  });
});