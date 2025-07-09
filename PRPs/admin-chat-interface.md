name: "M3_PHASE_08 Admin Chat Interface MVP PRP"
description: |
  Context-rich PRP for implementing an internal admin chat panel with slash commands 
  for managing Offers and Questions within the SurvAI Dashboard.

## Goal
Implement a lightweight, internal chat panel that lets admins manage Offers and Questions conversationally within the Admin Dashboard. The interface will leverage existing REST endpoints and provide a faster alternative to traditional CRUD forms through slash commands.

## Why
- **Faster admin workflows**: Reduce time spent navigating between different admin screens
- **Improved user experience**: Conversational interface is more intuitive than traditional forms
- **Unified admin interface**: Consolidate offer and question management in one place
- **Foundation for future AI features**: Sets up architecture for future AI-powered admin assistant

## What
A React TypeScript chat panel component integrated into the existing Dashboard that supports:
- Slash commands for CRUD operations (`/list offers`, `/add offer <url>`, `/list questions`, `/add question <surveyId>`)
- Real-time command parsing and execution
- Local chat history persistence
- Modal integration for complex operations
- Responsive design matching existing admin interface

### Success Criteria
- [ ] Dashboard displays a collapsible chat sidebar
- [ ] `/help` command lists all available commands
- [ ] `/list offers` and `/list questions` render data tables in chat
- [ ] `/add offer <url>` opens pre-filled offer modal
- [ ] `/add question <surveyId>` opens question creation modal
- [ ] All commands handle errors gracefully with user feedback
- [ ] Chat history persists during session
- [ ] All new code passes linting, type-checking, and testing
- [ ] Integration with existing authentication and API services

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
  why: Regex patterns for slash command parsing
  
- url: https://www.freecodecamp.org/news/build-a-chat-app-with-react-typescript-and-socket-io-d7e1192d288/
  why: React TypeScript chat interface patterns and best practices
  
- url: https://www.freecodecamp.org/news/api-integration-patterns/
  why: API integration patterns for real-time updates and polling
  
- url: https://www.npmjs.com/package/slash-command
  why: Slash command parsing implementation patterns
  
- file: /home/ado/SurvAI.3.0/frontend/src/components/admin/Dashboard.tsx
  why: Main dashboard structure and styling patterns to follow
  
- file: /home/ado/SurvAI.3.0/frontend/src/components/admin/OfferManagement.tsx
  why: Modal patterns and API integration examples
  
- file: /home/ado/SurvAI.3.0/frontend/src/services/offer.ts
  why: Existing offer service patterns to leverage
  
- file: /home/ado/SurvAI.3.0/frontend/src/hooks/useAuth.tsx
  why: Authentication patterns and role-based access
  
- file: /home/ado/SurvAI.3.0/tests/frontend/QuestionCard.test.tsx
  why: Component testing patterns for interactive elements
  
- file: /home/ado/SurvAI.3.0/tests/frontend/useAuth.test.tsx
  why: Hook testing patterns for chat command handling
  
- file: /home/ado/SurvAI.3.0/backend/src/validators/questionValidator.ts
  why: Validation patterns using Zod for command input validation
  
- docfile: /home/ado/SurvAI.3.0/PLANNING.md
  why: Project architecture, conventions, and admin interface guidelines
  
- docfile: /home/ado/SurvAI.3.0/CLAUDE.md
  why: Code structure, testing requirements, and development rules
```

### Current Codebase tree (relevant sections)
```bash
frontend/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx          # Main dashboard - embed chat here
│   │   │   ├── OfferManagement.tsx    # Modal patterns reference
│   │   │   └── charts/
│   │   │       └── EpcBarChart.tsx
│   │   └── common/
│   ├── hooks/
│   │   ├── useAuth.tsx               # Authentication patterns
│   │   └── useSurvey.ts              # State management patterns
│   ├── services/
│   │   ├── api.ts                    # Base API client
│   │   ├── dashboard.ts              # Dashboard service
│   │   └── offer.ts                  # Offer service patterns
│   └── types/
backend/
├── src/
│   ├── controllers/
│   │   ├── offerController.ts        # Offer CRUD endpoints
│   │   └── questionController.ts     # Question CRUD endpoints
│   ├── services/
│   │   ├── offerService.ts           # Offer business logic
│   │   └── questionService.ts        # Question business logic
│   ├── validators/
│   │   └── questionValidator.ts      # Zod validation patterns
│   └── routes/
tests/
├── frontend/
│   ├── components/
│   │   └── QuestionCard.test.tsx     # Component testing patterns
│   └── hooks/
│       └── useAuth.test.tsx          # Hook testing patterns
└── backend/
    └── controllers/
        └── offerController.test.ts   # API testing patterns
