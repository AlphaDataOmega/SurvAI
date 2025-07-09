/**
 * @fileoverview Chat type definitions
 * 
 * TypeScript interfaces for chat functionality to ensure type safety
 * and consistency across the admin chat interface.
 */

/**
 * Chat message types for different message categories
 */
export type ChatMessageType = 'user' | 'system' | 'error' | 'success' | 'info';

/**
 * Individual chat message structure
 */
export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  command?: string;
  args?: string[];
}

/**
 * Parsed command structure
 */
export interface ChatCommand {
  command: string;
  args: string[];
  raw: string;
}

/**
 * Chat state management interface
 */
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isMinimized: boolean;
  history: string[];
  historyIndex: number;
}

/**
 * Command handler function type
 */
export type CommandHandlerFunction = (args: string[]) => Promise<ChatMessage>;

/**
 * Command handler configuration
 */
export interface CommandHandler {
  name: string;
  description: string;
  usage: string;
  handler: CommandHandlerFunction;
}

/**
 * Chat panel props interface
 */
export interface ChatPanelProps {
  className?: string;
  onToggleMinimize?: (isMinimized: boolean) => void;
  onClearHistory?: () => void;
}

/**
 * Chat input props interface
 */
export interface ChatInputProps {
  onCommand: (input: string) => void;
  isLoading?: boolean;
  history?: string[];
  historyIndex?: number;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Chat message props interface
 */
export interface ChatMessageProps {
  message: ChatMessage;
  showTimestamp?: boolean;
  className?: string;
}

/**
 * Chat history props interface
 */
export interface ChatHistoryProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  maxHeight?: string;
}

/**
 * Chat controls props interface
 */
export interface ChatControlsProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClearHistory: () => void;
  onExportHistory?: () => void;
  messageCount?: number;
  className?: string;
}

/**
 * Table formatting options for command responses
 */
export interface TableFormatOptions {
  headers: string[];
  rows: string[][];
  maxWidth?: string;
  compact?: boolean;
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  type?: ChatMessageType;
}

/**
 * Chat service configuration
 */
export interface ChatServiceConfig {
  maxHistorySize: number;
  commandTimeout: number;
  enableDebugMode: boolean;
}

/**
 * Command registry interface
 */
export interface CommandRegistry {
  [key: string]: CommandHandler;
}

/**
 * Chat configuration interface
 */
export interface ChatConfig {
  maxMessages: number;
  maxHistorySize: number;
  autoScroll: boolean;
  timestamps: boolean;
  commandTimeout: number;
  theme: 'light' | 'dark';
}

/**
 * Modal integration interface for chat commands
 */
export interface ChatModalState {
  isOpen: boolean;
  type: 'offer' | 'question' | null;
  prefillData?: unknown;
}

/**
 * Chat statistics interface
 */
export interface ChatStats {
  totalMessages: number;
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  sessionDuration: number;
}