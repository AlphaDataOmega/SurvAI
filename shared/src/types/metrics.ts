/**
 * @fileoverview Dashboard metrics and analytics types
 * 
 * Types for managing dashboard-specific metrics, aggregations,
 * and analytics data in the SurvAI admin dashboard system.
 */

import type { OfferPerformance, QuestionMetrics, AnalyticsTimeRange } from './analytics';

/**
 * Dashboard metrics aggregation with offer and question performance
 */
export interface DashboardMetrics {
  /** Array of offer performance metrics */
  offerMetrics: OfferPerformance[];
  /** Array of question performance metrics */
  questionMetrics: QuestionMetrics[];
  /** Time range for the metrics */
  timeRange: AnalyticsTimeRange;
  /** Summary statistics for the dashboard */
  summary: DashboardSummary;
}

/**
 * Dashboard summary statistics
 */
export interface DashboardSummary {
  /** Total number of active offers */
  totalOffers: number;
  /** Total clicks across all offers */
  totalClicks: number;
  /** Total conversions across all offers */
  totalConversions: number;
  /** Total revenue across all offers */
  totalRevenue: number;
  /** Average EPC across all offers */
  averageEPC: number;
  /** Top performing offer by EPC */
  topPerformingOffer: OfferPerformance | null;
}

/**
 * Dashboard filters for data aggregation
 */
export interface DashboardFilters {
  /** Time range filter */
  timeRange: 'last24h' | 'last7d' | 'last30d';
  /** Filter by specific offer IDs */
  offerIds?: string[];
  /** Minimum EPC threshold for filtering */
  minEPC?: number;
}

/**
 * Dashboard API request parameters
 */
export interface DashboardMetricsRequest {
  /** Time range for metrics */
  timeRange?: 'last24h' | 'last7d' | 'last30d';
  /** Filter by offer IDs */
  offerIds?: string[];
  /** Minimum EPC filter */
  minEPC?: number;
}

/**
 * Dashboard chart data point for EPC visualization
 */
export interface DashboardChartData {
  /** Offer name (truncated for display) */
  name: string;
  /** EPC value */
  epc: number;
  /** Total clicks */
  clicks: number;
  /** Total conversions */
  conversions: number;
  /** Total revenue */
  revenue: number;
  /** Offer ID for reference */
  offerId: string;
}

/**
 * Dashboard time range utility type
 */
export type DashboardTimeRange = 'last24h' | 'last7d' | 'last30d';

/**
 * Dashboard performance summary card data
 */
export interface DashboardCard {
  /** Card title */
  title: string;
  /** Primary value to display */
  value: string | number;
  /** Change from previous period */
  change?: number;
  /** Change percentage */
  changePercent?: number;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Card color theme */
  color?: 'green' | 'blue' | 'orange' | 'red' | 'gray';
}