```

### Desired Codebase tree with files to be added
```bash
frontend/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── chat/
│   │   │   │   ├── ChatPanel.tsx         # Main chat container (≤500 LOC)
│   │   │   │   ├── ChatMessage.tsx       # Individual message component
│   │   │   │   ├── ChatInput.tsx         # Message input with slash command support
│   │   │   │   ├── ChatHistory.tsx       # Message history display
│   │   │   │   └── ChatControls.tsx      # Chat controls (minimize, clear, etc.)
│   │   │   └── Dashboard.tsx             # MODIFIED: embed ChatPanel
│   │   └── common/
│   ├── hooks/
│   │   └── useChatCommands.ts            # Command parsing and execution hook
│   ├── services/
│   │   └── chat.ts                       # Chat service abstractions (optional)
│   └── types/
│       └── chat.ts                       # Chat-related TypeScript types
tests/
├── frontend/
│   ├── components/
│   │   └── admin/
│   │       └── chat/
│   │           ├── ChatPanel.test.tsx    # Chat panel component tests
│   │           └── ChatInput.test.tsx    # Chat input component tests
│   └── hooks/
│       └── useChatCommands.test.ts       # Command parsing hook tests
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Dashboard component uses inline styling with specific color scheme
// Pattern: Use consistent colors from existing Dashboard.tsx
const colors = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F9FAFB',
  border: '#E5E7EB'
};

// CRITICAL: Authentication required for all admin operations
// Pattern: Use useAuth hook and check isAuthenticated before API calls
const { isAuthenticated, logout } = useAuth();
if (!isAuthenticated) {
  // Redirect to login or show error
}

// CRITICAL: API services follow specific error handling patterns
// Pattern: Use ApiResponse<T> type and handle errors consistently
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// CRITICAL: Modal patterns from OfferManagement.tsx
// Pattern: Use state management for modal visibility and data
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalData, setModalData] = useState<OfferData | null>(null);

// CRITICAL: Testing patterns require proper mocking of API services
// Pattern: Mock services in tests following existing test setup
jest.mock('../services/offer', () => ({
  OfferService: {
    prototype: {
      list: jest.fn(),
      create: jest.fn(),
      // ... other methods
    }
  }
}));

// CRITICAL: Command parsing should use simple RegEx (avoid over-engineering)
// Pattern: Use straightforward regex patterns for command parsing
const COMMAND_REGEX = /^\/(\w+)(?:\s+(.*))?$/;

// CRITICAL: File size limit of 500 lines per component
// Pattern: Split ChatPanel into sub-components if approaching limit
// Use composition over large monolithic components

// CRITICAL: React hooks rules must be followed
// Pattern: No conditional hook calls, hooks must be called at top level
// Always use hooks in the same order
```

## Implementation Blueprint

### Data models and structure
Create TypeScript interfaces for chat functionality to ensure type safety and consistency:
```typescript
// /frontend/src/types/chat.ts
export interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'error' | 'success';
  content: string;
  timestamp: Date;
  command?: string;
  args?: string[];
}

export interface ChatCommand {
  command: string;
  args: string[];
  raw: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isMinimized: boolean;
  history: string[];
  historyIndex: number;
}

export interface CommandHandler {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[]) => Promise<ChatMessage>;
}
```

### List of tasks to be completed to fulfill the PRP in order

```yaml
Task 1: Create Chat Type Definitions
CREATE frontend/src/types/chat.ts:
  - DEFINE ChatMessage, ChatCommand, ChatState interfaces
  - MIRROR typing patterns from existing shared types
  - ENSURE comprehensive type coverage for all chat operations

Task 2: Implement Chat Command Hook
CREATE frontend/src/hooks/useChatCommands.ts:
  - PATTERN: Follow existing hook patterns from useAuth.tsx
  - IMPLEMENT command parsing using simple regex
  - INTEGRATE with existing offer.ts and dashboard.ts services
  - HANDLE authentication checks and error states
  - PRESERVE existing API call patterns

