/**
 * MMQ Skeleton Loader
 *
 * Shows a skeleton UI that matches the MMQ layout while data loads.
 * Provides better UX than a simple loading spinner.
 */

export function MMQSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-6 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 lg:pt-8 lg:px-8 lg:pb-8">
      <div className="max-w-[100rem] mx-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 w-full">
            {/* Title skeleton */}
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />

            {/* Override button skeleton */}
            <div className="ml-auto">
              <div className="h-9 w-36 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Hold Column Skeleton */}
          <div className="space-y-4">
            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            </div>

            {/* Task card skeletons */}
            {[1, 2, 3].map((i) => (
              <TaskCardSkeleton key={`hold-${i}`} />
            ))}
          </div>

          {/* Active Column Skeleton */}
          <div className="space-y-4">
            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            </div>

            {/* Task card skeletons */}
            {[1, 2].map((i) => (
              <TaskCardSkeleton key={`active-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Individual task card skeleton
 */
function TaskCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded" />
      </div>

      {/* Title */}
      <div className="h-4 w-3/4 bg-muted rounded" />

      {/* Description lines */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
      </div>

      {/* Footer badges */}
      <div className="flex gap-2 pt-2">
        <div className="h-6 w-20 bg-muted rounded-full" />
        <div className="h-6 w-24 bg-muted rounded-full" />
      </div>
    </div>
  )
}
