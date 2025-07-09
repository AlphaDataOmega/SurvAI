/**
 * @fileoverview Analytics and EPC calculation types
 * 
 * Types for managing EPC calculations, offer performance tracking,
 * and analytics data in the SurvAI system.
 */

/**
 * Core EPC metrics for offer performance
 */
export interface EPCMetrics {
  /** Total number of clicks */
  totalClicks: number;
  /** Total number of conversions */
  totalConversions: number;
  /** Total revenue generated */
  totalRevenue: number;
  /** Conversion rate (conversions/clicks * 100) */
  conversionRate: number;
  /** Earnings per click */
  epc: number;
  /** When metrics were last updated */
  lastUpdated: Date;
}

/**
 * Offer performance data with ranking
 */
export interface OfferPerformance extends EPCMetrics {
  /** Offer identifier */
  offerId: string;
  /** Offer title */
  title: string;
  /** Performance rank (higher EPC = lower rank number) */
  rank: number;
  /** Offer category */
  category?: string;
  /** Offer status */
  status?: string;
}

/**
 * Question performance metrics
 */
export interface QuestionMetrics {
  /** Question identifier */
  questionId: string;
  /** Question text */
  text: string;
  /** Number of times question was shown */
  impressions: number;
  /** Number of times buttons were clicked */
  buttonClicks: number;
  /** Number of times question was skipped */
  skips: number;
  /** Skip rate (skips / impressions * 100) */
  skipRate: number;
  /** Click-through rate (buttonClicks / impressions * 100) */
  clickThroughRate: number;
  /** Average EPC of associated offers */
  averageEPC: number;
}

/**
 * Survey-level analytics
 */
export interface SurveyAnalytics {
  /** Survey identifier */
  surveyId: string;
  /** Survey title */
  title: string;
  /** Total survey sessions */
  totalSessions: number;
  /** Completed surveys */
  completedSurveys: number;
  /** Completion rate */
  completionRate: number;
  /** Total revenue from survey */
  totalRevenue: number;
  /** Average revenue per session */
  revenuePerSession: number;
  /** Question metrics */
  questionMetrics: QuestionMetrics[];
  /** Offer performance */
  offerPerformance: OfferPerformance[];
}

/**
 * Real-time analytics update event
 */
export interface AnalyticsUpdate {
  /** Type of update */
  type: 'CLICK' | 'CONVERSION' | 'EPC_UPDATE';
  /** Affected offer ID */
  offerId: string;
  /** Updated metrics */
  metrics: EPCMetrics;
  /** Timestamp of update */
  timestamp: Date;
}

/**
 * Analytics time range filter
 */
export interface AnalyticsTimeRange {
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
  /** Predefined range */
  range?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth';
}

/**
 * Analytics filter options
 */
export interface AnalyticsFilters {
  /** Time range */
  timeRange?: AnalyticsTimeRange;
  /** Filter by offer IDs */
  offerIds?: string[];
  /** Filter by offer categories */
  categories?: string[];
  /** Filter by survey IDs */
  surveyIds?: string[];
  /** Minimum EPC threshold */
  minEPC?: number;
  /** Minimum clicks threshold */
  minClicks?: number;
}