Task 3: Create Chat Input Component
CREATE frontend/src/components/admin/chat/ChatInput.tsx:
  - PATTERN: Follow form patterns from OfferManagement.tsx
  - IMPLEMENT slash command detection and autocomplete
  - HANDLE keyboard shortcuts (Enter, Up/Down for history)
  - INTEGRATE with useChatCommands hook
  - MAINTAIN consistent styling with Dashboard.tsx

Task 4: Create Chat Message Component
CREATE frontend/src/components/admin/chat/ChatMessage.tsx:
  - PATTERN: Follow component patterns from QuestionCard.tsx
  - IMPLEMENT message type rendering (user, system, error, success)
  - HANDLE timestamp formatting and content display
  - SUPPORT rich content (tables, links, formatted text)
  - MAINTAIN accessibility standards

Task 5: Create Chat History Component
CREATE frontend/src/components/admin/chat/ChatHistory.tsx:
  - PATTERN: Follow list rendering patterns from Dashboard.tsx
  - IMPLEMENT auto-scroll to bottom on new messages
  - HANDLE message virtualization for performance
  - SUPPORT message search and filtering
  - MAINTAIN consistent scroll behavior

Task 6: Create Chat Controls Component
CREATE frontend/src/components/admin/chat/ChatControls.tsx:
  - PATTERN: Follow button patterns from existing components
  - IMPLEMENT minimize/maximize functionality
  - HANDLE clear chat history action
  - SUPPORT export/import chat history
  - MAINTAIN consistent icon and styling

Task 7: Create Main Chat Panel Component
CREATE frontend/src/components/admin/chat/ChatPanel.tsx:
  - PATTERN: Follow container patterns from Dashboard.tsx
  - COMPOSE all chat sub-components
  - IMPLEMENT state management for chat functionality
  - HANDLE responsive design for mobile/desktop
  - MAINTAIN ≤500 LOC requirement through composition
  - INTEGRATE with authentication and error boundaries

Task 8: Integrate Chat Panel into Dashboard
MODIFY frontend/src/components/admin/Dashboard.tsx:
  - FIND pattern: Main dashboard layout structure
  - INJECT ChatPanel as collapsible sidebar
  - PRESERVE existing dashboard functionality
  - MAINTAIN responsive design and auto-refresh
  - ENSURE chat doesn't interfere with existing UI

Task 9: Create Chat Service (Optional)
CREATE frontend/src/services/chat.ts:
  - PATTERN: Follow service patterns from offer.ts
  - IMPLEMENT chat-specific API abstractions
  - HANDLE command execution and response formatting
  - INTEGRATE with existing API client patterns
  - MAINTAIN consistent error handling

Task 10: Create Comprehensive Unit Tests
CREATE tests/frontend/hooks/useChatCommands.test.ts:
  - PATTERN: Follow hook testing patterns from useAuth.test.tsx
  - TEST command parsing edge cases
  - MOCK API services following existing patterns
  - VERIFY error handling and authentication
  - ENSURE 100% code coverage for command parsing

Task 11: Create Component Tests
CREATE tests/frontend/components/admin/chat/ChatPanel.test.tsx:
  - PATTERN: Follow component testing patterns from QuestionCard.test.tsx
  - TEST chat interface interactions
  - VERIFY modal integration and command execution
  - SIMULATE user interactions with fireEvent
  - ENSURE accessibility compliance

Task 12: Create Integration Tests
CREATE tests/frontend/components/admin/chat/ChatInput.test.tsx:
  - PATTERN: Follow integration patterns from existing tests
  - TEST slash command flow end-to-end
  - VERIFY API integration with mocked services
  - SIMULATE keyboard interactions and shortcuts
  - ENSURE error scenarios are handled properly
