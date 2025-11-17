/**
 * MMQ Global Configuration
 * 
 * Centralized configuration for the MMQ component including API endpoints,
 * default values, and feature toggles.
 */

/**
 * Backend webhook endpoints
 * These are the actual backend URLs that the API routes forward to
 */
export const MMQ_API_ENDPOINTS = {
  /** Webhook endpoint for reordering queued tasks */
  reorder: 'https://sisx.thesqd.com/webhook/reorder-queued-Ad0rB3XjeZ8K7RG0',
  
  /** Webhook endpoint for play/pause task actions */
  playPause: 'https://sisx.thesqd.com/webhook/play-pause-ll5fJZEVSwWtaAqa',
} as const;

/**
 * Default configuration values
 */
export const MMQ_DEFAULTS = {
  /** Default title for the MMQ component */
  title: 'Manage My Queue',
  
  /** Whether to show the title by default */
  showTitle: true,
  
  /** Whether to show account override controls by default */
  showAccountOverride: false,
  
  /** Minimum visible tasks before scrolling */
  minVisibleTasks: 10,
  
  /** Maximum visible tasks before scrolling */
  maxVisibleTasks: 10,
} as const;

/**
 * Feature toggles
 */
export const MMQ_FEATURES = {
  /** Show countdown timers on task cards */
  showCountdownTimers: true,
  
  /** Enable drag and drop functionality */
  dragAndDrop: true,
  
  /** Enable play/pause functionality */
  playPause: true,
} as const;

/**
 * Complete MMQ configuration object
 */
export const MMQ_CONFIG = {
  endpoints: MMQ_API_ENDPOINTS,
  defaults: MMQ_DEFAULTS,
  features: MMQ_FEATURES,
} as const;

/**
 * Type definitions for configuration
 */
export type MMQConfig = typeof MMQ_CONFIG;
export type MMQEndpoints = typeof MMQ_API_ENDPOINTS;
export type MMQDefaults = typeof MMQ_DEFAULTS;
export type MMQFeatures = typeof MMQ_FEATURES;

