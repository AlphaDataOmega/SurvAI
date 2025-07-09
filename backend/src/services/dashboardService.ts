/**
 * @fileoverview Dashboard service implementation
 * 
 * Service for aggregating dashboard metrics including offer performance,
 * question analytics, and summary statistics with real-time calculations.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { 
  DashboardMetrics, 
  DashboardSummary, 
  DashboardFilters,
  OfferPerformance,
  QuestionMetrics,
  AnalyticsTimeRange 
} from '@survai/shared';
import { calculateEPC, calculateEPCRanking } from '../utils/epcCalculator';
import { getDateDaysAgo } from '../utils/time';

const prisma = new PrismaClient();

/**
 * Dashboard service class for metrics aggregation and analytics
 */
export class DashboardService {
  /**
   * Get comprehensive dashboard metrics with aggregated data
   * 
   * @param filters - Dashboard filters for time range and offer selection
   * @returns Promise<DashboardMetrics> - Complete dashboard data
   */
  async getDashboardMetrics(filters: DashboardFilters): Promise<DashboardMetrics> {
    try {
      // PATTERN: Use transaction for consistent data snapshot like epcService
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Calculate time range
        const timeRange = this.getTimeRangeFromFilter(filters.timeRange);
        
        // Get aggregated metrics in parallel for performance
        const [offerMetrics, questionMetrics] = await Promise.all([
          this.aggregateOfferMetrics(filters, tx),
          this.aggregateQuestionMetrics(filters, tx)
        ]);
        
        // Calculate summary statistics
        const summary = this.calculateDashboardSummary(offerMetrics);
        
        return {
          offerMetrics,
          questionMetrics,
          timeRange,
          summary
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get dashboard metrics: ${message}`);
    }
  }

  /**
   * Aggregate offer performance metrics with EPC calculations
   * 
   * @param filters - Dashboard filters
   * @param tx - Prisma transaction client
   * @returns Promise<OfferPerformance[]> - Array of offer performance data
   */
  async aggregateOfferMetrics(
    filters: DashboardFilters, 
    tx: Prisma.TransactionClient
  ): Promise<OfferPerformance[]> {
    try {
      // PATTERN: Time filtering like epcService.calculateEPC()
      const timeRange = this.getDateRangeForFilter(filters.timeRange);
      
      // Build where clause for offers
      const offerWhereClause: { status: string; id?: { in: string[] } } = {
        status: 'ACTIVE'
      };
      
      if (filters.offerIds && filters.offerIds.length > 0) {
        offerWhereClause.id = { in: filters.offerIds };
      }
      
      // PATTERN: Prisma aggregation like epcService with includes
      const offersWithClicks = await tx.offer.findMany({
        where: offerWhereClause,
        include: {
          clicks: {
            where: {
              clickedAt: { gte: timeRange }
            },
            select: {
              converted: true,
              revenue: true,
              clickedAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // PATTERN: EPC calculation using existing utility like epcService
      const offerMetrics = offersWithClicks.map((offer: any) => {
        const clicks = offer.clicks;
        const totalClicks = clicks.length;
        const totalConversions = clicks.filter((c: any) => c.converted).length;
        const totalRevenue = clicks.reduce((sum: number, c: any) => {
          return sum + (c.converted && c.revenue ? Number(c.revenue) : 0);
        }, 0);
        
        const epcMetrics = calculateEPC(totalClicks, totalConversions, totalRevenue);
        
        const performance: OfferPerformance = {
          offerId: offer.id,
          title: offer.title,
          category: offer.category,
          status: offer.status,
          rank: 0, // Will be calculated later
          ...epcMetrics
        };
        
        return performance;
      });
      
      // Filter by minimum EPC if specified
      const filteredMetrics = filters.minEPC 
        ? offerMetrics.filter((m: any) => m.epc >= filters.minEPC!)
        : offerMetrics;
      
      // PATTERN: Ranking using existing utility
      return calculateEPCRanking(filteredMetrics);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to aggregate offer metrics: ${message}`);
    }
  }

