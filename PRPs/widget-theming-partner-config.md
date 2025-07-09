name: "Widget Theming & Partner Configuration PRP"
description: |

## Purpose
Implement customizable theming, partner-level configuration, and remote initialization options for the embeddable SurvAI widget. Enable partners to style widgets, track analytics attribution, and load configurations remotely.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Extend the existing embeddable SurvAI widget to support:
- **Dynamic theming** with CSS variables and Shadow DOM isolation
- **Partner attribution** via partnerId in all API calls  
- **Remote configuration** loading via JSON URLs with CORS handling
- **Backward compatibility** with existing widget implementations

## Why
- **Partner Customization**: Enable white-label partners to match widget appearance to their brand
- **Analytics Attribution**: Track which partners drive traffic and conversions for revenue sharing
- **Flexible Deployment**: Allow both inline and remote configuration for different integration scenarios
- **Business Growth**: Expand partner ecosystem by reducing integration friction

## What
Extend the existing `SurvAIWidget.mount(element, options)` API to accept enhanced configuration options with theme overrides, partner tracking, and remote config loading.

### Success Criteria
- [ ] Partners can pass theme objects to customize colors, fonts, border radius
- [ ] Widget applies themes within Shadow DOM without affecting host page
- [ ] partnerId is included in all widget API calls for attribution
- [ ] Remote configUrl loads and merges with inline options
- [ ] Example HTML page demonstrates all theming capabilities
- [ ] Bundle size increase ≤ +30 kB
- [ ] All tests pass with full coverage
- [ ] Documentation updated with integration examples

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
  why: Shadow DOM styling fundamentals for widget isolation
  
- url: https://css-tricks.com/styling-in-the-shadow-dom-with-css-shadow-parts/
  why: CSS Shadow Parts for external theming hooks
  
- url: https://gomakethings.com/styling-the-shadow-dom-with-css-variables-in-web-components/
  why: CSS variables as theming mechanism that pierce Shadow DOM
  
- url: https://javascript.info/fetch-crossorigin
  why: CORS handling patterns for remote configuration loading

- file: /home/ado/SurvAI.3.0/frontend/src/widget/index.ts
  why: Current widget mount implementation, Shadow DOM patterns, theme merging
  
- file: /home/ado/SurvAI.3.0/frontend/src/widget/Widget.tsx
  why: React component patterns, inline styling approach for themes
  
- file: /home/ado/SurvAI.3.0/frontend/src/widget/services/widgetApi.ts
  why: API service patterns, error handling, configuration merging

- file: /home/ado/SurvAI.3.0/shared/src/types/widget.ts  
  why: Existing type definitions, WidgetTheme interface pattern

- file: /home/ado/SurvAI.3.0/tests/frontend/widgetApi.test.ts
  why: Testing patterns for widget API, mock setup, error scenarios

- file: /home/ado/SurvAI.3.0/docs/WIDGET.md
  why: Documentation structure and examples to extend

- docfile: /home/ado/SurvAI.3.0/PLANNING.md
  why: Architecture constraints, performance rules, testing requirements
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase
```bash
SurvAI.3.0/
├── frontend/src/widget/
│   ├── index.ts                    # Widget mount API, Shadow DOM setup
│   ├── Widget.tsx                  # Core React component
│   ├── services/
│   │   └── widgetApi.ts           # API service layer
│   └── hooks/
│       └── useWidget.ts           # Widget state management
├── shared/src/types/
│   └── widget.ts                  # Type definitions
├── tests/frontend/
│   ├── widgetApi.test.ts          # API tests
│   └── widgetMount.test.ts        # Mount tests
├── docs/
│   └── WIDGET.md                  # Integration documentation
└── examples/
    └── widget-basic.html          # Basic usage example
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
SurvAI.3.0/
├── frontend/src/widget/
│   ├── index.ts                          # Enhanced mount() with remote config
│   ├── Widget.tsx                        # Theme-aware component
│   ├── services/
│   │   └── widgetApi.ts                 # partnerId in API calls
│   ├── hooks/
│   │   └── useWidget.ts                 # Enhanced with partnerId
│   └── utils/
│       ├── theme.ts                     # NEW: Theme utilities, CSS variable injection
│       └── remoteConfig.ts              # NEW: Remote configuration loader
├── shared/src/types/
│   └── widget.ts                        # Enhanced WidgetOptions, ThemeConfig
├── tests/frontend/
│   ├── widgetTheme.test.ts              # NEW: Theme application tests
│   ├── widgetPartner.test.ts            # NEW: Partner ID propagation tests
│   └── widgetRemoteConfig.test.ts       # NEW: Remote config loading tests
├── docs/
│   └── WIDGET.md                        # Updated with theming examples
└── examples/
    ├── widget-theme-test.html           # NEW: Comprehensive theming demo
    └── widget-remote-config.html        # NEW: Remote config demo
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Shadow DOM requires specific CSS variable injection patterns
// Current pattern from index.ts lines 71-127
function injectWidgetStyles(shadowRoot: ShadowRoot, theme: WidgetTheme): void {
  const style = document.createElement('style');
  style.textContent = `
    :host {
      font-family: ${theme.fontFamily};
      // CSS variables must be defined here to be accessible to child components
    }
  `;
  shadowRoot.appendChild(style);
}

// CRITICAL: Widget API uses class-based service pattern
// From widgetApi.ts - must extend existing WidgetApi class, not replace

// CRITICAL: Theme merging uses spread operator - exactOptionalPropertyTypes requires explicit undefined handling
const theme = { ...defaultTheme, ...options.theme };

// CRITICAL: Remote fetch must handle CORS gracefully - fail silently, don't break widget
// Block remote config fetch if CORS not allowed; fail gracefully

// CRITICAL: Bundle size limit 250kB - reuse existing utilities, don't add heavy dependencies
```

