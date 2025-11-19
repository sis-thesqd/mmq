/**
 * MMQ Skeleton Loader
 *
 * Shows a skeleton UI that matches the MMQ layout while data loads.
 * Provides better UX than a simple loading spinner.
 */

export function MMQSkeleton() {
  return (
    <div
      className="min-h-screen bg-background pt-6 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 lg:pt-8 lg:px-8 lg:pb-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading task queue"
      data-mmq-root
    >
      {/* Screen reader announcement */}
      <span className="sr-only">Loading task queue, please wait...</span>

      <div className="max-w-[100rem] mx-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 w-full">
            {/* Title skeleton */}
            <div className="h-8 w-48 bg-muted rounded animate-pulse border-0" />

            {/* Override button skeleton */}
            <div className="ml-auto">
              <div className="h-9 w-36 bg-muted rounded animate-pulse border-0" />
            </div>
          </div>
        </div>

        {/* Two-column grid - exactly matching TaskGroup layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Hold Column Skeleton */}
          <TaskGroupSkeleton title="On Hold" />

          {/* Active Column Skeleton */}
          <TaskGroupSkeleton title="Active" />
        </div>
      </div>
    </div>
  )
}

/**
 * Task group skeleton that matches TaskGroup component layout
 */
function TaskGroupSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      {/* Header matching TaskGroup header */}
      <div className="flex items-center justify-between mb-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 bg-muted rounded animate-pulse border-0" />
        </div>

        {/* Count badge */}
        <div className="h-6 w-24 bg-muted rounded-full animate-pulse border-0" />
      </div>

      {/* Show 2 task card skeletons */}
      <div className="space-y-[11px]">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  )
}

/**
 * Individual task card skeleton
 * Empty container matching the size of actual task cards
 */
function TaskCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm h-[80px] animate-pulse" />
  )
}
