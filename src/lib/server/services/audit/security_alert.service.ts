import { AUTH } from "#lib/const/auth/auth.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import type { AuditEvent } from "#lib/server/db/models/audit.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { EmailService } from "#lib/server/services/email.service.js";
import { Format } from "#lib/utils/format.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";

const log = Log.child({ service: "SecurityAlert" });

type Alert = { title: string; detail: string };

/**
 * The events that email the account's owner. Each is something an attacker
 * holding a session would do to keep the account, or a sign-in the owner
 * should be able to say was not them. Admin moderation (bans, roles) is the
 * admin's to explain, so it is not here.
 */
const alert_for = (
  event: Pick<AuditEvent, "type" | "metadata" | "actor_user_id">,
): Alert | null => {
  // The admin is acting as the user; the owner did not do this, but neither
  // did an attacker, and the log already names the admin.
  if (event.metadata.impersonated) return null;

  switch (event.type) {
    case "sign_in":
      return event.metadata.new_device
        ? {
            title: "New sign-in to your account",
            detail: `Your account was signed in to from a device it hasn't used recently, with ${AUTH.sign_in_method_label(event.metadata.method ?? "credential").toLowerCase()}.`,
          }
        : null;

    case "password_changed":
      return {
        title: "Your password was changed",
        detail: event.actor_user_id
          ? "An administrator set a new password on your account."
          : "The password on your account was changed.",
      };

    case "password_reset":
      return {
        title: "Your password was reset",
        detail:
          "The password on your account was reset from an emailed link, and every session was signed out.",
      };

    case "email_changed":
      return {
        title: "Your email address was changed",
        detail: `Your account's email address was changed to ${event.metadata.to ?? "a new address"}. This address will no longer receive its emails.`,
      };

    case "two_factor_enabled":
      return {
        title: "Two-factor authentication was turned on",
        detail:
          "Signing in to your account now needs a code from an authenticator app.",
      };

    case "two_factor_disabled":
      return {
        title: "Two-factor authentication was turned off",
        detail:
          "Signing in to your account no longer needs a code from an authenticator app.",
      };

    case "backup_code_used":
      return {
        title: "A backup code was used",
        detail:
          "One of your two-factor backup codes was used to sign in. It cannot be used again.",
      };

    case "passkey_added":
      return {
        title: "A passkey was added",
        detail: `A passkey${event.metadata.name ? ` named "${event.metadata.name}"` : ""} can now sign in to your account.`,
      };

    case "account_linked":
      return {
        title: "A sign-in method was linked",
        detail: `${AUTH.sign_in_method_label(event.metadata.provider ?? "another provider")} can now sign in to your account.`,
      };

    case "api_key_created":
      return {
        title: "An API key was created",
        detail: `An API key${event.metadata.name ? ` named "${event.metadata.name}"` : ""} was created from your account.`,
      };

    default:
      return null;
  }
};

/** `email.const` loads jsdom, so it is imported on the first alert rather than with the auth stack. */
const templates = async () =>
  (await import("#lib/const/email.const.js")).EMAIL.TEMPLATES;

/**
 * Emails the account's owner about `event`, if it is one {@link alert_for}
 * names. Only to a verified address, so an alert never becomes a way to mail a
 * stranger; an email change goes to the address it moved away from, the one
 * an attacker cannot read.
 */
const notify = async (
  event: Pick<
    AuditEvent,
    | "type"
    | "user_id"
    | "actor_user_id"
    | "metadata"
    | "createdAt"
    | "device"
    | "country"
  >,
): Promise<App.Result<{ sent: boolean }>> => {
  const alert = alert_for(event);
  if (!alert || !event.user_id) return result.suc({ sent: false });

  const user = await Repo.query(
    db.query.user.findFirst({
      columns: { name: true, email: true, emailVerified: true },
      where: { id: event.user_id },
    }),
  );
  if (!user.ok) return user;
  if (!user.data) return result.suc({ sent: false });

  const to =
    event.type === "email_changed"
      ? event.metadata.from
      : user.data.emailVerified
        ? user.data.email
        : undefined;
  if (!to) return result.suc({ sent: false });

  const sent = await EmailService.send(
    (await templates())["security-alert"]({
      user: user.data,
      to,
      ...alert,
      when: Format.datetime(event.createdAt),
      device: event.device,
      location: event.country,
    }),
  );
  if (!sent.ok) {
    log.warn({ type: event.type, error: sent.error }, "notify.send_failed");
    return sent;
  }

  return result.suc({ sent: true });
};

export const SecurityAlertService = { alert_for, notify };
