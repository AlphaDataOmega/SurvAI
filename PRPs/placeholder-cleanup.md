# PRP: M5_PHASE_01 - Placeholder Replacement & Code Cleanup

**Feature**: Comprehensive placeholder, TODO, mock implementation, and temporary console statement elimination to bring SurvAI codebase to production-ready status.

**Priority**: High  
**Complexity**: Medium  
**Estimated Effort**: 6-8 hours  

## 🎯 Objective

Eliminate every remaining placeholder, `TODO`, mock implementation, and temporary console statement across the SurvAI codebase. Transform all development artifacts into production-ready implementations while maintaining code quality, test coverage, and adherence to `CLAUDE.md` guidelines.

## 📋 Requirements Analysis

### Current State Assessment

**Audit Results**: 159 console.* statements and multiple placeholders found across codebase:

- **Console.log locations**: Middleware logging, scripts, debug statements
- **Placeholder types**: Chat command stubs, template variables, UI text, mock implementations  
- **Critical areas**: Chat commands (`/list-questions`), tracking services, middleware logging
- **Template variables**: `{click_id}`, `{survey_id}` in pixel URLs

### Scope Definition

**In Scope**:
- Remove debug console.log statements  
- Replace MVP placeholders with real implementations
- Implement proper logging infrastructure
- Clean up template variable comments
- Add comprehensive tests for new implementations
- Create audit script for CI/CD

**Out of Scope**:
- Auto-generated Prisma client code
- Intentional console.log in scripts (seed, test creation)
- Valid UI placeholder text in forms
- node_modules, dist, coverage directories

## 🏗️ Implementation Strategy

### Phase 1: Audit Infrastructure (30 minutes)

Create `scripts/placeholder-audit.mjs` with comprehensive pattern detection:

```javascript
#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Patterns to detect
const PATTERNS = {
  todos: /\/\/(.*?)(TODO|FIXME|PLACEHOLDER|HACK|XXX)(.*?)$/gim,
  debugLogs: /console\.(log|debug|trace)\(/g,
  mocks: /\/\/(.*?)(mock|stub|temporary|temp)(.*?)$/gim,
  templates: /\/\/(.*?)(template placeholder|template variable)(.*?)$/gim
};

// Files to include/exclude
const INCLUDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'coverage', '.git', 'baselines'];
const EXCLUDE_FILES = ['.test.', '.spec.', 'prisma/generated'];

async function scanDirectory(dirPath) {
  // Implementation follows research patterns from leasot/fixme tools
}

// Export for CI usage
export { PATTERNS, scanDirectory };
```

### Phase 2: Implementation Pass (4-5 hours)

#### 2.1 Chat Commands Enhancement (90 minutes)

**File**: `frontend/src/hooks/useChatCommands.ts`

**Current Issue**:
```typescript
// For MVP, return a placeholder since question service isn't fully implemented
return createSystemMessage(`📋 **Questions for Survey: ${surveyId}**\n\n⚠️ Question management is coming soon!`);
```

**Implementation Strategy**:
```typescript
// Real implementation using questionService
const questions = await questionApi.getQuestionsBySurvey(surveyId);
return createSystemMessage(formatQuestionsResponse(questions));

function formatQuestionsResponse(questions: Question[]): string {
  if (questions.length === 0) {
    return `📋 **Questions for Survey: ${surveyId}**\n\nNo questions found for this survey.`;
  }
  
  const formatted = questions
    .sort((a, b) => a.order - b.order)
    .map((q, index) => 
      `${index + 1}. **${q.type}** (Order: ${q.order})\n   ${q.text}\n   Status: ${q.required ? 'Required' : 'Optional'}`
    )
    .join('\n\n');
    
  return `📋 **Questions for Survey: ${surveyId}** (${questions.length} total)\n\n${formatted}`;
}
```

**API Integration**:
```typescript
// Add to frontend/src/services/question.ts
export const questionApi = {
  async getQuestionsBySurvey(surveyId: string): Promise<Question[]> {
    const response = await api.get(`/questions/survey/${surveyId}`);
    return response.data;
  }
};
```

#### 2.2 Middleware Logging Enhancement (60 minutes)

**Files**: 
- `backend/src/middleware/trackingValidation.ts`
- `backend/src/middleware/widgetAnalyticsValidation.ts`

**Current Issue**:
```typescript
// Log the request (using console.log for now, can be enhanced with proper logger)
console.log('Tracking Request:', JSON.stringify(logData, null, 2));
```

