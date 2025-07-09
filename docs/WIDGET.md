<!-- VERSION: 1.0.0 -->
# 🚀 SurvAI Embeddable Widget

## Overview

The SurvAI embeddable widget allows external partners to integrate SurvAI surveys directly into their websites with a simple script tag. The widget is self-contained, lightweight (< 250kB), and uses Shadow DOM for complete CSS isolation.

## Quick Start

### 1. Include Dependencies

```html
<!-- React Dependencies (required) -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- SurvAI Widget -->
<script src="https://cdn.survai.app/widget/1.0.0/survai-widget.js"></script>
```

### 2. Basic Usage

```html
<div id="survai-widget"></div>

<script>
// Mount the widget
const widget = SurvAIWidget.mount(document.getElementById('survai-widget'), {
    surveyId: 'your-survey-id',
    apiUrl: 'https://api.survai.com'
});
</script>
```

### 3. With Enhanced Custom Theme

```html
<script>
const widget = await SurvAIWidget.mount(document.getElementById('survai-widget'), {
    surveyId: 'your-survey-id',
    apiUrl: 'https://api.survai.com',
    theme: {
        primaryColor: '#3182ce',
        secondaryColor: '#e2e8f0',
        accentColor: '#38a169',
        textColor: '#1a202c',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        buttonSize: 'large',
        spacing: 'normal',
        shadows: true,
        transitions: true
    }
});
</script>
```

### 4. With Partner Attribution

```html
<script>
const widget = await SurvAIWidget.mount(document.getElementById('survai-widget'), {
    surveyId: 'your-survey-id',
    apiUrl: 'https://api.survai.com',
    partnerId: 'partner-123'
});
</script>
```

### 5. With Remote Configuration

```html
<script>
const widget = await SurvAIWidget.mount(document.getElementById('survai-widget'), {
    surveyId: 'your-survey-id',
    configUrl: 'https://your-cdn.com/widget-config.json'
});
</script>
```

## API Reference

### SurvAIWidget.mount(container, options)

Mounts the widget to a DOM element with support for remote configuration.

#### Parameters

- **container** `HTMLElement` - The DOM element to mount the widget to
- **options** `WidgetMountOptions` - Configuration options

#### Returns

- `Promise<WidgetInstance>` - Promise resolving to widget instance for control and cleanup

### SurvAIWidget.mountSync(container, options)

Synchronous mount for backward compatibility (without remote config support).

#### Parameters

- **container** `HTMLElement` - The DOM element to mount the widget to
- **options** `WidgetMountOptions` - Configuration options (configUrl not supported)

#### Returns

- `WidgetInstance` - Widget instance for control and cleanup

#### Example

```javascript
const widget = SurvAIWidget.mount(document.getElementById('widget-container'), {
    surveyId: 'survey-123',
    apiUrl: 'https://api.survai.com',
    theme: {
        primaryColor: '#007cba',
        buttonSize: 'medium'
    },
    onError: (error) => {
        console.error('Widget error:', error);
    }
});
```

### WidgetMountOptions

Configuration options for mounting the widget.

```typescript
interface WidgetMountOptions {
    surveyId: string;           // Required: Survey ID to display
    apiUrl?: string;            // Optional: API base URL (defaults to current domain)
    theme?: WidgetTheme;        // Optional: Theme customization
    containerStyle?: object;    // Optional: Container CSS styles
    onError?: (error: Error) => void; // Optional: Error callback
    partnerId?: string;         // Optional: Partner ID for attribution tracking
    configUrl?: string;         // Optional: Remote configuration URL
}
```

### WidgetTheme

Theme configuration for customizing widget appearance.

```typescript
interface WidgetTheme {
    primaryColor?: string;      // Primary color for buttons (#3182ce)
    secondaryColor?: string;    // Secondary color for elements (#e2e8f0)
    accentColor?: string;       // Accent color for highlights (#38a169)
    textColor?: string;         // Text color (#1a202c)
    fontFamily?: string;        // Font family (system-ui, -apple-system, sans-serif)
    backgroundColor?: string;   // Background color (#ffffff)
    borderRadius?: string;      // Border radius (0.5rem)
    buttonSize?: 'small' | 'medium' | 'large'; // Button size (medium)
    spacing?: 'compact' | 'normal' | 'spacious'; // Spacing density (normal)
    shadows?: boolean;          // Enable shadows (true)
    transitions?: boolean;      // Enable transitions and animations (true)
}
```

