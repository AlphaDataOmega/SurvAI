# Dynamic Question Engine API Documentation

## Overview

The Dynamic Question Engine API provides endpoints for CTA-based survey interactions with affiliate offer tracking and real-time EPC optimization. This system enables monetization through click tracking, conversion optimization, and performance-based question ordering.

## Base URL

```
http://localhost:8000/api
```

## Authentication

Most endpoints are public for survey interactions. Admin endpoints (when implemented) will require authentication.

## Endpoints

### Question Management

#### GET Survey Questions (EPC-Ordered)

```http
GET /questions/survey/:surveyId/questions
```

Get all questions for a survey ordered by EPC performance for optimal revenue generation.

**Parameters:**
- `surveyId` (path, required): Survey identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "question-123",
      "surveyId": "survey-456",
      "type": "CTA_OFFER",
      "text": "What interests you most?",
      "description": "Select your preference",
      "config": {
        "maxButtons": 3,
        "buttonLayout": "vertical"
      },
      "order": 2,
      "createdAt": "2025-01-08T15:30:00.000Z",
      "updatedAt": "2025-01-08T15:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-08T15:46:00.000Z"
}
```

**Features:**
- Questions automatically ordered by EPC performance (highest first)
- Graceful fallback to static `order` when EPCs unavailable
- Real-time performance optimization

#### GET Survey Analytics

```http
GET /questions/survey/:surveyId/analytics
```

Get comprehensive analytics for a survey including question-level EPC performance data.

**Parameters:**
- `surveyId` (path, required): Survey identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "surveyId": "survey-456",
    "totalQuestions": 3,
    "questionAnalytics": [
      {
        "questionId": "question-789",
        "text": "Choose your preference",
        "order": 1,
        "epcScore": 4.85
      },
      {
        "questionId": "question-123",
        "text": "What interests you most?",
        "order": 2,
        "epcScore": 3.42
      },
      {
        "questionId": "question-456",
        "text": "Tell us about yourself",
        "order": 3,
        "epcScore": 0.0
      }
    ]
  },
  "timestamp": "2025-01-08T15:46:00.000Z"
}
```

**Features:**
- Questions sorted by EPC performance
- Individual question performance metrics
- Zero EPC identification for optimization opportunities

#### GET Next Question

```http
POST /questions/:surveyId/next
```

Get the next CTA question for a survey session with associated offer buttons.

**Parameters:**
- `surveyId` (path, required): Survey identifier

**Request Body:**
```json
{
  "sessionId": "string (optional)",
  "previousQuestionId": "string (optional)",
  "userAgent": "string (optional)",
  "ipAddress": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": {
      "id": "question-123",
      "surveyId": "survey-456",
      "type": "CTA_OFFER",
      "text": "What are you most interested in?",
      "description": "Choose the option that best fits your needs",
      "config": {
        "maxButtons": 3,
        "buttonLayout": "vertical",
        "ctaStyle": {
          "primaryColor": "#3182ce",
          "buttonSize": "large"
        }
      },
      "options": [],
      "order": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "offerButtons": [
      {
        "id": "button-abc",
        "text": "Get Financial Advice",
        "offerId": "offer-finance",
        "style": "primary",
        "order": 1
      },
      {
        "id": "button-def",
        "text": "Learn About Insurance",
        "offerId": "offer-insurance",
        "style": "secondary",
        "order": 2
      }
    ],
    "sessionData": {
      "sessionId": "session-789",
      "clickId": "click-xyz",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "utmParams": {}
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404`: No more questions available
- `400`: Invalid survey ID
- `500`: Server error

---

#### Skip Question

```http
POST /questions/:surveyId/skip
```

Skip the current question and get the next one.

**Parameters:**
- `surveyId` (path, required): Survey identifier

