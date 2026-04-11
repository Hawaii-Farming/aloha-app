// Font: Inter Variable (matches Phase 7 app-wide migration — supersedes CONTEXT D-02)
import { iconSetAlpine, themeQuartz } from 'ag-grid-community';

/**
 * Returns an AG Grid theme configured with Aloha/Phase-7 Supabase-inspired
 * design tokens for both light and dark modes. Uses the AG Grid v35 Theming
 * API (`themeQuartz.withParams`) — literal hex values only. AG Grid's
 * `withParams` does NOT resolve `var(--...)` references, so values are hard
 * coded to the Aloha palette.
 *
 * Font is unified with the rest of the app on Inter Variable (Phase 7
 * migration); AG Grid was the final divergent surface on Geist Variable.
 *
 * Contract asserted by `app/components/ag-grid/__tests__/ag-grid-theme.test.ts`.
 */
const shared = {
  fontFamily:
    "'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 14,
  headerFontSize: 13,
  headerFontWeight: 500,
  checkboxBorderRadius: 4,
  rowVerticalPaddingScale: 1.6,
  columnBorder: true,
} as const;

export function getAgGridTheme() {
  return themeQuartz
    .withPart(iconSetAlpine)
    .withParams(
      {
        ...shared,
        browserColorScheme: 'light',
        backgroundColor: '#ffffff',
        foregroundColor: '#0f172a',
        headerBackgroundColor: '#f1f5f9',
        headerTextColor: '#475569',
        borderColor: '#e2e8f0',
        accentColor: '#22c55e',
        rowHoverColor: '#f1f5f9',
        selectedRowBackgroundColor: '#f0fdf4',
        oddRowBackgroundColor: '#f8fafc',
      },
      'light',
    )
    .withParams(
      {
        ...shared,
        browserColorScheme: 'dark',
        backgroundColor: '#1e293b',
        foregroundColor: '#f8fafc',
        headerBackgroundColor: '#0f172a',
        headerTextColor: '#cbd5e1',
        borderColor: '#334155',
        accentColor: '#4ade80',
        rowHoverColor: '#334155',
        selectedRowBackgroundColor: 'rgba(34, 197, 94, 0.15)',
        oddRowBackgroundColor: '#1e293b',
      },
      'dark',
    );
}
