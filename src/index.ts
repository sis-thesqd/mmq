/**
 * @sis-thesqd/mmq - Manage My Queue Component
 * 
 * A reusable React component for managing task queues with drag-and-drop functionality.
 * 
 * @packageDocumentation
 */

// Export the main MMQ component
export { MMQ } from './components/mmq/MMQ';
export type { MMQProps } from './components/mmq/MMQ';

// Export global configuration
export { 
  MMQ_CONFIG, 
  MMQ_API_ENDPOINTS, 
  MMQ_DEFAULTS, 
  MMQ_FEATURES 
} from './config/mmq.config';
export type { 
  MMQConfig, 
  MMQEndpoints, 
  MMQDefaults, 
  MMQFeatures 
} from './config/mmq.config';

// Export types
export type { Task, TaskResponse, TaskUpdateRequest, TaskUpdateResponse } from './types/mmqTypes';

