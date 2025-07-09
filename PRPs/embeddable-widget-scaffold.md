# 🚀 PRP: Embeddable Widget Scaffold

## 📋 OVERVIEW

Create a self-contained embeddable survey widget that external partners can integrate via a single `<script>` tag. The widget loads in isolation (UMD/IIFE bundle), fetches questions from SurvAI's API, displays CTA buttons, and tracks clicks with proper affiliate attribution.

**Key Requirements:**
- UMD bundle ≤ 250kB for fast loading
- Shadow DOM for CSS isolation to prevent style conflicts  
- Global `SurvAIWidget.mount()` API for easy integration
- Graceful API failure handling with fallback messages
- Cross-domain CORS support for external domains

## 🔍 RESEARCH FINDINGS

### Existing Codebase Patterns

**API Endpoints Available:**
- `POST /api/questions/:surveyId/next` - Returns question and offer buttons
- `POST /api/track/click` - Tracks CTA button clicks with session/offer data
- **MISSING:** `POST /api/sessions` - Need to create for session bootstrap

**Component Architecture:**
- `/frontend/src/components/survey/QuestionCard.tsx` - 145 LOC, inline styles, TypeScript
- `/frontend/src/components/survey/OfferButton.tsx` - 114 LOC, variant-based styling  
- Pattern: Props-based, controlled components with event handlers
- Styling: Inline styles for consistency, no external CSS dependencies

**Type System:**
- `@survai/shared` types: `Question`, `CTAButtonVariant`, `NextQuestionResponse`
- API response pattern: `ApiResponse<T>` wrapper with success/error structure
- Request types: `NextQuestionRequest`, `TrackClickRequest` established

**Build Configuration:**
- Vite frontend build in `/frontend/vite.config.ts`
- Manual chunks for vendor libraries (react, router, forms, utils)
- Proxy configuration for API calls during development
- TypeScript + React + path aliases configured

**Testing Patterns:**
- Jest + React Testing Library in `/tests/frontend/`
- Comprehensive coverage: rendering, interactions, error states, accessibility
- Mocking pattern: `jest.mock()` for component dependencies
- 357 LOC test file for QuestionCard shows expected test depth

### External Best Practices (2024)

**UMD/IIFE Widget Bundling:**
- Vite library mode with `formats: ['umd']` and `name: 'SurvAIWidget'`
- External React dependencies to reduce bundle size
- Shadow DOM for style isolation: `element.attachShadow({mode: 'open'})`
- Global namespace pattern: `window.SurvAIWidget = { mount }`

**Widget Architecture Patterns:**
- Authentication via `data-` attributes on script tag
- Initialization: `SurvAIWidget.mount(container, { surveyId, apiUrl })`
- CSS isolation using Shadow DOM prevents host page style conflicts
- Error boundaries and graceful API failure handling

**Security & CORS:**
- Widget serves from different domain than host page
- Backend CORS configuration required for cross-domain requests
- Content Security Policy considerations for external script loading

## 🎯 IMPLEMENTATION BLUEPRINT

### Phase 1: Backend API Enhancement
```typescript
// backend/src/routes/sessions.ts - NEW FILE
router.post('/api/sessions', (req, res) => {
  // Create session with surveyId, generate sessionId and clickId
  // Return: { sessionId, clickId, surveyId }
});
```

### Phase 2: Widget Build Configuration
```typescript
// vite.widget.config.ts - NEW FILE
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'frontend/src/widget/index.ts'),
      name: 'SurvAIWidget',
      formats: ['umd'],
      fileName: 'survai-widget'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
```

### Phase 3: Widget Component Architecture
```typescript
// frontend/src/widget/index.ts - ENTRY POINT
export interface WidgetMountOptions {
  surveyId: string;
  apiUrl?: string;
  theme?: WidgetTheme;
}

export const SurvAIWidget = {
  mount: (container: HTMLElement, options: WidgetMountOptions) => {
    // Create Shadow DOM root
    // Initialize React app with Widget component
    // Handle errors and graceful degradation
  }
};

// frontend/src/widget/Widget.tsx - MAIN COMPONENT
// Reuses QuestionCard and OfferButton patterns from existing codebase
// Handles session bootstrap, question fetching, click tracking
// Error boundaries for API failures
```

### Phase 4: Type Definitions & Documentation
```typescript
// shared/src/types/widget.ts - NEW FILE
export interface WidgetTheme {
  primaryColor?: string;
  fontFamily?: string;
  borderRadius?: string;
}

export interface SessionBootstrapResponse {
  sessionId: string;
  clickId: string;
  surveyId: string;
}
```

