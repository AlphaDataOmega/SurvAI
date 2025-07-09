/**
 * @fileoverview Widget entry point for embeddable SurvAI widget
 * 
 * Provides global SurvAIWidget.mount() API for external integration.
 * Creates Shadow DOM for CSS isolation and initializes React app.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Widget } from './Widget';
import { createThemeManager } from './utils/theme';
import { createRemoteConfigLoader } from './utils/remoteConfig';

/**
 * Widget mount options for external integration
 */
export interface WidgetMountOptions {
  /** Survey ID to display */
  surveyId: string;
  /** API base URL (optional, defaults to current domain) */
  apiUrl?: string;
  /** Widget theme customization */
  theme?: WidgetTheme;
  /** Container CSS styling */
  containerStyle?: React.CSSProperties;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Partner ID for attribution tracking */
  partnerId?: string;
  /** Remote configuration URL for loading options */
  configUrl?: string;
}

/**
 * Widget theme configuration
 */
export interface WidgetTheme {
  /** Primary color for buttons and accents */
  primaryColor?: string;
  /** Secondary color for secondary elements */
  secondaryColor?: string;
  /** Font family for text */
  fontFamily?: string;
  /** Background color */
  backgroundColor?: string;
  /** Border radius for elements */
  borderRadius?: string;
  /** Button size */
  buttonSize?: 'small' | 'medium' | 'large';
  /** Accent color for highlights and emphasis */
  accentColor?: string;
  /** Text color for content */
  textColor?: string;
  /** Spacing density */
  spacing?: 'compact' | 'normal' | 'spacious';
  /** Enable shadows */
  shadows?: boolean;
  /** Enable transitions and animations */
  transitions?: boolean;
}

/**
 * Widget instance for cleanup
 */
export interface WidgetInstance {
  /** Unmount the widget */
  unmount: () => void;
  /** Get current widget status */
  getStatus: () => 'loading' | 'ready' | 'error';
}

/**
 * Default widget theme
 */
const defaultTheme: WidgetTheme = {
  primaryColor: '#3182ce',
  secondaryColor: '#e2e8f0',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backgroundColor: '#ffffff',
  borderRadius: '0.5rem',
  buttonSize: 'medium',
  accentColor: '#38a169',
  textColor: '#1a202c',
  spacing: 'normal',
  shadows: true,
  transitions: true
};

/**
 * Inject widget styles into Shadow DOM using enhanced theme system
 */
function injectWidgetStyles(shadowRoot: ShadowRoot, theme: WidgetTheme): void {
  // Use new ThemeManager for CSS variable injection
  const themeManager = createThemeManager(theme);
  themeManager.injectThemeVariables(shadowRoot);
  
  // Add additional widget-specific styles that work with CSS variables
  const additionalStyle = document.createElement('style');
  additionalStyle.textContent = `
    :host {
      display: block;
      overflow: hidden;
    }
    
    * {
      box-sizing: border-box;
    }
    
    .widget-container {
      padding: var(--survai-spacing-padding);
      max-width: 100%;
      width: 100%;
    }
    
    .widget-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: calc(var(--survai-spacing-padding) * 1.5);
      color: #6b7280;
      transition: var(--survai-transition);
    }
    
    .widget-error {
      padding: var(--survai-spacing-padding);
      background: #fed7d7;
      color: #c53030;
      border-radius: var(--survai-border-radius);
      margin: var(--survai-spacing-margin);
      box-shadow: var(--survai-shadow);
    }
    
    /* Reset styles to prevent host page interference */
    h1, h2, h3, h4, h5, h6, p, div, span {
      margin: 0;
      padding: 0;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
      color: inherit;
    }
    
    button {
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
      transition: var(--survai-transition);
    }
    
    /* Utility classes for theme consistency */
    .survai-button-primary {
      background-color: var(--survai-primary);
      color: white;
      padding: var(--survai-button-padding);
      font-size: var(--survai-button-font-size);
      border-radius: var(--survai-border-radius);
      box-shadow: var(--survai-shadow);
      transition: var(--survai-transition);
    }
    
    .survai-button-primary:hover {
      box-shadow: var(--survai-shadow-hover);
      transform: translateY(-1px);
    }
    
    .survai-button-secondary {
      background-color: var(--survai-secondary);
      color: var(--survai-primary);
      border: 2px solid var(--survai-primary);
      padding: var(--survai-button-padding);
      font-size: var(--survai-button-font-size);
      border-radius: var(--survai-border-radius);
      transition: var(--survai-transition);
    }
  `;
  shadowRoot.appendChild(additionalStyle);
}