```

### Per task pseudocode with critical details

```typescript
// Task 2: useChatCommands Hook Implementation
export const useChatCommands = () => {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // PATTERN: Command parsing using simple regex (avoid over-engineering)
  const parseCommand = (input: string): ChatCommand | null => {
    const match = input.match(/^\/(\w+)(?:\s+(.*))?$/);
    if (!match) return null;
    
    const [, command, argsString] = match;
    const args = argsString ? argsString.split(/\s+/) : [];
    
    return { command, args, raw: input };
  };
  
  // PATTERN: Command handlers using existing service patterns
  const commandHandlers: Record<string, CommandHandler> = {
    'list-offers': {
      name: 'list-offers',
      description: 'List all offers with pagination',
      usage: '/list-offers [page] [limit]',
      handler: async (args: string[]) => {
        // CRITICAL: Check authentication before API calls
        if (!isAuthenticated) {
          return { type: 'error', content: 'Authentication required' };
        }
        
        // PATTERN: Use existing offer service
        const offerService = new OfferService();
        const page = parseInt(args[0]) || 1;
        const limit = parseInt(args[1]) || 10;
        
        const result = await offerService.list({ page, limit });
        
        // PATTERN: Format response as table for chat display
        if (result.success) {
          const tableContent = formatOffersTable(result.data);
          return { type: 'success', content: tableContent };
        } else {
          return { type: 'error', content: result.error || 'Failed to fetch offers' };
        }
      }
    },
    
    'add-offer': {
      name: 'add-offer',
      description: 'Open modal to add new offer',
      usage: '/add-offer <destinationUrl>',
      handler: async (args: string[]) => {
        // CRITICAL: Validate arguments
        if (args.length === 0) {
          return { type: 'error', content: 'Usage: /add-offer <destinationUrl>' };
        }
        
        // PATTERN: Integrate with existing modal patterns
        const destinationUrl = args[0];
        // Trigger modal opening with pre-filled data
        return { type: 'success', content: `Opening offer creation modal for: ${destinationUrl}` };
      }
    }
  };
  
  // PATTERN: Execute command with error handling
  const executeCommand = async (input: string): Promise<ChatMessage> => {
    setIsLoading(true);
    
    try {
      const command = parseCommand(input);
      if (!command) {
        return { type: 'error', content: 'Invalid command format. Type /help for available commands.' };
      }
      
      const handler = commandHandlers[command.command];
      if (!handler) {
        return { type: 'error', content: `Unknown command: ${command.command}. Type /help for available commands.` };
      }
      
      return await handler.handler(command.args);
    } catch (error) {
      return { type: 'error', content: `Command execution failed: ${error.message}` };
    } finally {
      setIsLoading(false);
    }
  };
  
  return { executeCommand, isLoading, commandHandlers };
};

// Task 7: ChatPanel Component Structure
export const ChatPanel: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isMinimized: false,
    history: [],
    historyIndex: -1
  });
  
  const { executeCommand, isLoading } = useChatCommands();
  
  // PATTERN: Handle command execution with state updates
  const handleCommand = async (input: string) => {
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      history: [input, ...prev.history.slice(0, 49)] // Keep last 50 commands
    }));
    
    // Execute command and add response
    const response = await executeCommand(input);
    const systemMessage: ChatMessage = {
      id: generateId(),
      type: response.type,
      content: response.content,
      timestamp: new Date()
    };
    
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, systemMessage]
    }));
  };
  
  // PATTERN: Component composition following existing patterns
  return (
    <div className={`chat-panel ${chatState.isMinimized ? 'minimized' : ''}`}>
      <ChatControls
        isMinimized={chatState.isMinimized}
        onToggleMinimize={() => setChatState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))}
        onClearHistory={() => setChatState(prev => ({ ...prev, messages: [] }))}
      />
      
      {!chatState.isMinimized && (
        <>
          <ChatHistory messages={chatState.messages} />
          <ChatInput
            onCommand={handleCommand}
            isLoading={isLoading}
            history={chatState.history}
            historyIndex={chatState.historyIndex}
          />
        </>
      )}
    </div>
  );
};
```

### Integration Points
```yaml
AUTHENTICATION:
  - integrate with: frontend/src/hooks/useAuth.tsx
  - pattern: "const { isAuthenticated, user } = useAuth();"
  - validation: "Check isAuthenticated before all API calls"

API_SERVICES:
  - integrate with: frontend/src/services/offer.ts
  - pattern: "const offerService = new OfferService();"
  - methods: "list(), create(), update(), delete(), toggle()"

DASHBOARD:
  - modify: frontend/src/components/admin/Dashboard.tsx
  - pattern: "Add ChatPanel as collapsible sidebar component"
  - preserve: "Existing auto-refresh and layout functionality"

MODAL_INTEGRATION:
  - reference: frontend/src/components/admin/OfferManagement.tsx
  - pattern: "Use existing modal state management patterns"
  - integration: "Trigger modals from chat commands"

TESTING:
  - setup: tests/frontend/setup.ts
  - patterns: "Follow existing component and hook testing patterns"
  - mocking: "Mock API services following existing test patterns"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                              # ESLint checking
