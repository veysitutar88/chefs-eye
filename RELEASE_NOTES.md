# Chefs Eye — OSS staging release notes
2026-10-31 — **Local candidate, not yet public/released**

## Added or changed
- Email-based OTP account entry suitable for any email provider receiving messages.
- Server-side token verification and account-scoped order API / Gemini proxy.
- Redis per-user data namespace, atomic mutations and bounded create-only bulk.
- Safe account switching, per-account local data and explicit opt-in import of old drafts.
- Original unsafe Google callback and optional Google/Apple account links disabled.
- Automated fake-provider security/integration tests and setup documentation.

## Verified locally
`npm test` with exit code 0:
- 15 tests passed, 0 failed.
- TypeScript check passed.
- Vite production build passed (2,428 transformed modules).
- No live third-party credentials or customer data were used.

## Release remains blocked by
- Live OTP email/SMTP configuration and tests.
- Real Upstash account storage tests and end-to-end auth/security review.
- Explicit owner's approval of final software license, sample assets, trademark/logo rights.
- Privacy/data protection documentation and safe production migration plan.

Never deploy this staging copy over the existing Vercel site without separate approval.
