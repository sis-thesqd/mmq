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
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { Task, TaskResponse } from '@/types/mmqTypes';
import { filterActiveTasks, filterHoldTasks } from '@/services/mmq/utils/taskUtils';
import { TaskGroup } from './task/TaskGroup';
import { TaskCard } from './task/TaskCard';
import { TimerProvider } from './layout/TimerContext';
import { Loading } from './layout/Loading';
import { SuccessToast } from './modals/SuccessToast';
import { WarningToast } from './modals/WarningToast';
import { MMQ_DEFAULTS } from '@/config/mmq.config';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { usePolling } from '@/hooks/usePolling';
import { UntitledTextField } from '@/components/ui/untitled/UntitledTextField';
import { UntitledButton } from '@/components/ui/untitled/UntitledButton';
import { Settings } from 'lucide-react';
import { MMQApiService } from '@/services/mmq/apiService';

const logger = createLogger('MMQ');

export interface MMQProps {
  accountNumber: number;
  supabaseUrl: string;
  supabaseKey: string;
  dataEndpoint?: string;
  reorderEndpoint?: string;
  playPauseEndpoint?: string;
  showAccountOverride?: boolean;
  showCountdownTimers?: boolean;
  onError?: (error: Error | string) => void;
  onDataLoaded?: (data: TaskResponse) => void;
  onChangesApplied?: () => void;
}

export function MMQ({
  accountNumber,
  supabaseUrl,
  supabaseKey,
  dataEndpoint,
  reorderEndpoint,
  playPauseEndpoint,
  showAccountOverride = MMQ_DEFAULTS.showAccountOverride,
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

  // Create API service instance
  const apiService = useMemo(() => {
    return new MMQApiService({
      supabaseUrl,
      supabaseKey,
      dataEndpoint,
      reorderEndpoint,
      playPauseEndpoint,
    });
  }, [supabaseUrl, supabaseKey, dataEndpoint, reorderEndpoint, playPauseEndpoint]);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const accountToFetch = overrideAccount || accountNumber;
      const result = await apiService.fetchQueueData(accountToFetch);

      setData(result);
      setOriginalTasks(result.tasks);
      setHasPendingReorder(false);
      setError(null);
      onDataLoaded?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onError?.(err instanceof Error ? err : errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [apiService, accountNumber, overrideAccount, onError, onDataLoaded]);

  const { startPolling: startReorderPolling } = usePolling({
    interval: 2000,
    maxPolls: 10,
    onPoll: fetchData,
  });

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
    return data ? filterActiveTasks(data.tasks) : [];
  }, [data]);

  const holdTasks = useMemo(() => {
    const filtered = data ? filterHoldTasks(data.tasks) : [];
    // Sort by position to maintain consistent order
    return filtered.sort((a, b) => (a.position ?? 999999) - (b.position ?? 999999));
  }, [data]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Check if both tasks are in the hold group by finding them in holdTasks
    const oldIndex = holdTasks.findIndex((task) => task.task_id === active.id);
    const newIndex = holdTasks.findIndex((task) => task.task_id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedTasks = arrayMove(holdTasks, oldIndex, newIndex);

    // Update local state with new positions
    const updatedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      position: index + 1,
    }));

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
      const reorderPayload = filterHoldTasks(data.tasks)
        .sort((a, b) => (a.position ?? 999999) - (b.position ?? 999999))
        .map((task) => ({
          task_id: task.task_id,
          position: task.position || 0,
          active: task.active,
          status: task.status,
        }));

      await apiService.reorderTasks(reorderPayload);

      setSuccessMessage('Tasks reordered successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setHasPendingReorder(false);
      onChangesApplied?.();

      // Start polling after successful reorder
      startReorderPolling();
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
      const result = await apiService.playPauseTask({
        action,
        task_id: taskId,
        position,
        view_id: `account-${accountNumber}`,
      });

      // Update local state
      if (data) {
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
      }

      setSuccessMessage(
        `Task ${action === 'play' ? 'started' : 'paused'} successfully`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      onChangesApplied?.();

      // Refresh data once after status update
      await fetchData();
    } catch (err) {
      logger.error('Error in handleStatusUpdate', err, { taskId, status, active });
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
                              aria-label="Override account number"
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
                              aria-label="Apply account override"
                            >
                              Apply
                            </UntitledButton>
                            <UntitledButton
                              size="sm"
                              color="tertiary"
                              onClick={handleToggleAccountOverride}
                              aria-label="Cancel account override"
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
                            aria-label="Toggle account override"
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
            modifiers={[restrictToVerticalAxis]}
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

            {hasPendingReorder && (
              <div className="mt-8 flex justify-between items-center animate-slide-up" role="alert">
                <UntitledButton
                  size="md"
                  color="tertiary"
                  onClick={handleCancelReorder}
                  aria-label="Cancel task reorder"
                >
                  Cancel
                </UntitledButton>
                <UntitledButton
                  size="md"
                  color="primary"
                  onClick={handleApplyReorder}
                  aria-label="Apply task reorder changes"
                >
                  Apply Changes
                </UntitledButton>
              </div>
            )}

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