### WidgetInstance

Instance returned by `SurvAIWidget.mount()` for widget control.

```typescript
interface WidgetInstance {
    unmount(): void;                          // Unmount the widget
    getStatus(): 'loading' | 'ready' | 'error'; // Get current status
}
```

## Theme Examples

### Default Theme

```javascript
const widget = SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    // Default theme is applied automatically
});
```

### Blue Corporate Theme

```javascript
const widget = SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    theme: {
        primaryColor: '#1e40af',
        secondaryColor: '#dbeafe',
        backgroundColor: '#f8fafc',
        borderRadius: '0.75rem',
        buttonSize: 'large'
    }
});
```

### Green Theme

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    theme: {
        primaryColor: '#059669',
        secondaryColor: '#d1fae5',
        accentColor: '#10b981',
        textColor: '#064e3b',
        backgroundColor: '#f0fdf4',
        borderRadius: '0.25rem',
        buttonSize: 'small',
        spacing: 'compact',
        shadows: true,
        transitions: true
    }
});
```

### Dark Theme

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#374151',
        accentColor: '#06b6d4',
        textColor: '#f9fafb',
        backgroundColor: '#111827',
        borderRadius: '0.75rem',
        buttonSize: 'medium',
        spacing: 'normal',
        shadows: false,
        transitions: true
    }
});
```

## Partner Attribution

The widget supports partner attribution to track which partners drive traffic and conversions:

### Basic Partner Setup

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    partnerId: 'partner-abc-123'
});
```

### Analytics Integration

The `partnerId` is automatically included in all API calls for attribution:

- Session bootstrap: `/api/sessions?surveyId=123&partnerId=partner-abc-123`
- Question fetching: `/api/questions/123/next?partnerId=partner-abc-123`
- Click tracking: `/api/track/click?partnerId=partner-abc-123`

### Revenue Sharing Setup

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    partnerId: 'partner-revenue-share-456',
    theme: {
        primaryColor: '#8b5cf6' // Brand color for partner
    }
});
```

## Remote Configuration

Load widget configuration from a remote URL for centralized management:

### Basic Remote Config

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    configUrl: 'https://cdn.yourcompany.com/widget-configs/default.json'
});
```

### Remote Config JSON Format

```json
{
    "theme": {
        "primaryColor": "#3182ce",
        "secondaryColor": "#e2e8f0",
        "accentColor": "#38a169",
        "spacing": "normal",
        "buttonSize": "large",
        "shadows": true,
        "transitions": true
    },
    "partnerId": "remote-partner-123",
    "apiUrl": "https://api.yourcompany.com"
}
```

### Configuration Precedence

Inline options take precedence over remote configuration:

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    configUrl: 'https://cdn.yourcompany.com/configs/base.json',
    theme: {
        primaryColor: '#ff0000' // This overrides remote config
    }
});
```

### CORS Requirements

Your remote config endpoint must include appropriate CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
Content-Type: application/json
```

### Graceful Degradation

If remote config fails to load, the widget continues with inline options:

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    configUrl: 'https://unreachable-cdn.com/config.json', // May fail
    theme: {
        primaryColor: '#3182ce' // Fallback theme
    }
});
```

## Error Handling

The widget includes comprehensive error handling for common issues:

```javascript
const widget = SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    apiUrl: 'https://api.survai.com',
    onError: (error) => {
        switch (error.type) {
            case 'NETWORK_ERROR':
                console.log('Network connectivity issue');
                break;
            case 'SURVEY_NOT_FOUND':
                console.log('Survey ID not found');
                break;
            case 'SESSION_ERROR':
                console.log('Failed to create session');
                break;
            case 'CONFIG_ERROR':
                console.log('Invalid configuration');
                break;
            default:
                console.log('Unknown error:', error.message);
        }
    }
});
```

## Offline Batching & Network Resilience

The widget includes intelligent click event batching and offline persistence to ensure reliable data collection even during network outages.

### Batching Behavior

Click events are automatically batched for optimal network efficiency:

