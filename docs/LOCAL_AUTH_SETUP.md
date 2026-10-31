# Chefs Eye — local email login and storage setup
Checkpoint: 2026-10-31. Prepared for the isolated OSS staging copy; **not** deployed.

## What users see
Enter any deliverable email address (Gmail, Outlook, GMX, WEB.DE, private domain), request a six-digit one-time code, enter it, and access the orders belonging to that account. No Google identity or Drive account is required. The email account is an *identity*; messages are not the order database.

## Provider setup (owner/admin, not end users)
1. Create your own Supabase project for **Auth**, outside this offline development task. Enable email OTP/passwordless sign-in and confirm the email template delivers a six-digit code rather than only a magic link. Configure a legitimate SMTP sender/service and domain as required by your production email volume. Set appropriate OTP expiry, throttling, and anti-abuse settings in the provider.
2. In Vercel and/or the local server supply these **names**, with values created in your private environment (never commit values):
   - Browser public: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - Server: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `APP_ORIGIN` (exact web origin).
   - Persistent orders: `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Upstash Redis).
   - Optional AI parsing: `GEMINI_API_KEY`.
3. Supabase public/publishable credentials are **not** server admin keys. Never expose SMTP credentials, Redis tokens or Supabase service-role/secret keys to the browser. Only the `VITE_` public values belong in a client bundle.
4. Set up separate development/test resources and a test email domain/inbox. Do not connect the OSS staging copy to production customer data.

## Local verification
- Node 22+ and npm 10+.
- `npm ci`
- `npm run test:unit` — local fake providers and fake Redis, no real service calls.
- `npm test` — unit tests, TypeScript and Vite build.
- `npm run dev` — local UI. Without Supabase configuration, the application shows not-configured/guest mode and protected network requests fail closed; this is intentional.

## Optional integrations
- Existing internal calendar view is available for orders. **Google Calendar and Google Drive account linking are intentionally disabled** until a separate secure PKCE/state/origin-verified connection flow is implemented.
- There is **no** requirement for Gmail, and no default forwarding of orders to any mailbox. If email notifications are later added, make them opt-in, use a dedicated sender service, and apply personal-data minimization.

## Migration / data
- Old global Redis keys are not read. Do not migrate or overwrite them automatically.
- Anonymous/legacy local drafts are retained on the device and copied to an account only after the user opens the import review and explicitly selects drafts.
- This version does not contain a validated production migration tool. Back up the old production data independently and plan a verified, owner-approved migration before switching the live site.

## Release gates
Server-side authorization, per-user isolation and AI credit throttling have offline tests, but **live Supabase email delivery, real Redis operations, production OAuth, PWA cross-device behavior and security penetration testing have NOT been verified**. Real-world use is blocked until those checks and privacy/data-deletion requirements are handled.
