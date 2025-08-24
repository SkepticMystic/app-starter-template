import { BetterAuthClient } from "$lib/auth-client";
import {
  ORGANIZATION,
  type IOrganization,
} from "$lib/const/organization.const";
import { err, suc } from "$lib/utils/result.util";
import { Client } from "./index.client";

export const MembersClient = {
  update_member_role: (
    target_member_id: string,
    target_role_id: IOrganization.RoleId,
  ) =>
    Client.request(
      async () => {
        if (
          !confirm(
            `Are you sure you want to update this member's role to ${ORGANIZATION.ROLES.MAP[target_role_id].name}?`,
          )
        ) {
          return err();
        }

        const members = await BetterAuthClient.organization.listMembers();
        if (!members.data) {
          return err(
            members.error?.message ??
              "Failed to fetch members. Please try again.",
          );
        }

        const target_member = members.data.members.find(
          (m) => m.id === target_member_id,
        );
        if (!target_member) {
          return err("Member not found");
        } else if (
          target_role_id !== "owner" &&
          target_member.role === "owner" &&
          !members.data.members.some(
            (m) => m.id !== target_member_id && m.role === "owner",
          )
        ) {
          return err("Organization must have at least one owner.");
        }

        const res = await BetterAuthClient.organization.updateMemberRole({
          role: target_role_id,
          memberId: target_member_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to update member role:", res.error);
          return err(
            res.error?.message ??
              "Failed to update member role. Please try again.",
          );
        }
      },
      { toast: { suc: "Member role updated successfully." } },
    ),

  // TODO: Report a bug on better-auth orgs
  // - Owner A invited member B
  // - Member B tried to remove Owner A
  // - The error says: "You cannot leave the organization as the only owner"
  // - But it should be a permission error, since B is not an owner

  remove_member: (member_id: string) =>
    Client.request(
      async () => {
        if (!confirm(`Are you sure you want to remove this member?`)) {
          return err();
        }

        const res = await BetterAuthClient.organization.removeMember({
          memberIdOrEmail: member_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to remove member:", res.error);
          return err(
            res.error?.message ?? "Failed to remove member. Please try again.",
          );
        }
      },
      { toast: { suc: "Member removed successfully." } },
    ),
};
