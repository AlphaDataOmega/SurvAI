/**
 * @fileoverview Chat message component
 * 
 * Individual message component for displaying chat messages with
 * proper styling based on message type and rich content support.
 */

import React from 'react';
import type { ChatMessageProps } from '../../../types/chat';

/**
 * Chat message component with type-based styling
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  showTimestamp = true,
  className = ''
}) => {
  /**
   * Get message type styling
   */
  const getMessageStyle = () => {
    const baseStyle = {
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      wordBreak: 'break-word' as const,
      whiteSpace: 'pre-wrap' as const
    };

    switch (message.type) {
      case 'user':
        return {
          ...baseStyle,
          backgroundColor: '#3182ce',
          color: 'white',
          marginLeft: '2rem',
          alignSelf: 'flex-end'
        };
      case 'system':
        return {
          ...baseStyle,
          backgroundColor: '#f7fafc',
          color: '#2d3748',
          border: '1px solid #e2e8f0'
        };
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#f0fff4',
          color: '#22543d',
          border: '1px solid #9ae6b4'
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#fed7d7',
          color: '#c53030',
          border: '1px solid #fc8181'
        };
      case 'info':
        return {
          ...baseStyle,
          backgroundColor: '#ebf8ff',
          color: '#2b6cb0',
          border: '1px solid #90cdf4'
        };
      default:
        return baseStyle;
    }
  };

  /**
   * Get message icon based on type
   */
  const getMessageIcon = () => {
    switch (message.type) {
      case 'user':
        return '👤';
      case 'system':
        return '🤖';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  /**
   * Process message content for rich formatting
   */
  const processContent = (content: string): React.ReactNode => {
    // Handle markdown-like formatting for tables and emphasis
    let processedContent = content;
    
    // Convert **text** to bold
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert `code` to inline code
    processedContent = processedContent.replace(/`([^`]+)`/g, '<code style="background-color: #f1f5f9; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.8em;">$1</code>');
    
    // For simple implementation, handle tables differently
    if (processedContent.includes('|') && processedContent.includes('---')) {
      return (
        <div>
          {processedContent.split('\n').map((line, index) => {
            if (line.includes('|') && line.trim().startsWith('|')) {
              const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
              const isHeaderRow = processedContent.split('\n')[index + 1]?.includes('---');
              
              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '0.8em',
                  fontWeight: isHeaderRow ? '600' : '400'
                }}>
                  {cells.map((cell, cellIndex) => (
                    <div 
                      key={cellIndex} 
                      style={{ 
                        padding: '0.25rem 0.5rem',
                        flex: 1,
                        borderRight: cellIndex < cells.length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}
                      dangerouslySetInnerHTML={{ __html: cell }}
                    />
                  ))}
                </div>
              );
            } else if (line.includes('---')) {
              return null; // Skip separator lines
            } else if (line.trim()) {
              return (
                <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
              );
            } else {
              return <br key={index} />;
            }
          })}
        </div>
      );
    }
    
    // For non-table content, process normally
    return (
      <div dangerouslySetInnerHTML={{ __html: processedContent.replace(/\n/g, '<br />') }} />
    );
  };

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <div style={getMessageStyle()}>
        {/* Message header with icon and timestamp */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: message.content.trim() ? '0.5rem' : '0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1rem' }}>
              {getMessageIcon()}
            </span>
            <span style={{ 
              fontSize: '0.75rem',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {message.type === 'user' ? 'You' : message.type}
            </span>
          </div>
          
          {showTimestamp && (
            <span style={{
              fontSize: '0.7rem',
              opacity: 0.7,
              fontFamily: 'monospace'
            }}>
              {formatTimestamp(message.timestamp)}
            </span>
          )}
        </div>

        {/* Message content */}
        {message.content.trim() && (
          <div style={{ wordBreak: 'break-word' }}>
            {processContent(message.content)}
          </div>
        )}

        {/* Command info if available */}
        {message.command && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.7rem',
            opacity: 0.7,
            fontFamily: 'monospace'
          }}>
            Command: {message.command}
            {message.args && message.args.length > 0 && (
              <span> [{message.args.join(', ')}]</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;