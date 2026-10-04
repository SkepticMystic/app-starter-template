import type { IAudit } from "#lib/const/auth/audit.const.js";
import { z } from "zod";

/**
 * What a security event says happened, before `AuditService` attaches the
 * request it happened in. Pure data, so the whole path → event mapping below
 * is testable without a request, a database or Better-Auth.
 */
export type AuditDraft = {
  type: IAudit.EventId;
  /** The account it happened to. */
  user_id: string | null;
  /** Who did it, when that was not the subject. */
  actor_user_id?: string | null;
  org_id?: string | null;
  metadata?: IAudit.Metadata;
  /** `sign_in_failed` only: the subject is whoever owns this address, if anyone does. */
  email?: string;
};

/**
 * The slice of a Better-Auth session this reads. Structural, so the service
 * never imports `#lib/auth`, which imports it.
 */
export type SessionLike = {
  session: {
    id: string;
    impersonatedBy?: string | null;
    activeOrganizationId?: string | null;
  };
  user: {
    id: string;
    email: string;
    twoFactorEnabled?: boolean | null;
  };
};

/** A finished Better-Auth endpoint call, as its after-hooks see it. */
export type EndpointCall = {
  /** The endpoint's own path: `/callback/:id`, not `/callback/google`. */
  path: string | undefined;
  params?: Record<string, string | undefined> | undefined;
  query?: unknown;
  body?: unknown;
  /** What the handler answered: its JSON, or the `APIError` it threw — a redirect included. */
  returned: unknown;
  /** The session the request arrived with, once the handler has looked it up. */
  session: SessionLike | null;
  /**
   * The session the call ends with: set on a sign-in, and on any refresh of the
   * session cookie. `null` once `twoFactor` has withdrawn a credential sign-in
   * that still owes a second factor — which is why capture runs after that
   * plugin's hook.
   */
  new_session: SessionLike | null;
};

/**
 * The status and code of a thrown `APIError`, read structurally. A status
 * below 400 is a redirect thrown as one (`throw ctx.redirect(...)`), which is
 * how an OAuth callback answers on success as well as failure.
 */
const error_of = (
  returned: unknown,
): { status: number; code: string | undefined } | null => {
  if (!(returned instanceof Error)) return null;
  if (!("statusCode" in returned) || typeof returned.statusCode !== "number") {
    return null;
  }

  const body = "body" in returned ? returned.body : undefined;
  const code =
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    typeof body.code === "string"
      ? body.code
      : undefined;

  return { status: returned.statusCode, code };
};

