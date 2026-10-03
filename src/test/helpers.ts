/**
 * Test helpers. Everything a test drives lives on the mock wall in `./setup.ts`;
 * these configure it.
 */

import { getRequestEvent } from "$app/server";
import { vi, type Mock } from "vite-plus/test";

// ---------------------------------------------------------------------------
// Session factory
// ---------------------------------------------------------------------------

export function makeSession(
  overrides?: Partial<{
    userId: string;
    orgId: string | null;
    /** Defaults to "member-1" when there is an org. */
    memberId: string | null;
    /** The org role; defaults to "owner" when there is an org. */
    memberRole: string | null;
    /** The global `user.role`. */
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
      member_id:
        overrides?.memberId !== undefined
          ? overrides.memberId
          : overrides?.orgId
            ? "member-1"
            : null,
      member_role:
        overrides?.memberRole !== undefined
          ? overrides.memberRole
          : overrides?.orgId
            ? "owner"
            : null,
      activeOrganizationId: overrides?.orgId ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// The mock wall
// ---------------------------------------------------------------------------

/**
 * Makes `getRequestEvent()` answer with `session` on `locals.session`. Pass
 * `null` for an unauthenticated request, or omit it when the code under test
 * only reads `request.headers`.
 *
 * Importing the mocked `$app/server` here is safe only because the wall
 * memoises it: every file in a worker gets the same instance.
 */
export const with_request = (
  session?: App.Session | null,
  headers?: Headers,
) => {
  vi.mocked(getRequestEvent).mockReturnValue({
    locals: { session: session ?? null },
    request: { headers: headers ?? new Headers() },
  } as unknown as ReturnType<typeof getRequestEvent>);
};

/**
 * A mocked module namespace with the real module's keys (a misspelt method
 * fails to compile) but loose signatures, so a fixture can answer with a
 * partial row. Use `vi.mocked` for a single function.
 */
export const mocks = <T extends object>(namespace: T) =>
  namespace as unknown as { [K in keyof T]: Mock };

/**
 * Installs `fake`'s methods as implementations on a module mocked in
 * `./setup.ts`. Call it from a `beforeEach`: every mock is reset before each
 * test.
 *
 * A name that is not one of the real module's mocked functions throws. The
 * mocked namespace is one object for the whole worker, so anything defined on
 * it would outlive the file that put it there — and a fake that kept a method
 * the real module renamed would go on answering a call nothing makes.
 */
export const install_mock = (mocked: object, fake: Record<string, unknown>) => {
  const target = mocked as Record<string, unknown>;

  for (const [name, impl] of Object.entries(fake)) {
    const current = target[name];

    if (typeof current !== "function" || !("mockImplementation" in current)) {
      throw new Error(
        `install_mock: "${name}" is not a mocked function of this module${name in target ? "" : ", which has no such member"}.`,
      );
    }

    (
      current as { mockImplementation: (fn: unknown) => void }
    ).mockImplementation(impl);
  }
};
