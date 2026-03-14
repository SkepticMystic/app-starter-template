import { command } from "$app/server";
import { MemberService } from "$lib/server/services/auth/organization/member.services";
import z from "zod";

export const remove_member_remote = command(
  z.uuid(), // NOTE: member_email is allowed by BA, but we enforce member_id for the optimistic update on the client
  async (member_id) => {
    const res = await MemberService.remove(member_id);

    return res;
  },
);
