# Admin Dashboard Metrics & Visualization - PRP

name: "Admin Dashboard Metrics & Visualization Implementation"
description: |
  Complete implementation of the first iteration Admin Dashboard that surfaces live metrics including 
  total clicks, conversions, EPC per offer and question, CTR per copy variant, and basic charts/tables
  for real-time performance monitoring before automated optimization.

---

## Goal

Implement the first iteration of the Admin Dashboard that surfaces live metrics for administrators to monitor and manually tweak offers/questions. The dashboard will provide:

- Total clicks and conversions per offer
- EPC per offer and per question  
- CTR per copy variant
- Basic charts and tables for quick insights
- Time-based filtering (24h, 7d, 30d)
- Real-time auto-refresh capabilities
- Admin-only access protection

## Why

- **Business value**: Enables manual optimization and monitoring before automated systems are fully deployed
- **User impact**: Provides administrators with actionable insights to improve survey performance
- **Integration**: Builds on existing tracking & EPC services from M3_PHASE_04 and M3_PHASE_05
- **Performance monitoring**: Real-time dashboard for tracking offer and question performance metrics
- **Manual intervention**: Allows admins to identify and address performance issues quickly

## What

A secure admin dashboard with the following user-visible behavior:

### Frontend Dashboard Interface
- `/admin/dashboard` route protected by admin authentication
- Responsive dashboard layout with metrics cards and charts
- Real-time data with 15-30 second auto-refresh
- Time range filters (Last 24h, 7d, 30d)
- Sortable tables for offer and question performance
- Interactive bar chart showing EPC per offer
- Loading states and error handling

### Backend API Endpoints
- `GET /api/dashboard/metrics` - Aggregated dashboard data with filtering
- Query parameters for time ranges and filtering
- Sub-200ms response time for 10k records
- Proper error handling and validation

### Success Criteria
- [ ] `/api/dashboard/metrics` returns aggregated data in <200ms for 10k records
- [ ] Dashboard UI shows table + bar chart
- [ ] Filters adjust data correctly (24h, 7d, 30d)
- [ ] All new code passes lint + type-check
- [ ] Unit tests cover aggregation edge cases
- [ ] Real-time auto-refresh functionality works
- [ ] Admin authentication protects all routes
- [ ] All necessary documentation has been reviewed and updated

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://recharts.org/en-US/guide/getting-started
  why: Chart library for EPC bar charts and data visualization
  
- file: backend/src/services/epcService.ts
  why: Existing EPC calculation patterns and database queries to follow
  
- file: backend/src/controllers/trackingController.ts
  why: Controller patterns for API responses and error handling
  
- file: backend/src/routes/tracking.ts
  why: Route setup patterns with validation middleware
  
- file: backend/src/middleware/auth.ts
  why: Admin authentication middleware patterns (requireAdmin)
  
- file: frontend/src/components/admin/OfferMetrics.tsx
  why: Existing admin component patterns and styling approach
  
- file: frontend/src/services/api.ts
  why: API client patterns and typed service methods
  
- file: shared/src/types/analytics.ts
  why: Existing metrics types to extend for dashboard data
  
- file: tests/backend/trackingService.test.ts
  why: Testing patterns for services with database mocking
  
- doc: https://recharts.org/en-US/api
  section: BarChart, ResponsiveContainer, Tooltip components
  critical: Chart component composition and responsive design patterns

- file: backend/prisma/schema.prisma
  why: Database schema for ClickTrack, ConversionTrack, Offer tables
```

### Current Codebase tree
```bash
.
├── backend/
│   ├── src/
│   │   ├── routes/          # Existing: auth.ts, tracking.ts, questions.ts
│   │   ├── controllers/     # Existing: authController.ts, trackingController.ts
│   │   ├── services/        # Existing: epcService.ts, trackingService.ts
│   │   ├── middleware/      # Existing: auth.ts (requireAdmin)
│   │   └── validators/      # Request validation patterns
│   └── prisma/
│       └── schema.prisma    # Database models: ClickTrack, Offer, etc.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── admin/       # Existing: OfferMetrics.tsx, OfferManagement.tsx
│   │   └── services/        # Existing: api.ts, tracking.ts
├── shared/
│   └── src/types/           # Existing: analytics.ts, api.ts
└── tests/
    └── backend/             # Existing test patterns
