/**
 * @fileoverview Tests for widget theme utilities and CSS variable injection
 */

import { ThemeManager, createThemeManager, defaultTheme } from '../../frontend/src/widget/utils/theme';

// Mock DOM elements for Shadow DOM testing
const mockShadowRoot = {
  appendChild: jest.fn(),
  querySelector: jest.fn()
} as unknown as ShadowRoot;

// Mock document.createElement for style injection tests
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => {
    if (tagName === 'style') {
      return {
        textContent: '',
        style: {}
      };
    }
    if (tagName === 'div') {
      const element = {
        style: {
          _color: '',
          set color(value: string) {
            // Mock color validation - reject 'invalid-color' but accept normal colors
            if (value === 'invalid-color' || value === '#zzzzzz') {
              this._color = '';
            } else {
              this._color = value;
            }
          },
          get color() {
            return this._color;
          }
        }
      };
      return element;
    }
    return {
      textContent: '',
      style: {}
    };
  })
});

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
    jest.clearAllMocks();
  });

  describe('constructor and theme merging', () => {
    it('should create instance with default theme', () => {
      const theme = themeManager.getTheme();
      
      expect(theme.primaryColor).toBe('#3182ce');
      expect(theme.secondaryColor).toBe('#e2e8f0');
      expect(theme.fontFamily).toBe('system-ui, -apple-system, sans-serif');
      expect(theme.backgroundColor).toBe('#ffffff');
      expect(theme.borderRadius).toBe('0.5rem');
      expect(theme.buttonSize).toBe('medium');
      expect(theme.accentColor).toBe('#38a169');
      expect(theme.textColor).toBe('#1a202c');
      expect(theme.spacing).toBe('normal');
      expect(theme.shadows).toBe(true);
      expect(theme.transitions).toBe(true);
    });

    it('should merge user theme with defaults', () => {
      const customTheme = {
        primaryColor: '#ff0000',
        buttonSize: 'large' as const,
        shadows: false
      };
      
      const manager = new ThemeManager(customTheme);
      const theme = manager.getTheme();
      
      expect(theme.primaryColor).toBe('#ff0000');
      expect(theme.buttonSize).toBe('large');
      expect(theme.shadows).toBe(false);
      // Should preserve defaults for unspecified properties
      expect(theme.secondaryColor).toBe('#e2e8f0');
      expect(theme.fontFamily).toBe('system-ui, -apple-system, sans-serif');
    });

    it('should handle undefined values correctly', () => {
      const customTheme = {
        primaryColor: '#ff0000',
        secondaryColor: undefined,
        accentColor: '#00ff00'
      };
      
      const manager = new ThemeManager(customTheme);
      const theme = manager.getTheme();
      
      expect(theme.primaryColor).toBe('#ff0000');
      expect(theme.secondaryColor).toBe('#e2e8f0'); // Should use default
      expect(theme.accentColor).toBe('#00ff00');
    });
  });

  describe('theme validation', () => {
    it('should validate hex colors correctly', () => {
      const validTheme = {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        accentColor: '#0000ff'
      };
      
      const manager = new ThemeManager(validTheme);
      const theme = manager.getTheme();
      
      expect(theme.primaryColor).toBe('#ff0000');
      expect(theme.secondaryColor).toBe('#00ff00');
      expect(theme.accentColor).toBe('#0000ff');
    });

    it('should fallback to defaults for invalid colors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const invalidTheme = {
        primaryColor: 'invalid-color',
        secondaryColor: '#zzzzzz'
      };
      
      const manager = new ThemeManager(invalidTheme);
      const theme = manager.getTheme();
      
      expect(theme.primaryColor).toBe('#3182ce'); // Should fallback to default
      expect(theme.secondaryColor).toBe('#e2e8f0'); // Should fallback to default
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid color value for primaryColor')
      );
      
      consoleSpy.mockRestore();
    });

    it('should validate spacing values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const invalidTheme = {
        spacing: 'invalid-spacing' as any
      };
      
      const manager = new ThemeManager(invalidTheme);
      const theme = manager.getTheme();
      
      expect(theme.spacing).toBe('normal'); // Should fallback to default
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid spacing value')
      );
      
      consoleSpy.mockRestore();
    });

    it('should validate button size values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const invalidTheme = {
        buttonSize: 'extra-large' as any
      };
      
      const manager = new ThemeManager(invalidTheme);
      const theme = manager.getTheme();
      
      expect(theme.buttonSize).toBe('medium'); // Should fallback to default
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid buttonSize value')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('CSS variable injection', () => {
    it('should inject theme variables into Shadow DOM', () => {
      const customTheme = {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        spacing: 'compact' as const,
        buttonSize: 'large' as const,
        shadows: false,
        transitions: false
      };
      
      themeManager.injectThemeVariables(mockShadowRoot, customTheme);
      
      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(mockShadowRoot.appendChild).toHaveBeenCalled();
      
      // Check that the style element was created with correct content
      const styleElement = (document.createElement as jest.Mock).mock.results[0].value;
      expect(styleElement.textContent).toContain('--survai-primary: #ff0000');
      expect(styleElement.textContent).toContain('--survai-secondary: #00ff00');
      expect(styleElement.textContent).toContain('--survai-spacing-padding: 0.5rem');
      expect(styleElement.textContent).toContain('--survai-button-padding: 1rem 1.5rem');
      expect(styleElement.textContent).toContain('--survai-shadow: none');
      expect(styleElement.textContent).toContain('--survai-transition: none');
    });

    it('should inject default theme when no custom theme provided', () => {
      themeManager.injectThemeVariables(mockShadowRoot);
      
      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(mockShadowRoot.appendChild).toHaveBeenCalled();
      
      const styleElement = (document.createElement as jest.Mock).mock.results[0].value;
      expect(styleElement.textContent).toContain('--survai-primary: #3182ce');
      expect(styleElement.textContent).toContain('--survai-secondary: #e2e8f0');
    });

    it('should include utility classes in injected styles', () => {
      themeManager.injectThemeVariables(mockShadowRoot);
      
      const styleElement = (document.createElement as jest.Mock).mock.results[0].value;
      expect(styleElement.textContent).toContain('.survai-primary-bg { background-color: var(--survai-primary)');
      expect(styleElement.textContent).toContain('.survai-secondary-text { color: var(--survai-secondary)');
      expect(styleElement.textContent).toContain('.survai-spacing { padding: var(--survai-spacing-padding)');
    });
  });

  describe('CSS variable getters', () => {
    it('should return correct CSS variable names', () => {
      expect(themeManager.getCSSVariable('primaryColor')).toBe('var(--survai-primary)');
      expect(themeManager.getCSSVariable('secondaryColor')).toBe('var(--survai-secondary)');
      expect(themeManager.getCSSVariable('accentColor')).toBe('var(--survai-accent)');
      expect(themeManager.getCSSVariable('backgroundColor')).toBe('var(--survai-background)');
      expect(themeManager.getCSSVariable('textColor')).toBe('var(--survai-text)');
      expect(themeManager.getCSSVariable('fontFamily')).toBe('var(--survai-font-family)');
      expect(themeManager.getCSSVariable('borderRadius')).toBe('var(--survai-border-radius)');
    });

    it('should handle unknown properties', () => {
      expect(themeManager.getCSSVariable('unknownProperty' as any)).toBe('var(--survai-unknownProperty)');
    });
  });

  describe('inline styles creation', () => {
    it('should create React.CSSProperties object', () => {
      const styles = themeManager.createInlineStyles({
        'background-color': 'var(--survai-primary)',
        'border-radius': 'var(--survai-border-radius)',
        'font-size': '1rem'
      });
      
      expect(styles).toEqual({
        backgroundColor: 'var(--survai-primary)',
        borderRadius: 'var(--survai-border-radius)',
        fontSize: '1rem'
      });
    });

    it('should handle camelCase conversion correctly', () => {
      const styles = themeManager.createInlineStyles({
        'margin-top': '1rem',
        'padding-left': '2rem',
        'box-shadow': 'var(--survai-shadow)'
      });
      
      expect(styles).toEqual({
        marginTop: '1rem',
        paddingLeft: '2rem',
        boxShadow: 'var(--survai-shadow)'
      });
    });
  });

  describe('theme updates', () => {
    it('should update theme configuration', () => {
      const initialTheme = themeManager.getTheme();
      expect(initialTheme.primaryColor).toBe('#3182ce');
      
      themeManager.updateTheme({ primaryColor: '#ff0000' });
      
      const updatedTheme = themeManager.getTheme();
      expect(updatedTheme.primaryColor).toBe('#ff0000');
      expect(updatedTheme.secondaryColor).toBe('#e2e8f0'); // Should preserve other properties
    });
  });
});

