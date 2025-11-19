import type { NextApiRequest, NextApiResponse } from 'next';
import { MMQ_API_ENDPOINTS } from '@/config/mmq.config';

interface ReorderTaskItem {
  task_id: string;
  position: number;
  active: boolean;
  status: string;
}

interface ReorderResponse {
  tasks: ReorderTaskItem[];
  message?: string;
}

type ReorderApiResponse = ReorderResponse | ReorderTaskItem[];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tasks = req.body;

    console.log('[mmq-reorder] Received request:', {
      method: req.method,
      hasBody: !!tasks,
      bodyLength: Array.isArray(tasks) ? tasks.length : 0
    });

    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        error: 'Request body should be an array of task objects'
      });
    }

    if (tasks.length === 0) {
      return res.status(400).json({
        error: 'No tasks provided for reordering'
      });
    }

    // Validate each task object
    for (const task of tasks) {
      if (!task.task_id || task.position === undefined) {
        return res.status(400).json({
          error: 'Each task must have task_id and position properties'
        });
      }
    }

    console.log('[mmq-reorder] Forwarding tasks to external API:', tasks.length);

    const targetUrl = MMQ_API_ENDPOINTS.reorder;

    const apiResponse = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tasks)
    });

    console.log('[mmq-reorder] External API response status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[mmq-reorder] External API error:', errorText);
      return res.status(apiResponse.status).json({
        error: `External API returned status: ${apiResponse.status}`,
        details: errorText
      });
    }

    const data: ReorderApiResponse = await apiResponse.json();

    // Handle both response formats: array directly or object with tasks property
    const normalizedResponse: ReorderResponse = Array.isArray(data)
      ? { tasks: data }
      : data;

    console.log('[mmq-reorder] Success:', {
      tasksCount: normalizedResponse.tasks?.length || 0
    });

    return res.status(200).json(normalizedResponse);
  } catch (error) {
    console.error('[mmq-reorder] Proxy error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });

    return res.status(500).json({
      error: 'Failed to reorder tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
