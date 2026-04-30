---
title: AppSheet Scripts Migration — Open Questions
date: 2026-04-29
status: pending team input
---

# Open Questions — AppSheet Scripts Migration

Captured during `/gsd-explore` 2026-04-29. Pending team discussion before milestone planning.

## Q1 — Cron / scheduled work mechanism (BLOCKING milestone planning)

**Question:** Where does scheduled work run, and what triggers it?

**Options:**
1. **pg_cron + pg_net → RR7 endpoints** — cron lives in DB, calls Node when needed for PDF/email/transforms
2. **Cloud Scheduler → Cloud Run (RR7)** — cron lives outside DB, hits authenticated endpoints
3. **Supabase Edge Functions (Deno) with built-in cron** — modern but no Chromium (rules out Puppeteer)
4. **GitHub Actions scheduled workflows** — CI as cron, hits prod endpoints

**Tradeoffs:**
- pg_cron: zero new infra; logic split between SQL and HTTP target
- Cloud Scheduler: clean separation; new GCP surface to manage
- Edge Functions: native Supabase; loses PDF generation venue
- GHA: free; not designed for production cron, opaque to ops

**Cascades to:** Q2 (where does business logic live), Q3 (PDF venue), Q5 (email transport)

## Q2 — Business logic location (SQL vs TS service)

**Question:** Do payroll computation, schedule rolling, and comparison run as SQL views/functions or as a TypeScript transformation service?

**Tradeoffs:**
- SQL: faster, deterministic, pgTAP testable, no network hop. Harder to debug regex/string parsing (WC/TDI extraction).
- TS service: easier debugging, npm libs available, integrates with RR7 patterns. Slower for large joins, network overhead.

**Likely hybrid:** SQL for joins/aggregations, TS for parse/normalize on ingest.

## Q3 — PDF generation strategy

**Question:** Puppeteer (Chromium) vs React-PDF vs HTML-only emails (no PDF)?

**Constraints:**
- Edge Functions = no Chromium
- RR7 server (Cloud Run) = full Chromium possible but inflates container
- React-PDF = pure JS, smaller deploy, less fidelity

## Q4 — HRB ingest UX

**Question:** How does payroll data enter the system?
- File upload (CSV/XLSX) parsed in browser or server → staging table
- Direct paste into a textarea/grid
- API import from HRB if accessible
- Maintain Google Sheet → webhook on edit

## Q5 — Email provider

**Question:** Reuse existing Aloha mailer (`MAILER_PROVIDER` env var, nodemailer/resend already wired) or pick a new one?

**Recommendation pending confirmation:** reuse existing — no need for new vendor.

## Q6 — Schedule rolling model

**Question:** Append-only scheduled job that clones rows +7 days, OR computed view that derives next week from current week's pattern?

**Tradeoffs:**
- Append-only: matches legacy mental model, allows next-week edits before rollover
- Computed view: zero state to manage, but can't be edited (would need an overlay table for exceptions)

## Q7 — Quarterly review trigger

**Question:** pg_cron monthly check filtering Feb/May/Aug/Nov, or RR7 cron-equivalent?

**Note:** Anti-join logic is pure SQL. Strong candidate for fully in-DB execution.

---

**Next step:** team review of Q1 (gates the rest), then resume `/gsd-explore` to crystallize remaining gray areas before `/gsd-new-milestone`.
