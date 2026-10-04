import { ORGANIZATION } from "#lib/const/auth/organization.const.js";
import { guarded_command, ORG } from "#lib/server/remote/guarded.js";
import { MemberService } from "#lib/server/services/auth/organization/member.services.js";
import { z } from "zod";

export const remove_member_remote = guarded_command(
  { ...ORG, session: { org_permissions: { member: ["delete"] } } },
  // Better-Auth also takes an email, but the client's optimistic update keys on the id.
  z.uuid(),
  async (member_id) => MemberService.remove(member_id),
);

export const update_member_role_remote = guarded_command(
  { ...ORG, session: { org_permissions: { member: ["update"] } } },
  z.object({ member_id: z.uuid(), role: z.enum(ORGANIZATION.ROLES.IDS) }),
  async (input, { org_id }) => MemberService.update_role({ ...input, org_id }),
);