## 📝 IMPLEMENTATION TASKS

### Task 1: Create Session Bootstrap API (Backend)
**Files:** `backend/src/routes/sessions.ts`, `backend/src/controllers/sessionController.ts`
- Create POST `/api/sessions` endpoint
- Generate unique sessionId and clickId 
- Validate surveyId exists and is active
- Return session data for widget initialization
- Add CORS headers for cross-domain access

### Task 2: Configure Widget Build System
**Files:** `vite.widget.config.ts`, `package.json`
- Create Vite library mode configuration for UMD output
- Configure external React dependencies to reduce bundle size
- Add build script: `"build:widget": "vite build --config vite.widget.config.ts"`
- Set up output directory: `dist/survai-widget.js`

### Task 3: Create Widget Entry Point & Mount Function
**Files:** `frontend/src/widget/index.ts`, `frontend/src/widget/hooks/useWidget.ts`
- Export global `SurvAIWidget` object with mount function
- Create Shadow DOM root for CSS isolation
- Initialize React app with error boundaries
- Handle widget options validation and defaults

### Task 4: Implement Core Widget Component
**Files:** `frontend/src/widget/Widget.tsx`
- Bootstrap session with POST `/api/sessions`
- Fetch first question with POST `/api/questions/:surveyId/next`
- Render QuestionCard with offer buttons (reuse existing components)
- Handle button clicks: open offers in new tab + call `/api/track/click`
- Implement error states and loading indicators

### Task 5: Create Widget-Specific Types
**Files:** `shared/src/types/widget.ts`
- Define `WidgetMountOptions`, `WidgetTheme`, `SessionBootstrapResponse`
- Export from shared package index
- Add widget-specific error types

### Task 6: Implement Widget API Service
**Files:** `frontend/src/widget/services/widgetApi.ts`
- Create API client for widget (separate from main app)
- Handle cross-domain CORS requests
- Implement retry logic and timeout handling
- Session bootstrap, question fetching, click tracking methods

### Task 7: Add CSS Isolation & Styling
**Files:** `frontend/src/widget/styles/widget.css`
- Create self-contained CSS for widget components
- Implement CSS injection into Shadow DOM
- Ensure no style leakage to/from host page
- Responsive design for various container sizes

### Task 8: Create Documentation & Usage Guide
**Files:** `docs/WIDGET.md`, `examples/widget-test.html`
- Comprehensive embed guide with HTML snippets
- JavaScript API documentation
- Configuration options and theming guide
- Troubleshooting common integration issues

### Task 9: Implement Comprehensive Test Suite
**Files:** `tests/widget/mount.test.ts`, `tests/widget/Widget.test.tsx`
- Unit tests for mount function and lifecycle
- Mock API calls and test error handling
- Shadow DOM creation and CSS isolation tests
- Integration tests with example HTML page

### Task 10: Create Development & Testing Tools
**Files:** `examples/widget-test.html`, optional `widget/loader.js`
- Manual test page for widget development
- Optional async loader script for production use
- Performance monitoring and debugging tools

## 🧪 VALIDATION GATES

### Level 1: Syntax & Style Validation
```bash
npm run lint                    # ESLint validation
npm run type-check             # TypeScript compilation
npm run build:widget           # UMD bundle creation
ls -la dist/survai-widget.js   # Verify bundle exists and size ≤ 250kB
```

### Level 2: Unit Test Validation
```bash
npm run test:widget            # Widget-specific unit tests
npm run test:frontend          # Ensure existing tests still pass
npm run test:backend           # Verify session API tests pass
```

### Level 3: Integration Validation
```bash
npm run dev                    # Start dev server
open examples/widget-test.html # Manual visual verification
# Verify: widget loads, shows question, tracks clicks, handles errors
```

### Level 4: Cross-Domain Testing
```bash
# Test CORS functionality
# Test from different domain/port
# Verify API calls work cross-domain
```

## 🔧 TECHNICAL CONTEXT

### Existing Components to Reuse
```typescript
// These components work well for widget reuse:
import { QuestionCard } from '../components/survey/QuestionCard';
import { OfferButton } from '../components/survey/OfferButton';

// Proven patterns from existing codebase:
// - Inline styles for isolation
// - TypeScript props interfaces
// - Event handler patterns
// - Error boundary patterns
```

