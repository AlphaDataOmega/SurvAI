# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive placeholder audit script (`scripts/placeholder-audit.mjs`)
  - Detects TODOs, debug logs, mock implementations, and template placeholders
  - Excludes appropriate directories (node_modules, dist, coverage, test files)
  - Colored output with detailed summary reporting
  - CI-friendly with proper exit codes
- Real implementation for `/list-questions` chat command
  - Fetches questions from survey API with proper error handling
  - Displays questions in formatted table with order, type, text, status, and option count
  - Supports empty result handling and proper authentication
  - Comprehensive error messages for different failure scenarios
- Question API service (`frontend/src/services/question.ts`)
  - Methods for fetching questions by survey ID
  - Enhanced EPC ordering endpoint integration
  - Survey and question analytics endpoints
  - Follows existing service patterns with TypeScript type safety
- Structured logging system with Winston integration
  - Replaced console.log statements in middleware with structured logging
  - Added correlation IDs for request tracking
  - Performance timing and response logging
  - Production-ready log levels and file rotation
  - Security-conscious logging (excludes sensitive data)

### Documentation
- **Documentation consolidation and polish** - Comprehensive documentation review and optimization
  - **Merged duplicate documentation**: Combined EPC_API_REFERENCE.md and EPC_SERVICE_ARCHITECTURE.md into EPC_COMPREHENSIVE_GUIDE.md
  - **Enhanced root README.md**: Added GitHub Actions workflow status badges, code coverage badge, and improved navigation with table of contents
  - **Updated documentation index**: Enhanced docs/README.md with last updated dates, estimated reading times, and better organization by category
  - **Updated internal links**: Fixed all references to merged documentation files across the codebase
  - **Added navigation features**: Comprehensive table of contents in README.md and search/navigation tips in docs/README.md
  - **Improved discoverability**: Better categorization and descriptions for all documentation files
  - **Status badges integration**: Added build status and coverage badges for better project visibility
  - **Documentation architecture**: Added link to FINAL_REVIEW_PLANNING.md in architecture section for comprehensive planning reference

### Changed
- Enhanced chat command system with actual API integration
  - `/list-questions` now provides real functionality instead of placeholder message
  - Improved error handling with specific messages for different failure types
  - Better table formatting with proper question ordering and text truncation
- Improved tracking and widget analytics middleware logging
  - Structured logging with correlation IDs and timing information
  - Removed debug console.log statements in favor of Winston logger
  - Enhanced error context and request/response metadata
- Updated JSDoc documentation removing "template placeholder" references
  - Clarified parameter descriptions for pixel URL generation
  - Removed outdated placeholder comments while preserving functional documentation

### Removed
- Debug console.log statements throughout codebase
  - Removed API request/response debug logging from `frontend/src/services/api.ts`
  - Removed chat history debug logging from `frontend/src/components/admin/Dashboard.tsx`
  - Preserved intentional logging in scripts and test files
- MVP placeholder messages in chat commands
  - Replaced `/list-questions` placeholder with real implementation
  - Removed temporary "coming soon" messages

### Fixed
- Chat commands now provide real functionality instead of placeholders
  - `/list-questions` fetches and displays actual survey questions
  - Proper error handling for API failures, network issues, and invalid survey IDs
  - Authentication and authorization properly enforced
- Structured logging replaces ad-hoc console statements
  - Consistent logging format across tracking and widget analytics middleware
  - Correlation ID support for request tracing
  - Performance timing and error context preservation

### Security
- Enhanced logging security practices
  - Structured logging avoids sensitive data exposure
  - Correlation IDs enable request tracking without exposing user data
  - Proper error handling prevents information leakage

### Testing
- Comprehensive test suite for new functionality
  - Question API service tests covering success cases, errors, and edge cases
  - Chat commands tests with authentication, formatting, and error scenarios  
  - Logger utility tests for different log levels and structured logging patterns
  - Middleware logging integration tests verifying Winston logger usage
- All tests follow existing patterns with proper mocking and assertions
- Tests achieve comprehensive coverage for new implementations

### Technical Implementation Details

#### Question API Service
```typescript
// New question service with EPC-ordered results
const result = await questionApi.getQuestionsBySurvey(surveyId);

// Enhanced EPC ordering endpoint
const result = await questionApi.getQuestionsWithEPCOrdering(surveyId);
```

#### Structured Logging
```typescript
// Before: console.log statements
console.log('Tracking Request:', JSON.stringify(logData, null, 2));

// After: Structured logging with Winston
logger.info('Tracking request received', {
  method: req.method,
  url: req.url,
  correlationId: req.get('X-Correlation-ID') || `tracking_${Date.now()}`
});
```

#### Chat Commands Enhancement
```typescript
// Before: Placeholder response
return createSystemMessage(`⚠️ Question management is coming soon!`);

// After: Real API integration
const result = await questionApi.getQuestionsBySurvey(surveyId);
return createSuccessMessage(formatQuestionsTable(result.data, surveyId));
```

### Migration Notes
- No breaking changes to existing APIs
- Logging changes are backward compatible
- Chat commands maintain same interface with enhanced functionality
- Test environment remains unchanged

---

## Previous Releases

### [M4.2.0] - 2025-01-09 - Widget Theming & Partner Configuration Enhancement
**Status:** ✅ **COMPLETED**

Enhanced theming system with CSS Variables, Shadow DOM isolation, partner attribution, and remote configuration support.

### [M4.1.0] - 2025-01-09 - Embeddable Widget Scaffold Implementation  
**Status:** ✅ **COMPLETED**

Self-contained embeddable survey widget for external partner integration via script tag with Shadow DOM isolation.

### [M3.9.0] - 2025-01-09 - Visual Snapshot Validation Implementation
**Status:** ✅ **COMPLETED**

Playwright-based visual regression testing system for admin dashboard and survey flow with 0.1% pixel difference threshold.

### [M3.8.0] - 2025-01-09 - Admin Chat Interface Implementation
**Status:** ✅ **COMPLETED**

Lightweight internal chat panel with slash commands for managing Offers and Questions within the Admin Dashboard.

### [M3.8.1] - 2025-01-08 - Offer Management CRUD Operations Implementation
**Status:** ✅ **COMPLETED**

Complete Offer Management system with CRUD operations, pixel URL auto-generation, and real-time EPC integration.

### [M3.5.0] - 2025-01-08 - EPC-Driven Question Ordering Implementation
**Status:** ✅ **COMPLETED**

EPC-driven question ordering system to optimize survey flow and maximize revenue by routing users through higher-performing questions first.

### [M3.2.0] - 2025-01-08 - AI Integration Service Implementation
**Status:** ✅ **COMPLETED**

AI Integration Service (OpenAI + Ollama) with fallback logic for financial assistance survey content generation.

### [M3.1.0] - 2025-01-08 - EPC Click Tracking Enhancement Implementation
**Status:** ✅ **COMPLETED**

Enhanced click tracking with idempotent pixel firing, comprehensive input validation, and pixel simulation tools.