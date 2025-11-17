export interface Task {
  task_id: string;
  name: string;
  submitted_date_friendly: string;
  row_created: string;
  submitter: string | null;
  status: string;
  active: boolean;
  latest_due_date: string;
  total_time_tracked: number;
  changed_at: string;
  active_tasks_count?: number;
  status_pill_color?: string;
}

export interface TaskResponse {
  church: string;
  account: number;
  tasks_found?: boolean;
  tasks: Task[];
  cap: number;
  active_tasks: number;
}

interface TaskChange {
  from: {
    active: boolean;
    position: number;
    status: string;
  };
  to: {
    active: boolean;
    position: number;
    status: string;
  };
}

interface TaskChangeRequest {
  task_id: string;
  changes: TaskChange;
}

export interface TaskUpdateRequest {
  changes: TaskChangeRequest[];
  account: number;
}

export interface TaskUpdateResponse {
  tasks: Array<{
    task_id: string;
    active: boolean;
    position: number;
    status: string;
  }>;
}

