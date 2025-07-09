/**
 * @fileoverview React hook for widget click management with batching and resilience
 * 
 * Provides click tracking functionality with intelligent batching, offline persistence,
 * and exponential backoff retry logic for the embeddable widget.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { ClickQueue, type ClickEvent, type QueueConfig } from '../utils/ClickQueue';
import type { WidgetApi } from '../services/widgetApi';

/**
 * Hook options for configuration
 */
export interface UseWidgetOptions {
  /** Widget API instance */
  api: WidgetApi;
  /** Survey ID for analytics tracking */
  surveyId: string;
  /** Queue configuration overrides */
  queueConfig?: Partial<QueueConfig>;
  /** Enable debugging logs */
  debug?: boolean;
}

/**
 * Hook return type
 */
export interface UseWidgetReturn {
  /** Track a click event (batched) */
  trackClick: (
    sessionId: string,
    questionId: string,
    offerId: string,
    buttonVariantId: string
  ) => Promise<void>;
  /** Send dwell event for analytics */
  sendDwellEvent: () => void;
  /** Get current queue status */
  getQueueStatus: () => {
    queueSize: number;
    isOnline: boolean;
    persistedCount: number;
  };
  /** Force flush the queue */
  flushQueue: () => Promise<void>;
  /** Network connection state */
  isOnline: boolean;
}

/**
 * Custom hook for widget click management with batching and resilience
 * 
 * This hook provides a drop-in replacement for direct API calls with
 * intelligent batching, offline persistence, and retry logic.
 */
export function useWidget(options: UseWidgetOptions): UseWidgetReturn {
  const { api, surveyId, queueConfig = {}, debug = false } = options;
  const queueRef = useRef<ClickQueue | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Analytics beacon state
  const [loadedEventSent, setLoadedEventSent] = useState(false);
  const [dwellEventSent, setDwellEventSent] = useState(false);
  const dwellStartTime = useRef<number>(Date.now());

  /**
   * Initialize the click queue
   */
  useEffect(() => {
    if (debug) {
      console.log('Initializing ClickQueue with config:', queueConfig);
    }

    queueRef.current = new ClickQueue(queueConfig, api);

    return () => {
      if (queueRef.current) {
        if (debug) {
          console.log('Cleaning up ClickQueue');
        }
        queueRef.current.destroy();
        queueRef.current = null;
      }
    };
  }, [api, queueConfig, debug]);

  /**
   * Set up network state monitoring
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (debug) {
        console.log('Network connection restored');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (debug) {
        console.log('Network connection lost');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [debug]);

  /**
   * Send analytics event using navigator.sendBeacon with fetch fallback
   */
  const sendAnalyticsEvent = useCallback(async (
    event: 'loaded' | 'dwell',
    dwellTimeMs?: number
  ): Promise<void> => {
    const payload = {
      surveyId,
      event,
      ...(dwellTimeMs !== undefined && { dwellTimeMs })
    };
    
    const data = JSON.stringify(payload);
    const url = `${api.baseURL}/widget/analytics`;
    
    if (debug) {
      console.log('Sending analytics event:', payload);
    }
    
    // PATTERN: Use sendBeacon with fetch fallback
    if (navigator.sendBeacon && data.length < 64000) {
      try {
        const success = navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
        if (success) {
          if (debug) {
            console.log('Analytics event sent via beacon');
          }
          return;
        }
      } catch (error) {
        if (debug) {
          console.warn('Beacon failed, falling back to fetch:', error);
        }
      }
    }
    
    // Fallback to fetch for larger payloads or beacon failure
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data
      });
      if (debug) {
        console.log('Analytics event sent via fetch');
      }
    } catch (error) {
      if (debug) {
        console.warn('Analytics beacon failed:', error);
      }
    }
  }, [api.baseURL, surveyId, debug]);

  /**
   * Send loaded event on widget mount (fire once)
   */
  useEffect(() => {
    if (!loadedEventSent) {
      sendAnalyticsEvent('loaded');
      setLoadedEventSent(true);
    }
  }, [sendAnalyticsEvent, loadedEventSent]);

  /**
   * Send dwell event (called on first CTA click or manual trigger)
   */
  const sendDwellEvent = useCallback(() => {
    if (!dwellEventSent) {
      const dwellTime = Date.now() - dwellStartTime.current;
      sendAnalyticsEvent('dwell', dwellTime);
      setDwellEventSent(true);
    }
  }, [sendAnalyticsEvent, dwellEventSent]);

  /**
   * Set up beforeunload listener for dwell event
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendDwellEvent();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sendDwellEvent]);

  /**
   * Track a click event using the batching queue
   */
  const trackClick = useCallback(async (
    sessionId: string,
    questionId: string,
    offerId: string,
    buttonVariantId: string
  ): Promise<void> => {
    if (!queueRef.current) {
      console.warn('ClickQueue not initialized, falling back to direct API call');
      try {
        await api.trackClick(sessionId, questionId, offerId, buttonVariantId);
      } catch (error) {
        console.warn('Direct API call failed:', error);
      }
      return;
    }

    const event: Omit<ClickEvent, 'id'> = {
      sessionId,
      questionId,
      offerId,
      buttonVariantId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    if (debug) {
      console.log('Enqueueing click event:', event);
    }

    queueRef.current.enqueue(event);
  }, [api, debug]);

  /**
   * Get current queue status
   */
  const getQueueStatus = useCallback(() => {
    if (!queueRef.current) {
      return {
        queueSize: 0,
        isOnline: navigator.onLine,
        persistedCount: 0
      };
    }

    return queueRef.current.getStatus();
  }, []);

  /**
   * Force flush the queue immediately
   */
  const flushQueue = useCallback(async (): Promise<void> => {
    if (!queueRef.current) {
      console.warn('ClickQueue not initialized, cannot flush');
      return;
    }

    if (debug) {
      console.log('Manually flushing queue');
    }

    // Access the private flushQueue method by calling it through the instance
    // This is a bit of a hack but necessary for testing and manual flushing
    try {
      await (queueRef.current as any).flushQueue();
    } catch (error) {
      console.warn('Failed to flush queue:', error);
    }
  }, [debug]);

  return {
    trackClick,
    sendDwellEvent,
    getQueueStatus,
    flushQueue,
    isOnline
  };
}

/**
 * Hook specifically for testing purposes
 * Provides access to the underlying ClickQueue instance
 */
export function useWidgetTesting(options: UseWidgetOptions): UseWidgetReturn & {
  getQueueInstance: () => ClickQueue | null;
} {
  const hookResult = useWidget(options);
  const queueRef = useRef<ClickQueue | null>(null);

  useEffect(() => {
    queueRef.current = new ClickQueue(options.queueConfig || {}, options.api);
    
    return () => {
      if (queueRef.current) {
        queueRef.current.destroy();
        queueRef.current = null;
      }
    };
  }, [options.api, options.queueConfig]);

  const getQueueInstance = useCallback((): ClickQueue | null => {
    return queueRef.current;
  }, []);

  return {
    ...hookResult,
    getQueueInstance
  };
}