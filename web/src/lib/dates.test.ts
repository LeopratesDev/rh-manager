import { describe, expect, it } from 'vitest';
import { countDaysInclusive, todayIso } from './dates';

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
