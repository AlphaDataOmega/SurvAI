/**
 * @fileoverview Dashboard routes for admin metrics and analytics
 * 
 * Routes for accessing dashboard metrics, offer performance,
 * and analytics data with admin authentication protection.
 */

import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { validateDashboardMetrics } from '../validators/dashboardValidation';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * Apply admin authentication middleware to all dashboard routes
 * PATTERN: [authenticateUser, requireAdmin] middleware chain like the PRP specifies
 */
router.use(authenticateUser, requireAdmin);

/**
 * @route GET /api/dashboard/metrics
 * @desc Get comprehensive dashboard metrics with aggregated data
 * @access Admin only
 * @query { timeRange?, offerIds?, minEPC? }
 */
router.get('/metrics', validateDashboardMetrics, dashboardController.getMetrics.bind(dashboardController));

/**
 * @route GET /api/dashboard/offers
 * @desc Get offer performance metrics only
 * @access Admin only
 * @query { timeRange?, offerIds?, minEPC? }
 */
router.get('/offers', validateDashboardMetrics, dashboardController.getOfferMetrics.bind(dashboardController));

/**
 * @route GET /api/dashboard/questions
 * @desc Get question performance metrics only
 * @access Admin only
 * @query { timeRange? }
 */
router.get('/questions', validateDashboardMetrics, dashboardController.getQuestionMetrics.bind(dashboardController));

/**
 * @route GET /api/dashboard/summary
 * @desc Get dashboard summary statistics only
 * @access Admin only
 * @query { timeRange?, offerIds?, minEPC? }
 */
router.get('/summary', validateDashboardMetrics, dashboardController.getSummary.bind(dashboardController));

/**
 * @route GET /api/dashboard/health
 * @desc Health check for dashboard service
 * @access Admin only
 */
router.get('/health', dashboardController.healthCheck.bind(dashboardController));

export default router;