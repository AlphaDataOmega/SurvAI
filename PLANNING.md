## 🧠 PLANNING.md – SurvAI Project Architecture

### 🎯 Purpose

This document captures the high-level technical architecture, conventions, and design strategy for SurvAI. It is updated as we make decisions and build. It should be read by all devs and AI coding agents at the start of any new conversation.

---

### 🔧 Tech Stack

* **Frontend:** React + TypeScript, Vite, TailwindCSS
* **Backend:** Node.js + Express (optionally Next.js if SSR is needed)
* **ORM:** Prisma
* **Database:** PostgreSQL
* **Optional Cache:** Redis
* **AI Providers:** OpenAI + Ollama (OpenAI-compatible API)
* **Authentication:** JWT + HTTP-only Secure Cookies + Admin Access Control
* **Testing:** Jest (unit), integration tests, Playwright (visual regression testing)
* **Containerization:** Docker
* **Dev Workflow:** Monorepo with shared types and utilities

---

### 🔄 Global Development Rules (From CLAUDE.md)

* Always start by loading `PLANNING.md`, `TASK.md`, and relevant milestone documents.
* Code files must not exceed 500 lines. Split logic into modules.
* Every function, component, or service should have tests: 1 success, 1 edge case, 1 failure.
* Documentation and tasks must be updated with every commit.
* Never hallucinate libraries. Ask when uncertain.
* Visual testing and snapshots should be implemented for UI consistency.

---

### 📦 Core Modules

#### 1. **Authentication System**

* **Single-role access control** with ADMIN role for proprietary system
* **JWT-based authentication** with HTTP-only cookies for secure token storage
* **Session management** with proper cleanup and expiration handling
* **Password security** using bcrypt with 12 salt rounds
* **Authentication middleware** for route protection and authorization
* **Comprehensive validation** with proper error handling and user feedback
* **Session tracking** stores `click_id`, `survey_id`, and progress for analytics

#### 2. **Dashboard**

* Displays CTR, EPC, conversion rate, session flow drop-offs
* High-level overview of offer/question performance

#### 3. **Offer Management**

* **CRUD for affiliate offers** with comprehensive admin interface
* **Auto-generate pixel URLs** with `{click_id}` and `{survey_id}` template variables
* **Real-time EPC monitoring** with live metrics display and auto-refresh
* **Offer performance analytics** showing clicks, conversions, revenue, and conversion rates
* **Copy-to-clipboard functionality** for pixel URLs and tracking links
* **Offer configuration management** including payouts, click caps, and targeting rules
* **Device and geo targeting** with comprehensive targeting rule system

#### 4. **Question Management**

* Input: `question_details` + `question_rules`
* AI-generated copy for question + button (OpenAI/Ollama)
* Copy version tracking for performance comparison

#### 5. **Survey Flow Engine**

* Branching logic determined by rules + session data
* **EPC-driven question ordering** - Questions automatically ordered by performance to maximize revenue
* **Real-time EPC optimization** - Questions dynamically reorder offers based on performance
* **Session-based tracking** with unique `click_id` and `session_id` for each user journey
* **Intelligent question routing** - Higher-performing questions presented first to optimize conversions

#### 6. **Click & Conversion Tracking**

* **Advanced click attribution** with atomic Prisma transactions for data consistency
* **Pixel-based conversion tracking** via GET `/api/track/pixel/:click_id` endpoint
* **Real-time EPC calculation** using mathematical utility functions
* **URL template variables** automatically injected (`{click_id}`, `{survey_id}`)
* **Device and geo tracking** for comprehensive attribution analytics
* **Revenue tracking** with optional revenue parameter in conversion pixels
* **Comprehensive input validation** using Joi schemas for all tracking endpoints
* **Idempotent conversion prevention** ensuring conversions are only recorded once per click
* **Session and offer validation** before processing any tracking requests
* **Enhanced error handling** with detailed validation messages and proper HTTP status codes
* **Pixel simulation tools** for manual testing and performance verification

#### 6.1. **Real-Time EPC Calculation System**

* **Live EPC Service** (`/backend/src/services/epcService.ts`)
  * Real-time EPC calculation based on 7-day rolling windows
  * Atomic database updates using Prisma transactions
  * Handles edge cases (zero clicks, no conversions return EPC = 0.0)
  * Comprehensive input validation and error handling
* **Mathematical EPC utility** (`/backend/src/utils/epcCalculator.ts`)
  * Pure functions for EPC calculations (total_revenue / total_clicks)
  * Handles edge cases (division by zero, invalid data)
  * Conversion rate calculation with proper percentage formatting
* **Time utilities** (`/backend/src/utils/time.ts`)
  * Consistent date calculations for 7-day windows
  * Timezone handling and edge case management
* **Atomic EPC updates** via Prisma transactions on every conversion
* **Offer ranking system** - Offers automatically ranked by EPC performance
* **Question optimization** - Questions display highest-EPC offers first
* **Real-time analytics** with auto-refresh capabilities in admin interface

