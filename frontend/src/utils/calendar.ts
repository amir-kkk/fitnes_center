interface CalendarLinkOptions {
  title: string;
  start: Date;
  end: Date;
  details?: string;
}

function toGoogleDate(value: Date): string {
  return value
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function createGoogleCalendarLink(options: CalendarLinkOptions): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    dates: `${toGoogleDate(options.start)}/${toGoogleDate(options.end)}`,
    details: options.details ?? '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
