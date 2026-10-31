# Roadmap — portable Chefs Eye, personal cloud and teams

Status: **DRAFT — design and acceptance criteria only**, no cloud provider integration has been implemented.
Date: 2026-10-31. Owner: Ihor Hrumeza. Branch: `feature/personal-cloud-byos`.

## Product goal

Any chef or small catering business can open the hosted Chefs Eye web app or install its PWA, sign in with an account they control, and use orders, images, AI extraction, calendar, reports and exports **without borrowing the developer's Google account or manually creating a database**.

Support two distinct deployment/use modes:
- **Personal** (primary): one owner, their own local/private cloud workspace, portable backups and export. A registered app OAuth client handles consent; ordinary end users never paste provider client secrets.
- **Team** (later): a restaurant workspace with invitations and roles. Multiple people and devices can access shared restaurant orders; individual identities remain separate. Switching accounts on a shared tablet must wipe previous user's visible state, abort requests and never silently transfer drafts.

## Current verified baseline (2026-10-31)

- Email OTP via managed Supabase Auth; provider-agnostic email address.
- Express/Vercel server verification and per-identity Upstash Redis namespaces.
- Per-user local drafts, explicit legacy-draft import, protected AI proxy, print-to-PDF.
- 15 offline security/integration tests and production Vite build passed.
- **Not implemented:** Apple/Google social login, user-owned Google Drive/OneDrive storage, iCloud storage, CSV/XLSX file export, true multi-user team workspaces, in-app PDF upload to cloud, production provider configuration or data migration.
- Google/Apple linking intentionally disabled until a correct OAuth flow is available.

## Architecture decision to prepare

Separate four concepts and do not conflate them:
1. **Identity**: email OTP / optional Sign in with Google / Sign in with Apple.
2. **Workspace membership**: personal account or shared restaurant; explicit roles and tenant-level permissions.
3. **Storage adapter**: device-only, managed app sync, or user's connected cloud. The user's social login is **not** automatic permission to read/write their files.
4. **Export/notifications**: PDF, CSV, XLSX or email of a user-selected report, independent of canonical order storage.

Define a versioned `StorageAdapter` contract with capability detection (list/load/save/delete/attachments/backup), conflict-safe revisions and idempotent synchronization. Do not attempt to use Google Drive documents directly as a high-frequency multi-user database.

## Phase 1 — onboarding and provider separation (foundation)

- One first-run setup: **Personal / Team** (team can be marked upcoming) and **Device only / App sync / Connect personal cloud**.
- Account can use any email; optionally offer Google/Apple social sign-in only after verified provider registration, PKCE/state, redirect URI and token lifecycle security.
- Each connection clearly shows the provider, scopes and data location. Users can disconnect and export their data.
- Prevent data loss when changing providers: export a confirmed snapshot, review imports, and never silently overwrite a cloud target.
- Add offline tests for two distinct accounts on one tablet and account-switch session lifecycle.

## Phase 2 — bring your own storage (BYOS)

Implement providers separately and behind feature flags:
- **Google Drive:** narrow authorization scope, app-specific folder or user-visible Chefs Eye folder, explicit connect/disconnect, file versioning. Files belong to the user, not the developer.
- **Microsoft OneDrive:** dedicated app folder and Microsoft Graph authorization; support custom Microsoft/Outlook tenants only where approved scopes permit.
- **Apple iCloud:** **research spike first**. Apple ID login is not iCloud Drive permission. CloudKit may require Apple Developer configuration and may not provide browser-wide arbitrary iCloud Drive files. Do not claim iCloud is supported until a supported, tested web flow exists.
- **Universal fallback:** device export/import of encrypted (optional) versioned JSON backup, and PDF/CSV export without any connected provider.

Acceptance: a new user can connect their own cloud, create/edit an order, log in on a second device and recover it; provider token cannot read another user's files; revoked consent fails safely; offline changes are resolved without silent loss.

## Phase 3 — reports, exports, documents

- Keep browser print-to-PDF; add user-initiated PDF generation/save to selected cloud.
- Add CSV and XLSX export of filtered reports, with locale/time-zone-safe values; optional read-only spreadsheet integration is separate.
- Include original order images as cloud attachments only after explicit opt-in and privacy confirmation.
- No automatic emailing of customer data. Add optional notifications through an independent delivery provider if required.

## Phase 4 — restaurant/team collaboration

- Workspace ID **distinct from user ID**, invitation flow, roles (owner/manager/staff), authorization enforced server side on all API paths and storage keys.
- Shared tablet: explicit account switching, auto-lock, no inherited calendar/attachments between accounts.
- Audit trail and conflict resolution for edited orders. This is **not** done merely by multiple email accounts in one hosted app.

## AI operating costs

- Keep provider API keys server-side. One shared developer Gemini key is not a free unlimited resource.
- Add per-user and per-workspace quotas and transparent usage; evaluate optional bring-your-own-provider-key in secure server-side storage.
- Never expose provider secrets in the PWA or public repo.

## Privacy and release acceptance

- GDPR-oriented privacy, retention/export/delete flows, secrets and dependency checks, access-control audit.
- Independent staging email sender/Auth, Redis, and cloud test identities before deployment.
- No production migration of legacy orders without owner-approved backup and rollback.
- All provider switches tested with offline and interrupted transfers.
- Documentation must say plainly whether the mode is hosted service, self-hosted OSS, or offline PWA; users should not have to operate Redis merely to export PDFs.

## Related platform integration

Potential future API adapter for Chef's Mind AI / RestoAssistant. Keep Chefs Eye deployable and testable without that platform; build integration only after reviewing actual schemas and intellectual-property boundaries.

## Next PR slicing (substantive, testable work)

1. `feat(storage): adapter contract + local export/import` — versioned storage interface, mock provider and offline tests.
2. `feat(cloud): Google Drive connection + personal account backup` — OAuth consent, scoped app folder, token lifecycle, real integration tests on sandbox accounts.
3. `feat(cloud): OneDrive provider` — separate approval, tests.
4. `feat(team): workspace memberships and roles` — isolated team access and shared tablet security.
5. `feat(export): CSV/XLSX + explicit PDF cloud save` — file content verification and locale tests.

Roadmap branch deliberately contains **no feature implementation**; do not merge as proof that BYOS exists.
