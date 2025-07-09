/**
 * @fileoverview EPC (Earnings Per Click) calculation utility
 * 
 * Pure functions for calculating EPC metrics, conversion rates,
 * and performance statistics for affiliate offers.
 */

import type { EPCMetrics } from '@survai/shared';

/**
 * Calculate EPC metrics from click and revenue data
 * 
 * @param totalClicks - Total number of clicks
 * @param totalConversions - Total number of conversions  
 * @param totalRevenue - Total revenue generated
 * @returns EPCMetrics object with calculated values
 */
export function calculateEPC(
  totalClicks: number, 
  totalConversions: number, 
  totalRevenue: number
): EPCMetrics {
  // CRITICAL: Handle division by zero
  const epc = totalClicks > 0 ? totalRevenue / totalClicks : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  
  return {
    totalClicks,
    totalConversions,
    totalRevenue,
    epc: Math.round(epc * 100) / 100, // Round to 2 decimals
    conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimals
    lastUpdated: new Date()
  };
}

/**
 * Calculate EPC metrics from raw click tracking data
 * 
 * @param clickData - Array of click tracking records
 * @returns EPCMetrics object with calculated values
 */
export function calculateEPCFromClicks(clickData: Array<{
  converted: boolean;
  revenue?: number | null;
}>): EPCMetrics {
  const totalClicks = clickData.length;
  const totalConversions = clickData.filter(click => click.converted).length;
  const totalRevenue = clickData.reduce((sum, click) => {
    return sum + (click.converted && click.revenue ? Number(click.revenue) : 0);
  }, 0);
  
  return calculateEPC(totalClicks, totalConversions, totalRevenue);
}

/**
 * Update existing EPC metrics with new click data
 * 
 * @param currentMetrics - Current EPC metrics
 * @param newClicks - Number of new clicks to add
 * @param newConversions - Number of new conversions to add
 * @param newRevenue - New revenue to add
 * @returns Updated EPCMetrics object
 */
export function updateEPCMetrics(
  currentMetrics: EPCMetrics,
  newClicks: number,
  newConversions: number,
  newRevenue: number
): EPCMetrics {
  const totalClicks = currentMetrics.totalClicks + newClicks;
  const totalConversions = currentMetrics.totalConversions + newConversions;
  const totalRevenue = currentMetrics.totalRevenue + newRevenue;
  
  return calculateEPC(totalClicks, totalConversions, totalRevenue);
}

/**
 * Compare two EPC values and return performance delta
 * 
 * @param currentEPC - Current EPC value
 * @param previousEPC - Previous EPC value  
 * @returns Performance delta object
 */
export function calculateEPCDelta(currentEPC: number, previousEPC: number): {
  delta: number;
  percentage: number;
  trend: 'up' | 'down' | 'flat';
} {
  const delta = currentEPC - previousEPC;
  const percentage = previousEPC > 0 ? (delta / previousEPC) * 100 : 0;
  
  let trend: 'up' | 'down' | 'flat';
  if (Math.abs(delta) < 0.01) {
    trend = 'flat';
  } else if (delta > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }
  
  return {
    delta: Math.round(delta * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    trend
  };
}

/**
 * Validate EPC metrics for data integrity
 * 
 * @param metrics - EPC metrics to validate
 * @returns true if metrics are valid, throws error if invalid
 */
export function validateEPCMetrics(metrics: EPCMetrics): boolean {
  if (metrics.totalClicks < 0 || metrics.totalConversions < 0 || metrics.totalRevenue < 0) {
    throw new Error('EPC metrics cannot have negative values');
  }
  
  if (metrics.totalConversions > metrics.totalClicks) {
    throw new Error('Conversions cannot exceed total clicks');
  }
  
  if (metrics.conversionRate < 0 || metrics.conversionRate > 100) {
    throw new Error('Conversion rate must be between 0 and 100');
  }
  
  if (metrics.epc < 0) {
    throw new Error('EPC cannot be negative');
  }
  
  return true;
}

/**
 * Calculate performance rank based on EPC value
 * Higher EPC gets lower rank number (1 = best)
 * 
 * @param offers - Array of offers with EPC values
 * @returns Array of offers with rank assigned
 */
export function calculateEPCRanking<T extends { epc: number }>(offers: T[]): (T & { rank: number })[] {
  return offers
    .sort((a, b) => b.epc - a.epc) // Sort by EPC descending
    .map((offer, index) => ({
      ...offer,
      rank: index + 1
    }));
}