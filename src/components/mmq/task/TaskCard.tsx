import { memo, useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ExternalLink,
  Play,
  Pause,
  Power,
} from 'lucide-react';
import type { Task } from '@/types/mmqTypes';
import { MIN_VISIBLE_TASKS } from '@/services/mmq';
import { formatStatusTimestamp } from '@/services/mmq';
import { LoadingSpinner } from '../layout/LoadingSpinner';
import { SuccessToast } from '../modals/SuccessToast';
import { WarningToast } from '../modals/WarningToast';
import { useTimer } from '../layout/TimerContext';
import { AnimatedContent } from '../layout/AnimatedContent';
import { cn } from '@/lib/utils';

export interface TaskCardProps {
  task: Task;
  originalTask?: Task;
  isDragging?: boolean;
  isFirstItem?: boolean;
  showTooltips?: boolean;
  isOnlyItem?: boolean;
  position: number;
  onStatusUpdate?: (taskId: string, status: string, active: boolean) => void;
  onRefresh?: () => Promise<void>;
  cap?: number;
  tasks?: Task[];
  showTimer?: boolean;
  accountNumber?: number;
  showCountdownTimers?: boolean;
}

const isWithin24Hours = (dueDate: string) => {
  const due = new Date(dueDate);
  due.setDate(due.getDate() + 1);
  const now = new Date();
  const centralTime = 'America/Chicago';

  const dueInCentral = new Date(
    due.toLocaleString('en-US', { timeZone: centralTime })
  );
  const nowInCentral = new Date(
    now.toLocaleString('en-US', { timeZone: centralTime })
  );

  const diffHours =
    (dueInCentral.getTime() - nowInCentral.getTime()) / (1000 * 60 * 60);
  return diffHours <= 24;
};const isPastDue = (dueDate: string) => {
  const due = new Date(dueDate);
  due.setDate(due.getDate() + 1);
  const now = new Date();
  return due < now;
};

