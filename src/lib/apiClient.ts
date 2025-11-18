import { createLogger } from './logger';

const logger = createLogger('APIClient');

/**
 * API request options
 */
export interface APIRequestOptions extends RequestInit {
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryDelay?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Enable request deduplication (default: true) */
  deduplicate?: boolean;
}

/**
 * API response wrapper
 */
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Pending request for deduplication
 */
interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
}

// Request deduplication cache
const pendingRequests = new Map<string, PendingRequest>();
const DEDUP_CACHE_TTL = 5000; // 5 seconds

/**
 * Generates a cache key for request deduplication
 */
function generateRequestKey(url: string, options?: APIRequestOptions): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * Cleans up expired pending requests from cache
 */
function cleanupPendingRequests(): void {
  const now = Date.now();
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > DEDUP_CACHE_TTL) {
      pendingRequests.delete(key);
    }
  }
}

/**
 * Creates an AbortController with timeout
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Implements exponential backoff delay
 */
function exponentialBackoff(attempt: number, baseDelay: number): Promise<void> {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
  return new Promise(resolve => setTimeout(resolve, delay + jitter));
}

/**
 * Checks if an error is retriable
 */
function isRetriableError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network errors
  }
  if (error instanceof Response) {
    // Retry on 5xx errors and 429 (rate limit)
    return error.status >= 500 || error.status === 429;
  }
  return false;
}

/**
 * Makes an HTTP request with retry logic, timeout, and deduplication
 *
 * @param url - The URL to fetch
 * @param options - Request options including retries, timeout, etc.
 * @returns Promise resolving to the Response
 *
 * @example
 * ```typescript
 * const response = await apiClient<TaskResponse>('/api/mmq-queue-data?accountNumber=123', {
 *   retries: 3,
 *   timeout: 10000,
 * });
 *
 * if (response.data) {
 *   console.log(response.data);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
async function makeRequest(
  url: string,
  options: APIRequestOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    deduplicate = true,
    ...fetchOptions
  } = options;

  // Request deduplication
  if (deduplicate && fetchOptions.method !== 'POST' && fetchOptions.method !== 'PATCH') {
    const requestKey = generateRequestKey(url, options);
    const pending = pendingRequests.get(requestKey);

    if (pending) {
      logger.debug('Returning deduplicated request', { url, requestKey });
      return pending.promise;
    }

    // Cleanup old requests periodically
    if (pendingRequests.size > 100) {
      cleanupPendingRequests();
    }
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create timeout controller
      const controller = createTimeoutController(timeout);
      const signal = fetchOptions.signal || controller.signal;

      // Make the request
      const requestPromise = fetch(url, {
        ...fetchOptions,
        signal,
      });

      // Store in dedup cache
      if (deduplicate && fetchOptions.method !== 'POST' && fetchOptions.method !== 'PATCH') {
        const requestKey = generateRequestKey(url, options);
        pendingRequests.set(requestKey, {
          promise: requestPromise,
          timestamp: Date.now(),
        });
      }

      const response = await requestPromise;

      // Remove from dedup cache
      if (deduplicate) {
        const requestKey = generateRequestKey(url, options);
        pendingRequests.delete(requestKey);
      }

      // Throw on HTTP errors for retry logic
      if (!response.ok && isRetriableError(response)) {
        throw response;
      }

      return response;
    } catch (error) {
      lastError = error;

      // Check if error is retriable
      if (!isRetriableError(error) || attempt === retries) {
        // Remove from dedup cache on final error
        if (deduplicate) {
          const requestKey = generateRequestKey(url, options);
          pendingRequests.delete(requestKey);
        }

        throw error;
      }

      // Log retry attempt
      logger.warn(`Request failed, retrying (${attempt}/${retries})`, {
        url,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      // Wait before retrying with exponential backoff
      await exponentialBackoff(attempt, retryDelay);
    }
  }

  throw lastError;
}

/**
 * API client with typed responses, error handling, and retry logic
 *
 * @param url - The URL to fetch
 * @param options - Request options
 * @returns Promise resolving to typed API response
 */
export async function apiClient<T = unknown>(
  url: string,
  options: APIRequestOptions = {}
): Promise<APIResponse<T>> {
  try {
    const response = await makeRequest(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data: data as T,
      status: response.status,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Request timeout', error, { url });
      return {
        error: 'Request timeout',
        status: 408,
      };
    }

    logger.error('API request failed', error, { url });
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(url: string, options?: Omit<APIRequestOptions, 'method'>) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, body?: unknown, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    }),

  patch: <T>(url: string, body?: unknown, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    }),

  put: <T>(url: string, body?: unknown, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string, options?: Omit<APIRequestOptions, 'method'>) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};