npm run type-check                        # TypeScript compilation
npm run format                            # Prettier formatting

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests (each new feature/file/function use existing test patterns)
```typescript
// CREATE tests/frontend/hooks/useChatCommands.test.ts
describe('useChatCommands', () => {
  it('should parse slash commands correctly', () => {
    const { parseCommand } = renderHook(() => useChatCommands()).result.current;
    
    const result = parseCommand('/list-offers 1 10');
    expect(result).toEqual({
      command: 'list-offers',
      args: ['1', '10'],
      raw: '/list-offers 1 10'
    });
  });
  
  it('should handle invalid commands gracefully', () => {
    const { parseCommand } = renderHook(() => useChatCommands()).result.current;
    
    const result = parseCommand('invalid command');
    expect(result).toBe(null);
  });
  
  it('should execute help command', async () => {
    const { executeCommand } = renderHook(() => useChatCommands()).result.current;
    
    const result = await executeCommand('/help');
    expect(result.type).toBe('success');
    expect(result.content).toContain('Available commands:');
  });
});

// CREATE tests/frontend/components/admin/chat/ChatPanel.test.tsx
describe('ChatPanel', () => {
  it('should render chat interface', () => {
    render(<ChatPanel />);
    
    expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });
  
  it('should handle command input', async () => {
    render(<ChatPanel />);
    
    const input = screen.getByPlaceholderText('Type a command...');
    fireEvent.change(input, { target: { value: '/help' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    
    await waitFor(() => {
      expect(screen.getByText('/help')).toBeInTheDocument();
    });
  });
  
  it('should toggle minimize state', () => {
    render(<ChatPanel />);
    
    const minimizeButton = screen.getByRole('button', { name: 'Minimize' });
    fireEvent.click(minimizeButton);
    
    expect(screen.queryByPlaceholderText('Type a command...')).not.toBeInTheDocument();
  });
});
```

```bash
# Run and iterate until passing:
npm run test:unit -- --testPathPattern=chat
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start the development server
npm run dev

# Test the chat interface manually:
# 1. Open http://localhost:3000/admin/dashboard
# 2. Look for chat panel (should be minimized by default)
# 3. Click to expand chat panel
# 4. Type "/help" and press Enter
# 5. Verify help message appears
# 6. Type "/list-offers" and press Enter
# 7. Verify offers table appears in chat
# 8. Type "/add-offer https://example.com" and press Enter
# 9. Verify offer creation modal opens

# Expected: All commands work without errors
# If error: Check browser console and network tab for issues
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test:unit -- --testPathPattern=chat`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Manual chat flow successful: All slash commands work
- [ ] Chat panel integrates properly with dashboard
- [ ] Authentication is properly enforced
- [ ] Modal integration works correctly
- [ ] Chat history persists during session
- [ ] Error cases handled gracefully with user feedback
- [ ] Component file sizes under 500 LOC
- [ ] Documentation updated in README.md if needed

---

## Anti-Patterns to Avoid
- ❌ Don't create complex NLP parsing when simple regex works
- ❌ Don't bypass authentication checks for convenience
- ❌ Don't ignore the 500 LOC file size limit
- ❌ Don't skip error handling because "it should work"
- ❌ Don't create new API patterns when existing ones work
- ❌ Don't hardcode command lists - make them configurable
- ❌ Don't ignore existing styling patterns from Dashboard.tsx
- ❌ Don't create monolithic components - use composition
- ❌ Don't skip accessibility considerations
- ❌ Don't implement WebSocket complexity for MVP - use polling/refresh patterns

## Implementation Confidence Score: 8/10

**Reasoning:**
- **Strong foundation**: Existing codebase has excellent patterns for components, hooks, services, and testing
- **Clear requirements**: Feature specification is well-defined with specific success criteria
- **Comprehensive research**: Extensive analysis of existing patterns and external best practices
- **Proven patterns**: All implementation patterns are already used successfully in the codebase
- **Thorough validation**: Multiple validation layers ensure working implementation

**Potential challenges:**
- **Command parsing complexity**: May need iteration to handle edge cases properly
- **Modal integration**: Requires careful state management between chat and existing modals
- **Performance optimization**: May need refinement for smooth user experience

**Success factors:**
- All necessary context and examples provided
- Executable validation gates for iterative improvement
- Follows existing codebase patterns and conventions
- Comprehensive testing approach matches project standards