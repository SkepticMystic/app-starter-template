import type { BadgeStatus } from "../../components/ui/badge/index.js";
import { AUTH } from "./auth.const.js";

const EVENT_IDS = [
  "sign_in",
  "sign_in_failed",
  "password_changed",
  "password_reset",
  "email_change_requested",
  "email_changed",
  "two_factor_enabled",
  "two_factor_disabled",
  "backup_code_used",
  "backup_codes_generated",
  "passkey_added",
  "passkey_removed",
  "account_linked",
  "account_unlinked",
  "session_revoked",
  "sessions_revoked",
  "api_key_created",
  "api_key_deleted",
  "user_banned",
  "user_unbanned",
  "user_role_changed",
  "user_removed",
  "impersonation_started",
  "impersonation_stopped",
  "org_member_invited",
  "org_member_joined",
  "org_member_removed",
  "org_member_role_changed",
  "org_member_left",
] as const;

/**
 * Quiet by default, on the badge ladder in `ui/badge/index.ts`: most of a
 * security log is the account doing what its owner meant. Only what is worth a
 * second look escalates.
 */
const EVENT_MAP = {
  sign_in: {
    label: "Signed in",
    variant: "outline",
  },
  sign_in_failed: {
    label: "Sign-in failed",
    variant: "caution",
  },
  password_changed: {
    label: "Password changed",
    variant: "outline",
  },
  password_reset: {
    label: "Password reset",
    variant: "outline",
  },
  email_change_requested: {
    label: "Email change requested",
    variant: "outline",
  },
  email_changed: {
    label: "Email changed",
    variant: "outline",
  },
  two_factor_enabled: {
    label: "2FA turned on",
    variant: "outline",
  },
  two_factor_disabled: {
    label: "2FA turned off",
    variant: "warning",
  },
  backup_code_used: {
    label: "Backup code used",
    variant: "caution",
  },
  backup_codes_generated: {
    label: "Backup codes regenerated",
    variant: "outline",
  },
  passkey_added: {
    label: "Passkey added",
    variant: "outline",
  },
  passkey_removed: {
    label: "Passkey removed",
    variant: "outline",
  },
  account_linked: {
    label: "Sign-in method linked",
    variant: "outline",
  },
  account_unlinked: {
    label: "Sign-in method unlinked",
    variant: "outline",
  },
  session_revoked: {
    label: "Session signed out",
    variant: "outline",
  },
  sessions_revoked: {
    label: "Other sessions signed out",
    variant: "outline",
  },
  api_key_created: {
    label: "API key created",
    variant: "outline",
  },
  api_key_deleted: {
    label: "API key deleted",
    variant: "outline",
  },
  user_banned: {
    label: "Banned",
    variant: "destructive",
  },
  user_unbanned: {
    label: "Unbanned",
    variant: "outline",
  },
  user_role_changed: {
    label: "Role changed",
    variant: "caution",
  },
  user_removed: {
    label: "User deleted",
    variant: "destructive",
  },
  impersonation_started: {
    label: "Impersonation started",
    variant: "warning",
  },
  impersonation_stopped: {
    label: "Impersonation ended",
    variant: "outline",
  },
  org_member_invited: {
    label: "Member invited",
    variant: "outline",
  },
  org_member_joined: {
    label: "Member joined",
    variant: "outline",
  },
  org_member_removed: {
    label: "Member removed",
    variant: "caution",
  },
  org_member_role_changed: {
    label: "Member role changed",
    variant: "outline",
  },
  org_member_left: {
    label: "Member left",
    variant: "outline",
  },
} satisfies Record<IAudit.EventId, BadgeStatus>;

const SECOND_FACTOR_LABELS = {
  totp: "authenticator app",
  backup_code: "backup code",
  otp: "emailed code",
} satisfies Record<IAudit.SecondFactor, string>;

/**
 * The one line under an event's label, from what its metadata recorded. `null`
 * when the label says it all.
 */
const describe = (
  type: IAudit.EventId,
  metadata: IAudit.Metadata | null | undefined,
): string | null => {
  const m = metadata ?? {};

  switch (type) {
    case "sign_in":
    case "sign_in_failed": {
      if (!m.method) return null;

      const method = AUTH.sign_in_method_label(m.method);
      const factor = m.second_factor
        ? ` and ${SECOND_FACTOR_LABELS[m.second_factor]}`
        : "";

      return `${method}${factor}${m.new_device ? " · new device" : ""}`;
    }

    case "email_change_requested":
      return m.to ? `To ${m.to}` : null;

    case "email_changed":
      return m.from && m.to ? `${m.from} → ${m.to}` : null;

    case "account_linked":
    case "account_unlinked":
      return m.provider ? AUTH.sign_in_method_label(m.provider) : null;

    case "passkey_added":
    case "passkey_removed":
    case "api_key_created":
    case "api_key_deleted":
      return m.name ?? null;

    case "user_banned":
      return m.reason ?? null;

    case "org_member_invited":
      return [m.email, m.role].filter(Boolean).join(" · ") || null;

    case "user_role_changed":
    case "org_member_joined":
    case "org_member_role_changed":
      return m.role ?? null;

    default:
      return null;
  }
};

/** The events filed under an org, which its activity page can filter to. */
const ORG_EVENT_IDS = [
  "api_key_created",
  "api_key_deleted",
  "org_member_invited",
  "org_member_joined",
  "org_member_removed",
  "org_member_role_changed",
  "org_member_left",
] as const satisfies readonly IAudit.EventId[];

const options = (ids: readonly IAudit.EventId[]) =>
  ids.map((id) => ({ value: id, label: EVENT_MAP[id].label }));

export const AUDIT = {
  EVENTS: {
    IDS: EVENT_IDS,
    MAP: EVENT_MAP,
    OPTIONS: options(EVENT_IDS),
    ORG_OPTIONS: options(ORG_EVENT_IDS),
  },

  describe,
};

export declare namespace IAudit {
  export type EventId = (typeof EVENT_IDS)[number];

  export type SecondFactor = "totp" | "backup_code" | "otp";

  /**
   * What an event recorded beyond who, where and when. One flat shape rather
   * than one per event: every key is optional and {@link AUDIT.describe} reads
   * only those its event writes. Never a secret, and never more of a person
   * than the log's readers already see.
   */
  export type Metadata = {
    /** A sign-in method id: see `AUTH.sign_in_method_label`. */
    method?: string;
    second_factor?: SecondFactor;
    /** A sign-in from a device this account has not used for a while. */
    new_device?: boolean;
    /** Done by an admin acting as the user. `actor_user_id` is the admin. */
    impersonated?: boolean;
    /** A linked account's provider id. */
    provider?: string;
    /** A passkey's or an API key's name. */
    name?: string;
    role?: string;
    /** An invitee's address. */
    email?: string;
    /** The addresses either side of an email change. */
    from?: string;
    to?: string;
    /** A ban's reason. */
    reason?: string;
    /** What `user_id` was, for a user deleted by the event itself. */
    removed_user_id?: string;
  };
}
