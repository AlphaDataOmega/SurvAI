/**
 * @fileoverview Widget analytics service for tracking impressions and dwell time
 * 
 * Service for tracking widget load events and dwell time analytics,
 * providing aggregated metrics for dashboard display.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { ValidatedWidgetAnalyticsEvent } from '../validators/widgetAnalyticsValidator';

const prisma = new PrismaClient();

/**
 * Widget analytics aggregated data
 */
export interface WidgetAnalyticsAggregation {
  date: string;
  loadedCount: number;
  averageDwellTime: number;
  totalDwellTime: number;
  dwellEventCount: number;
}

/**
 * Widget analytics event stored in database
 */
export interface WidgetAnalyticsEvent {
  id: string;
  surveyId: string;
  event: 'loaded' | 'dwell';
  dwellTimeMs?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Widget analytics service class
 */
export class WidgetAnalyticsService {
  /**
   * Store a widget analytics event (loaded or dwell)
   * 
   * @param event - The analytics event to store
   * @returns Promise<WidgetAnalyticsEvent> - The stored event record
   */
  async storeEvent(event: ValidatedWidgetAnalyticsEvent): Promise<WidgetAnalyticsEvent> {
    try {
      // VALIDATION: Validate event data
      if (!event.surveyId || !event.event) {
        throw new Error('Missing required parameters: surveyId and event are required');
      }

      // VALIDATION: Validate event type and dwellTimeMs relationship
      if (event.event === 'dwell' && event.dwellTimeMs === undefined) {
        throw new Error('Dwell time is required for dwell events');
      }

      if (event.event === 'loaded' && event.dwellTimeMs !== undefined) {
        throw new Error('Dwell time should not be provided for loaded events');
      }

      // Store analytics event using transaction for atomic operation
      const analyticsRecord = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        return await tx.widgetAnalytics.create({
          data: {
            surveyId: event.surveyId,
            event: event.event,
            dwellTimeMs: event.dwellTimeMs || null,
            timestamp: new Date(),
            metadata: event.metadata || null
          }
        });
      });

