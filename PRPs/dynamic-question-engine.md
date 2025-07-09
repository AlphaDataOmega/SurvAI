# PRP: Dynamic Question Engine - Offer-Based CTA Questions

## 🎯 Feature Overview

Implement a dynamic question component system using offer-based CTA (Call-to-Action) buttons for lead generation monetization. This system presents AI-generated persuasive prompts with clickable button variants that redirect to external affiliate offers, with comprehensive click tracking for EPC (Earnings Per Click) optimization.

**Key Difference:** These are NOT traditional survey questions - they're monetization CTAs disguised as engaging questions, similar to lead generation landing pages.

## 📋 Requirements Summary

### Backend Requirements
- **GET /api/questions/next** - Returns next CTA question with offer buttons for session
- **POST /api/track-click** - Logs click events with comprehensive tracking data
- **Pixel URL generation** - Creates tracking URLs with embedded parameters
- **Database schema updates** - Extend Question/Offer models for CTA functionality

### Frontend Requirements  
- **QuestionCard.tsx** - Renders CTA-style question with button options
- **OfferButton.tsx** - Individual clickable button with tracking and new tab opening
- **Tracking integration** - Click event tracking with session management
- **Responsive layout** - Variable button count support with proper spacing

### Success Criteria
- CTA questions display with multiple offer buttons
- Clicks open offers in new tabs with tracking parameters
- All clicks logged to database with session/question/offer association
- Pixel URLs generate correctly with click_id and survey_id
- EPC calculation possible from click logs

## 🔍 Codebase Context & Patterns

### Existing Architecture Patterns

**API Structure Pattern** (from `/backend/src/routes/auth.ts`):
```typescript
// Route definition pattern
router.post('/login', authController.login.bind(authController));
router.get('/me', authenticateUser, authController.getCurrentUser.bind(authController));

// Controller class pattern
export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation with proper error handling
    } catch (error) {
      next(error);
    }
  }
}
```

**Service Pattern** (from `/backend/src/services/authService.ts`):
```typescript
export class AuthService {
  async methodName(params: Type): Promise<ReturnType> {
    // Async implementation
  }
}
// Export singleton
export const authService = new AuthService();
```

**Frontend Component Pattern** (from existing components):
```typescript
export interface ComponentProps {
  required: Type;
  optional?: Type;
}

export const Component: React.FC<ComponentProps> = ({ required, optional }) => {
  const [state, setState] = useState<Type>(initialValue);
  
  const handleEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation
  };

  return (
    <div className="existing-css-classes">
      {/* JSX */}
    </div>
  );
};
```

### Existing Database Models

**Current Question Model** (from `/backend/prisma/schema.prisma`):
```prisma
model Question {
  id          String       @id @default(cuid())
  surveyId    String
  type        QuestionType
  text        String
  description String?
  config      Json?        // ← Extend this for CTA configuration
  options     Json?        // ← Store button variants here
  order       Int
  required    Boolean      @default(false)
  logic       Json?        // ← Branching to offers
  aiVersions  Json?        // ← AI-generated CTA variants
  // ... existing fields
}
```

**Existing Offer Model**:
```prisma
model Offer {
  id             String      @id @default(cuid())
  title          String
  description    String?
  category       OfferCategory
  status         OfferStatus @default(PENDING)
  destinationUrl String      // ← Template with {click_id}, {survey_id}
  pixelUrl       String?     // ← For conversion tracking
  config         Json?
  targeting      Json?
  metrics        Json?
  // ... existing fields
}
```

### Shared Types Available

**Question Types** (from `/shared/src/types/survey.ts`):
```typescript
export interface Question {
  id: string;
  surveyId: string;
  type: QuestionType;
  text: string;
  config: QuestionConfig;
  options?: QuestionOption[];
  logic?: QuestionLogic; // ← Use for offer targeting
  aiVersions?: AIQuestionVersion[];
}

export interface QuestionLogic {
  conditions: LogicCondition[];
  defaultNext?: string;
}

export interface LogicCondition {
  optionId: string;
  action: LogicAction; // ← SHOW_OFFER action available
  target: string; // ← Offer ID
}
```

