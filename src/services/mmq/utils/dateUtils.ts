/**
 * Central Time timezone identifier used throughout the application
 */
export const CENTRAL_TIMEZONE = 'America/Chicago';

/**
 * Formats a timestamp into a human-readable string relative to current time.
 * Returns "just now" for recent timestamps, relative minutes for < 10 min,
 * or full date/time in Central Time for older timestamps.
 *
 * @param timestamp - ISO timestamp string
 * @returns Formatted timestamp string
 */
export function formatStatusTimestamp(timestamp: string): string {
  const now = new Date();
  const timestamp_date = new Date(timestamp);
  const diffMinutes = Math.floor((now.getTime() - timestamp_date.getTime()) / (1000 * 60));

  if (diffMinutes < 2) {
    return 'just now';
  }

  if (diffMinutes < 10) {
    return `${diffMinutes} minutes ago`;
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: CENTRAL_TIMEZONE
  }).format(timestamp_date);

  const timeZoneAbbr = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
    timeZone: CENTRAL_TIMEZONE
  })
    .formatToParts(timestamp_date)
    .find(part => part.type === 'timeZoneName')?.value || '';

  return `${formattedDate} ${timeZoneAbbr}`;
}

/**
 * Checks if a due date is within 24 hours from now in Central Time.
 * Adds one day to the due date before comparison (business rule).
 *
 * @param dueDate - ISO date string
 * @returns True if due date is within 24 hours
 */
export function isWithin24Hours(dueDate: string): boolean {
  const due = new Date(dueDate);
  due.setDate(due.getDate() + 1);
  const now = new Date();

  const dueInCentral = new Date(
    due.toLocaleString('en-US', { timeZone: CENTRAL_TIMEZONE })
  );
  const nowInCentral = new Date(
    now.toLocaleString('en-US', { timeZone: CENTRAL_TIMEZONE })
  );

  const diffHours =
    (dueInCentral.getTime() - nowInCentral.getTime()) / (1000 * 60 * 60);
  return diffHours <= 24;
}

/**
 * Checks if a due date is in the past.
 * Adds one day to the due date before comparison (business rule).
 *
 * @param dueDate - ISO date string
 * @returns True if due date is past
 */
export function isPastDue(dueDate: string): boolean {
  const due = new Date(dueDate);
  due.setDate(due.getDate() + 1);
  const now = new Date();
  return due < now;
}

/**
 * Formats a due date into a human-readable string in Central Time.
 * Returns relative descriptions (Today, Tomorrow, X days from now/ago)
 * or formatted date for dates further out.
 * Adds one day to the due date before formatting (business rule).
 *
 * @param dueDate - ISO date string
 * @returns Formatted due date string
 */
export function formatDueDate(dueDate: string): string {
  const due = new Date(dueDate);
  due.setDate(due.getDate() + 1);
  const now = new Date();

  const dueInCentral = new Date(
    due.toLocaleString('en-US', { timeZone: CENTRAL_TIMEZONE })
  );
  const nowInCentral = new Date(
    now.toLocaleString('en-US', { timeZone: CENTRAL_TIMEZONE })
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
    timeZone: CENTRAL_TIMEZONE,
  }).format(due);
}

