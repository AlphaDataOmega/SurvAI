/**
 * @fileoverview Click event batching queue with offline persistence and exponential backoff
 * 
 * Implements intelligent click event batching (10 events or 5-second intervals),
 * exponential backoff retry logic, and offline persistence using localStorage.
 */

import type { WidgetApi } from '../services/widgetApi';

/**
 * Click event structure for batching
 */
export interface ClickEvent {
  /** Unique ID for deduplication */
  id: string;
  /** Session ID */
  sessionId: string;
  /** Question ID */
  questionId: string;
  /** Offer ID */
  offerId: string;
  /** Button variant ID */
  buttonVariantId: string;
  /** Event timestamp */
  timestamp: number;
  /** User agent string */
  userAgent: string;
  /** Retry count for exponential backoff */
  retryCount?: number;
}

/**
 * Batch request structure for API
 */
export interface BatchRequest {
  /** Array of click events */
  events: ClickEvent[];
  /** Batch ID for tracking */
  batchId: string;
  /** Batch timestamp */
  timestamp: number;
}

/**
 * Queue configuration
 */
export interface QueueConfig {
  /** Maximum events before auto-flush */
  maxBatchSize: number;
  /** Maximum time before auto-flush (ms) */
  maxBatchDelay: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Initial retry delay (ms) */
  initialRetryDelay: number;
  /** Maximum retry delay (ms) */
  maxRetryDelay: number;
  /** localStorage key for persistence */
  storageKey: string;
}

/**
 * Default queue configuration
 */
const DEFAULT_CONFIG: QueueConfig = {
  maxBatchSize: 10,
  maxBatchDelay: 5000,
  maxRetries: 10,
  initialRetryDelay: 2000,
  maxRetryDelay: 30000,
  storageKey: 'srv_click_queue'
};

/**
 * Generate unique ID for events
 */
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(retryCount: number, config: QueueConfig): number {
  const exponentialDelay = config.initialRetryDelay * Math.pow(2, retryCount);
  return Math.min(exponentialDelay, config.maxRetryDelay);
}

/**
 * Click queue for batching and resilient delivery
 */
export class ClickQueue {
  private queue: ClickEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private config: QueueConfig;
  private api: WidgetApi;
  private cleanupCallbacks: (() => void)[] = [];

  constructor(config: Partial<QueueConfig> = {}, api: WidgetApi) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.api = api;
    
