#!/usr/bin/env node
/* global console, process */
// scripts/verify-wcag.mjs
//
// Verifies WCAG AA contrast for Phase 7 foundation token pairs.
// Runs 24 assertions (12 pairs × 2 themes). Exits 1 on any failure.
//
// Hex values mirror app/styles/shadcn-ui.css. Update this script when the
// foundation palette changes (Phase 10 will re-run and extend this).
//
// Thresholds per DESIGN.md §9 WCAG Verification:
//   - 4.5:1 for normal body text pairs
//   - 3.0:1 for UI component boundaries and large/bold text
//   - --primary/--primary-foreground evaluated at 3:1 per D-14 Option C
//     (no body text renders on --primary; button labels are 16px/500 on gradient)

import { hex } from 'wcag-contrast';

const pairs = [
  // LIGHT (:root)
  { name: 'foreground/background',              theme: 'light', fg: '#0f172a', bg: '#f1f5f9', min: 4.5 },
  { name: 'card-foreground/card',               theme: 'light', fg: '#0f172a', bg: '#ffffff', min: 4.5 },
  { name: 'popover-foreground/popover',         theme: 'light', fg: '#0f172a', bg: '#ffffff', min: 4.5 },
  { name: 'primary-foreground/primary',         theme: 'light', fg: '#ffffff', bg: '#22c55e', min: 3.0 },
  { name: 'secondary-foreground/secondary',     theme: 'light', fg: '#0f172a', bg: '#f1f5f9', min: 4.5 },
  { name: 'muted-foreground/background',        theme: 'light', fg: '#64748b', bg: '#f1f5f9', min: 4.5 },
  { name: 'muted-foreground/muted',             theme: 'light', fg: '#64748b', bg: '#f1f5f9', min: 4.5 },
  { name: 'accent-foreground/accent',           theme: 'light', fg: '#0f172a', bg: '#f1f5f9', min: 4.5 },
  { name: 'destructive-foreground/destructive', theme: 'light', fg: '#ffffff', bg: '#dc2626', min: 3.0 },
  { name: 'border/background',                  theme: 'light', fg: '#e2e8f0', bg: '#f1f5f9', min: 3.0 },
  { name: 'ring/background',                    theme: 'light', fg: '#22c55e', bg: '#f1f5f9', min: 3.0 },
  { name: 'sidebar-foreground/sidebar-background', theme: 'light', fg: '#475569', bg: '#ffffff', min: 4.5 },

  // DARK (.dark)
  { name: 'foreground/background',              theme: 'dark',  fg: '#f8fafc', bg: '#0f172a', min: 4.5 },
  { name: 'card-foreground/card',               theme: 'dark',  fg: '#f8fafc', bg: '#1e293b', min: 4.5 },
  { name: 'popover-foreground/popover',         theme: 'dark',  fg: '#f8fafc', bg: '#1e293b', min: 4.5 },
  { name: 'primary-foreground/primary',         theme: 'dark',  fg: '#052e16', bg: '#4ade80', min: 3.0 },
  { name: 'secondary-foreground/secondary',     theme: 'dark',  fg: '#f8fafc', bg: '#334155', min: 4.5 },
  { name: 'muted-foreground/background',        theme: 'dark',  fg: '#94a3b8', bg: '#0f172a', min: 4.5 },
  { name: 'muted-foreground/muted',             theme: 'dark',  fg: '#94a3b8', bg: '#1e293b', min: 4.5 },
  { name: 'accent-foreground/accent',           theme: 'dark',  fg: '#f8fafc', bg: '#334155', min: 4.5 },
  { name: 'destructive-foreground/destructive', theme: 'dark',  fg: '#ffffff', bg: '#ef4444', min: 3.0 },
  { name: 'border/background',                  theme: 'dark',  fg: '#334155', bg: '#0f172a', min: 3.0 },
  { name: 'ring/background',                    theme: 'dark',  fg: '#4ade80', bg: '#0f172a', min: 3.0 },
  { name: 'sidebar-foreground/sidebar-background', theme: 'dark', fg: '#cbd5e1', bg: '#0f172a', min: 4.5 },
];

let failures = 0;
const rows = [];
for (const p of pairs) {
  const ratio = hex(p.fg, p.bg);
  const pass = ratio >= p.min;
  if (!pass) failures += 1;
  const status = pass ? 'PASS' : 'FAIL';
  const glyph = pass ? 'PASS' : 'FAIL';
  console.log(
    `[${glyph}] [${p.theme.padEnd(5)}] ${p.name.padEnd(42)} ${ratio.toFixed(2)}:1 (min ${p.min.toFixed(1)}:1)`
  );
  rows.push(
    `| ${p.name} | ${p.theme} | ${ratio.toFixed(2)}:1 | ${p.min.toFixed(1)}:1 | ${status} |`
  );
}

console.log('\n--- Markdown table for DESIGN.md §WCAG Verification ---\n');
console.log('| Pair | Theme | Ratio | Min | Status |');
console.log('|------|-------|-------|-----|--------|');
for (const row of rows) console.log(row);

if (failures > 0) {
  console.error(`\n${failures} WCAG failure(s). Review Plan 01 palette.`);
  process.exit(1);
}
console.log('\nAll 24 assertions PASS.');
