# Codebase Concerns

**Analysis Date:** 2026-03-07

---

## Tech Debt

**Better-Auth Experimental Joins Disabled:**

- Issue: `experimental.joins` is `false` in `src/lib/auth.ts` with a TODO comment "Enable once BA support drizzle 1.0"
- Files: `src/lib/auth.ts:68-69`
- Impact: Better-Auth falls back to multiple separate queries instead of JOINs. This means session/user lookups hit the database more often than necessary. The Drizzle ORM and Drizzle Kit are already pinned to beta (`1.0.0-beta.12-a5629fb`) — enabling joins is blocked until Better-Auth officially supports Drizzle 1.0.
- Fix approach: Monitor Better-Auth releases; once they drop Drizzle 1.0 support, set `joins: true` and remove the TODO.

**Beta/Pre-Release Dependencies:**

- Issue: Both `drizzle-orm` and `drizzle-kit` are pinned to a specific beta commit hash (`1.0.0-beta.12-a5629fb`), not a stable version. `vite` is also on `8.0.0-beta.16`.
- Files: `package.json:56,87,93,119`
- Impact: Beta packages can introduce breaking changes without semver guarantees. The pinned commit hash approach prevents automatic patch fixes. Vite 8 beta especially is the core build tool.
- Fix approach: Track beta release notes. Once stable versions ship, upgrade and pin to semver ranges. Consider setting a reminder or dependency bot alert.

**Commented-Out Code:**

- Issue: `update_api_key_remote` is fully implemented but entirely commented out. Image AI moderation logic is stubbed and commented out. Footer has commented-out "About" and "Legal" link sections with TODO markers.
- Files: `src/lib/remote/auth/apikey.remote.ts:31-60`, `src/lib/server/services/image/image.service.ts:67-80`, `src/lib/components/blocks/footer/FooterBlock.svelte:26-37`
- Impact: Dead code clutters the codebase and creates confusion about intended behavior. The API key update function may be needed but has no clear timeline.
- Fix approach: Either delete commented code (rely on git history) or create tracking issues. The API key update should be fully removed or implemented.

**Organization Deletion: No Active Org Fallback:**

- Issue: When a user deletes their active organization, the session is patched to null org fields, but there is no mechanism to set the next available organization as active. The TODO comment at `organization.service.ts:98-101` acknowledges this.
- Files: `src/lib/server/services/auth/organization/organization.service.ts:88-113`
- Impact: Users who belong to multiple organizations and delete one are left in a "no active org" state with no UI guidance to select another. Depending on how the app guards routes, this could cause confusing error states.
- Fix approach: After deleting an org, query for the user's next membership and call `SessionService.patch` with that org's data. Add a "select organization" capture page for users with no active org.

**Organization Slug Collision Risk:**

- Issue: Organization slugs are generated with `generateRandomString(8, "a-z", "0-9")` — an 8-character alphanumeric string (36^8 ≈ 2.8 trillion combinations). Collision is handled by catching a `ORGANIZATION_SLUG_ALREADY_TAKEN` error, but there is no retry loop.
- Files: `src/lib/server/services/auth/organization/organization.service.ts:37`
- Impact: If a collision occurs, organization creation fails with an error surfaced to the user even though it's a system issue. Very low probability currently, but no graceful retry.
- Fix approach: Wrap slug generation in a retry loop (max 3 attempts) before surfacing an error.

---

## Security Considerations

**Session Cookie Cache: Stale Authorization Data:**

- Risk: Session data including `org_id`, `member_id`, `member_role`, and `active_plan` is stored in a cookie cache with a 5-minute TTL (`cookieCache.maxAge: 5 * 60`). `storeSessionInDatabase` is `false`. If a user's role is changed, their org is deleted, or their subscription is canceled, the cached session continues to report the old values for up to 5 minutes.
- Files: `src/lib/auth.ts:89-93`, `src/app.d.ts:22`
- Current mitigation: Subscription cancellation is lazily checked in `SubscriptionService.get_active` when `cancelAtPeriodEnd` and `periodEnd` are in the past. Role changes have no mitigation.
- Recommendations: For high-stakes authorization (admin actions, owner-only operations), consider calling `auth.api.getSession` with fresh headers rather than relying on the cached `locals.session`. Evaluate if 5 minutes is acceptable given the authorization model.

**Rate Limiting: Only Applied to Contact Form:**

