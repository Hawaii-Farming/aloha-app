import { themeQuartz } from 'ag-grid-community';

/**
 * Returns an AG Grid theme configured with DESIGN.md color tokens
 * for both light and dark modes. Uses the AG Grid v35 Theming API
 * (themeQuartz.withParams) -- no separate CSS override files needed.
 *
 * Light mode maps to the Supabase Studio light palette (oklch tokens).
 * Dark mode maps to the Supabase dark-mode-native palette.
 */
export function getAgGridTheme() {
  return themeQuartz
    .withParams(
      {
        fontFamily:
          "'Geist Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: 14,
        headerFontSize: 13,
        headerFontWeight: 500,
        backgroundColor: '#fafafa',
        foregroundColor: '#171717',
        headerBackgroundColor: '#f0f0f0',
        headerTextColor: '#171717',
        borderColor: '#9a9a9a',
        accentColor: '#1d9e65',
        rowHoverColor: '#f0f0f0',
        selectedRowBackgroundColor: '#e8f5ee',
        oddRowBackgroundColor: '#f5f5f5',
        checkboxBorderRadius: 999,
        rowVerticalPaddingScale: 1.2,
        browserColorScheme: 'light',
      },
      'light',
    )
    .withParams(
      {
        fontFamily:
          "'Geist Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: 14,
        headerFontSize: 13,
        headerFontWeight: 500,
        backgroundColor: '#262626',
        foregroundColor: '#e8e8e8',
        headerBackgroundColor: '#2e2e2e',
        headerTextColor: '#e8e8e8',
        borderColor: '#404040',
        accentColor: '#3ecf8e',
        rowHoverColor: '#2e2e2e',
        selectedRowBackgroundColor: '#1a3a2a',
        oddRowBackgroundColor: '#2a2a2a',
        checkboxBorderRadius: 999,
        rowVerticalPaddingScale: 1.2,
        browserColorScheme: 'dark',
      },
      'dark',
    );
}
