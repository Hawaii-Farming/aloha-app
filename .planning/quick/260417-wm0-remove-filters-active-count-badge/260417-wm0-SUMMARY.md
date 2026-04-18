---
id: 260417-wm0
type: quick
status: complete
---

# Quick Task 260417-wm0 — Summary

Dropped the active-count badge (`bg-primary` circle with "1") from the Filters button trigger. The active-chip summary (e.g. "2026-03-15 – 2026-03-28") still appears to indicate an active filter. Reclaims ~28px of trigger width so Filters + search have breathing room.

File: `app/components/navbar-filter-button.tsx`.
