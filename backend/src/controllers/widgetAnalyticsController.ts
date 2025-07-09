/**
 * @fileoverview Widget analytics controller for handling analytics beacon events
 * 
 * Controller for handling widget analytics endpoints including event storage
 * and aggregated data retrieval for dashboard display.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@survai/shared';
import { WidgetAnalyticsService, type WidgetAnalyticsEvent, type WidgetAnalyticsAggregation } from '../services/widgetAnalyticsService';
import type { 
  ValidatedWidgetAnalyticsEvent
} from '../validators/widgetAnalyticsValidator';

const widgetAnalyticsService = new WidgetAnalyticsService();

/**
 * Widget analytics controller class
 */
export class WidgetAnalyticsController {
  /**
   * Store widget analytics event (loaded or dwell)
   * 
   * @param req - Request object with analytics event data (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async storeEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by middleware
      const {
        surveyId,
        event,
        dwellTimeMs,
        metadata
      } = req.body;

      // Build analytics event with validated data
      const analyticsEvent: ValidatedWidgetAnalyticsEvent = {
        surveyId,
        event,
        ...(dwellTimeMs !== undefined && { dwellTimeMs }),
        ...(metadata && { metadata })
      };

      // Store the analytics event
      const storedEvent = await widgetAnalyticsService.storeEvent(analyticsEvent);

      // Return success response
      const apiResponse: ApiResponse<{ event: WidgetAnalyticsEvent }> = {
        success: true,
        data: {
          event: storedEvent
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get aggregated widget analytics data for dashboard
   * 
   * @param req - Request object with aggregation parameters (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getAggregation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by middleware
      const { surveyId, days } = req.query as any;

      // Get aggregated analytics data
      const aggregation = await widgetAnalyticsService.getLast7DaysAggregation(
        surveyId as string | undefined,
        days as number || 7
      );

      // Return success response
      const apiResponse: ApiResponse<{ aggregation: WidgetAnalyticsAggregation[] }> = {
        success: true,
        data: {
          aggregation
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get widget analytics summary for a specific survey
   * 
   * @param req - Request object with survey ID parameter
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getSurveySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { surveyId } = req.params;

      if (!surveyId) {
        return next(new Error('Survey ID is required'));
      }

      // Get survey summary
      const summary = await widgetAnalyticsService.getSurveySummary(surveyId);

      // Return success response
      const apiResponse: ApiResponse<{ summary: any }> = {
        success: true,
        data: {
          summary
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check endpoint for widget analytics service
   * 
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Simple health check - try to query the database
      await widgetAnalyticsService.getLast7DaysAggregation(undefined, 1);
      
      // Return success response
      const apiResponse: ApiResponse<{ status: string; timestamp: string }> = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }
}

// Export controller instance
export const widgetAnalyticsController = new WidgetAnalyticsController();