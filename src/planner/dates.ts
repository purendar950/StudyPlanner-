/** Local-date helpers. All planner dates are ISO `YYYY-MM-DD` keys in local time. */

export const DAY_MS = 86400000;

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function addDays(key: string, days: number): string {
  const date = parseKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function diffDays(fromKey: string, toKey: string): number {
  const from = parseKey(fromKey).getTime();
  const to = parseKey(toKey).getTime();
  return Math.round((to - from) / DAY_MS);
}

export function weekdayOf(key: string): number {
  return parseKey(key).getDay();
}

export function formatShort(key: string): string {
  const date = parseKey(key);
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`;
}

export function formatLong(key: string): string {
  const date = parseKey(key);
  return `${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}

/** Calendar grid (always 6 weeks) for the given month, Sunday first. */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return dateKey(date);
  });
}

export function isSameMonth(key: string, year: number, month: number): boolean {
  const date = parseKey(key);
  return date.getFullYear() === year && date.getMonth() === month;
}

/** Days left until the exam; 0 means the exam is today. */
export function daysUntil(examDate: string, from = todayKey()): number {
  return Math.max(0, diffDays(from, examDate));
}

export function relativeDayLabel(key: string): string {
  const delta = diffDays(todayKey(), key);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  if (delta < 0) return `${Math.abs(delta)} days ago`;
  return `In ${delta} days`;
}
