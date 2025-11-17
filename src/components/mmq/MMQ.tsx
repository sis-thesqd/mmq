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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const accountToFetch = overrideAccount || accountNumber;
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
        setData(result.data);
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
    return data?.tasks.filter((task) => !task.active) || [];
  }, [data]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeContainer = active.data.current?.sortable?.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    // Only allow reordering within the hold group
    if (activeContainer !== 'hold' || overContainer !== 'hold') {
      return;
    }

    const oldIndex = holdTasks.findIndex((task) => task.task_id === active.id);
    const newIndex = holdTasks.findIndex((task) => task.task_id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedTasks = arrayMove(holdTasks, oldIndex, newIndex);

    // Update local state optimistically
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
    }

    // Send reorder request to API
    try {
      const reorderPayload = updatedTasks.map((task) => ({
        task_id: task.task_id,
        position: task.position,
        active: task.active,
        status: task.status,
      }));

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

      setSuccessMessage('Tasks reordered successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      onChangesApplied?.();
      
      // Refresh data to ensure consistency
      await fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setWarningMessage(errorMessage);
      setTimeout(() => setWarningMessage(null), 5000);
      onError?.(err instanceof Error ? err : errorMessage);
      
      // Revert optimistic update
      await fetchData();
    }
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task status');
      }

      const result = await response.json();

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
      
      // Refresh data to ensure consistency
      await fetchData();
    } catch (err) {
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
                accountNumber={accountNumber}
                showCountdownTimers={showCountdownTimers}
              />

              <TaskGroup
                id="active"
                title="Active"
                tasks={activeTasks}
                originalTasks={data.tasks}
                onStatusUpdate={handleStatusUpdate}
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


