import { EMAIL_FROM } from "$app/env/private";
import type {
  Invitation,
  Organization,
  User,
} from "#lib/server/db/models/auth.model.js";
import type { SendEmailOptions } from "#lib/server/services/email.service.js";
import { App } from "#lib/utils/app.js";
import { Format } from "#lib/utils/format.util.js";
import { HTMLUtil } from "#lib/utils/html/html.util.js";
import { APP } from "./app.const.js";
import { ORGANIZATION } from "./auth/organization.const.js";

const HTML_SIGNATURE = `
<p>
  Regards,<br />
  <a href="${APP.URL}">${APP.NAME}</a>
</p>`;

const COMMON = {
  SIGNATURE: {
    HTML: HTML_SIGNATURE,
  },
};

export const EMAIL = {
  TEMPLATES: {
    "password-reset": (input: {
      url: string;
      user: Pick<User, "email" | "name">;
    }): SendEmailOptions => {
      const html = HTMLUtil.html`<p>Hi ${input.user.name}</p>
<p>
  Click <a href="${input.url}">here</a> to reset your ${APP.NAME} password.
</p>
<p>
  If you did not request this, you can safely ignore this email.
</p>

${HTMLUtil.raw(COMMON.SIGNATURE.HTML)}`;

      return {
        html,
        to: input.user.email,
        subject: `Reset your ${APP.NAME} password`,
      };
    },

    "email-verification": (input: {
      url: string;
      user: Pick<User, "email" | "name">;
    }): SendEmailOptions => {
      const html = HTMLUtil.html`<p>Hi ${input.user.name},</p>
<p>
  Click <a href="${input.url}">here</a> to verify your ${APP.NAME} account.
</p>
<p>
  If you did not request this, you can safely ignore this email.
</p>

${HTMLUtil.raw(COMMON.SIGNATURE.HTML)}`;

      return {
        html,
        to: input.user.email,
        subject: `Verify your ${APP.NAME} account`,
      };
    },

    "org-invite": (input: {
      organization: Pick<Organization, "name">;
      // Better-Auth hands the role over as a plain string.
      invitation: Pick<Invitation, "id" | "email" | "expiresAt"> & {
        role: string;
      };
      inviter: { user: Pick<User, "email" | "name"> };
    }): SendEmailOptions => {
      const href = App.full_url("/auth/organization/accept-invite", {
        invite_id: input.invitation.id,
      });

      const { name, email } = input.inviter.user;
      const roles: Record<string, { label: string } | undefined> =
        ORGANIZATION.ROLES.MAP;
      const role = roles[input.invitation.role]?.label ?? input.invitation.role;

      // Relative, since the recipient's time zone is unknown here.
      const html = HTMLUtil.html`<p>Hi,</p>
<p>
  <strong>${name || email}</strong>${name ? ` (${email})` : ""} has invited you
  to join <strong>${input.organization.name}</strong> with the ${role} role.
</p>
<p>
  <a href="${href}">Accept the invitation</a>. It expires
  ${Format.relative(input.invitation.expiresAt)}.
</p>
<p>
  If you were not expecting this, you can safely ignore this email.
</p>

${HTMLUtil.raw(COMMON.SIGNATURE.HTML)}`;

      return {
        html,
        to: input.invitation.email,
        subject: `You have been invited to join ${input.organization.name}`,
      };
    },

    "user-deleted": (input: {
      user: Pick<User, "email" | "name">;
    }): SendEmailOptions => {
      const html = HTMLUtil.html`<p>Hi ${input.user.name},</p>
<p>
  This is to confirm that your account associated with this email address has been successfully deleted from ${APP.NAME}.
</p>
<p>
  If you did not request this, please contact our support team immediately.
</p>

${HTMLUtil.raw(COMMON.SIGNATURE.HTML)}`;

      return {
        html,
        to: input.user.email,
        subject: `Your ${APP.NAME} account has been deleted`,
      };
    },

    "change-email-confirmation": (input: {
      user: Pick<User, "email" | "name">;
      new_email: string;
      url: string;
    }): SendEmailOptions => {
      const html = HTMLUtil.html`<p>Hi ${input.user.name},</p>
<p>
  We've received a request to change the email address on your ${APP.NAME} account to <strong>${input.new_email}</strong>.
</p>
<p>
  Please click <a href="${input.url}">here</a> to approve it. We'll then send a link to the new address to verify it.
</p>
<p>
  If you did not request this, ignore this email and change your password — someone may have access to your account.
</p>

${HTMLUtil.raw(COMMON.SIGNATURE.HTML)}`;

      return {
        html,
        to: input.user.email,
        subject: `Approve the email change on your ${APP.NAME} account`,
      };
    },

    "delete-account-verification": (input: {
      user: Pick<User, "email" | "name">;
      url: string;
    }): SendEmailOptions => {
      const html = HTMLUtil.html`<p>Hi ${input.user.name},</p>
<p>
  We've received a request to delete your account associated with this email address from ${APP.NAME}.
</p>
<p>
  Please click <a href="${input.url}">here</a> to confirm the deletion.
</p>
<p>
  If you did not request this, please contact our support team immediately.
</p>

${HTMLUtil.raw(COMMON.SIGNATURE.HTML)}`;

      return {
        html,
        to: input.user.email,
        subject: `Confirm Account Deletion for ${APP.NAME}`,
      };
    },

    "admin-contact-form": (input: {
      name: string;
      email: string;
      message: string;
    }): SendEmailOptions => {
      /**
       * Escaped first, then newlines converted — so `<br />` is inserted into
       * text that is already safe, rather than being the one piece of markup
       * that survives a sanitiser pass over attacker-controlled input.
       */
      const message = HTMLUtil.raw(
        HTMLUtil.escape(input.message).replaceAll("\n", "<br />"),
      );
      const html = HTMLUtil.html`<p>You have received a new message from the contact form on ${APP.NAME}.</p>

<p><strong>Name:</strong> ${input.name}</p>
<p><strong>Email:</strong> ${input.email}</p>

<p><strong>Message:</strong></p>
<p>${message}</p>

${HTMLUtil.raw(COMMON.SIGNATURE.HTML)}`;

      return {
        html,
        to: EMAIL_FROM,
        subject: `New contact form submission from ${input.name}`,
      };
    },
  },
};