```

### Desired Codebase tree with files to be added
```bash
.
├── backend/src/
│   ├── routes/dashboard.ts                    # New: Dashboard aggregation endpoint
│   ├── controllers/dashboardController.ts     # New: Dashboard data controller
│   ├── services/dashboardService.ts           # New: Metric aggregation service
│   └── validators/dashboardValidation.ts      # New: Request validation
├── frontend/src/
│   ├── components/admin/
│   │   ├── Dashboard.tsx                      # New: Main dashboard component  
│   │   └── charts/EpcBarChart.tsx            # New: EPC visualization chart
│   └── services/dashboard.ts                 # New: Dashboard API service
├── shared/src/types/
│   └── metrics.ts                            # Extend: Dashboard-specific types
└── tests/backend/
    ├── dashboardController.test.ts           # New: Controller tests
    └── dashboardService.test.ts              # New: Service tests
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Prisma requires transactions for EPC updates
// Example: All EPC calculations must use prisma.$transaction for atomicity
await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
  // EPC calculations here
});

// CRITICAL: Component file size limit is 500 lines - split if exceeded
// Example: Dashboard.tsx may need to be split into smaller components

// CRITICAL: Use existing EPCService patterns for consistency
// Example: epcService.calculateEPC() and getQuestionEPC() methods

// CRITICAL: Admin middleware must be applied in correct order
// Example: [authenticateUser, requireAdmin] for protected routes

// CRITICAL: API responses must follow ApiResponse<T> pattern
// Example: { success: boolean, data?: T, error?: string, timestamp?: string }

// CRITICAL: Recharts requires specific data structure
// Example: [{ name: 'Offer A', epc: 2.5 }, { name: 'Offer B', epc: 3.2 }]

// CRITICAL: Auto-refresh must cleanup intervals on unmount
// Example: useEffect cleanup to prevent memory leaks

// CRITICAL: Time range calculations must use consistent date utilities
// Example: getDateDaysAgo() function from utils/time.ts
```

## Implementation Blueprint

### Data models and structure

Create dashboard-specific types that extend existing analytics types:
```typescript
// shared/src/types/metrics.ts extensions
interface DashboardMetrics {
  offerMetrics: OfferPerformance[];
  questionMetrics: QuestionMetrics[];
  timeRange: AnalyticsTimeRange;
  summary: DashboardSummary;
}

interface DashboardSummary {
  totalOffers: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  averageEPC: number;
  topPerformingOffer: OfferPerformance;
}

