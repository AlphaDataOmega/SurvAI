/**
 * @fileoverview Widget Impressions Tile component for dashboard visualization
 * 
 * Interactive line chart displaying widget impressions over time
 * with auto-refresh functionality and responsive design.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

/**
 * Widget analytics aggregation data structure
 */
interface WidgetAnalyticsAggregation {
  date: string;
  loadedCount: number;
  averageDwellTime: number;
  totalDwellTime: number;
  dwellEventCount: number;
}

interface WidgetImpressionsTileProps {
  /** Optional survey ID to filter data */
  surveyId?: string;
  /** Loading state */
  loading?: boolean;
  /** Chart height in pixels */
  height?: number;
  /** Chart title */
  title?: string;
  /** Number of days to display */
  days?: number;
  /** Auto-refresh interval in seconds */
  refreshInterval?: number;
}

/**
 * Widget Impressions Tile component with real-time updates
 */
export const WidgetImpressionsTile: React.FC<WidgetImpressionsTileProps> = ({
  surveyId,
  loading = false,
  height = 300,
  title = "Widget Impressions (Last 7 Days)",
  days = 7,
  refreshInterval = 30
}) => {
  const [data, setData] = useState<WidgetAnalyticsAggregation[]>([]);
  const [isLoading, setIsLoading] = useState(loading);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  /**
   * Fetch widget analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (surveyId) {
        params.append('surveyId', surveyId);
      }
      if (days) {
        params.append('days', days.toString());
      }
      
      const queryString = params.toString();
      const url = `/api/widget/analytics/aggregation${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch widget analytics');
      }
      
      if (result.success && result.data) {
        setData(result.data.aggregation || []);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch widget analytics:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [surveyId, days]);

  /**
   * Set up auto-refresh functionality
   */
  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, refreshInterval * 1000);
    return () => clearInterval(interval); // CRITICAL: Cleanup to prevent memory leaks
  }, [fetchAnalytics, refreshInterval]);

  // PATTERN: Early return for loading state like EpcBarChart.tsx
  if (isLoading && data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center', color: '#718096' }}>
          <div style={{ marginBottom: '0.5rem' }}>Loading widget analytics...</div>
          <div style={{ fontSize: '0.875rem' }}>Fetching impression data</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fed7d7',
        borderRadius: '0.5rem',
        border: '1px solid #fc8181'
      }}>
        <div style={{ textAlign: 'center', color: '#c53030' }}>
          <div style={{ marginBottom: '0.5rem' }}>Error loading analytics</div>
          <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
          <button
            onClick={fetchAnalytics}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center', color: '#718096' }}>
          <div style={{ marginBottom: '0.5rem' }}>No widget impressions found</div>
          <div style={{ fontSize: '0.875rem' }}>No data available for the selected time range</div>
        </div>
      </div>
    );
  }

  // PATTERN: Data transformation for Recharts like EpcBarChart.tsx
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    impressions: item.loadedCount,
    dwellTime: item.averageDwellTime,
    dwellEvents: item.dwellEventCount,
    fullDate: item.date
  }));

  // Calculate summary statistics
  const totalImpressions = data.reduce((sum, item) => sum + item.loadedCount, 0);
  const totalDwellEvents = data.reduce((sum, item) => sum + item.dwellEventCount, 0);
  const avgDwellTime = totalDwellEvents > 0 
    ? data.reduce((sum, item) => sum + item.totalDwellTime, 0) / totalDwellEvents 
    : 0;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{label}</div>
          <div style={{ color: '#3182ce', marginBottom: '0.25rem' }}>
            Impressions: {data.impressions.toLocaleString()}
          </div>
          <div style={{ color: '#38a169', marginBottom: '0.25rem' }}>
            Dwell Events: {data.dwellEvents.toLocaleString()}
          </div>
          <div style={{ color: '#d69e2e' }}>
            Avg Dwell Time: {Math.round(data.dwellTime)}ms
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Chart Title */}
      {title && (
        <div style={{
          marginBottom: '1rem',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#2d3748'
        }}>
          {title}
        </div>
      )}

      {/* Summary Statistics */}
      <div style={{
        marginBottom: '1rem',
        display: 'flex',
        gap: '1rem',
        fontSize: '0.875rem'
      }}>
        <div style={{
          backgroundColor: '#ebf8ff',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          flex: 1,
          textAlign: 'center'
        }}>
          <div style={{ color: '#3182ce', fontWeight: '600' }}>
            {totalImpressions.toLocaleString()}
          </div>
          <div style={{ color: '#718096' }}>Total Impressions</div>
        </div>
        <div style={{
          backgroundColor: '#f0fff4',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          flex: 1,
          textAlign: 'center'
        }}>
          <div style={{ color: '#38a169', fontWeight: '600' }}>
            {totalDwellEvents.toLocaleString()}
          </div>
          <div style={{ color: '#718096' }}>Dwell Events</div>
        </div>
        <div style={{
          backgroundColor: '#fffaf0',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          flex: 1,
          textAlign: 'center'
        }}>
          <div style={{ color: '#d69e2e', fontWeight: '600' }}>
            {Math.round(avgDwellTime)}ms
          </div>
          <div style={{ color: '#718096' }}>Avg Dwell Time</div>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
        padding: '1rem',
        position: 'relative'
      }}>
        {/* Loading indicator overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.5rem',
            zIndex: 1
          }}>
            <div style={{ color: '#718096', fontSize: '0.875rem' }}>
              Refreshing...
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#718096' }}
              stroke="#cbd5e0"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#718096' }}
              stroke="#cbd5e0"
              label={{ 
                value: 'Impressions', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#718096' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="impressions" 
              stroke="#3182ce" 
              strokeWidth={3}
              dot={{ fill: '#3182ce', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#3182ce' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with last updated time */}
      <div style={{
        marginTop: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#718096'
      }}>
        <div>
          Showing {chartData.length} days of data
        </div>
        <div>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};