**Offer Types** (from `/shared/src/types/offer.ts`):
```typescript
export interface Offer {
  id: string;
  title: string;
  destinationUrl: string; // ← Template URL
  pixelUrl?: string;
  config: OfferConfig;
  metrics: OfferMetrics;
}

export interface ClickTrack {
  id: string;
  offerId: string;
  responseId?: string;
  session: ClickSession;
  status: ClickStatus;
  converted: boolean;
  revenue?: number;
  clickedAt: Date;
}
```

## 🌐 External Research & Best Practices

### CTA Button Design Best Practices (2024)
- **Mobile-first design**: 83% of landing page visits happen on mobile devices
- **Color contrast**: CTA buttons should stand out with contrasting colors
- **Action-oriented copy**: Use specific, urgent language ("Get Your Free Quote" vs "Learn More")
- **Multiple placement**: Place CTAs above fold and at natural stopping points
- **Social proof**: Adding social proof near CTAs boosts effectiveness by 20%

**Reference Sources:**
- [Unbounce CTA Best Practices](https://unbounce.com/conversion-rate-optimization/call-to-action-examples/)
- [Lead Generation CTA Examples](https://wisernotify.com/blog/lead-generation-cta/)

### Pixel Tracking Implementation
- **Cookieless tracking**: First-party cookies with click ID assignment
- **Privacy compliance**: Use click IDs instead of PII for GDPR compliance
- **Fallback systems**: Server-to-server postback URLs as backup
- **Mobile considerations**: Handle cross-device tracking limitations

**Reference Sources:**
- [Affiliate Tracking Guide 2024](https://www.partnero.com/articles/what-is-affiliate-tracking-a-beginners-guide-to-getting-started-2024)
- [Pixel Tracking Implementation](https://improvado.io/blog/what-is-tracking-pixel)

## 📝 Implementation Blueprint

### Phase 1: Extend Shared Types

Create new interfaces for CTA-specific functionality:

```typescript
// shared/src/types/survey.ts additions
export interface CTAQuestionConfig extends QuestionConfig {
  /** CTA-specific styling */
  ctaStyle?: CTAStyle;
  /** Button layout configuration */
  buttonLayout?: 'vertical' | 'horizontal' | 'grid';
  /** Maximum buttons to show */
  maxButtons?: number;
}

export interface CTAButtonVariant {
  id: string;
  text: string;
  offerId: string;
  style?: 'primary' | 'secondary' | 'accent';
  order: number;
}

export interface NextQuestionRequest {
  sessionId: string;
  surveyId: string;
  previousQuestionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface NextQuestionResponse {
  question: Question;
  offerButtons: CTAButtonVariant[];
  sessionData: ResponseSession;
}

export interface TrackClickRequest {
  sessionId: string;
  questionId: string;
  offerId: string;
  buttonVariantId: string;
  timestamp: number;
  userAgent?: string;
  ipAddress?: string;
}
```

### Phase 2: Database Schema Updates

Extend existing models without breaking changes:

```prisma
// Add enum value to QuestionType
enum QuestionType {
  // ... existing types
  CTA_OFFER // ← New type for CTA questions
}

// The existing Question.config and Question.options JSON fields
// will store CTA-specific data structure
```

### Phase 3: Backend Services Implementation

**Question Service** (`/backend/src/services/questionService.ts`):
```typescript
export class QuestionService {
  async getNextQuestion(request: NextQuestionRequest): Promise<NextQuestionResponse> {
    // 1. Get or create survey response session
    // 2. Determine next question based on logic
    // 3. Get eligible offers for question
    // 4. Generate button variants
    // 5. Return structured response
  }

  async generateCTAVariants(question: Question, offers: Offer[]): Promise<CTAButtonVariant[]> {
    // AI integration point for generating button copy
  }
}
```

**Tracking Service** (`/backend/src/services/trackingService.ts`):
```typescript
export class TrackingService {
  async trackClick(request: TrackClickRequest): Promise<ClickTrack> {
    // 1. Generate unique click ID
    // 2. Store click record in database
    // 3. Associate with session and offer
    // 4. Return tracking data
  }

  generatePixelUrl(clickId: string, surveyId: string): string {
    // Generate tracking pixel URL with parameters
    return `https://tracking.domain.com/pixel?click_id=${clickId}&survey_id=${surveyId}`;
  }

  generateOfferUrl(offer: Offer, variables: UrlVariables): string {
    // Replace template variables in offer destination URL
  }
}
```

### Phase 4: API Controllers

**Question Controller** (`/backend/src/controllers/questionController.ts`):
```typescript
export class QuestionController {
  async getNext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: NextQuestionRequest = {
        sessionId: req.body.sessionId || uuidv4(),
        surveyId: req.params.surveyId,
        previousQuestionId: req.body.previousQuestionId,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      };

      const response = await questionService.getNextQuestion(request);
      
      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}
```

**Tracking Controller** (`/backend/src/controllers/trackingController.ts`):
```typescript
export class TrackingController {
  async trackClick(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Follow existing auth controller pattern
    // Validate request, call service, return standardized response
  }
}
```

### Phase 5: Frontend Components

**QuestionCard Component** (`/frontend/src/components/survey/QuestionCard.tsx`):
```typescript
export interface QuestionCardProps {
  question: Question;
  offerButtons: CTAButtonVariant[];
  onButtonClick: (buttonId: string, offerId: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  offerButtons,
  onButtonClick,
  isLoading,
  error
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{question.text}</h2>
        {question.description && (
          <p className="text-gray-600">{question.description}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {offerButtons.map((button) => (
          <OfferButton
            key={button.id}
            variant={button}
            onClick={() => onButtonClick(button.id, button.offerId)}
            disabled={isLoading}
          />
        ))}
        
        <button className="btn btn-secondary w-full">
          No Thanks
        </button>
      </div>
      
      {error && (
        <div className="text-red-600 mt-4">{error}</div>
      )}
    </div>
  );
};
```

**OfferButton Component** (`/frontend/src/components/survey/OfferButton.tsx`):
```typescript
export interface OfferButtonProps {
  variant: CTAButtonVariant;
  onClick: () => void;
  disabled?: boolean;
}

export const OfferButton: React.FC<OfferButtonProps> = ({
  variant,
  onClick,
  disabled
}) => {
  const buttonClass = `btn ${
    variant.style === 'primary' ? 'btn-primary' : 'btn-secondary'
  } w-full`;

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {variant.text}
    </button>
  );
};
```

### Phase 6: Survey Hook Integration

**Extended Survey Hook** (`/frontend/src/hooks/useSurvey.ts`):
```typescript
export const useSurvey = (surveyId: string) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [offerButtons, setOfferButtons] = useState<CTAButtonVariant[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNextQuestion = useCallback(async (previousQuestionId?: string) => {
    // API call to GET /api/questions/next
  }, [surveyId, sessionId]);

  const handleButtonClick = useCallback(async (buttonId: string, offerId: string) => {
    try {
      // 1. Track click via POST /api/track-click
      const trackResponse = await trackingService.trackClick({
        sessionId,
        questionId: currentQuestion?.id!,
        offerId,
        buttonVariantId: buttonId,
        timestamp: Date.now()
      });

      // 2. Generate offer URL with tracking parameters
      const offerUrl = trackingService.generateOfferUrl(offerId, {
        clickId: trackResponse.data.clickId,
        surveyId,
        sessionId
      });

      // 3. Open in new tab
      window.open(offerUrl, '_blank', 'noopener,noreferrer');

      // 4. Load next question
      await loadNextQuestion(currentQuestion?.id);
    } catch (error) {
      setError(error.message);
    }
  }, [sessionId, currentQuestion]);

  return {
    currentQuestion,
    offerButtons,
    loadNextQuestion,
    handleButtonClick,
    isLoading,
    error
  };
};
```

## 🧪 Validation Gates

### Level 1: Syntax & Style Validation
```bash
# TypeScript compilation
npm run build

# ESLint checks
npm run lint

# Prettier formatting
npm run format
```

### Level 2: Unit Test Validation
```bash
# Backend unit tests
npm run test:backend -- --testPathPattern="question|tracking"

# Frontend component tests
npm run test:frontend -- --testPathPattern="QuestionCard|OfferButton"

# Shared types tests
npm run test:shared
```

### Level 3: Integration Test Validation
```bash
# API endpoint tests
npm run test:backend -- --testPathPattern="questionController|trackingController"

# Full question flow test
npm run test:integration -- --testPathPattern="question-flow"
```

### Level 4: End-to-End Validation
```bash
# Start development environment
npm run dev

# Manual validation checklist:
# ✓ GET /api/questions/next returns CTA question
# ✓ Buttons render with proper styling
# ✓ Click tracking logs to database
# ✓ Offer URLs open with parameters
# ✓ Pixel URLs generate correctly
# ✓ EPC calculation possible from logs
```

## 📁 Implementation Tasks (Execution Order)

### Backend Implementation
1. **Update Shared Types** (`/shared/src/types/`)
   - Add CTA-specific interfaces
   - Extend existing question/offer types
   - Add tracking request/response types

2. **Create Services** (`/backend/src/services/`)
   - `questionService.ts` - Question logic and AI integration
   - `trackingService.ts` - Click tracking and URL generation

3. **Create Controllers** (`/backend/src/controllers/`)
   - `questionController.ts` - Question API endpoints
   - `trackingController.ts` - Click tracking endpoints

4. **Create Routes** (`/backend/src/routes/`)
   - `questions.ts` - Question route definitions
   - `tracking.ts` - Tracking route definitions

5. **Update Main App** (`/backend/src/app.ts`)
   - Register new route handlers

### Frontend Implementation
6. **Create Components** (`/frontend/src/components/survey/`)
   - `QuestionCard.tsx` - Main question display
   - `OfferButton.tsx` - Individual CTA button

7. **Create Services** (`/frontend/src/services/`)
   - `tracking.ts` - Frontend tracking API client

8. **Create Hooks** (`/frontend/src/hooks/`)
   - `useSurvey.ts` - Survey flow management

9. **Update Survey Page** (`/frontend/src/pages/SurveyPage.tsx`)
   - Integrate new components and hooks

### Testing & Documentation
10. **Create Tests** (`/tests/`)
    - Backend service tests
    - Controller integration tests
    - Frontend component tests

11. **Update Documentation**
    - README.md - New API endpoints
    - PLANNING.md - Updated architecture

## 🔗 External Resources

### Technical Documentation
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Jest Testing Framework**: https://jestjs.io/docs/getting-started
- **Prisma Schema Reference**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference

### CTA & Tracking Best Practices
- **Unbounce CTA Guide**: https://unbounce.com/conversion-rate-optimization/call-to-action-examples/
- **Lead Generation Best Practices**: https://wisernotify.com/blog/lead-generation-cta/
- **Affiliate Tracking Methods**: https://www.partnero.com/articles/what-is-affiliate-tracking-a-beginners-guide-to-getting-started-2024

### Privacy & Compliance
- **GDPR Compliance for Tracking**: https://improvado.io/blog/what-is-tracking-pixel
- **Cookieless Tracking Solutions**: https://www.scaleo.io/blog/pixel-tracking-2023/

## 🎯 Key Implementation Notes

### Architecture Decisions
- **Follow existing patterns** from auth system for consistency
- **Use existing CSS classes** (.btn, .card) for styling consistency
- **Leverage shared types** for type safety across packages
- **Implement comprehensive error handling** following established patterns

### Security Considerations
- **Input validation** on all API endpoints
- **Rate limiting** for click tracking to prevent fraud
- **IP address tracking** for fraud detection
- **Secure URL parameter handling** to prevent injection

### Performance Optimizations
- **Database indexing** on frequently queried fields (sessionId, offerId)
- **Caching** for frequently accessed offers and questions
- **Optimistic UI updates** for better user experience
- **Debounced click handling** to prevent double-clicks

### AI Integration Points
- **Question text generation** based on offer characteristics
- **Button copy optimization** using performance data
- **Audience targeting** based on previous responses
- **A/B testing** of different question variants

## ✅ Success Metrics

### Technical Metrics
- All TypeScript compilation passes
- 90%+ test coverage on new code
- No ESLint errors
- All validation gates pass

### Functional Metrics
- CTA questions render correctly
- Click tracking accuracy > 95%
- Offer URLs generate with proper parameters
- New tab opening works cross-browser
- EPC calculation functions properly

### Performance Metrics
- Question load time < 500ms
- Click tracking response < 200ms
- Pixel URL generation < 50ms
- Component render time < 100ms

---

**Confidence Score: 9/10** - This PRP provides comprehensive context, follows established patterns, includes executable validation gates, and addresses all requirements with clear implementation paths. The only uncertainty is around AI integration specifics, which may require iteration based on chosen AI provider.