interface DashboardFilters {
  timeRange: 'last24h' | 'last7d' | 'last30d';
  offerIds?: string[];
  minEPC?: number;
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: Install and configure chart library
CREATE frontend/package.json update:
  - ADD recharts dependency (~2.8.0)
  - RUN npm install recharts --workspace=frontend

Task 2: Extend shared types for dashboard metrics
MODIFY shared/src/types/metrics.ts:
  - ADD DashboardMetrics interface
  - ADD DashboardSummary interface  
  - ADD DashboardFilters interface
  - EXPORT all new types in shared/src/index.ts

Task 3: Create dashboard validation middleware
CREATE backend/src/validators/dashboardValidation.ts:
  - MIRROR pattern from: backend/src/middleware/trackingValidation.ts
  - ADD validateDashboardMetrics function with Joi schema
  - VALIDATE timeRange, offerIds, minEPC parameters

Task 4: Implement dashboard service with aggregation logic
CREATE backend/src/services/dashboardService.ts:
  - MIRROR pattern from: backend/src/services/epcService.ts
  - ADD aggregateOfferMetrics() method with Prisma transactions
  - ADD aggregateQuestionMetrics() method using existing EPC patterns
  - ADD calculateDashboardSummary() method
  - USE existing getDateDaysAgo() utility for time filtering
  - HANDLE edge cases (zero clicks, no data) like EPC service

Task 5: Create dashboard controller for API endpoints
CREATE backend/src/controllers/dashboardController.ts:
  - MIRROR pattern from: backend/src/controllers/trackingController.ts
  - ADD getMetrics() method with validation and error handling
  - USE ApiResponse<DashboardMetrics> pattern for responses
  - ADD proper TypeScript types and JSDoc comments

Task 6: Setup dashboard routes with admin protection
CREATE backend/src/routes/dashboard.ts:
  - MIRROR pattern from: backend/src/routes/tracking.ts
  - ADD GET /api/dashboard/metrics route
  - APPLY [authenticateUser, requireAdmin] middleware chain
  - USE validateDashboardMetrics middleware
  - BIND dashboardController.getMetrics method

Task 7: Integrate dashboard routes into main app
MODIFY backend/src/app.ts:
  - IMPORT dashboard routes
  - ADD app.use('/api/dashboard', dashboardRoutes)
  - ENSURE route is added after auth middleware setup

Task 8: Create dashboard API service client
CREATE frontend/src/services/dashboard.ts:
  - MIRROR pattern from: frontend/src/services/api.ts
  - ADD getDashboardMetrics() function with typed response
  - USE existing apiClient with proper error handling
  - IMPLEMENT retry logic for failed requests

Task 9: Implement EPC bar chart component
CREATE frontend/src/components/admin/charts/EpcBarChart.tsx:
  - USE Recharts BarChart, ResponsiveContainer, Tooltip components
  - FOLLOW OfferMetrics.tsx styling patterns
  - ADD responsive design and loading states
  - KEEP under 500 lines (split if needed)
  - ADD proper TypeScript props interface

Task 10: Create main dashboard component
CREATE frontend/src/components/admin/Dashboard.tsx:
  - MIRROR layout patterns from: frontend/src/components/admin/OfferMetrics.tsx
  - ADD time range filter controls (24h, 7d, 30d buttons)
  - ADD metrics summary cards (clicks, conversions, EPC, revenue)
  - ADD sortable table for offer performance
  - ADD EpcBarChart component integration
  - ADD auto-refresh with useEffect cleanup
  - IMPLEMENT loading and error states
  - KEEP under 500 lines (split if needed)

Task 11: Add dashboard route to frontend routing
MODIFY frontend/src/App.tsx (or router config):
  - ADD /admin/dashboard route with Dashboard component
  - ENSURE admin authentication is required
  - ADD navigation link in admin interface

Task 12: Create comprehensive unit tests for service
CREATE tests/backend/dashboardService.test.ts:
  - MIRROR pattern from: tests/backend/trackingService.test.ts
  - TEST aggregateOfferMetrics with mock Prisma data
  - TEST time range filtering edge cases
  - TEST zero data scenarios (no clicks/conversions)
  - TEST database error handling
  - ENSURE 100% coverage of critical paths

Task 13: Create unit tests for controller
CREATE tests/backend/dashboardController.test.ts:
  - MIRROR pattern from: tests/backend/trackingController.test.ts  
  - TEST getMetrics endpoint with various filters
  - TEST admin authentication requirement
  - TEST validation error responses
  - TEST service error handling

Task 14: Create integration tests for dashboard endpoint
CREATE tests/backend/dashboardController.integration.test.ts:
  - TEST full request/response cycle
  - TEST authentication and authorization
  - TEST performance with large datasets
  - VERIFY <200ms response time requirement

Task 15: Run validation loop and fix issues
RUN all validation commands:
  - npm run lint (fix any linting errors)
  - npm run type-check (fix any TypeScript errors)
  - npm run test (ensure all tests pass)
  - npm run dev (manual testing of dashboard functionality)
```

### Per task pseudocode as needed

```typescript
// Task 4: Dashboard Service Implementation
export class DashboardService {
  async aggregateOfferMetrics(filters: DashboardFilters): Promise<OfferPerformance[]> {
    // PATTERN: Use transaction like epcService.updateEPC()
    return await prisma.$transaction(async (tx) => {
      // PATTERN: Time filtering like epcService.calculateEPC()
      const timeRange = getDateDaysAgo(filters.timeRange === 'last24h' ? 1 : 
                                      filters.timeRange === 'last7d' ? 7 : 30);
      
      // PATTERN: Prisma aggregation like epcService
      const offerData = await tx.offer.findMany({
        include: { 
          clicks: { where: { clickedAt: { gte: timeRange } } }
        }
      });
      
      // PATTERN: EPC calculation using existing utility
      return offerData.map(offer => {
        const clicks = offer.clicks;
        const metrics = calculateEPC(clicks.length, 
                                   clicks.filter(c => c.converted).length,
                                   clicks.reduce((sum, c) => sum + (c.revenue || 0), 0));
        return { ...offer, ...metrics, rank: 0 }; // Rank calculated later
      });
    });
  }
}

// Task 9: EPC Bar Chart Component
interface EpcBarChartProps {
  data: OfferPerformance[];
  loading?: boolean;
  height?: number;
}

export const EpcBarChart: React.FC<EpcBarChartProps> = ({ data, loading, height = 300 }) => {
  // PATTERN: Early return for loading state like OfferMetrics.tsx
  if (loading) return <div>Loading chart...</div>;
  
  // PATTERN: Data transformation for Recharts
  const chartData = data.map(offer => ({
    name: offer.title.substring(0, 20) + '...', // Truncate for display
    epc: offer.epc,
    clicks: offer.totalClicks
  }));
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value, name) => [`$${value.toFixed(2)}`, 'EPC']} />
        <Bar dataKey="epc" fill="#38a169" />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Task 10: Main Dashboard Component  
