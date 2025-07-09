/**
 * @fileoverview Chat history component
 * 
 * Scrollable container for chat messages with auto-scroll functionality
 * and loading states.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import type { ChatHistoryProps } from '../../../types/chat';

/**
 * Chat history component with auto-scroll and message list
 */
export const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  isLoading = false,
  className = '',
  maxHeight = '400px'
}) => {
  const historyRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);

  /**
   * Scroll to bottom of chat history
   */
  const scrollToBottom = useCallback(() => {
    if (historyRef.current && isAutoScrollEnabled.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, []);

  /**
   * Check if user has scrolled up (disable auto-scroll)
   */
  const handleScroll = useCallback(() => {
    if (!historyRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = historyRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
    
    // Enable auto-scroll only if user is at the bottom
    isAutoScrollEnabled.current = isAtBottom;
  }, []);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  /**
   * Render welcome message when no messages
   */
  const renderWelcomeMessage = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#718096',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        🤖
      </div>
      <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
        Welcome to Admin Chat
      </div>
      <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
        Type <span style={{ color: '#3182ce', fontWeight: '500' }}>/help</span> to get started
      </div>
      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
        Manage offers and questions with simple commands
      </div>
    </div>
  );

  /**
   * Render loading indicator
   */
  const renderLoading = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      color: '#718096'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #e2e8f0',
          borderTopColor: '#3182ce',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.875rem' }}>Processing...</span>
      </div>
    </div>
  );

  /**
   * Render scroll to bottom button
   */
  const renderScrollToBottomButton = () => (
    <button
      onClick={scrollToBottom}
      style={{
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        width: '2.5rem',
        height: '2.5rem',
        backgroundColor: '#3182ce',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.2s',
        zIndex: 10
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#2c5aa0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#3182ce';
      }}
      title="Scroll to bottom"
    >
      ↓
    </button>
  );

  return (
    <div 
      className={className}
      style={{
        position: 'relative',
        height: '100%',
        maxHeight,
        minHeight: '200px'
      }}
    >
      <div
        ref={historyRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          scrollBehavior: 'smooth'
        }}
      >
        {/* Welcome message when no messages */}
        {messages.length === 0 && !isLoading && renderWelcomeMessage()}

        {/* Messages list */}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || `message-${index}`}
            message={message}
            showTimestamp={true}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && renderLoading()}
      </div>

      {/* Scroll to bottom button (only show when not auto-scrolling) */}
      {!isAutoScrollEnabled.current && messages.length > 0 && renderScrollToBottomButton()}

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar styling */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
};

export default ChatHistory;