- Risk: The `RateLimiter` class (`src/lib/server/services/rate_limit/rate_limit.service.ts`) is only used in `src/lib/remote/contact/contact.remote.ts`. All other remote functions (auth, API key creation, image upload, subscription, transaction) rely solely on Better-Auth's built-in rate limiting for auth endpoints. Non-auth remote functions have no explicit application-level rate limiting.
- Files: `src/lib/remote/contact/contact.remote.ts:7-39`, `src/lib/remote/image/image.remote.ts`, `src/lib/remote/tasks/tasks.remote.ts`
- Current mitigation: Better-Auth applies rate limiting to its own API endpoints. Vercel may apply edge-level limits.
- Recommendations: Apply `RateLimiter` to image upload and other mutation remotes, especially those that trigger external API calls (Cloudinary, R2).

**API Key Per-Key Rate Limiting Disabled:**

- Risk: The Better-Auth API key plugin supports per-key `rateLimitEnabled`, `rateLimitMax`, and `rateLimitTimeWindow` fields. These are commented out in both `create` and a secondary call in `apikey.service.ts`.
- Files: `src/lib/server/services/auth/apikey/apikey.service.ts:46-48,112-114`
- Current mitigation: Organization-level secondary storage (Redis) is configured for Better-Auth rate limiting.
- Recommendations: Evaluate enabling per-key rate limiting for API keys used in production integrations. At minimum, document the decision.

---

## Performance Bottlenecks

**Unbounded Admin List Queries:**

- Problem: Admin pages query all users and all organizations from the database with no pagination, limit, or cursor.
- Files: `src/routes/(authed)/admin/users/+page.server.ts:14-18`, `src/routes/(authed)/admin/organizations/+page.server.ts:14-30`
- Cause: Simple `db.query.user.findMany` and `db.query.organization.findMany` with only an `orderBy` clause.
- Improvement path: Add server-side pagination (cursor or offset-based). The TanStack Table component already supports pagination state — wire it to a paginated server load or query parameter approach.

**Session Create Hook: Synchronous Subscription Lookup:**

- Problem: Every session creation triggers `get_active_org` which sequentially queries for a member record and then a subscription record (`SubscriptionService.get_active`). This runs synchronously in the session create hook, adding 2 DB round-trips to every sign-in.
- Files: `src/lib/auth.ts:131-146`, `src/lib/auth.ts:393-443`
- Cause: The `active_plan` field is eagerly fetched during session creation to be embedded in the cookie.
- Improvement path: Consider parallelizing both queries with `Promise.all`. Accept that `active_plan` may be slightly stale and verify it server-side only on subscription-gated routes rather than on every login.

**Image Upload: Sequential Sharp Processing:**

- Problem: In `image.service.ts`, `ImageHostingService.upload` and `ThumbhashService.generate` are called with `Promise.all`, but the image buffer must be fully loaded into memory first (`await input.file.arrayBuffer()`). For large files this consumes significant memory in the Vercel serverless function.
- Files: `src/lib/server/services/image/image.service.ts:56-66`
- Cause: Vercel serverless memory limits apply; large images may cause OOM or cold start issues.
- Improvement path: Enforce `IMAGE_HOSTING.LIMITS.MAX_FILE_SIZE_BYTES` early (already done), but also consider streaming uploads directly to R2/Cloudinary rather than buffering in-process.

---

## Fragile Areas

**SvelteKit Experimental Remote Functions:**

- Files: `svelte.config.ts:9`, all files in `src/lib/remote/`
- Why fragile: `remoteFunctions: true` is marked as experimental in SvelteKit. The API (using `form()`, `query()`, `command()` from `$app/server`) is subject to breaking changes before stable release.
- Safe modification: Any change to remote function signatures requires updating both the server handler and the client call site. Test thoroughly after SvelteKit updates.
- Test coverage: None — no integration or unit tests for remote function handlers.

**Svelte 5 Async Components:**

- Files: `svelte.config.ts:16` (`compilerOptions.experimental.async: true`)
- Why fragile: Async components are an experimental Svelte 5 feature. Changes to this feature in Svelte releases could break any component using top-level `await` in markup.
- Safe modification: Check Svelte release notes before upgrading. Identify which components depend on this feature.
- Test coverage: No tests for async component behavior.

**Custom Session Fields Require Manual Invalidation:**

- Files: `src/lib/auth.ts:95-125`, `src/lib/server/services/auth/session/session.service.ts`
- Why fragile: `org_id`, `member_id`, `member_role`, `active_plan` are custom fields injected into the session cookie at creation time. If organization membership, roles, or subscriptions change, the session must be manually patched via `SessionService.patch`. Missing a patch call leaves the session stale.
- Safe modification: Whenever org membership, roles, or subscriptions change, always call `SessionService.patch` with the updated values. Currently patches happen in `OrganizationService.create`, `owner_delete`, and `InvitationService`. Verify all mutation paths that change membership or role include a patch.
- Test coverage: None.

