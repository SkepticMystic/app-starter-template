import { EMAIL_FROM } from "$app/env/private";
import { APP } from "#lib/const/app.const.js";
import type { Component, ComponentProps } from "svelte";
import AccountExists from "./templates/AccountExists.svelte";
import AdminContactForm from "./templates/AdminContactForm.svelte";
import ChangeEmailConfirmation from "./templates/ChangeEmailConfirmation.svelte";
import DeleteAccountVerification from "./templates/DeleteAccountVerification.svelte";
import EmailVerification from "./templates/EmailVerification.svelte";
import OrgInvite from "./templates/OrgInvite.svelte";
import PasswordReset from "./templates/PasswordReset.svelte";
import SecurityAlert from "./templates/SecurityAlert.svelte";
import SigninCode from "./templates/SigninCode.svelte";
import UserDeleted from "./templates/UserDeleted.svelte";

/** What goes around the body: who it is for, and what the inbox shows before it is opened. */
export type Envelope = {
  to: string | string[];
  subject: string;
  /** The inbox's preview line, after the subject. Never shown in the opened email. */
  preheader: string;
  reply_to?: string;
};

// oxlint-disable-next-line typescript/no-explicit-any -- `ComponentProps`' own constraint
type AnyComponent = Component<any>;

/** One entry, seen through a single type's props; the envelope is what pins them. */
export type EmailEntry<P> = {
  component: AnyComponent;
  envelope: (props: P) => Envelope;
};

/** Infers the envelope's props from the component, so the two cannot disagree. */
const define = <C extends AnyComponent>(
  component: C,
  envelope: (props: ComponentProps<C>) => Envelope,
) => ({ component, envelope });

/**
 * Every email the app sends. The key is the type: it tags the Resend message, the Sentry
 * metric and the idempotency key, and names the template in `/dev/emails`.
 */
export const EMAILS = {
  "password-reset": define(PasswordReset, ({ user }) => ({
    to: user.email,
    subject: `Reset your ${APP.NAME} password`,
    preheader: "Choose a new password. The link expires in 1 hour.",
  })),

  "email-verification": define(EmailVerification, ({ user }) => ({
    to: user.email,
    subject: `Verify your email for ${APP.NAME}`,
    preheader: `Confirm this address to finish setting up your ${APP.NAME} account.`,
  })),

  // The inviter's name stays out of the subject: anyone can choose one.
  "org-invite": define(OrgInvite, ({ organization, invitation }) => ({
    to: invitation.email,
    subject: `You're invited to join ${organization.name} on ${APP.NAME}`,
    preheader: `Accept the invitation to join ${organization.name}.`,
  })),

  "change-email-confirmation": define(
    ChangeEmailConfirmation,
    ({ user, new_email }) => ({
      to: user.email,
      subject: `Approve the email change on your ${APP.NAME} account`,
      preheader: `Someone asked to change your email address to ${new_email}.`,
    }),
  ),

  "account-exists": define(AccountExists, ({ user }) => ({
    to: user.email,
    subject: `You already have a ${APP.NAME} account`,
    preheader: `Sign in as ${user.email} instead of creating a new one.`,
  })),

  "delete-account-verification": define(
    DeleteAccountVerification,
    ({ user }) => ({
      to: user.email,
      subject: `Confirm deleting your ${APP.NAME} account`,
      preheader:
        "This permanently deletes your account. The link expires in 24 hours.",
    }),
  ),

  "user-deleted": define(UserDeleted, ({ user }) => ({
    to: user.email,
    subject: `Your ${APP.NAME} account has been deleted`,
    preheader: "If this wasn't you, contact us right away.",
  })),

  "security-alert": define(SecurityAlert, ({ to, title, when }) => ({
    to,
    subject: `${title} · ${APP.NAME}`,
    preheader: `${when}. If this wasn't you, reset your password.`,
  })),

  "signin-code": define(SigninCode, ({ email, code, expires_in_minutes }) => ({
    to: email,
    subject: `${code} is your ${APP.NAME} sign-in code`,
    preheader: `It expires in ${expires_in_minutes} minutes. Never share it.`,
  })),

  "admin-contact-form": define(
    AdminContactForm,
    ({ name, email, message }) => ({
      to: EMAIL_FROM,
      // So Reply answers the person who wrote, not the no-reply sender.
      reply_to: email,
      subject: `Contact form: ${name}`,
      preheader: message.slice(0, 140),
    }),
  ),
};

export type EmailType = keyof typeof EMAILS;

export type EmailProps<K extends EmailType> = ComponentProps<
  (typeof EMAILS)[K]["component"]
>;

export const EMAIL_TYPES = Object.keys(EMAILS) as EmailType[];

export const is_email_type = (value: string): value is EmailType =>
  Object.hasOwn(EMAILS, value);
