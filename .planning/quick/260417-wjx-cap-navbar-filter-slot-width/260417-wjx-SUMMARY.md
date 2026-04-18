---
id: 260417-wjx
type: quick
status: complete
---

# Quick Task 260417-wjx — Summary

Capped `#workspace-navbar-filter-slot` to `max-w-[calc(50%-15rem)]` so the filter cluster can't extend into the centered search bar.

- Search (centered `max-w-md` = 28rem / 448px) has its left edge at `50% - 14rem`.
- Filter slot now caps at `50% - 15rem`, leaving a guaranteed 1rem (16px) gap.
- Long active-chip summaries truncate via the trigger's existing `truncate` class instead of overlapping search.

File: `app/components/workspace-shell/workspace-navbar.tsx`.
