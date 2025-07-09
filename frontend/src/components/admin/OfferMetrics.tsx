/**
 * @fileoverview Offer Metrics component for detailed EPC display
 * 
 * Displays detailed performance metrics for a specific offer including
 * EPC, conversion rates, revenue, and click tracking data.
 */

import React, { useState, useEffect } from 'react';
import type { Offer, EPCMetrics } from '@survai/shared';
import { trackingService } from '../../services/tracking';

interface OfferMetricsProps {
  /** Offer to display metrics for */
  offer: Offer & { epcMetrics?: EPCMetrics };
}

/**
 * Offer Metrics component
 */
export const OfferMetrics: React.FC<OfferMetricsProps> = ({ offer }) => {
  const [metrics, setMetrics] = useState<EPCMetrics | null>(offer.epcMetrics || null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  /**
   * Refresh metrics from API
   */
  const refreshMetrics = async () => {
    try {
      setLoading(true);
      const analytics = await trackingService.getAnalytics(offer.id);
      
      const updatedMetrics: EPCMetrics = {
        totalClicks: analytics.totalClicks || 0,
        totalConversions: analytics.conversions || 0,
        totalRevenue: analytics.totalRevenue || 0,
        conversionRate: analytics.conversionRate || 0,
        epc: analytics.epc || 0,
        lastUpdated: new Date()
      };
      
      setMetrics(updatedMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-refresh metrics every 15 seconds
   */
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 15000);
    return () => clearInterval(interval);
  }, [offer.id]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatDate = (date: Date) => date.toLocaleString();

  return (
    <div>
      {/* Offer Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>{offer.title}</h4>
        <p style={{ color: '#718096', margin: 0 }}>{offer.description}</p>
        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.875rem', 
          color: '#718096' 
        }}>
          {offer.category} • {formatCurrency(offer.config.payout)} payout • {offer.status}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#f7fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: metrics?.epc && metrics.epc > 0 ? '#38a169' : '#718096'
          }}>
            {formatCurrency(metrics?.epc || 0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>EPC</div>
        </div>

        <div style={{
          backgroundColor: '#f7fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2b6cb0' }}>
            {metrics?.totalClicks || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Total Clicks</div>
        </div>

        <div style={{
          backgroundColor: '#f7fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38a169' }}>
            {metrics?.totalConversions || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Conversions</div>
        </div>

        <div style={{
          backgroundColor: '#f7fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38a169' }}>
            {formatPercentage(metrics?.conversionRate || 0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Conv. Rate</div>
        </div>

        <div style={{
          backgroundColor: '#f7fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38a169' }}>
            {formatCurrency(metrics?.totalRevenue || 0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#718096' }}>Total Revenue</div>
        </div>
      </div>

      {/* Offer Configuration */}
      <div style={{ marginBottom: '2rem' }}>
        <h5 style={{ marginBottom: '1rem' }}>Offer Configuration</h5>
        <div style={{
          backgroundColor: '#f7fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Payout:</strong> {formatCurrency(offer.config.payout)} {offer.config.currency}
          </div>
          {offer.config.dailyClickCap && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Daily Click Cap:</strong> {offer.config.dailyClickCap.toLocaleString()}
            </div>
          )}
          {offer.config.totalClickCap && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Total Click Cap:</strong> {offer.config.totalClickCap.toLocaleString()}
            </div>
          )}
          {offer.config.cooldownPeriod && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Cooldown Period:</strong> {Math.round(offer.config.cooldownPeriod / 60)} minutes
            </div>
          )}
        </div>
      </div>

      {/* Targeting Information */}
      {offer.targeting && (
        <div style={{ marginBottom: '2rem' }}>
          <h5 style={{ marginBottom: '1rem' }}>Targeting</h5>
          <div style={{
            backgroundColor: '#f7fafc',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}>
            {offer.targeting.geoTargeting && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Geographic:</strong> {offer.targeting.geoTargeting.join(', ')}
              </div>
            )}
            {offer.targeting.deviceTargeting && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Devices:</strong> {offer.targeting.deviceTargeting.join(', ')}
              </div>
            )}
            {offer.targeting.timeTargeting && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Time Zone:</strong> {offer.targeting.timeTargeting.timezone || 'UTC'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* URLs */}
      <div style={{ marginBottom: '2rem' }}>
        <h5 style={{ marginBottom: '1rem' }}>Tracking URLs</h5>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            marginBottom: '0.25rem'
          }}>
            Destination URL:
          </label>
          <input
            type="text"
            value={offer.destinationUrl}
            readOnly
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.25rem',
              backgroundColor: '#f7fafc',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {offer.pixelUrl && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600',
              marginBottom: '0.25rem'
            }}>
              Pixel URL:
            </label>
            <input
              type="text"
              value={offer.pixelUrl}
              readOnly
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.25rem',
                backgroundColor: '#f7fafc',
                fontSize: '0.875rem'
              }}
            />
          </div>
        )}
      </div>

      {/* Refresh Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '0.875rem', color: '#718096' }}>
          Last updated: {formatDate(lastUpdated)}
        </div>
        <button
          onClick={refreshMetrics}
          disabled={loading}
          className="btn btn-primary"
          style={{ fontSize: '0.875rem' }}
        >
          {loading ? 'Refreshing...' : 'Refresh Metrics'}
        </button>
      </div>
    </div>
  );
};