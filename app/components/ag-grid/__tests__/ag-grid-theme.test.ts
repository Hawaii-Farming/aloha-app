import { describe, expect, it } from 'vitest';

import { getAgGridTheme } from '../ag-grid-theme';

/**
 * Asserts the Aloha AG Grid theme tokens documented in DESIGN.md and the
 * "Table theme (AG Grid)" subsection of UI-RULES.md. AG Grid v35's Theming
 * API does not resolve CSS vars, so these hex values are the canonical
 * theme lookup and this test is the regression guard against drift.
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
      expect(params.headerTextColor).toBe('#1e293b');
      expect(params.borderColor).toBe('#cbd5e1');
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
      expect(params.headerFontWeight).toBe(700);
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
      expect(params.headerFontWeight).toBe(700);
      expect(params.rowVerticalPaddingScale).toBe(1.6);
    });
  });
});