      return {
        id: analyticsRecord.id,
        surveyId: analyticsRecord.surveyId,
        event: analyticsRecord.event as 'loaded' | 'dwell',
        dwellTimeMs: analyticsRecord.dwellTimeMs || undefined,
        timestamp: analyticsRecord.timestamp,
        metadata: analyticsRecord.metadata as Record<string, any> || undefined,
        createdAt: analyticsRecord.createdAt,
        updatedAt: analyticsRecord.updatedAt
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store widget analytics event: ${message}`);
    }
  }

  /**
   * Get widget analytics aggregated by date for last N days
   * 
   * @param surveyId - Optional survey ID to filter by
   * @param days - Number of days to aggregate (default: 7)
   * @returns Promise<WidgetAnalyticsAggregation[]> - Aggregated analytics data
   */
  async getLast7DaysAggregation(surveyId?: string, days: number = 7): Promise<WidgetAnalyticsAggregation[]> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      // Build where clause
      const whereClause: any = {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      };

      if (surveyId) {
        whereClause.surveyId = surveyId;
      }

      const analyticsData = await prisma.widgetAnalytics.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'desc'
        }
      });

      // Group by date and calculate aggregations
      const dateGroups = new Map<string, any>();
      
      for (const record of analyticsData) {
        const dateStr = record.timestamp.toISOString().split('T')[0];
        
        if (!dateGroups.has(dateStr)) {
          dateGroups.set(dateStr, {
            date: dateStr,
            loadedCount: 0,
            dwellTimes: [],
            dwellEventCount: 0
          });
        }
        
        const group = dateGroups.get(dateStr);
        if (record.event === 'loaded') {
          group.loadedCount++;
        } else if (record.event === 'dwell' && record.dwellTimeMs) {
          group.dwellTimes.push(record.dwellTimeMs);
          group.dwellEventCount++;
        }
      }

      // Convert to aggregation format
      const result = Array.from(dateGroups.values()).map(group => ({
        date: group.date,
        loadedCount: group.loadedCount,
        averageDwellTime: group.dwellTimes.length > 0 
          ? Math.round(group.dwellTimes.reduce((a: number, b: number) => a + b, 0) / group.dwellTimes.length)
          : 0,
        totalDwellTime: group.dwellTimes.reduce((a: number, b: number) => a + b, 0),
        dwellEventCount: group.dwellEventCount
      }));

      // Fill in missing dates with zero values
      const filledAggregation = this.fillMissingDates(result, startDate, endDate);

      return filledAggregation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get widget analytics aggregation: ${message}`);
    }
  }

  /**
   * Get widget analytics summary for a specific survey
   * 
   * @param surveyId - Survey ID to get summary for
   * @returns Promise<object> - Summary statistics
   */
  async getSurveySummary(surveyId: string): Promise<{
    totalLoaded: number;
    totalDwellEvents: number;
    averageDwellTime: number;
    totalDwellTime: number;
    lastLoaded: Date | null;
    lastDwell: Date | null;
  }> {
    try {
      const analytics = await prisma.widgetAnalytics.findMany({
        where: {
          surveyId
        },
        select: {
          event: true,
          dwellTimeMs: true,
          timestamp: true
        }
      });

      let totalLoaded = 0;
      let totalDwellEvents = 0;
      let totalDwellTime = 0;
      let lastLoaded: Date | null = null;
      let lastDwell: Date | null = null;

      for (const record of analytics) {
        if (record.event === 'loaded') {
          totalLoaded++;
          if (!lastLoaded || record.timestamp > lastLoaded) {
            lastLoaded = record.timestamp;
          }
        } else if (record.event === 'dwell') {
          totalDwellEvents++;
          if (record.dwellTimeMs) {
            totalDwellTime += record.dwellTimeMs;
          }
          if (!lastDwell || record.timestamp > lastDwell) {
            lastDwell = record.timestamp;
          }
        }
      }

      const avgDwellTime = totalDwellEvents > 0 ? totalDwellTime / totalDwellEvents : 0;

      const result = [{
        total_loaded: totalLoaded,
        total_dwell_events: totalDwellEvents,
        avg_dwell_time: avgDwellTime,
        total_dwell_time: totalDwellTime,
        last_loaded: lastLoaded,
        last_dwell: lastDwell
      }];

      const data = result[0];
      
      if (!data) {
        return {
          totalLoaded: 0,
          totalDwellEvents: 0,
          averageDwellTime: 0,
          totalDwellTime: 0,
          lastLoaded: null,
          lastDwell: null
        };
      }
      
      return {
        totalLoaded: Number(data.total_loaded),
        totalDwellEvents: Number(data.total_dwell_events),
        averageDwellTime: Math.round(data.avg_dwell_time || 0),
        totalDwellTime: Number(data.total_dwell_time),
        lastLoaded: data.last_loaded,
        lastDwell: data.last_dwell
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get survey summary: ${message}`);
    }
  }

  /**
   * Fill missing dates in aggregation with zero values
   * 
   * @param aggregation - Existing aggregation data
   * @param startDate - Start date
   * @param endDate - End date
   * @returns WidgetAnalyticsAggregation[] - Complete aggregation with all dates
   */
  private fillMissingDates(
    aggregation: WidgetAnalyticsAggregation[],
    startDate: Date,
    endDate: Date
  ): WidgetAnalyticsAggregation[] {
    const result: WidgetAnalyticsAggregation[] = [];
    const aggregationMap = new Map(aggregation.map(item => [item.date, item]));

    // Generate all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const existingData = aggregationMap.get(dateStr);
      if (existingData) {
        result.push(existingData);
      } else {
        result.push({
          date: dateStr,
          loadedCount: 0,
          averageDwellTime: 0,
          totalDwellTime: 0,
          dwellEventCount: 0
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result.reverse(); // Most recent first
  }
}

export default WidgetAnalyticsService;