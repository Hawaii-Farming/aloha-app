// Font: Inter Variable (matches Phase 7 app-wide migration — supersedes CONTEXT D-02)
import { iconSetMaterial, themeQuartz } from 'ag-grid-community';

/**
 * Returns an AG Grid theme configured with Aloha design tokens for both light
 * and dark modes. Uses the AG Grid v35 Theming API (`themeQuartz.withParams`)
 * — literal hex values only. AG Grid's `withParams` does NOT resolve
 * `var(--...)` references, so values are hard coded to the Aloha palette.
 *
 * Light mode: Aloha slate/white/emerald.
 * Dark mode:  Kimbie Dark (warm earth tones) — mirrors the `.dark` block in
 * `app/styles/shadcn-ui.css`. When DESIGN.md dark tokens change, update both
 * here and the test below.
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
  headerFontWeight: 700,
  headerVerticalPaddingScale: 1,
  checkboxBorderRadius: 4,
  rowVerticalPaddingScale: 1.1,
  columnBorder: true,
  iconSize: 12,
  inputFocusBorder: 'solid 1px transparent',
  inputFocusShadow: 'none',
  wrapperBorder: false,
  wrapperBorderRadius: 0,
} as const;

export function getAgGridTheme() {
  return themeQuartz
    .withPart(iconSetMaterial)
    .withParams(
      {
        ...shared,
        browserColorScheme: 'light',
        backgroundColor: '#ffffff',
        foregroundColor: '#0f172a',
        headerBackgroundColor: '#f1f5f9',
        headerTextColor: '#1e293b',
        borderColor: '#cbd5e1',
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
        backgroundColor: '#110d07',
        foregroundColor: '#d3af86',
        headerBackgroundColor: '#0f0b06',
        headerTextColor: '#a57a4c',
        borderColor: '#261b10',
        accentColor: '#4ade80',
        rowHoverColor: '#261b10',
        selectedRowBackgroundColor: 'rgba(74, 222, 128, 0.12)',
        oddRowBackgroundColor: '#110d07',
      },
      'dark',
    );
}