**Request Body:**
```json
{
  "sessionId": "string (required)",
  "questionId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Same as next question response, or:
    "completed": true
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

#### Get Question Analytics

```http
GET /questions/:questionId/analytics
```

Get analytics data for a specific question.

**Parameters:**
- `questionId` (path, required): Question identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "questionId": "question-123",
    "impressions": 1000,
    "buttonClicks": 150,
    "skipRate": 0.25,
    "conversionRate": 0.12
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### Question Administration (New)

#### Generate Question

```http
POST /questions/generate
```

Generate a new question with optional AI content generation.

**Request Body:**
```json
{
  "surveyId": "string (required)",
  "useAI": "boolean (optional, default: false)",
  "text": "string (required if not using AI)",
  "description": "string (optional)",
  "type": "CTA_OFFER (optional, default: CTA_OFFER)",
  "config": "object (optional)",
  "options": "array (optional)",
  "order": "number (optional)",
  "required": "boolean (optional, default: false)",
  "logic": "object (optional)",
  "aiContext": {
    "userIncome": "string (optional)",
    "employment": "string (optional)",
    "surveyType": "string (optional)",
    "targetAudience": "string (optional)",
    "previousAnswers": "object (optional)",
    "metadata": "object (optional)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "question-new-123",
    "surveyId": "survey-456",
    "type": "CTA_OFFER",
    "text": "What financial goal interests you most?",
    "description": "Select your primary financial objective",
    "config": { "maxButtons": 3 },
    "options": [],
    "order": 2,
    "required": true,
    "logic": null,
    "aiVersions": {
      "generated": true,
      "provider": "openai",
      "confidence": 0.95,
      "generatedAt": "2024-01-01T00:00:00Z",
      "originalContext": {
        "userIncome": "50000-75000",
        "employment": "full-time"
      }
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Features:**
- **AI Integration**: Uses AIService for intelligent question generation
- **Fallback Handling**: Falls back to provided text if AI generation fails
- **Validation**: Comprehensive Zod schema validation
- **Context Awareness**: AI considers user context for personalized questions
- **Metadata Tracking**: Stores AI generation details for analytics

**Error Responses:**
- `400`: Validation error (missing surveyId, invalid data)
- `400`: AI generation failed with no fallback text
- `500`: Server error

---

#### Update Question

```http
PUT /questions/:id
```

Update an existing question.

**Parameters:**
- `id` (path, required): Question identifier

**Request Body:**
```json
{
  "text": "string (optional)",
  "description": "string (optional)",
  "config": "object (optional)",
  "options": "array (optional)",
  "order": "number (optional)",
  "required": "boolean (optional)",
  "logic": "object (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "question-123",
    "surveyId": "survey-456",
    "type": "CTA_OFFER",
    "text": "Updated question text",
    "description": "Updated description",
    "config": { "maxButtons": 3 },
    "options": [],
    "order": 1,
    "required": true,
    "logic": null,
    "aiVersions": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:05:00Z"
  },
  "timestamp": "2024-01-01T00:05:00Z"
}
```

**Features:**
- **Partial Updates**: Only provided fields are updated
- **Validation**: Zod schema validation for all fields
- **Existence Check**: Verifies question exists before updating

**Error Responses:**
- `400`: Validation error (invalid field values)
- `404`: Question not found
- `500`: Server error

---

#### Get Survey Questions

```http
GET /questions/:surveyId
```

Get all questions for a survey, ordered by EPC performance.

**Parameters:**
- `surveyId` (path, required): Survey identifier

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "question-123",
      "surveyId": "survey-456",
      "type": "CTA_OFFER",
      "text": "What interests you most?",
      "description": "Choose your preference",
      "config": { "maxButtons": 3 },
      "options": [],
      "order": 1,
      "logic": null,
      "aiVersions": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "question-456",
      "surveyId": "survey-456",
      "type": "CTA_OFFER",
      "text": "What's your primary goal?",
      "description": "Select your main objective",
      "config": { "maxButtons": 3 },
      "options": [],
      "order": 2,
      "logic": null,
      "aiVersions": {
        "generated": true,
        "provider": "openai",
        "confidence": 0.92
      },
      "createdAt": "2024-01-01T00:05:00Z",
      "updatedAt": "2024-01-01T00:05:00Z"
    }
  ],
  "timestamp": "2024-01-01T00:05:00Z"
}
```

**Features:**
- **EPC Ordering**: Questions ordered by performance metrics
- **Complete Data**: Includes all question fields and metadata
- **AI Metadata**: Shows which questions were AI-generated

**Error Responses:**
- `400`: Invalid survey ID
- `500`: Server error

---

### Click Tracking

#### Track Button Click

```http
POST /track/click
```

Track a CTA button click and return the offer redirect URL.

**Request Body:**
```json
{
  "sessionId": "string (required)",
  "questionId": "string (required)",
  "offerId": "string (required)",
  "buttonVariantId": "string (required)",
  "timestamp": "number (optional)",
  "userAgent": "string (optional)",
  "ipAddress": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clickTrack": {
      "id": "click-track-123",
      "offerId": "offer-456",
      "responseId": "response-789",
      "session": {
        "sessionId": "session-abc",
        "clickId": "click-def",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "deviceInfo": {
          "type": "DESKTOP",
          "isMobile": false
        }
      },
      "status": "VALID",
      "converted": false,
      "clickedAt": "2024-01-01T00:00:00Z"
    },
    "redirectUrl": "https://example.com/offer?click_id=click-def&survey_id=survey-456&session_id=session-abc"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Enhanced Features:**
