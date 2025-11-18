import type { TaskResponse, Task } from './mmqTypes';

/**
 * API response for queue data endpoint
 */
export interface QueueDataResponse {
  data: TaskResponse | null;
  error?: string;
}

/**
 * API request for reordering tasks
 */
export interface ReorderTasksRequest {
  task_id: string;
  position: number;
  active: boolean;
  status: string;
}

/**
 * API response for reorder endpoint
 */
export interface ReorderTasksResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * API request for play/pause action
 */
export interface PlayPauseRequest {
  action: 'play' | 'pause';
  task_id: string;
  position: number;
  view_id: string;
}

/**
 * API response for play/pause endpoint
 */
export interface PlayPauseResponse {
  success: boolean;
  active: boolean;
  status: string;
  due_date?: string;
  badge_color?: string;
  error?: string;
}