## Implementation Blueprint

### Data models and structure

First, enhance type definitions to support the new theming and configuration features:

```typescript
// Enhanced types in shared/types/widget.ts
interface WidgetOptions {
  surveyId: string;
  partnerId?: string;           // NEW: Partner attribution
  theme?: ThemeConfig;          // NEW: Enhanced theme options  
  configUrl?: string;           // NEW: Remote configuration URL
  apiUrl?: string;              // Existing
}

interface ThemeConfig {
  // Existing theme properties
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  backgroundColor?: string;
  borderRadius?: string;
  buttonSize?: 'small' | 'medium' | 'large';
  
  // NEW: Enhanced theming
  accentColor?: string;
  textColor?: string;
  spacing?: 'compact' | 'normal' | 'spacious';
  shadows?: boolean;
  transitions?: boolean;
}
```

### list of tasks to be completed to fullfill the PRP in the order they should be completed

```yaml
Task 1: Enhance Type Definitions
MODIFY shared/src/types/widget.ts:
  - FIND interface WidgetTheme (around line 26)
  - EXTEND with new properties: accentColor, textColor, spacing, shadows, transitions
  - ADD interface ThemeConfig as alias to WidgetTheme
  - FIND interface WidgetMountOptions 
  - ADD partnerId?: string and configUrl?: string properties
  - PRESERVE all existing properties and maintain backward compatibility

Task 2: Create Theme Utilities Module  
CREATE frontend/src/widget/utils/theme.ts:
  - MIRROR pattern from: frontend/src/widget/services/widgetApi.ts (class-based approach)
  - IMPLEMENT CSS variable injection for Shadow DOM
  - IMPLEMENT theme validation with safe fallbacks
  - KEEP error handling pattern identical to existing services

Task 3: Create Remote Configuration Loader
CREATE frontend/src/widget/utils/remoteConfig.ts:
  - MIRROR fetch pattern from: frontend/src/widget/services/widgetApi.ts (lines 129-252)
  - IMPLEMENT CORS-safe configuration loading with timeout
  - IMPLEMENT graceful failure (return empty config on error)
  - USE existing error handling patterns from WidgetApi class

Task 4: Enhance Widget Mount Function
MODIFY frontend/src/widget/index.ts:
  - FIND mount function (around line 214)
  - INJECT remote config loading before theme merging
  - PRESERVE existing Shadow DOM setup (lines 71-127)
  - ENHANCE theme injection with CSS variables
  - KEEP existing error boundary pattern

Task 5: Update Widget Component for Theming
MODIFY frontend/src/widget/Widget.tsx:
  - FIND component styling patterns (lines 74-87)
  - REPLACE hardcoded colors with CSS variables
  - PRESERVE inline styling approach for theme application
  - MAINTAIN existing component structure and props

Task 6: Enhance API Service with Partner ID
MODIFY frontend/src/widget/services/widgetApi.ts:
  - FIND WidgetApi class constructor (around line 129)
  - ADD partnerId to WidgetApiConfig interface
  - MODIFY API calls to include partnerId query parameter
  - PRESERVE existing retry logic and error handling

Task 7: Update Widget Hook
MODIFY frontend/src/widget/hooks/useWidget.ts:
  - FIND useWidget hook implementation (around line 53)
  - INJECT partnerId into API service initialization
  - PRESERVE existing state management patterns
  - MAINTAIN backward compatibility

Task 8: Create Comprehensive Tests
CREATE tests/frontend/widgetTheme.test.ts:
  - MIRROR test structure from: tests/frontend/widgetApi.test.ts
  - TEST theme application, CSS variable injection
  - TEST theme validation and fallbacks

CREATE tests/frontend/widgetPartner.test.ts:
  - TEST partnerId propagation in API calls
  - TEST backward compatibility without partnerId

CREATE tests/frontend/widgetRemoteConfig.test.ts:
  - TEST remote configuration loading
  - TEST CORS error handling
  - TEST configuration merging precedence

Task 9: Update Documentation
MODIFY docs/WIDGET.md:
  - FIND existing examples section
  - ADD theming configuration examples
  - ADD remote configuration examples
  - ADD partner attribution setup
  - PRESERVE existing documentation structure

Task 10: Create Demo Examples
CREATE examples/widget-theme-test.html:
  - MIRROR structure from: examples/widget-basic.html
  - DEMONSTRATE all theming capabilities
  - INCLUDE multiple theme variations

CREATE examples/widget-remote-config.html:
  - DEMONSTRATE remote configuration loading
  - INCLUDE error handling examples
```

