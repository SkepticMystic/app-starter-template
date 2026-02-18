import { command, form } from "$app/server";
import { InvitationSchema } from "$lib/server/db/models/auth.model";
import { InvitationService } from "$lib/server/services/auth/organization/invitation.service";
import { invalid } from "@sveltejs/kit";
import z from "zod";

export const create_invitation_remote = form(
  InvitationSchema.create,
  async (input, issue) => {
    const res = await InvitationService.create(input);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const cancel_invitation_remote = command(
  z.uuid(), //
  async (invitation_id) => {
    const res = await InvitationService.cancel(invitation_id);

    return res;
  },
);

export const accept_invitation_remote = command(
  z.uuid(), //
  async (invitation_id) => {
    const res = await InvitationService.accept(invitation_id);

    return res;
  },
);
