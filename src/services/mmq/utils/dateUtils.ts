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
  const timeZone = 'America/Chicago';
  
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone
  }).format(timestamp_date);

  const timeZoneAbbr = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
    timeZone
  })
    .formatToParts(timestamp_date)
    .find(part => part.type === 'timeZoneName')?.value || '';

  return `${formattedDate} ${timeZoneAbbr}`;
}

