import { useEffect, useRef, useCallback, useMemo } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Performance');

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring (default: false in production) */
  enabled?: boolean;
  /** Callback for handling metrics */
  onMetric?: (metric: PerformanceMetric) => void;
  /** Warning threshold in ms */
  warningThreshold?: number;
}

const isDevelopment = process.env.NODE_ENV === 'development';

let globalConfig: PerformanceConfig = {
  enabled: isDevelopment,
  warningThreshold: 1000, // 1 second
};

/**
 * Configure global performance monitoring
 */
export function configurePerformanceMonitoring(config: PerformanceConfig): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Hook for monitoring component render performance
 *
 * @param componentName - Name of the component being monitored
 * @param config - Optional performance configuration
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent');
 *   // ... component logic
 * }
 * ```
 */
export function usePerformanceMonitor(
  componentName: string,
  config: PerformanceConfig = {}
): void {
  const renderCount = useRef(0);
  const mountTime = useRef(0);
  const lastRenderTime = useRef(0);

  const mergedConfig = { ...globalConfig, ...config };

  useEffect(() => {
    if (!mergedConfig.enabled) return;

    mountTime.current = performance.now();

    return () => {
      const unmountTime = performance.now();
      const lifetime = unmountTime - mountTime.current;

      logger.debug(`Component unmounted: ${componentName}`, {
        lifetime: `${lifetime.toFixed(2)}ms`,
        renderCount: renderCount.current,
      });
    };
  }, [componentName, mergedConfig.enabled]);

  useEffect(() => {
    if (!mergedConfig.enabled) return;

    const renderTime = performance.now();
    const renderDuration = lastRenderTime.current
      ? renderTime - lastRenderTime.current
      : 0;

    renderCount.current += 1;
    lastRenderTime.current = renderTime;

    if (renderDuration > 0) {
      const metric: PerformanceMetric = {
        name: `${componentName}:render`,
        duration: renderDuration,
        timestamp: Date.now(),
        metadata: {
          renderCount: renderCount.current,
        },
      };

      if (mergedConfig.onMetric) {
        mergedConfig.onMetric(metric);
      }

      if (
        mergedConfig.warningThreshold &&
        renderDuration > mergedConfig.warningThreshold
      ) {
        logger.warn(`Slow render detected: ${componentName}`, {
          duration: `${renderDuration.toFixed(2)}ms`,
          threshold: `${mergedConfig.warningThreshold}ms`,
          renderCount: renderCount.current,
        });
      }
    }
  });
}

/**
 * Hook for measuring operation duration
 *
 * @param config - Optional performance configuration
 * @returns Object with startMeasure and endMeasure functions
 *
 * @example
 * ```tsx
 * const { startMeasure, endMeasure } = useOperationTimer();
 *
 * const fetchData = async () => {
 *   startMeasure('fetchData');
 *   await api.get('/data');
 *   endMeasure('fetchData', { accountId: 123 });
 * };
 * ```
 */
export function useOperationTimer(config: PerformanceConfig = {}) {
  const measurements = useRef<Map<string, number>>(new Map());
  const mergedConfig = useMemo(() => ({ ...globalConfig, ...config }), [config]);

  const startMeasure = useCallback(
    (operationName: string) => {
      if (!mergedConfig.enabled) return;
      measurements.current.set(operationName, performance.now());
    },
    [mergedConfig.enabled]
  );

  const endMeasure = useCallback(
    (operationName: string, metadata?: Record<string, unknown>) => {
      if (!mergedConfig.enabled) return;

      const startTime = measurements.current.get(operationName);
      if (!startTime) {
        logger.warn(`No start time found for operation: ${operationName}`);
        return;
      }

      const duration = performance.now() - startTime;
      measurements.current.delete(operationName);

      const metric: PerformanceMetric = {
        name: operationName,
        duration,
        timestamp: Date.now(),
        metadata,
      };

      if (mergedConfig.onMetric) {
        mergedConfig.onMetric(metric);
      }

      logger.debug(`Operation completed: ${operationName}`, {
        duration: `${duration.toFixed(2)}ms`,
        ...metadata,
      });

      if (
        mergedConfig.warningThreshold &&
        duration > mergedConfig.warningThreshold
      ) {
        logger.warn(`Slow operation detected: ${operationName}`, {
          duration: `${duration.toFixed(2)}ms`,
          threshold: `${mergedConfig.warningThreshold}ms`,
          ...metadata,
        });
      }
    },
    [mergedConfig]
  );

  return { startMeasure, endMeasure };
}

/**
 * Hook for measuring async operation duration with automatic timing
 *
 * @param config - Optional performance configuration
 * @returns Function that wraps an async operation with timing
 *
 * @example
 * ```tsx
 * const measureAsync = useAsyncTimer();
 *
 * const fetchData = measureAsync('fetchData', async () => {
 *   return await api.get('/data');
 * });
 * ```
 */
export function useAsyncTimer(config: PerformanceConfig = {}) {
  const { startMeasure, endMeasure } = useOperationTimer(config);

  return useCallback(
    <T,>(
      operationName: string,
      operation: () => Promise<T>,
      metadata?: Record<string, unknown>
    ): Promise<T> => {
      startMeasure(operationName);
      return operation()
        .then((result) => {
          endMeasure(operationName, { ...metadata, success: true });
          return result;
        })
        .catch((error) => {
          endMeasure(operationName, { ...metadata, success: false, error: String(error) });
          throw error;
        });
    },
    [startMeasure, endMeasure]
  );
}

/**
 * Utility function to measure synchronous operations
 */
export function measureSync<T>(
  operationName: string,
  operation: () => T,
  config: PerformanceConfig = {}
): T {
  const mergedConfig = { ...globalConfig, ...config };

  if (!mergedConfig.enabled) {
    return operation();
  }

  const startTime = performance.now();
  const result = operation();
  const duration = performance.now() - startTime;

  const metric: PerformanceMetric = {
    name: operationName,
    duration,
    timestamp: Date.now(),
  };

  if (mergedConfig.onMetric) {
    mergedConfig.onMetric(metric);
  }

  logger.debug(`Sync operation: ${operationName}`, {
    duration: `${duration.toFixed(2)}ms`,
  });

  return result;
}
