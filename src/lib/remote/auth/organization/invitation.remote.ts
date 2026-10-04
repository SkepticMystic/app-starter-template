import { ERROR } from "#lib/const/error.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import { InvitationSchema } from "#lib/server/db/models/auth.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import {
  guarded_command,
  guarded_form,
  ORG,
  USER,
} from "#lib/server/remote/guarded.js";
import { InvitationService } from "#lib/server/services/auth/organization/invitation.service.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { result } from "#lib/utils/result.util.js";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

// Each invitation sends an email, a resend included.
const invite_limiter = new RateLimiter("invitation:create", {
  max_tokens: 20,
  refill_rate: 20,
  refill_interval: 3600,
});

export const create_invitation_remote = guarded_form(
  {
    ...ORG,
    session: { org_permissions: { invitation: ["create"] } },
    limit: {
      limiter: invite_limiter,
      by: "org",
      message: "Too many invitations sent.",
    },
  },
  InvitationSchema.create,
  async (input, { org_id }) => {
    const res = await InvitationService.create({
      ...input,
      organizationId: org_id,
    });

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

/**
 * Re-sends a pending invitation. Email and role come from the row, read in the
 * guard's org, not from the client. A live invite keeps its link with a fresh
 * expiry; an expired one is not "pending" to Better-Auth, so it gets a new row.
 */
export const resend_invitation_remote = guarded_command(
  {
    ...ORG,
    session: { org_permissions: { invitation: ["create"] } },
    limit: {
      limiter: invite_limiter,
      by: "org",
      message: "Too many invitations sent.",
    },
  },
  z.uuid(),
  async (invitation_id, { org_id }) => {
    const row = await Repo.query(
      db.query.invitation.findFirst({
        columns: { email: true, role: true },
        where: { id: invitation_id, organizationId: org_id, status: "pending" },
      }),
    );
    if (!row.ok) return row;
    if (!row.data) {
      return result.err({
        ...ERROR.NOT_FOUND,
        message: "Invitation is no longer pending",
      });
    }

    return InvitationService.create({
      email: row.data.email,
      role: row.data.role,
      organizationId: org_id,
      resend: true,
    });
  },
);

export const cancel_invitation_remote = guarded_command(
  { ...ORG, session: { org_permissions: { invitation: ["cancel"] } } },
  z.uuid(),
  async (invitation_id) => InvitationService.cancel(invitation_id),
);

/** The invitee is not a member yet, so this is `USER`, not `ORG`. */
export const accept_invitation_remote = guarded_command(
  USER,
  z.uuid(),
  async (invitation_id) => InvitationService.accept(invitation_id),
);
