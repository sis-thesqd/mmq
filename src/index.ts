/**
 * @sis-thesqd/mmq - Manage My Queue Component
 *
 * A professional, enterprise-grade React component library for managing task queues
 * with intuitive drag-and-drop functionality, real-time updates, and active task capacity management.
 *
 * @packageDocumentation
 *
 * @example Basic Usage
 * ```tsx
 * import { MMQ } from '@sis-thesqd/mmq';
 * import '@sis-thesqd/mmq/styles';
 *
 * function App() {
 *   return (
 *     <MMQ
 *       accountNumber={12345}
 *       showCountdownTimers={true}
 *       showAccountOverride={true}
 *     />
 *   );
 * }
 * ```
 *
 * @example Advanced Usage with Callbacks
 * ```tsx
 * import { MMQ, type MMQProps } from '@sis-thesqd/mmq';
 *
 * function App() {
 *   const handleError = (error: Error | string) => {
 *     console.error('MMQ Error:', error);
 *     // Send to error tracking service
 *   };
 *
 *   const handleDataLoaded = (data: TaskResponse) => {
 *     console.log('Tasks loaded:', data.tasks.length);
 *   };
 *
 *   return (
 *     <MMQ
 *       accountNumber={12345}
 *       showAccountOverride={true}
 *       onError={handleError}
 *       onDataLoaded={handleDataLoaded}
 *       onChangesApplied={() => console.log('Changes applied!')}
 *     />
 *   );
 * }
 * ```
 */

// Export the main MMQ component and its props
export { MMQ } from './components/mmq/MMQ';
export type { MMQProps } from './components/mmq/MMQ';

// Export global configuration for advanced customization
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

// Export TypeScript types for type-safe integration
export type { Task, TaskResponse, TaskUpdateRequest, TaskUpdateResponse } from './types/mmqTypes';

