import { APIError } from "better-auth";
import { describe, expect, it } from "vite-plus/test";
import {
  AuditCapture,
  type EndpointCall,
  type SessionLike,
} from "./audit_capture.js";

const as = (
  user_id: string,
  over?: {
    impersonated_by?: string;
    two_factor?: boolean;
    org_id?: string;
  },
): SessionLike => ({
  session: {
    id: `session-${user_id}`,
    impersonatedBy: over?.impersonated_by ?? null,
    activeOrganizationId: over?.org_id ?? null,
  },
  user: {
    id: user_id,
    email: `${user_id}@example.com`,
    twoFactorEnabled: over?.two_factor ?? false,
  },
});

const call = (over: Partial<EndpointCall>): EndpointCall => ({
  path: undefined,
  returned: { status: true },
  session: null,
  new_session: null,
  ...over,
});

/** A JWT with `payload`, unsigned: capture reads it only after the endpoint verified it. */
const token = (payload: object) =>
  [
    "header",
    Buffer.from(JSON.stringify(payload)).toString("base64url"),
    "sig",
  ].join(".");

const capture = AuditCapture.capture;

describe("AuditCapture.capture — sign-ins", () => {
  it("records a credential sign-in that ended with a session", () => {
    expect(
      capture(call({ path: "/sign-in/email", new_session: as("u1") })),
    ).toEqual([
      { type: "sign_in", user_id: "u1", metadata: { method: "credential" } },
    ]);
  });

  it("records nothing for a credential sign-in still owed a second factor", () => {
    // `twoFactor`'s hook has already withdrawn the session it made.
    expect(
      capture(
        call({
          path: "/sign-in/email",
          returned: { twoFactorRedirect: true },
        }),
      ),
    ).toEqual([]);
  });

  it("records the second step as the sign-in, with its factor", () => {
    expect(
      capture(call({ path: "/two-factor/verify-totp", new_session: as("u1") })),
    ).toEqual([
      {
        type: "sign_in",
        user_id: "u1",
        metadata: { method: "credential", second_factor: "totp" },
      },
    ]);
  });

  it("records a backup code as both the sign-in and its use", () => {
    expect(
      capture(
        call({
          path: "/two-factor/verify-backup-code",
          new_session: as("u1"),
        }),
      ),
    ).toEqual([
      {
        type: "sign_in",
        user_id: "u1",
        metadata: { method: "credential", second_factor: "backup_code" },
      },
      { type: "backup_code_used", user_id: "u1" },
    ]);
  });

  it("records an OAuth callback, which answers with a thrown redirect", () => {
    expect(
      capture(
        call({
          path: "/callback/:id",
          params: { id: "google" },
          returned: new APIError("FOUND"),
          new_session: as("u1"),
        }),
      ),
    ).toEqual([
      { type: "sign_in", user_id: "u1", metadata: { method: "google" } },
    ]);

    expect(
      capture(
        call({
          path: "/oauth2/callback/:providerId",
          params: { providerId: "pocket-id" },
          returned: new APIError("FOUND"),
          new_session: as("u1"),
        }),
      ),
    ).toEqual([
      { type: "sign_in", user_id: "u1", metadata: { method: "pocket-id" } },
    ]);
  });

  it("records passkey and email-code sign-ins", () => {
    expect(
      capture(
        call({
          path: "/passkey/verify-authentication",
          new_session: as("u1"),
        }),
      )[0]?.metadata,
    ).toEqual({ method: "passkey" });

    expect(
      capture(call({ path: "/sign-in/email-otp", new_session: as("u1") }))[0]
        ?.metadata,
    ).toEqual({ method: "email-otp" });
  });

  it("does not count a cookie refresh on another path as a sign-in", () => {
    expect(
      capture(
        call({
          path: "/organization/set-active",
          session: as("u1"),
          new_session: as("u1"),
        }),
      ),
    ).toEqual([]);
  });

  it("does not count an impersonation session as the user signing in", () => {
    expect(
      capture(
        call({
          path: "/sign-in/email",
          new_session: as("u1", { impersonated_by: "admin" }),
        }),
      ),
    ).toEqual([]);
  });

  it("counts a verification link as a sign-in only when it opened a session", () => {
    const query = { token: token({ email: "u1@example.com" }) };

    expect(
      capture(call({ path: "/verify-email", query, new_session: as("u1") })),
    ).toEqual([
      {
        type: "sign_in",
        user_id: "u1",
        metadata: { method: "email-verification" },
      },
    ]);

    expect(
      capture(
        call({
          path: "/verify-email",
          query,
          session: as("u1"),
          new_session: as("u1"),
        }),
      ),
    ).toEqual([]);
  });
});

