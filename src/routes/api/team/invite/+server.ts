import { Users } from "$lib/auth/lucia";
import { ROLES } from "$lib/auth/roles";
import { get_user } from "$lib/auth/server";
import { OTP } from "$lib/models/OTPs";
import { Parsers } from "$lib/schema/parsers";
import { Roles } from "$lib/utils/roles";
import { error, json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, request, url }) => {
  const [user, invite] = await Promise.all([
    get_user(locals),
    Parsers.request(
      request,
      z.object({ role: z.enum(ROLES), email: z.string().email() }),
    ),
  ]);

  const members = await Users.find({ team_id: user.team_id }).lean();
  if (members.some((m) => m.email === invite.email)) {
    error(400, invite.email + " is already a member of this team");
  } else if (!Roles.has_atleast(user, invite.role)) {
    error(403, "You cannot invite someone with a higher role than you");
  }

  await OTP.handleLinks["team-invite"]({
    idValue: invite.email,
    data: { role: invite.role, team_id: user.team_id, createdBy: user.userId },
  });

  return json({ ok: true });
};
