import { InvitationSchema } from "#lib/server/db/models/auth.model.js";
import {
  guarded_command,
  guarded_form,
  ORG,
  USER,
} from "#lib/server/remote/guarded.js";
import { InvitationService } from "#lib/server/services/auth/organization/invitation.service.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

// Each invitation sends an email.
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
  async (input) => {
    const res = await InvitationService.create(input);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
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