**Implementation Strategy**:
```typescript
import { logger } from '../utils/logger';

// Replace console.log with structured logging
logger.info('Tracking request received', {
  method: req.method,
  url: req.url,
  surveyId: logData.surveyId,
  timestamp: logData.timestamp,
  userAgent: req.get('User-Agent'),
  correlationId: logData.correlationId
});

// Response logging
logger.info('Tracking request completed', {
  method: req.method,
  url: req.url,
  statusCode: res.statusCode,
  responseTime: `${responseTime}ms`,
  correlationId: logData.correlationId
});
```

**Logger Implementation** (`backend/src/utils/logger.ts`):
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ] : [])
  ]
});

export { logger };
```

#### 2.3 Template Variable Cleanup (45 minutes)

**File**: `backend/src/services/offerService.ts`

**Current Issue**:
```typescript
/**
 * @param clickId - The click ID for tracking (template placeholder)
 * @param surveyId - The survey ID (template placeholder) 
 * @returns string - The tracking pixel URL with template variables
 */
```

**Implementation Strategy**:
```typescript
/**
 * Generate tracking pixel URL with embedded parameters
 * 
 * @param clickId - The click ID for tracking conversion attribution
 * @param surveyId - The survey ID for campaign segmentation
 * @returns string - The tracking pixel URL with proper parameters
 */
generatePixelUrl(clickId: string = '{click_id}', surveyId: string = '{survey_id}'): string {
  // Implementation remains the same, just clean documentation
}
```

#### 2.4 Debug Console Removal (30 minutes)

**Strategy**: Remove debug logs while preserving intentional logging:

**Remove**:
```typescript
console.log('Debug info:', data); // Debug statements
console.trace('Function call stack'); // Development tracing
```

**Keep/Enhance**:
```typescript
// Script logging (seeds, utilities)
console.log('🌱 Seeding CTA survey data...'); // Keep - intentional script output
console.error('❌ Error seeding CTA data:', error); // Keep - error reporting

