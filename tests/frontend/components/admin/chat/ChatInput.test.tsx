/**
 * @fileoverview ChatInput component integration tests
 * 
 * Tests for chat input component covering keyboard shortcuts,
 * command history navigation, and form submission.
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../../../../../frontend/src/components/admin/chat/ChatInput';

describe('ChatInput Component', () => {
  const defaultProps = {
    onCommand: jest.fn(),
    isLoading: false,
    history: [],
    historyIndex: -1,
    placeholder: 'Type a command...',
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render input field and send button', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<ChatInput {...defaultProps} placeholder="Custom placeholder" />);

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('should show keyboard shortcuts help', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByText('Type /help for available commands')).toBeInTheDocument();
      expect(screen.getByText('↑↓ History')).toBeInTheDocument();
      expect(screen.getByText('⏎ Send')).toBeInTheDocument();
      expect(screen.getByText('Esc Clear')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onCommand when form is submitted', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} />);

      const input = screen.getByPlaceholderText('Type a command...');
      const sendButton = screen.getByRole('button', { name: 'Send' });

      await userEvent.type(input, '/help');
      fireEvent.click(sendButton);

      expect(onCommand).toHaveBeenCalledWith('/help');
    });

    it('should call onCommand when Enter key is pressed', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} />);

      const input = screen.getByPlaceholderText('Type a command...');

      await userEvent.type(input, '/list-offers');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onCommand).toHaveBeenCalledWith('/list-offers');
    });

    it('should clear input after submission', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} />);

      const input = screen.getByPlaceholderText('Type a command...') as HTMLInputElement;

      await userEvent.type(input, '/help');
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should not submit empty input', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} />);

      const sendButton = screen.getByRole('button', { name: 'Send' });

      fireEvent.click(sendButton);

      expect(onCommand).not.toHaveBeenCalled();
      expect(sendButton).toBeDisabled();
    });

    it('should not submit whitespace-only input', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} />);

      const input = screen.getByPlaceholderText('Type a command...');

      await userEvent.type(input, '   ');
      fireEvent.submit(input.closest('form')!);

      expect(onCommand).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should disable input and button when loading', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      const input = screen.getByPlaceholderText('Type a command...');
      const sendButton = screen.getByRole('button', { name: 'Sending...' });

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('should show "Sending..." text when loading', () => {
      render(<ChatInput {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(screen.queryByText('Send')).not.toBeInTheDocument();
    });

    it('should not submit when loading', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} isLoading={true} />);

      const input = screen.getByPlaceholderText('Type a command...');

      await userEvent.type(input, '/help');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onCommand).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable input and button when disabled', () => {
      render(<ChatInput {...defaultProps} disabled={true} />);

      const input = screen.getByPlaceholderText('Type a command...');
      const sendButton = screen.getByRole('button', { name: 'Send' });

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('should not submit when disabled', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} disabled={true} />);

      const input = screen.getByPlaceholderText('Type a command...');

      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onCommand).not.toHaveBeenCalled();
    });
  });

  describe('Command History Navigation', () => {
    const historyProps = {
      ...defaultProps,
      history: ['/list-offers', '/help', '/add-offer https://example.com']
    };

    it('should navigate through history with arrow keys', async () => {
      render(<ChatInput {...historyProps} />);

      const input = screen.getByPlaceholderText('Type a command...') as HTMLInputElement;

      // Navigate up through history
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(input.value).toBe('/list-offers');

      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(input.value).toBe('/help');

      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(input.value).toBe('/add-offer https://example.com');

      // Try to go beyond history
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(input.value).toBe('/add-offer https://example.com');
    });

    it('should navigate down through history', async () => {
      render(<ChatInput {...historyProps} />);

      const input = screen.getByPlaceholderText('Type a command...') as HTMLInputElement;

      // Go to end of history first
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });

      // Navigate down
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(input.value).toBe('/help');

      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(input.value).toBe('/list-offers');

      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(input.value).toBe('');
    });

    it('should handle empty history gracefully', () => {
      render(<ChatInput {...defaultProps} history={[]} />);

      const input = screen.getByPlaceholderText('Type a command...') as HTMLInputElement;

      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(input.value).toBe('');

      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      expect(input.value).toBe('');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should clear input on Escape key', async () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a command...') as HTMLInputElement;

      await userEvent.type(input, 'some text');
      expect(input.value).toBe('some text');

      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      expect(input.value).toBe('');
    });

    it('should reset history index when typing', async () => {
      const historyProps = {
        ...defaultProps,
        history: ['/help', '/list-offers']
      };

      render(<ChatInput {...historyProps} />);

      const input = screen.getByPlaceholderText('Type a command...') as HTMLInputElement;

      // Navigate to history item
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(input.value).toBe('/help');

      // Start typing - should reset history navigation
      await userEvent.type(input, ' modified');
      expect(input.value).toBe('/help modified');

      // Arrow up should not navigate in history anymore
      fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
      expect(input.value).toBe('/help modified');
    });
  });

  describe('Slash Command Indicator', () => {
    it('should show CMD indicator for slash commands', async () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a command...');

      await userEvent.type(input, '/help');

      expect(screen.getByText('CMD')).toBeInTheDocument();
    });

    it('should not show CMD indicator for regular text', async () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a command...');

      await userEvent.type(input, 'regular text');

      expect(screen.queryByText('CMD')).not.toBeInTheDocument();
    });

    it('should apply special styling for slash commands', async () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a command...');

      await userEvent.type(input, '/help');

      // Check if input has special border color for slash commands
      expect(input).toHaveStyle({ borderColor: '#3182ce' });
    });
  });

  describe('Button States', () => {
    it('should enable send button when input has content', async () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a command...');
      const sendButton = screen.getByRole('button', { name: 'Send' });

      expect(sendButton).toBeDisabled();

      await userEvent.type(input, '/help');

      expect(sendButton).toBeEnabled();
    });

    it('should disable send button for empty input', () => {
      render(<ChatInput {...defaultProps} />);

      const sendButton = screen.getByRole('button', { name: 'Send' });

      expect(sendButton).toBeDisabled();
    });
  });

  describe('Focus Management', () => {
    it('should focus input on mount', () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a command...');

      expect(input).toHaveFocus();
    });

    it('should not focus input when disabled', () => {
      render(<ChatInput {...defaultProps} disabled={true} />);

      const input = screen.getByPlaceholderText('Type a command...');

      expect(input).not.toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<ChatInput {...defaultProps} />);

      const form = screen.getByRole('form');
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');

      expect(form).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    it('should have proper input attributes', () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', 'Type a command...');
    });

    it('should have proper button attributes', () => {
      render(<ChatInput {...defaultProps} />);

      const button = screen.getByRole('button', { name: 'Send' });

      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} />);

      const input = screen.getByPlaceholderText('Type a command...');
      const longText = 'a'.repeat(1000);

      await userEvent.type(input, longText);
      fireEvent.submit(input.closest('form')!);

      expect(onCommand).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters in input', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} />);

      const input = screen.getByPlaceholderText('Type a command...');
      const specialText = '/add-offer "https://example.com/path?param=value&other=123"';

      await userEvent.type(input, specialText);
      fireEvent.submit(input.closest('form')!);

      expect(onCommand).toHaveBeenCalledWith(specialText);
    });

    it('should handle rapid key presses', async () => {
      const onCommand = jest.fn();
      render(<ChatInput {...defaultProps} onCommand={onCommand} />);

      const input = screen.getByPlaceholderText('Type a command...');

      // Rapid enter presses
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Should not call onCommand multiple times for empty input
      expect(onCommand).not.toHaveBeenCalled();
    });
  });
});