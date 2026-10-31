# Chefs Eye security and publication review — updated 2026-10-31

Scope: isolated staging code only. No real identity-provider account, real email delivery, live Redis instance, production deployment, credential reads, or penetration test.

## Previously identified issues — locally addressed

1. **Unauthorized order CRUD:** shared Express/Vercel handlers now require server-verified Supabase Bearer identity; per-user Redis hashes and input validation enforce order isolation. Mocked tests check 401 and two-user access.
2. **Google callback token transfer:** legacy OAuth callback returns 410; optional Google/Apple account linking disabled. Internal calendar view remains; future OAuth linking needs proper PKCE/state/origin protection.
3. **Shared browser data:** per-account local storage and abort-on-account-switch lifecycle; explicit review/import for legacy drafts. No automatic import into another account.
4. **AI abuse:** authenticated Gemini proxy, account-scoped request limiter tested with fake provider.

These improvements are verified in tests, **not certified against production threats**.

## Blocking release gates

- Configure and test actual Supabase email OTP delivery, email templates, expiry, anti-abuse policies and account lifecycle.
- Configure a non-production Redis database and test live atomic scripts, scoped reads/writes and session expiration.
- Review account deletion, data export/retention, privacy disclosures and personal-data processing before accepting restaurant/customer orders.
- Review potential auth/network bypasses, cross-site origin/CORS behavior, provider throttling and production failure modes with a dedicated security review.
- Verify rights to logos, trademark and any third-party files; audit dependencies and secrets before creating a public Git repository.
- Plan a separate owner-approved migration of legacy orders and backups. Do not read global legacy Redis keys automatically.

## Verification

Independent local `npm test` on 2026-10-31: **15/15 automated offline tests**, TypeScript check passed, Vite production build passed. A large JS chunk warning remains. No live infrastructure was contacted.

## Scope

Staging copy: `C:\Projects\OSS-Release-Staging-2026-10-30\chefs-eye`.

Original local project: `C:\Projects\chef's-eye---order-manager` — unchanged.

**Public deployment / GitHub push: NOT PERFORMED.**
