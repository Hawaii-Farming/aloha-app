import { describe, expect, it } from 'vitest';

import { getAgGridTheme } from '../ag-grid-theme';

/**
 * Phase 10 Wave 0 — GRID-01 regression guard.
 *
 * These assertions describe the Aloha/Phase-7 hex targets the theme MUST
 * resolve to once Plan 10-02 rewrites `ag-grid-theme.ts`. Until that plan
 * lands, this suite is expected to be RED.
 *
 * AG Grid v35 `themeQuartz.withParams(params, mode)` pushes the supplied
 * params into the theme's `parts[]` array as a new part whose `modeParams`
 * object is keyed by the mode string (e.g. `'light'` or `'dark'`). To read
 * them back we walk the parts and collect every entry that contributed to
 * the requested mode, merging them in declaration order so later calls
 * override earlier ones.
 */

type ThemeParams = Record<string, unknown>;

interface ThemePart {
  modeParams?: Record<string, ThemeParams>;
}

interface InternalTheme {
  parts?: ThemePart[];
}

function getParams(mode: 'light' | 'dark'): ThemeParams {
  const theme = getAgGridTheme() as unknown as InternalTheme;
  const parts = theme.parts ?? [];
  const merged: ThemeParams = {};
  for (const part of parts) {
    const modeBucket = part.modeParams?.[mode];
    if (modeBucket) {
      Object.assign(merged, modeBucket);
    }
  }
  return merged;
}

describe('getAgGridTheme', () => {
  it('returns a theme object (not null/undefined)', () => {
    const theme = getAgGridTheme();
    expect(theme).toBeTruthy();
  });

  it('does not throw when called', () => {
    expect(() => getAgGridTheme()).not.toThrow();
  });

  describe('light mode params (GRID-01)', () => {
    const params = getParams('light');

    it('uses Aloha light surface hexes', () => {
      expect(params.backgroundColor).toBe('#ffffff');
      expect(params.foregroundColor).toBe('#0f172a');
      expect(params.headerBackgroundColor).toBe('#f1f5f9');
      expect(params.headerTextColor).toBe('#475569');
      expect(params.borderColor).toBe('#e2e8f0');
      expect(params.accentColor).toBe('#22c55e');
      expect(params.rowHoverColor).toBe('#f1f5f9');
      expect(params.selectedRowBackgroundColor).toBe('#f0fdf4');
      expect(params.oddRowBackgroundColor).toBe('#f8fafc');
    });

    it('uses Inter Variable (not Geist Variable) for light mode', () => {
      expect(String(params.fontFamily)).toContain('Inter Variable');
      expect(String(params.fontFamily)).not.toContain('Geist Variable');
    });

    it('preserves shared typographic + spacing scale', () => {
      expect(params.fontSize).toBe(14);
      expect(params.headerFontSize).toBe(13);
      expect(params.headerFontWeight).toBe(500);
      expect(params.rowVerticalPaddingScale).toBe(1.6);
    });
  });

  describe('dark mode params (GRID-01)', () => {
    const params = getParams('dark');

    it('uses Aloha dark surface hexes', () => {
      expect(params.backgroundColor).toBe('#1e293b');
      expect(params.foregroundColor).toBe('#f8fafc');
      expect(params.headerBackgroundColor).toBe('#0f172a');
      expect(params.headerTextColor).toBe('#cbd5e1');
      expect(params.borderColor).toBe('#334155');
      expect(params.accentColor).toBe('#4ade80');
      expect(params.rowHoverColor).toBe('#334155');
      expect(params.oddRowBackgroundColor).toBe('#1e293b');
    });

    it('uses Inter Variable (not Geist Variable) for dark mode', () => {
      expect(String(params.fontFamily)).toContain('Inter Variable');
      expect(String(params.fontFamily)).not.toContain('Geist Variable');
    });

    it('preserves shared typographic + spacing scale', () => {
      expect(params.fontSize).toBe(14);
      expect(params.headerFontSize).toBe(13);
      expect(params.headerFontWeight).toBe(500);
      expect(params.rowVerticalPaddingScale).toBe(1.6);
    });
  });
});
