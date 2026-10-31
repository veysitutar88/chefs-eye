# Chefs Eye — post-refactor architecture (staging only)
Checkpoint: 2026-10-31.

## Before
Single-user React app with shared `chef_orders` browser storage, global `chef_order_ids` Redis list, independently implemented local Express JSON storage, unauthenticated order CRUD and Gemini proxy, and a Google OAuth callback transferring an access token across windows.

## After
- UI: `AuthShell` + `AccountPanel` + `authService`: Supabase managed email OTP login, restored session, sign-out and scoped app lifecycle.
- Server identity: `lib/auth.ts` verifies a Bearer token using `supabase.auth.getUser`, requires confirmed non-anonymous email identity and validates origin. No trust in a client-provided owner ID.
- API: Vercel endpoints and local Express share the same guarded handlers. Unauthenticated operations yield 401. The Gemini endpoint consumes an account-scoped rate-limiter slot before contacting a provider.
- Data: `lib/data.ts` uses `ce:v2:user:<verified-user-id>:orders` Redis hashes, atomic Lua revisions/bulk validation and user-scoped AI limits. Legacy global keys intentionally remain untouched.
- Browser: per-account local order/images caches, abortable requests and isolation on account changes. Explicit draft review/import; no automatic cross-account transfer.
- Google/Apple login connectors: disabled rather than leaving the insecure legacy callback accessible. The internal calendar is separate from Google Calendar.

## Local test evidence
`npm test`: 15/15 test cases passed; `tsc --noEmit` passed; `vite build` passed using DescMCP outside the Codex sandbox on 2026-10-31. This is an offline integration check, not proof of live identity/mail/Redis readiness.

## Remaining risks and boundaries
- External SMTP delivery, OTP provider configuration, lifecycle validation, and live Redis have not been configured or tested.
- Review privacy rights, consent, deletion/export procedures, logs, rate-limit deployment behavior and tenant provisioning for a genuine multi-tenant public service.
- Calendar/Drive and Apple sign-in disabled pending separate secure integrations.
- Bundle warning: one generated JS bundle >500 KB.
- Production data migration must be a distinct opt-in operation; importing legacy global Redis keys automatically is prohibited.
- Original repo `C:\Projects\chef's-eye---order-manager` and deployed Vercel app have not been modified.
