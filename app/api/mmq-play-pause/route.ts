import { NextRequest, NextResponse } from 'next/server';
import { MMQ_API_ENDPOINTS } from '@/config/mmq.config';

interface PlayPauseRequest {
  action: 'play' | 'pause';
  task_id: string;
  position: number;
  view_id: string;
}

interface PlayPauseResponse {
  status: string;
  due_date: string | null;
  active: boolean;
  badge_color?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    const body: PlayPauseRequest = await request.json();

    console.log('[mmq-play-pause] Received request:', {
      method: request.method,
      hasBody: !!body,
      action: body?.action,
      taskId: body?.task_id
    });

    const { action, task_id, position, view_id } = body;

    if (!action || !task_id || position === undefined || !view_id) {
      return NextResponse.json({
        error: 'Missing required parameters: action, task_id, position, view_id'
      }, { status: 400 });
    }

    if (action !== 'play' && action !== 'pause') {
      return NextResponse.json({
        error: 'Action must be either "play" or "pause"'
      }, { status: 400 });
    }

    console.log('[mmq-play-pause] Forwarding to external API:', {
      action,
      task_id,
      position,
      view_id
    });

    const targetUrl = MMQ_API_ENDPOINTS.playPause;
    
    const apiResponse = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        task_id,
        position,
        view_id
      })
    });

    console.log('[mmq-play-pause] External API response status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[mmq-play-pause] External API error:', errorText);
      return NextResponse.json({ 
        error: `External API returned status: ${apiResponse.status}`,
        details: errorText
      }, { status: apiResponse.status });
    }

    const data: PlayPauseResponse = await apiResponse.json();
    
    // Ensure badge_color is set for on hold status if not included in response
    if (data.status?.toLowerCase() === 'on hold' && !data.badge_color) {
      data.badge_color = '#ffcf00'; // Default yellow for paused tasks
    }
    
    console.log('[mmq-play-pause] Success:', {
      status: data.status,
      active: data.active,
      hasDueDate: !!data.due_date
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[mmq-play-pause] Proxy error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });

    return NextResponse.json({ 
      error: 'Failed to play/pause task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

