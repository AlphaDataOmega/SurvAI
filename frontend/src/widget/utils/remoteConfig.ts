/**
 * @fileoverview Remote configuration loader for widget options
 * 
 * Handles CORS-safe loading of widget configuration from remote URLs
 * with graceful failure patterns following existing WidgetApi patterns.
 */

import type { WidgetMountOptions } from '../index';

/**
 * Configuration loader error types
 */
export enum RemoteConfigErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Remote configuration loader error
 */
export interface RemoteConfigError extends Error {
  type: RemoteConfigErrorType;
  context?: Record<string, unknown>;
  originalError?: Error;
}

/**
 * Remote configuration loader following WidgetApi patterns
 */
export class RemoteConfigLoader {
  private readonly timeout: number;
  private readonly retries: number;

  constructor(timeout: number = 5000, retries: number = 2) {
    this.timeout = timeout;
    this.retries = retries;
  }

  /**
   * Load configuration from remote URL with CORS handling
   * Following the fetch pattern from widgetApi.ts lines 129-252
   */
  async loadConfig(configUrl: string): Promise<Partial<WidgetMountOptions>> {
    // Validate URL format
    if (!this.isValidUrl(configUrl)) {
      console.warn('Invalid config URL format:', configUrl);
      return {};
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const config = await this.fetchConfig(configUrl);
        return this.validateConfig(config);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain error types
        if (this.shouldNotRetry(error as RemoteConfigError)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // Graceful failure - don't break widget functionality
    console.warn('Failed to load remote config after retries:', lastError);
    return {};
  }

  /**
   * Fetch configuration with timeout and CORS handling
   */
  private async fetchConfig(configUrl: string): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(configUrl, {
        method: 'GET',
        mode: 'cors', // Explicit CORS mode
        credentials: 'omit', // Don't send credentials for security
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createError(
          RemoteConfigErrorType.NETWORK_ERROR,
          `HTTP ${response.status}: ${response.statusText}`,
          { status: response.status, url: configUrl }
        );
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw this.createError(
          RemoteConfigErrorType.PARSE_ERROR,
          'Response is not JSON',
          { contentType, url: configUrl }
        );
      }

      return await response.json();

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError(
          RemoteConfigErrorType.TIMEOUT_ERROR,
          'Request timeout',
          { timeout: this.timeout, url: configUrl }
        );
      }

      if (error instanceof TypeError && error.message.includes('CORS')) {
        throw this.createError(
          RemoteConfigErrorType.CORS_ERROR,
          'CORS error - check server configuration',
          { url: configUrl },
          error
        );
      }

      if ((error as RemoteConfigError).type) {
        throw error; // Re-throw our own errors
      }

      throw this.createError(
        RemoteConfigErrorType.NETWORK_ERROR,
        'Network request failed',
        { url: configUrl },
        error as Error
      );
    }
  }

  /**
   * Validate and sanitize remote configuration
   */
  private validateConfig(config: any): Partial<WidgetMountOptions> {
    if (!config || typeof config !== 'object') {
      throw this.createError(
        RemoteConfigErrorType.VALIDATION_ERROR,
        'Configuration must be an object',
        { config }
      );
    }

    const validConfig: Partial<WidgetMountOptions> = {};

    // Validate surveyId (string)
    if (config.surveyId && typeof config.surveyId === 'string') {
      validConfig.surveyId = config.surveyId;
    }

    // Validate apiUrl (string, valid URL)
    if (config.apiUrl && typeof config.apiUrl === 'string' && this.isValidUrl(config.apiUrl)) {
      validConfig.apiUrl = config.apiUrl;
    }

    // Validate partnerId (string)
    if (config.partnerId && typeof config.partnerId === 'string') {
      validConfig.partnerId = config.partnerId;
    }

    // Validate theme object
    if (config.theme && typeof config.theme === 'object') {
      validConfig.theme = this.validateTheme(config.theme);
    }

    // Don't allow recursive configUrl to prevent infinite loops
    // Don't allow onError function in remote config for security

    return validConfig;
  }

  /**
   * Validate theme configuration subset
   */
  private validateTheme(theme: any): any {
    const validTheme: any = {};

    // Validate color properties (hex colors or named colors)
    const colorProps = ['primaryColor', 'secondaryColor', 'backgroundColor', 'accentColor', 'textColor'];
    colorProps.forEach(prop => {
      if (theme[prop] && typeof theme[prop] === 'string' && this.isValidColor(theme[prop])) {
        validTheme[prop] = theme[prop];
      }
    });

    // Validate font family
    if (theme.fontFamily && typeof theme.fontFamily === 'string') {
      validTheme.fontFamily = theme.fontFamily;
    }

    // Validate border radius
    if (theme.borderRadius && typeof theme.borderRadius === 'string') {
      validTheme.borderRadius = theme.borderRadius;
    }

    // Validate button size
    if (theme.buttonSize && ['small', 'medium', 'large'].includes(theme.buttonSize)) {
      validTheme.buttonSize = theme.buttonSize;
    }

    // Validate spacing
    if (theme.spacing && ['compact', 'normal', 'spacious'].includes(theme.spacing)) {
      validTheme.spacing = theme.spacing;
    }

    // Validate boolean properties
    if (typeof theme.shadows === 'boolean') {
      validTheme.shadows = theme.shadows;
    }
    
    if (typeof theme.transitions === 'boolean') {
      validTheme.transitions = theme.transitions;
    }

    return validTheme;
  }

  /**
   * Basic URL validation
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Basic color validation (hex colors and common named colors)
   */
  private isValidColor(color: string): boolean {
    // Check hex colors
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }
    
    // Check common named colors
    const commonColors = [
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
      'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy',
      'teal', 'silver', 'maroon', 'olive'
    ];
    
    return commonColors.includes(color.toLowerCase());
  }

  /**
   * Determine if error should not be retried
   */
  private shouldNotRetry(error: RemoteConfigError): boolean {
    return [
      RemoteConfigErrorType.CORS_ERROR,
      RemoteConfigErrorType.PARSE_ERROR,
      RemoteConfigErrorType.VALIDATION_ERROR
    ].includes(error.type);
  }

  /**
   * Create a remote config error
   */
  private createError(
    type: RemoteConfigErrorType,
    message: string,
    context?: Record<string, unknown>,
    originalError?: Error
  ): RemoteConfigError {
    const error = new Error(message) as RemoteConfigError;
    error.type = type;
    error.context = context;
    error.originalError = originalError;
    return error;
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  updateConfig(timeout?: number, retries?: number): void {
    if (timeout !== undefined) {
      (this as any).timeout = timeout;
    }
    if (retries !== undefined) {
      (this as any).retries = retries;
    }
  }
}

/**
 * Create remote config loader instance
 */
export function createRemoteConfigLoader(timeout?: number, retries?: number): RemoteConfigLoader {
  return new RemoteConfigLoader(timeout, retries);
}

/**
 * Convenience function for one-off config loading
 */
export async function loadRemoteConfig(configUrl: string): Promise<Partial<WidgetMountOptions>> {
  const loader = createRemoteConfigLoader();
  return loader.loadConfig(configUrl);
}