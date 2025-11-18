import { useCallback, useRef } from 'react';

/**
 * Configuration options for the polling hook
 */
export interface UsePollingOptions {
  /** Interval between polls in milliseconds */
  interval?: number;
  /** Maximum number of polls before stopping */
  maxPolls?: number;
  /** Callback to execute on each poll */
  onPoll: () => Promise<void> | void;
  /** Callback executed when polling completes */
  onComplete?: () => void;
  /** Callback executed on error during polling */
  onError?: (error: Error) => void;
}

/**
 * Custom hook for managing polling operations with configurable interval and max polls.
 * Provides methods to start and stop polling, with automatic cleanup.
 *
 * @param options - Polling configuration options
 * @returns Object with startPolling and stopPolling methods
 *
 * @example
 * ```tsx
 * const { startPolling, stopPolling } = usePolling({
 *   interval: 2000,
 *   maxPolls: 10,
 *   onPoll: async () => await fetchData(),
 *   onComplete: () => console.log('Polling finished')
 * });
 *
 * // Start polling after a mutation
 * await updateTask();
 * startPolling();
 * ```
 */
export function usePolling({
  interval = 2000,
  maxPolls = 10,
  onPoll,
  onComplete,
  onError,
}: UsePollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  /**
   * Stops the current polling operation
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  /**
   * Starts a new polling operation
   * Automatically stops any existing polling operation first
   */
  const startPolling = useCallback(() => {
    // Stop any existing polling
    stopPolling();

    // Reset poll count
    pollCountRef.current = 0;

    // Start new polling interval
    intervalRef.current = setInterval(async () => {
      pollCountRef.current++;

      try {
        await onPoll();
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }

      // Check if we've reached max polls
      if (pollCountRef.current >= maxPolls) {
        stopPolling();
        if (onComplete) {
          onComplete();
        }
      }
    }, interval);
  }, [interval, maxPolls, onPoll, onComplete, onError, stopPolling]);

  // Cleanup on unmount
  useCallback(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
  };
}
