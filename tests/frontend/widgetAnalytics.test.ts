/**
 * @fileoverview Tests for widget analytics hook functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useWidget } from '../../frontend/src/widget/hooks/useWidget';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigator.sendBeacon
const mockSendBeacon = jest.fn();
Object.defineProperty(navigator, 'sendBeacon', {
  writable: true,
  value: mockSendBeacon
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock environment
const mockApi = {
  baseURL: 'https://api.example.com'
};

jest.mock('../../frontend/src/services/api', () => ({
  api: mockApi
}));

describe('Widget Analytics Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockSendBeacon.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('analytics beacon functionality', () => {
    it('should send loaded event on widget mount', async () => {
      mockSendBeacon.mockReturnValue(true);

      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Check that sendBeacon was called for loaded event
      expect(mockSendBeacon).toHaveBeenCalledWith(
        'https://api.example.com/widget/analytics',
        expect.any(Blob)
      );

      // Verify the payload
      const callArgs = mockSendBeacon.mock.calls[0];
      const blob = callArgs[1] as Blob;
      const payload = await blob.text();
      const data = JSON.parse(payload);

      expect(data).toEqual({
        surveyId: 'test-survey',
        event: 'loaded'
      });
    });

    it('should fallback to fetch when sendBeacon fails', async () => {
      mockSendBeacon.mockReturnValue(false);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Check that fetch was called as fallback
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/widget/analytics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            surveyId: 'test-survey',
            event: 'loaded'
          })
        }
      );
    });

    it('should fallback to fetch when sendBeacon is not available', async () => {
      // Mock sendBeacon as undefined
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Check that fetch was called directly
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/widget/analytics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            surveyId: 'test-survey',
            event: 'loaded'
          })
        }
      );
    });

    it('should fallback to fetch when payload is too large', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      // Create a large metadata object that would exceed sendBeacon limit
      const largeMetadata = {
        data: 'x'.repeat(70000) // Exceeds 64KB limit
      };

      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // sendBeacon should not be called for large payloads
      expect(mockSendBeacon).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should track dwell time on beforeunload', async () => {
      mockSendBeacon.mockReturnValue(true);

      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Clear previous calls
      mockSendBeacon.mockClear();

      // Advance time to simulate dwell
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Simulate beforeunload event
      act(() => {
        const beforeUnloadEvent = new Event('beforeunload');
        window.dispatchEvent(beforeUnloadEvent);
      });

      // Check that sendBeacon was called for dwell event
      expect(mockSendBeacon).toHaveBeenCalledWith(
        'https://api.example.com/widget/analytics',
        expect.any(Blob)
      );

      // Verify the payload includes dwell time
      const callArgs = mockSendBeacon.mock.calls[0];
      const blob = callArgs[1] as Blob;
      const payload = await blob.text();
      const data = JSON.parse(payload);

      expect(data).toEqual({
        surveyId: 'test-survey',
        event: 'dwell',
        dwellTimeMs: expect.any(Number)
      });
      expect(data.dwellTimeMs).toBeGreaterThan(0);
    });

    it('should handle analytics errors gracefully', async () => {
      mockSendBeacon.mockReturnValue(false);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Should not throw, but should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send analytics event:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should not send analytics when debug mode is enabled', async () => {
      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: true
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Should not send any analytics in debug mode
      expect(mockSendBeacon).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should cleanup event listeners on unmount', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { result, unmount } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Unmount the component
      unmount();

      // Check that beforeunload listener was removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('analytics data validation', () => {
    it('should validate survey ID format', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useWidget({
        surveyId: '', // Invalid empty survey ID
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Should not send analytics with invalid survey ID
      expect(mockSendBeacon).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle missing survey ID gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useWidget({
        surveyId: undefined as any,
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Should not send analytics without survey ID
      expect(mockSendBeacon).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('dwell time tracking', () => {
    it('should track accurate dwell time', async () => {
      mockSendBeacon.mockReturnValue(true);

      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Clear previous calls
      mockSendBeacon.mockClear();

      // Advance time by exactly 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Simulate beforeunload event
      act(() => {
        const beforeUnloadEvent = new Event('beforeunload');
        window.dispatchEvent(beforeUnloadEvent);
      });

      // Verify dwell time is approximately 3000ms
      const callArgs = mockSendBeacon.mock.calls[0];
      const blob = callArgs[1] as Blob;
      const payload = await blob.text();
      const data = JSON.parse(payload);

      expect(data.dwellTimeMs).toBeGreaterThanOrEqual(2900);
      expect(data.dwellTimeMs).toBeLessThanOrEqual(3100);
    });

    it('should not send dwell event for very short visits', async () => {
      mockSendBeacon.mockReturnValue(true);

      const { result } = renderHook(() => useWidget({
        surveyId: 'test-survey',
        debug: false
      }));

      // Wait for component to initialize
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Clear previous calls
      mockSendBeacon.mockClear();

      // Advance time by very short duration
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Simulate beforeunload event
      act(() => {
        const beforeUnloadEvent = new Event('beforeunload');
        window.dispatchEvent(beforeUnloadEvent);
      });

      // Should still send dwell event, but with short time
      expect(mockSendBeacon).toHaveBeenCalled();
      
      const callArgs = mockSendBeacon.mock.calls[0];
      const blob = callArgs[1] as Blob;
      const payload = await blob.text();
      const data = JSON.parse(payload);

      expect(data.event).toBe('dwell');
      expect(data.dwellTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});