export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'last24h' | 'last7d' | 'last30d'>('last7d');
  
  // PATTERN: Data fetching like OfferMetrics.tsx
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardMetrics({ timeRange });
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);
  
  // PATTERN: Auto-refresh with cleanup like OfferMetrics.tsx
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30 second refresh
    return () => clearInterval(interval); // CRITICAL: Cleanup
  }, [fetchMetrics]);
  
  return (
    <div className="dashboard">
      {/* Time range filters */}
      <div className="filters">
        {['last24h', 'last7d', 'last30d'].map(range => (
          <button 
            key={range}
            onClick={() => setTimeRange(range as any)}
            className={timeRange === range ? 'active' : ''}
          >
            {range}
          </button>
        ))}
      </div>
      
      {/* Summary cards */}
      {metrics && <DashboardSummary summary={metrics.summary} />}
      
      {/* EPC Chart */}
      <EpcBarChart data={metrics?.offerMetrics || []} loading={loading} />
      
      {/* Offers table */}
      <OffersTable data={metrics?.offerMetrics || []} loading={loading} />
    </div>
  );
};
```

### Integration Points
```yaml
DATABASE:
  - no migrations needed: "Uses existing ClickTrack, Offer, Question tables"
  - indexes: "Existing indexes on clickedAt, offerId, converted are sufficient"
  
CONFIG:
  - add to: frontend/package.json
  - pattern: "recharts: ^2.8.0"
  
ROUTES:
  - add to: backend/src/app.ts
  - pattern: "app.use('/api/dashboard', dashboardRoutes)"
  
AUTH:
  - middleware: "Use existing [authenticateUser, requireAdmin] chain"
  - pattern: "Apply to all /api/dashboard/* routes"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                    # Fix ESLint errors
npm run type-check             # Fix TypeScript errors
npm run build                  # Ensure build succeeds

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```typescript
// CREATE tests/backend/dashboardService.test.ts
describe('DashboardService', () => {
  it('should aggregate offer metrics correctly', async () => {
    // Mock Prisma data with 100 clicks, 15 conversions, $375.50 revenue
    const result = await dashboardService.aggregateOfferMetrics({ timeRange: 'last7d' });
    expect(result[0].totalClicks).toBe(100);
    expect(result[0].epc).toBe(3.755);
  });

  it('should handle zero clicks gracefully', async () => {
    // Mock empty data
    const result = await dashboardService.aggregateOfferMetrics({ timeRange: 'last24h' });
    expect(result[0].epc).toBe(0);
  });

  it('should filter by time range correctly', async () => {
    // Test each time range filter works
  });
});

// CREATE tests/backend/dashboardController.test.ts
describe('DashboardController', () => {
  it('should require admin authentication', async () => {
    const response = await request(app).get('/api/dashboard/metrics');
    expect(response.status).toBe(401);
  });

  it('should return dashboard metrics for admin', async () => {
    const response = await request(app)
      .get('/api/dashboard/metrics?timeRange=last7d')
      .set('Cookie', adminAuthCookie);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

```bash
# Run and iterate until passing:
npm run test
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start the service
npm run dev

# Test the dashboard endpoint with curl
curl -X GET "http://localhost:8000/api/dashboard/metrics?timeRange=last7d" \
  -H "Cookie: accessToken=admin_jwt_token" \
  -H "Content-Type: application/json"

# Expected: {"success": true, "data": {...dashboard metrics...}}
# If error: Check backend logs for stack trace

# Test frontend dashboard page
# Navigate to http://localhost:3000/admin/dashboard
# Expected: Dashboard loads with charts and tables
```

### Level 4: Performance Validation
```bash
# Test response time requirement (<200ms for 10k records)
time curl -X GET "http://localhost:8000/api/dashboard/metrics" \
  -H "Cookie: accessToken=admin_jwt_token"

# Expected: Response time < 200ms
# If slow: Optimize Prisma queries, add database indexes
```

## Final validation Checklist
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`  
- [ ] No type errors: `npm run type-check`
- [ ] Dashboard loads at /admin/dashboard with admin auth
- [ ] Charts render correctly with Recharts
- [ ] Time filters work (24h, 7d, 30d)
- [ ] Auto-refresh works every 30 seconds
- [ ] Response time < 200ms for dashboard endpoint
- [ ] Error cases handled gracefully
- [ ] Component files under 500 lines each
- [ ] All admin routes protected by authentication

---

## Anti-Patterns to Avoid
- ❌ Don't create new EPC calculation logic - use existing epcService patterns
- ❌ Don't skip admin authentication - all dashboard routes must be protected
- ❌ Don't ignore the 500-line file limit - split components if needed
- ❌ Don't forget useEffect cleanup for intervals - prevents memory leaks
- ❌ Don't hardcode time ranges - use the getDateDaysAgo utility
- ❌ Don't skip Prisma transactions for aggregations - ensures data consistency
- ❌ Don't use sync operations in async context - all database operations are async
- ❌ Don't ignore loading states - provide proper UX feedback

---

## PRP Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation success through:
- ✅ Complete architectural context and existing patterns
- ✅ Detailed task breakdown with specific file paths
- ✅ Executable validation loops with specific commands
- ✅ Real code examples from the existing codebase
- ✅ Clear success criteria and performance requirements
- ✅ Known gotchas and anti-patterns to avoid
- ✅ Integration with existing authentication and EPC systems

The implementation should succeed in one pass with this level of context and guidance.