const parse = <S extends z.ZodType>(schema: S, value: unknown) => {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

const EmailBody = z.object({ email: z.string() });
const ProviderBody = z.object({ provider: z.string() });
const UserIdBody = z.object({ userId: z.string() });
const BanBody = UserIdBody.extend({ banReason: z.string().optional() });
const RoleBody = UserIdBody.extend({
  role: z.union([z.string(), z.array(z.string())]),
});
const NewEmailBody = z.object({ newEmail: z.string() });
const ProviderIdBody = z.object({ providerId: z.string() });
const ApiKeyBody = z.object({ organizationId: z.string().optional() });
const Named = z.object({ name: z.string().nullish() });
const Member = z.object({
  userId: z.string(),
  organizationId: z.string(),
  role: z.string().optional(),
});
const Invitation = z.object({
  organizationId: z.string(),
  email: z.string(),
  role: z.string().optional(),
});
const TokenQuery = z.object({ token: z.string() });
const EmailChangeToken = z.object({
  email: z.string(),
  updateTo: z.string().optional(),
  requestType: z.string().optional(),
});

/**
 * The payload of `/verify-email`'s token. Read without verifying the
 * signature, because the endpoint already did: this runs only once it has
 * succeeded, and only to learn which addresses the change was between.
 */
const email_token = (query: unknown) => {
  const token = parse(TokenQuery, query)?.token;
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    return parse(
      EmailChangeToken,
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
  } catch {
    return null;
  }
};

/** The last segment of a concrete callback path, if the router handed one over. */
const tail = (path: string) => {
  const last = path.split("/").pop();
  return last && !last.startsWith(":") ? last : undefined;
};

/**
 * An action the session's own user took. Under impersonation the admin is the
 * actor, and the row says so.
 */
const by_self = (
  session: SessionLike,
  type: IAudit.EventId,
  extra?: Partial<AuditDraft>,
): AuditDraft => ({
  type,
  user_id: session.user.id,
  actor_user_id: session.session.impersonatedBy ?? null,
  ...extra,
  metadata: {
    ...(session.session.impersonatedBy ? { impersonated: true } : {}),
    ...extra?.metadata,
  },
});

/**
 * An action the session's user took on someone else: an admin, an org owner.
 * `user_id` is required — the subject is the point — and may be `null` for
 * nobody's account (an invitation) or one the event deleted.
 */
const by_other = (
  session: SessionLike,
  type: IAudit.EventId,
  extra: Partial<AuditDraft> & { user_id: string | null },
): AuditDraft => ({
  type,
  actor_user_id: session.session.impersonatedBy ?? session.user.id,
  ...extra,
  metadata: {
    ...(session.session.impersonatedBy ? { impersonated: true } : {}),
    ...extra.metadata,
  },
});

type SignIn = { method: string; second_factor?: IAudit.SecondFactor };

/**
 * The sign-in a path completes, if it is one. Each of these sets a fresh
 * session cookie when it succeeds; nothing else that sets one (a refresh, an
 * org switch, a profile update) is a sign-in.
 */
const sign_in_of = (call: EndpointCall): SignIn | null => {
  const path = call.path ?? "";

  if (path.startsWith("/callback/")) {
    const id = call.params?.["id"] ?? tail(path);
    return id ? { method: id } : null;
  }
  if (path.startsWith("/oauth2/callback/")) {
    const id = call.params?.["providerId"] ?? tail(path);
    return id ? { method: id } : null;
  }

  switch (path) {
    case "/sign-in/email":
    case "/sign-up/email":
      return { method: "credential" };
    case "/sign-in/email-otp":
      return { method: "email-otp" };
    case "/sign-in/social": {
      const provider = parse(ProviderBody, call.body)?.provider;
      return provider ? { method: provider } : null;
    }
    case "/passkey/verify-authentication":
      return { method: "passkey" };
    // The second step of a credential sign-in: the session the first step
    // made was withdrawn, so this is where it is really made.
    case "/two-factor/verify-totp":
      return { method: "credential", second_factor: "totp" };
    case "/two-factor/verify-backup-code":
      return { method: "credential", second_factor: "backup_code" };
    case "/two-factor/verify-otp":
      return { method: "credential", second_factor: "otp" };
    case "/verify-email":
      return { method: "email-verification" };
    default:
      return null;
  }
};

/**
 * Paths that also run inside a signed-in session — enrolling in 2FA, or
 * confirming an address while signed in — where a new session cookie is not a
 * sign-in.
 */
const SIGN_IN_ONLY_WITHOUT_SESSION = new Set([
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
  "/two-factor/verify-otp",
  "/verify-email",
]);

const capture_sign_in = (call: EndpointCall): AuditDraft | null => {
  const fresh = call.new_session;
  if (!fresh) return null;
  // Its own event, `impersonation_started`, says who.
  if (fresh.session.impersonatedBy) return null;

  const sign_in = sign_in_of(call);
  if (!sign_in) return null;

  if (
    call.session &&
    call.path &&
    SIGN_IN_ONLY_WITHOUT_SESSION.has(call.path)
  ) {
    return null;
  }
  // A link that completes an email change signs in as a side effect; the
  // change is the event.
  if (call.path === "/verify-email" && email_token(call.query)?.updateTo) {
    return null;
  }

  return {
    type: "sign_in",
    user_id: fresh.user.id,
    metadata: {
      method: sign_in.method,
      ...(sign_in.second_factor
        ? { second_factor: sign_in.second_factor }
        : {}),
    },
  };
};

/**
 * A refused sign-in, recorded against the account it named, if one exists —
 * the lookup is the service's, after the response. Only a wrong secret: a
 * missing field or an expired code is no one's attack.
 */
const capture_failure = (
  call: EndpointCall,
  code: string | undefined,
): AuditDraft | null => {
  const email = parse(EmailBody, call.body)?.email;
  if (!email) return null;

  if (call.path === "/sign-in/email" && code === "INVALID_EMAIL_OR_PASSWORD") {
    return {
      type: "sign_in_failed",
      user_id: null,
      email,
      metadata: { method: "credential" },
    };
  }

  if (
    call.path === "/sign-in/email-otp" &&
    (code === "INVALID_OTP" || code === "TOO_MANY_ATTEMPTS")
  ) {
    return {
      type: "sign_in_failed",
      user_id: null,
      email,
      metadata: { method: "email-otp" },
    };
  }

  return null;
};

/** Everything else a successful call can be, by path. */
const capture_action = (call: EndpointCall): AuditDraft | null => {
  const { session } = call;

  switch (call.path) {
    case "/verify-email": {
      const token = email_token(call.query);
      if (!token?.updateTo || token.requestType === "change-email-confirmation")
        return null;
      // Set only once the address has actually moved.
      if (!call.new_session) return null;

      return {
        type: "email_changed",
        user_id: call.new_session.user.id,
        metadata: { from: token.email, to: token.updateTo.toLowerCase() },
      };
    }

    // Enabling is finished by the first good code (or at once, with
    // `skipVerificationOnEnable`); both re-issue the session with the flag set.
    case "/two-factor/enable":
    case "/two-factor/verify-totp": {
      const before = session?.user.twoFactorEnabled;
      const after = call.new_session?.user.twoFactorEnabled;
      if (!session || before !== false || after !== true) return null;

      return by_self(session, "two_factor_enabled");
    }

    case "/two-factor/verify-backup-code": {
      const user = call.new_session ?? session;
      return user ? { type: "backup_code_used", user_id: user.user.id } : null;
    }

    default:
      break;
  }

  // The rest need the session the request arrived with.
  if (!session) return null;

  switch (call.path) {
    case "/change-password":
      return by_self(session, "password_changed");

    case "/change-email": {
      const to = parse(NewEmailBody, call.body)?.newEmail;
      return by_self(session, "email_change_requested", {
        metadata: to ? { to: to.toLowerCase() } : {},
      });
    }

    case "/two-factor/disable":
      return by_self(session, "two_factor_disabled");
    case "/two-factor/generate-backup-codes":
      return by_self(session, "backup_codes_generated");

    case "/passkey/verify-registration": {
      const name = parse(Named, call.returned)?.name;
      return by_self(session, "passkey_added", {
        metadata: name ? { name } : {},
      });
    }
    case "/passkey/delete-passkey":
      return by_self(session, "passkey_removed");

    case "/unlink-account": {
      const provider = parse(ProviderIdBody, call.body)?.providerId;
      return by_self(session, "account_unlinked", {
        metadata: provider ? { provider } : {},
      });
    }

    case "/revoke-session":
      return by_self(session, "session_revoked");
    case "/revoke-sessions":
    case "/revoke-other-sessions":
      return by_self(session, "sessions_revoked");

    case "/api-key/create": {
      const name = parse(Named, call.returned)?.name;
      return by_self(session, "api_key_created", {
        org_id: parse(ApiKeyBody, call.body)?.organizationId ?? null,
        metadata: name ? { name } : {},
      });
    }
    // Keys are deleted from the org being viewed; the endpoint answers only
    // `{ success }`, so that is the org.
    case "/api-key/delete":
      return by_self(session, "api_key_deleted", {
        org_id: session.session.activeOrganizationId ?? null,
      });

    case "/admin/set-user-password": {
      const target = parse(UserIdBody, call.body)?.userId;
      return target
        ? by_other(session, "password_changed", { user_id: target })
        : null;
    }
    case "/admin/ban-user": {
      const body = parse(BanBody, call.body);
      return body
        ? by_other(session, "user_banned", {
            user_id: body.userId,
            metadata: body.banReason ? { reason: body.banReason } : {},
          })
        : null;
    }
    case "/admin/unban-user": {
      const target = parse(UserIdBody, call.body)?.userId;
      return target
        ? by_other(session, "user_unbanned", { user_id: target })
        : null;
    }
    case "/admin/set-role": {
      const body = parse(RoleBody, call.body);
      return body
        ? by_other(session, "user_role_changed", {
            user_id: body.userId,
            metadata: {
              role: Array.isArray(body.role) ? body.role.join(",") : body.role,
            },
          })
        : null;
    }
    // The subject is gone, and a row naming them would be deleted with them.
    case "/admin/remove-user": {
      const target = parse(UserIdBody, call.body)?.userId;
      return target
        ? by_other(session, "user_removed", {
            user_id: null,
            metadata: { removed_user_id: target },
          })
        : null;
    }
    case "/admin/impersonate-user": {
      const target = parse(UserIdBody, call.body)?.userId;
      return target
        ? by_other(session, "impersonation_started", { user_id: target })
        : null;
    }
    // The session ending is the impersonated one; its `impersonatedBy` is the admin.
    case "/admin/stop-impersonating":
      return session.session.impersonatedBy
        ? {
            type: "impersonation_stopped",
            user_id: session.user.id,
            actor_user_id: session.session.impersonatedBy,
          }
        : null;

    case "/organization/invite-member": {
      const invitation = parse(Invitation, call.returned);
      return invitation
        ? by_other(session, "org_member_invited", {
            user_id: null,
            org_id: invitation.organizationId,
            metadata: {
              email: invitation.email,
              ...(invitation.role ? { role: invitation.role } : {}),
            },
          })
        : null;
    }
    case "/organization/accept-invitation": {
      const member = parse(z.object({ member: Member }), call.returned)?.member;
      return member
        ? by_self(session, "org_member_joined", {
            org_id: member.organizationId,
            metadata: member.role ? { role: member.role } : {},
          })
        : null;
    }
    case "/organization/remove-member": {
      const member = parse(z.object({ member: Member }), call.returned)?.member;
      return member
        ? by_other(session, "org_member_removed", {
            user_id: member.userId,
            org_id: member.organizationId,
          })
        : null;
    }
    case "/organization/update-member-role": {
      const member = parse(Member, call.returned);
      return member
        ? by_other(session, "org_member_role_changed", {
            user_id: member.userId,
            org_id: member.organizationId,
            metadata: member.role ? { role: member.role } : {},
          })
        : null;
    }
    case "/organization/leave": {
      const member = parse(Member, call.returned);
      return member
        ? by_self(session, "org_member_left", {
            org_id: member.organizationId,
          })
        : null;
    }

    default:
      return null;
  }
};

/**
 * The events one finished endpoint call amounts to: usually none, sometimes
 * two (a backup code that also completed a sign-in). A failed call records
 * only a failed sign-in; everything else is recorded only once it worked.
 */
const capture = (call: EndpointCall): AuditDraft[] => {
  if (!call.path) return [];

  const error = error_of(call.returned);
  if (error && error.status >= 400) {
    const failure = capture_failure(call, error.code);
    return failure ? [failure] : [];
  }

  return [capture_sign_in(call), capture_action(call)].filter(
    (draft): draft is AuditDraft => draft !== null,
  );
};

export const AuditCapture = { capture };
