/**
 * @fileoverview Tests for useChatCommands - list-questions functionality
 * 
 * Comprehensive tests for the /list-questions command implementation
 * including API integration, error handling, and edge cases.
 */

import { renderHook, act } from '@testing-library/react';
import { useChatCommands } from '../../../frontend/src/hooks/useChatCommands';
import { questionApi } from '../../../frontend/src/services/question';
import type { ApiResponse, Question } from '@survai/shared';

// Mock dependencies
jest.mock('../../../frontend/src/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { role: 'ADMIN', id: 'admin-1' }
  })
}));

jest.mock('../../../frontend/src/services/question');
const mockedQuestionApi = questionApi as jest.Mocked<typeof questionApi>;

describe('useChatCommands - list-questions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockQuestions = (surveyId: string, count: number = 3): Question[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: `question-${index + 1}`,
      surveyId,
      type: 'CTA_OFFER',
      text: `Question ${index + 1} text content`,
      order: index + 1,
      config: {},
      options: [
        {
          id: `option-${index + 1}-1`,
          text: `Option ${index + 1}-1`,
          offerId: `offer-${index + 1}-1`,
          order: 1
        },
        {
          id: `option-${index + 1}-2`,
          text: `Option ${index + 1}-2`,
          offerId: `offer-${index + 1}-2`,
          order: 2
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  };

  describe('successful execution', () => {
    it('should list questions for valid survey ID', async () => {
      // Arrange
      const surveyId = 'survey-123';
      const mockQuestions = createMockQuestions(surveyId, 3);
      const mockResponse: ApiResponse<Question[]> = {
        success: true,
        data: mockQuestions,
        timestamp: new Date().toISOString()
      };

      mockedQuestionApi.getQuestionsBySurvey.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-123');
      });

      // Assert
      expect(mockedQuestionApi.getQuestionsBySurvey).toHaveBeenCalledWith('survey-123');
      expect(response.type).toBe('success');
      expect(response.content).toContain('Questions for Survey: survey-123');
      expect(response.content).toContain('(3 total)');
      expect(response.content).toContain('Question 1 text content');
      expect(response.content).toContain('Question 2 text content');
      expect(response.content).toContain('Question 3 text content');
      expect(response.content).toContain('| Order | Type | Text | Status | Options |');
    });

    it('should handle empty question list gracefully', async () => {
      // Arrange
      const surveyId = 'survey-empty';
      const mockResponse: ApiResponse<Question[]> = {
        success: true,
        data: [],
        timestamp: new Date().toISOString()
      };

      mockedQuestionApi.getQuestionsBySurvey.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-empty');
      });

      // Assert
      expect(response.type).toBe('success');
      expect(response.content).toContain('Questions for Survey: survey-empty');
      expect(response.content).toContain('No questions found for this survey');
    });

    it('should format questions table correctly with proper ordering', async () => {
      // Arrange
      const surveyId = 'survey-ordering';
      const mockQuestions: Question[] = [
        {
          id: 'question-2',
          surveyId,
          type: 'CTA_OFFER',
          text: 'Second question',
          order: 2,
          config: {},
          options: [{ id: 'opt-1', text: 'Option 1', offerId: 'offer-1', order: 1 }],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'question-1',
          surveyId,
          type: 'CTA_OFFER',
          text: 'First question',
          order: 1,
          config: {},
          options: [
            { id: 'opt-1', text: 'Option 1', offerId: 'offer-1', order: 1 },
            { id: 'opt-2', text: 'Option 2', offerId: 'offer-2', order: 2 }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockResponse: ApiResponse<Question[]> = {
        success: true,
        data: mockQuestions,
        timestamp: new Date().toISOString()
      };

      mockedQuestionApi.getQuestionsBySurvey.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-ordering');
      });

      // Assert
      expect(response.content).toContain('| 1 | CTA_OFFER | First question | Active | 2 |');
      expect(response.content).toContain('| 2 | CTA_OFFER | Second question | Active | 1 |');
      
      // Check that questions are ordered properly (First question should appear before Second question)
      const firstQuestionIndex = response.content.indexOf('First question');
      const secondQuestionIndex = response.content.indexOf('Second question');
      expect(firstQuestionIndex).toBeLessThan(secondQuestionIndex);
    });

    it('should truncate long question text properly', async () => {
      // Arrange
      const surveyId = 'survey-long-text';
      const longText = 'This is a very long question text that should be truncated when displayed in the chat table format because it exceeds the 50 character limit';
      const mockQuestions: Question[] = [{
        id: 'question-long',
        surveyId,
        type: 'CTA_OFFER',
        text: longText,
        order: 1,
        config: {},
        options: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      const mockResponse: ApiResponse<Question[]> = {
        success: true,
        data: mockQuestions,
        timestamp: new Date().toISOString()
      };

      mockedQuestionApi.getQuestionsBySurvey.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-long-text');
      });

      // Assert
      expect(response.content).toContain('This is a very long question text that should...');
      expect(response.content).not.toContain('because it exceeds the 50 character limit');
    });
  });

  describe('error handling', () => {
    it('should handle missing survey ID argument', async () => {
      // Arrange
      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions');
      });

      // Assert
      expect(response.type).toBe('error');
      expect(response.content).toContain('Usage: /list-questions <surveyId>');
      expect(response.content).toContain('Example: /list-questions survey-123');
      expect(mockedQuestionApi.getQuestionsBySurvey).not.toHaveBeenCalled();
    });

    it('should handle API failure gracefully', async () => {
      // Arrange
      const surveyId = 'survey-error';
      const mockResponse: ApiResponse<Question[]> = {
        success: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      };

      mockedQuestionApi.getQuestionsBySurvey.mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-error');
      });

      // Assert
      expect(response.type).toBe('error');
      expect(response.content).toContain('Failed to fetch questions: Database connection failed');
    });

    it('should handle network/exception errors gracefully', async () => {
      // Arrange
      const surveyId = 'survey-exception';
      mockedQuestionApi.getQuestionsBySurvey.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-exception');
      });

      // Assert
      expect(response.type).toBe('error');
      expect(response.content).toContain('Failed to fetch questions: Network timeout');
    });

    it('should handle 404 not found errors with specific message', async () => {
      // Arrange
      const surveyId = 'survey-404';
      mockedQuestionApi.getQuestionsBySurvey.mockRejectedValue(new Error('404 not found'));

      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-404');
      });

      // Assert
      expect(response.type).toBe('error');
      expect(response.content).toContain("Survey 'survey-404' not found");
      expect(response.content).toContain('Please check the survey ID and try again');
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      const surveyId = 'survey-unknown';
      mockedQuestionApi.getQuestionsBySurvey.mockRejectedValue('String error');

      const { result } = renderHook(() => useChatCommands());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-unknown');
      });

      // Assert
      expect(response.type).toBe('error');
      expect(response.content).toContain('Failed to fetch questions: Unknown error occurred');
    });
  });

  describe('authentication requirements', () => {
    it('should require authentication', async () => {
      // Arrange - Mock unauthenticated state
      jest.clearAllMocks();
      jest.resetModules();
      
      jest.mock('../../../frontend/src/hooks/useAuth', () => ({
        useAuth: () => ({
          isAuthenticated: false,
          user: null
        })
      }));

      // Re-import after mocking
      const { useChatCommands: useChatCommandsUnauthenticated } = require('../../../frontend/src/hooks/useChatCommands');
      const { result } = renderHook(() => useChatCommandsUnauthenticated());

      // Act
      let response: any;
      await act(async () => {
        response = await result.current.executeCommand('/list-questions survey-123');
      });

      // Assert
      expect(response.type).toBe('error');
      expect(response.content).toContain('Authentication required. Please log in first.');
      expect(mockedQuestionApi.getQuestionsBySurvey).not.toHaveBeenCalled();
    });
  });
});