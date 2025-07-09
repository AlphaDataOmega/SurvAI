name: "Widget Analytics Beacon & Dashboard Tile PRP"
description: |
  Comprehensive PRP for implementing widget analytics beacon with load/dwell tracking
  and dashboard tile visualization with real-time metrics display.

## Goal
Implement a lightweight analytics beacon system that tracks widget impressions and dwell time, then displays these metrics in a new dashboard tile with line chart visualization. This enables real-time monitoring of widget performance across partner sites.

## Why
- **Business Value**: Provides widget performance insights to optimize partner placements and improve engagement
- **Data-Driven Decisions**: Enables analytics-based optimization of widget content and timing
- **Partner Attribution**: Tracks which partners drive the most widget impressions and engagement
- **Performance Monitoring**: Identifies widgets with low dwell times that need optimization
- **Revenue Optimization**: Correlates widget impressions with conversion rates for better ROI

## What
Create a complete analytics system with:
1. **Widget-side beacon**: Fire `loaded` and `dwell` events to new `/widget/analytics` endpoint
2. **Backend storage**: New `WidgetAnalytics` model with aggregation service
3. **Dashboard tile**: "Widget Impressions" tile with Recharts line chart showing 7-day trend
4. **Real-time updates**: Auto-refresh dashboard integration like existing tiles

### Success Criteria
- [ ] POST `/widget/analytics` endpoint stores `loaded` and `dwell` events in database
- [ ] Widget fires `loaded` event exactly once on mount and `dwell` event once on first CTA click or unload
- [ ] Dashboard tile displays daily widget impressions from last 7 days with line chart
- [ ] All unit and integration tests pass with >80% coverage
- [ ] Lint and type-check pass without errors
- [ ] Documentation updated with analytics beacon usage and API reference

## All Needed Context

### Documentation & References
```yaml
# CRITICAL READING - Include these in your context window
- file: /home/ado/SurvAI.3.0/PLANNING.md
  why: Architecture patterns, tech stack, performance strategies, and development rules
  
- file: /home/ado/SurvAI.3.0/CLAUDE.md
  why: Code structure limits (<500 LOC), testing requirements, and documentation standards
  
- file: /home/ado/SurvAI.3.0/backend/prisma/schema.prisma
  why: Database schema patterns, model definitions, and indexing strategies
  
- file: /home/ado/SurvAI.3.0/frontend/src/widget/hooks/useWidget.ts
  why: Widget hook patterns for analytics integration and click tracking
  
- file: /home/ado/SurvAI.3.0/frontend/src/components/admin/Dashboard.tsx
  why: Dashboard component patterns, metrics tiles, and auto-refresh implementation
  
- file: /home/ado/SurvAI.3.0/backend/src/routes/tracking.ts
  why: API route patterns, validation middleware, and endpoint structure
  
- file: /home/ado/SurvAI.3.0/backend/src/middleware/trackingValidation.ts
  why: Joi validation patterns, error handling, and request sanitization
  
- file: /home/ado/SurvAI.3.0/backend/src/services/trackingService.ts
  why: Service layer patterns, database operations, and error handling
  
- file: /home/ado/SurvAI.3.0/tests/backend/trackingService.test.ts
  why: Testing patterns, mocking strategies, and test structure
  
- file: /home/ado/SurvAI.3.0/docs/WIDGET.md
  why: Widget documentation patterns and API reference structure

- url: https://recharts.org/en-US/guide/getting-started
  why: Recharts API for line chart implementation in dashboard tile
  section: LineChart component with responsiveness and tooltip configuration
  
- url: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
  why: Browser API for reliable beacon transmission even during page unload
  section: sendBeacon usage for analytics events with fallback to fetch
```

