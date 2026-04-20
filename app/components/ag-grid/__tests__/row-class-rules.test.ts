import { describe, expect, it } from 'vitest';

import {
  otWarningRowClassRules,
  scoreColorCellClassRules,
  statusCellClassRules,
  varianceHighlightCellClassRules,
} from '../row-class-rules';

describe('row-class-rules', () => {
  it('otWarningRowClassRules is empty (colors removed app-wide)', () => {
    expect(Object.keys(otWarningRowClassRules)).toHaveLength(0);
  });

  it('varianceHighlightCellClassRules returns empty map', () => {
    expect(Object.keys(varianceHighlightCellClassRules())).toHaveLength(0);
    expect(Object.keys(varianceHighlightCellClassRules(10, 3))).toHaveLength(0);
  });

  it('scoreColorCellClassRules returns empty map', () => {
    expect(Object.keys(scoreColorCellClassRules())).toHaveLength(0);
  });

  it('statusCellClassRules is empty', () => {
    expect(Object.keys(statusCellClassRules)).toHaveLength(0);
  });
});