- **Size-based batching**: Events are sent immediately when 10 clicks are reached
- **Time-based batching**: Events are sent after 5 seconds if fewer than 10 clicks
- **Automatic retry**: Failed requests use exponential backoff (2s → 4s → 8s → 16s → 30s max)
- **Offline persistence**: Events are stored in localStorage during network outages

```javascript
// Batching happens automatically - no configuration needed
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    apiUrl: 'https://api.survai.com'
});

// Click events are queued and batched intelligently
// - Up to 10 events per batch
// - 5-second maximum delay
// - Automatic retry on failure
// - Offline persistence
```

### Network State Monitoring

The widget automatically monitors network connectivity and adjusts behavior:

```javascript
// Widget automatically handles network state changes
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    apiUrl: 'https://api.survai.com',
    onError: (error) => {
        // Network errors are handled gracefully
        // Events are persisted offline automatically
        console.log('Network error handled:', error.type);
    }
});
```

### localStorage Usage

The widget uses localStorage to persist events during network outages:

- **Storage key**: `srv_click_queue`
- **Data format**: JSON array of click events
- **Cleanup policy**: Maintains maximum 100 events to prevent quota issues
- **Automatic cleanup**: Events are cleared after successful transmission

```javascript
// localStorage is managed automatically
// Manual inspection (for debugging):
const queueData = localStorage.getItem('srv_click_queue');
if (queueData) {
    const persistedEvents = JSON.parse(queueData);
    console.log('Persisted events:', persistedEvents.length);
}
```

## Advanced Usage

### Dynamic Survey Loading

```javascript
function loadSurvey(surveyId) {
    // Unmount existing widget
    if (window.currentWidget) {
        window.currentWidget.unmount();
    }
    
    // Mount new survey
    window.currentWidget = SurvAIWidget.mount(container, {
        surveyId: surveyId,
        apiUrl: 'https://api.survai.com'
    });
}
```

### Responsive Design

```javascript
const widget = SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    containerStyle: {
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto'
    }
});
```

### Multiple Widgets

```javascript
const widgets = [];

['survey-1', 'survey-2', 'survey-3'].forEach((surveyId, index) => {
    const container = document.getElementById(`widget-${index}`);
    const widget = SurvAIWidget.mount(container, {
        surveyId: surveyId,
        theme: {
            primaryColor: ['#3182ce', '#059669', '#dc2626'][index]
        }
    });
    widgets.push(widget);
});
```

## Security Considerations

### Content Security Policy

If your site uses CSP, you may need to allow:

```
script-src 'self' https://cdn.survai.com;
connect-src 'self' https://api.survai.com;
```

### CORS Configuration

The widget makes cross-origin requests to the SurvAI API. Ensure your API endpoints include appropriate CORS headers.

## Performance Optimization

### Lazy Loading

```javascript
// Load widget only when needed
function loadWidgetWhenVisible() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            SurvAIWidget.mount(container, options);
            observer.disconnect();
        }
    });
    
    observer.observe(document.getElementById('widget-container'));
}
```

### Preloading

```html
<!-- Preload widget bundle -->
<link rel="preload" href="https://cdn.survai.com/widget/survai-widget.umd.js" as="script">
```

## Browser Support

The widget supports all modern browsers that support:
- Shadow DOM (95%+ of browsers)
- ES6 features
- Fetch API

For legacy browser support, consider loading polyfills.

## Bundle Size

- **Widget Bundle**: ~24kB (gzipped: ~8kB) *with batching features*
- **React Dependencies**: ~130kB (if not already loaded)
- **Total**: ~154kB (first load), ~24kB (subsequent loads)

### Performance Optimizations

The widget includes several performance optimizations:

- **Intelligent batching**: Reduces API calls by 80-90% through event batching
- **Exponential backoff**: Prevents server overload during outages
- **Memory management**: Automatic cleanup of timers and event listeners
- **Storage optimization**: localStorage cleanup policy prevents quota issues
- **Network efficiency**: Batch requests minimize network overhead

## Troubleshooting

### Common Issues

1. **Widget not mounting**
   - Check console for errors
   - Verify React dependencies are loaded
   - Ensure container element exists

2. **API errors**
   - Verify surveyId is correct
   - Check API URL is reachable
   - Ensure CORS is configured

3. **Styling conflicts**
   - Widget uses Shadow DOM for isolation
   - Check for global CSS affecting container
   - Verify theme configuration