### Current Codebase Tree (Analytics-Related)
```bash
backend/
├── src/
│   ├── controllers/
│   │   └── trackingController.ts        # Pattern for analytics controller
│   ├── services/
│   │   └── trackingService.ts           # Pattern for analytics service
│   ├── routes/
│   │   └── tracking.ts                  # Pattern for analytics routes
│   ├── middleware/
│   │   └── trackingValidation.ts        # Pattern for validation middleware
│   └── utils/
│       └── trackingValidation.ts        # Joi schemas for validation
├── prisma/
│   └── schema.prisma                    # Database model patterns
frontend/
├── src/
│   ├── components/admin/
│   │   ├── Dashboard.tsx                # Dashboard tile patterns
│   │   └── charts/
│   │       └── EpcBarChart.tsx          # Chart component patterns
│   └── widget/
│       └── hooks/
│           └── useWidget.ts             # Widget hook patterns
tests/
├── backend/
│   ├── trackingService.test.ts          # Service testing patterns
│   └── controllers/
│       └── trackingController.integration.test.ts # Integration test patterns
└── frontend/
    └── widgetMount.test.ts              # Widget testing patterns
```

### Desired Codebase Tree (Files to Add/Modify)
```bash
backend/
├── src/
│   ├── controllers/
│   │   └── widgetAnalyticsController.ts      # NEW: Widget analytics endpoints
│   ├── services/
│   │   └── widgetAnalyticsService.ts         # NEW: Analytics aggregation service
│   ├── routes/
│   │   └── widgetAnalytics.ts                # NEW: Widget analytics routes
│   └── validators/
│       └── widgetAnalyticsValidator.ts       # NEW: Joi validation schemas
├── prisma/
│   └── schema.prisma                         # MODIFY: Add WidgetAnalytics model
frontend/
├── src/
│   ├── components/admin/
│   │   ├── Dashboard.tsx                     # MODIFY: Add WidgetImpressionsTile
│   │   └── metrics/
│   │       └── WidgetImpressionsTile.tsx     # NEW: Widget impressions tile
│   └── widget/
│       └── hooks/
│           └── useWidget.ts                  # MODIFY: Add analytics beacon logic
tests/
├── backend/
│   ├── controllers/
│   │   └── widgetAnalyticsController.test.ts # NEW: Controller tests
│   └── services/
│       └── widgetAnalyticsService.test.ts    # NEW: Service tests
└── frontend/
    └── widget/
        └── analytics.test.ts                 # NEW: Widget analytics tests
docs/
└── WIDGET.md                                # MODIFY: Add analytics beacon docs
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Prisma transaction patterns from existing codebase
// Example: All analytics operations must use $transaction for consistency
const result = await prisma.$transaction(async (tx) => {
  // Atomic operations here
});

// CRITICAL: Widget hook cleanup patterns from useWidget.ts
// Example: All timers and event listeners must be cleaned up on unmount
useEffect(() => {
  // Setup logic
  return () => {
    // CRITICAL: Cleanup to prevent memory leaks
    clearTimeout(timeoutId);
    removeEventListener('beforeunload', handler);
  };
}, []);

// CRITICAL: Dashboard auto-refresh patterns from Dashboard.tsx
// Example: All intervals must be cleared on unmount
useEffect(() => {
  const interval = setInterval(fetchMetrics, 30000);
  return () => clearInterval(interval); // CRITICAL: Cleanup
}, [fetchMetrics]);

// CRITICAL: Joi validation patterns from trackingValidation.ts
// Example: All endpoints must validate input and sanitize data
const schema = Joi.object({
  surveyId: Joi.string().required(),
  event: Joi.string().valid('loaded', 'dwell').required(),
  dwellTimeMs: Joi.number().integer().min(0).when('event', {
    is: 'dwell',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

// CRITICAL: navigator.sendBeacon limitations
// Example: Beacon has 64kb payload limit, use fetch fallback
if (navigator.sendBeacon && payloadSize < 64000) {
  navigator.sendBeacon(url, data);
} else {
  fetch(url, { method: 'POST', body: data });
}

// CRITICAL: React component file size limits from CLAUDE.md
// Example: Each component must be <500 lines, split into subcomponents
```

## Implementation Blueprint

### Data Models and Structure

Create the core data model to store widget analytics events:

