# Chefs Eye — Multimodal Restaurant Order Manager

**Open-source candidate snapshot — local development only. Not approved for public deployment.**

A browser/PWA restaurant order manager for image, voice, text and manual order intake, AI-assisted parsing, scheduling, cancellation, printable/PDF-friendly output and offline drafts.

## Authentication and storage

This staging version supports **email OTP via Supabase Auth**. Users sign in with a deliverable email address from any provider; they do **not** need a Google account.

- Auth identity: managed email OTP with six-digit codes, configurable via your own Supabase project.
- Persistent order store: optional Upstash Redis with data isolated by verified user ID.
- Local drafts: per-account caches; guests can work locally. Legacy drafts are imported only after explicit review and selection.
- Google Drive/Calendar and Apple sign-in: **disabled** pending separate secure integration. The internal calendar view remains available.
- Gemini processing requires authenticated API access and account-scoped throttling.

## Stack

React 19, TypeScript, Vite, Tailwind, Express / Vercel serverless, Supabase Auth and optional Upstash Redis.

## Run locally

1. Node.js 22+ and npm 10+.
2. `npm ci` to install dependencies.
3. Review [docs/LOCAL_AUTH_SETUP.md](docs/LOCAL_AUTH_SETUP.md), then configure your own non-production Supabase and Redis variables outside Git. Without provider configuration, protected requests fail closed.
4. `npm run dev` starts the local Express/Vite application.
5. `npm test` runs 15 offline automated cases, TypeScript lint and Vite production build. `npm run test:unit` runs only the security tests.

## Local validation

2026-10-31, through DescMCP: `npm test` **passed** (15/15 tests, TypeScript successful, Vite build successful). No live emails, Redis, real-user sessions or third-party resources were exercised.

See [SECURITY_REVIEW.md](SECURITY_REVIEW.md), [ARCHITECTURE_AFTER.md](ARCHITECTURE_AFTER.md), and [RELEASE_NOTES.md](RELEASE_NOTES.md) for open gates.

## License

MIT license candidate for the project's original code, subject to ownership and third-party dependency/asset checks before public release. Icons and trademarks may have separate rights.

The source project, its live Vercel deployment, customer data and original Git history are not part of this isolated workspace.