    this.setupNetworkListeners();
    this.loadPersistedEvents();
  }

  /**
   * Add click event to queue
   */
  enqueue(event: Omit<ClickEvent, 'id'>): void {
    const eventWithId: ClickEvent = {
      ...event,
      id: generateUniqueId(),
      retryCount: 0
    };

    this.queue.push(eventWithId);
    
    // Batch size trigger
    if (this.queue.length >= this.config.maxBatchSize) {
      this.flushQueue();
    } else {
      this.startBatchTimer();
    }
  }

  /**
   * Start or restart batch timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flushQueue();
    }, this.config.maxBatchDelay);
  }

  /**
   * Flush queue immediately
   */
  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const eventsToFlush = [...this.queue];
    this.queue = [];

    // If offline, persist events and wait for reconnection
    if (!this.isOnline) {
      this.persistEvents(eventsToFlush);
      return;
    }

    try {
      await this.sendBatch(eventsToFlush);
      this.clearPersistedEvents();
    } catch (error) {
      console.warn('Failed to send batch, persisting for retry:', error);
      this.persistEvents(eventsToFlush);
      this.retryWithBackoff(eventsToFlush);
    }
  }

  /**
   * Send batch to API
   */
  private async sendBatch(events: ClickEvent[]): Promise<void> {
    const batchRequest: BatchRequest = {
      events,
      batchId: generateUniqueId(),
      timestamp: Date.now()
    };

    // Use batch endpoint if available, otherwise fall back to individual requests
    if (this.api.trackClickBatch) {
      await this.api.trackClickBatch(batchRequest);
    } else {
      // Fallback to individual requests for compatibility
      await Promise.all(
        events.map(event => 
          this.api.trackClick(
            event.sessionId,
            event.questionId,
            event.offerId,
            event.buttonVariantId
          )
        )
      );
    }
  }

  /**
   * Retry with exponential backoff
   */
  private retryWithBackoff(events: ClickEvent[]): void {
    const maxRetryCount = Math.max(...events.map(e => e.retryCount || 0));
    
    if (maxRetryCount >= this.config.maxRetries) {
      console.warn('Max retries reached, dropping events:', events.length);
      return;
    }

    const delay = calculateBackoffDelay(maxRetryCount, this.config);
    
    setTimeout(async () => {
      // Increment retry count
      const retriedEvents = events.map(event => ({
        ...event,
        retryCount: (event.retryCount || 0) + 1
      }));

      // Only retry if we're online
      if (this.isOnline) {
        try {
          await this.sendBatch(retriedEvents);
          this.clearPersistedEvents();
        } catch (error) {
          console.warn(`Retry ${maxRetryCount + 1} failed:`, error);
          this.persistEvents(retriedEvents);
          this.retryWithBackoff(retriedEvents);
        }
      } else {
        // Stay offline, persist events
        this.persistEvents(retriedEvents);
      }
    }, delay);
  }

  /**
   * Persist events to localStorage
   */
  private persistEvents(events: ClickEvent[]): void {
    try {
      const existingEvents = this.getPersistedEvents();
      const allEvents = [...existingEvents, ...events];
      
      // Implement cleanup policy - keep only last 100 events to avoid quota issues
      const cleanedEvents = allEvents.slice(-100);
      
      localStorage.setItem(this.config.storageKey, JSON.stringify(cleanedEvents));
    } catch (error) {
      console.warn('Failed to persist events to localStorage:', error);
    }
  }

  /**
   * Load persisted events from localStorage
   */
  private loadPersistedEvents(): void {
    try {
      const events = this.getPersistedEvents();
      if (events.length > 0) {
        // Add persisted events to queue
        this.queue.push(...events);
        console.log(`Loaded ${events.length} persisted events from localStorage`);
        
        // Process persisted events if online
        if (this.isOnline) {
          setTimeout(() => this.processPersistedEvents(), 100);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted events:', error);
    }
  }

  /**
   * Get persisted events from localStorage
   */
  private getPersistedEvents(): ClickEvent[] {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to parse persisted events:', error);
      return [];
    }
  }

  /**
   * Clear persisted events from localStorage
   */
  private clearPersistedEvents(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (error) {
      console.warn('Failed to clear persisted events:', error);
    }
  }

  /**
   * Process persisted events on reconnection
   */
  private processPersistedEvents(): void {
    // Trigger flush if there are queued events
    if (this.queue.length > 0) {
      setTimeout(() => this.flushQueue(), 0);
    }
  }

  /**
   * Setup network state listeners
   */
  private setupNetworkListeners(): void {
    const handleOnline = () => {
      this.isOnline = true;
      console.log('Network connection restored, processing persisted events');
      this.processPersistedEvents();
    };

    const handleOffline = () => {
      this.isOnline = false;
      console.log('Network connection lost, events will be persisted');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Store cleanup callbacks
    this.cleanupCallbacks.push(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }

  /**
   * Get current queue status
   */
  getStatus(): {
    queueSize: number;
    isOnline: boolean;
    persistedCount: number;
  } {
    return {
      queueSize: this.queue.length,
      isOnline: this.isOnline,
      persistedCount: this.getPersistedEvents().length
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Flush any remaining events
    this.flushQueue();

    // Clean up event listeners
    this.cleanupCallbacks.forEach(cleanup => cleanup());
    this.cleanupCallbacks = [];
  }
}