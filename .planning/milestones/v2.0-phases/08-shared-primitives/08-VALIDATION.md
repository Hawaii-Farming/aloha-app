---
phase: 8
slug: shared-primitives
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 8 is a visual restyle of 8 shadcn primitives. Automated verification
> covers typecheck + lint (diff-local correctness). Visual correctness is
> manually smoke-tested; automated visual regression is Phase 10 (DARK-02).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler + ESLint (no new test framework) |
| **Config file** | `tsconfig.json`, `eslint.config.mjs` (present) |
| **Quick run command** | `pnpm typecheck` |
| **Full suite command** | `pnpm typecheck && pnpm lint` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck`
- **After every plan wave:** Run `pnpm typecheck && pnpm lint`
- **Before `/gsd-verify-work`:** Full suite must be green + manual smoke checklist must be walked on both themes
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | PRIM-02 | — | N/A (pure style) | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 1 | PRIM-04 | — | N/A (pure style) | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |
| 08-03-01 | 03 | 2 | PRIM-01 | — | N/A (pure style) | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |
| 08-04-01 | 04 | 2 | PRIM-05 | — | N/A (pure style) | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |
| 08-05-01 | 05 | 3 | PRIM-03 | — | N/A (pure style) | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |
| 08-05-02 | 05 | 3 | PRIM-03 | — | N/A (pure style) | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |
| 08-05-03 | 05 | 3 | PRIM-03 | — | N/A (pure style) | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |
| 08-06-01 | 06 | 3 | PRIM-06 | — | N/A (pure style) | typecheck+lint | `pnpm typecheck && pnpm lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs above are provisional — planner may renumber when producing PLAN files. Framework is tsc/eslint — no new test files introduced.*

---

## Wave 0 Requirements

- [x] `tsconfig.json` — already present
- [x] `eslint.config.mjs` — already present
- [x] No new framework install required

Existing infrastructure covers all phase requirements — no Wave 0 scaffolding needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Button primary renders green-500→emerald-600 gradient with `shadow-green-500/25` in both themes | PRIM-01 | Visual only — automated visual regression is Phase 10 | Load `/auth/sign-in` in light + dark; inspect primary Sign In button; confirm gradient fill + soft green shadow |
| Card surface renders rounded-2xl, border-border, soft shadow | PRIM-02 | Visual only | Load any HR module list route; inspect the list card shell in light + dark |
| Input/Textarea/Select render 16px text, rounded-2xl, py-3, green ring on focus | PRIM-03 | Visual only; focus ring contrast is §9.1 remediation target | Load `/auth/sign-in` email+password; tab through fields; confirm green ring is clearly visible in both themes |
| Badge pill variants render correct semantic colors | PRIM-04 | Visual only | Load an HR list route that renders status badges via `StatusBadgeRenderer`; confirm success/warning/info/destructive pills |
| Avatar initials render on gradient fallback at sm/md/lg sizes | PRIM-05 | Visual only | Load workspace header avatar (md default); inspect. Optionally mount a storybook demo of sm/lg if time permits |
| CRUD Sheet renders `rounded-l-2xl` leading corner, `bg-card` surface, `shadow-xl` | PRIM-06 | Visual only; depends on existing CRUD `create-panel.tsx` / `edit-panel.tsx` callers | Open any HR list route, click "Add" to open create sheet; confirm leading-corner radius + surface + form field spacing |
| next-themes toggle light ↔ dark does not regress any of the above | DARK-02 (partial) | Phase 10 owns full audit — this is a smoke pass | Toggle theme on each of the 5 smoke routes; confirm no layout breakage, no unreadable text, gradient stays vivid |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (typecheck + lint) — no task goes 3 deep without a sample
- [x] Sampling continuity: typecheck runs after every task commit
- [x] Wave 0 covers all MISSING references (none — infrastructure present)
- [x] No watch-mode flags (`tsc --noEmit` one-shot, `eslint` one-shot)
- [x] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter — set by planner once PLAN files are written

**Approval:** pending
