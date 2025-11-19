import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:mmq-queue-data');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const requestId = req.headers['x-vercel-id'] as string || 'no-request-id';

  try {
    logger.info('Request received', {
      requestId,
      method: req.method,
      environment: process.env.VERCEL_ENV || 'development'
    });

    const { accountNumber } = req.query;

    if (!accountNumber || typeof accountNumber !== 'string') {
      return res.status(400).json({
        error: 'Bad request: accountNumber query parameter is required',
        data: null
      });
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_READ_ONLY || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      logger.error('Configuration error: Missing Supabase credentials', undefined, {
        requestId
      });

      return res.status(500).json({
        error: 'Server configuration error: Missing Supabase credentials',
        data: null
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    const queryStartTime = Date.now();

    // Call the RPC function
    logger.debug('Calling RPC function get_combined_account_data', { accountNumber });
    const { data, error } = await supabase
      .rpc('get_combined_account_data', {
        p_account_number: parseInt(accountNumber, 10)
      }, { get: true });

    const queryDuration = Date.now() - queryStartTime;
    const totalDuration = Date.now() - startTime;

    if (error) {
      logger.error('RPC error', error, {
        requestId,
        accountNumber,
        queryDuration,
        totalDuration,
      });

      return res.status(500).json({
        error: 'Failed to fetch queue data',
        details: error.message,
        data: null
      });
    }

    if (!data || !data[0]?.combined_data) {
      console.log('[mmq-queue-data] No data found:', {
        requestId,
        accountNumber,
        hasData: !!data,
        hasCombinedData: !!data?.[0]?.combined_data,
        queryDuration: `${queryDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        timestamp: new Date().toISOString()
      });

      return res.status(404).json({
        error: 'No queue data found for account',
        data: null
      });
    }

    const combinedData = data[0].combined_data;
    const accountStats = combinedData.account_stats[0];

    if (!accountStats) {
      console.error('[mmq-queue-data] No account statistics found:', {
        requestId,
        accountNumber,
        queryDuration: `${queryDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        timestamp: new Date().toISOString()
      });

      return res.status(404).json({
        error: 'No account statistics found',
        data: null
      });
    }

    // Transform the tasks to match the expected Task interface
    const transformedTasks = combinedData.tasks.map((task: any) => ({
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

    const result = {
      tasks: transformedTasks,
      church: accountStats.church_name,
      cap: accountStats.cap,
      active_tasks: accountStats.active_tasks,
      account: parseInt(accountNumber, 10),
    };

    console.log('[mmq-queue-data] Success:', {
      requestId,
      accountNumber,
      tasksCount: transformedTasks.length,
      churchName: accountStats.church_name,
      cap: accountStats.cap,
      activeTasks: accountStats.active_tasks,
      queryDuration: `${queryDuration}ms`,
      totalDuration: `${totalDuration}ms`,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      data: result,
      error: null
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    const errorLog = {
      requestId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error),
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'development',
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    };

    console.error('[mmq-queue-data] Fatal error:', errorLog);

    return res.status(500).json({
      error: 'Failed to fetch queue data',
      details: errorMessage,
      data: null
    });
  }
}
