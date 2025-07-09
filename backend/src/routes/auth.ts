/**
 * @fileoverview Authentication routes
 * 
 * Routes for user authentication including registration, login, logout,
 * and profile management.
 */

import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register.bind(authController));

/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token in HTTP-only cookie
 * @access Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route POST /api/auth/logout
 * @desc Logout user and clear authentication cookie
 * @access Public
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateUser, authController.getCurrentUser.bind(authController));

export default router;