// Transform to logger
logger.error('Failed to process request', { error: error.message }); // Enhanced
```

### Phase 3: Testing Strategy (90 minutes)

#### 3.1 Chat Commands Tests

```typescript
// tests/frontend/hooks/useChatCommands.test.ts
describe('useChatCommands - list-questions', () => {
  beforeEach(() => {
    mockQuestionApi.getQuestionsBySurvey.mockClear();
  });

  it('should list questions for valid survey ID', async () => {
    const mockQuestions = [
      { id: '1', type: 'CTA_OFFER', text: 'Test question', order: 1, required: true },
      { id: '2', type: 'TEXT_INPUT', text: 'Another question', order: 2, required: false }
    ];
    
    mockQuestionApi.getQuestionsBySurvey.mockResolvedValue(mockQuestions);
    
    const result = await executeCommand('/list-questions survey-123');
    
    expect(result.content).toContain('Questions for Survey: survey-123');
    expect(result.content).toContain('Test question');
    expect(result.content).toContain('CTA_OFFER');
    expect(mockQuestionApi.getQuestionsBySurvey).toHaveBeenCalledWith('survey-123');
  });

  it('should handle empty question list', async () => {
    mockQuestionApi.getQuestionsBySurvey.mockResolvedValue([]);
    
    const result = await executeCommand('/list-questions survey-empty');
    
    expect(result.content).toContain('No questions found for this survey');
  });

  it('should handle API errors gracefully', async () => {
    mockQuestionApi.getQuestionsBySurvey.mockRejectedValue(new Error('API Error'));
    
    const result = await executeCommand('/list-questions survey-error');
    
    expect(result.type).toBe('error');
    expect(result.content).toContain('Failed to fetch questions');
  });
});
```

#### 3.2 Logger Tests

```typescript
// tests/backend/utils/logger.test.ts
describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  
  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log info messages with structured data', () => {
    logger.info('Test message', { key: 'value' });
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test message')
    );
  });

  it('should respect log level configuration', () => {
    process.env.LOG_LEVEL = 'error';
    logger.debug('Debug message');
    
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
```

### Phase 4: Documentation & Changelog (30 minutes)

#### 4.1 Create CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Comprehensive placeholder audit script (`scripts/placeholder-audit.mjs`)
- Structured logging system with Winston integration
- Real implementation for `/list-questions` chat command
- Production-ready middleware logging

### Changed
- Enhanced chat command system with actual API integration
- Improved tracking and widget analytics middleware logging
- Updated documentation removing template placeholder references

### Removed
- Debug console.log statements throughout codebase
- MVP placeholder messages in chat commands
- Temporary console logging in middleware
- Development-only debug traces

### Fixed
- Chat commands now provide real functionality instead of placeholders
- Proper error handling in question listing functionality
- Structured logging replaces ad-hoc console statements
```

## 🧪 Validation Gates

### Code Quality Gates
```bash
# Syntax and style validation
npm run lint
npm run type-check

# Test coverage validation
npm run test
npm run test:visual

# Placeholder audit validation
node scripts/placeholder-audit.mjs
```

**Success Criteria**:
- ✅ Zero TODO/FIXME/PLACEHOLDER matches in audit
- ✅ All tests pass with ≥90% coverage
- ✅ Lint passes with no warnings
- ✅ Type-check completes successfully
- ✅ All new implementations have comprehensive tests

### Runtime Validation
```bash
# Test real implementations
curl -X GET "http://localhost:8000/api/questions/survey/test-survey-id"

# Verify logging functionality
npm run dev # Check structured log output

# Test chat commands in UI
# Navigate to admin dashboard → chat panel → execute "/list-questions survey-123"
```

## 📝 Implementation Tasks

### Task 1: Audit Script Creation (30 min)
- [ ] Create `scripts/placeholder-audit.mjs` with pattern detection
- [ ] Implement file scanning with exclusion rules
- [ ] Add colored output and summary reporting
- [ ] Test audit script on current codebase

### Task 2: Chat Commands Implementation (90 min)
- [ ] Implement real `/list-questions` functionality
- [ ] Create question formatting helper functions
- [ ] Add error handling and edge cases
- [ ] Integrate with existing question API service
- [ ] Write comprehensive unit tests

### Task 3: Logging Infrastructure (60 min)  
- [ ] Create Winston-based logger utility
- [ ] Replace console.log in middleware files
- [ ] Add structured logging with correlation IDs
- [ ] Preserve intentional script logging
- [ ] Test logger configuration and output

### Task 4: Template Documentation Cleanup (45 min)
- [ ] Update JSDoc comments removing "template placeholder"
- [ ] Clean up parameter descriptions
- [ ] Ensure consistent documentation style
- [ ] Verify no actual template variables need replacement

### Task 5: Debug Statement Removal (30 min)
- [ ] Scan for debug console.log statements
- [ ] Remove development-only console traces
- [ ] Preserve error logging and script output
- [ ] Test application functionality after removal

### Task 6: Test Suite Enhancement (90 min)
- [ ] Write tests for chat command implementations
- [ ] Add logger utility tests
- [ ] Ensure ≥90% test coverage for new code
- [ ] Update existing tests if needed
- [ ] Verify all tests pass

### Task 7: Documentation Updates (30 min)
- [ ] Create CHANGELOG.md with unreleased section
- [ ] Update API.md if needed for new endpoints
- [ ] Document new logging configuration options
- [ ] Verify all implementation changes are documented

### Task 8: Final Validation (15 min)
- [ ] Run complete audit script (should return 0 matches)
- [ ] Execute full test suite
- [ ] Verify build process
- [ ] Test critical application paths

## 🎯 Success Metrics

**Code Quality**:
- Zero placeholder/TODO occurrences in audit
- All tests passing with ≥90% coverage
- Clean lint and type-check results

**Functionality**:
- `/list-questions` command returns real data
- Structured logging working in all environments
- No regression in existing features

**Documentation**:
- CHANGELOG properly documents all changes
- API documentation updated where needed
- Code comments are production-ready

## 🔍 References

**Existing Patterns**:
- Chat command structure: `frontend/src/hooks/useChatCommands.ts`
- Service layer patterns: `backend/src/services/questionService.ts`
- Test patterns: `tests/backend/services/epcService.test.ts`
- Middleware patterns: `backend/src/middleware/auth.ts`

**External Resources**:
- [Winston Logging Documentation](https://github.com/winstonjs/winston)
- [Jest Testing Best Practices](https://jestjs.io/docs/getting-started)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)
- [Audit Script Patterns](https://github.com/pgilad/leasot)

**Configuration Files**:
- `CLAUDE.md` - Style and coverage requirements
- `package.json` - Script definitions and dependencies
- `tsconfig.json` - TypeScript configuration

## 💡 Implementation Notes

**Gotchas**:
- Don't modify auto-generated Prisma client code
- Preserve intentional console.log in scripts (seed, test creation)
- Audit script should be CI-friendly with proper exit codes
- Template variables in URLs are functional, not placeholders

**Performance Considerations**:
- Logger should not impact request performance
- Audit script should exclude large directories efficiently
- Chat command API calls should have proper timeout handling

**Security Considerations**:
- Logger should not log sensitive data (passwords, tokens)
- Structured logging helps with security monitoring
- Proper error handling prevents information leakage

---

**Confidence Level**: 8/10
- Clear scope and existing patterns identified
- Comprehensive validation strategy
- Well-researched implementation approach
- Detailed task breakdown with time estimates