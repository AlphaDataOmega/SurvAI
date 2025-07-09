/**
 * @fileoverview Chat commands hook
 * 
 * React hook for parsing and executing chat commands in the admin interface.
 * Integrates with existing API services for offer and question management.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { offerApi } from '../services/offer';
import { questionApi } from '../services/question';
import type { 
  ChatMessage, 
  ChatCommand, 
  CommandHandler, 
  CommandRegistry,
  ChatModalState,
  TableFormatOptions
} from '../types/chat';
import type { OfferWithMetrics, ListOffersRequest, Question } from '@survai/shared';

/**
 * Chat commands hook
 */
export const useChatCommands = () => {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<ChatModalState>({
    isOpen: false,
    type: null,
    prefillData: null
  });

  /**
   * Command parsing using simple regex (following PRP guidance)
   */
  const parseCommand = useCallback((input: string): ChatCommand | null => {
    const match = input.match(/^\/(\w+)(?:\s+(.*))?$/);
    if (!match) return null;
    
    const [, command, argsString] = match;
    const args = argsString ? argsString.trim().split(/\s+/) : [];
    
    return { command, args, raw: input };
  }, []);

  /**
   * Generate unique ID for messages
   */
  const generateId = useCallback((): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Format offers as table for chat display
   */
  const formatOffersTable = useCallback((offers: OfferWithMetrics[]): string => {
    if (offers.length === 0) {
      return '📋 No offers found.';
    }

    const headers = ['Title', 'Status', 'Category', 'EPC', 'Clicks', 'Conversions'];
    const rows = offers.map(offer => [
      offer.title,
      offer.status,
      offer.category,
      `$${offer.epcMetrics?.epc?.toFixed(2) || '0.00'}`,
      offer.epcMetrics?.totalClicks?.toString() || '0',
      offer.epcMetrics?.totalConversions?.toString() || '0'
    ]);

    // Simple table formatting for chat
    let table = `📋 **Offers** (${offers.length} total)\n\n`;
    table += `| ${headers.join(' | ')} |\n`;
    table += `|${headers.map(() => '---').join('|')}|\n`;
    
    rows.forEach(row => {
      table += `| ${row.join(' | ')} |\n`;
    });

    return table;
  }, []);

  /**
   * Format questions as table for chat display
   */
  const formatQuestionsTable = useCallback((questions: Question[], surveyId: string): string => {
    if (questions.length === 0) {
      return `📋 **Questions for Survey: ${surveyId}**\n\nNo questions found for this survey.`;
    }

    const headers = ['Order', 'Type', 'Text', 'Status', 'Options'];
    const rows = questions
      .sort((a, b) => a.order - b.order)
      .map(question => [
        question.order.toString(),
        question.type,
        question.text.length > 50 ? `${question.text.substring(0, 47)}...` : question.text,
        'Active', // Questions don't have status in the model, defaulting to Active
        question.options?.length?.toString() || '0'
      ]);

    // Simple table formatting for chat
    let table = `📋 **Questions for Survey: ${surveyId}** (${questions.length} total)\n\n`;
    table += `| ${headers.join(' | ')} |\n`;
    table += `|${headers.map(() => '---').join('|')}|\n`;
    
    rows.forEach(row => {
      table += `| ${row.join(' | ')} |\n`;
    });

    return table;
  }, []);

  /**
   * Create success message
   */
  const createSuccessMessage = useCallback((content: string): ChatMessage => ({
    id: generateId(),
    type: 'success',
    content,
    timestamp: new Date()
  }), [generateId]);

  /**
   * Create error message
   */
  const createErrorMessage = useCallback((content: string): ChatMessage => ({
    id: generateId(),
    type: 'error',
    content,
    timestamp: new Date()
  }), [generateId]);

  /**
   * Create system message
   */
  const createSystemMessage = useCallback((content: string): ChatMessage => ({
    id: generateId(),
    type: 'system',
    content,
    timestamp: new Date()
  }), [generateId]);

  /**
   * Command handlers registry
   */
  const commandHandlers: CommandRegistry = useMemo(() => ({
    'help': {
      name: 'help',
      description: 'Show available commands',
      usage: '/help',
      handler: async (): Promise<ChatMessage> => {
        const helpText = `
🤖 **Available Commands:**

**Offer Management:**
• \`/list-offers [page] [limit]\` - List offers with pagination
• \`/add-offer <url>\` - Open offer creation modal with pre-filled URL

**Question Management:**
• \`/list-questions [surveyId]\` - List questions for a survey
• \`/add-question <surveyId>\` - Open question creation modal

**General:**
• \`/help\` - Show this help message

**Examples:**
• \`/list-offers\` - List first 10 offers
• \`/list-offers 2 5\` - List page 2 with 5 offers per page
• \`/add-offer https://example.com/offer\` - Create offer with URL
• \`/list-questions survey-123\` - List questions for survey
        `;
        return createSystemMessage(helpText);
      }
    },

    'list-offers': {
      name: 'list-offers',
      description: 'List all offers with pagination',
      usage: '/list-offers [page] [limit]',
      handler: async (args: string[]): Promise<ChatMessage> => {
        // Check authentication
        if (!isAuthenticated) {
          return createErrorMessage('🔒 Authentication required. Please log in first.');
        }

        try {
          const page = parseInt(args[0]) || 1;
          const limit = parseInt(args[1]) || 10;

          // Validate pagination parameters
          if (page < 1) {
            return createErrorMessage('❌ Page number must be greater than 0.');
          }
          if (limit < 1 || limit > 100) {
            return createErrorMessage('❌ Limit must be between 1 and 100.');
          }

          const filters: ListOffersRequest = {
            page,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          };

          const result = await offerApi.list(filters);
          
          if (result.success) {
            const tableContent = formatOffersTable(result.data.offers);
            const pagination = result.data.pagination;
            const paginationInfo = `\n📄 Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total offers)`;
            
            return createSuccessMessage(tableContent + paginationInfo);
          } else {
            return createErrorMessage(`❌ Failed to fetch offers: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          return createErrorMessage(`❌ Error loading offers: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    },

    'add-offer': {
      name: 'add-offer',
      description: 'Open modal to add new offer',
      usage: '/add-offer <destinationUrl>',
      handler: async (args: string[]): Promise<ChatMessage> => {
        // Check authentication
        if (!isAuthenticated) {
          return createErrorMessage('🔒 Authentication required. Please log in first.');
        }

        // Check admin role
        if (user?.role !== 'ADMIN') {
          return createErrorMessage('🔒 Admin access required.');
        }

        // Validate arguments
        if (args.length === 0) {
          return createErrorMessage('❌ Usage: /add-offer <destinationUrl>\n\nExample: /add-offer https://example.com/offer');
        }

        const destinationUrl = args[0];
        
        // Basic URL validation
        try {
          new URL(destinationUrl);
        } catch {
          return createErrorMessage('❌ Invalid URL format. Please provide a valid URL starting with http:// or https://');
        }

        // Trigger modal opening with pre-filled data
        setModalState({
          isOpen: true,
          type: 'offer',
          prefillData: { destinationUrl }
        });

        return createSuccessMessage(`✅ Opening offer creation modal with URL: ${destinationUrl}`);
      }
    },

    'list-questions': {
      name: 'list-questions',
      description: 'List questions for a survey',
      usage: '/list-questions [surveyId]',
      handler: async (args: string[]): Promise<ChatMessage> => {
        // Check authentication
        if (!isAuthenticated) {
          return createErrorMessage('🔒 Authentication required. Please log in first.');
        }

        const surveyId = args[0];
        
        if (!surveyId) {
          return createErrorMessage('❌ Usage: /list-questions <surveyId>\n\nExample: /list-questions survey-123');
        }

        try {
          // Call the question API service to get questions
          const result = await questionApi.getQuestionsBySurvey(surveyId);
          
          if (result.success) {
            const tableContent = formatQuestionsTable(result.data, surveyId);
            return createSuccessMessage(tableContent);
          } else {
            return createErrorMessage(`❌ Failed to fetch questions: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          // Handle API errors gracefully
          if (error instanceof Error) {
            if (error.message.includes('404') || error.message.includes('not found')) {
              return createErrorMessage(`❌ Survey '${surveyId}' not found. Please check the survey ID and try again.`);
            }
            return createErrorMessage(`❌ Failed to fetch questions: ${error.message}`);
          }
          return createErrorMessage(`❌ Failed to fetch questions: Unknown error occurred`);
        }
      }
    },

    'add-question': {
      name: 'add-question',
      description: 'Open modal to add new question',
      usage: '/add-question <surveyId>',
      handler: async (args: string[]): Promise<ChatMessage> => {
        // Check authentication
        if (!isAuthenticated) {
          return createErrorMessage('🔒 Authentication required. Please log in first.');
        }

        // Check admin role
        if (user?.role !== 'ADMIN') {
          return createErrorMessage('🔒 Admin access required.');
        }

        const surveyId = args[0];
        
        if (!surveyId) {
          return createErrorMessage('❌ Usage: /add-question <surveyId>\n\nExample: /add-question survey-123');
        }

        // Trigger modal opening with pre-filled data
        setModalState({
          isOpen: true,
          type: 'question',
          prefillData: { surveyId }
        });

        return createSuccessMessage(`✅ Opening question creation modal for survey: ${surveyId}`);
      }
    }
  }), [isAuthenticated, user, formatOffersTable, formatQuestionsTable, createSuccessMessage, createErrorMessage, createSystemMessage]);

  /**
   * Execute command with error handling
   */
  const executeCommand = useCallback(async (input: string): Promise<ChatMessage> => {
    setIsLoading(true);
    
    try {
      const command = parseCommand(input);
      if (!command) {
        return createErrorMessage('❌ Invalid command format. Type /help for available commands.');
      }
      
      const handler = commandHandlers[command.command];
      if (!handler) {
        return createErrorMessage(`❌ Unknown command: ${command.command}. Type /help for available commands.`);
      }
      
      return await handler.handler(command.args);
    } catch (error) {
      console.error('Command execution error:', error);
      return createErrorMessage(`❌ Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [parseCommand, commandHandlers, createErrorMessage]);

  /**
   * Get available commands list
   */
  const getAvailableCommands = useCallback((): CommandHandler[] => {
    return Object.values(commandHandlers);
  }, [commandHandlers]);

  /**
   * Close modal
   */
  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, prefillData: null });
  }, []);

  return {
    executeCommand,
    parseCommand,
    isLoading,
    commandHandlers,
    getAvailableCommands,
    modalState,
    closeModal,
    setModalState
  };
};

export default useChatCommands;