- **Comprehensive Input Validation**: All parameters validated using Joi schemas
- **Session Validation**: Verifies session exists and is valid before processing
- **Offer Validation**: Ensures offer exists and is active
- **Device Detection**: Automatically detects and tracks device type
- **Atomic Transaction**: Click tracking uses database transactions for consistency

**Error Responses:**
- `400`: Missing required fields, validation errors, or invalid session/offer
- `404`: Offer not found or session not found
- `500`: Server error

---

#### Record Conversion

```http
GET /track/conversion?click_id={clickId}&revenue={revenue}
POST /track/conversion
```

Record a conversion for pixel tracking or postback.

**Query Parameters (GET):**
- `click_id` (required): The click ID to mark as converted
- `revenue` (optional): Conversion revenue amount

**Request Body (POST):**
```json
{
  "click_id": "string (required)",
  "revenue": "number (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "converted": true
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Enhanced Features:**
- **Idempotent Conversions**: Prevents double-conversions through atomic transactions
- **Input Validation**: Comprehensive validation of click_id and revenue parameters
- **Revenue Validation**: Ensures revenue is positive with proper decimal precision
- **Transaction Safety**: Uses database transactions to prevent race conditions
- **Enhanced Error Handling**: Detailed error messages for validation failures

---

#### Get Tracking Analytics

```http
GET /track/analytics?offerId={offerId}
```

Get overall or offer-specific tracking analytics.

**Query Parameters:**
- `offerId` (optional): Filter by specific offer

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClicks": 5000,
    "conversions": 350,
    "conversionRate": 7.0,
    "totalRevenue": 8750.00,
    "epc": 1.75
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

#### Generate Tracking Pixel

```http
POST /track/pixel
```

Generate a tracking pixel URL for conversion tracking.

**Request Body:**
```json
{
  "clickId": "string (required)",
  "surveyId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pixelUrl": "https://tracking.survai.app/pixel?click_id=click-123&survey_id=survey-456&t=1640995200000"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Data Models

### Question

```typescript
interface Question {
  id: string;
  surveyId: string;
  type: 'CTA_OFFER';
  text: string;
  description?: string;
  config: {
    maxButtons?: number;
    buttonLayout?: 'vertical' | 'horizontal' | 'grid';
    ctaStyle?: {
      primaryColor?: string;
      secondaryColor?: string;
      buttonSize?: 'small' | 'medium' | 'large';
    };
  };
  options?: CTAButtonVariant[];
  order: number;
  logic?: QuestionLogic;
  aiVersions?: AIQuestionVersion[];
  createdAt: Date;
  updatedAt: Date;
}
```

### CTA Button Variant

```typescript
interface CTAButtonVariant {
  id: string;
  text: string;
  offerId: string;
  style?: 'primary' | 'secondary' | 'accent';
  order: number;
}
```

### Click Track

```typescript
interface ClickTrack {
  id: string;
  offerId: string;
  responseId?: string;
  session: ClickSession;
  status: 'VALID' | 'PENDING' | 'FILTERED' | 'DUPLICATE' | 'FRAUD';
  converted: boolean;
  convertedAt?: Date;
  revenue?: number;
  clickedAt: Date;
  metadata?: Record<string, unknown>;
}
```

### Session Data

```typescript
interface ResponseSession {
  sessionId: string;
  clickId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmParams?: Record<string, string>;
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request parameters or missing required fields
- `404 Not Found`: Resource not found (survey, question, offer)
- `429 Too Many Requests`: Rate limiting exceeded
- `500 Internal Server Error`: Server-side error

---

## Rate Limiting

- General API endpoints: 100 requests per 15 minutes per IP
- Click tracking: Higher limits for performance (1000 requests per minute)
- Conversion tracking: 500 requests per minute per IP

---

## URL Template Variables

Offer destination URLs support template variables that are replaced during click tracking:

- `{click_id}`: Unique click identifier
- `{survey_id}`: Survey identifier
- `{session_id}`: Session identifier

Example:
```
https://example.com/offer?click_id={click_id}&survey_id={survey_id}&ref=survai
```

Becomes:
```
https://example.com/offer?click_id=click-abc123&survey_id=survey-def456&ref=survai
```

---

## Performance Specifications

Based on PRP requirements:

- **Question load time**: < 500ms
- **Click tracking response**: < 200ms  
- **Pixel URL generation**: < 50ms
- **Component render time**: < 100ms

---

## Testing Endpoints

### Health Check

```http
GET /health
```

Verify API is running and database connectivity.

### Sample Survey

Use the seeded survey data from `seedCTAData.ts` for testing:

1. Get survey ID from seed script output
2. Make requests to `/questions/{surveyId}/next`
3. Track clicks with sample offers
4. Verify tracking analytics

---

## Integration Examples

### Frontend Integration

```typescript
// Get next question
const response = await fetch('/api/questions/survey-123/next', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'user-session-456'
  })
});