describe("AuditCapture.capture — failures", () => {
  it("records a wrong password against the address it named", () => {
    expect(
      capture(
        call({
          path: "/sign-in/email",
          body: { email: "victim@example.com", password: "x" },
          returned: new APIError("UNAUTHORIZED", {
            code: "INVALID_EMAIL_OR_PASSWORD",
            message: "Invalid email or password",
          }),
        }),
      ),
    ).toEqual([
      {
        type: "sign_in_failed",
        user_id: null,
        email: "victim@example.com",
        metadata: { method: "credential" },
      },
    ]);
  });

  it("records a wrong email code, but not an expired one", () => {
    const failed = (code: string) =>
      capture(
        call({
          path: "/sign-in/email-otp",
          body: { email: "u1@example.com", otp: "000000" },
          returned: new APIError("BAD_REQUEST", { code, message: code }),
        }),
      );

    expect(failed("INVALID_OTP")).toEqual([
      expect.objectContaining({
        type: "sign_in_failed",
        metadata: { method: "email-otp" },
      }),
    ]);
    expect(failed("OTP_EXPIRED")).toEqual([]);
  });

  it("records nothing else that failed", () => {
    expect(
      capture(
        call({
          path: "/change-password",
          session: as("u1"),
          returned: new APIError("BAD_REQUEST", {
            code: "INVALID_PASSWORD",
            message: "Invalid password",
          }),
        }),
      ),
    ).toEqual([]);
  });
});

describe("AuditCapture.capture — account changes", () => {
  it("records 2FA being enabled, not the code that confirmed it as a sign-in", () => {
    expect(
      capture(
        call({
          path: "/two-factor/verify-totp",
          session: as("u1", { two_factor: false }),
          new_session: as("u1", { two_factor: true }),
        }),
      ),
    ).toEqual([
      {
        type: "two_factor_enabled",
        user_id: "u1",
        actor_user_id: null,
        metadata: {},
      },
    ]);
  });

  it("records an email change requested, then completed with both addresses", () => {
    expect(
      capture(
        call({
          path: "/change-email",
          body: { newEmail: "New@Example.com" },
          session: as("u1"),
        }),
      ),
    ).toEqual([
      {
        type: "email_change_requested",
        user_id: "u1",
        actor_user_id: null,
        metadata: { to: "new@example.com" },
      },
    ]);

    const change = (requestType: string) =>
      capture(
        call({
          path: "/verify-email",
          query: {
            token: token({
              email: "old@example.com",
              updateTo: "new@example.com",
              requestType,
            }),
          },
          new_session: as("u1"),
        }),
      );

    expect(change("change-email-verification")).toEqual([
      {
        type: "email_changed",
        user_id: "u1",
        metadata: { from: "old@example.com", to: "new@example.com" },
      },
    ]);
    // The first link only sends the second.
    expect(change("change-email-confirmation")).toEqual([]);
  });

  it("names the admin when an impersonated session does it", () => {
    expect(
      capture(
        call({
          path: "/change-password",
          session: as("u1", { impersonated_by: "admin" }),
        }),
      ),
    ).toEqual([
      {
        type: "password_changed",
        user_id: "u1",
        actor_user_id: "admin",
        metadata: { impersonated: true },
      },
    ]);
  });

  it("files an API key under the org it was made for, and deleted from", () => {
    expect(
      capture(
        call({
          path: "/api-key/create",
          body: { name: "CI", organizationId: "org-1" },
          returned: { id: "key-1", name: "CI" },
          session: as("u1"),
        }),
      ),
    ).toEqual([
      {
        type: "api_key_created",
        user_id: "u1",
        actor_user_id: null,
        org_id: "org-1",
        metadata: { name: "CI" },
      },
    ]);

    expect(
      capture(
        call({
          path: "/api-key/delete",
          body: { keyId: "key-1" },
          returned: { success: true },
          session: as("u1", { org_id: "org-1" }),
        }),
      ),
    ).toEqual([
      expect.objectContaining({ type: "api_key_deleted", org_id: "org-1" }),
    ]);
  });
});

