# Dynamic Question Engine - Deployment & Testing Guide

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and npm
2. **PostgreSQL 14+** database
3. **Redis** (optional, for caching)
4. **Git** for version control

### 1. Environment Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd SurvAI.3.0
npm install

# Set up environment variables
cp .env.example .env
```

### 2. Environment Variables

Create `.env` files in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/survai_dev"

# Security
JWT_SECRET="your-super-secret-jwt-key-here"

# CORS
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

# API Configuration
VITE_API_URL="http://localhost:8000"

# Tracking (Optional)
TRACKING_PIXEL_URL="https://your-tracking-domain.com/pixel"

# Development
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Start PostgreSQL service
# On macOS: brew services start postgresql
# On Ubuntu: sudo systemctl start postgresql

# Run database migrations
cd backend
npx prisma migrate dev --name "initial-migration"

# Generate Prisma client
npx prisma generate

# Seed sample data for testing
npm run seed:cta
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Shared types (watch mode)
cd shared
npm run build:watch
```

### 5. Verify Installation

Visit `http://localhost:3000/survey/[survey-id]` where `[survey-id]` is from the seed data output.

---

## 🧪 Testing the Dynamic Question Engine

### Manual Testing Checklist

#### ✅ Survey Flow
- [ ] Navigate to `/survey/{surveyId}` 
- [ ] Question displays with title and description
- [ ] Multiple offer buttons render correctly
- [ ] Skip button appears at bottom
- [ ] Loading states work during interactions
- [ ] Error states display appropriately

#### ✅ CTA Button Interactions
- [ ] Primary button has correct styling (blue background)
- [ ] Secondary buttons have border styling
- [ ] Accent buttons have green background
- [ ] Hover effects work on all variants
- [ ] Clicks open offers in new tabs
- [ ] Disabled state works during loading

#### ✅ Session Management
- [ ] Session ID persists across page reloads
- [ ] Different browser tabs have separate sessions
- [ ] Session data includes proper tracking info
- [ ] UTM parameters are captured correctly

#### ✅ API Endpoints

Test with curl or Postman:

```bash
# Get next question
curl -X POST http://localhost:8000/api/questions/{surveyId}/next \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-session-123"}'

# Track click
curl -X POST http://localhost:8000/api/track/click \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "questionId": "question-id",
    "offerId": "offer-id", 
    "buttonVariantId": "button-id",
    "timestamp": 1640995200000
  }'

# Get analytics
curl http://localhost:8000/api/track/analytics

# Record conversion
curl "http://localhost:8000/api/track/conversion?click_id=click-123&revenue=25.50"
```

#### ✅ Database Verification

```sql
-- Check questions created
SELECT id, text, type, config FROM questions WHERE type = 'CTA_OFFER';

-- Check offers
SELECT id, title, category, status, "destinationUrl" FROM offers WHERE status = 'ACTIVE';

-- Check click tracking
SELECT id, "offerId", status, converted, revenue, "clickedAt" FROM click_tracks;

-- Verify EPC calculation
SELECT 
  o.title,
  COUNT(ct.id) as total_clicks,
  COUNT(CASE WHEN ct.converted THEN 1 END) as conversions,
  SUM(COALESCE(ct.revenue, 0)) as total_revenue,
  CASE 
    WHEN COUNT(ct.id) > 0 
    THEN SUM(COALESCE(ct.revenue, 0)) / COUNT(ct.id) 
    ELSE 0 
  END as epc
FROM offers o
LEFT JOIN click_tracks ct ON ct."offerId" = o.id
GROUP BY o.id, o.title;
```

### Automated Testing

```bash
# Run all tests
npm test

# Backend unit tests
npm run test:backend

# Frontend component tests  
npm run test:frontend

# Integration tests
npm run test:integration

# E2E tests (if implemented)
npm run test:e2e
```

### Performance Testing

```bash
# Load test click tracking endpoint
curl -X POST http://localhost:8000/api/track/click \
  -H "Content-Type: application/json" \
  -d '{...}' \
  --silent \
  --output /dev/null \
  --write-out "Time: %{time_total}s\n"

# Should be < 200ms as per PRP requirements
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Question Performance**
   - Impression count per question
   - Click-through rate per button variant  
   - Skip rate by question
   - Average time to answer

2. **Offer Performance**
   - Total clicks per offer
   - Conversion rate
   - Revenue per offer
   - EPC (Earnings Per Click)

3. **System Performance**
   - API response times
   - Database query performance
   - Error rates
   - Session tracking accuracy

### Analytics Queries

```sql
-- Top performing offers by EPC
SELECT 
  o.title,
  COUNT(ct.id) as clicks,
  AVG(CASE WHEN ct.converted THEN ct.revenue ELSE 0 END) as avg_revenue,
  COUNT(CASE WHEN ct.converted THEN 1 END)::float / COUNT(ct.id) * 100 as conversion_rate
