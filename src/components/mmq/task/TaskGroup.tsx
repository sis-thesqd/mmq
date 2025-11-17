import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import type { Task } from '@/types/mmqTypes';
import { lazy } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle, Infinity } from 'lucide-react';
import { MIN_VISIBLE_TASKS, MAX_VISIBLE_TASKS } from '@/services/mmq';
import { Loading } from '../layout/Loading';
import { countActiveTasks } from '@/services/mmq/activeTaskCounter';

const TaskCard = lazy(() => import('./TaskCard').then(module => ({ default: module.default })));

const HEADER_HEIGHT = 56;
const TASK_HEIGHT = 80;
const TASK_GAP = 11;

interface TaskGroupProps {
  id: string;
  title: string;
  tasks: Task[];
  originalTasks?: Task[];
  onStatusUpdate?: (taskId: string, status: string, active: boolean) => void;
  onRefresh?: () => Promise<void>;
  activeTaskCount?: number;
  cap?: number;
  accountNumber?: number;
  showCountdownTimers?: boolean;
}

const MOBILE_BREAKPOINT = 768;const isWithin24Hours = (dueDate: string) => {
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
};

export function TaskGroup({
  id,
  title,
  tasks,
  originalTasks = [],
  onStatusUpdate,
  onRefresh,
  activeTaskCount = 0,
  cap,
  accountNumber,
  showCountdownTimers = false,
}: TaskGroupProps) {
  const isActive = id === 'active';
  const isUnlimited = cap === 999;
  const disableSorting = isActive;
  
  // Manually count active tasks from all tasks
  const calculatedActiveCount = useMemo(() => {
    return countActiveTasks(originalTasks.length > 0 ? originalTasks : tasks);
  }, [originalTasks, tasks]);
  
  const nonHoldCount = isActive ? calculatedActiveCount : tasks.length;
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  const sortedTasks = useMemo(() => {
    if (id === 'active') {
      const taskOrder = new Map(originalTasks.map((t, i) => [t.task_id, i]));
      return [...tasks].sort(
        (a, b) =>
          (taskOrder.get(a.task_id) ?? 0) - (taskOrder.get(b.task_id) ?? 0)
      );
    }
    return tasks;
  }, [tasks, id, originalTasks]);  const lastWidth = useRef(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const wasMobile = lastWidth.current < MOBILE_BREAKPOINT;
      const isMobile = currentWidth < MOBILE_BREAKPOINT;

      if (wasMobile !== isMobile) {
        setIsCollapsed(isMobile);
      }

      lastWidth.current = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      accepts: ['task'],
      disabled:
        isActive && !isUnlimited && nonHoldCount >= (cap || MIN_VISIBLE_TASKS),
    },
  });

  const getCountStyles = (count: number, isActive: boolean) => {
    if (!isActive) {
      return 'bg-muted text-muted-foreground';
    }
    if (cap === 999) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    }
    if (count > (cap || MIN_VISIBLE_TASKS)) {
      return 'bg-destructive/10 text-destructive';
    }
    if (count === (cap || MIN_VISIBLE_TASKS)) {
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  };  const calculateHeight = () => {
    if (isCollapsed) return '56px';

    if (sortedTasks.length === 0) {
      return `${HEADER_HEIGHT + TASK_HEIGHT + 16}px`;
    }

    if (sortedTasks.length <= MAX_VISIBLE_TASKS) {
      return `${HEADER_HEIGHT + (sortedTasks.length * TASK_HEIGHT) + ((sortedTasks.length - 1) * TASK_GAP) + 24}px`;
    }

    const contentHeight = MAX_VISIBLE_TASKS * TASK_HEIGHT + (MAX_VISIBLE_TASKS - 1) * TASK_GAP;
    return `${HEADER_HEIGHT + contentHeight}px`;
  };

  const calculateTimerVisibility = (task: Task, index: number) => {
    if (!cap || (task.active && task.status.toLowerCase() !== 'dependent')) return false;

    const availableSlots = cap - calculatedActiveCount;
    if (availableSlots <= 0) return false;

    return index < availableSlots;
  };

  return (
    <div
      ref={setNodeRef}
      id={`${id}-group`}
      className={cn(
        'rounded-lg transition-all relative flex flex-col overflow-hidden bg-card border',
        isOver &&
          !isActive &&
          'ring-2 ring-primary ring-opacity-50 scale-[1.02] shadow-lg'
      )}
      style={{
        height: calculateHeight(),
      }}
    >      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full text-base font-semibold p-4 flex items-center justify-between z-10 bg-card rounded-lg"
      >
        <span className="text-card-foreground">{title}</span>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-[13px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5',
              getCountStyles(nonHoldCount, isActive)
            )}
          >
            <span>
              {nonHoldCount}
              {isActive && !isUnlimited && cap && ` / ${cap}`}
              {isUnlimited && (
                <span className="inline-flex items-center ml-1">
                  / <Infinity className="w-3 h-3 ml-0.5" />
                </span>
              )}{' '}
              {nonHoldCount === 1 ? 'project' : 'projects'}
            </span>
            {isActive &&
              !isUnlimited &&
              nonHoldCount >= (cap || MIN_VISIBLE_TASKS) && (
                <AlertCircle className="w-3 h-3" />
              )}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-100 ease-in-out text-muted-foreground',
              isCollapsed ? '' : 'rotate-180'
            )}
          />
        </div>
      </button>      <div
        className={cn(
          'px-4 pb-4 overflow-y-auto overflow-x-visible transition-all duration-200',
          isCollapsed ? 'hidden' : 'block',
          sortedTasks.length > MAX_VISIBLE_TASKS ? 'scrollbar-show' : 'scrollbar-hide'
        )}
      >
        <div className="space-y-[11px] mt-3">
          {sortedTasks.length > 0 ? (
            <SortableContext
              items={sortedTasks
                .filter((task) => !disableSorting || !task.active)
                .map((t) => t.task_id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedTasks.map((task, index) => (
                <div
                  key={task.task_id}
                  className="transition-all duration-300 animate-slide-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <Suspense fallback={<Loading />}>
                    <TaskCard
                      task={task}
                      originalTask={originalTasks.find(
                        (t) => t.task_id === task.task_id
                      )}
                      showTooltips={false}
                      position={index + 1}
                      isOnlyItem={!isActive && tasks.length === 1}
                      cap={cap}
                      tasks={tasks}
                      onStatusUpdate={onStatusUpdate}
                      onRefresh={onRefresh}
                      accountNumber={accountNumber}
                      showTimer={calculateTimerVisibility(task, index)}
                      showCountdownTimers={showCountdownTimers}
                    />
                  </Suspense>
                </div>
              ))}
            </SortableContext>
          ) : null}

          {sortedTasks.length === 0 && (
            <div className="h-[100px] flex items-center justify-center mb-12">
              <p className="text-sm font-medium mb-12 text-muted-foreground">
                No projects to show
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

