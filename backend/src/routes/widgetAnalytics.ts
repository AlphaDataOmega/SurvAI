/**
 * @fileoverview Widget analytics routes for analytics beacon tracking
 * 
 * Routes for tracking widget load events, dwell time, and retrieving
 * aggregated analytics data for dashboard display.
 */

import { Router } from 'express';
import { widgetAnalyticsController } from '../controllers/widgetAnalyticsController';
import {
  validateWidgetAnalyticsEvent,
  validateWidgetAnalyticsAggregation,
  validateSurveyIdParam,
  widgetAnalyticsMiddleware
} from '../middleware/widgetAnalyticsValidation';

const router = Router();

// Apply common middleware to all widget analytics routes
router.use(widgetAnalyticsMiddleware);

/**
 * @route POST /api/widget/analytics
 * @desc Store widget analytics event (loaded or dwell)
 * @access Public
 * @body { surveyId, event, dwellTimeMs?, metadata? }
 */
router.post(
  '/', 
  validateWidgetAnalyticsEvent, 
  widgetAnalyticsController.storeEvent.bind(widgetAnalyticsController)
);

/**
 * @route GET /api/widget/analytics/aggregation
 * @desc Get aggregated widget analytics data for dashboard
 * @access Public
 * @query { surveyId?, days?, timezone? }
 */
router.get(
  '/aggregation', 
  validateWidgetAnalyticsAggregation, 
  widgetAnalyticsController.getAggregation.bind(widgetAnalyticsController)
);

/**
 * @route GET /api/widget/analytics/summary/:surveyId
 * @desc Get widget analytics summary for a specific survey
 * @access Public
 * @param { surveyId } Survey ID to get summary for
 */
router.get(
  '/summary/:surveyId', 
  validateSurveyIdParam, 
  widgetAnalyticsController.getSurveySummary.bind(widgetAnalyticsController)
);

/**
 * @route GET /api/widget/analytics/health
 * @desc Health check endpoint for widget analytics service
 * @access Public
 */
router.get(
  '/health', 
  widgetAnalyticsController.healthCheck.bind(widgetAnalyticsController)
);

export default router;