import type { SendEmailOptions } from "$lib/services/email.service";
import { App } from "$lib/utils/app";
import { Markdown } from "$lib/utils/markdown";
import type { User } from "better-auth";
import type { Invitation, Organization } from "better-auth/plugins";
import { APP } from "./app";
import { ROUTES } from "./routes.const";

const HTML_SIGNATURE = `
<p>
  Regards,<br />
  <a href="${APP.URL}">${APP.NAME}</a>
</p>`.trim();

const COMMON = {
  SIGNATURE: {
    HTML: HTML_SIGNATURE,
    TEXT: Markdown.from_html(HTML_SIGNATURE),
  },
};

export const EMAIL = {
  TEMPLATES: {
    "password-reset": (input: {
      url: string;
      user: User;
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
        text: Markdown.from_html(html),
        subject: `Reset your ${APP.NAME} password`,
      };
    },

    "email-verification": (input: {
      url: string;
      user: User;
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
        text: Markdown.from_html(html),
        subject: `Verify your ${APP.NAME} account`,
      };
    },

    "org-invite": (input: {
      invitation: Invitation;
      organization: Organization;
      inviter: { user: User };
    }): SendEmailOptions => {
      const href = App.full_url(ROUTES.AUTH_ORGANIZATION_ACCEPT_INVITE, {
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
        text: Markdown.from_html(html),
        subject: `You have been invited to join ${input.organization.name}`,
      };
    },

    "user-deleted": (input: { user: User }): SendEmailOptions => {
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
        text: Markdown.from_html(html),
        subject: `Your ${APP.NAME} account has been deleted`,
      };
    },
  },
};
