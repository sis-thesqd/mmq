import type { Task } from '@/types/mmqTypes';
import { MMQ_ACTIVE_TASK_CONDITIONS } from '@/config/mmq.config';

/**
 * Counts the number of active tasks based on configured conditions
 * @param tasks - Array of tasks to count from
 * @returns The count of active tasks
 */
export function countActiveTasks(tasks: Task[]): number {
  if (!tasks || tasks.length === 0) {
    return 0;
  }

  return tasks.filter((task) => {
    // Primary condition: task must have active_status = true
    if (!task.active_status) {
      return false;
    }

    // Additional conditions from config
    if (MMQ_ACTIVE_TASK_CONDITIONS.excludeStatuses) {
      const excludedStatuses = MMQ_ACTIVE_TASK_CONDITIONS.excludeStatuses.map(s => s.toLowerCase());
      if (excludedStatuses.includes(task.status.toLowerCase())) {
        return false;
      }
    }

    return true;
  }).length;
}

