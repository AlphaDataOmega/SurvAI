/**
 * @fileoverview Dashboard API service client
 * 
 * Service for making dashboard API requests including
 * metrics aggregation and performance analytics.
 */

import type { 
  ApiResponse, 
  DashboardMetrics, 
  DashboardMetricsRequest,
  OfferPerformance,
  QuestionMetrics,
  DashboardSummary
} from '@survai/shared';
import { api } from './api';

/**
 * Dashboard service class for API interactions
 */
export class DashboardService {
  /**
   * Get comprehensive dashboard metrics
   * 
   * @param params - Dashboard metrics request parameters
   * @returns Promise<DashboardMetrics> - Complete dashboard data
   */
  async getDashboardMetrics(params: DashboardMetricsRequest = {}): Promise<DashboardMetrics> {
    try {
      const response = await api.get<ApiResponse<DashboardMetrics>>('/api/dashboard/metrics', params);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch dashboard metrics');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('Dashboard metrics fetch failed:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  /**
   * Get offer performance metrics only
   * 
   * @param params - Dashboard request parameters
   * @returns Promise<OfferPerformance[]> - Array of offer performance data
   */
  async getOfferMetrics(params: DashboardMetricsRequest = {}): Promise<OfferPerformance[]> {
    try {
      const response = await api.get<ApiResponse<OfferPerformance[]>>('/api/dashboard/offers', params);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch offer metrics');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('Offer metrics fetch failed:', error);
      throw new Error('Failed to fetch offer metrics');
    }
  }

  /**
   * Get question performance metrics only
   * 
   * @param params - Dashboard request parameters
   * @returns Promise<QuestionMetrics[]> - Array of question metrics
   */
  async getQuestionMetrics(params: Pick<DashboardMetricsRequest, 'timeRange'> = {}): Promise<QuestionMetrics[]> {
    try {
      const response = await api.get<ApiResponse<QuestionMetrics[]>>('/api/dashboard/questions', params);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch question metrics');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('Question metrics fetch failed:', error);
      throw new Error('Failed to fetch question metrics');
    }
  }

  /**
   * Get dashboard summary statistics only
   * 
   * @param params - Dashboard request parameters
   * @returns Promise<DashboardSummary> - Summary statistics
   */
  async getDashboardSummary(params: DashboardMetricsRequest = {}): Promise<DashboardSummary> {
    try {
      const response = await api.get<ApiResponse<DashboardSummary>>('/api/dashboard/summary', params);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch dashboard summary');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('Dashboard summary fetch failed:', error);
      throw new Error('Failed to fetch dashboard summary');
    }
  }

  /**
   * Health check for dashboard service
   * 
   * @returns Promise<{ status: string; responseTime: number }> - Health status
   */
  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    try {
      const response = await api.get<ApiResponse<{ status: string; responseTime: number }>>('/api/dashboard/health');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Dashboard health check failed');
      }
      
      return response.data.data!;
    } catch (error) {
      console.error('Dashboard health check failed:', error);
      throw new Error('Dashboard health check failed');
    }
  }

  /**
   * Retry wrapper for dashboard requests with exponential backoff
   * 
   * @param fn - Function to retry
   * @param maxRetries - Maximum number of retries
   * @returns Promise<T> - Result of function
   */
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Get dashboard metrics with retry logic
   * 
   * @param params - Dashboard metrics request parameters
   * @returns Promise<DashboardMetrics> - Complete dashboard data
   */
  async getDashboardMetricsWithRetry(params: DashboardMetricsRequest = {}): Promise<DashboardMetrics> {
    return this.withRetry(() => this.getDashboardMetrics(params));
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;