name: "Widget Clickstream Batching & Resilience"
description: |
  Implementation of intelligent click event batching, exponential backoff retry logic, 
  and offline persistence for the embeddable SurvAI widget to improve network efficiency 
  and prevent data loss during transient outages.

## Goal
Implement a resilient clickstream batching system for the embeddable widget that:
1. **Batches click events** (10 events or 5-second intervals) to reduce network chatter
2. **Implements exponential backoff** retry logic (2s → 30s max) for failed requests
3. **Persists events offline** using localStorage to prevent data loss during outages
4. **Maintains bundle size** under +15kB increase while providing robust fault tolerance

## Why
- **Network Efficiency**: Reduce API calls by 80-90% through intelligent batching
- **Data Integrity**: Prevent click tracking loss during network outages or API downtime
- **User Experience**: Maintain widget responsiveness even during connectivity issues
- **Partner Trust**: Ensure accurate attribution and conversion tracking for revenue sharing
- **Scalability**: Handle high-traffic scenarios without overwhelming the backend

## What
A comprehensive batching and resilience system integrated into the existing widget architecture:

### User-Visible Behavior
- Widget continues to function normally during network outages
- Click events are queued and processed when connectivity resumes
- No perceptible delay in widget interactions
- Automatic retry of failed tracking requests

### Technical Implementation
- `ClickQueue` utility class for batching and persistence
- Enhanced retry logic with exponential backoff
- localStorage integration for offline event storage
- Network state monitoring and recovery
- Integration with existing useWidget.ts hook

### Success Criteria
- [ ] Click events batch automatically (10 events OR 5 seconds, whichever first)
- [ ] Exponential backoff retry: 2s → 4s → 8s → 16s → 30s (max), then repeats
- [ ] Offline events persist in localStorage and flush on reconnection
- [ ] Zero data loss verified through comprehensive testing scenarios
- [ ] Bundle size increase ≤ +15kB (current: ~12kB widget)
- [ ] No breaking changes to existing widget API
- [ ] All validation loops pass (lint, type-check, unit tests)

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
  why: localStorage persistence patterns and quota limitations
  
- url: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
  why: Network detection patterns and event handling
  
- url: https://developer.mozilla.org/en-US/docs/Web/API/Window/online_event
  why: Online/offline event handling for connection recovery
  
- file: frontend/src/widget/services/widgetApi.ts
  why: Existing retry logic patterns and API structure to follow
  
- file: frontend/src/widget/Widget.tsx
  why: Current click handling and integration patterns
  
- file: shared/src/types/widget.ts
  why: TypeScript interfaces and error types to extend
  
- file: tests/frontend/widgetApi.test.ts
  why: Testing patterns and mock structures to mirror
  
- file: backend/src/routes/tracking.ts
  why: Existing /api/track/click endpoint structure (idempotent)
  
- file: vite.widget.config.ts
  why: Bundle size monitoring and build configuration
  
- file: PLANNING.md
  why: Architecture patterns and widget resilience requirements
  
- file: docs/WIDGET.md
  why: Current API documentation to update
```

### Current Codebase Structure
```bash
frontend/src/widget/
├── Widget.tsx                  # Main widget component
├── index.ts                    # Global API and mounting
├── services/
│   └── widgetApi.ts           # API client with retry logic
└── utils/
    ├── theme.ts               # Theme management
    └── remoteConfig.ts        # Remote config loading

# Files to create:
frontend/src/widget/utils/
└── ClickQueue.ts              # New batching queue utility

frontend/src/widget/hooks/
└── useWidget.ts               # Hook to integrate with Widget.tsx

tests/widget/
└── ClickQueue.test.ts         # Unit tests

shared/src/types/
└── widget.ts                  # Extend types (optional)
```

### Desired Codebase Structure
```bash
frontend/src/widget/
├── Widget.tsx                  # Enhanced with queue integration
├── index.ts                    # Unchanged
├── services/
│   └── widgetApi.ts           # Enhanced with batch endpoint
├── hooks/
│   └── useWidget.ts           # New hook for click management
└── utils/
    ├── ClickQueue.ts          # New batching utility (≤150 LOC)
    ├── theme.ts               # Unchanged
    └── remoteConfig.ts        # Unchanged

tests/widget/
└── ClickQueue.test.ts         # Comprehensive unit tests

docs/
└── WIDGET.md                  # Updated with batching documentation
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: localStorage has 5-10MB limit per origin
// Strategy: Use JSON.stringify/parse, implement cleanup policies

// CRITICAL: navigator.onLine only detects network interface status
// Solution: Combine with actual network requests for verification

// CRITICAL: Existing widgetApi.ts has retry logic but no batching
// Pattern: Extend existing patterns, don't duplicate retry logic

