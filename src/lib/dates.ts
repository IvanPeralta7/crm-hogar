/** Fecha local YYYY-MM-DD (sin desfase UTC). */
export function todayLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatLocalDate(dateStr: string, locale = 'es-AR'): string {
  if (!dateStr) return '—';
  return parseLocalDateString(dateStr).toLocaleDateString(locale);
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthKeyFromDateString(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getMonthRange(monthKey: string): { start: string; end: string } {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const start = `${monthKey}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function formatMonthLabel(monthKey: string, locale = 'es-AR'): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

export function getCurrentMonthKey(): string {
  return getMonthKey(new Date());
}

export function listMonthKeysFromDates(dates: string[]): string[] {
  const keys = new Set(dates.map(getMonthKeyFromDateString));
  return [...keys].sort((a, b) => b.localeCompare(a));
}
