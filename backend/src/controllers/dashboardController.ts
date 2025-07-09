/**
 * @fileoverview Dashboard controller for admin metrics and analytics
 * 
 * Controller for handling dashboard API endpoints including
 * metrics aggregation, performance data, and analytics.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse, DashboardMetrics, DashboardFilters } from '@survai/shared';
import { dashboardService } from '../services/dashboardService';

/**
 * Dashboard controller class
 */
export class DashboardController {
  /**
   * Get comprehensive dashboard metrics
   * 
   * @param req - Request object with query parameters (validated by middleware)
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Request validation is handled by validateDashboardMetrics middleware
      const { timeRange, offerIds, minEPC } = req.query;

      // Build filters from validated query parameters
      const filters: DashboardFilters = {
        timeRange: (timeRange as 'last24h' | 'last7d' | 'last30d') || 'last7d',
        ...(offerIds && { offerIds: Array.isArray(offerIds) ? offerIds as string[] : [offerIds as string] }),
        ...(minEPC && { minEPC: parseFloat(minEPC as string) })
      };

      // Get dashboard metrics from service
      const metrics = await dashboardService.getDashboardMetrics(filters);

      // PATTERN: Return success response with ApiResponse<T> pattern like trackingController
      const apiResponse: ApiResponse<DashboardMetrics> = {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get offer performance metrics only
   * 
   * @param req - Request object with query parameters
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getOfferMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { timeRange, offerIds, minEPC } = req.query;

      const filters: DashboardFilters = {
        timeRange: (timeRange as 'last24h' | 'last7d' | 'last30d') || 'last7d',
        ...(offerIds && { offerIds: Array.isArray(offerIds) ? offerIds as string[] : [offerIds as string] }),
        ...(minEPC && { minEPC: parseFloat(minEPC as string) })
      };

      // Get full metrics and extract offer metrics
      const fullMetrics = await dashboardService.getDashboardMetrics(filters);
      
      const apiResponse: ApiResponse<typeof fullMetrics.offerMetrics> = {
        success: true,
        data: fullMetrics.offerMetrics,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get question performance metrics only
   * 
   * @param req - Request object with query parameters
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getQuestionMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { timeRange } = req.query;

      const filters: DashboardFilters = {
        timeRange: (timeRange as 'last24h' | 'last7d' | 'last30d') || 'last7d'
      };

      // Get full metrics and extract question metrics
      const fullMetrics = await dashboardService.getDashboardMetrics(filters);
      
      const apiResponse: ApiResponse<typeof fullMetrics.questionMetrics> = {
        success: true,
        data: fullMetrics.questionMetrics,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard summary statistics only
   * 
   * @param req - Request object with query parameters
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { timeRange, offerIds, minEPC } = req.query;

      const filters: DashboardFilters = {
        timeRange: (timeRange as 'last24h' | 'last7d' | 'last30d') || 'last7d',
        ...(offerIds && { offerIds: Array.isArray(offerIds) ? offerIds as string[] : [offerIds as string] }),
        ...(minEPC && { minEPC: parseFloat(minEPC as string) })
      };

      // Get full metrics and extract summary
      const fullMetrics = await dashboardService.getDashboardMetrics(filters);
      
      const apiResponse: ApiResponse<typeof fullMetrics.summary> = {
        success: true,
        data: fullMetrics.summary,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check for dashboard service
   * 
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function for error handling
   */
  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Test basic dashboard service functionality
      const testFilters: DashboardFilters = {
        timeRange: 'last24h'
      };
      
      await dashboardService.getDashboardMetrics(testFilters);
      
      const responseTime = Date.now() - startTime;
      
      const apiResponse: ApiResponse<{ status: string; responseTime: number }> = {
        success: true,
        data: {
          status: 'healthy',
          responseTime
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(apiResponse);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const dashboardController = new DashboardController();