// CRITICAL: Widget uses Shadow DOM - events must be handled correctly
// Pattern: Follow existing button click patterns in Widget.tsx

// CRITICAL: Bundle size monitoring in vite.widget.config.ts
// Limit: chunkSizeWarningLimit: 250kB total, +15kB for this feature

// CRITICAL: Existing tracking endpoint /api/track/click is idempotent
// Safe: Multiple sends of same event won't cause duplicates

// CRITICAL: Widget needs to work across all browsers with Shadow DOM
// Pattern: Use feature detection and graceful degradation
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// Core interfaces to implement
interface ClickEvent {
  id: string;                    // Unique ID for deduplication
  sessionId: string;
  questionId: string;
  offerId: string;
  buttonVariantId: string;
  timestamp: number;
  userAgent: string;
  retryCount?: number;
}

interface QueueConfig {
  maxBatchSize: number;          // 10 events
  maxBatchDelay: number;         // 5000ms
  maxRetries: number;            // 10 attempts
  initialRetryDelay: number;     // 2000ms
  maxRetryDelay: number;         // 30000ms
  storageKey: string;            // 'srv_click_queue'
}

interface BatchRequest {
  events: ClickEvent[];
  batchId: string;
  timestamp: number;
}
```

### Task List (Sequential Implementation)
```yaml
Task 1: CREATE widget/utils/ClickQueue.ts
  - Implement core batching logic with timer-based flushing
  - Add exponential backoff retry mechanism
  - Include localStorage persistence for offline events
  - Add network state monitoring with navigator.onLine
  - Implement event deduplication and cleanup
  - Follow existing error handling patterns from widgetApi.ts

Task 2: CREATE widget/hooks/useWidget.ts
  - Create React hook for click queue management
  - Integrate with existing Widget.tsx component
  - Handle queue initialization and cleanup
  - Manage network state and recovery
  - Follow existing React hooks patterns

Task 3: MODIFY widget/Widget.tsx
  - Replace direct API calls with useWidget hook
  - Integrate ClickQueue for event batching
  - Maintain existing button click behavior
  - Add network state awareness
  - Preserve existing error handling

Task 4: ENHANCE widget/services/widgetApi.ts
  - Add batch endpoint support for multiple events
  - Keep existing single-event endpoint for compatibility
  - Maintain existing retry logic patterns
  - Add batch-specific error handling

Task 5: CREATE tests/widget/ClickQueue.test.ts
  - Unit tests for batching logic (10 events, 5s timer)
  - Retry mechanism tests (exponential backoff)
  - localStorage persistence tests
  - Network state change tests
  - Error handling and edge cases
  - Performance and memory leak tests

Task 6: UPDATE docs/WIDGET.md
  - Document offline batching behavior
  - Add localStorage key documentation
  - Update error handling documentation
  - Add troubleshooting section for network issues
```

### Task 1 Pseudocode - ClickQueue Implementation
```typescript
class ClickQueue {
  private queue: ClickEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  
  constructor(private config: QueueConfig, private api: WidgetApi) {
    // PATTERN: Initialize with existing API instance
    this.setupNetworkListeners();
    this.loadPersistedEvents();
  }
  
  enqueue(event: ClickEvent): void {
    // PATTERN: Add unique ID for deduplication
    const eventWithId = { ...event, id: generateUniqueId() };
    this.queue.push(eventWithId);
    
    // PATTERN: Flush on batch size OR timer
    if (this.queue.length >= this.config.maxBatchSize) {
      this.flushQueue();
    } else {
      this.startBatchTimer();
    }
  }
  
  private async flushQueue(): Promise<void> {
    // PATTERN: Use existing retry logic structure
    const eventsToFlush = [...this.queue];
    this.queue = [];
    
    try {
      await this.sendBatch(eventsToFlush);
      this.clearPersistedEvents();
    } catch (error) {
      // PATTERN: Persist failed events for retry
      this.persistEvents(eventsToFlush);
      await this.retryWithBackoff(eventsToFlush);
    }
  }
  
