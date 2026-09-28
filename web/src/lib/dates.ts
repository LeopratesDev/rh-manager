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