### Per task pseudocode as needed added to each task

```typescript
// Task 2 - Theme Utilities Module
class ThemeManager {
  // PATTERN: Follow WidgetApi class structure
  private defaultTheme: ThemeConfig = {
    primaryColor: '#3182ce',
    // ... existing defaults from index.ts lines 59-66
  };

  // CRITICAL: CSS variables must be injected into Shadow DOM
  injectThemeVariables(shadowRoot: ShadowRoot, theme: ThemeConfig): void {
    // PATTERN: Use existing style injection from index.ts lines 71-127
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --survai-primary: ${theme.primaryColor};
        --survai-secondary: ${theme.secondaryColor};
        --survai-accent: ${theme.accentColor || theme.primaryColor};
        /* ... all theme variables */
      }
    `;
    shadowRoot.appendChild(style);
  }

  // PATTERN: Safe theme merging with validation
  mergeTheme(userTheme?: Partial<ThemeConfig>): ThemeConfig {
    return { ...this.defaultTheme, ...userTheme };
  }
}

// Task 3 - Remote Configuration Loader  
class RemoteConfigLoader {
  // PATTERN: Follow WidgetApi error handling (lines 35-46)
  async loadConfig(configUrl: string): Promise<Partial<WidgetOptions>> {
    try {
      // CRITICAL: CORS handling with 5 second timeout
      const response = await fetch(configUrl, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) return {};
      return await response.json();
    } catch (error) {
      // PATTERN: Graceful failure - don't break widget
      console.warn('Failed to load remote config:', error);
      return {};
    }
  }
}

// Task 4 - Enhanced Mount Function
export const SurvAIWidget = {
  async mount(container: HTMLElement, options: WidgetOptions): Promise<WidgetInstance> {
    // PATTERN: Preserve existing structure from index.ts lines 214-242
    let finalOptions = { ...options };
    
    // NEW: Load remote config if provided
    if (options.configUrl) {
      const remoteConfig = await remoteConfigLoader.loadConfig(options.configUrl);
      finalOptions = { ...remoteConfig, ...options }; // inline options take precedence
    }
    
    // PATTERN: Existing Shadow DOM creation (lines 71-127)
    const shadowRoot = container.attachShadow({ mode: 'open' });
    
    // ENHANCED: Theme injection with CSS variables
    const themeManager = new ThemeManager();
    const theme = themeManager.mergeTheme(finalOptions.theme);
    themeManager.injectThemeVariables(shadowRoot, theme);
    
    // PATTERN: Existing React mounting (lines 155-175)
    const root = createRoot(shadowRoot);
    root.render(<Widget options={finalOptions} />);
    
    return createWidgetInstance(container, finalOptions);
  }
};

// Task 6 - API Service Enhancement
class WidgetApi {
  constructor(config: WidgetApiConfig & { partnerId?: string }) {
    this.config = { ...defaultConfig, ...config };
    this.partnerId = config.partnerId;
  }

  // PATTERN: Preserve existing API call structure
  async bootstrapSession(surveyId: string): Promise<SessionBootstrapResponse> {
    const params = new URLSearchParams({ surveyId });
    if (this.partnerId) params.append('partnerId', this.partnerId);
    
    return await makeRequest<SessionBootstrapResponse>(
      `${this.config.baseUrl}/api/sessions?${params}`,
      { method: 'POST' },
      this.config
    );
  }
}
```

### Integration Points
```yaml
TYPES:
  - enhance: shared/src/types/widget.ts
  - pattern: "Extend existing interfaces, maintain backward compatibility"
  
