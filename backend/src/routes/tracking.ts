/**
 * @fileoverview Tracking routes for click and conversion tracking
 * 
 * Routes for tracking CTA button clicks, conversions, and analytics.
 */

import { Router } from 'express';
import { trackingController } from '../controllers/trackingController';
import {
  validateTrackClick,
  validateRecordConversionQuery,
  validateRecordConversionBody,
  validateGeneratePixel,
  validateHandlePixel,
  validateGetAnalytics
} from '../middleware/trackingValidation';

const router = Router();

/**
 * @route POST /api/track-click
 * @desc Track CTA button click
 * @access Public
 * @body { sessionId, questionId, offerId, buttonVariantId, timestamp? }
 */
router.post('/click', validateTrackClick, trackingController.trackClick.bind(trackingController));

/**
 * @route GET /api/track/conversion
 * @desc Handle conversion pixel/postback
 * @access Public
 * @query { click_id, revenue? }
 */
router.get('/conversion', validateRecordConversionQuery, trackingController.recordConversion.bind(trackingController));

/**
 * @route POST /api/track/conversion
 * @desc Handle conversion postback (alternative method)
 * @access Public
 * @body { click_id, revenue? }
 */
router.post('/conversion', validateRecordConversionBody, trackingController.recordConversion.bind(trackingController));

/**
 * @route GET /api/track/analytics
 * @desc Get tracking analytics
 * @access Public (could be protected in production)
 * @query { offerId? }
 */
router.get('/analytics', validateGetAnalytics, trackingController.getAnalytics.bind(trackingController));

/**
 * @route POST /api/track/pixel
 * @desc Generate tracking pixel URL
 * @access Public
 * @body { clickId, surveyId }
 */
router.post('/pixel', validateGeneratePixel, trackingController.generatePixel.bind(trackingController));

/**
 * @route GET /api/track/pixel/:click_id
 * @desc Handle pixel tracking conversion
 * @access Public
 * @param { click_id } Click ID for conversion tracking
 * @query { revenue? }
 */
router.get('/pixel/:click_id', ...validateHandlePixel, trackingController.handlePixel.bind(trackingController));

export default router;