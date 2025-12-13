import { ADMIN_EMAIL } from "$env/static/private";
import type {
  Invitation,
  Organization,
  User,
} from "$lib/server/db/models/auth.model";
import type { SendEmailOptions } from "$lib/services/email.service";
import { App } from "$lib/utils/app";
import { APP } from "./app.const";

const HTML_SIGNATURE = `
<p>
  Regards,<br />
  <a href="${APP.URL}">${APP.NAME}</a>
</p>`.trim();

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
      const html = `
<p>Hi ${input.user.name ?? ""}</p>
<p>
  Click <a href="${input.url}">here</a> to reset your ${APP.NAME} password.
</p>
<p>
  If you did not request this, you can safely ignore this email.
</p>

${COMMON.SIGNATURE.HTML}`.trim();

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
      const html = `
<p>Hi ${input.user.name ?? ""},</p>
<p>
  Click <a href="${input.url}">here</a> to verify your ${APP.NAME} account.
</p>
<p>
  If you did not request this, you can safely ignore this email.
</p>

${COMMON.SIGNATURE.HTML}`.trim();

      return {
        html,
        to: input.user.email,
        subject: `Verify your ${APP.NAME} account`,
      };
    },

    "org-invite": (input: {
      organization: Pick<Organization, "name">;
      invitation: Pick<Invitation, "id" | "email">;
      inviter: { user: Pick<User, "email" | "name"> };
    }): SendEmailOptions => {
      const href = App.full_url("/auth/organization/accept-invite", {
        invite_id: input.invitation.id,
      });

      const html = `
<p>Hi,</p>
<p>
  You have been invited by <strong>${input.inviter.user.email}</strong> to join the organization <strong>${input.organization.name}</strong>.
</p>
<p>
  Click <a href="${href}">here</a> to accept the invitation.
</p>
<p>
  If you did not request this, you can safely ignore this email.
</p>

${COMMON.SIGNATURE.HTML}`.trim();

      return {
        html,
        to: input.invitation.email,
        subject: `You have been invited to join ${input.organization.name}`,
      };
    },

    "user-deleted": (input: {
      user: Pick<User, "email" | "name">;
    }): SendEmailOptions => {
      const html = `
<p>Hi ${input.user.name ?? ""},</p>
<p>
  This is to confirm that your account associated with this email address has been successfully deleted from ${APP.NAME}.
</p>
<p>
  If you did not request this, please contact our support team immediately.
</p>

${COMMON.SIGNATURE.HTML}`.trim();

      return {
        html,
        to: input.user.email,
        subject: `Your ${APP.NAME} account has been deleted`,
      };
    },

    "delete-account-verification": (input: {
      user: Pick<User, "email" | "name">;
      url: string;
    }): SendEmailOptions => {
      const html = `
<p>Hi ${input.user.name ?? ""},</p>
<p>
  We've received a request to delete your account associated with this email address from ${APP.NAME}.
</p>
<p>
  Please click <a href="${input.url}">here</a> to confirm the deletion.
</p>
<p>
  If you did not request this, please contact our support team immediately.
</p>

${COMMON.SIGNATURE.HTML}`.trim();

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
      const html = `
<p>You have received a new message from the contact form on ${APP.NAME}.</p>

<p><strong>Name:</strong> ${input.name}</p>
<p><strong>Email:</strong> ${input.email}</p>

<p><strong>Message:</strong></p>
<p>${input.message.replaceAll(/\n/g, "<br />")}</p>

${COMMON.SIGNATURE.HTML}`.trim();

      return {
        html,
        to: ADMIN_EMAIL,
        subject: `New contact form submission from ${input.name}`,
      };
    },
  },
};
