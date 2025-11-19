import { createClient } from '@supabase/supabase-js';
import { MMQ_API_ENDPOINTS } from '@/config/mmq.config';
import type { Task, TaskResponse } from '@/types/mmqTypes';

export interface MMQApiConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  dataEndpoint?: string;
  reorderEndpoint?: string;
  playPauseEndpoint?: string;
}

export class MMQApiService {
  private supabase;
  private config: MMQApiConfig;

  constructor(config: MMQApiConfig) {
    this.config = config;
    // Only create Supabase client if credentials are provided (for backwards compatibility)
    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }
  }

  /**
   * Fetch queue data for an account via API endpoint (secure)
   */
  async fetchQueueData(accountNumber: number): Promise<TaskResponse> {
    // Use API endpoint if available (secure - no exposed keys)
    if (this.config.dataEndpoint) {
      return this.fetchQueueDataViaAPI(accountNumber);
    }

    // Fallback to direct Supabase (less secure - exposes keys in browser)
    if (this.supabase) {
      return this.fetchQueueDataViaSupabase(accountNumber);
    }

    throw new Error('No data source configured. Provide either dataEndpoint or Supabase credentials.');
  }

  /**
   * Fetch queue data via API endpoint (recommended)
   */
  private async fetchQueueDataViaAPI(accountNumber: number): Promise<TaskResponse> {
    try {
      const url = `${this.config.dataEndpoint}?accountNumber=${accountNumber}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Fetch queue data via direct Supabase call (legacy)
   */
  private async fetchQueueDataViaSupabase(accountNumber: number): Promise<TaskResponse> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_combined_account_data', {
          p_account_number: accountNumber
        }, { get: true });

      if (error) {
        throw new Error(`Failed to fetch queue data: ${error.message}`);
      }

      if (!data || !data[0]?.combined_data) {
        throw new Error('No queue data found for account');
      }

      const combinedData = data[0].combined_data;
      const accountStats = combinedData.account_stats[0];

      if (!accountStats) {
        throw new Error('No account statistics found');
      }

      // Transform the tasks to match the expected Task interface
      const transformedTasks: Task[] = combinedData.tasks.map((task: any) => ({
        task_id: task.task_id,
        name: task.name,
        submitted_date_friendly: task.submitted_date_friendly,
        row_created: task.row_created,
        submitter: task.submitter,
        status: task.status,
        active: task.active,
        active_status: task.active_status,
        latest_due_date: task.latest_due_date || '',
        total_time_tracked: task.total_time_tracked,
        changed_at: task.changed_at,
        status_pill_color: task.status_pill_color,
        position: task.queue_num || 0,
      }));

      return {
        tasks: transformedTasks,
        church: accountStats.church_name,
        cap: accountStats.cap,
        active_tasks: accountStats.active_tasks,
        account: accountNumber,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Reorder tasks in the queue
   */
  async reorderTasks(tasks: Array<{
    task_id: string;
    position: number;
    active: boolean;
    status: string;
  }>): Promise<void> {
    const endpoint = this.config.reorderEndpoint || MMQ_API_ENDPOINTS.reorder;

    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasks)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reorder tasks: ${errorText}`);
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Play or pause a task
   */
  async playPauseTask(params: {
    action: 'play' | 'pause';
    task_id: string;
    position: number;
    view_id: string;
  }): Promise<{
    status: string;
    due_date: string | null;
    active: boolean;
    badge_color?: string;
  }> {
    const endpoint = this.config.playPauseEndpoint || MMQ_API_ENDPOINTS.playPause;

    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${params.action} task: ${errorText}`);
      }

      const data = await response.json();

      // Ensure badge_color is set for on hold status if not included in response
      if (data.status?.toLowerCase() === 'on hold' && !data.badge_color) {
        data.badge_color = '#ffcf00'; // Default yellow for paused tasks
      }

      return data;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}
