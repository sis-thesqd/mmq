import type { Task } from '@/types/mmqTypes';

/**
 * Checks if a task is currently active (not on hold)
 */
export function isTaskActive(task: Task): boolean {
  return task.active;
}

/**
 * Checks if a task is on hold
 */
export function isTaskOnHold(task: Task): boolean {
  return (task.status || '').toLowerCase() === 'on hold';
}

/**
 * Checks if a task is in active state and not on hold
 */
export function isTaskActiveAndWorking(task: Task): boolean {
  return task.active && !isTaskOnHold(task);
}

/**
 * Checks if a task is locked (cannot be moved)
 * A task is locked if it's active and has tracked time or is due within 24 hours
 */
export function isTaskLocked(task: Task, isWithin24HoursFunc: (dueDate: string) => boolean): boolean {
  return task.active && (task.total_time_tracked > 0 || isWithin24HoursFunc(task.latest_due_date));
}

/**
 * Filters tasks to only return active tasks
 */
export function filterActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.active);
}

/**
 * Filters tasks to only return hold tasks
 */
export function filterHoldTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.active);
}

/**
 * Filters tasks to count only those that are active and working (not on hold)
 */
export function countActiveWorkingTasks(tasks: Task[]): number {
  return tasks.filter(task => task.active && !isTaskOnHold(task)).length;
}

/**
 * Gets the status color for a task, with fallback for "on hold" status
 */
export function getTaskStatusColor(task: Task): string {
  const status = task.status || 'OPEN';
  if (status.toLowerCase() === 'on hold') {
    return '#868686';
  }
  return task.status_pill_color || '#87909e';
}

/**
 * Gets the current status of a task with fallback
 */
export function getTaskStatus(task: Task): string {
  return task.status || 'OPEN';
}

/**
 * Converts hex color to RGB string for use with rgba()
 */
export function hexToRgb(hex: string): string {
  // Remove any alpha value
  hex = hex.split(',')[0];
  hex = hex.replace('#', '');

  // Handle 3-character hex codes
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `${r},${g},${b}`;
}
