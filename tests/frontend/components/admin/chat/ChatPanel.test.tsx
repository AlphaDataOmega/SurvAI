/**
 * @fileoverview ChatPanel component tests
 * 
 * Tests for chat panel component covering UI interactions,
 * command execution, and modal integration.
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatPanel } from '../../../../../frontend/src/components/admin/chat/ChatPanel';
import { useAuth } from '../../../../../frontend/src/hooks/useAuth';
import { useChatCommands } from '../../../../../frontend/src/hooks/useChatCommands';
import type { User } from '@survai/shared';

// Mock dependencies
jest.mock('../../../../../frontend/src/hooks/useAuth');
jest.mock('../../../../../frontend/src/hooks/useChatCommands');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseChatCommands = useChatCommands as jest.MockedFunction<typeof useChatCommands>;

// Mock user data
const mockAdminUser: User = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock chat commands hook return value
const mockChatCommandsHook = {
  executeCommand: jest.fn(),
  parseCommand: jest.fn(),
  isLoading: false,
  commandHandlers: {},
  getAvailableCommands: jest.fn(() => []),
  modalState: { isOpen: false, type: null, prefillData: null },
  closeModal: jest.fn(),
  setModalState: jest.fn()
};

describe('ChatPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication States', () => {
    it('should show authentication required when not authenticated', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedUseChatCommands.mockReturnValue(mockChatCommandsHook);

      render(<ChatPanel />);

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please log in to access the admin chat interface.')).toBeInTheDocument();
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should show chat interface when authenticated', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedUseChatCommands.mockReturnValue(mockChatCommandsHook);

      render(<ChatPanel />);

      expect(screen.getByText('Admin Chat')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a command... (try /help)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    });
  });

  describe('Chat Interface Rendering', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedUseChatCommands.mockReturnValue(mockChatCommandsHook);
    });

    it('should render chat controls', () => {
      render(<ChatPanel />);

      expect(screen.getByText('Admin Chat')).toBeInTheDocument();
      expect(screen.getByText('⬇️ Hide')).toBeInTheDocument();
    });

    it('should render chat input and history', () => {
      render(<ChatPanel />);

      expect(screen.getByPlaceholderText('Type a command... (try /help)')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Admin Chat')).toBeInTheDocument();
      expect(screen.getByText('Type /help to get started')).toBeInTheDocument();
    });

    it('should show welcome message with user name', async () => {
      render(<ChatPanel />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Admin User!/)).toBeInTheDocument();
      });
    });
  });

  describe('Minimize/Maximize Functionality', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedUseChatCommands.mockReturnValue(mockChatCommandsHook);
    });

    it('should toggle minimize state', () => {
      render(<ChatPanel />);

      const minimizeButton = screen.getByText('⬇️ Hide');
      fireEvent.click(minimizeButton);

      expect(screen.getByText('⬆️ Show')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Type a command... (try /help)')).not.toBeInTheDocument();
    });

    it('should call onToggleMinimize callback', () => {
      const onToggleMinimize = jest.fn();
      render(<ChatPanel onToggleMinimize={onToggleMinimize} />);

      const minimizeButton = screen.getByText('⬇️ Hide');
      fireEvent.click(minimizeButton);

      expect(onToggleMinimize).toHaveBeenCalledWith(true);
    });
  });

  describe('Command Execution', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });
    });

    it('should execute command when input is submitted', async () => {
      const mockExecuteCommand = jest.fn().mockResolvedValue({
        id: 'response-1',
        type: 'success',
        content: 'Command executed successfully',
        timestamp: new Date()
      });

      mockedUseChatCommands.mockReturnValue({
        ...mockChatCommandsHook,
        executeCommand: mockExecuteCommand
      });

      render(<ChatPanel />);

      const input = screen.getByPlaceholderText('Type a command... (try /help)');
      const sendButton = screen.getByRole('button', { name: 'Send' });

      fireEvent.change(input, { target: { value: '/help' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockExecuteCommand).toHaveBeenCalledWith('/help');
      });
    });

    it('should display user message immediately', async () => {
      const mockExecuteCommand = jest.fn().mockResolvedValue({
        id: 'response-1',
        type: 'success',
        content: 'Command executed successfully',
        timestamp: new Date()
      });

      mockedUseChatCommands.mockReturnValue({
        ...mockChatCommandsHook,
        executeCommand: mockExecuteCommand
      });

      render(<ChatPanel />);

      const input = screen.getByPlaceholderText('Type a command... (try /help)');
      fireEvent.change(input, { target: { value: '/help' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('/help')).toBeInTheDocument();
      });
    });

    it('should handle command execution errors', async () => {
      const mockExecuteCommand = jest.fn().mockRejectedValue(new Error('Command failed'));

      mockedUseChatCommands.mockReturnValue({
        ...mockChatCommandsHook,
        executeCommand: mockExecuteCommand
      });

      render(<ChatPanel />);

      const input = screen.getByPlaceholderText('Type a command... (try /help)');
      fireEvent.change(input, { target: { value: '/error-command' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/Failed to execute command: Command failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });
    });

    it('should show loading state during command execution', () => {
      mockedUseChatCommands.mockReturnValue({
        ...mockChatCommandsHook,
        isLoading: true
      });

      render(<ChatPanel />);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should disable input during loading', () => {
      mockedUseChatCommands.mockReturnValue({
        ...mockChatCommandsHook,
        isLoading: true
      });

      render(<ChatPanel />);

      const input = screen.getByPlaceholderText('Type a command... (try /help)');
      const sendButton = screen.getByRole('button', { name: 'Sending...' });

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Modal Integration', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });
    });

    it('should show modal when modalState is open', () => {
      const mockCloseModal = jest.fn();

      mockedUseChatCommands.mockReturnValue({
        ...mockChatCommandsHook,
        modalState: {
          isOpen: true,
          type: 'offer',
          prefillData: { destinationUrl: 'https://example.com' }
        },
        closeModal: mockCloseModal
      });

      render(<ChatPanel />);

      expect(screen.getByText('Create Offer')).toBeInTheDocument();
      expect(screen.getByText('Offer Creation Modal')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', () => {
      const mockCloseModal = jest.fn();

      mockedUseChatCommands.mockReturnValue({
        ...mockChatCommandsHook,
        modalState: {
          isOpen: true,
          type: 'offer',
          prefillData: null
        },
        closeModal: mockCloseModal
      });

      render(<ChatPanel />);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockCloseModal).toHaveBeenCalled();
    });

    it('should show question modal', () => {
      mockedUseChatCommands.mockReturnValue({
        ...mockChatCommandsHook,
        modalState: {
          isOpen: true,
          type: 'question',
          prefillData: { surveyId: 'survey-123' }
        }
      });

      render(<ChatPanel />);

      expect(screen.getByText('Create Question')).toBeInTheDocument();
      expect(screen.getByText('Question Creation Modal')).toBeInTheDocument();
      expect(screen.getByText('survey-123')).toBeInTheDocument();
    });
  });

  describe('Clear History Functionality', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedUseChatCommands.mockReturnValue(mockChatCommandsHook);
    });

    it('should call onClearHistory callback', () => {
      const onClearHistory = jest.fn();
      
      // Mock window.confirm to return true
      window.confirm = jest.fn().mockReturnValue(true);

      render(<ChatPanel onClearHistory={onClearHistory} />);

      // First add a message to show clear button
      const input = screen.getByPlaceholderText('Type a command... (try /help)');
      fireEvent.change(input, { target: { value: '/help' } });
      fireEvent.submit(input.closest('form')!);

      // Wait for message to appear and then look for clear button
      waitFor(() => {
        const clearButton = screen.getByText('🗑️ Clear');
        fireEvent.click(clearButton);
        expect(onClearHistory).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedUseChatCommands.mockReturnValue(mockChatCommandsHook);
    });

    it('should have proper form accessibility', () => {
      render(<ChatPanel />);

      const form = screen.getByRole('form');
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button', { name: 'Send' });

      expect(form).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    it('should have proper button accessibility for controls', () => {
      render(<ChatPanel />);

      const minimizeButton = screen.getByRole('button', { name: /Hide/ });
      expect(minimizeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedUseChatCommands.mockReturnValue(mockChatCommandsHook);
    });

    it('should handle empty command input', () => {
      render(<ChatPanel />);

      const input = screen.getByPlaceholderText('Type a command... (try /help)');
      const sendButton = screen.getByRole('button', { name: 'Send' });

      fireEvent.change(input, { target: { value: '' } });
      
      expect(sendButton).toBeDisabled();
    });

    it('should handle whitespace-only input', () => {
      render(<ChatPanel />);

      const input = screen.getByPlaceholderText('Type a command... (try /help)');
      const sendButton = screen.getByRole('button', { name: 'Send' });

      fireEvent.change(input, { target: { value: '   ' } });
      
      expect(sendButton).toBeDisabled();
    });

    it('should render without optional props', () => {
      expect(() => {
        render(<ChatPanel />);
      }).not.toThrow();
    });
  });
});