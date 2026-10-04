import { vi, type Mock } from "vite-plus/test";

/** The knobs for the `#lib/auth` mock in `./setup.ts`. */
const store = globalThis as Record<string, unknown>;

export const auth_mock: {
  /** Answers "signed out" by default. */
  getSession: Mock;
  /** Answers "not a Better-Auth error code" by default. */
  is_ba_error_code: Mock;
  /** `auth.api.deleteOrganization`, the owner's path out of an org. */
  deleteOrganization: Mock;
  /** `auth.api.createInvitation`, which also re-sends one. */
  createInvitation: Mock;
  /** `auth.api.banUser` / `unbanUser`, answering `{ user }`. */
  banUser: Mock;
  unbanUser: Mock;
  /** `auth.api.removeUser`. */
  removeUser: Mock;
  /** `auth.api.updateMemberRole`. */
  updateMemberRole: Mock;
  /** `auth.api.signOut`, with no provider to sign out of by default. */
  signOut: Mock;
  /**
   * `(await auth.$context).internalAdapter`, reduced to the `SessionStore`
   * slice `MemberSessionService` reads. Lists no sessions by default.
   */
  internalAdapter: {
    listSessions: Mock;
    deleteSessions: Mock;
    updateSession: Mock;
  };
} = (store["__mock_auth"] ??= {
  getSession: vi.fn(async () => null),
  is_ba_error_code: vi.fn(() => false),
  deleteOrganization: vi.fn(async () => ({})),
  createInvitation: vi.fn(async () => ({})),
  banUser: vi.fn(async () => ({ user: {} })),
  unbanUser: vi.fn(async () => ({ user: {} })),
  removeUser: vi.fn(async () => ({ success: true })),
  updateMemberRole: vi.fn(async () => ({})),
  signOut: vi.fn(async () => ({ success: true })),
  internalAdapter: {
    listSessions: vi.fn(async () => []),
    deleteSessions: vi.fn(async () => undefined),
    updateSession: vi.fn(async () => undefined),
  },
}) as never;
