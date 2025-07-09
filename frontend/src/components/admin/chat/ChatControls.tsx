/**
 * @fileoverview Chat controls component
 * 
 * Header controls for chat panel including minimize/maximize toggle,
 * clear history, and message count display.
 */

import React from 'react';
import type { ChatControlsProps } from '../../../types/chat';

/**
 * Chat controls component with minimize/maximize and actions
 */
export const ChatControls: React.FC<ChatControlsProps> = ({
  isMinimized,
  onToggleMinimize,
  onClearHistory,
  onExportHistory,
  messageCount = 0,
  className = ''
}) => {
  /**
   * Handle clear history with confirmation
   */
  const handleClearHistory = () => {
    if (messageCount === 0) return;
    
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      onClearHistory();
    }
  };

  /**
   * Handle export history
   */
  const handleExportHistory = () => {
    if (messageCount === 0) return;
    
    if (onExportHistory) {
      onExportHistory();
    }
  };

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: isMinimized ? 'none' : '1px solid #e2e8f0',
        backgroundColor: '#f7fafc',
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem'
      }}
    >
      {/* Left side - Title and message count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <h3 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: '600',
            color: '#2d3748'
          }}>
            Admin Chat
          </h3>
        </div>
        
        {!isMinimized && messageCount > 0 && (
          <div style={{
            backgroundColor: '#3182ce',
            color: 'white',
            fontSize: '0.75rem',
            padding: '0.125rem 0.5rem',
            borderRadius: '0.75rem',
            fontWeight: '500',
            minWidth: '1.5rem',
            textAlign: 'center'
          }}>
            {messageCount}
          </div>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {/* Export button (only when not minimized and has messages) */}
        {!isMinimized && messageCount > 0 && onExportHistory && (
          <button
            onClick={handleExportHistory}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: '#4b5563',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Export chat history"
          >
            📤 Export
          </button>
        )}

        {/* Clear history button (only when not minimized and has messages) */}
        {!isMinimized && messageCount > 0 && (
          <button
            onClick={handleClearHistory}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: '#dc2626',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Clear chat history"
          >
            🗑️ Clear
          </button>
        )}

        {/* Minimize/Maximize button */}
        <button
          onClick={onToggleMinimize}
          data-testid="chat-toggle"
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
            color: '#4b5563',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={isMinimized ? 'Maximize chat' : 'Minimize chat'}
        >
          {isMinimized ? '⬆️ Show' : '⬇️ Hide'}
        </button>
      </div>
    </div>
  );
};

export default ChatControls;