```typescript
// backend/prisma/schema.prisma - New WidgetAnalytics model
model WidgetAnalytics {
  id          String   @id @default(cuid())
  surveyId    String   @map("survey_id")
  event       String   // 'loaded' or 'dwell'
  dwellTimeMs Int?     @map("dwell_time_ms")
  timestamp   DateTime @default(now())
  metadata    Json?
  
  @@map("widget_analytics")
  @@index([surveyId])
  @@index([event])
  @@index([timestamp])
}

// Validation schemas
interface WidgetAnalyticsEvent {
  surveyId: string;
  event: 'loaded' | 'dwell';
  dwellTimeMs?: number;
}

interface WidgetAnalyticsAggregation {
  date: string;
  loadedCount: number;
  averageDwellTime: number;
}
```

### Task List (Implementation Order)

```yaml
Task 1: Database Schema Update
MODIFY backend/prisma/schema.prisma:
  - ADD WidgetAnalytics model after ConversionTrack model
  - FOLLOW existing model patterns (id, timestamps, metadata)
  - ADD appropriate indexes for performance
  - RUN prisma generate && prisma migrate dev

Task 2: Backend Validation Layer
CREATE backend/src/validators/widgetAnalyticsValidator.ts:
  - MIRROR pattern from backend/src/utils/trackingValidation.ts
  - CREATE Joi schemas for POST /widget/analytics endpoint
  - ADD conditional validation for dwellTimeMs (required only for 'dwell' event)
  - INCLUDE comprehensive error messages and input sanitization

Task 3: Backend Service Layer
CREATE backend/src/services/widgetAnalyticsService.ts:
  - MIRROR pattern from backend/src/services/trackingService.ts
  - IMPLEMENT storeEvent() method with Prisma transaction
  - IMPLEMENT getLast7DaysAggregation() method with date grouping
  - ADD error handling and logging patterns from existing services

Task 4: Backend Controller Layer
CREATE backend/src/controllers/widgetAnalyticsController.ts:
  - MIRROR pattern from backend/src/controllers/trackingController.ts
  - IMPLEMENT POST /widget/analytics endpoint handler
  - IMPLEMENT GET /widget/analytics/aggregation endpoint for dashboard
  - ADD comprehensive error handling and response formatting

Task 5: Backend Routes Configuration
CREATE backend/src/routes/widgetAnalytics.ts:
  - MIRROR pattern from backend/src/routes/tracking.ts
  - CONFIGURE POST /widget/analytics with validation middleware
  - CONFIGURE GET /widget/analytics/aggregation with query validation
  - ADD route to main app.ts router

Task 6: Widget Analytics Integration
MODIFY frontend/src/widget/hooks/useWidget.ts:
  - ADD analytics beacon functionality to existing hook
  - IMPLEMENT sendAnalyticsEvent() method with navigator.sendBeacon fallback
  - ADD loaded event on mount and dwell event on first CTA click
  - PRESERVE existing click tracking functionality

Task 7: Dashboard Tile Component
CREATE frontend/src/components/admin/metrics/WidgetImpressionsTile.tsx:
  - MIRROR pattern from frontend/src/components/admin/charts/EpcBarChart.tsx
  - IMPLEMENT Recharts LineChart with 7-day data
  - ADD auto-refresh every 30 seconds like Dashboard.tsx
  - KEEP component <500 lines per CLAUDE.md requirements

Task 8: Dashboard Integration
MODIFY frontend/src/components/admin/Dashboard.tsx:
  - ADD WidgetImpressionsTile to dashboard grid
  - FOLLOW existing metrics tile integration pattern
  - MAINTAIN responsive grid layout and consistent styling
  - ADD tile to metrics grid without disrupting existing layout

Task 9: Backend Unit Tests
CREATE tests/backend/services/widgetAnalyticsService.test.ts:
  - MIRROR pattern from tests/backend/services/trackingService.test.ts
  - TEST storeEvent() with both 'loaded' and 'dwell' events
  - TEST getLast7DaysAggregation() with edge cases
  - ADD comprehensive mocking of Prisma client

CREATE tests/backend/controllers/widgetAnalyticsController.test.ts:
  - MIRROR pattern from tests/backend/controllers/trackingController.integration.test.ts
  - TEST POST /widget/analytics endpoint with validation
  - TEST GET /widget/analytics/aggregation endpoint
  - ADD integration tests with real database transactions

Task 10: Frontend Unit Tests
CREATE tests/frontend/widget/analytics.test.ts:
  - MIRROR pattern from tests/frontend/widgetMount.test.ts
  - TEST analytics beacon firing on mount and CTA click
  - TEST navigator.sendBeacon fallback to fetch
  - ADD comprehensive mocking of browser APIs

Task 11: Documentation Updates
MODIFY docs/WIDGET.md:
  - ADD analytics beacon section after "Offline Batching & Network Resilience"
  - DOCUMENT event types, payload structure, and usage examples
  - ADD troubleshooting section for analytics beacon
  - FOLLOW existing documentation patterns and formatting

Task 12: Integration Testing & Validation
RUN comprehensive test suite:
  - EXECUTE npm run test for unit tests
  - EXECUTE npm run lint && npm run type-check
  - VERIFY all tests pass and no linting errors
  - TEST manual integration with real widget and dashboard
```

