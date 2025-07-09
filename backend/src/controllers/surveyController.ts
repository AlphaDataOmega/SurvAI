/**
 * @fileoverview Survey controller for EPC-driven question ordering
 * 
 * Controller for handling survey-related endpoints including getting questions
 * ordered by EPC performance for optimal revenue generation.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse, Question } from '@survai/shared';
import { questionService } from '../services/questionService';
import { epcService } from '../services/epcService';
import { 
  createBadRequestError, 
  createNotFoundError 
} from '../middleware/errorHandler';

/**
 * Survey controller class
 */
export class SurveyController {
  /**
   * Get questions for survey ordered by EPC performance
   * 
   * @param req - Request object with survey ID (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { surveyId } = req.params;

      // PATTERN: Parameter validation (see questionController.ts)
      if (!surveyId) {
        return next(createBadRequestError('Survey ID is required'));
      }

      // PATTERN: Service delegation (see existing controllers)
      const questions = await questionService.getQuestionsBySurvey(surveyId);

      if (!questions || questions.length === 0) {
        return next(createNotFoundError('No questions found for this survey'));
      }

      // NEW: EPC-based ordering
      const orderedQuestions = await this.orderQuestionsByEPC(questions);

      // PATTERN: Consistent API response (see questionController.ts)
      const apiResponse: ApiResponse<Question[]> = {
        success: true,
        data: orderedQuestions,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Order questions by EPC score with fallback to static order
   * 
   * @param questions - Array of questions to order
   * @returns Promise<Question[]> - Questions ordered by EPC score descending
   */
  private async orderQuestionsByEPC(questions: Question[]): Promise<Question[]> {
    try {
      // Calculate EPC for each question
      const questionsWithEPC = await Promise.all(
        questions.map(async (question) => ({
          question,
          epc: await epcService.getQuestionEPC(question.id)
        }))
      );

      // Sort by EPC (descending), fall back to static order for ties
      return questionsWithEPC
        .sort((a, b) => {
          // Primary sort: EPC descending (higher EPC first)
          if (a.epc !== b.epc) {
            return b.epc - a.epc;
          }
          // Secondary sort: static order ascending (lower order first)
          return a.question.order - b.question.order;
        })
        .map(({ question }) => question);
    } catch (error) {
      // Fallback to original order if EPC ordering fails
      console.warn('EPC ordering failed, falling back to static order:', error);
      return [...questions].sort((a, b) => a.order - b.order);
    }
  }

  /**
   * Get survey analytics including question performance
   * 
   * @param req - Request object with survey ID
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { surveyId } = req.params;

      if (!surveyId) {
        return next(createBadRequestError('Survey ID is required'));
      }

      // Get questions for the survey
      const questions = await questionService.getQuestionsBySurvey(surveyId);

      // Calculate EPC analytics for each question
      const questionAnalytics = await Promise.all(
        questions.map(async (question) => ({
          questionId: question.id,
          text: question.text,
          order: question.order,
          epcScore: await epcService.getQuestionEPC(question.id),
          // Future: Could add more analytics like click-through rates, etc.
        }))
      );

      const analytics = {
        surveyId,
        totalQuestions: questions.length,
        questionAnalytics: questionAnalytics.sort((a, b) => b.epcScore - a.epcScore)
      };

      const apiResponse: ApiResponse<typeof analytics> = {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const surveyController = new SurveyController();