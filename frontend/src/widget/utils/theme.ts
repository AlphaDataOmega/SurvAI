/**
 * @fileoverview Theme utilities for widget theming and CSS variable injection
 * 
 * Handles theme validation, CSS variable injection into Shadow DOM,
 * and theme merging with safe defaults following existing patterns.
 */

import type { WidgetTheme } from '../index';

/**
 * Default widget theme configuration
 */
const defaultTheme: Required<WidgetTheme> = {
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
 * Spacing values for different density settings
 */
const spacingValues = {
  compact: {
    padding: '0.5rem',
    gap: '0.5rem',
    margin: '0.5rem'
  },
  normal: {
    padding: '1rem',
    gap: '0.75rem',
    margin: '1rem'
  },
  spacious: {
    padding: '1.5rem',
    gap: '1rem',
    margin: '1.5rem'
  }
};

/**
 * Button size configurations
 */
const buttonSizes = {
  small: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem'
  },
  medium: {
    padding: '0.75rem 1rem',
    fontSize: '1rem'
  },
  large: {
    padding: '1rem 1.5rem',
    fontSize: '1.125rem'
  }
};

/**
 * Theme management utility class following WidgetApi patterns
 */
export class ThemeManager {
  private theme: Required<WidgetTheme>;

  constructor(userTheme?: Partial<WidgetTheme>) {
    this.theme = this.mergeTheme(userTheme);
  }

  /**
   * Merge user theme with default theme using safe spread pattern
   */
  mergeTheme(userTheme?: Partial<WidgetTheme>): Required<WidgetTheme> {
    // Handle exactOptionalPropertyTypes requirements
    const safeMerge = { ...defaultTheme };
    
    if (userTheme) {
      Object.keys(userTheme).forEach(key => {
        const themeKey = key as keyof WidgetTheme;
        const value = userTheme[themeKey];
        if (value !== undefined) {
          (safeMerge as any)[themeKey] = value;
        }
      });
    }

    return this.validateTheme(safeMerge);
  }

  /**
   * Validate theme values and provide safe fallbacks
   */
  private validateTheme(theme: Required<WidgetTheme>): Required<WidgetTheme> {
    // Validate colors (basic hex color validation)
    const colorFields: (keyof WidgetTheme)[] = ['primaryColor', 'secondaryColor', 'backgroundColor', 'accentColor', 'textColor'];
    
    colorFields.forEach(field => {
      if (typeof theme[field] === 'string') {
        const color = theme[field] as string;
        if (!this.isValidColor(color)) {
          console.warn(`Invalid color value for ${field}: ${color}. Using default.`);
          theme[field] = defaultTheme[field] as any;
        }
      }
    });

    // Validate spacing
    if (!['compact', 'normal', 'spacious'].includes(theme.spacing)) {
      console.warn(`Invalid spacing value: ${theme.spacing}. Using default.`);
      theme.spacing = defaultTheme.spacing;
    }

    // Validate button size
    if (!['small', 'medium', 'large'].includes(theme.buttonSize)) {
      console.warn(`Invalid buttonSize value: ${theme.buttonSize}. Using default.`);
      theme.buttonSize = defaultTheme.buttonSize;
    }

    return theme;
  }

  /**
   * Basic color validation (hex colors and named colors)
   */
  private isValidColor(color: string): boolean {
    // Check hex colors
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }
    