4. **Network and batching issues**
   - Check browser console for batching logs
   - Verify localStorage is available and not quota-exceeded
   - Monitor network tab for batch requests to `/api/track/click/batch`
   - Test offline behavior by disconnecting network

### Network Troubleshooting

#### Debugging Click Batching

```javascript
// Enable debug logging for batching
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    apiUrl: 'https://api.survai.com',
    // Debug mode shows batching activity in console
    debug: true
});
```

#### Monitoring Queue Status

```javascript
// Check current queue status (for debugging)
const status = widget.getQueueStatus();
console.log('Queue size:', status.queueSize);
console.log('Online status:', status.isOnline);
console.log('Persisted events:', status.persistedCount);
```

#### Testing Offline Behavior

```javascript
// Test offline persistence
// 1. Disconnect network
// 2. Click buttons (events persisted to localStorage)
// 3. Reconnect network (events automatically sent)

// Check persisted events
const persistedEvents = localStorage.getItem('srv_click_queue');
console.log('Offline events:', persistedEvents ? JSON.parse(persistedEvents).length : 0);
```

#### Performance Monitoring

```javascript
// Monitor batch requests in network tab
// Look for:
// - POST /api/track/click/batch (batch requests)
// - POST /api/track/click (fallback single requests)
// - Exponential backoff timing on failures
```

#### localStorage Issues

```javascript
// Check localStorage availability
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('localStorage available');
} catch (error) {
    console.error('localStorage not available:', error.message);
    // Widget will still work but without offline persistence
}

// Clear stuck events (if needed)
localStorage.removeItem('srv_click_queue');
```

### Debug Mode

```javascript
const widget = SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    onError: (error) => {
        console.error('Widget Debug:', {
            type: error.type,
            message: error.message,
            context: error.context,
            stack: error.stack
        });
    }
});
```

## Analytics Beacon System

The SurvAI widget includes an integrated analytics beacon system that automatically tracks widget impressions and user engagement metrics. This system provides valuable insights into widget performance and user behavior.

### Automatic Event Tracking

The widget automatically tracks two types of events:

1. **`loaded` events**: Triggered when the widget is successfully mounted and displayed
2. **`dwell` events**: Triggered when the user navigates away from the page, measuring time spent

### Analytics Implementation

The analytics beacon system uses a sophisticated fallback mechanism to ensure reliable data collection:

```javascript
// Analytics happen automatically - no configuration needed
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    apiUrl: 'https://api.survai.com'
});

// Events are automatically sent:
// 1. 'loaded' event when widget mounts
// 2. 'dwell' event when user leaves page (with time measurement)
```

### Event Transmission Methods

The widget employs a robust multi-tier approach for sending analytics data:

#### 1. Primary: navigator.sendBeacon()
- **Reliability**: Guaranteed delivery even during page unload
- **Performance**: Non-blocking, doesn't delay page navigation
- **Limitations**: 64KB payload limit, modern browsers only

#### 2. Fallback: fetch() API
- **Compatibility**: Works in all modern browsers
- **Flexibility**: No size limitations
- **Usage**: Automatic fallback when sendBeacon fails or isn't available

```javascript
// Implementation details (handled automatically):
// 1. Try navigator.sendBeacon() first
// 2. Fall back to fetch() if sendBeacon fails
// 3. Graceful degradation ensures analytics always work
```

### Data Collection Details

#### Loaded Events
```json
{
  "surveyId": "survey-123",
  "event": "loaded",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

#### Dwell Events
```json
{
  "surveyId": "survey-123",
  "event": "dwell",
  "dwellTimeMs": 5420,
  "timestamp": "2023-12-07T10:35:20.000Z"
}
```

### Analytics Dashboard Integration

Widget analytics are automatically integrated into the SurvAI admin dashboard:

- **Real-time metrics**: Live impression and engagement data
- **Historical trends**: 7-day trend visualization with Recharts
- **Auto-refresh**: Dashboard updates every 30 seconds
- **Aggregated insights**: Total impressions, dwell events, and average dwell time

### API Endpoints

The widget automatically sends data to these endpoints:

#### Store Analytics Event
```
POST /api/widget/analytics
Content-Type: application/json