#### 6.2. **EPC-Driven Question Ordering System** (M3_PHASE_05)

* **SurveyController** (`/backend/src/controllers/surveyController.ts`)
  * Dynamic question ordering based on average EPC performance
  * Graceful fallback to static `Question.order` when EPCs unavailable
  * Comprehensive error handling with performance optimization
* **Enhanced EPCService** - Added `getQuestionEPC()` method for real-time question-level EPC calculation
* **Question-level EPC calculation** - Average EPC from all linked active offers within 7-day windows
* **Intelligent survey routing** - Higher-performing questions automatically presented first
* **Parallel processing** - Concurrent EPC calculations for optimal performance (< 100ms overhead)
* **Backward compatibility** - Existing question endpoints enhanced without breaking changes
* **Comprehensive testing** - 14 unit tests covering all edge cases and error scenarios

#### 7. **Admin Chat Interface** (M3_PHASE_08)

* **Conversational admin management** with slash commands for streamlined operations
* **Real-time command processing** with authentication enforcement and error handling
* **Slash command system** supporting offer and question management operations:
  * `/help` - Display available commands with usage examples
  * `/list-offers [page] [limit]` - List offers with pagination in table format
  * `/add-offer <url>` - Open offer creation modal with pre-filled data
  * `/list-questions [surveyId]` - List questions for survey or all questions
  * `/add-question <surveyId>` - Open question creation modal
* **Integrated modal support** - Seamless connection with existing offer management interface
* **Chat history management** - Persistent session history with keyboard navigation
* **Rich content formatting** - Tables, success/error messages, and interactive responses
* **Responsive sidebar design** - Collapsible chat panel integrated into dashboard
* **Component composition architecture** - 5 sub-components maintaining <500 LOC limit per file

#### 8. **Visual Snapshot Validation** (M3_PHASE_09)

* **Playwright-based visual regression testing** with 0.1% pixel difference threshold
* **Automated UI consistency validation** across admin dashboard and survey flow
* **Responsive design testing** with mobile, tablet, and desktop viewports (1366x768 standard)
* **HTML report generation** with embedded screenshots and visual diff highlighting
* **Authentication bypass system** for testing without database dependencies
* **Component-level visual testing** for individual UI elements and interactions
* **CSS masking for dynamic content** to ensure consistent screenshot comparison
* **Baseline management workflow** with update capabilities and version control
* **CI/CD integration ready** with GitHub Actions configuration
* **Performance optimized** with parallel test execution and efficient screenshot capture
* **Comprehensive test coverage** including error states, loading states, and edge cases

#### 9. **Embeddable Widget**

* **Standalone frontend module** for embedding surveys on external sites
* **UMD/IIFE build target** for script tag usage (< 24kB gzipped)
* **Self-contained styles and state** with Shadow DOM isolation
* **Secure API access** to backend with CORS support
* **Advanced theming system** with CSS Variables and 11 theme properties
* **Partner attribution tracking** with partner ID propagation across all API calls
* **Remote configuration loading** with CORS-safe fetching and graceful fallback
* **Theme precedence management** - inline options override remote configuration
* **Comprehensive error handling** with retry logic and timeout support
* **Security filtering** for remote configurations (blocks dangerous properties)
* **Backward compatibility** maintained with existing widget implementations
* **Network resilience** with intelligent click batching and offline persistence
* **Exponential backoff retry** (2s → 4s → 8s → 16s → 30s max) for failed requests
* **localStorage persistence** with automatic cleanup and quota management
* **Data integrity** ensuring zero data loss during network outages

---

### 🧱 Folder & File Structure (Planned)

* `frontend/` - React app

  * `components/survey/` – Survey components
  * `components/admin/` – Offer/question CRUD UI
    * `chat/` – Admin chat interface components (ChatPanel, ChatInput, ChatMessage, ChatHistory, ChatControls)
  * `components/common/` – Shared UI elements
  * `hooks/` – `useAuth`, `useSurvey`, `useApi`, `useChatCommands`
  * `services/` – API services, tracking, chat
  * `types/` – Frontend types including chat interfaces
  * `widget/` – 🧩 Embeddable survey widget
    * `utils/theme.ts` – Theme management and CSS Variables system
    * `utils/remoteConfig.ts` – Remote configuration loader with CORS support
    * `utils/ClickQueue.ts` – Click batching and offline persistence system
    * `hooks/useWidget.ts` – Widget hook for resilience integration
  * `utils/`, `pages/`
* `backend/` – Express app

  * `routes/`, `controllers/`, `middleware/`, `services/`, `models/`
  * `controllers/surveyController.ts` – EPC-driven question ordering endpoints
  * `services/epcService.ts` – Enhanced with question-level EPC calculations
