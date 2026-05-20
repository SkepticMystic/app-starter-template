/**
 * Test helpers for service tests.
 *
 * Provides utilities for mocking raw Drizzle query chains (used by services
 * that bypass Repo for atomic UPDATE ... RETURNING patterns) and factory
 * functions for common test data shapes.
 */

import { getRequestEvent } from "$app/server";
import { vi } from "vite-plus/test";

/**
 * Creates a chainable mock that mimics a Drizzle query builder.
 * The final `.returning()` or last chained call resolves to `resolvedValue`.
 *
 * Usage:
 *   vi.mocked(db.update).mockReturnValue(mockDbChain([{ id: 'x' }]));
 */
export function mockDbChain(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "from",
    "set",
    "where",
    "returning",
    "values",
    "leftJoin",
    "orderBy",
    "execute",
    "limit",
    "offset",
    "groupBy",
  ];
  for (const method of methods) {
    chain[method] = (..._args: unknown[]) => chain;
  }
  // Make it thenable — Drizzle queries are awaitable
  // oxlint-disable-next-line unicorn/no-thenable
  chain.then = (resolve: (v: unknown) => void) => resolve(resolvedValue);
  return chain;
}

// ---------------------------------------------------------------------------
// Session factory
// ---------------------------------------------------------------------------

export function makeSession(
  overrides?: Partial<{
    userId: string;
    orgId: string | null;
    role: string;
    email: string;
    name: string;
    emailVerified: boolean;
  }>,
): App.Session {
  return {
    user: {
      id: overrides?.userId ?? "user-1",
      email: overrides?.email ?? "user@example.com",
      name: overrides?.name || "Test User",
      role: overrides?.role ?? "user",
      emailVerified: overrides?.emailVerified ?? true,
      image: null,
      banned: false,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "session-1",
      token: "token-1",
      userId: overrides?.userId ?? "user-1",
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      org_id: overrides?.orgId ?? null,
      member_id: overrides?.orgId ? "member-1" : null,
      member_role: overrides?.orgId ? "owner" : null,
      activeOrganizationId: overrides?.orgId ?? null,
    },
  } as App.Session;
}

// ---------------------------------------------------------------------------
// Common error fixtures
// ---------------------------------------------------------------------------

export const INTERNAL_ERR = {
  status: 500,
  level: "error" as const,
  code: "INTERNAL_SERVER_ERROR" as const,
  message: "Internal server error",
};

// ---------------------------------------------------------------------------
// Drizzle db proxy mock
// ---------------------------------------------------------------------------

/**
 * Builds a `{ db }` module shape that overrides the global drizzle.db mock
 * from setup.ts. Used by services that bypass `Repo` and need to capture
 * raw `db.update(...)`, `db.select(...)`, `db.insert(...)`, or
 * `db.query.<table>.findFirst(...)` calls.
 *
 * Top-level properties in `overrides` replace the proxy's getter for that
 * prop. All other property accesses fall back to the recursive proxy
 * (matching setup.ts).
 *
 * Usage:
 *   const mockUpdate = vi.fn();
 *   vi.mock("$lib/server/db/drizzle.db", () => mockDbModule({
 *     update: mockUpdate,
 *   }));
 */
export function mockDbModule(overrides: Record<string, unknown> = {}) {
  const handler: ProxyHandler<object> = {
    get: (_target, prop) => {
      if (prop === "then") return undefined;
      if (typeof prop === "string" && prop in overrides) {
        return overrides[prop];
      }
      return new Proxy(() => new Proxy({}, handler), handler);
    },
    apply: () => new Proxy({}, handler),
  };
  return { db: new Proxy({}, handler) };
}

// ---------------------------------------------------------------------------
// Request event mock
// ---------------------------------------------------------------------------

/**
 * Configures `getRequestEvent` (mocked globally in setup.ts) to return an
 * event with the given session attached to `locals.session`. Use `null` for
 * unauthenticated requests, or omit `session` entirely when the service only
 * reads `request.headers`.
 */
export function mockRequestEvent(session?: App.Session | null, headers?: Headers) {
  vi.mocked(getRequestEvent).mockReturnValue({
    locals: { session: session ?? null },
    request: { headers: headers ?? new Headers() },
  } as unknown as ReturnType<typeof getRequestEvent>);
}