  /**
   * Aggregate question performance metrics
   * 
   * @param filters - Dashboard filters
   * @param tx - Prisma transaction client
   * @returns Promise<QuestionMetrics[]> - Array of question metrics
   */
  async aggregateQuestionMetrics(
    filters: DashboardFilters,
    tx: Prisma.TransactionClient
  ): Promise<QuestionMetrics[]> {
    try {
      const timeRange = this.getDateRangeForFilter(filters.timeRange);
      
      // Get questions with associated click data
      const questionsWithData = await tx.question.findMany({
        include: {
          answers: {
            where: {
              answeredAt: { gte: timeRange }
            },
            include: {
              response: {
                include: {
                  clicks: true
                }
              }
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      });
      
      // Calculate question metrics
      const questionMetrics = await Promise.all(
        questionsWithData.map(async (question: any) => {
          // Count impressions (question views)
          const impressions = question.answers.length;
          
          // Count button clicks from associated responses
          const buttonClicks = question.answers.reduce((sum: number, answer: any) => {
            return sum + (answer.response?.clicks?.length || 0);
          }, 0);
          
          // Calculate skip rate (simplified - questions without answers)
          const skips = Math.max(0, impressions - buttonClicks);
          const skipRate = impressions > 0 ? (skips / impressions) * 100 : 0;
          const clickThroughRate = impressions > 0 ? (buttonClicks / impressions) * 100 : 0;
          
          // Calculate average EPC from linked offers (using existing epcService pattern)
          let averageEPC = 0;
          try {
            // Import epcService dynamically to avoid circular dependency
            const { epcService } = await import('./epcService');
            averageEPC = await epcService.getQuestionEPC(question.id);
          } catch (error) {
            console.warn(`Failed to get EPC for question ${question.id}:`, error);
          }
          
          const metrics: QuestionMetrics = {
            questionId: question.id,
            text: question.text,
            impressions,
            buttonClicks,
            skips,
            skipRate: Math.round(skipRate * 100) / 100,
            clickThroughRate: Math.round(clickThroughRate * 100) / 100,
            averageEPC: Math.round(averageEPC * 100) / 100
          };
          
          return metrics;
        })
      );
      
      return questionMetrics;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to aggregate question metrics: ${message}`);
    }
  }

  /**
   * Calculate dashboard summary statistics
   * 
   * @param offerMetrics - Array of offer performance data
   * @returns DashboardSummary - Summary statistics
   */
  calculateDashboardSummary(offerMetrics: OfferPerformance[]): DashboardSummary {
    const totalOffers = offerMetrics.length;
    const totalClicks = offerMetrics.reduce((sum, offer) => sum + offer.totalClicks, 0);
    const totalConversions = offerMetrics.reduce((sum, offer) => sum + offer.totalConversions, 0);
    const totalRevenue = offerMetrics.reduce((sum, offer) => sum + offer.totalRevenue, 0);
    
    // Calculate average EPC across all offers
    const averageEPC = totalOffers > 0 
      ? offerMetrics.reduce((sum, offer) => sum + offer.epc, 0) / totalOffers 
      : 0;
    
    // Find top performing offer
    const topPerformingOffer = offerMetrics.length > 0 
      ? offerMetrics.reduce((top, current) => current.epc > top.epc ? current : top)
      : null;
    
    return {
      totalOffers,
      totalClicks,
      totalConversions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageEPC: Math.round(averageEPC * 100) / 100,
      topPerformingOffer
    };
  }

  /**
   * Convert filter time range to Date object
   * 
   * @param timeRange - Time range filter
   * @returns Date - Start date for filtering
   */
  private getDateRangeForFilter(timeRange: 'last24h' | 'last7d' | 'last30d'): Date {
    // PATTERN: Use existing getDateDaysAgo utility like epcService
    switch (timeRange) {
      case 'last24h':
        return getDateDaysAgo(1);
      case 'last7d':
        return getDateDaysAgo(7);
      case 'last30d':
        return getDateDaysAgo(30);
      default:
        return getDateDaysAgo(7); // Default to 7 days
    }
  }

  /**
   * Convert filter time range to AnalyticsTimeRange object
   * 
   * @param timeRange - Time range filter
   * @returns AnalyticsTimeRange - Time range object for response
   */
  private getTimeRangeFromFilter(timeRange: 'last24h' | 'last7d' | 'last30d'): AnalyticsTimeRange {
    const endDate = new Date();
    const startDate = this.getDateRangeForFilter(timeRange);
    
    return {
      startDate,
      endDate,
      range: timeRange === 'last24h' ? 'today' : 
             timeRange === 'last7d' ? 'last7days' : 
             'last30days'
    };
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();