* `shared/` – Shared types
* `docs/` – API.md, DEPLOYMENT.md, DATABASE.md, VISUAL_TESTING.md
* `tests/` – mirrors frontend/backend structure
  * `visual/` – Playwright visual regression tests
    * `auth-helpers.ts` – Authentication utilities for visual testing
    * `visual-setup.ts` – Test environment configuration and setup
    * `visual.spec.ts` – Comprehensive visual regression test suite
    * `simple-visual.spec.ts` – Simplified visual tests for basic functionality
    * `showcase.spec.ts` – Visual testing capabilities demonstration

---

### 🔐 Security & Environment

* No API keys in source – use `.env` and validate at startup
* Secure cookie setup for session persistence
* Input validation on all user-submitted data
* Sanitize AI responses before storing

---

### 📈 Performance Strategy

* **Atomic tracking operations** to ensure click attribution using Prisma `$transaction`
* **Precision EPC calculations** with fixed decimal scaling (2 decimal places)
* **React 18 concurrent rendering** features enabled with proper hook usage
* **Optimized Prisma queries** with proper indexing and query batching
* **Real-time analytics updates** with configurable auto-refresh intervals (15-30 seconds)
* **Efficient offer ranking** with in-memory ranking calculations and caching
* **Performance monitoring** via comprehensive analytics and EPC tracking system
* **Visual testing optimization** with efficient screenshot capture and parallel execution
* **Deterministic visual testing** with consistent viewport and environment setup

---

### 💡 Known Quirks / Considerations

* **Prisma transactions** are required for EPC updates - always use `$transaction` for atomic operations
* **AI model outputs** are variable – sanitize and format before storing
* **URL template variables** must be properly escaped to prevent breaking offer URLs
* **TypeScript exactOptionalPropertyTypes** requires explicit undefined handling with spread operators
* **React hooks rules** must be followed - no conditional hook calls
* **DeviceTarget enum** must be imported and used with proper type casting
* **Admin chat interface** should handle command ambiguity gracefully with helpful error messages
* **Chat command parsing** uses simple regex patterns to avoid over-engineering - avoid complex NLP
* **Chat history management** should maintain reasonable limits (50 commands) to prevent memory bloat
* **Modal state coordination** between chat and existing modals requires careful state management
* **Command authentication** must validate admin access before every command execution
* **Chat component composition** must maintain <500 LOC limit per file through proper decomposition
* **Widget isolation** implemented with Shadow DOM to prevent global scope collisions
* **Remote configuration security** requires filtering dangerous properties (configUrl, onError, eval, __proto__)
* **Theme validation** must handle invalid color values gracefully with fallback to defaults
* **Partner ID propagation** should be automatic across all widget-initiated API calls
* **Configuration precedence** - inline options always override remote configuration for security and flexibility
* **EPC calculations** may have division by zero cases - always handle with fallback values
* **Real-time updates** can impact performance - implement reasonable refresh intervals
* **EPC service transactions** must use proper Prisma.TransactionClient typing for atomic updates
* **Time window calculations** require consistent date handling across EPC components
* **Visual testing snapshots** require consistent viewport (1366x768) and environment for reliable comparison
* **Playwright timeout handling** should account for varying page load times and network conditions
* **Screenshot baseline management** requires careful version control and update workflows
* **Dynamic content masking** necessary for timestamps, session IDs, and animated elements in visual tests
* **Visual test environment isolation** essential to prevent test interference and ensure repeatability

---

### 📘 References

* [React Architecture Best Practices](https://www.sitepoint.com/react-architecture-best-practices/)
* [Express + Prisma Guide](https://www.prisma.io/express)
* [OpenAI-compatible Ollama](https://ollama.com/blog/openai-compatibility)
* [Affiliate Tracking 101](https://uppromote.com/blog/what-is-affiliate-tracking/)
* [Playwright Visual Testing Guide](https://playwright.dev/docs/test-snapshots)
* [Visual Regression Testing Best Practices](https://docs.cypress.io/guides/tooling/visual-testing)

### 🔗 Final Review & Production Readiness

This PLANNING.md document establishes the core architecture and development patterns for SurvAI. For the comprehensive roadmap to production readiness, including final review phases, testing coverage, and deployment hardening, see:

**➡️ [FINAL_REVIEW_PLANNING.md](FINAL_REVIEW_PLANNING.md)**

#### Document Relationship

- **PLANNING.md** (this document): Core architecture, tech stack, and development patterns
- **FINAL_REVIEW_PLANNING.md**: Production readiness roadmap, QA phases, and deployment hardening

#### Navigation Breadcrumbs

```
📋 Project Documentation
├── 🏗️ PLANNING.md (Architecture & Development Patterns)
└── 🎯 FINAL_REVIEW_PLANNING.md (Production Readiness Roadmap)
```

Both documents should be consulted together for complete project understanding and successful implementation.

---

This file will evolve. Update it anytime architecture or core logic changes. This is our **source of truth.**