### Task Implementation Details

#### Task 1: Database Schema Update
```typescript
// Pseudocode for schema.prisma addition
model WidgetAnalytics {
  id          String   @id @default(cuid())
  surveyId    String   @map("survey_id")
  event       String   // 'loaded' or 'dwell'
  dwellTimeMs Int?     @map("dwell_time_ms")
  timestamp   DateTime @default(now())
  metadata    Json?
  
  @@map("widget_analytics")
  // CRITICAL: Add indexes for performance
  @@index([surveyId])
  @@index([event])  
  @@index([timestamp])
}
```

#### Task 6: Widget Analytics Integration
```typescript
// Pseudocode for useWidget.ts enhancement
export function useWidget(options: UseWidgetOptions): UseWidgetReturn {
  const [loadedEventSent, setLoadedEventSent] = useState(false);
  const [dwellEventSent, setDwellEventSent] = useState(false);
  const dwellStartTime = useRef<number>(Date.now());
  
  // PATTERN: Analytics beacon on mount (fire once)
  useEffect(() => {
    if (!loadedEventSent) {
      sendAnalyticsEvent('loaded');
      setLoadedEventSent(true);
    }
  }, [loadedEventSent]);
  
  // PATTERN: Dwell event on first CTA click or unload
  const sendDwellEvent = useCallback(() => {
    if (!dwellEventSent) {
      const dwellTime = Date.now() - dwellStartTime.current;
      sendAnalyticsEvent('dwell', dwellTime);
      setDwellEventSent(true);
    }
  }, [dwellEventSent]);
  
  // CRITICAL: Use navigator.sendBeacon for reliability
  const sendAnalyticsEvent = useCallback(async (
    event: 'loaded' | 'dwell',
    dwellTimeMs?: number
  ) => {
    const payload = {
      surveyId: options.surveyId,
      event,
      ...(dwellTimeMs && { dwellTimeMs })
    };
    
    const data = JSON.stringify(payload);
    const url = `${options.apiUrl}/widget/analytics`;
    
    // PATTERN: Use sendBeacon with fetch fallback
    if (navigator.sendBeacon && data.length < 64000) {
      navigator.sendBeacon(url, data);
    } else {
      // Fallback to fetch for larger payloads
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data
        });
      } catch (error) {
        console.warn('Analytics beacon failed:', error);
      }
    }
  }, [options.surveyId, options.apiUrl]);
  
  // CRITICAL: Clean up event listeners on unmount
  useEffect(() => {
    const handleBeforeUnload = () => sendDwellEvent();
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sendDwellEvent]);
  
  return {
    ...existingHookReturn,
    sendDwellEvent // For CTA click integration
  };
}
```

#### Task 7: Dashboard Tile Component
```typescript
// Pseudocode for WidgetImpressionsTile.tsx
const WidgetImpressionsTile: React.FC = () => {
  const [data, setData] = useState<WidgetAnalyticsAggregation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // PATTERN: Auto-refresh like Dashboard.tsx
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/widget/analytics/aggregation');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch widget analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // PATTERN: Auto-refresh every 30 seconds
  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval); // CRITICAL: Cleanup
  }, [fetchAnalytics]);
  
  return (
    <div className="dashboard-tile">
      <h3>Widget Impressions (Last 7 Days)</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <LineChart width={400} height={200} data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="loadedCount" stroke="#3182ce" />
        </LineChart>
      )}
    </div>
  );
};
```

