const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDay(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function countDaysInclusive(startIso: string, endIso: string): number {
  return toUtcDay(endIso) - toUtcDay(startIso) + 1;
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date((toUtcDay(isoDate) + days) * MS_PER_DAY);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

export function isWeekend(isoDate: string): boolean {
  const weekday = new Date(toUtcDay(isoDate) * MS_PER_DAY).getUTCDay();
  return weekday === 0 || weekday === 6;
}

/** Posição de um período dentro de uma janela de dias, cortando o que fica fora dela. */
export function spanInWindow(
  windowStart: string,
  windowDays: number,
  startIso: string,
  endIso: string,
): { firstDay: number; lastDay: number } | null {
  const firstDay = Math.max(toUtcDay(startIso) - toUtcDay(windowStart), 0);
  const lastDay = Math.min(toUtcDay(endIso) - toUtcDay(windowStart), windowDays - 1);
  return firstDay > lastDay ? null : { firstDay, lastDay };
}