const formatDueDate = (dueDate: string) => {
  const due = new Date(dueDate);
  due.setDate(due.getDate() + 1);
  const now = new Date();
  const centralTime = 'America/Chicago';

  const dueInCentral = new Date(
    due.toLocaleString('en-US', { timeZone: centralTime })
  );
  const nowInCentral = new Date(
    now.toLocaleString('en-US', { timeZone: centralTime })
  );

  const diffDays = Math.round(
    (dueInCentral.getTime() - nowInCentral.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 14) return `${diffDays} days from now`;
  if (diffDays < -1 && diffDays >= -2) return `${Math.abs(diffDays)} days ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: centralTime,
  }).format(due);
};

const truncateText = (text: string, isSmallScreen: boolean) => {
  if (text.length > (isSmallScreen ? 28 : 60)) {
    return `${text.slice(0, isSmallScreen ? 25 : 57)}...`;
  }
  return text;
};const getTooltipMessage = (task: Task) => {
  if (task.active && task.total_time_tracked > 0) {
    return "Oops! Can't move this one, we're already working on it";
  }
  if (task.active && isPastDue(task.latest_due_date)) {
    return "Oops! This one's almost ready, it's now locked in";
  }
  if (task.active && isWithin24Hours(task.latest_due_date)) {
    return "Oops! Can't move projects due within 24 hours";
  }
  return '';
};

export const TaskCard = memo(function TaskCard({
  task,
  originalTask,
  isDragging,
  isFirstItem = false,
  isOnlyItem = false,
  showTooltips = true,
  position,
  cap,
  tasks = [],
  onStatusUpdate,
  onRefresh,
  showTimer = false,
  accountNumber,
  showCountdownTimers = false,
}: TaskCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [showPlayDisabledTooltip, setShowPlayDisabledTooltip] = useState(false);
  const [playDisabledTooltipPosition, setPlayDisabledTooltipPosition] =
    useState<{ top: number; left: number } | null>(null);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [showWarningToast, setShowWarningToast] = useState(false);
  const [statusTooltipPosition, setStatusTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isPlayPauseLoading, setIsPlayPauseLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(
    task.status || 'OPEN'
  );
  const [currentStatusColor, setCurrentStatusColor] = useState<string>(
    task.status_pill_color || '#87909e'
  );
  const [lastUpdated, setLastUpdated] = useState<string>(task.changed_at);
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [nameTooltipPosition, setNameTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isActive, setIsActive] = useState<boolean>(task.active);
  const [showSuccessToast, setShowSuccessToast] = useState(false);  const cardRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  
  const isLocked =
    task.active &&
    originalTask?.active &&
    (task.total_time_tracked > 0 || isWithin24Hours(task.latest_due_date));
    
  const activeTaskCount = tasks.filter(
    (t) => t.active && (t.status || '').toLowerCase() !== 'on hold'
  ).length;
  
  const isPlayDisabled =
    task.active &&
    (currentStatus || '').toLowerCase() === 'on hold' &&
    activeTaskCount >= (cap || MIN_VISIBLE_TASKS);

  const { countdown, isRefreshing } = useTimer();

  useEffect(() => {
    const status = task.status || 'OPEN';
    setCurrentStatus(status);
    setCurrentStatusColor(status.toLowerCase() === 'on hold' ? '#868686' : (task.status_pill_color || '#87909e'));
    setIsActive(task.active);
  }, [task.status]);

  const handlePlayPause = () => {
    if (isPlayPauseLoading) return;
    if (isPlayDisabled) {
      console.log('Play disabled, showing warning toast');
      setShowWarningToast(true);
      return;
    }

    const action =
      (currentStatus || '').toLowerCase() === 'on hold' ? 'play' : 'pause';
    handlePlayPauseConfirm(action);
  };  const handlePlayPauseConfirm = async (action: string) => {
    setIsPlayPauseLoading(true);
    const onHoldColor = '#868686';

    try {
      // Use account number as view_id
      const viewId = accountNumber.toString();
      
      const apiResponse = await fetch('/api/mmq-play-pause', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action as 'play' | 'pause',
          task_id: task.task_id,
          position,
          view_id: viewId
        })
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Play/pause API returned status ${apiResponse.status}: ${errorText}`);
      }

      const response = await apiResponse.json();

      // Update only the local status and visual state, don't call onStatusUpdate
      // which would immediately move the task between groups
      const status = response.status || 'ON HOLD';
      setCurrentStatus(status);
      
      // Use badge_color from response if available, otherwise fall back to status-based logic
      if (response.badge_color) {
        setCurrentStatusColor(response.badge_color);
      } else if (status.toLowerCase() === 'on hold') {
        setCurrentStatusColor(onHoldColor);
      }
      
      if (response.due_date) {
        task.latest_due_date = response.due_date;
      }
      setLastUpdated(new Date().toISOString());
      
      // Show success toast for pause actions
      if ((currentStatus || '').toLowerCase() !== 'on hold') {
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      }

      // Poll mmq-queue-data every 2 seconds for 20 seconds after play/pause
      if (onRefresh) {
        console.log('[TaskCard] Starting polling after play/pause response');
        let pollCount = 0;
        const maxPolls = 10; // 20 seconds / 2 seconds
        const pollInterval = setInterval(async () => {
          pollCount++;
          console.log(`[TaskCard] Polling queue data (${pollCount}/${maxPolls})`);
          
          // Call the refresh callback to update MMQ's state
          try {
            await onRefresh();
          } catch (error) {
            console.error('[TaskCard] Error polling queue data:', error);
          }
          
          if (pollCount >= maxPolls) {
            console.log('[TaskCard] Polling complete');
            clearInterval(pollInterval);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsPlayPauseLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1500);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.task_id,
    data: task,
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hexToRgb = (hex: string) => {
    hex = hex.split(',')[0];
    hex = hex.replace('#', '');

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
  };

  const statusRGB = hexToRgb(currentStatusColor);
  const statusStyle = {
    backgroundColor: `rgba(${statusRGB}, 0.1)`,
    color: `rgb(${statusRGB})`,
  };  return (
    <div className="relative group">
      <div
        ref={(node) => {
          setNodeRef(node);
          if (cardRef) cardRef.current = node;
        }}
        style={style}
        className={cn(
          'rounded-lg shadow-sm border transition-all duration-150 relative bg-card',
          !task.active &&
            (isDragging || isSortableDragging) &&
            'opacity-50 scale-105 shadow-xl rotate-1',
          !task.active &&
            !isDragging &&
            !isSortableDragging &&
            'hover:shadow-md hover:-translate-y-0.5'
        )}
      >
        <div className="flex">
          {!task.active && (
            <div
              className={cn(
                "flex items-center justify-center",
                isOnlyItem ? "w-[21px]" : "w-[42px]",
                "py-3",
                !isOnlyItem && "cursor-grab active:cursor-grabbing"
              )}
              {...(!isOnlyItem ? { ...attributes, ...listeners } : {})}
            >
              {!isOnlyItem && (
                <GripVertical
                  className="w-3.5 h-3.5 text-muted-foreground"
                />
              )}
            </div>
          )}
          {task.active && (
            <div className="w-[42px] py-3 flex items-center justify-center cursor-pointer">
              <button
                ref={playButtonRef}
                disabled={isPlayPauseLoading || isPlayDisabled}
                onClick={handlePlayPause}
                className={cn(
                  "p-1 rounded-full transition-colors duration-150 hover:bg-accent",
                  isPlayDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {isPlayPauseLoading ? (
                  <LoadingSpinner size={14} className="text-muted-foreground" />
                ) : (currentStatus || '').toLowerCase() === 'on hold' ? (
                  <Play className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
            </div>
          )}          <div className="flex-1 py-3 pr-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center px-1.5 py-0.45 text-[12px] font-medium bg-primary/20 text-primary rounded">
                    {position}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      ref={nameRef}
                      className="font-medium truncate transition-colors duration-150 text-md text-foreground"
                      style={{ maxWidth: '500px' }}
                    >
                      {truncateText(task.name, isSmallScreen)}
                    </h3>
                    {showCountdownTimers &&
                      showTimer &&
                      (countdown || isRefreshing) && (
                        <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 px-1.5 py-0.5 rounded text-xs font-medium">
                          <Power className="w-3 h-3" />
                          <span>
                            {isRefreshing
                              ? 'Refreshing...'
                              : `Active in: ${countdown}`}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                <a
                  href={`https://app.clickup.com/t/${task.task_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-accent transition-colors duration-150 flex-shrink-0 text-muted-foreground"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>              <div className="flex items-center justify-between gap-10">
                <div className="grid grid-cols-[130px,1fr] gap-8 min-w-0 flex-1 items-center">
                  <AnimatedContent
                    value={task.latest_due_date}
                    glowOnChange={true}
                    skipInitialAnimation={true}
                  >
                    <span className="text-[13px] whitespace-nowrap flex items-center text-muted-foreground">
                      Due:{' '}
                      {task.latest_due_date
                        ? formatDueDate(task.latest_due_date)
                        : 'N/A'}
                    </span>
                  </AnimatedContent>
                  <span className="text-[13px] truncate min-w-0 flex items-center text-muted-foreground">
                    Submitter: {task.submitter || 'N/A'}
                  </span>
                </div>
                <AnimatedContent
                  value={task.latest_due_date}
                  glowOnChange={true}
                  skipInitialAnimation={true}
                >
                  <div
                    ref={statusRef}
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold min-w-[20px] text-center cursor-help"
                    style={statusStyle}
                  >
                    {currentStatus.toUpperCase()}
                  </div>
                </AnimatedContent>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSuccessToast && (
        <SuccessToast
          message="Your project has been paused. When space becomes available, the project at the top of your queue will be assigned and made active"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      {showWarningToast && (
        <WarningToast
          message="Oops! You are already at your active project cap. Please wait for a project to be completed, or pause another one before trying again"
          onClose={() => setShowWarningToast(false)}
        />
      )}
    </div>
  );
});

export default TaskCard;