const { data } = await response.json();
// Display question and offer buttons

// Track button click
const clickResponse = await fetch('/api/track/click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'user-session-456',
    questionId: data.question.id,
    offerId: 'offer-123',
    buttonVariantId: 'button-456',
    timestamp: Date.now()
  })
});

const { data: trackData } = await clickResponse.json();
// Open redirect URL in new tab
window.open(trackData.redirectUrl, '_blank');
```

### Conversion Tracking

Implement pixel tracking or server-to-server postbacks:

```html
<!-- Pixel tracking -->
<img src="https://tracking.survai.app/pixel?click_id=click-123&survey_id=survey-456" width="1" height="1" style="display:none;" />
```

```javascript
// Server-to-server postback
fetch('/api/track/conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    click_id: 'click-123',
    revenue: 25.50
  })
});
```

---

## Testing Tools

### Pixel Simulation Script

The system includes a comprehensive pixel simulation script for testing click tracking and conversion verification:

```bash
# Run default simulation
npm run simulate-pixels

# Custom simulation with specific parameters
npm run simulate-pixels -- --clicks 50 --conversion-rate 30 --revenue-min 10 --revenue-max 100

# Show all available options
npm run simulate-pixels -- --help
```

**Features:**
- **Configurable Parameters**: Set click count, conversion rate, revenue range
- **Idempotent Testing**: Verifies double-conversion prevention
- **Performance Testing**: Ensures sub-200ms response times
- **Comprehensive Reporting**: Detailed results with EPC calculations
- **Auto-cleanup**: Removes test data after completion

**Example Output:**
```
🚀 Starting pixel simulation...
Configuration:
  - Clicks: 10
  - Conversion Rate: 30%
  - Revenue Range: $10.00 - $50.00
  - Simulate Double Conversions: true

📊 Simulating click tracking...
✅ Click 1: click-abc-123
✅ Click 2: click-def-456
...

🎯 Simulating conversions...
✅ Conversion 1: click-abc-123 - $25.50
✅ Conversion 2: click-def-456 - $42.00
...

🔄 Testing idempotent double conversions...
✅ Double conversion blocked (idempotent): click-abc-123
✅ Double conversion blocked (idempotent): click-def-456

📈 SIMULATION RESULTS
==================================================
Total Clicks: 10
Successful Clicks: 10
Total Conversions: 3
Blocked Double Conversions: 2
Total Revenue: $95.50
Calculated EPC: $9.55
Execution Time: 2345ms
==================================================
```

---

## Security Considerations

- **Enhanced Input Validation**: Comprehensive Joi schemas for all endpoints
- **Idempotent Operations**: Prevents double-processing of conversions
- **Session Validation**: Verifies session existence before processing
- **Rate limiting**: Prevents abuse and ensures system stability
- **IP tracking**: For fraud detection and analytics
- **Secure URL parameter handling**: Template variables safely processed
- **CORS configuration**: Configured for frontend domains
- **No PII in click tracking**: Uses click IDs for privacy protection