/**
 * Dynamic CSS Loader for MMQ Remote Module
 *
 * Enterprise-grade solution for loading MMQ styles that automatically
 * detects the correct CSS file URL from the manifest API.
 *
 * @example
 * ```tsx
 * import { loadMMQStyles } from '@sis-thesqd/mmq/integration'
 *
 * // In your app initialization
 * loadMMQStyles({ remoteUrl: 'https://mmq-modular.vercel.app' })
 * ```
 */

export interface LoadMMQStylesOptions {
  /** Base URL of the MMQ remote (without trailing slash) */
  remoteUrl?: string;
  /** Callback when CSS is loaded successfully */
  onLoad?: () => void;
  /** Callback when CSS loading fails */
  onError?: (error: Error) => void;
  /** Force reload even if already loaded */
  force?: boolean;
}

interface MMQManifest {
  version: string;
  cssUrl: string;
  remoteEntryUrl: string;
  timestamp: string;
}

const DEFAULT_REMOTE_URL = 'https://mmq-modular.vercel.app';
const CACHE_KEY = 'mmq-manifest-cache';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

let isLoaded = false;

/**
 * Load MMQ styles dynamically from the manifest API
 *
 * This function:
 * 1. Fetches the manifest to get the current CSS URL
 * 2. Caches the manifest for 1 hour
 * 3. Injects the CSS link into the document head
 * 4. Returns a promise that resolves when CSS is loaded
 */
export async function loadMMQStyles(
  options: LoadMMQStylesOptions = {}
): Promise<void> {
  const {
    remoteUrl = DEFAULT_REMOTE_URL,
    onLoad,
    onError,
    force = false,
  } = options;

  // Don't reload if already loaded (unless forced)
  if (isLoaded && !force) {
    onLoad?.();
    return Promise.resolve();
  }

  try {
    // Get manifest (with caching)
    const manifest = await fetchManifest(remoteUrl);

    // Inject CSS
    await injectCSS(manifest.cssUrl);

    isLoaded = true;
    onLoad?.();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

/**
 * Fetch the MMQ manifest with caching
 */
async function fetchManifest(remoteUrl: string): Promise<MMQManifest> {
  // Check cache first
  const cached = getCache();
  if (cached) {
    return cached;
  }

  // Fetch fresh manifest
  const manifestUrl = `${remoteUrl}/api/mmq-manifest`;
  const response = await fetch(manifestUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch MMQ manifest: ${response.status}`);
  }

  const manifest: MMQManifest = await response.json();

  // Cache it
  setCache(manifest);

  return manifest;
}

/**
 * Inject CSS link into document head
 */
function injectCSS(cssUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already injected
    const existingLink = document.querySelector(
      `link[href="${cssUrl}"]`
    ) as HTMLLinkElement;

    if (existingLink) {
      resolve();
      return;
    }

    // Create new link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    link.crossOrigin = 'anonymous';
    link.setAttribute('data-mmq-styles', '');

    // Handle load/error
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS from ${cssUrl}`));

    // Inject into head
    document.head.appendChild(link);
  });
}

/**
 * Get cached manifest if still valid
 */
function getCache(): MMQManifest | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { manifest, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Cache valid for 1 hour
    if (age < CACHE_DURATION) {
      return manifest;
    }

    // Cache expired
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

/**
 * Store manifest in cache
 */
function setCache(manifest: MMQManifest): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        manifest,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Ignore cache errors
  }
}

/**
 * Clear the manifest cache
 */
export function clearMMQCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
  isLoaded = false;
}

/**
 * Preload MMQ styles (call early in app initialization)
 */
export function preloadMMQStyles(options: LoadMMQStylesOptions = {}): void {
  if (typeof window === 'undefined') return;

  // Start loading as soon as possible (fire and forget)
  loadMMQStyles(options).catch(console.error);
}
