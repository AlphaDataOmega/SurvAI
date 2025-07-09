/**
 * @fileoverview Session controller for widget session management
 * 
 * Handles session bootstrap for embeddable widgets, generates unique
 * session IDs and click IDs for tracking.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '@survai/shared';
import { logger } from '../utils/logger';

export interface SessionBootstrapRequest {
  /** Survey ID to bootstrap session for */
  surveyId: string;
  /** Optional session metadata */
  metadata?: Record<string, unknown>;
}

export interface SessionBootstrapResponse {
  /** Generated session ID */
  sessionId: string;
  /** Generated click ID for tracking */
  clickId: string;
  /** Survey ID */
  surveyId: string;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session controller for widget integration
 */
export class SessionController {
  /**
   * Bootstrap a new session for widget
   * 
   * @param req - Express request
   * @param res - Express response
   */
  async bootstrap(req: Request, res: Response): Promise<void> {
    try {
      const { surveyId, metadata } = req.body as SessionBootstrapRequest;

      // Validate surveyId is provided
      if (!surveyId) {
        res.status(400).json({
          success: false,
          error: 'Survey ID is required',
          timestamp: new Date().toISOString()
        } as ApiResponse);
        return;
      }

      // Generate unique IDs
      const sessionId = uuidv4();
      const clickId = uuidv4();

      // Create session data
      const sessionData: SessionBootstrapResponse = {
        sessionId,
        clickId,
        surveyId,
        metadata
      };

      logger.info('Session bootstrap created', {
        sessionId,
        clickId,
        surveyId,
        metadata
      });

      // Return session data
      res.status(201).json({
        success: true,
        data: sessionData,
        timestamp: new Date().toISOString()
      } as ApiResponse<SessionBootstrapResponse>);

    } catch (error) {
      logger.error('Session bootstrap error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to bootstrap session',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  }
}

export const sessionController = new SessionController();