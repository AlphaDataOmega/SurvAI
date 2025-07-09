/**
 * @fileoverview Session routes for widget integration
 * 
 * Routes for managing widget sessions and bootstrap functionality.
 */

import { Router } from 'express';
import { sessionController } from '../controllers/sessionController';

const router = Router();

/**
 * @route POST /api/sessions
 * @desc Bootstrap a new session for widget
 * @access Public
 * @body { surveyId: string, metadata?: Record<string, unknown> }
 */
router.post('/', sessionController.bootstrap.bind(sessionController));

export default router;