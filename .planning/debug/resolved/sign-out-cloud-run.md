---
status: resolved
trigger: "Sign out on hosted Google Cloud Run redirects to home page instead of login page and keeps user logged in"
created: 2026-04-09T00:00:00Z
updated: 2026-04-09T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — passing full request.headers as response headers leaks request-only headers (Cookie, Host, Accept, User-Agent, etc.) into redirect responses, which can confuse Cloud Run's reverse proxy and/or prevent Set-Cookie headers from being honored
test: Replace request.headers passthrough with clean Headers containing only Set-Cookie values
expecting: Sign-out redirect to /auth/sign-in correctly clears cookies on Cloud Run
next_action: Deploy and verify on Cloud Run

## Symptoms

expected: Clicking sign out should redirect to /auth/sign-in and fully terminate the session
actual: On Cloud Run production, sign out redirects to home page (/) and user remains authenticated
errors: No known error messages — sign-out appears to succeed silently but doesn't clear session
reproduction: Deploy to Cloud Run, sign in, click sign out. User lands on home/dashboard instead of sign-in page.
started: Has never worked correctly on Cloud Run. Works fine on localhost:5173.

## Eliminated

- hypothesis: sign-out redirect does not propagate Set-Cookie headers at all (missing headers param)
  evidence: Previous fix added headers: request.headers to redirect() but issue persisted on Cloud Run
  timestamp: 2026-04-09

- hypothesis: auth change listener redirects to wrong URL
  evidence: Fixed to redirect to /auth/sign-in but issue persisted on Cloud Run
  timestamp: 2026-04-09

## Evidence

- timestamp: 2026-04-09T00:01:00Z
  checked: sign-out.ts action vs callback.tsx loader
  found: Both were passing headers: request.headers to redirect/data responses
  implication: The pattern of passing full request.headers to responses is used across the codebase

- timestamp: 2026-04-09T00:02:00Z
  checked: use-auth-change-listener.ts
  found: Line 61 now correctly redirects to /auth/sign-in. Line 74 reloads page on SIGNED_OUT event.
  implication: Auth listener is correct now

- timestamp: 2026-04-09T00:03:00Z
  checked: server-client.server.ts cookiesAdapter
  found: setAll() appends Set-Cookie to request.headers object. This is the mechanism all Supabase cookie mutations use.
  implication: Any action/loader that calls Supabase auth methods MUST extract Set-Cookie from request.headers for its response

- timestamp: 2026-04-09T01:00:00Z
  checked: react-router redirect() implementation + @react-router/express sendRemixResponse
  found: redirect() creates new Headers(request.headers) which copies ALL headers. sendRemixResponse iterates headers.entries() and calls res.append(key, value) for each. This means request-only headers like Cookie, Host, Accept, User-Agent become response headers.
  implication: On Cloud Run behind Google LB, having request-only headers (especially Cookie) in the response could confuse the proxy or cause it to strip/ignore Set-Cookie headers

- timestamp: 2026-04-09T01:01:00Z
  checked: sign-in.tsx loader
  found: Lines 17-22 check if user is authenticated and redirect to home if true. This explains BOTH symptoms — if cookies aren't cleared, the sign-in loader redirects right back to home.
  implication: The redirect-to-home behavior is caused by the sign-in loader finding a still-valid session, not by incorrect redirect URL

- timestamp: 2026-04-09T01:02:00Z
  checked: csrf create-csrf-protect.server.ts
  found: Line 67 uses request.headers.set('Set-Cookie', ...) which REPLACES all Set-Cookie headers (should use .append())
  implication: If CSRF runs after Supabase writes Set-Cookie to request.headers, it would overwrite them. Fixed to use .append()

- timestamp: 2026-04-09T01:03:00Z
  checked: Full Supabase SSR signOut flow (GoTrueClient._signOut -> _removeSession -> _notifyAllSubscribers -> applyServerStorage -> setAll)
  found: The entire chain is awaited. After await client.auth.signOut() completes, Set-Cookie headers are present on request.headers via the cookiesAdapter.setAll callback.
  implication: The Set-Cookie headers ARE being generated correctly; the issue is in how they're delivered to the browser

## Resolution

root_cause: The Supabase SDK's setAll()/getSetCookie() pipeline does not reliably propagate cookie-clearing Set-Cookie headers to the HTTP response on Cloud Run's Node.js runtime. Three separate attempts to fix the issue by extracting and passing Set-Cookie headers (via request.headers.getSetCookie()) all failed to clear cookies on Cloud Run production, though the headers were being generated correctly. The mechanism works on localhost but appears to have a runtime interaction with Cloud Run's Node.js environment or Google's load balancer.
fix: (Commit 47f8e20) Instead of relying on the SDK's setAll()/getSetCookie() mechanism, manually parse the incoming Cookie header for all `sb-*` cookies using a regex and emit explicit `Set-Cookie: <name>=; Max-Age=0; Path=/` headers to force the browser to delete them client-side. Also reverted callback.tsx and root.tsx to their original `headers: request.headers` pattern which was working for sign-in, to avoid overcomplicating the response header handling.
verification: Confirmed working on Cloud Run production. Sign-out now correctly redirects to /auth/sign-in and clears all Supabase auth cookies, preventing user re-authentication on redirect.
files_changed: [app/routes/auth/sign-out.ts, app/routes/auth/callback.tsx, app/root.tsx]