**Third-Party Paystack Plugin (Unofficial):**

- Files: `src/lib/auth.ts:12`, `package.json:104`
- Why fragile: `@alexasomba/better-auth-paystack` is an unofficial community plugin (not from the Better-Auth org). It is pinned to `^1.2.1`. Breaking changes in Better-Auth core could silently break this plugin without a coordinated release.
- Safe modification: Pin the exact version. Review plugin source for any pending issues. Consider vendoring or forking if it becomes a maintenance risk.
- Test coverage: None for subscription flows.

**Drizzle Relations Config:**

- Files: `src/lib/server/db/relations.ts`
- Why fragile: The Drizzle 1.0 beta relations API is not the same as the stable 0.x API. The current pinned commit may behave differently from future betas or the final 1.0 release.
- Safe modification: Avoid relying on complex relational queries until Drizzle 1.0 is stable. Test all `with:` joins after any Drizzle version bump.

---

## Test Coverage Gaps

**No Tests for Server-Side Business Logic:**

- What's not tested: All service files (`src/lib/server/services/**`), repository wrappers (`src/lib/server/db/repos/**`), remote functions (`src/lib/remote/**`), and route load functions (`src/routes/**`).
- Files: `src/lib/server/services/`, `src/lib/remote/`, `src/routes/`
- Risk: Auth flows, subscription state transitions, organization management, and API key operations could regress silently. The `Repo` wrapper's error mapping (e.g. duplicate key detection) is untested.
- Priority: High

**No Integration Tests for Auth Flows:**

- What's not tested: Sign-up, email verification, password reset, passkey registration, OAuth callbacks, 2FA enable/disable, organization invitation accept/reject.
- Files: `src/lib/remote/auth/`, `src/routes/(marketing)/auth/`
- Risk: Auth is the core security boundary. A regression in email verification bypass or session creation could go undetected.
- Priority: High

**Existing Tests Cover Only Pure Utilities:**

- What's not tested: Only utility functions (`array`, `result`, `guard`, `json`, `dates`, `strings`, `format`, `urls`) have tests — 653 lines total against ~8,900 lines of source.
- Files: `src/lib/utils/*.test.ts`
- Risk: ~7% test coverage estimate. All business logic, data access, and HTTP handling is untested.
- Priority: High

---

## Missing Critical Features

**No Privacy Policy / Terms of Service Pages:**

- Problem: Footer has "Legal" section commented out with TODO — no `/legal/privacy` or `/legal/terms` routes exist.
- Files: `src/lib/components/blocks/footer/FooterBlock.svelte:30-37`
- Blocks: Required for any user-facing production deployment, especially given email collection and payment processing.

**No "About" Page:**

- Problem: Footer "About" section's "Our Mission" link is commented out with TODO.
- Files: `src/lib/components/blocks/footer/FooterBlock.svelte:26-29`
- Blocks: Non-critical but expected for a production marketing site.

**No Sitemap Dynamic Content:**

- Problem: `src/routes/sitemap.xml/+server.ts` has a commented-out `db.query.task.findMany` block — dynamic routes are not included in the sitemap.
- Files: `src/routes/sitemap.xml/+server.ts:9`
- Blocks: SEO for user-generated or public content pages.

---

## Logging Issues

**Console Statements in Production Code:**

- Issue: Multiple `console.log`, `console.warn`, and `console.error` calls exist in non-test production code. The project uses Pino (`Log`) for structured logging, making these inconsistent and potentially noisy in production.
- Files:
  - `src/routes/+layout.svelte:25` — `console.log("$session loaded", $session.data)` (logs session data client-side)
  - `src/routes/(authed)/settings/api-key/create/+page.svelte:40` — `console.log(res)`
  - `src/routes/(marketing)/contact/+page.svelte:26,35` — `console.log` in catch blocks
  - `src/lib/clients/index.client.ts:82,88` — `console.log` in error handlers
  - `src/lib/clients/auth/user.client.ts:37` — `console.error`
  - `src/lib/components/form/authenticate/CredentialSigninForm.svelte:31` — `console.log` logs sign-in result
- Impact: Session data logged client-side is a minor info disclosure risk. Inconsistent with structured logging approach.
- Fix approach: Replace with `Log.*` calls server-side; remove debug `console.log` from client components before production.

---

_Concerns audit: 2026-03-07_