    // Check named colors and other CSS color values
    const testElement = document.createElement('div');
    testElement.style.color = color;
    return testElement.style.color !== '';
  }

  /**
   * Inject theme CSS variables into Shadow DOM
   * Following the existing style injection pattern from index.ts lines 71-127
   */
  injectThemeVariables(shadowRoot: ShadowRoot, customTheme?: Partial<WidgetTheme>): void {
    const theme = customTheme ? this.mergeTheme(customTheme) : this.theme;
    const spacing = spacingValues[theme.spacing];
    const buttonSize = buttonSizes[theme.buttonSize];

    const style = document.createElement('style');
    style.textContent = `
      :host {
        /* Color variables */
        --survai-primary: ${theme.primaryColor};
        --survai-secondary: ${theme.secondaryColor};
        --survai-accent: ${theme.accentColor};
        --survai-background: ${theme.backgroundColor};
        --survai-text: ${theme.textColor};
        
        /* Typography variables */
        --survai-font-family: ${theme.fontFamily};
        
        /* Spacing variables */
        --survai-border-radius: ${theme.borderRadius};
        --survai-spacing-padding: ${spacing.padding};
        --survai-spacing-gap: ${spacing.gap};
        --survai-spacing-margin: ${spacing.margin};
        
        /* Button variables */
        --survai-button-padding: ${buttonSize.padding};
        --survai-button-font-size: ${buttonSize.fontSize};
        
        /* Effect variables */
        --survai-shadow: ${theme.shadows ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'};
        --survai-shadow-hover: ${theme.shadows ? '0 4px 8px rgba(0, 0, 0, 0.15)' : 'none'};
        --survai-transition: ${theme.transitions ? 'all 0.2s ease-in-out' : 'none'};
        
        /* Apply base styles */
        font-family: var(--survai-font-family);
        background: var(--survai-background);
        border-radius: var(--survai-border-radius);
        box-shadow: var(--survai-shadow);
        color: var(--survai-text);
      }
      
      /* Global CSS variable utility classes */
      .survai-primary-bg { background-color: var(--survai-primary); }
      .survai-secondary-bg { background-color: var(--survai-secondary); }
      .survai-accent-bg { background-color: var(--survai-accent); }
      .survai-primary-text { color: var(--survai-primary); }
      .survai-secondary-text { color: var(--survai-secondary); }
      .survai-accent-text { color: var(--survai-accent); }
      .survai-spacing { padding: var(--survai-spacing-padding); }
      .survai-gap { gap: var(--survai-spacing-gap); }
      .survai-rounded { border-radius: var(--survai-border-radius); }
      .survai-shadow { box-shadow: var(--survai-shadow); }
      .survai-transition { transition: var(--survai-transition); }
    `;
    
    shadowRoot.appendChild(style);
  }

  /**
   * Get current theme configuration
   */
  getTheme(): Required<WidgetTheme> {
    return { ...this.theme };
  }

  /**
   * Update theme configuration
   */
  updateTheme(newTheme: Partial<WidgetTheme>): void {
    this.theme = this.mergeTheme(newTheme);
  }

  /**
   * Get CSS variable value for a theme property
   */
  getCSSVariable(property: keyof WidgetTheme): string {
    switch (property) {
      case 'primaryColor':
        return 'var(--survai-primary)';
      case 'secondaryColor':
        return 'var(--survai-secondary)';
      case 'accentColor':
        return 'var(--survai-accent)';
      case 'backgroundColor':
        return 'var(--survai-background)';
      case 'textColor':
        return 'var(--survai-text)';
      case 'fontFamily':
        return 'var(--survai-font-family)';
      case 'borderRadius':
        return 'var(--survai-border-radius)';
      default:
        return `var(--survai-${property})`;
    }
  }

  /**
   * Create inline styles object using CSS variables
   * For components that need React.CSSProperties
   */
  createInlineStyles(styles: Record<string, string>): React.CSSProperties {
    const result: React.CSSProperties = {};
    
    Object.entries(styles).forEach(([property, value]) => {
      // Convert CSS property names to camelCase for React
      const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelProperty as keyof React.CSSProperties] = value as any;
    });
    
    return result;
  }
}

/**
 * Create theme manager instance
 */
export function createThemeManager(userTheme?: Partial<WidgetTheme>): ThemeManager {
  return new ThemeManager(userTheme);
}

/**
 * Export default theme for external reference
 */
export { defaultTheme };