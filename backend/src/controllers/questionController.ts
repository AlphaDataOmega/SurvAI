/**
 * @fileoverview Question controller for CTA-based survey system
 * 
 * Controller for handling CTA question endpoints including getting next question
 * with offer buttons for survey progression.
 */

import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { ApiResponse, NextQuestionRequest, NextQuestionResponse, Question } from '@survai/shared';
import { questionService } from '../services/questionService';
import { aiService } from '../services/aiService';
import { epcService } from '../services/epcService';
import { 
  createBadRequestError, 
  createNotFoundError 
} from '../middleware/errorHandler';

/**
 * Question controller class
 */
export class QuestionController {
  /**
   * Get next CTA question for survey
   * 
   * @param req - Request object with survey and session data
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getNext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { surveyId } = req.params;
      const { 
        sessionId = uuidv4(), 
        previousQuestionId,
        userAgent = req.get('User-Agent'),
        ipAddress = req.ip 
      } = req.body;

      // Validate required fields
      if (!surveyId) {
        return next(createBadRequestError('Survey ID is required'));
      }

      // Build request object
      const request: NextQuestionRequest = {
        sessionId,
        surveyId,
        ...(previousQuestionId && { previousQuestionId }),
        ...(userAgent && { userAgent }),
        ...(ipAddress && { ipAddress })
      };

      // Get next question from service
      const response = await questionService.getNextQuestion(request);

      // Return success response
      const apiResponse: ApiResponse<NextQuestionResponse> = {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No more questions')) {
        return next(createNotFoundError('No more questions available'));
      }
      next(error);
    }
  }

  /**
   * Skip current question (for "No Thanks" button)
   * 
   * @param req - Request object with session data
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async skip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { surveyId } = req.params;
      const { sessionId, questionId } = req.body;

      // Validate required fields
      if (!surveyId || !sessionId || !questionId) {
        return next(createBadRequestError('Survey ID, session ID, and question ID are required'));
      }

      // Log skip action (optional tracking)
      // Could be expanded to track skip rates per question

      // Get next question
      const request: NextQuestionRequest = {
        sessionId,
        surveyId,
        ...(questionId && { previousQuestionId: questionId }),
        ...(req.get('User-Agent') && { userAgent: req.get('User-Agent') }),
        ...(req.ip && { ipAddress: req.ip })
      };

      const response = await questionService.getNextQuestion(request);

      const apiResponse: ApiResponse<NextQuestionResponse> = {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No more questions')) {
        // Survey completed
        const apiResponse: ApiResponse<{ completed: boolean }> = {
          success: true,
          data: { completed: true },
          timestamp: new Date().toISOString()
        };
        res.status(200).json(apiResponse);
        return;
      }
      next(error);
    }
  }

  /**
   * Get question analytics
   * 
   * @param req - Request object with question ID
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;

      if (!questionId) {
        return next(createBadRequestError('Question ID is required'));
      }

      // This would typically require analytics service
      // For now, return basic structure
      const analytics = {
        questionId,
        impressions: 0,
        buttonClicks: 0,
        skipRate: 0,
        conversionRate: 0
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

  /**
   * Generate new question with optional AI content
   * 
   * @param req - Request object with question data (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        surveyId, 
        useAI, 
        text, 
        description, 
        type, 
        config, 
        options, 
        order, 
        required, 
        logic,
        aiContext 
      } = req.body;

      let questionText = text;
      let questionDescription = description;
      let aiVersions = null;

      // Generate AI content if requested
      if (useAI && aiContext) {
        try {
          const generatedQuestion = await aiService.generateQuestion(aiContext);
          questionText = generatedQuestion.text;
          questionDescription = generatedQuestion.description;
          
          // Store AI generation metadata
          aiVersions = {
            generated: true,
            provider: generatedQuestion.provider,
            confidence: generatedQuestion.confidence,
            generatedAt: generatedQuestion.generatedAt,
            originalContext: aiContext
          };
        } catch (error) {
          // If AI generation fails, fall back to provided text
          if (!text) {
            return next(createBadRequestError('AI generation failed and no fallback text provided'));
          }
          console.warn('AI generation failed, using provided text:', error);
        }
      }

      // Validate required fields after AI processing
      if (!questionText) {
        return next(createBadRequestError('Question text is required'));
      }

      // Create question using enhanced service
      const question = await questionService.createQuestion({
        surveyId,
        type: type || 'CTA_OFFER',
        text: questionText,
        description: questionDescription,
        config: config || {},
        options: options || [],
        order: order || 1,
        required: required || false,
        logic: logic || null,
        aiVersions
      });

      const apiResponse: ApiResponse<Question> = {
        success: true,
        data: question,
        timestamp: new Date().toISOString()
      };

      res.status(201).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update existing question
   * 
   * @param req - Request object with question updates (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const question = await questionService.updateQuestion(id, updateData);

      const apiResponse: ApiResponse<Question> = {
        success: true,
        data: question,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return next(createNotFoundError('Question not found'));
      }
      next(error);
    }
  }

  /**
   * Get questions for survey ordered by EPC
   * 
   * @param req - Request object with survey ID (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getQuestionsBySurvey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { surveyId } = req.params;

      // Get questions for survey
      const questions = await questionService.getQuestionsBySurvey(surveyId);

      // Order by EPC score (using new implementation)
      const orderedQuestions = await epcService.orderQuestionsByEPCScore(questions);

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
}

// Export singleton instance
export const questionController = new QuestionController();