### Integration Points
```yaml
DATABASE:
  - migration: "Add WidgetAnalytics table with event tracking"
  - index: "CREATE INDEX idx_widget_analytics_survey_date ON widget_analytics(survey_id, timestamp)"
  
ROUTES:
  - add to: backend/src/app.ts
  - pattern: "app.use('/api/widget', widgetAnalyticsRoutes)"
  
WIDGETS:
  - modify: frontend/src/widget/hooks/useWidget.ts
  - pattern: "Add analytics beacon with sendBeacon fallback"
  
DASHBOARD:
  - modify: frontend/src/components/admin/Dashboard.tsx
  - pattern: "Add WidgetImpressionsTile to metrics grid"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint           # ESLint for code style
npm run type-check     # TypeScript type checking

# Expected: No errors. If errors exist, READ and fix them.
```

### Level 2: Unit Tests
```typescript
// CREATE comprehensive unit tests for each component
describe('WidgetAnalyticsService', () => {
  it('should store loaded event correctly', async () => {
    const event = { surveyId: 'test', event: 'loaded' };
    const result = await widgetAnalyticsService.storeEvent(event);
    expect(result).toBeDefined();
    expect(result.event).toBe('loaded');
  });
  
  it('should store dwell event with time', async () => {
    const event = { surveyId: 'test', event: 'dwell', dwellTimeMs: 5000 };
    const result = await widgetAnalyticsService.storeEvent(event);
    expect(result.dwellTimeMs).toBe(5000);
  });
  
  it('should aggregate 7-day data correctly', async () => {
    const aggregation = await widgetAnalyticsService.getLast7DaysAggregation();
    expect(aggregation).toHaveLength(7);
    expect(aggregation[0]).toHaveProperty('date');
    expect(aggregation[0]).toHaveProperty('loadedCount');
  });
});
```

```bash
# Run unit tests and iterate until passing
npm run test
# If failing: Read error messages, understand root cause, fix code, re-run
```

### Level 3: Integration Tests
```bash
# Test the complete flow
npm run dev  # Start development server

# Test widget analytics endpoint
curl -X POST http://localhost:3000/api/widget/analytics \
  -H "Content-Type: application/json" \
  -d '{"surveyId": "test-survey", "event": "loaded"}'

# Expected: {"success": true, "id": "..."}

# Test aggregation endpoint
curl http://localhost:3000/api/widget/analytics/aggregation?surveyId=test-survey

# Expected: [{"date": "2024-01-01", "loadedCount": 1, "averageDwellTime": 0}]
```

### Level 4: Manual Dashboard Test
```bash
# 1. Start the development server
npm run dev

# 2. Open browser to http://localhost:3000/admin
# 3. Verify WidgetImpressionsTile appears in dashboard
# 4. Verify auto-refresh works (check network tab)
# 5. Test with real widget mount to generate data
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Widget beacon fires on mount and CTA click
- [ ] Dashboard tile displays correct data with auto-refresh
- [ ] API endpoints handle validation and errors gracefully
- [ ] Documentation updated with analytics beacon usage
- [ ] Database migration applied successfully

---

## Anti-Patterns to Avoid
- ❌ Don't create new patterns when existing ones work (follow tracking service patterns)
- ❌ Don't skip validation on analytics endpoints - all inputs must be sanitized
- ❌ Don't ignore cleanup in useEffect hooks - memory leaks will occur
- ❌ Don't hardcode URLs or configuration - use environment variables
- ❌ Don't use sync operations in async context - maintain async/await patterns
- ❌ Don't skip error handling - analytics failures should be graceful
- ❌ Don't exceed 500 lines per component - split into smaller components

## Quality Score
**PRP Quality Score: 9/10**

This PRP provides comprehensive context including:
- ✅ Complete codebase patterns and existing implementations
- ✅ Specific file references and code examples
- ✅ Executable validation commands and test patterns
- ✅ Detailed task breakdown with clear dependencies
- ✅ Known gotchas and library-specific considerations
- ✅ Database schema patterns and migration requirements
- ✅ Documentation patterns and update requirements

**Confidence Level**: High - This PRP should enable one-pass implementation by providing all necessary context, patterns, and validation steps from the existing codebase.