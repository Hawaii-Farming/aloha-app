---
status: diagnosed
trigger: "Mobile drawer has no discoverable way to close — missing explicit X button inside drawer panel (UAT Test 8)"
created: 2026-04-10
updated: 2026-04-10
---

## Current Focus

hypothesis: WorkspaceMobileDrawer renders no header row and no close button — only a scrollable nav body. Users in focus-mode testing have no visible affordance to close.
test: Read workspace-mobile-drawer.tsx end-to-end and enumerate every child of motion.nav.
expecting: Confirm absence of any Button/X/close element inside motion.nav.
next_action: Return ROOT CAUSE FOUND diagnosis; no fix (goal: find_root_cause_only).

## Symptoms

expected: Mobile drawer must have a discoverable way to close — specifically an explicit close (X) button inside the drawer panel, in addition to backdrop tap and Escape.
actual: No in-drawer close affordance. User reports "no way to close drawer" during UAT Test 8. Test 6 (backdrop/Escape paths) passed, so those work — but nothing inside the drawer signals "close".
errors: None.
reproduction: UAT Test 8 — tap hamburger at ≤768px, drawer slides in, visually scan inside drawer for a close button. None present.
started: Phase 9 UAT, 2026-04-10 (component created in Plan 09-03, commit 71fa0b8).

## Eliminated

(none — diagnosis is direct from source read)

## Evidence

- timestamp: 2026-04-10
  checked: app/components/workspace-shell/workspace-mobile-drawer.tsx (full file, lines 1–96)
  found: motion.nav panel (lines 68–91) contains exactly ONE direct child — a single <div ref={firstNavRef} className="mt-1 flex-1 overflow-y-auto px-3 py-2"> that holds <ModuleSidebarNavigation forceExpanded>. There is NO header row, NO close button, NO X icon, NO lucide-react X import, no Button import. The drawer opens flush to the top with nav links only.
  implication: The drawer literally has no visible close affordance. The only close paths are (a) tap backdrop outside panel, (b) press Escape, (c) tap a nav link (auto-close via onNavigate). None of these are discoverable by looking AT the drawer.

- timestamp: 2026-04-10
  checked: 09-03-SUMMARY.md "What Shipped" section + Verification checklist
  found: Plan 09-03 intentionally shipped "focus-on-open + focus-return-on-close only" and deferred full focus trap to Phase 10. The plan's drawer body spec was "renders <ModuleSidebarNavigation forceExpanded>" — the plan never specified a header row or close button inside the panel. This is a plan gap, not an implementation regression.
  implication: The missing close button was never in the plan. Adding it is a small additive fix (no refactor, no prop changes).

- timestamp: 2026-04-10
  checked: 09-UAT.md Test 6 vs Test 8
  found: Test 6 (Mobile Drawer Open/Close via backdrop+Escape) = PASS. Test 8 (a11y focus behavior) = ISSUE "no way to close drawer". The user's backdrop+Escape paths work mechanically; the failure is purely discoverability — in focused UAT the tester didn't look for the backdrop or try Escape and saw no button.
  implication: This is a UX/a11y discoverability gap. The fix is additive: render a Button with an X icon inside a new header row at the top of motion.nav, wired to onClose.

## Resolution

root_cause: app/components/workspace-shell/workspace-mobile-drawer.tsx does NOT render any close button or header row inside motion.nav. The panel's only direct child is the scrollable nav <div>, so there is no visual close affordance even though onClose is already available as a prop and wired to backdrop click + Escape. What IS in the drawer's "header area" currently: nothing — the nav list starts flush at the top of the panel (with only mt-1 spacing). The component already imports nothing from lucide-react and does not import Button.

fix: (not applied — diagnose-only mode)

Direction: Add a header row as the FIRST direct child of <motion.nav> (before the existing <div ref={firstNavRef}>). The row should be a flex container (e.g. `flex h-14 shrink-0 items-center justify-between border-b border-border px-3`) containing optionally an AlohaLogoSquare/wordmark on the left and a Button on the right: `<Button variant="ghost" size="icon" onClick={onClose} aria-label="Close navigation menu" data-test="workspace-mobile-drawer-close"><X className="size-5" /></Button>`. Imports to add: `X` from `lucide-react`, `Button` from `@aloha/ui/button`. The existing `firstNavRef` focus target will still resolve to the first `a, button` under the nav <div>, so focus-on-open behavior is unchanged (the close button is in a sibling container, not inside firstNavRef). No prop changes, no state changes, no Phase 9 plan rework.

verification: (not applied)
files_changed: []
