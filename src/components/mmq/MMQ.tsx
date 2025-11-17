'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { Task, TaskResponse } from '@/types/mmqTypes';
import { TaskGroup } from './task/TaskGroup';
import { TaskCard } from './task/TaskCard';
import { TimerProvider } from './layout/TimerContext';
import { Loading } from './layout/Loading';
import { SuccessToast } from './modals/SuccessToast';
import { WarningToast } from './modals/WarningToast';
import { MMQ_DEFAULTS } from '@/config/mmq.config';
import { cn } from '@/lib/utils';
import { UntitledTextField } from '@/components/ui/untitled/UntitledTextField';
import { UntitledButton } from '@/components/ui/untitled/UntitledButton';
import { Settings } from 'lucide-react';

export interface MMQProps {
  /** Account number to fetch queue data for */
  accountNumber: number;
  /** Whether to show account override controls */
  showAccountOverride?: boolean;
  /** Whether dark mode is enabled */
  darkMode?: boolean;
  /** Custom title for the component */
  title?: string;
  /** Whether to show the title */
  showTitle?: boolean;
  /** Whether to show countdown timers */
  showCountdownTimers?: boolean;
  /** Callback when an error occurs */
  onError?: (error: Error | string) => void;
  /** Callback when data is loaded */
  onDataLoaded?: (data: TaskResponse) => void;
  /** Callback when changes are applied */
  onChangesApplied?: () => void;
}