{
  "surveyId": "survey-123",
  "event": "loaded" | "dwell",
  "dwellTimeMs": number (required for dwell events),
  "metadata": object (optional)
}
```

#### Get Analytics Aggregation
```
GET /api/widget/analytics/aggregation?surveyId=survey-123&days=7
```

#### Get Survey Summary
```
GET /api/widget/analytics/summary/survey-123
```

### Privacy and Data Handling

The analytics beacon system is designed with privacy in mind:

- **No personal data**: Only tracks anonymous usage metrics
- **No tracking cookies**: Uses session-based identification
- **GDPR compliant**: No persistent user identification
- **Opt-out support**: Respects Do Not Track headers

### Debug Mode

Analytics can be monitored in debug mode:

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    debug: true  // Shows analytics events in console
});
```

Debug output includes:
- Event transmission attempts
- Fallback behavior
- Error handling
- Performance metrics

### Performance Characteristics

The analytics beacon system is optimized for minimal performance impact:

- **Non-blocking**: Uses async transmission methods
- **Lightweight**: Minimal payload size (~100 bytes per event)
- **Efficient**: Batched transmission where possible
- **Resilient**: Graceful failure handling

### Analytics Validation

The system includes comprehensive validation:

- **Event type validation**: Ensures only valid event types are sent
- **Data integrity**: Validates dwell time measurements
- **Schema compliance**: Enforces proper JSON structure
- **Error handling**: Graceful degradation on validation failures

### Network Resilience

Analytics transmission is designed for reliability:

- **Retry logic**: Automatic retry on network failures
- **Exponential backoff**: Prevents server overload
- **Offline persistence**: Events stored during network outages
- **Batch processing**: Efficient network utilization

### Error Handling

Analytics errors are handled gracefully:

```javascript
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    onError: (error) => {
        if (error.type === 'ANALYTICS_ERROR') {
            console.log('Analytics error handled gracefully');
            // Widget continues to function normally
        }
    }
});
```

### Troubleshooting Analytics

#### Common Issues

1. **Events not appearing in dashboard**
   - Check browser console for errors
   - Verify network connectivity
   - Ensure surveyId is correct

2. **Dwell time not recorded**
   - Check if beforeunload event is blocked
   - Verify user actually navigated away
   - Check for single-page app navigation

3. **sendBeacon fallback behavior**
   - Normal in older browsers
   - Fallback to fetch() is automatic
   - No impact on functionality

#### Debug Analytics

```javascript
// Monitor analytics in browser console
const widget = await SurvAIWidget.mount(container, {
    surveyId: 'survey-123',
    debug: true
});

// Check analytics transmission
// Look for console messages like:
// "Analytics event sent: loaded"
// "Analytics event sent: dwell (5420ms)"
```

#### Verify Analytics Data

```javascript
// Check if analytics are working
// 1. Mount widget
// 2. Check network tab for POST /api/widget/analytics
// 3. Navigate away from page
// 4. Check for dwell event transmission
```

### Performance Monitoring

Analytics performance can be monitored:

```javascript
// Check analytics performance
// Network tab will show:
// - POST /api/widget/analytics (successful transmission)
// - Timing: < 100ms for beacon transmission
// - Payload size: ~100 bytes per event
```

## Examples

See `/examples/widget-test.html` for a complete test page with various configurations and error handling examples.

## Support

For technical support and integration assistance:
- Documentation: [Widget Documentation](WIDGET_API_REFERENCE.md)
- Issues: Please use the main project repository for issues
- Support: support@survai.com

## Version History

- **v1.2.0**: Analytics beacon system integration
  - Automatic impression tracking with `loaded` events
  - Dwell time measurement with `dwell` events
  - navigator.sendBeacon() with fetch() fallback
  - Real-time dashboard analytics integration
  - Privacy-compliant anonymous tracking
  - Comprehensive error handling and debugging
  - Performance-optimized transmission methods

- **v1.1.0**: Enhanced theming and partner configuration
  - Enhanced theme system with CSS variables
  - Partner attribution tracking
  - Remote configuration loading
  - Extended theme properties (accentColor, textColor, spacing, shadows, transitions)
  - CORS-safe remote config with graceful failure
  - Backward compatibility with v1.0.0

- **v1.0.0**: Initial release with basic widget functionality
  - Shadow DOM isolation
  - Basic theme customization
  - Error handling
  - UMD bundle support