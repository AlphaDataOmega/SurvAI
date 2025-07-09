/**
 * @fileoverview Admin Dashboard component for metrics and analytics
 * 
 * Main dashboard interface displaying offer performance, question metrics,
 * and summary statistics with real-time updates and filtering capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { DashboardMetrics, DashboardTimeRange } from '@survai/shared';
import { dashboardService } from '../../services/dashboard';
import { EpcBarChart } from './charts/EpcBarChart';
import { WidgetImpressionsTile } from './metrics/WidgetImpressionsTile';
import { ChatPanel } from './chat/ChatPanel';

/**
 * Dashboard summary card component
 */
interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'blue' | 'orange' | 'red' | 'gray';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  change, 
  changePercent, 
  trend = 'neutral',
  color = 'blue' 
}) => {
  const colorStyles = {
    green: { bg: '#f0fff4', border: '#9ae6b4', text: '#38a169' },
    blue: { bg: '#ebf8ff', border: '#90cdf4', text: '#3182ce' },
    orange: { bg: '#fffaf0', border: '#fbb6ce', text: '#d69e2e' },
    red: { bg: '#fed7d7', border: '#fc8181', text: '#e53e3e' },
    gray: { bg: '#f7fafc', border: '#cbd5e0', text: '#4a5568' }
  };

  const style = colorStyles[color];

  return (
    <div style={{
      backgroundColor: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '0.5rem',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        color: style.text,
        marginBottom: '0.25rem'
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.5rem' }}>
        {title}
      </div>
      {change !== undefined && changePercent !== undefined && (
        <div style={{ 
          fontSize: '0.75rem',
          color: trend === 'up' ? '#38a169' : trend === 'down' ? '#e53e3e' : '#718096'
        }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(changePercent).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

/**
 * Main Dashboard component
 */
export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>('last7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  /**
   * Fetch dashboard metrics from API
   */
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getDashboardMetrics({ timeRange });
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  /**
   * Auto-refresh metrics every 30 seconds
   * PATTERN: Auto-refresh with cleanup like OfferMetrics.tsx
   */
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30 second refresh
    return () => clearInterval(interval); // CRITICAL: Cleanup to prevent memory leaks
  }, [fetchMetrics]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleTimeString();

  // Time range filter options
  const timeRangeOptions: { value: DashboardTimeRange; label: string }[] = [
    { value: 'last24h', label: 'Last 24h' },
    { value: 'last7d', label: 'Last 7d' },
    { value: 'last30d', label: 'Last 30d' }
  ];

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        backgroundColor: '#fed7d7',
        borderRadius: '0.5rem',
        border: '1px solid #fc8181',
        color: '#c53030'
      }}>
        <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Error Loading Dashboard</div>
        <div style={{ marginBottom: '1rem' }}>{error}</div>
        <button
          onClick={fetchMetrics}
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
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }} data-testid="admin-dashboard">
      {/* Main Dashboard Content */}
      <div style={{ 
        flex: 1,
        padding: '1.5rem', 
        maxWidth: isChatMinimized ? '1200px' : '800px', 
        margin: '0 auto',
        transition: 'max-width 0.3s ease'
      }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#2d3748', margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#718096', margin: '0.5rem 0 0 0' }}>
            Real-time metrics and performance analytics
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Time Range Filter */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {timeRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${timeRange === option.value ? '#3182ce' : '#e2e8f0'}`,
                  backgroundColor: timeRange === option.value ? '#3182ce' : 'white',
                  color: timeRange === option.value ? 'white' : '#4a5568',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: timeRange === option.value ? '600' : '400'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={fetchMetrics}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: loading ? '#e2e8f0' : '#38a169',
              color: loading ? '#718096' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {metrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }} data-testid="metrics-chart">
          <DashboardCard
            title="Total Offers"
            value={metrics.summary.totalOffers}
            color="blue"
          />
          <DashboardCard
            title="Total Clicks"
            value={metrics.summary.totalClicks}
            color="blue"
          />
          <DashboardCard
            title="Total Conversions"
            value={metrics.summary.totalConversions}
            color="green"
          />
          <DashboardCard
            title="Total Revenue"
            value={formatCurrency(metrics.summary.totalRevenue)}
            color="green"
          />
          <DashboardCard
            title="Average EPC"
            value={formatCurrency(metrics.summary.averageEPC)}
            color={metrics.summary.averageEPC >= 2 ? 'green' : 
                  metrics.summary.averageEPC >= 1 ? 'orange' : 'red'}
          />
        </div>
      )}

      {/* EPC Performance Chart */}
      <div style={{ marginBottom: '2rem' }}>
        <EpcBarChart 
          data={metrics?.offerMetrics || []}
          loading={loading}
          height={400}
          title="EPC Performance by Offer"
          maxOffers={10}
        />
      </div>

      {/* Widget Impressions Tile */}
      <div style={{ marginBottom: '2rem' }}>
        <WidgetImpressionsTile 
          loading={loading}
          height={300}
          title="Widget Impressions (Last 7 Days)"
          days={7}
          refreshInterval={30}
        />
      </div>

      {/* Offers Table */}
      {metrics && metrics.offerMetrics.length > 0 && (
        <div style={{ marginBottom: '2rem' }} data-testid="offer-metrics">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Offer Performance Details
          </h3>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto auto auto',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#f7fafc',
              borderBottom: '1px solid #e2e8f0',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: '#4a5568'
            }}>
              <div>Offer</div>
              <div style={{ textAlign: 'right' }}>Rank</div>
              <div style={{ textAlign: 'right' }}>EPC</div>
              <div style={{ textAlign: 'right' }}>Clicks</div>
              <div style={{ textAlign: 'right' }}>Conversions</div>
              <div style={{ textAlign: 'right' }}>Revenue</div>
            </div>
            {metrics.offerMetrics.slice(0, 5).map((offer) => (
              <div
                key={offer.offerId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto auto',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.875rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{offer.title}</div>
                  <div style={{ color: '#718096', fontSize: '0.75rem' }}>
                    {offer.category} • {offer.status}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: '600' }}>#{offer.rank}</div>
                <div style={{ 
                  textAlign: 'right',
                  color: offer.epc >= 2 ? '#38a169' : offer.epc >= 1 ? '#d69e2e' : '#e53e3e',
                  fontWeight: '600'
                }}>
                  {formatCurrency(offer.epc)}
                </div>
                <div style={{ textAlign: 'right' }}>{offer.totalClicks.toLocaleString()}</div>
                <div style={{ textAlign: 'right' }}>{offer.totalConversions.toLocaleString()}</div>
                <div style={{ textAlign: 'right' }}>{formatCurrency(offer.totalRevenue)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e8f0',
        fontSize: '0.875rem',
        color: '#718096'
      }}>
        <div>
          Last updated: {formatDate(lastUpdated)}
        </div>
        <div>
          Auto-refresh every 30 seconds
        </div>
        </div>
      </div>

      {/* Chat Panel Sidebar */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000
      }}>
        <ChatPanel
          onToggleMinimize={(minimized) => setIsChatMinimized(minimized)}
          onClearHistory={() => {
            // Optional: Add analytics tracking for chat clear events
            // TODO: Add proper analytics tracking here
          }}
        />
      </div>
    </div>
  );
};