describe('createThemeManager', () => {
  it('should create ThemeManager instance', () => {
    const manager = createThemeManager();
    expect(manager).toBeInstanceOf(ThemeManager);
  });

  it('should create ThemeManager with custom theme', () => {
    const customTheme = { primaryColor: '#ff0000' };
    const manager = createThemeManager(customTheme);
    const theme = manager.getTheme();
    
    expect(theme.primaryColor).toBe('#ff0000');
  });
});

describe('defaultTheme export', () => {
  it('should export default theme object', () => {
    expect(defaultTheme).toBeDefined();
    expect(defaultTheme.primaryColor).toBe('#3182ce');
    expect(defaultTheme.secondaryColor).toBe('#e2e8f0');
    expect(defaultTheme.fontFamily).toBe('system-ui, -apple-system, sans-serif');
    expect(defaultTheme.backgroundColor).toBe('#ffffff');
    expect(defaultTheme.borderRadius).toBe('0.5rem');
    expect(defaultTheme.buttonSize).toBe('medium');
    expect(defaultTheme.accentColor).toBe('#38a169');
    expect(defaultTheme.textColor).toBe('#1a202c');
    expect(defaultTheme.spacing).toBe('normal');
    expect(defaultTheme.shadows).toBe(true);
    expect(defaultTheme.transitions).toBe(true);
  });
});

