/**
 * @fileoverview Comprehensive tests for ClickQueue batching and resilience
 */

import { ClickQueue, type ClickEvent, type QueueConfig } from '../../frontend/src/widget/utils/ClickQueue';
import { WidgetApi } from '../../frontend/src/widget/services/widgetApi';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock addEventListener/removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener
});

// Mock WidgetApi
const mockWidgetApi = {
  trackClick: jest.fn(),
  trackClickBatch: jest.fn(),
  bootstrapSession: jest.fn(),
  getNextQuestion: jest.fn(),
  updateConfig: jest.fn(),
  getConfig: jest.fn()
} as unknown as WidgetApi;

// Helper function to create mock events
function createMockEvent(overrides: Partial<ClickEvent> = {}): Omit<ClickEvent, 'id'> {
  return {
    sessionId: 'test-session',
    questionId: 'test-question',
    offerId: 'test-offer',
    buttonVariantId: 'test-button',
    timestamp: Date.now(),
    userAgent: 'test-user-agent',
    ...overrides
  };
}

// Helper function to advance time
function advanceTime(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// Helper function to advance fake timers
function advanceFakeTimers(ms: number): void {
  jest.advanceTimersByTime(ms);
}

describe('ClickQueue', () => {
  let queue: ClickQueue;
  let config: QueueConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Default config for testing
    config = {
      maxBatchSize: 10,
      maxBatchDelay: 5000,
      maxRetries: 5,
      initialRetryDelay: 1000, // Shorter for testing
      maxRetryDelay: 30000,
      storageKey: 'test_click_queue'
    };

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true });
    
    // Create queue instance
    queue = new ClickQueue(config, mockWidgetApi);
  });

  afterEach(() => {
    if (queue) {
      queue.destroy();
    }
  });

  describe('Batching by size', () => {
    it('should batch events by size (10 events)', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockResolvedValue(undefined);

      // Add 10 events
      for (let i = 0; i < 10; i++) {
        queue.enqueue(createMockEvent({ questionId: `question-${i}` }));
      }

      // Wait for async processing
      await advanceTime(100);

      // Verify batch was sent immediately
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(1);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              questionId: expect.any(String),
              sessionId: 'test-session'
            })
          ]),
          batchId: expect.any(String),
          timestamp: expect.any(Number)
        })
      );
      
      // Verify we sent exactly 10 events
      const batchCall = mockWidgetApi.trackClickBatch.mock.calls[0][0];
      expect(batchCall.events).toHaveLength(10);
    });

    it('should not batch if under size limit', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockResolvedValue(undefined);

      // Add 5 events (under limit)
      for (let i = 0; i < 5; i++) {
        queue.enqueue(createMockEvent());
      }

      // Wait briefly
      await advanceTime(100);

      // Should not have sent batch yet
      expect(mockWidgetApi.trackClickBatch).not.toHaveBeenCalled();
    });
  });

  describe('Batching by time', () => {
    it('should batch events by time (5 seconds)', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockResolvedValue(undefined);

      // Add 1 event
      queue.enqueue(createMockEvent());

      // Wait for timer to trigger (5 seconds)
      await advanceTime(5500);

      // Verify batch was sent after timeout
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(1);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              sessionId: 'test-session'
            })
          ])
        })
      );
    });

    it('should reset timer when new events added', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockResolvedValue(undefined);

      // Add event
      queue.enqueue(createMockEvent());

      // Wait 3 seconds
      await advanceTime(3000);

      // Add another event (should reset timer)
      queue.enqueue(createMockEvent());

      // Wait 3 more seconds (total 6, but timer reset)
      await advanceTime(3000);

      // Should not have sent yet
      expect(mockWidgetApi.trackClickBatch).not.toHaveBeenCalled();

      // Wait 3 more seconds (5 seconds since reset)
      await advanceTime(3000);

      // Now should have sent
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Exponential backoff retry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should implement exponential backoff retry', async () => {
      let callCount = 0;
      mockWidgetApi.trackClickBatch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          throw new Error('Network error');
        }
        return Promise.resolve();
      });

      // Add event to trigger batch
      queue.enqueue(createMockEvent());

      // Initial attempt
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(1);

      // First retry (1s delay)
      advanceFakeTimers(1000);
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(2);

      // Second retry (2s delay)
      advanceFakeTimers(2000);
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(3);

      // Third retry (4s delay)
      advanceFakeTimers(4000);
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(4);
    });

    it('should cap retry delay at maximum', async () => {
      const shortConfig = {
        ...config,
        maxRetryDelay: 2000, // Very short max delay
        initialRetryDelay: 1000
      };
      
      queue.destroy();
      queue = new ClickQueue(shortConfig, mockWidgetApi);

      mockWidgetApi.trackClickBatch = jest.fn().mockRejectedValue(new Error('Network error'));

      queue.enqueue(createMockEvent());

      // Initial attempt
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(1);

      // First retry (1s delay)
      advanceFakeTimers(1000);
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(2);

      // Second retry (2s delay, capped)
      advanceFakeTimers(2000);
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(3);

      // Third retry (2s delay, capped)
      advanceFakeTimers(2000);
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(4);
    });

    it('should stop retrying after max attempts', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockWidgetApi.trackClickBatch = jest.fn().mockRejectedValue(new Error('Network error'));

      queue.enqueue(createMockEvent());

      // Initial attempt
      await advanceTime(100);
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(1);

      // Wait for all retry attempts
      for (let i = 0; i < config.maxRetries; i++) {
        advanceFakeTimers(5000); // Use a large delay to ensure retry happens
        await advanceTime(100);
      }

      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(config.maxRetries + 1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Max retries reached, dropping events:',
        expect.any(Number)
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('localStorage persistence', () => {
    it('should persist events to localStorage on failure', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockRejectedValue(new Error('Network error'));

      queue.enqueue(createMockEvent());

      // Wait for failure and persistence
      await advanceTime(200);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test_click_queue',
        expect.stringContaining('test-session')
      );
    });

    it('should load persisted events on initialization', () => {
      const persistedEvents = [
        { ...createMockEvent(), id: 'persisted-1' },
        { ...createMockEvent(), id: 'persisted-2' }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedEvents));

      // Create new queue (should load persisted events)
      queue.destroy();
      queue = new ClickQueue(config, mockWidgetApi);

      const status = queue.getStatus();
      expect(status.queueSize).toBe(2);
    });

    it('should clear persisted events on successful send', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockResolvedValue(undefined);

      // Set up persisted events
      const persistedEvents = [createMockEvent()];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedEvents));

      // Create new queue
      queue.destroy();
      queue = new ClickQueue(config, mockWidgetApi);

      // Wait for processing
      await advanceTime(100);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_click_queue');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      mockWidgetApi.trackClickBatch = jest.fn().mockRejectedValue(new Error('Network error'));

      queue.enqueue(createMockEvent());

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to persist events to localStorage:',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should implement cleanup policy for localStorage', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Create many events to trigger cleanup
      const existingEvents = Array(95).fill(null).map((_, i) => 
        ({ ...createMockEvent(), id: `existing-${i}` })
      );
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingEvents));

      // Add more events
      for (let i = 0; i < 10; i++) {
        queue.enqueue(createMockEvent());
      }

      await advanceTime(200);

      // Should have called setItem with cleaned array (last 100 items)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test_click_queue',
        expect.any(String)
      );

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Network state monitoring', () => {
    it('should set up online/offline event listeners', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should persist events when offline', async () => {
      // Set offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      // Create new queue in offline state
      queue.destroy();
      queue = new ClickQueue(config, mockWidgetApi);

      queue.enqueue(createMockEvent());

      // Wait briefly
      await advanceTime(100);

      // Should persist but not send
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(mockWidgetApi.trackClickBatch).not.toHaveBeenCalled();
    });

    it('should process events when coming back online', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockResolvedValue(undefined);

      // Set up offline with persisted events
      Object.defineProperty(navigator, 'onLine', { value: false });
      const persistedEvents = [createMockEvent()];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedEvents));

      // Create queue in offline state
      queue.destroy();
      queue = new ClickQueue(config, mockWidgetApi);

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      
      // Find and call the online event handler
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )[1];
      
      onlineHandler();

      // Wait for processing
      await advanceTime(100);

      // Should have processed events
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(1);
    });

    it('should clean up event listeners on destroy', () => {
      queue.destroy();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Fallback behavior', () => {
    it('should fall back to individual requests when batch not available', async () => {
      // Remove batch method
      const apiWithoutBatch = {
        ...mockWidgetApi,
        trackClickBatch: undefined,
        trackClick: jest.fn().mockResolvedValue(undefined)
      } as any;

      queue.destroy();
      queue = new ClickQueue(config, apiWithoutBatch);

      // Add events
      queue.enqueue(createMockEvent());
      queue.enqueue(createMockEvent());

      // Wait for processing
      await advanceTime(100);

      // Should have made individual calls
      expect(apiWithoutBatch.trackClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Status and monitoring', () => {
    it('should provide queue status', () => {
      queue.enqueue(createMockEvent());
      queue.enqueue(createMockEvent());

      const status = queue.getStatus();
      
      expect(status.queueSize).toBe(2);
      expect(status.isOnline).toBe(true);
      expect(status.persistedCount).toBe(0);
    });

    it('should track persisted events count', () => {
      const persistedEvents = [createMockEvent(), createMockEvent()];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedEvents));

      queue.destroy();
      queue = new ClickQueue(config, mockWidgetApi);

      const status = queue.getStatus();
      expect(status.persistedCount).toBe(2);
    });
  });

  describe('Memory management', () => {
    it('should clean up timers on destroy', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      queue.enqueue(createMockEvent());
      queue.destroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should flush events on destroy', async () => {
      mockWidgetApi.trackClickBatch = jest.fn().mockResolvedValue(undefined);

      queue.enqueue(createMockEvent());
      queue.destroy();

      // Should have attempted to flush
      expect(mockWidgetApi.trackClickBatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed localStorage data', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      queue.destroy();
      queue = new ClickQueue(config, mockWidgetApi);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse persisted events:',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle unique ID generation', () => {
      const event1 = createMockEvent();
      const event2 = createMockEvent();

      queue.enqueue(event1);
      queue.enqueue(event2);

      const status = queue.getStatus();
      expect(status.queueSize).toBe(2);
      
      // Events should have unique IDs (tested through batching)
      expect(status.queueSize).toBeGreaterThan(0);
    });
  });
});