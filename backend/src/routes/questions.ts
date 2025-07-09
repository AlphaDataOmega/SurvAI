/**
 * @fileoverview Question routes for CTA-based survey system
 * 
 * Routes for managing CTA questions, getting next questions,
 * and handling question flow progression.
 */

import { Router } from 'express';
import { questionController } from '../controllers/questionController';
import { surveyController } from '../controllers/surveyController';
import { 
  validateQuestionGenerate,
  validateQuestionUpdate,
  validateSurveyParams,
  validateQuestionParams
} from '../validators/questionValidator';

const router = Router();

/**
 * @route POST /api/questions/:surveyId/next
 * @desc Get next CTA question for survey
 * @access Public
 * @body { sessionId?, previousQuestionId?, userAgent?, ipAddress? }
 */
router.post('/:surveyId/next', questionController.getNext.bind(questionController));

/**
 * @route POST /api/questions/:surveyId/skip
 * @desc Skip current question and get next one
 * @access Public
 * @body { sessionId, questionId }
 */
router.post('/:surveyId/skip', questionController.skip.bind(questionController));

/**
 * @route GET /api/questions/:questionId/analytics
 * @desc Get analytics for a specific question
 * @access Public (could be protected in production)
 */
router.get('/:questionId/analytics', questionController.getAnalytics.bind(questionController));

/**
 * @route POST /api/questions/generate
 * @desc Generate new question with optional AI content
 * @access Protected (admin)
 * @body { surveyId, useAI?, text?, description?, type?, config?, options?, order?, required?, logic?, aiContext? }
 */
router.post('/generate', 
  validateQuestionGenerate, 
  questionController.generate.bind(questionController)
);

/**
 * @route PUT /api/questions/:id
 * @desc Update existing question
 * @access Protected (admin)
 * @body { text?, description?, config?, options?, order?, required?, logic? }
 */
router.put('/:id', 
  validateQuestionParams,
  validateQuestionUpdate, 
  questionController.updateQuestion.bind(questionController)
);

/**
 * @route GET /api/questions/:surveyId
 * @desc Get questions for survey ordered by EPC (legacy endpoint)
 * @access Protected (admin)
 */
router.get('/:surveyId', 
  validateSurveyParams,
  questionController.getQuestionsBySurvey.bind(questionController)
);

// ============================================
// Survey-specific routes with enhanced EPC features
// ============================================

/**
 * @route GET /api/questions/survey/:surveyId/questions
 * @desc Get questions for survey with enhanced EPC ordering
 * @access Protected (admin)
 */
router.get('/survey/:surveyId/questions', 
  validateSurveyParams,
  surveyController.getQuestions.bind(surveyController)
);

/**
 * @route GET /api/questions/survey/:surveyId/analytics
 * @desc Get comprehensive analytics for survey including EPC performance
 * @access Protected (admin)
 */
router.get('/survey/:surveyId/analytics', 
  validateSurveyParams,
  surveyController.getAnalytics.bind(surveyController)
);

export default router;