### API Integration Pattern
```typescript
// Follow existing API client patterns from frontend/src/services/api.ts:
const widgetApi = {
  bootstrapSession: (surveyId: string) => 
    fetch(`${apiUrl}/api/sessions`, { method: 'POST', body: { surveyId } }),
  getNextQuestion: (sessionId: string, surveyId: string) =>
    fetch(`${apiUrl}/api/questions/${surveyId}/next`, { method: 'POST', body: { sessionId } }),
  trackClick: (sessionId: string, questionId: string, offerId: string) =>
    fetch(`${apiUrl}/api/track/click`, { method: 'POST', body: { sessionId, questionId, offerId } })
};
```

### Shadow DOM Implementation
```typescript
// Based on 2024 best practices for React + Shadow DOM:
const container = document.createElement('div');
const shadowRoot = container.attachShadow({ mode: 'open' });

// Inject CSS into shadow root for isolation
const styleSheet = new CSSStyleSheet();
styleSheet.insertRule(`/* widget styles */`);
shadowRoot.adoptedStyleSheets = [styleSheet];

// Render React component into shadow DOM
ReactDOM.createRoot(shadowRoot).render(<Widget {...options} />);
```

## 📚 EXTERNAL DOCUMENTATION REFERENCES

**Vite Library Mode:**
- https://vite.dev/config/build-options - Official Vite build configuration
- https://dev.to/receter/how-to-create-a-react-component-library-using-vites-library-mode-4lma - React UMD builds

**Shadow DOM + React:**
- https://github.com/Wildhoney/ReactShadow - react-shadow library for isolation
- https://makerkit.dev/blog/tutorials/embeddable-widgets-react - Complete widget guide
- https://www.viget.com/articles/embedable-web-applications-with-shadow-dom/ - Best practices

**Widget Architecture:**
- https://codeutopia.net/blog/2012/05/26/best-practices-for-building-embeddable-widgets/ - Widget best practices
- https://stackoverflow.com/questions/75761968/what-is-the-best-practice-for-an-application-that-provides-an-embeddable-widget - Modern patterns

## ⚠️ GOTCHAS & CONSIDERATIONS

### Bundle Size Management
- React + ReactDOM externals reduce bundle by ~40kB
- Tree-shaking: only import required components/utilities
- Vite's rollup bundler optimizes automatically, but monitor final size

### CORS Configuration Required
```typescript
// backend/src/app.ts - Add CORS middleware:
app.use(cors({
  origin: true, // Allow all origins for widget usage
  credentials: true // Required for session handling
}));
```

### CSS Isolation Challenges
- Host page CSS can't be prevented entirely
- Use high specificity or !important for critical widget styles
- Test with popular CSS frameworks (Bootstrap, Tailwind)

### Browser Compatibility
- Shadow DOM supported in 95%+ browsers (not IE11)
- Fallback gracefully for unsupported browsers
- Test on mobile Safari (can have subtle differences)

### Error Handling Patterns
```typescript
// Widget must gracefully handle:
// - API timeouts/failures
// - Invalid surveyId
// - Network connectivity issues
// - Host page JavaScript errors
```

## 🎯 SUCCESS CRITERIA VALIDATION

### Functional Requirements
- [ ] UMD bundle builds successfully and ≤ 250kB
- [ ] Widget mounts with `SurvAIWidget.mount(element, options)`
- [ ] Displays first question from API
- [ ] Tracks button clicks and opens offers in new tab
- [ ] Graceful error handling for API failures

### Technical Requirements  
- [ ] Shadow DOM prevents style bleeding to/from host page
- [ ] CORS headers allow cross-domain API calls
- [ ] Bundle includes only necessary dependencies
- [ ] TypeScript compilation successful with no errors

### Quality Requirements
- [ ] Unit tests achieve 90%+ coverage
- [ ] Manual testing on example HTML page works
- [ ] Documentation includes complete integration guide
- [ ] ESLint and TypeScript validation passes

## 📊 CONFIDENCE SCORE: 9/10

**High confidence based on:**
- ✅ Existing component architecture is widget-ready
- ✅ API endpoints mostly exist (only need sessions)
- ✅ Build patterns established with Vite
- ✅ TypeScript types well-defined
- ✅ Testing patterns proven in codebase
- ✅ External documentation comprehensive

**Minor risks:**
- Shadow DOM CSS isolation testing required
- CORS configuration needs verification
- Bundle size optimization may need iteration

The existing codebase provides excellent foundation. Most complexity is in build configuration and Shadow DOM integration, both well-documented in 2024 resources.