/**
 * Create and mount widget instance with final resolved options
 */
function createWidgetInstance(
  container: HTMLElement,
  options: WidgetMountOptions
): WidgetInstance {
  let status: 'loading' | 'ready' | 'error' = 'loading';
  let shadowRoot: ShadowRoot;
  let reactRoot: any;

  try {
    // Create Shadow DOM for CSS isolation
    shadowRoot = container.attachShadow({ mode: 'open' });
    
    // Merge theme with defaults using ThemeManager
    const themeManager = createThemeManager(options.theme);
    const theme = themeManager.getTheme();
    
    // Inject styles with enhanced theming
    injectWidgetStyles(shadowRoot, theme);
    
    // Create React root container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'widget-container';
    shadowRoot.appendChild(widgetContainer);
    
    // Create React root
    reactRoot = createRoot(widgetContainer);
    
    // Render widget with enhanced options
    reactRoot.render(
      React.createElement(Widget, {
        ...options,
        theme,
        onStatusChange: (newStatus: 'loading' | 'ready' | 'error') => {
          status = newStatus;
        },
        onError: (error: Error) => {
          status = 'error';
          if (options.onError) {
            options.onError(error);
          } else {
            console.error('SurvAI Widget Error:', error);
          }
        }
      })
    );
    
    status = 'ready';
    
  } catch (error) {
    status = 'error';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (shadowRoot) {
      shadowRoot.innerHTML = `
        <div class="widget-error">
          Error loading widget: ${errorMessage}
        </div>
      `;
    }
    
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error(errorMessage));
    } else {
      console.error('SurvAI Widget Error:', error);
    }
  }

  return {
    unmount: () => {
      if (reactRoot) {
        reactRoot.unmount();
      }
      if (shadowRoot) {
        shadowRoot.innerHTML = '';
      }
    },
    getStatus: () => status
  };
}

/**
 * Global SurvAI Widget API
 */
export const SurvAIWidget = {
  /**
   * Mount widget to DOM element with support for remote configuration
   */
  mount: async (container: HTMLElement, options: WidgetMountOptions): Promise<WidgetInstance> => {
    // Validate container
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('Container must be a valid HTMLElement');
    }
    
    // Validate basic options
    if (!options || !options.surveyId) {
      throw new Error('surveyId is required');
    }
    
    let finalOptions = { ...options };
    
    // Load remote configuration if configUrl provided
    if (options.configUrl) {
      try {
        const remoteConfigLoader = createRemoteConfigLoader();
        const remoteConfig = await remoteConfigLoader.loadConfig(options.configUrl);
        
        // Merge configurations: inline options take precedence over remote config
        finalOptions = { ...remoteConfig, ...options };
        
        // Don't allow recursive configUrl from remote config
        delete finalOptions.configUrl;
        
      } catch (error) {
        // Graceful degradation - log warning but continue with inline options
        console.warn('Failed to load remote configuration, using inline options only:', error);
      }
    }
    
    // Set default API URL if not provided
    if (!finalOptions.apiUrl) {
      finalOptions.apiUrl = window.location.origin;
    }
    
    // Create widget instance with final resolved options
    return createWidgetInstance(container, finalOptions);
  },

  /**
   * Synchronous mount for backward compatibility (without remote config)
   */
  mountSync: (container: HTMLElement, options: WidgetMountOptions): WidgetInstance => {
    // Validate container
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('Container must be a valid HTMLElement');
    }
    
    // Validate options
    if (!options || !options.surveyId) {
      throw new Error('surveyId is required');
    }
    
    // Warn if configUrl is provided in sync mode
    if (options.configUrl) {
      console.warn('configUrl is not supported in synchronous mount. Use SurvAIWidget.mount() for remote config support.');
    }
    
    // Set default API URL if not provided
    if (!options.apiUrl) {
      options.apiUrl = window.location.origin;
    }
    
    // Create widget instance
    return createWidgetInstance(container, options);
  },
  
  /**
   * Get widget version
   */
  version: '1.1.0'
};

// Expose globally for UMD bundle
if (typeof window !== 'undefined') {
  (window as any).SurvAIWidget = SurvAIWidget;
}

export default SurvAIWidget;