SHADOW_DOM:
  - enhance: frontend/src/widget/index.ts (lines 71-127)  
  - pattern: "CSS variable injection within existing style injection"
  
API_CALLS:
  - modify: frontend/src/widget/services/widgetApi.ts
  - pattern: "Add partnerId as query parameter to all endpoints"
  
DOCUMENTATION:
  - update: docs/WIDGET.md
  - pattern: "Add theming section after existing quick start guide"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                     # ESLint auto-fix
npm run type-check              # TypeScript type checking

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests each new feature/file/function use existing test patterns
```typescript
// CREATE test files following existing patterns from tests/frontend/
describe('ThemeManager', () => {
  it('should inject CSS variables into Shadow DOM', () => {
    const shadowRoot = document.createElement('div').attachShadow({ mode: 'open' });
    const themeManager = new ThemeManager();
    
    themeManager.injectThemeVariables(shadowRoot, { primaryColor: '#ff0000' });
    
    const styleElement = shadowRoot.querySelector('style');
    expect(styleElement?.textContent).toContain('--survai-primary: #ff0000');
  });

  it('should merge themes with safe defaults', () => {
    const themeManager = new ThemeManager();
    const result = themeManager.mergeTheme({ primaryColor: '#custom' });
    
    expect(result.primaryColor).toBe('#custom');
    expect(result.fontFamily).toBe('system-ui, -apple-system, sans-serif'); // default
  });
});

describe('RemoteConfigLoader', () => {
  it('should load remote configuration successfully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ theme: { primaryColor: '#remote' } })
      })
    ) as jest.Mock;

    const loader = new RemoteConfigLoader();
    const config = await loader.loadConfig('https://example.com/config.json');
    
    expect(config.theme?.primaryColor).toBe('#remote');
  });

  it('should handle CORS errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('CORS error'))) as jest.Mock;

    const loader = new RemoteConfigLoader();
    const config = await loader.loadConfig('https://example.com/config.json');
    
    expect(config).toEqual({});
  });
});
```

```bash
# Run and iterate until passing:
npm run test
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Widget Build & Bundle Size Validation
```bash
# Build widget and check bundle size
npm run build:widget

# Check bundle size (should be ≤ +30kB from baseline)
ls -la dist/widget/survai-widget.umd.js

# Expected: Bundle size increase ≤ 250kB total, ≤ +30kB from current
```

### Level 4: Integration Test with Examples
```bash
# Start development server
npm run dev

# Test examples in browser
# 1. Open examples/widget-theme-test.html
# 2. Verify theme customization works
# 3. Open examples/widget-remote-config.html  
# 4. Verify remote config loading works

# Test API calls include partnerId
# Check browser DevTools Network tab for API calls with partnerId parameter
```

## Final validation Checklist
- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Widget builds successfully: `npm run build:widget`
- [ ] Bundle size ≤ +30kB: Check dist/widget/survai-widget.umd.js
- [ ] Manual theme test: examples/widget-theme-test.html works
- [ ] Manual remote config test: examples/widget-remote-config.html works
- [ ] partnerId appears in API calls when provided
- [ ] Widget works without partnerId (backward compatibility)
- [ ] Widget works without theme (uses defaults)
- [ ] Widget works without configUrl (uses inline config only)
- [ ] Documentation updated: docs/WIDGET.md has new examples

---

## Anti-Patterns to Avoid
- ❌ Don't break Shadow DOM isolation - all styles must be scoped
- ❌ Don't add heavy dependencies - reuse existing utilities  
- ❌ Don't ignore CORS failures - handle gracefully with fallbacks
- ❌ Don't hardcode theme values - use CSS variables for flexibility
- ❌ Don't break backward compatibility - all options should be optional
- ❌ Don't skip bundle size validation - +30kB limit is firm
- ❌ Don't forget partnerId in any API calls - check all endpoints
- ❌ Don't use sync functions for remote config - use async/await

## Confidence Score: 9/10

This PRP provides comprehensive context including:
✅ Complete codebase analysis with specific file references and line numbers
✅ Modern 2024 patterns for Shadow DOM theming and remote configuration  
✅ Executable validation commands that match the project structure
✅ Detailed implementation blueprint with specific tasks in order
✅ Real code examples from the existing codebase to follow
✅ Known gotchas and anti-patterns to avoid
✅ Clear success criteria and measurable outcomes

The implementation should succeed in one pass given the extensive context and clear task breakdown following existing patterns.