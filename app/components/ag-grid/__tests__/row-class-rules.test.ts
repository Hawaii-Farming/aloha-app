import { describe, expect, it } from 'vitest';

import {
  otWarningRowClassRules,
  statusCellClassRules,
  varianceHighlightCellClassRules,
} from '../row-class-rules';

function makeRowParams(data: Record<string, unknown>) {
  return { data } as never;
}

function makeCellParams(value: unknown) {
  return { value } as never;
}

describe('otWarningRowClassRules', () => {
  const rule = otWarningRowClassRules['bg-amber-500/10'] as (
    params: never,
  ) => boolean;

  it('returns true when is_over_ot_threshold is true', () => {
    expect(rule(makeRowParams({ is_over_ot_threshold: true }))).toBe(true);
  });

  it('returns false when is_over_ot_threshold is false', () => {
    expect(rule(makeRowParams({ is_over_ot_threshold: false }))).toBe(false);
  });

  it('returns false when is_over_ot_threshold is undefined', () => {
    expect(rule(makeRowParams({}))).toBe(false);
  });
});

describe('varianceHighlightCellClassRules', () => {
  const rules = varianceHighlightCellClassRules();
  const redRule = rules['text-red-500 font-semibold'] as (
    params: never,
  ) => boolean;
  const amberRule = rules['text-amber-500'] as (params: never) => boolean;

  it('red class returns true when value >= 5', () => {
    expect(redRule(makeCellParams(5))).toBe(true);
    expect(redRule(makeCellParams(10))).toBe(true);
  });

  it('red class returns true for negative value with abs >= 5', () => {
    expect(redRule(makeCellParams(-7))).toBe(true);
  });

  it('red class returns false when value < 5', () => {
    expect(redRule(makeCellParams(4.9))).toBe(false);
  });

  it('amber class returns true when value >= 1 and < 5', () => {
    expect(amberRule(makeCellParams(1))).toBe(true);
    expect(amberRule(makeCellParams(3))).toBe(true);
    expect(amberRule(makeCellParams(4.9))).toBe(true);
  });

  it('amber class returns false when value < 1', () => {
    expect(amberRule(makeCellParams(0.5))).toBe(false);
  });

  it('amber class returns false when value >= 5 (red takes over)', () => {
    expect(amberRule(makeCellParams(5))).toBe(false);
  });

  it('uses custom thresholds', () => {
    const custom = varianceHighlightCellClassRules(10, 3);
    const customRed = custom['text-red-500 font-semibold'] as (
      params: never,
    ) => boolean;
    const customAmber = custom['text-amber-500'] as (params: never) => boolean;

    expect(customRed(makeCellParams(10))).toBe(true);
    expect(customRed(makeCellParams(9))).toBe(false);
    expect(customAmber(makeCellParams(3))).toBe(true);
    expect(customAmber(makeCellParams(2))).toBe(false);
  });
});

describe('statusCellClassRules', () => {
  const greenRule = statusCellClassRules[
    'text-green-600 dark:text-green-400'
  ] as (params: never) => boolean;
  const amberRule = statusCellClassRules[
    'text-amber-600 dark:text-amber-400'
  ] as (params: never) => boolean;
  const redRule = statusCellClassRules['text-red-600 dark:text-red-400'] as (
    params: never,
  ) => boolean;

  it('green for approved', () => {
    expect(greenRule(makeCellParams('approved'))).toBe(true);
    expect(greenRule(makeCellParams('Approved'))).toBe(true);
  });

  it('green for active', () => {
    expect(greenRule(makeCellParams('active'))).toBe(true);
  });

  it('amber for pending', () => {
    expect(amberRule(makeCellParams('pending'))).toBe(true);
    expect(amberRule(makeCellParams('Pending'))).toBe(true);
  });

  it('red for denied', () => {
    expect(redRule(makeCellParams('denied'))).toBe(true);
  });

  it('red for rejected', () => {
    expect(redRule(makeCellParams('rejected'))).toBe(true);
  });

  it('red for inactive', () => {
    expect(redRule(makeCellParams('inactive'))).toBe(true);
  });

  it('returns false for unknown status', () => {
    expect(greenRule(makeCellParams('unknown'))).toBe(false);
    expect(amberRule(makeCellParams('unknown'))).toBe(false);
    expect(redRule(makeCellParams('unknown'))).toBe(false);
  });
});