FROM offers o
JOIN click_tracks ct ON ct."offerId" = o.id
WHERE ct."clickedAt" >= NOW() - INTERVAL '30 days'
GROUP BY o.id, o.title
ORDER BY avg_revenue DESC;

-- Question skip rates
SELECT 
  q.text,
  COUNT(sr.id) as total_sessions,
  COUNT(qa.id) as answered_sessions,
  (COUNT(sr.id) - COUNT(qa.id))::float / COUNT(sr.id) * 100 as skip_rate
FROM questions q
JOIN survey_responses sr ON sr."surveyId" = q."surveyId"
LEFT JOIN question_answers qa ON qa."questionId" = q.id AND qa."responseId" = sr.id
GROUP BY q.id, q.text
ORDER BY skip_rate DESC;

-- Daily click volume
SELECT 
  DATE(ct."clickedAt") as date,
  COUNT(*) as total_clicks,
  COUNT(CASE WHEN ct.converted THEN 1 END) as conversions,
  SUM(COALESCE(ct.revenue, 0)) as revenue
FROM click_tracks ct
WHERE ct."clickedAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE(ct."clickedAt")
ORDER BY date DESC;
```

---

## 🔧 Troubleshooting

### Common Issues

#### "No questions available" Error
- Verify survey exists in database
- Check question `type = 'CTA_OFFER'`
- Ensure survey `status = 'ACTIVE'`
- Verify offers exist and are active

#### Click tracking not working
- Check network requests in browser DevTools
- Verify API endpoint responses
- Check database for click_tracks entries
- Validate session data integrity

#### Frontend components not rendering
- Check console for JavaScript errors
- Verify shared types are built (`npm run build` in shared/)
- Ensure API responses match expected interfaces
- Check for CORS issues

#### Database connection issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Test connection: `npx prisma db push`
- Check firewall/network settings

### Debug Mode

Enable detailed logging:

```bash
# Backend debug mode
DEBUG=* npm run dev

# Frontend with verbose logging
VITE_LOG_LEVEL=debug npm run dev
```

### Database Reset

If you need to reset the database:

```bash
cd backend
npx prisma migrate reset
npm run seed:cta
```

---

## 🚀 Production Deployment

### 1. Build for Production

```bash
# Build all packages
npm run build

# Verify builds
cd backend && npm run start
cd frontend && npm run preview
```

### 2. Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/survai_prod"
JWT_SECRET="production-jwt-secret-very-secure"
CORS_ORIGINS="https://yourdomain.com"
TRACKING_PIXEL_URL="https://tracking.yourdomain.com/pixel"
```

### 3. Database Migration

```bash
# Run migrations on production database
npx prisma migrate deploy

# Generate production client
npx prisma generate
```

### 4. Performance Optimizations

- Enable Redis caching for frequently accessed data
- Set up CDN for static assets
- Configure database connection pooling
- Enable gzip compression
- Set up monitoring and alerting

### 5. Security Checklist

- [ ] HTTPS enabled for all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Database credentials secured
- [ ] JWT secrets are strong and rotated
- [ ] Logging excludes sensitive data

---

## 📈 Success Metrics

Based on PRP specifications:

### Technical Metrics
- ✅ Question load time < 500ms
- ✅ Click tracking response < 200ms  
- ✅ Pixel URL generation < 50ms
- ✅ Component render time < 100ms
- ✅ 95%+ click tracking accuracy

### Business Metrics
- ✅ CTA questions display correctly
- ✅ Offer buttons open in new tabs
- ✅ All clicks logged with session data
- ✅ EPC calculation possible from logs
- ✅ Conversion tracking functional

### Validation Gates
- ✅ TypeScript compilation passes
- ✅ All tests pass (unit, integration, component)
- ✅ API endpoints return expected responses
- ✅ Database schema supports all features
- ✅ Frontend components render correctly

---

## 🎯 Next Steps

After successful deployment:

1. **AI Integration**: Implement dynamic button text generation
2. **A/B Testing**: Test different question variants
3. **Advanced Analytics**: Detailed conversion attribution
4. **Admin Interface**: Question and offer management UI
5. **Mobile Optimization**: Enhanced mobile experience
6. **Fraud Detection**: Advanced click validation

---

## 📞 Support

For issues or questions:

1. Check this documentation
2. Review API documentation
3. Check application logs
4. Test with provided sample data
5. Verify environment configuration

The Dynamic Question Engine is now ready for production use with comprehensive CTA functionality, click tracking, and affiliate monetization capabilities!