describe("AuditCapture.capture — acting on others", () => {
  it("records an admin's change against its subject, with the admin as actor", () => {
    expect(
      capture(
        call({
          path: "/admin/set-role",
          body: { userId: "u2", role: ["admin", "user"] },
          session: as("admin"),
        }),
      ),
    ).toEqual([
      {
        type: "user_role_changed",
        user_id: "u2",
        actor_user_id: "admin",
        metadata: { role: "admin,user" },
      },
    ]);
  });

  it("keeps a removed user's id out of the subject column it would be deleted with", () => {
    expect(
      capture(
        call({
          path: "/admin/remove-user",
          body: { userId: "u2" },
          session: as("admin"),
        }),
      ),
    ).toEqual([
      {
        type: "user_removed",
        user_id: null,
        actor_user_id: "admin",
        metadata: { removed_user_id: "u2" },
      },
    ]);
  });

  it("records impersonation from both ends", () => {
    expect(
      capture(
        call({
          path: "/admin/impersonate-user",
          body: { userId: "u2" },
          session: as("admin"),
          new_session: as("u2", { impersonated_by: "admin" }),
        }),
      ),
    ).toEqual([
      {
        type: "impersonation_started",
        user_id: "u2",
        actor_user_id: "admin",
        metadata: {},
      },
    ]);

    expect(
      capture(
        call({
          path: "/admin/stop-impersonating",
          session: as("u2", { impersonated_by: "admin" }),
          new_session: as("admin"),
        }),
      ),
    ).toEqual([
      {
        type: "impersonation_stopped",
        user_id: "u2",
        actor_user_id: "admin",
      },
    ]);
  });

  it("records org membership changes under the org", () => {
    expect(
      capture(
        call({
          path: "/organization/remove-member",
          returned: {
            member: { userId: "u2", organizationId: "org-1", role: "member" },
          },
          session: as("owner"),
        }),
      ),
    ).toEqual([
      {
        type: "org_member_removed",
        user_id: "u2",
        actor_user_id: "owner",
        org_id: "org-1",
        metadata: {},
      },
    ]);

    expect(
      capture(
        call({
          path: "/organization/invite-member",
          returned: {
            organizationId: "org-1",
            email: "new@example.com",
            role: "admin",
          },
          session: as("owner"),
        }),
      ),
    ).toEqual([
      {
        type: "org_member_invited",
        user_id: null,
        actor_user_id: "owner",
        org_id: "org-1",
        metadata: { email: "new@example.com", role: "admin" },
      },
    ]);
  });

  it("ignores an answer whose shape it does not recognise", () => {
    expect(
      capture(
        call({
          path: "/organization/remove-member",
          returned: { removed: true },
          session: as("owner"),
        }),
      ),
    ).toEqual([]);
  });
});

describe("AuditCapture.account_deleted", () => {
  const google = { userId: "u1", providerId: "google" };

  it("records which provider an unlink removed", () => {
    expect(
      AuditCapture.account_deleted(google, {
        path: "/unlink-account",
        session: as("u1"),
      }),
    ).toEqual([
      {
        type: "account_unlinked",
        user_id: "u1",
        actor_user_id: null,
        metadata: { provider: "google" },
      },
    ]);
  });

  it("names the admin who unlinked while impersonating", () => {
    expect(
      AuditCapture.account_deleted(google, {
        path: "/unlink-account",
        session: as("u1", { impersonated_by: "admin" }),
      }),
    ).toEqual([
      {
        type: "account_unlinked",
        user_id: "u1",
        actor_user_id: "admin",
        metadata: { impersonated: true, provider: "google" },
      },
    ]);
  });

  it("records nothing for the accounts a user's deletion removes", () => {
    expect(
      AuditCapture.account_deleted(google, {
        path: "/delete-user/callback",
        session: as("u1"),
      }),
    ).toEqual([]);
  });
});