export function MMQ({
  accountNumber,
  showAccountOverride = MMQ_DEFAULTS.showAccountOverride,
  darkMode = false,
  title = MMQ_DEFAULTS.title,
  showTitle = MMQ_DEFAULTS.showTitle,
  showCountdownTimers = false,
  onError,
  onDataLoaded,
  onChangesApplied,
}: MMQProps) {
  const [data, setData] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overrideAccount, setOverrideAccount] = useState<number | null>(null);
  const [overrideInput, setOverrideInput] = useState<string>('');
  const [isOverrideInputVisible, setIsOverrideInputVisible] = useState(false);
  const [hasPendingReorder, setHasPendingReorder] = useState(false);
  const [originalTasks, setOriginalTasks] = useState<Task[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const accountToFetch = overrideAccount || accountNumber;
      console.log('[MMQ] Fetching queue data for account:', accountToFetch);
      const response = await fetch(
        `/api/mmq-queue-data?accountNumber=${accountToFetch}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch queue data');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        console.log('[MMQ] Queue data received:', {
          taskCount: result.data.tasks.length,
          activeTasks: result.data.active_tasks
        });
        setData(result.data);
        setOriginalTasks(result.data.tasks);
        setHasPendingReorder(false);
        setError(null);
        onDataLoaded?.(result.data);
      } else {
        throw new Error('No data received from API');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onError?.(err instanceof Error ? err : errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [accountNumber, overrideAccount, onError, onDataLoaded]);

  const handleAccountOverride = async () => {
    const accountNum = parseInt(overrideInput, 10);
    if (isNaN(accountNum) || accountNum <= 0) {
      setWarningMessage('Please enter a valid account number');
      return;
    }
    
    try {
      setOverrideAccount(accountNum);
      setOverrideInput('');
      setIsOverrideInputVisible(false);
      await fetchData();
    } catch (error) {
      setWarningMessage(`Failed to load data for account ${accountNum}. Please check the account number and try again.`);
    }
  };

  const handleToggleAccountOverride = () => {
    setIsOverrideInputVisible(!isOverrideInputVisible);
    if (isOverrideInputVisible) {
      setOverrideInput('');
      setOverrideAccount(null);
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeTasks = useMemo(() => {
    return data?.tasks.filter((task) => task.active) || [];
  }, [data]);

  const holdTasks = useMemo(() => {
    const filtered = data?.tasks.filter((task) => !task.active) || [];
    // Sort by position to maintain consistent order
    return filtered.sort((a, b) => (a.position ?? 999999) - (b.position ?? 999999));
  }, [data]);

  const handleDragStart = (event: DragStartEvent) => {
    console.log('[MMQ] Drag started:', {
      activeId: event.active.id,
      container: event.active.data.current?.sortable?.containerId
    });
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('[MMQ] Drag ended:', {
      activeId: active.id,
      overId: over?.id,
      activeContainer: active.data.current?.sortable?.containerId,
      overContainer: over?.data.current?.sortable?.containerId || over?.id,
      hasOver: !!over,
      isSameId: active.id === over?.id
    });

    setActiveId(null);

    if (!over || active.id === over.id) {
      console.log('[MMQ] Drag cancelled: no over or same position');
      return;
    }

    // Check if both tasks are in the hold group by finding them in holdTasks
    const oldIndex = holdTasks.findIndex((task) => task.task_id === active.id);
    const newIndex = holdTasks.findIndex((task) => task.task_id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      console.log('[MMQ] Drag rejected: task not in hold group', {
        activeId: active.id,
        overId: over.id,
        activeInHold: oldIndex !== -1,
        overInHold: newIndex !== -1
      });
      return;
    }

    console.log('[MMQ] Drag accepted: reordering hold tasks', {
      from: oldIndex,
      to: newIndex
    });

    const reorderedTasks = arrayMove(holdTasks, oldIndex, newIndex);

    // Update local state with new positions
    const updatedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      position: index + 1,
    }));

    console.log('[MMQ] Drag completed:', {
      from: { index: oldIndex, taskId: active.id },
      to: { index: newIndex, taskId: over.id },
      updatedPositions: updatedTasks.map(t => ({
        taskId: t.task_id,
        taskName: t.name?.substring(0, 30),
        position: t.position
      }))
    });

    // Update data state
    if (data) {
      const updatedData = {
        ...data,
        tasks: [
          ...activeTasks,
          ...updatedTasks,
        ],
      };
      setData(updatedData);
      setHasPendingReorder(true);
    }
  };

  const handleApplyReorder = async () => {
    if (!data) return;

    try {
      // Use tasks from current data state (not memoized holdTasks) to get updated positions
      const reorderPayload = data.tasks
        .filter((task) => !task.active)
        .sort((a, b) => (a.position ?? 999999) - (b.position ?? 999999))
        .map((task) => ({
          task_id: task.task_id,
          position: task.position || 0,
          active: task.active,
          status: task.status,
        }));

      console.log('[MMQ] Applying reorder:', reorderPayload.length, 'tasks');
      console.log('[MMQ] Reorder payload:', reorderPayload.map(t => ({
        taskId: t.task_id,
        position: t.position,
        active: t.active,
        status: t.status
      })));

      const response = await fetch('/api/mmq-reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder tasks');
      }

      console.log('[MMQ] Reorder successful, starting polling');
      setSuccessMessage('Tasks reordered successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setHasPendingReorder(false);
      onChangesApplied?.();
      
      // Poll mmq-queue-data every 2 seconds for 20 seconds after reorder
      console.log('[MMQ] Starting polling after reorder response');
      let pollCount = 0;
      const maxPolls = 10; // 20 seconds / 2 seconds
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`[MMQ] Polling queue data after reorder (${pollCount}/${maxPolls})`);
        await fetchData();
        
        if (pollCount >= maxPolls) {
          console.log('[MMQ] Reorder polling complete');
          clearInterval(pollInterval);
        }
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setWarningMessage(errorMessage);
      setTimeout(() => setWarningMessage(null), 5000);
      onError?.(err instanceof Error ? err : errorMessage);
      
      // Revert to original
      if (data) {
        setData({
          ...data,
          tasks: originalTasks,
        });
      }
      setHasPendingReorder(false);
    }
  };

  const handleCancelReorder = () => {
    if (!data) return;
    
    console.log('[MMQ] Canceling reorder, reverting to original');
    setData({
      ...data,
      tasks: originalTasks,
    });
    setHasPendingReorder(false);
  };

  const handleStatusUpdate = async (
    taskId: string,
    status: string,
    active: boolean
  ) => {
    const task = data?.tasks.find((t) => t.task_id === taskId);
    if (!task) return;

    const action = active ? 'play' : 'pause';
    const position = task.active
      ? activeTasks.findIndex((t) => t.task_id === taskId) + 1
      : holdTasks.findIndex((t) => t.task_id === taskId) + 1;

    try {
      console.log('[MMQ] Sending play/pause request:', { action, taskId, position });
      
      const response = await fetch('/api/mmq-play-pause', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          task_id: taskId,
          position,
          view_id: `account-${accountNumber}`,
        }),
      });

      console.log('[MMQ] Play/pause response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task status');
      }

      const result = await response.json();
      console.log('[MMQ] Play/pause result:', result);

      // Update local state
      if (data) {
        console.log('[MMQ] Updating local state');
        const updatedTasks = data.tasks.map((t) =>
          t.task_id === taskId
            ? {
                ...t,
                active: result.active,
                status: result.status,
                latest_due_date: result.due_date || t.latest_due_date,
                status_pill_color: result.badge_color || t.status_pill_color,
              }
            : t
        );

        setData({
          ...data,
          tasks: updatedTasks,
          active_tasks: updatedTasks.filter((t) => t.active).length,
        });
        console.log('[MMQ] Local state updated');
      }

      console.log('[MMQ] Setting success message');
      setSuccessMessage(
        `Task ${action === 'play' ? 'started' : 'paused'} successfully`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      onChangesApplied?.();
      
      // Refresh data once after status update
      await fetchData();
    } catch (err) {
      console.error('[MMQ] Error in handleStatusUpdate:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setWarningMessage(errorMessage);
      setTimeout(() => setWarningMessage(null), 5000);
      onError?.(err instanceof Error ? err : errorMessage);
    }
  };

  const activeTask = activeId
    ? data?.tasks.find((task) => task.task_id === activeId)
    : null;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Error Loading Queue
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={cn('min-h-screen bg-background', darkMode && 'dark')}>
      <TimerProvider
        onRefresh={fetchData}
        activeTaskCount={data.active_tasks}
        cap={data.cap}
      >
        <div className="min-h-screen bg-background pt-6 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 lg:pt-8 lg:px-8 lg:pb-8">
          <div className="max-w-[100rem] mx-auto">
            {showTitle && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 w-full">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {title}
                  </h1>
                  {showAccountOverride && (
                    <div className="ml-auto flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isOverrideInputVisible ? (
                          <div className="flex items-center gap-2">
                            <UntitledTextField
                              type="number"
                              placeholder="Account #"
                              value={overrideInput}
                              onChange={(e) => setOverrideInput(e.target.value)}
                              size="sm"
                              className="w-24"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAccountOverride();
                                } else if (e.key === 'Escape') {
                                  handleToggleAccountOverride();
                                }
                              }}
                            />
                            <UntitledButton
                              size="sm"
                              color="primary"
                              onClick={handleAccountOverride}
                              disabled={!overrideInput}
                            >
                              Apply
                            </UntitledButton>
                            <UntitledButton
                              size="sm"
                              color="tertiary"
                              onClick={handleToggleAccountOverride}
                            >
                              Cancel
                            </UntitledButton>
                          </div>
                        ) : (
                          <UntitledButton
                            size="sm"
                            color="tertiary"
                            onClick={handleToggleAccountOverride}
                            iconLeading={Settings}
                          >
                            Override Account
                          </UntitledButton>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <TaskGroup
                id="hold"
                title="On Hold"
                tasks={holdTasks}
                originalTasks={data.tasks}
                onStatusUpdate={handleStatusUpdate}
                onRefresh={fetchData}
                accountNumber={accountNumber}
                showCountdownTimers={showCountdownTimers}
              />

              <TaskGroup
                id="active"
                title="Active"
                tasks={activeTasks}
                originalTasks={data.tasks}
                onStatusUpdate={handleStatusUpdate}
                onRefresh={fetchData}
                activeTaskCount={data.active_tasks}
                cap={data.cap}
                accountNumber={accountNumber}
                showCountdownTimers={showCountdownTimers}
              />
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="opacity-50">
                  <TaskCard
                    task={activeTask}
                    position={holdTasks.findIndex((t) => t.task_id === activeTask.task_id) + 1}
                    showTooltips={false}
                    accountNumber={accountNumber}
                    showCountdownTimers={showCountdownTimers}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {hasPendingReorder && (
            <div className="fixed bottom-6 right-6 z-50 flex gap-3 animate-slide-up">
              <UntitledButton
                size="md"
                color="tertiary"
                onClick={handleCancelReorder}
              >
                Cancel
              </UntitledButton>
              <UntitledButton
                size="md"
                color="primary"
                onClick={handleApplyReorder}
              >
                Apply Changes
              </UntitledButton>
            </div>
          )}

          {successMessage && (
            <SuccessToast
              message={successMessage}
              onClose={() => setSuccessMessage(null)}
            />
          )}

          {warningMessage && (
            <WarningToast
              message={warningMessage}
              onClose={() => setWarningMessage(null)}
            />
          )}
          </div>
        </div>
      </TimerProvider>
    </div>
  );
}


