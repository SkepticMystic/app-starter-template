# Patches

Applied by pnpm via `patchedDependencies` in `pnpm-workspace.yaml`. A patch is not
self-documenting and a stale one fails loudly at install time, so each gets an entry here
saying what it changes and what would tell you it is no longer needed.

Do not add commentary to the `.patch` files themselves — pnpm parses them as diffs, and
leading prose is not reliably ignored.

## `better-auth-paystack@3.2.1.patch`

**Type declarations only.** It touches exactly one file, `dist/index-UJFWzNlh.d.mts`, and
no runtime code at all. Eleven identical hunks, one per endpoint
(`initializeTransaction`, `createSubscription`, `upgradeSubscription`,
`cancelSubscription`, `restoreSubscription`, `verifyTransaction`, `listSubscriptions`,
`listTransactions`, `disablePaystackSubscription`, `enablePaystackSubscription`,
`getSubscriptionManageLink`), each narrowing the same declaration:

```ts
// upstream
use: (((getValue: (ctx: GenericEndpointContext) => string | string[]) => (inputContext: MiddlewareInputContext<MiddlewareOptions>) => Promise<void>) | ((inputContext: MiddlewareInputContext<MiddlewareOptions>) => Promise<unknown>))[];

// patched
use: ((inputContext: MiddlewareInputContext<MiddlewareOptions>) => Promise<unknown>)[];
```

Upstream types `use` as an array of _either_ a middleware **factory**
(`getValue => middleware`) **or** a middleware. That union looks like a mistyped
`createAuthMiddleware`-style helper leaking its factory signature into the array element
type; the patch drops the factory arm so `use` is a plain middleware array.

**When to revisit.** On any `better-auth-paystack` bump: re-resolve the patch, and if it
no longer applies, first check whether the union is simply gone upstream. To confirm the
patch is still earning its place, remove it, `pnpm install`, and run `pnpm check` — if
upstream has fixed the declaration, that stays green and the patch can go.
