---
sketch: 001
name: scheduler-timeline
question: "Which density × layout × detail combo reads best as the scheduler row-click detail view, at a 330px max-height constraint?"
winner: null
tags: [scheduler, timeline, detail-row, ag-grid]
---

# Sketch 001: Scheduler Weekly Timeline

## Design Question

The scheduler list view opens a detail row (max 330px) when an employee row is clicked. The current implementation is a card grid showing "3 most recent weeks" — it doesn't give a sense of *when in the day* a shift happens, it doesn't handle timezone, and it doesn't compare employees to each other. This sketch explores **replacing that detail row with an hour-block timeline** for the employee's currently visible week.

Which of: vertical hours vs horizontal hours × compact vs rich blocks × fixed-range vs adaptive-range reads best at that row height, in light and dark, for a farm-ops supervisor?

## How to View

```
open .planning/sketches/001-scheduler-timeline/index.html
```

Toolbar at bottom-right:
- **theme** — toggle light/dark
- **tz** — re-zone the fake data (Browser local / Honolulu / Chicago / New York / UTC). All times re-render via `toLocaleTimeString` — watch the shift blocks slide as you change tz, and notice the Sun shift jumps days if you flip Honolulu ↔ New York. That's the bug we're fixing in the real app.
- **hours** — change the displayed hour range (06–20 / 00–24 / 04–22). Only affects Variants A, B, C.

## Variants

- **A · Vertical · Compact** — 7 day columns, hours 06–20 as vertical rows, shift blocks show only time range. Most grid-like; closest to Google Calendar's day view density.
- **B · Vertical · Rich** — same layout as A but blocks show time + hours pill + task + farm+stat. Information per block costs block height.
- **C · Horizontal · Gantt** — 7 day rows, hours as columns. Gantt-style. Each day gets one full row, shifts flow left-to-right. Eats horizontal width, very scannable.
- **D · Adaptive · Dense** — vertical like A/B but the hour range auto-fits to the shifts actually present (±1h padding). Compresses dead space so the current week feels like it fits regardless of whether shifts are 6am–2pm or 4pm–midnight.

## What to Look For

1. **At 330px** do you still see the whole week, or does it scroll? (open a variant, resize the browser, judge)
2. **Information density** — Variant B shows task+farm per block, but short shifts (4h at 18px/hr = 72px) can't fit three lines. Does A's "just time" lose too much, or keep it clean?
3. **Tz awareness** — toggle tz in the toolbar. All four variants re-render blocks to the browser (or picked) tz, matching `toLocaleTimeString`. This is the pattern the real fix uses.
4. **Light vs dark** — toggle theme. Weekend shifts use amber; weekday shifts use green-wash. Does the contrast hold?
5. **The off state** — Tue and Sat are "Off". Which empty-state treatment reads as "no shift" without looking broken?
6. **Horizontal vs vertical preference** — Gantt (C) reads differently from day columns (A/B/D). C gives each day equal weight; A/B/D give each hour equal weight. Which matches how supervisors actually *read* a schedule?

## Out of scope for this sketch

- Drag-to-edit, create-by-drag — all blocks are read-only here, click just toasts.
- Multi-employee comparison (this is the per-employee detail row; cross-employee comparison stays in the main AG Grid).
- Overtime / break visualization — would layer onto the winner.
- Mobile narrow — 330px height assumption + 7 columns implies desktop/tablet only; a mobile variant is a separate sketch.
