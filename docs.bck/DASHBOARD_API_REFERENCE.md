# Admin Dashboard API Reference

## Overview

The Admin Dashboard provides real-time metrics, visualization, and analytics for the SurvAI platform. This API enables comprehensive monitoring of offer performance, question analytics, and revenue tracking with EPC-based insights and interactive data visualization.

**Key Features:**
- Real-time metrics aggregation with <200ms response time
- EPC-based offer performance tracking and visualization  
- Interactive Recharts bar charts with responsive design
- Time-based filtering (24h, 7d, 30d) with auto-refresh
- Admin-only access control with JWT authentication
- Comprehensive analytics with summary statistics

## Table of Contents

- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
- [Dashboard Metrics](#dashboard-metrics)
- [Offer Performance](#offer-performance)
- [Question Analytics](#question-analytics)
- [Data Types](#data-types)
- [Frontend Integration](#frontend-integration)
- [Testing](#testing)
- [Performance](#performance)

## Authentication

All dashboard endpoints require admin authentication using JWT tokens. Only users with `ADMIN` role can access dashboard functionality.

### Authentication Flow

```typescript
// Admin authentication required for all dashboard endpoints
app.use('/api/dashboard', [authenticateUser, requireAdmin]);

// Authentication headers
headers: {
  'Cookie': 'accessToken=your_jwt_token_here'
}
```

### Access Control

- **Role Required**: `ADMIN` 
- **Authentication Method**: JWT token in HTTP-only cookie
- **Session Management**: Automatic token refresh on API calls
- **Error Response**: `401 Unauthorized` for unauthenticated requests

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

```typescript
const DASHBOARD_ERRORS = {
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  ADMIN_ACCESS_REQUIRED: 'ADMIN_ACCESS_REQUIRED', 
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;
```

## API Endpoints

### Get Dashboard Metrics

Retrieves comprehensive dashboard data including offer performance, question analytics, and summary statistics.

#### Endpoint
```
GET /api/dashboard/metrics
```

#### Query Parameters

| Parameter | Type | Required | Description | Valid Values |
|-----------|------|----------|-------------|--------------|
| `timeRange` | string | No | Time period for metrics | `last24h`, `last7d`, `last30d` |
| `offerIds` | string\|string[] | No | Filter by specific offer IDs | Comma-separated or array |
| `minEPC` | number | No | Minimum EPC threshold | Positive number ≥ 0 |

#### Example Request

```bash
GET /api/dashboard/metrics?timeRange=last7d&offerIds=offer-1,offer-2&minEPC=2.5
Cookie: accessToken=your_jwt_token
```

#### Response

```json
{
  "success": true,
  "data": {
    "offerMetrics": [
      {
        "offerId": "offer-123",
        "title": "Premium Financial Planning",
        "category": "FINANCE",
        "status": "ACTIVE",
        "rank": 1,
        "totalClicks": 1250,
        "totalConversions": 87,
        "totalRevenue": 2175.50,
        "epc": 1.74,
        "conversionRate": 6.96,
        "lastUpdated": "2024-01-01T00:00:00.000Z"
      }
    ],
    "questionMetrics": [
      {
        "questionId": "question-456",
        "text": "What financial goal interests you most?",
        "impressions": 500,
        "buttonClicks": 450,
        "skips": 50,
        "skipRate": 10.0,
        "clickThroughRate": 90.0,
        "averageEPC": 2.5
      }
    ],
    "timeRange": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-08T00:00:00.000Z",
      "range": "last7days"
    },
    "summary": {
      "totalOffers": 5,
      "totalClicks": 2500,
      "totalConversions": 125,
      "totalRevenue": 3125.75,
      "averageEPC": 1.25,
      "topPerformingOffer": {
        "offerId": "offer-123",
        "title": "Premium Financial Planning",
        "rank": 1,
        "epc": 1.74
      }
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Get Offer Metrics Only

Retrieves offer performance data without question metrics for optimized performance.

#### Endpoint
```
GET /api/dashboard/offers
```

#### Query Parameters
Same as [Dashboard Metrics](#get-dashboard-metrics)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "offerId": "offer-123",
      "title": "Premium Financial Planning",
      "category": "FINANCE",
      "status": "ACTIVE",
      "rank": 1,
      "totalClicks": 1250,
      "totalConversions": 87,
      "totalRevenue": 2175.50,
      "epc": 1.74,
      "conversionRate": 6.96,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Get Question Metrics Only

Retrieves question analytics data without offer metrics.

#### Endpoint
```
GET /api/dashboard/questions
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `timeRange` | string | No | Time period for metrics |

#### Response
```json
{
  "success": true,
  "data": [
    {
      "questionId": "question-456",
      "text": "What financial goal interests you most?",
      "impressions": 500,
      "buttonClicks": 450,
      "skips": 50,
      "skipRate": 10.0,
      "clickThroughRate": 90.0,
      "averageEPC": 2.5
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Get Summary Statistics

Retrieves aggregated summary data only for dashboard overview.

#### Endpoint
```
GET /api/dashboard/summary
```

#### Query Parameters
Same as [Dashboard Metrics](#get-dashboard-metrics)

#### Response
```json
{
  "success": true,
  "data": {
    "totalOffers": 5,
    "totalClicks": 2500,
    "totalConversions": 125,
    "totalRevenue": 3125.75,
    "averageEPC": 1.25,
    "topPerformingOffer": {
      "offerId": "offer-123",
      "title": "Premium Financial Planning",
      "rank": 1,
      "epc": 1.74
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Dashboard Health Check

Monitors dashboard service availability and response time.

#### Endpoint
```
GET /api/dashboard/health
```

#### Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "responseTime": 145
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Dashboard Metrics

### Offer Performance Calculation

Offer metrics are calculated using EPC (Earnings Per Click) methodology with Prisma transactions for data consistency:

```typescript
// EPC calculation methodology
const epcMetrics = calculateEPC(totalClicks, totalConversions, totalRevenue);

interface OfferPerformance {
  offerId: string;
  title: string;
  category: string;
  status: string;
  rank: number;               // EPC-based ranking (1 = highest EPC)
  totalClicks: number;        // Click count in time window
  totalConversions: number;   // Conversion count in time window
  totalRevenue: number;       // Total revenue in time window
  epc: number;               // Earnings per click (revenue/clicks)
  conversionRate: number;    // Conversion percentage
  lastUpdated: Date;         // Calculation timestamp
}
```

### Time Range Filtering

Dashboard metrics support three time ranges with automatic date calculation:

```typescript
const timeRanges = {
  'last24h': getDateDaysAgo(1),   // Last 24 hours
  'last7d': getDateDaysAgo(7),    // Last 7 days (default)
  'last30d': getDateDaysAgo(30)   // Last 30 days
};
```

### EPC Ranking Algorithm

Offers are automatically ranked by EPC performance using the `calculateEPCRanking` utility:

```typescript
// Ranking logic
const rankedOffers = calculateEPCRanking(offerMetrics);
// 1. Sort by EPC descending (highest first)
// 2. Assign rank 1, 2, 3... based on EPC performance
// 3. Handle tie-breaking by offer ID for consistency
```

## Offer Performance

### Performance Metrics Aggregation

Offer performance is aggregated using optimized Prisma queries with transaction isolation:

```typescript
// Database query pattern
const offersWithClicks = await tx.offer.findMany({
  where: {
    status: 'ACTIVE',
    ...(offerIds && { id: { in: offerIds } })
  },
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
```

### EPC Calculation Details

```typescript
// Per-offer EPC calculation
const totalClicks = clicks.length;
const totalConversions = clicks.filter(c => c.converted).length;
const totalRevenue = clicks.reduce((sum, c) => {
  return sum + (c.converted && c.revenue ? Number(c.revenue) : 0);
}, 0);

const epcMetrics = calculateEPC(totalClicks, totalConversions, totalRevenue);
// Returns: { epc, conversionRate, totalClicks, totalConversions, totalRevenue }
```

### Filtering Options

#### Minimum EPC Filter
```typescript
// Filter offers by minimum EPC threshold
const filteredMetrics = filters.minEPC 
  ? offerMetrics.filter(m => m.epc >= filters.minEPC)
  : offerMetrics;
```

#### Offer ID Filter
```typescript
// Filter by specific offer IDs
if (filters.offerIds && filters.offerIds.length > 0) {
  whereClause.id = { in: filters.offerIds };
}
```

## Question Analytics

### Question Metrics Calculation

Question analytics track user engagement and performance metrics:

```typescript
interface QuestionMetrics {
  questionId: string;
  text: string;
  impressions: number;        // Question views/displays
  buttonClicks: number;       // CTA button clicks
  skips: number;             // Questions skipped/no action
  skipRate: number;          // Skip percentage
  clickThroughRate: number;  // Click-through percentage
  averageEPC: number;        // Average EPC from linked offers
}
```

### EPC Integration

Question metrics include EPC calculations from linked offers:

```typescript
// Calculate average EPC from linked offers
try {
  const { epcService } = await import('./epcService');
  averageEPC = await epcService.getQuestionEPC(question.id);
} catch (error) {
  console.warn(`Failed to get EPC for question ${question.id}:`, error);
  averageEPC = 0; // Graceful fallback
}
```

### Question Performance Tracking

```typescript
// Question engagement calculation
const impressions = question.answers.length;
const buttonClicks = question.answers.reduce((sum, answer) => {
  return sum + (answer.response?.clicks?.length || 0);
}, 0);
const skips = Math.max(0, impressions - buttonClicks);
const skipRate = impressions > 0 ? (skips / impressions) * 100 : 0;
const clickThroughRate = impressions > 0 ? (buttonClicks / impressions) * 100 : 0;
```

## Data Types

### Core Interfaces

```typescript
interface DashboardMetrics {
  offerMetrics: OfferPerformance[];
  questionMetrics: QuestionMetrics[];
  timeRange: AnalyticsTimeRange;
  summary: DashboardSummary;
}

interface DashboardFilters {
  timeRange: 'last24h' | 'last7d' | 'last30d';
  offerIds?: string[];
  minEPC?: number;
}

interface DashboardSummary {
  totalOffers: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  averageEPC: number;
  topPerformingOffer: OfferPerformance | null;
}

interface AnalyticsTimeRange {
  startDate: Date;
  endDate: Date;
  range: 'today' | 'last7days' | 'last30days';
}
```

### Validation Schemas

```typescript
// Joi validation schemas
export const dashboardMetricsSchema = Joi.object({
  timeRange: Joi.string().valid('last24h', 'last7d', 'last30d').default('last7d'),
  offerIds: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  minEPC: Joi.number().min(0).precision(2).optional()
});
```

## Frontend Integration

### Dashboard API Service

```typescript
import { ApiResponse, DashboardMetrics, DashboardFilters } from '@survai/shared';

class DashboardService {
  private baseURL = '/api/dashboard';

  async getDashboardMetrics(filters: DashboardFilters): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    if (filters.timeRange) params.append('timeRange', filters.timeRange);
    if (filters.offerIds) params.append('offerIds', filters.offerIds.join(','));
    if (filters.minEPC) params.append('minEPC', filters.minEPC.toString());

    const response = await fetch(`${this.baseURL}/metrics?${params}`, {
      credentials: 'include' // Include auth cookies
    });

    if (!response.ok) {
      throw new Error(`Dashboard API error: ${response.statusText}`);
    }

    const apiResponse: ApiResponse<DashboardMetrics> = await response.json();
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || 'Dashboard request failed');
    }

    return apiResponse.data;
  }
}

export const dashboardService = new DashboardService();
```

### React Component Integration

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard';
import { EpcBarChart } from './charts/EpcBarChart';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'last24h' | 'last7d' | 'last30d'>('last7d');
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getDashboardMetrics({ timeRange });
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div className="dashboard">
      {/* Time range selector */}
      <div className="time-range-selector">
        {(['last24h', 'last7d', 'last30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={timeRange === range ? 'active' : ''}
          >
            {range === 'last24h' ? '24H' : range === 'last7d' ? '7D' : '30D'}
          </button>
        ))}
      </div>

      {/* Dashboard content */}
      {metrics && (
        <>
          {/* Summary cards */}
          <div className="summary-cards">
            <div className="card">
              <h3>Total Revenue</h3>
              <p>${metrics.summary.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="card">
              <h3>Total Clicks</h3>
              <p>{metrics.summary.totalClicks.toLocaleString()}</p>
            </div>
            <div className="card">
              <h3>Average EPC</h3>
              <p>${metrics.summary.averageEPC.toFixed(2)}</p>
            </div>
          </div>

          {/* EPC visualization */}
          <div className="charts-section">
            <h2>Offer Performance</h2>
            <EpcBarChart
              data={metrics.offerMetrics}
              height={400}
              onBarClick={(offer) => console.log('Offer clicked:', offer)}
            />
          </div>

          {/* Performance tables */}
          <div className="tables-section">
            {/* Offer metrics table */}
            <div className="offer-table">
              <h3>Offer Performance</h3>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Offer</th>
                    <th>EPC</th>
                    <th>Clicks</th>
                    <th>Conversions</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.offerMetrics.map((offer) => (
                    <tr key={offer.offerId}>
                      <td>{offer.rank}</td>
                      <td>{offer.title}</td>
                      <td>${offer.epc.toFixed(2)}</td>
                      <td>{offer.totalClicks}</td>
                      <td>{offer.totalConversions}</td>
                      <td>${offer.totalRevenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
```

### EPC Bar Chart Component

```typescript
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { OfferPerformance } from '@survai/shared';

interface EpcBarChartProps {
  data: OfferPerformance[];
  height?: number;
  onBarClick?: (offer: OfferPerformance) => void;
}

export const EpcBarChart: React.FC<EpcBarChartProps> = ({ 
  data, 
  height = 300,
  onBarClick 
}) => {
  // Transform data for chart
  const chartData = data.map((offer) => ({
    name: offer.title.substring(0, 20) + (offer.title.length > 20 ? '...' : ''),
    epc: offer.epc,
    clicks: offer.totalClicks,
    conversions: offer.totalConversions,
    revenue: offer.totalRevenue,
    fullOffer: offer
  }));

  // Color based on EPC performance
  const getBarColor = (epc: number): string => {
    if (epc >= 3.0) return '#10B981'; // Green for high EPC
    if (epc >= 1.5) return '#F59E0B'; // Yellow for medium EPC
    return '#EF4444'; // Red for low EPC
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-title">{data.fullOffer.title}</p>
          <p>EPC: <span className="tooltip-value">${data.epc.toFixed(2)}</span></p>
          <p>Clicks: <span className="tooltip-value">{data.clicks}</span></p>
          <p>Conversions: <span className="tooltip-value">{data.conversions}</span></p>
          <p>Revenue: <span className="tooltip-value">${data.revenue.toFixed(2)}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="epc-bar-chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="epc" 
            radius={[4, 4, 0, 0]}
            onClick={(data) => onBarClick?.(data.fullOffer)}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.epc)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
```

## Testing

### Unit Tests

```typescript
describe('DashboardService', () => {
  it('should aggregate offer metrics correctly', async () => {
    const mockTx = {
      offer: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'offer-1',
            title: 'Test Offer',
            category: 'FINANCE',
            status: 'ACTIVE',
            clicks: [
              { converted: true, revenue: 25.0, clickedAt: new Date() },
              { converted: false, revenue: null, clickedAt: new Date() }
            ]
          }
        ])
      }
    };

    const result = await dashboardService.aggregateOfferMetrics(
      { timeRange: 'last7d' }, 
      mockTx
    );

    expect(result).toHaveLength(1);
    expect(result[0].totalClicks).toBe(2);
    expect(result[0].totalConversions).toBe(1);
    expect(result[0].epc).toBe(12.5); // 25.0 / 2
  });
});
```

### Integration Tests

```typescript
describe('Dashboard API Integration', () => {
  it('should return dashboard metrics with admin auth', async () => {
    const response = await request(app)
      .get('/api/dashboard/metrics')
      .set('Cookie', adminAuthCookie)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.offerMetrics).toBeDefined();
    expect(response.body.data.summary).toBeDefined();
  });

  it('should reject unauthorized requests', async () => {
    await request(app)
      .get('/api/dashboard/metrics')
      .expect(401);
  });
});
```

## Performance

### Response Time Requirements

- **Target**: <200ms for dashboard metrics endpoints
- **Measurement**: Automatic response time tracking in health endpoint
- **Optimization**: Prisma transactions and parallel processing

### Database Optimization

```typescript
// Optimized query with selective field loading
const offersWithClicks = await tx.offer.findMany({
  where: { status: 'ACTIVE' },
  include: {
    clicks: {
      where: { clickedAt: { gte: timeRange } },
      select: {
        converted: true,
        revenue: true,
        clickedAt: true
      }
    }
  }
});
```

### Caching Strategy

```typescript
// Redis caching for dashboard metrics (optional)
const CACHE_TTL = 300; // 5 minutes
const cacheKey = `dashboard:${JSON.stringify(filters)}`;

// Check cache first
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Calculate and cache
const metrics = await dashboardService.getDashboardMetrics(filters);
await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(metrics));
```

### Auto-Refresh Performance

- **Interval**: 30-second auto-refresh in frontend
- **Debouncing**: Prevents multiple simultaneous requests
- **Error Handling**: Graceful fallback on API failures

---

This comprehensive API reference enables developers to effectively integrate and utilize the Admin Dashboard system for real-time monitoring and analytics in the SurvAI platform.