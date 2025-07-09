/**
 * @fileoverview Question API service
 * 
 * Service for making API calls to the backend question management endpoints.
 * Provides typed methods for question operations including survey-specific queries.
 */

import type { 
  ApiResponse, 
  Question
} from '@survai/shared';
import { api } from './api';

/**
 * Question API service class
 */
export class QuestionApiService {
  private baseUrl = '/api/questions';

  /**
   * Get questions for a specific survey (EPC-ordered)
   * 
   * @param surveyId - Survey identifier
   * @returns Promise with questions ordered by EPC performance
   */
  async getQuestionsBySurvey(surveyId: string): Promise<ApiResponse<Question[]>> {
    const response = await api.get<ApiResponse<Question[]>>(`${this.baseUrl}/${surveyId}`);
    return response.data;
  }

  /**
   * Get questions for survey with enhanced EPC ordering
   * 
   * @param surveyId - Survey identifier
   * @returns Promise with questions with enhanced EPC data
   */
  async getQuestionsWithEPCOrdering(surveyId: string): Promise<ApiResponse<Question[]>> {
    const response = await api.get<ApiResponse<Question[]>>(`${this.baseUrl}/survey/${surveyId}/questions`);
    return response.data;
  }

  /**
   * Get analytics for a survey including EPC performance
   * 
   * @param surveyId - Survey identifier
   * @returns Promise with comprehensive survey analytics
   */
  async getSurveyAnalytics(surveyId: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(`${this.baseUrl}/survey/${surveyId}/analytics`);
    return response.data;
  }

  /**
   * Get analytics for a specific question
   * 
   * @param questionId - Question identifier
   * @returns Promise with question analytics
   */
  async getQuestionAnalytics(questionId: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(`${this.baseUrl}/${questionId}/analytics`);
    return response.data;
  }
}

/**
 * Singleton instance of the question API service
 */
export const questionApi = new QuestionApiService();

/**
 * Default export for convenience
 */
export default questionApi;