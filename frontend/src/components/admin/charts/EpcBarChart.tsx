/**
 * @fileoverview EPC Bar Chart component for dashboard visualization
 * 
 * Interactive bar chart displaying EPC (Earnings Per Click) performance
 * for offers using Recharts library with responsive design.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { OfferPerformance, DashboardChartData } from '@survai/shared';

interface EpcBarChartProps {
  /** Array of offer performance data */
  data: OfferPerformance[];
  /** Loading state */
  loading?: boolean;
  /** Chart height in pixels */
  height?: number;
  /** Chart title */
  title?: string;
  /** Maximum number of offers to display */
  maxOffers?: number;
}

/**
 * EPC Bar Chart component with responsive design and interactive tooltips
 */
export const EpcBarChart: React.FC<EpcBarChartProps> = ({ 
  data, 
  loading = false, 
  height = 300,
  title = "EPC Performance by Offer",
  maxOffers = 10
}) => {
  // PATTERN: Early return for loading state like OfferMetrics.tsx
  if (loading) {
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
          <div style={{ marginBottom: '0.5rem' }}>Loading chart...</div>
          <div style={{ fontSize: '0.875rem' }}>Fetching EPC data</div>
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
          <div style={{ marginBottom: '0.5rem' }}>No data available</div>
          <div style={{ fontSize: '0.875rem' }}>No offers found for the selected time range</div>
        </div>
      </div>
    );
  }

  // PATTERN: Data transformation for Recharts like PRP pseudocode
  const chartData: DashboardChartData[] = data
    .slice(0, maxOffers) // Limit number of offers
    .map(offer => ({
      name: offer.title.length > 20 ? offer.title.substring(0, 17) + '...' : offer.title, // Truncate for display
      epc: offer.epc,
      clicks: offer.totalClicks,
      conversions: offer.totalConversions,
      revenue: offer.totalRevenue,
      offerId: offer.offerId
    }));

  // Color scheme for bars based on EPC performance
  const getBarColor = (epc: number): string => {
    if (epc >= 5) return '#38a169'; // Green for high EPC
    if (epc >= 2) return '#3182ce'; // Blue for medium EPC
    if (epc >= 1) return '#d69e2e'; // Orange for low EPC
    return '#e53e3e'; // Red for very low EPC
  };

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
          <div style={{ color: '#38a169', marginBottom: '0.25rem' }}>
            EPC: ${data.epc.toFixed(2)}
          </div>
          <div style={{ color: '#2b6cb0', marginBottom: '0.25rem' }}>
            Clicks: {data.clicks.toLocaleString()}
          </div>
          <div style={{ color: '#38a169', marginBottom: '0.25rem' }}>
            Conversions: {data.conversions.toLocaleString()}
          </div>
          <div style={{ color: '#38a169' }}>
            Revenue: ${data.revenue.toFixed(2)}
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

      {/* Chart Container */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
        padding: '1rem'
      }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
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
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#718096' }}
              stroke="#cbd5e0"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#718096' }}
              stroke="#cbd5e0"
              label={{ 
                value: 'EPC ($)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#718096' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="epc" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.epc)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div style={{
        marginTop: '1rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        fontSize: '0.75rem',
        color: '#718096'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#38a169', borderRadius: '2px' }}></div>
          High (≥$5)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#3182ce', borderRadius: '2px' }}></div>
          Medium ($2-$5)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#d69e2e', borderRadius: '2px' }}></div>
          Low ($1-$2)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#e53e3e', borderRadius: '2px' }}></div>
          Very Low (&lt;$1)
        </div>
      </div>

      {/* Data Summary */}
      <div style={{
        marginTop: '0.75rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#718096'
      }}>
        Showing {Math.min(data.length, maxOffers)} of {data.length} offers
        {data.length > maxOffers && ' (top performers)'}
      </div>
    </div>
  );
};