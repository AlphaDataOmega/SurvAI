# 🔗 Widget API Reference

## Overview

The SurvAI Widget API provides the backend endpoints required for the embeddable widget to function. This includes session management, question fetching, and click tracking with proper CORS support for cross-domain integration.

## Base URL

```
https://api.survai.com
```

## Authentication

Widget endpoints are public and do not require authentication. Session management is handled through unique session IDs generated during bootstrap.

## Core Endpoints

### Session Management

#### Bootstrap Session

Creates a new session for widget integration with unique session and click IDs. Supports partner attribution for comprehensive tracking.

```http
POST /api/sessions?partnerId=partner-abc-123
Content-Type: application/json
```

**Request Body:**
```json
{
  "surveyId": "survey_123",
  "metadata": {
    "source": "widget",
    "domain": "partner-site.com",
    "referrer": "https://partner-site.com/page",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Query Parameters:**
- `partnerId` (optional): Partner identifier for attribution tracking. Automatically included in all subsequent API calls.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "clickId": "click_def456",
    "surveyId": "survey_123",
    "metadata": {
      "source": "widget",
      "domain": "partner-site.com"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Survey ID is required",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `201` - Session created successfully
- `400` - Invalid request (missing surveyId)
- `500` - Internal server error

---

### Question Management

#### Get Next Question

Retrieves the next question for a survey session, ordered by EPC performance. Supports partner attribution for comprehensive tracking.

```http
POST /api/questions/:surveyId/next?partnerId=partner-abc-123
Content-Type: application/json
```

**Path Parameters:**
- `surveyId` (string) - Survey identifier

**Query Parameters:**
- `partnerId` (optional): Partner identifier for attribution tracking

**Request Body:**
```json
{
  "sessionId": "session_abc123",
  "previousQuestionId": "question_789",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": {
      "id": "question_abc",
      "type": "CTA_OFFER",
      "text": "Which financial service interests you most?",
      "description": "Select the option that best matches your needs",
      "config": {
        "buttonLayout": "vertical",
        "maxButtons": 3
      }
    },
    "offerButtons": [
      {
        "id": "button_123",
        "text": "Get Your Credit Score",
        "offerId": "offer_456",
        "style": "primary",
        "order": 1
      },
      {
        "id": "button_124",
        "text": "Apply for Loan",
        "offerId": "offer_457",
        "style": "secondary",
        "order": 2
      }
    ],
    "sessionData": {
      "sessionId": "session_abc123",
      "clickId": "click_def456"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Survey not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Question retrieved successfully
- `400` - Invalid request
- `404` - Survey or question not found
- `500` - Internal server error

---

### Click Tracking

#### Track Button Click

Records a button click event for conversion tracking. Supports partner attribution for comprehensive tracking.

```http
POST /api/track/click?partnerId=partner-abc-123
Content-Type: application/json
```

**Query Parameters:**
- `partnerId` (optional): Partner identifier for attribution tracking

**Request Body:**
```json
{
  "sessionId": "session_abc123",
  "questionId": "question_abc",
  "offerId": "offer_456",
  "buttonVariantId": "button_123",
  "timestamp": 1640995200000,
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clickId": "click_def456",
    "tracked": true,
    "redirectUrl": "https://offer-network.com/offer/456?click_id=click_def456"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Session not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Click tracked successfully
- `400` - Invalid request
- `404` - Session or offer not found
- `500` - Internal server error

---

#### Track Button Clicks (Batch)

Records multiple button click events in a single request for improved network efficiency. Supports partner attribution for comprehensive tracking.

```http
POST /api/track/click/batch?partnerId=partner-abc-123
Content-Type: application/json
```

**Query Parameters:**
- `partnerId` (optional): Partner identifier for attribution tracking

**Request Body:**
```json
{
  "batchId": "batch_unique_id",
  "timestamp": 1640995200000,
  "events": [
    {
      "sessionId": "session_abc123",
      "questionId": "question_abc",
      "offerId": "offer_456",
      "buttonVariantId": "button_123",
      "timestamp": 1640995200000,
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1"
    },
    {
      "sessionId": "session_def456",
      "questionId": "question_def",
      "offerId": "offer_789",
      "buttonVariantId": "button_456",
      "timestamp": 1640995210000,
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_unique_id",
    "processed": 2,
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid batch data",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Batch processed successfully
- `400` - Invalid request
- `500` - Internal server error

---

## CORS Configuration

The API is configured to allow cross-domain requests from widget integrations:

```javascript
// CORS headers included in all responses
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information included in response headers
- **Exceeded**: Returns `429 Too Many Requests`

## Data Types

### Session Object
```typescript
interface SessionBootstrapResponse {
  sessionId: string;
  clickId: string;
  surveyId: string;
  metadata?: Record<string, unknown>;
}
```

### Question Object
```typescript
interface Question {
  id: string;
  type: 'CTA_OFFER';
  text: string;
  description?: string;
  config: {
    buttonLayout: 'vertical' | 'horizontal' | 'grid';
    maxButtons?: number;
  };
}
```

### Offer Button Object
```typescript
interface CTAButtonVariant {
  id: string;
  text: string;
  offerId: string;
  style: 'primary' | 'secondary' | 'accent';
  order: number;
}
```

## Widget Integration Flow

1. **Session Bootstrap**: Widget calls `POST /api/sessions` to create session
2. **Question Fetching**: Widget calls `POST /api/questions/:surveyId/next` to get question
3. **User Interaction**: User clicks on offer button
4. **Click Tracking**: Widget calls `POST /api/track/click` to record click
5. **Redirect**: User is redirected to offer URL with tracking parameters

## Security Considerations

### Input Validation
- All request parameters are validated using Joi schemas
- SQL injection protection through Prisma ORM
- XSS prevention through input sanitization

### Session Security
- Session IDs are UUIDs (v4) for uniqueness
- No sensitive data stored in sessions
- Session timeout handled client-side

### CORS Security
- Configured to allow widget domains
- Preflight requests supported
- Credentials handled securely

## Performance Optimization

### Caching
- API responses cached where appropriate
- Database queries optimized with indexes
- EPC calculations cached for performance

### Bundle Size
- Widget API client optimized for minimal size
- Retry logic with exponential backoff
- Request timeout handling

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern=session
npm test -- --testPathPattern=widget
```

### Integration Tests
```bash
# Start test server
npm run dev

# Open test page
open examples/widget-test.html
```

### Load Testing
```bash
# Simulate multiple widget sessions
npm run simulate-pixels -- --clicks 100 --conversion-rate 25
```

## Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure API URL is correct
- Check CORS configuration
- Verify preflight requests

**Session Errors:**
- Validate surveyId exists
- Check session timeout
- Verify API connectivity

**Tracking Issues:**
- Confirm click tracking payload
- Check network connectivity
- Verify offer existence

### Debug Mode

Enable debug logging in widget:
```javascript
const widget = SurvAIWidget.mount(container, {
  surveyId: 'survey-123',
  onError: (error) => {
    console.error('Widget Debug:', {
      type: error.type,
      message: error.message,
      context: error.context
    });
  }
});
```

## Examples

### Basic Widget Integration
```html
<!DOCTYPE html>
<html>
<head>
  <title>SurvAI Widget Example</title>
</head>
<body>
  <div id="survai-widget"></div>
  
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="./dist/widget/survai-widget.umd.js"></script>
  
  <script>
    const widget = SurvAIWidget.mount(document.getElementById('survai-widget'), {
      surveyId: 'survey-123',
      apiUrl: 'https://api.survai.com',
      theme: {
        primaryColor: '#007cba',
        buttonSize: 'large'
      },
      onError: (error) => {
        console.error('Widget error:', error);
      }
    });
  </script>
</body>
</html>
```

### Custom Error Handling
```javascript
const widget = SurvAIWidget.mount(container, {
  surveyId: 'survey-123',
  apiUrl: 'https://api.survai.com',
  onError: (error) => {
    switch (error.type) {
      case 'NETWORK_ERROR':
        showErrorMessage('Network connectivity issue');
        break;
      case 'SURVEY_NOT_FOUND':
        showErrorMessage('Survey not available');
        break;
      default:
        showErrorMessage('An error occurred');
    }
  }
});
```

## Support

For technical support and integration assistance:

- **Documentation**: [Widget Integration Guide](WIDGET.md)
- **Test Page**: [Widget Test Page](../examples/widget-test.html)
- **Issues**: Report issues through support channels
- **Email**: support@survai.com

## Version History

- **v1.0.0**: Initial widget API implementation
  - Session bootstrap endpoint
  - Question fetching with EPC ordering
  - Click tracking with conversion attribution
  - CORS support for cross-domain integration
  - Comprehensive error handling and validation