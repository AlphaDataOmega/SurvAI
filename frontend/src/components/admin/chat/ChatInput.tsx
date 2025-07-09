/**
 * @fileoverview Chat input component
 * 
 * Input component for chat interface with slash command support,
 * keyboard shortcuts, and command history navigation.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatInputProps } from '../../../types/chat';

/**
 * Chat input component with slash command support
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onCommand,
  isLoading = false,
  history = [],
  historyIndex = -1,
  placeholder = 'Type a command...',
  disabled = false
}) => {
  const [input, setInput] = useState('');
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(historyIndex);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle input submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || disabled) {
      return;
    }

    onCommand(input.trim());
    setInput('');
    setCurrentHistoryIndex(-1);
  }, [input, isLoading, disabled, onCommand]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Enter
    if (e.key === 'Enter') {
      handleSubmit(e);
      return;
    }

    // History navigation with Up/Down arrows
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (history.length === 0) return;

      let newIndex = currentHistoryIndex;
      
      if (e.key === 'ArrowUp') {
        newIndex = currentHistoryIndex + 1;
        if (newIndex >= history.length) {
          newIndex = history.length - 1;
        }
      } else if (e.key === 'ArrowDown') {
        newIndex = currentHistoryIndex - 1;
        if (newIndex < -1) {
          newIndex = -1;
        }
      }

      setCurrentHistoryIndex(newIndex);
      
      if (newIndex === -1) {
        setInput('');
      } else {
        setInput(history[newIndex]);
      }
    }

    // Clear input on Escape
    if (e.key === 'Escape') {
      setInput('');
      setCurrentHistoryIndex(-1);
    }
  }, [handleSubmit, history, currentHistoryIndex]);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setCurrentHistoryIndex(-1);
  }, []);

  /**
   * Focus input on mount
   */
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  /**
   * Check if input starts with slash command
   */
  const isSlashCommand = input.startsWith('/');

  return (
    <div style={{
      padding: '1rem',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: '#f7fafc'
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: `2px solid ${isSlashCommand ? '#3182ce' : '#e2e8f0'}`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: disabled ? '#f7fafc' : 'white',
              color: disabled ? '#a0aec0' : '#2d3748'
            }}
          />
          
          {/* Slash command indicator */}
          {isSlashCommand && (
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem',
              color: '#3182ce',
              fontWeight: '500'
            }}>
              CMD
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: (!input.trim() || isLoading || disabled) ? '#e2e8f0' : '#3182ce',
            color: (!input.trim() || isLoading || disabled) ? '#a0aec0' : 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: (!input.trim() || isLoading || disabled) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            minWidth: '70px'
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {/* Keyboard shortcuts help */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.5rem',
        fontSize: '0.75rem',
        color: '#718096'
      }}>
        <div>
          Type <span style={{ color: '#3182ce', fontWeight: '500' }}>/help</span> for available commands
        </div>
        <div>
          <span style={{ marginRight: '1rem' }}>↑↓ History</span>
          <span style={{ marginRight: '1rem' }}>⏎ Send</span>
          <span>Esc Clear</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;