/**
 * @fileoverview Chat service
 * 
 * Optional service for chat-specific operations and utilities.
 * Provides helper functions for command processing and message formatting.
 */

import type { 
  ChatMessage, 
  TableFormatOptions,
  ChatStats
} from '../types/chat';

/**
 * Chat service class for utility functions
 */
export class ChatService {
  /**
   * Format data as a table for chat display
   */
  static formatAsTable(data: unknown[], options: TableFormatOptions): string {
    if (data.length === 0) {
      return '📋 No data available.';
    }

    const { headers, rows, compact = false } = options;
    
    let table = `📋 **Data Table** (${data.length} ${data.length === 1 ? 'item' : 'items'})\n\n`;
    
    if (compact) {
      // Simple compact format
      table += headers.join(' | ') + '\n';
      table += headers.map(() => '---').join('|') + '\n';
      rows.forEach(row => {
        table += row.join(' | ') + '\n';
      });
    } else {
      // Full table format with borders
      table += `| ${headers.join(' | ')} |\n`;
      table += `|${headers.map(() => '---').join('|')}|\n`;
      
      rows.forEach(row => {
        table += `| ${row.join(' | ')} |\n`;
      });
    }

    return table;
  }

  /**
   * Sanitize command input
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .substring(0, 500); // Limit length
  }

  /**
   * Generate command suggestion based on partial input
   */
  static getSuggestions(input: string, availableCommands: string[]): string[] {
    if (!input.startsWith('/')) return [];
    
    const commandPart = input.substring(1).toLowerCase();
    return availableCommands
      .filter(cmd => cmd.toLowerCase().startsWith(commandPart))
      .slice(0, 5);
  }

  /**
   * Format command response with consistent styling
   */
  static formatCommandResponse(
    type: 'success' | 'error' | 'info',
    message: string,
    data?: unknown
  ): string {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    let response = `${icon} ${message}`;
    
    if (data) {
      response += '\n\n```json\n' + JSON.stringify(data, null, 2) + '\n```';
    }
    
    return response;
  }

  /**
   * Calculate chat statistics
   */
  static calculateStats(messages: ChatMessage[]): ChatStats {
    const userMessages = messages.filter(m => m.type === 'user');
    const errorMessages = messages.filter(m => m.type === 'error');
    const successMessages = messages.filter(m => m.type === 'success');
    
    const commands = userMessages.filter(m => m.content.startsWith('/'));
    
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const sessionDuration = firstMessage && lastMessage ? 
      lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime() : 0;

    return {
      totalMessages: messages.length,
      totalCommands: commands.length,
      successfulCommands: successMessages.length,
      failedCommands: errorMessages.length,
      sessionDuration
    };
  }

  /**
   * Export chat history to different formats
   */
  static exportHistory(
    messages: ChatMessage[], 
    format: 'json' | 'txt' | 'csv' = 'json',
    userInfo?: { email: string; name?: string }
  ): string {
    const exportData = {
      user: userInfo?.email || 'Unknown',
      userName: userInfo?.name || 'Unknown',
      exportedAt: new Date().toISOString(),
      format,
      messageCount: messages.length,
      stats: this.calculateStats(messages),
      messages: messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        command: msg.command,
        args: msg.args
      }))
    };

    switch (format) {
      case 'txt': {
        let txtContent = `Chat History Export\n`;
        txtContent += `User: ${exportData.user}\n`;
        txtContent += `Exported: ${exportData.exportedAt}\n`;
        txtContent += `Messages: ${exportData.messageCount}\n\n`;
        txtContent += '--- Messages ---\n\n';
        
        messages.forEach(msg => {
          txtContent += `[${msg.timestamp.toLocaleString()}] ${msg.type.toUpperCase()}: ${msg.content}\n\n`;
        });
        
        return txtContent;
      }

      case 'csv': {
        let csvContent = 'Timestamp,Type,Content,Command,Args\n';
        messages.forEach(msg => {
          const escapedContent = msg.content.replace(/"/g, '""');
          const args = msg.args ? msg.args.join(';') : '';
          csvContent += `"${msg.timestamp.toISOString()}","${msg.type}","${escapedContent}","${msg.command || ''}","${args}"\n`;
        });
        return csvContent;
      }

      case 'json':
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  /**
   * Parse complex command arguments
   */
  static parseComplexArgs(argsString: string): Record<string, string> {
    const args: Record<string, string> = {};
    const regex = /--(\w+)(?:\s+([^\s-]+|"[^"]*"))?/g;
    let match;

    while ((match = regex.exec(argsString)) !== null) {
      const key = match[1];
      let value = match[2] || 'true';
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      args[key] = value;
    }

    return args;
  }

  /**
   * Validate command permissions based on user role
   */
  static validateCommandPermissions(
    command: string, 
    userRole: string
  ): { allowed: boolean; reason?: string } {
    const adminOnlyCommands = ['add-offer', 'add-question', 'delete-', 'update-'];
    
    if (userRole !== 'ADMIN') {
      const isAdminCommand = adminOnlyCommands.some(adminCmd => 
        command.startsWith(adminCmd)
      );
      
      if (isAdminCommand) {
        return {
          allowed: false,
          reason: 'This command requires admin privileges'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Rate limiting for command execution
   */
  static rateLimiter = {
    attempts: new Map<string, { count: number; resetTime: number }>(),
    
    isAllowed(userId: string, maxAttempts = 10, windowMs = 60000): boolean {
      const now = Date.now();
      const userAttempts = this.attempts.get(userId);
      
      if (!userAttempts || now > userAttempts.resetTime) {
        this.attempts.set(userId, { count: 1, resetTime: now + windowMs });
        return true;
      }
      
      if (userAttempts.count >= maxAttempts) {
        return false;
      }
      
      userAttempts.count++;
      return true;
    },
    
    getRemainingAttempts(userId: string, maxAttempts = 10): number {
      const userAttempts = this.attempts.get(userId);
      if (!userAttempts) return maxAttempts;
      return Math.max(0, maxAttempts - userAttempts.count);
    }
  };
}

export default ChatService;