# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## sign-out-cloud-run — Sign out fails on Cloud Run: redirects to home instead of sign-in and keeps user logged in
- **Date:** 2026-04-09
- **Error patterns:** sign-out, redirect, authentication, Cloud Run, Set-Cookie, cookies not cleared, session not terminated
- **Root cause:** The Supabase SDK's setAll()/getSetCookie() pipeline does not reliably propagate cookie-clearing Set-Cookie headers to the HTTP response on Cloud Run's Node.js runtime
- **Fix:** Manually parse incoming Cookie header for all `sb-*` cookies and emit explicit `Set-Cookie: <name>=; Max-Age=0; Path=/` headers to force browser deletion. Revert response headers to original `headers: request.headers` pattern (works for sign-in).
- **Files changed:** app/routes/auth/sign-out.ts, app/routes/auth/callback.tsx, app/root.tsx
---
