import { describe, expect, it } from 'vitest';
import { addDays, countDaysInclusive, isWeekend, spanInWindow, todayIso } from './dates';

describe('countDaysInclusive', () => {
  it('counts both the first and the last day', () => {
    expect(countDaysInclusive('2026-10-01', '2026-10-05')).toBe(5);
  });

  it('crosses month boundaries and the daylight saving change correctly', () => {
    expect(countDaysInclusive('2026-10-25', '2026-11-23')).toBe(30);
  });
});

describe('todayIso', () => {
  it('uses the local calendar date, not UTC', () => {
    expect(todayIso(new Date(2026, 8, 28, 23, 30))).toBe('2026-09-28');
  });
});

describe('addDays', () => {
  it('moves across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });
});

describe('isWeekend', () => {
  it('flags Saturday and Sunday only', () => {
    expect(isWeekend('2026-10-03')).toBe(true);
    expect(isWeekend('2026-10-04')).toBe(true);
    expect(isWeekend('2026-10-05')).toBe(false);
  });
});

describe('spanInWindow', () => {
  it('positions a period fully inside the window', () => {
    expect(spanInWindow('2026-10-01', 28, '2026-10-03', '2026-10-07')).toEqual({
      firstDay: 2,
      lastDay: 6,
    });
  });

  it('clips a period that starts before and ends after the window', () => {
    expect(spanInWindow('2026-10-01', 28, '2026-09-20', '2026-11-15')).toEqual({
      firstDay: 0,
      lastDay: 27,
    });
  });

  it('returns null for a period outside the window', () => {
    expect(spanInWindow('2026-10-01', 28, '2026-10-29', '2026-11-05')).toBeNull();
  });
});