describe('spacing configurations', () => {
  it('should use correct spacing values for compact setting', () => {
    const manager = new ThemeManager({ spacing: 'compact' });
    manager.injectThemeVariables(mockShadowRoot);
    
    const styleElement = (document.createElement as jest.Mock).mock.results[0].value;
    expect(styleElement.textContent).toContain('--survai-spacing-padding: 0.5rem');
    expect(styleElement.textContent).toContain('--survai-spacing-gap: 0.5rem');
  });

  it('should use correct spacing values for spacious setting', () => {
    const manager = new ThemeManager({ spacing: 'spacious' });
    manager.injectThemeVariables(mockShadowRoot);
    
    const styleElement = (document.createElement as jest.Mock).mock.results[0].value;
    expect(styleElement.textContent).toContain('--survai-spacing-padding: 1.5rem');
    expect(styleElement.textContent).toContain('--survai-spacing-gap: 1rem');
  });
});

describe('button size configurations', () => {
  it('should use correct button sizing for small buttons', () => {
    const manager = new ThemeManager({ buttonSize: 'small' });
    manager.injectThemeVariables(mockShadowRoot);
    
    const styleElement = (document.createElement as jest.Mock).mock.results[0].value;
    expect(styleElement.textContent).toContain('--survai-button-padding: 0.5rem 0.75rem');
    expect(styleElement.textContent).toContain('--survai-button-font-size: 0.875rem');
  });

  it('should use correct button sizing for large buttons', () => {
    const manager = new ThemeManager({ buttonSize: 'large' });
    manager.injectThemeVariables(mockShadowRoot);
    
    const styleElement = (document.createElement as jest.Mock).mock.results[0].value;
    expect(styleElement.textContent).toContain('--survai-button-padding: 1rem 1.5rem');
    expect(styleElement.textContent).toContain('--survai-button-font-size: 1.125rem');
  });
});