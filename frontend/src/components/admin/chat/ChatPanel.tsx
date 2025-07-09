/**
 * @fileoverview Main chat panel component
 * 
 * Main chat container that composes all chat sub-components and manages
 * chat state, command execution, and modal integration.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ChatControls } from './ChatControls';
import { ChatHistory } from './ChatHistory';
import { ChatInput } from './ChatInput';
import { useChatCommands } from '../../../hooks/useChatCommands';
import { useAuth } from '../../../hooks/useAuth';
import type { 
  ChatPanelProps, 
  ChatState, 
  ChatMessage,
  ChatConfig
} from '../../../types/chat';

/**
 * Default chat configuration
 */
const DEFAULT_CONFIG: ChatConfig = {
  maxMessages: 100,
  maxHistorySize: 50,
  autoScroll: true,
  timestamps: true,
  commandTimeout: 30000,
  theme: 'light'
};

/**
 * Main chat panel component
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({
  className = '',
  onToggleMinimize,
  onClearHistory
}) => {
  const { isAuthenticated, user } = useAuth();
  const { 
    executeCommand, 
    isLoading, 
    modalState, 
    closeModal 
  } = useChatCommands();

  // Chat state management
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isMinimized: false,
    history: [],
    historyIndex: -1
  });

  /**
   * Generate unique ID for messages
   */
  const generateId = useCallback((): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Add welcome message on first load for authenticated users
   */
  useEffect(() => {
    if (isAuthenticated && user && chatState.messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        type: 'system',
        content: `👋 Welcome back, ${user.name || user.email}!\n\nI'm your admin assistant. Type \`/help\` to see what I can do for you.`,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [welcomeMessage]
      }));
    }
  }, [isAuthenticated, user, chatState.messages.length, generateId]);

  /**
   * Handle command execution
   */
  const handleCommand = useCallback(async (input: string) => {
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
      history: [input, ...prev.history.slice(0, DEFAULT_CONFIG.maxHistorySize - 1)],
      historyIndex: -1
    }));

    try {
      // Execute command and add response
      const response = await executeCommand(input);
      
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, response].slice(-DEFAULT_CONFIG.maxMessages)
      }));
    } catch (error) {
      // Add error message if command execution fails
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'error',
        content: `❌ Failed to execute command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    }
  }, [executeCommand, generateId]);

  /**
   * Handle minimize/maximize toggle
   */
  const handleToggleMinimize = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }));
    
    if (onToggleMinimize) {
      onToggleMinimize(!chatState.isMinimized);
    }
  }, [chatState.isMinimized, onToggleMinimize]);

  /**
   * Handle clear history
   */
  const handleClearHistory = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [],
      history: []
    }));
    
    if (onClearHistory) {
      onClearHistory();
    }
  }, [onClearHistory]);

  /**
   * Handle export history
   */
  const handleExportHistory = useCallback(() => {
    if (chatState.messages.length === 0) return;

    const exportData = {
      user: user?.email || 'Unknown',
      exportedAt: new Date().toISOString(),
      messageCount: chatState.messages.length,
      messages: chatState.messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        command: msg.command,
        args: msg.args
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [chatState.messages, user]);

  /**
   * Show authentication required message for non-authenticated users
   */
  if (!isAuthenticated) {
    return (
      <div 
        className={className}
        style={{
          width: '400px',
          height: '500px',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <ChatControls
          isMinimized={false}
          onToggleMinimize={() => {}}
          onClearHistory={() => {}}
          messageCount={0}
        />
        
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '2rem',
          textAlign: 'center',
          color: '#718096'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Authentication Required
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Please log in to access the admin chat interface.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={className}
      data-testid="chat-panel"
      style={{
        width: '400px',
        height: chatState.isMinimized ? 'auto' : '500px',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.3s ease'
      }}
    >
      {/* Chat Controls */}
      <ChatControls
        isMinimized={chatState.isMinimized}
        onToggleMinimize={handleToggleMinimize}
        onClearHistory={handleClearHistory}
        onExportHistory={handleExportHistory}
        messageCount={chatState.messages.length}
      />

      {/* Chat Content (only when not minimized) */}
      {!chatState.isMinimized && (
        <>
          {/* Chat History */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatHistory
              messages={chatState.messages}
              isLoading={isLoading}
              maxHeight="350px"
            />
          </div>

          {/* Chat Input */}
          <ChatInput
            onCommand={handleCommand}
            isLoading={isLoading}
            history={chatState.history}
            historyIndex={chatState.historyIndex}
            placeholder="Type a command... (try /help)"
          />
        </>
      )}

      {/* Modal Integration Placeholder */}
      {modalState.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: 0 }}>
                {modalState.type === 'offer' ? 'Create Offer' : 'Create Question'}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#718096'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚧</div>
              <div style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                {modalState.type === 'offer' ? 'Offer Creation Modal' : 'Question Creation Modal'}
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                This modal will integrate with the existing{' '}
                {modalState.type === 'offer' ? 'OfferManagement' : 'Question'} component.
              </div>
              
              {modalState.prefillData && (
                <div style={{
                  backgroundColor: '#f7fafc',
                  padding: '1rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  textAlign: 'left'
                }}>
                  <strong>Pre-filled data:</strong>
                  <pre>{JSON.stringify(modalState.prefillData, null, 2)}</pre>
                </div>
              )}
              
              <button
                onClick={closeModal}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;