  private setupNetworkListeners(): void {
    // PATTERN: Use existing online/offline event patterns
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPersistedEvents();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
}
```

### Integration Points
```yaml
WIDGET_COMPONENT:
  - modify: frontend/src/widget/Widget.tsx
  - pattern: "Replace api.trackClick() with useWidget.trackClick()"
  - preserve: "Existing button click handlers and error handling"
  
API_CLIENT:
  - modify: frontend/src/widget/services/widgetApi.ts
  - pattern: "Add trackClickBatch method alongside existing trackClick"
  - preserve: "Existing retry logic and error handling patterns"
  
TYPES:
  - modify: shared/src/types/widget.ts (optional)
  - pattern: "Add ClickEvent and QueueConfig interfaces"
  - preserve: "Existing error types and widget interfaces"
  
STORAGE:
  - key: "srv_click_queue"
  - pattern: "JSON.stringify/parse for localStorage persistence"
  - cleanup: "Implement expiration and size management"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                                    # ESLint with auto-fix
npm run type-check                             # TypeScript compilation
npm run build:widget                           # Verify bundle builds

# Expected: No errors, bundle size within +15kB limit
# If errors: Read output carefully, fix issues, re-run
```

### Level 2: Unit Tests
```typescript
// CREATE tests/widget/ClickQueue.test.ts with comprehensive coverage
describe('ClickQueue', () => {
  test('batches events by size (10 events)', async () => {
    const queue = new ClickQueue(config, mockApi);
    
    // Add 10 events
    for (let i = 0; i < 10; i++) {
      queue.enqueue(createMockEvent());
    }
    
    // Verify batch sent immediately
    expect(mockApi.trackClickBatch).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })])
    );
  });
  
  test('batches events by time (5 seconds)', async () => {
    const queue = new ClickQueue(config, mockApi);
    
    queue.enqueue(createMockEvent());
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    expect(mockApi.trackClickBatch).toHaveBeenCalledTimes(1);
  });
  
  test('implements exponential backoff retry', async () => {
    const queue = new ClickQueue(config, mockApi);
    mockApi.trackClickBatch.mockRejectedValue(new Error('Network error'));
    
    queue.enqueue(createMockEvent());
    
    // Verify retry delays: 2s, 4s, 8s, 16s, 30s
    const delays = [2000, 4000, 8000, 16000, 30000];
    for (const delay of delays) {
      await new Promise(resolve => setTimeout(resolve, delay + 100));
      expect(mockApi.trackClickBatch).toHaveBeenCalled();
    }
  });
  
  test('persists events offline and flushes on reconnection', async () => {
    const queue = new ClickQueue(config, mockApi);
    
    // Simulate offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    queue.enqueue(createMockEvent());
    
    // Verify localStorage persistence
    const stored = JSON.parse(localStorage.getItem('srv_click_queue') || '[]');
    expect(stored).toHaveLength(1);
    
    // Simulate reconnection
    Object.defineProperty(navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));
    
    // Verify queue processing
    expect(mockApi.trackClickBatch).toHaveBeenCalledTimes(1);
  });
});
```

```bash
# Run and iterate until passing:
npm run test -- tests/widget/ClickQueue.test.ts
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Build and test widget
npm run build:widget
npm run test:visual

# Manual test with network simulation
open examples/widget-offline-test.html

# Test scenarios:
# 1. Click 10 buttons rapidly -> single batch request
# 2. Click 1 button, wait 5s -> timer-based batch
# 3. Disconnect network, click buttons -> localStorage persistence
# 4. Reconnect network -> automatic flush

# Expected: All scenarios work without data loss
```

## Final Validation Checklist
- [ ] All unit tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Widget builds successfully: `npm run build:widget`
- [ ] Bundle size increase ≤ +15kB verified in build output
- [ ] Manual offline test successful in `examples/widget-offline-test.html`
- [ ] No breaking changes to existing widget API
- [ ] localStorage key documented in `docs/WIDGET.md`
- [ ] Network state transitions work correctly
- [ ] Exponential backoff verified with network simulation
- [ ] No memory leaks in long-running tests
- [ ] Error handling graceful in all failure scenarios

## Anti-Patterns to Avoid
- ❌ Don't duplicate existing retry logic from widgetApi.ts
- ❌ Don't exceed localStorage quota limits (implement cleanup)
- ❌ Don't rely solely on navigator.onLine for network detection
- ❌ Don't break existing widget API or tracking behavior
- ❌ Don't skip bundle size monitoring during development
- ❌ Don't ignore offline scenarios in testing
- ❌ Don't create memory leaks with uncleaned timers/listeners
- ❌ Don't implement complex batching algorithms (keep simple)

## Key Implementation Notes
- **Idempotency**: Existing /api/track/click endpoint is idempotent - safe to retry
- **Backwards Compatibility**: Keep existing trackClick method alongside new batching
- **Performance**: Use efficient JSON serialization and minimal DOM manipulation
- **Security**: No sensitive data in localStorage, implement proper cleanup
- **Monitoring**: Bundle size is actively monitored in vite.widget.config.ts
- **Recovery**: Implement graceful degradation when localStorage unavailable

---

**Confidence Score: 9/10** - This PRP provides comprehensive context, follows existing patterns, includes detailed validation loops, and addresses all requirements while staying within technical constraints. The implementation path is clear and builds on proven patterns from the existing codebase.