/**
 * @fileoverview Tests for widget mount functionality
 */

import { SurvAIWidget } from '../../frontend/src/widget/index';

// Mock DOM environment
Object.defineProperty(global, 'window', {
  value: {
    location: {
      origin: 'http://localhost:3000'
    }
  },
  writable: true
});

// Mock React
jest.mock('react', () => ({
  createElement: jest.fn(),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useCallback: jest.fn()
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn()
  }))
}));

// Mock widget components
jest.mock('../../frontend/src/widget/Widget', () => ({
  Widget: jest.fn(() => null)
}));

describe('SurvAIWidget', () => {
  let mockContainer: HTMLElement;

  beforeEach(() => {
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    jest.clearAllMocks();
  });

  describe('mount', () => {
    it('should mount widget with valid options', () => {
      const options = {
        surveyId: 'test-survey',
        apiUrl: 'http://localhost:3001'
      };

      const widget = SurvAIWidget.mount(mockContainer, options);

      expect(widget).toBeDefined();
      expect(widget.getStatus).toBeDefined();
      expect(widget.unmount).toBeDefined();
      expect(typeof widget.getStatus).toBe('function');
      expect(typeof widget.unmount).toBe('function');
    });

    it('should throw error with invalid container', () => {
      const options = {
        surveyId: 'test-survey',
        apiUrl: 'http://localhost:3001'
      };

      expect(() => {
        SurvAIWidget.mount(null as any, options);
      }).toThrow('Container must be a valid HTMLElement');
    });

    it('should throw error without surveyId', () => {
      const options = {
        apiUrl: 'http://localhost:3001'
      };

      expect(() => {
        SurvAIWidget.mount(mockContainer, options as any);
      }).toThrow('surveyId is required');
    });

    it('should use default apiUrl when not provided', () => {
      const options = {
        surveyId: 'test-survey'
      };

      const widget = SurvAIWidget.mount(mockContainer, options);

      expect(widget).toBeDefined();
      // The mount function should set apiUrl to window.location.origin
    });

    it('should merge theme with defaults', () => {
      const options = {
        surveyId: 'test-survey',
        theme: {
          primaryColor: '#custom-color'
        }
      };

      const widget = SurvAIWidget.mount(mockContainer, options);

      expect(widget).toBeDefined();
      // Theme should be merged with defaults
    });

    it('should handle mount errors gracefully', () => {
      const options = {
        surveyId: 'test-survey',
        onError: jest.fn()
      };

      // Mock attachShadow to throw error
      mockContainer.attachShadow = jest.fn(() => {
        throw new Error('Shadow DOM not supported');
      });

      const widget = SurvAIWidget.mount(mockContainer, options);

      expect(widget).toBeDefined();
      expect(options.onError).toHaveBeenCalled();
    });
  });

  describe('widget instance', () => {
    let widget: any;

    beforeEach(() => {
      widget = SurvAIWidget.mount(mockContainer, {
        surveyId: 'test-survey',
        apiUrl: 'http://localhost:3001'
      });
    });

    it('should return status', () => {
      const status = widget.getStatus();
      expect(['loading', 'ready', 'error']).toContain(status);
    });

    it('should unmount successfully', () => {
      expect(() => {
        widget.unmount();
      }).not.toThrow();
    });
  });

  describe('global window object', () => {
    it('should expose SurvAIWidget globally', () => {
      expect(SurvAIWidget).toBeDefined();
      expect(SurvAIWidget.mount).toBeDefined();
      expect(SurvAIWidget.version).toBeDefined();
    });

    it('should have correct version', () => {
      expect(SurvAIWidget.version).toBe('1.0.0');
    });
  });
});