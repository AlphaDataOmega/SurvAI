# 💬 Admin Chat Interface Documentation

## Overview

The Admin Chat Interface is a conversational management panel integrated into the SurvAI admin dashboard. It provides a streamlined way to manage offers and questions through slash commands, combining the efficiency of command-line interfaces with the user-friendliness of chat applications.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Slash Commands](#slash-commands)
- [Architecture](#architecture)
- [Components](#components)
- [Implementation Details](#implementation-details)
- [Testing](#testing)
- [Performance](#performance)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Features

### Core Functionality
- **Slash Command Interface**: Execute admin operations through simple text commands
- **Real-time Processing**: Instant command execution with loading states and feedback
- **Authentication Integration**: Seamlessly integrated with existing JWT authentication
- **Modal Integration**: Commands can trigger existing offer management modals
- **Rich Content Display**: Tables, formatted text, and interactive responses
- **Chat History**: Persistent session history with keyboard navigation
- **Error Handling**: Comprehensive validation and user-friendly error messages

### User Experience
- **Minimizable Sidebar**: Collapsible interface that doesn't interfere with dashboard
- **Keyboard Shortcuts**: Enter to send, Up/Down for history, Esc to clear
- **Auto-scroll**: Automatically scrolls to new messages
- **Responsive Design**: Adapts to different screen sizes
- **Session Persistence**: Chat history maintained during session

## Quick Start

### Accessing the Chat Interface

1. **Login** to the admin dashboard at `/admin`
2. **Locate the chat panel** on the right side of the dashboard (fixed sidebar)
3. **Click to expand** if minimized
4. **Type `/help`** to see available commands

### Basic Usage Example

```bash
# Start with help
/help

# List current offers
/list-offers

# Add a new offer
/add-offer https://affiliate-network.com/offer/123

# List questions for a survey
/list-questions survey-456

# Add a question to a survey
/add-question survey-456
```

## Slash Commands

### Help Command

```bash
/help
```

**Description**: Displays all available commands with usage examples and descriptions.

**Output**: Formatted list of commands with syntax and examples.

### Offer Management Commands

#### List Offers
```bash
/list-offers [page] [limit]
```

**Parameters**:
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of offers per page (default: 10)

**Examples**:
```bash
/list-offers           # First 10 offers
/list-offers 2         # Second page, 10 offers
/list-offers 1 5       # First page, 5 offers
```

**Output**: Table showing offer ID, title, status, destination URL, EPC, and performance metrics.

#### Add Offer
```bash
/add-offer <destinationUrl>
```

**Parameters**:
- `destinationUrl` (required): The affiliate offer destination URL

**Examples**:
```bash
/add-offer https://affiliate-network.com/offer/123
/add-offer "https://example.com/offer?param=value"
```

**Behavior**: Opens the offer creation modal with the destination URL pre-filled.

### Question Management Commands

#### List Questions
```bash
/list-questions [surveyId]
```

**Parameters**:
- `surveyId` (optional): Specific survey ID to filter questions

**Examples**:
```bash
/list-questions                    # All questions
/list-questions survey-abc-123     # Questions for specific survey
```

**Output**: Table showing question ID, text, type, survey, and associated offers.

#### Add Question
```bash
/add-question <surveyId>
```

**Parameters**:
- `surveyId` (required): Survey ID to add the question to

**Examples**:
```bash
/add-question survey-abc-123
```

**Behavior**: Opens the question creation modal for the specified survey.

## Architecture

### Component Hierarchy

```
ChatPanel (Main Container)
├── ChatControls (Header with minimize/maximize)
├── ChatHistory (Message display area)
├── ChatInput (Input field with command processing)
└── Modal Integration (Connects to existing modals)
```

### Data Flow

1. **User Input** → ChatInput component
2. **Command Parsing** → useChatCommands hook (regex-based)
3. **Authentication Check** → useAuth hook validation
4. **API Call** → Existing service APIs (offer.ts, etc.)
5. **Response Processing** → Format response for chat display
6. **UI Update** → Add messages to chat history

### State Management

```typescript
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isMinimized: boolean;
  history: string[];
  historyIndex: number;
}
```

## Components

### ChatPanel.tsx

**Purpose**: Main container component that orchestrates all chat functionality.

**Key Features**:
- State management for chat interface
- Integration with authentication system
- Modal state coordination
- Message history management

**Props**:
```typescript
interface ChatPanelProps {
  className?: string;
  onToggleMinimize?: (isMinimized: boolean) => void;
  onClearHistory?: () => void;
}
```

### ChatInput.tsx

**Purpose**: Input field with slash command detection and keyboard shortcuts.

**Key Features**:
- Slash command detection with special styling
- Command history navigation (Up/Down arrows)
- Form validation and submission
- Loading state management

**Props**:
```typescript
interface ChatInputProps {
  onCommand: (input: string) => void;
  isLoading?: boolean;
  history?: string[];
  historyIndex?: number;
  placeholder?: string;
  disabled?: boolean;
}
```

### ChatMessage.tsx

**Purpose**: Individual message display with type-based styling and rich content.

**Key Features**:
- Message type styling (user, system, success, error, info)
- Rich content formatting (tables, code, links)
- Timestamp display
- Command context information

**Props**:
```typescript
interface ChatMessageProps {
  message: ChatMessage;
  showTimestamp?: boolean;
  className?: string;
}
```

### ChatHistory.tsx

**Purpose**: Scrollable message history with auto-scroll functionality.

**Key Features**:
- Auto-scroll to new messages
- Performance optimization for large message lists
- Loading state display
- Message spacing and layout

**Props**:
```typescript
interface ChatHistoryProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  maxHeight?: string;
}
```

### ChatControls.tsx

**Purpose**: Header controls for chat management.

**Key Features**:
- Minimize/maximize toggle
- Clear history button
- Message count display
- Export functionality (optional)

**Props**:
```typescript
interface ChatControlsProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClearHistory: () => void;
  onExportHistory?: () => void;
  messageCount?: number;
  className?: string;
}
```

## Implementation Details

### Command Parsing

The system uses a simple regex-based approach for parsing slash commands:

```typescript
const parseCommand = useCallback((input: string): ChatCommand | null => {
  const match = input.match(/^\/(\w+)(?:\s+(.*))?$/);
  if (!match) return null;
  
  const [, command, argsString] = match;
  const args = argsString ? argsString.trim().split(/\s+/) : [];
  
  return { command, args, raw: input };
}, []);
```

### API Integration

Commands integrate with existing API services:

```typescript
// Example: List offers command
const listOffersHandler = async (args: string[]): Promise<ChatMessage> => {
  const page = parseInt(args[0]) || 1;
  const limit = parseInt(args[1]) || 10;
  
  const result = await offerApi.getOffers({ page, limit });
  
  if (result.success) {
    const tableContent = formatOffersTable(result.data);
    return {
      id: generateId(),
      type: 'success',
      content: tableContent,
      timestamp: new Date()
    };
  } else {
    return {
      id: generateId(),
      type: 'error',
      content: `Failed to fetch offers: ${result.error}`,
      timestamp: new Date()
    };
  }
};
```

### Modal Integration

Commands can trigger existing modals with pre-filled data:

```typescript
const addOfferHandler = async (args: string[]): Promise<ChatMessage> => {
  if (args.length === 0) {
    return { type: 'error', content: 'Usage: /add-offer <destinationUrl>' };
  }
  
  const destinationUrl = args[0];
  
  // Trigger modal opening with pre-filled data
  setModalState({
    isOpen: true,
    type: 'offer',
    prefillData: { destinationUrl }
  });
  
  return {
    type: 'success',
    content: `Opening offer creation modal for: ${destinationUrl}`
  };
};
```

### Rich Content Formatting

Messages support rich content including tables:

```typescript
const formatOffersTable = (offers: Offer[]): string => {
  const headers = ['ID', 'Title', 'Status', 'EPC', 'Clicks', 'Conversions'];
  const rows = offers.map(offer => [
    offer.id,
    offer.title,
    offer.status,
    `$${offer.epc.toFixed(2)}`,
    offer.totalClicks.toString(),
    offer.totalConversions.toString()
  ]);
  
  return createMarkdownTable(headers, rows);
};
```

## Testing

### Unit Tests

**Location**: `tests/frontend/hooks/useChatCommands.test.ts`

**Coverage**:
- Command parsing with various input formats
- Authentication validation
- Error handling for invalid commands
- API integration mocking
- Edge cases and boundary conditions

**Example Test**:
```typescript
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
});
```

### Component Tests

**Location**: `tests/frontend/components/admin/chat/`

**Files**:
- `ChatPanel.test.tsx` - Main container component tests
- `ChatInput.test.tsx` - Input component and keyboard interaction tests

**Coverage**:
- UI rendering and interaction
- Authentication state handling
- Modal integration
- Keyboard shortcuts
- Loading states
- Error scenarios

### Integration Tests

**Coverage**:
- End-to-end command execution
- API service integration
- Modal state management
- Authentication enforcement
- Error boundary behavior

## Performance

### Optimization Strategies

1. **Component Composition**: Each component is under 500 LOC limit
2. **Lazy Loading**: Modal components loaded on demand
3. **Memoization**: React.memo and useMemo for expensive operations
4. **Efficient Updates**: Minimal re-renders through proper state management
5. **History Management**: Limited to 50 recent commands to prevent memory bloat

### Performance Metrics

- **Command Execution**: < 100ms for local operations
- **API Calls**: Dependent on existing service performance
- **Memory Usage**: Bounded by message history limit
- **Bundle Size**: Minimal impact due to shared dependencies

## Security

### Authentication
- **Admin Only Access**: All commands require authenticated admin user
- **Session Validation**: Commands validate current session before execution
- **Token Refresh**: Integrated with existing JWT refresh mechanism

### Input Validation
- **Command Parsing**: Safe regex-based parsing without eval
- **Parameter Validation**: Type checking and sanitization for all arguments
- **XSS Prevention**: Content sanitization for display
- **CSRF Protection**: Uses existing CSRF protection from API layer

### Error Handling
- **Graceful Degradation**: Failed commands don't crash the interface
- **User Feedback**: Clear error messages without exposing sensitive information
- **Rate Limiting**: Inherits rate limiting from underlying API services

## Troubleshooting

### Common Issues

#### Chat Not Appearing
**Symptoms**: Chat panel not visible on dashboard
**Solutions**:
1. Verify user is authenticated as admin
2. Check browser console for JavaScript errors
3. Ensure ChatPanel is properly imported in Dashboard.tsx

#### Commands Not Working
**Symptoms**: Commands return errors or don't execute
**Solutions**:
1. Verify authentication status
2. Check command syntax with `/help`
3. Inspect network requests for API errors
4. Verify backend services are running

#### Modal Not Opening
**Symptoms**: `/add-offer` and `/add-question` commands don't open modals
**Solutions**:
1. Check modal state management in ChatPanel
2. Verify modal components are properly imported
3. Check browser console for React errors

#### Chat History Issues
**Symptoms**: History not persisting or navigation not working
**Solutions**:
1. Check localStorage permissions
2. Verify keyboard event handlers
3. Test with different browsers

### Debug Mode

Enable debug logging:

```typescript
// In useChatCommands.ts
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Command parsed:', command);
  console.log('API response:', response);
}
```

### Network Debugging

Monitor API calls in browser DevTools:
1. Open Network tab
2. Execute chat commands
3. Check for failed requests
4. Verify request/response formats

## Browser Support

### Minimum Requirements
- **Chrome**: 88+
- **Firefox**: 84+
- **Safari**: 14+
- **Edge**: 88+

### Known Limitations
- Internet Explorer not supported
- Requires JavaScript enabled
- WebSocket features may require additional polyfills

## Future Enhancements

### Planned Features
1. **Command Autocomplete**: Intelligent command suggestions
2. **Bulk Operations**: Commands for batch operations
3. **Export/Import**: Chat history export and command scripting
4. **Voice Commands**: Speech-to-text integration
5. **AI Assistant**: Integration with OpenAI for natural language commands

### Extension Points
- Custom command registration system
- Plugin architecture for third-party commands
- Webhook integration for external notifications
- Advanced filtering and search capabilities

## Changelog

### Version 1.0.0 (M3_PHASE_08)
- Initial implementation with core slash commands
- Basic offer and question management
- Authentication integration
- Modal integration
- Comprehensive testing suite

---

**Built with ❤️ by the SurvAI Team**

For support or questions, please refer to the main project documentation or create an issue in the project repository.